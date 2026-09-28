#!/usr/bin/env node
/* THE LOCK ON MAIN — is it still on?
   The owner, 2026-09-24: "cybersecurity should be key always."

   docs/SECURITY.md §3 step 1 — a ruleset on `main` — was written on 2026-09-21 as the first thing to do,
   and it sat undone for three days because nothing read the live setting; every document said what
   SHOULD be on. It went on that day (ruleset `main-lock`). This reads GitHub's live answer for the
   branch, so the day it is switched off or weakened, a check goes red on every push and every PR.

   Run:  node test/protect.js                  live: GET /repos/<repo>/rules/branches/main
         node test/protect.js --rules <file>   judge a saved answer instead (how a plant is run)
         node test/protect.js --selftest       the red cases, on fixtures, no network

   In CI the live read is its own workflow, `.github/workflows/protect.yml` (job `protection`): on every
   pull request, on every push to main, and ONCE A DAY — because a lock switched off on a quiet day would
   otherwise stay unnoticed until the next push, and a push through an open lock is the harm, not the
   warning. It is deliberately NOT a required check: a GitHub API hiccup must not be able to block the
   owner's merges. The self-test runs inside `smoke`, which is required, because it needs no network.

   WHAT THIS CANNOT SEE, said once and plainly (Zeni's review, 2026-09-24):
   - The bypass list. It is not shown to a reader without admin rights, and the rules endpoint does
     not return it. An empty bypass list is checked by the owner in Settings → Rules, and by nothing here.
   - An edit to ITSELF. A pull request runs its own copy of this file, fixtures and all, so a PR that
     weakens judge() and deletes the matching case stays green, and after merge main runs the weak copy.
     What stands between is a person reading the diff; the rule that would make GitHub insist on it is
     "Require review from Code Owners" (docs/SECURITY.md §3 step 4), not yet switched on.
   - What the required job RUNS. It reads the first job's name in ci.yml and checks main waits for that
     name from GitHub Actions. A job of the same name that runs nothing would satisfy both GitHub and this.
   - Any branch but main. */
const fs = require('fs');
const path = require('path');

/* GitHub Actions' own app id. Read off this repository's check runs on 2026-09-24 (`smoke`, app
   `github-actions`, 15368), not assumed. Pinning the required check to it is what stops anything with
   a write token from reporting `smoke = success` by itself (docs/SECURITY.md §3). */
const ACTIONS_APP = 15368;

/* The check main must wait for is the first job in ci.yml — today `smoke`, the one that runs every
   suite (that it still does is a person's reading of ci.yml, not this file's). Its name is READ from ci.yml,
   never typed here: rename the job and the ruleset waits for a check that never reports, and a guard
   holding its own copy of the name would stay green while that happened (the guard skill, "it
   supplies its own inputs"). */
function requiredJob(root) {
  let src;
  try { src = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8'); } catch (e) { return null; }
  const m = src.match(/^jobs:\s*\n(?:\s*#.*\n)*\s+([A-Za-z0-9_-]+):/m);
  return m ? m[1] : null;
}

function judge(rules, job) {
  const P = [];
  const say = s => P.push(s);
  if (!Array.isArray(rules)) {
    say('GitHub did not answer with a list of rules for main, so this check cannot tell a protected main from a bare one — that is a red, not a pass');
    return P;
  }
  if (!job) {
    say('could not read the first job in .github/workflows/ci.yml, so this check does not know which CI check main must wait for — that is a red, not a pass');
    return P;
  }
  if (!rules.length) {
    say('main has no protection at all: anyone with write access can push straight to it, rewrite it or delete it, and nothing waits for CI. Switch it back on — docs/SECURITY.md §3 step 1');
    return P;
  }
  const of = t => rules.filter(r => r && r.type === t);
  if (!of('deletion').length) say('main can be deleted — the "restrict deletions" rule is gone');
  if (!of('non_fast_forward').length) say('main can be force-pushed, so its history can be rewritten — the "block force pushes" rule is gone');
  const pr = of('pull_request');
  /* The one-human trap (docs/SECURITY.md §3): every PR here is authored under the owner's account and
     GitHub will not let him approve his own. So the lock — the ruleset with NO bypass — must ask for no
     approval and no code owner's review. The plan's step 4 adds a SECOND ruleset that asks for both and
     carries the owner as bypass; that is not a lockout, and this cannot see bypass lists to tell the two
     apart. So the question it can answer is: is there still a pull-request rule that asks for no review?
     If every one of them asks, the lock's own rule was raised. */
  const asksNoReview = r => { const q = r.parameters || {}; return ((q.required_approving_review_count | 0) === 0) && q.require_code_owner_review !== true; };
  if (!pr.length) say('a change can reach main without a pull request — the "require a pull request" rule is gone');
  else if (!pr.some(asksNoReview))
    say('every pull-request rule on main now asks for an approving review or a code owner\'s. Every PR here is authored under the owner\'s account and GitHub will not let him approve his own, so unless each of those rules carries him as a bypass, he is locked out of every merge — docs/SECURITY.md §3, "the one-human trap". The lock itself (main-lock) is meant to ask for none');
  const sc = of('required_status_checks');
  if (!sc.length) { say('main no longer waits for CI — the "require status checks" rule is gone, so a red build can merge'); return P; }
  const checks = [].concat(...sc.map(r => ((r.parameters || {}).required_status_checks) || []));
  const mine = checks.filter(c => c && c.context === job);
  if (!mine.length)
    say('main waits for ' + (checks.length ? checks.map(c => '"' + c.context + '"').join(', ') : 'no check at all') + ' but not for "' + job + '", the first job in ci.yml — the one that runs every suite — so a red suite can merge');
  else if (!mine.some(c => c.integration_id === ACTIONS_APP))
    say('the "' + job + '" check main waits for is not pinned to GitHub Actions, so anything holding a write token could report it green by itself — docs/SECURITY.md §3');
  if (!sc.some(r => (r.parameters || {}).strict_required_status_checks_policy === true))
    say('main no longer requires a branch to be up to date before merging, so CI passes on each PR alone and never on what two of them make together');
  return P;
}

async function live(repo, token, get) {
  get = get || fetch;
  const url = 'https://api.github.com/repos/' + repo + '/rules/branches/main';
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'meridian-quest-protect' };
  /* In CI this is the workflow's own token, scoped to `contents: read` by protect.yml. Run by hand, it
     is whatever GITHUB_TOKEN your shell holds — still sent only to api.github.com, and never printed. */
  if (token) headers.Authorization = 'Bearer ' + token;
  let res = await get(url, { headers });
  /* The rules of a public repository are public. If the token is refused (a stand-in token in a
     container, a scope GitHub does not accept here), ask once without it — and if that fails too, red. */
  if ((res.status === 401 || res.status === 403) && headers.Authorization) {
    delete headers.Authorization;
    res = await get(url, { headers });
  }
  if (!res.ok) throw new Error('GitHub answered HTTP ' + res.status + ' for the rules of main');
  return res.json();
}

async function selftest() {
  const GOOD = [
    { type: 'deletion' },
    { type: 'non_fast_forward' },
    { type: 'pull_request', parameters: { required_approving_review_count: 0, require_code_owner_review: false } },
    { type: 'required_status_checks', parameters: { strict_required_status_checks_policy: true,
      required_status_checks: [{ context: 'smoke', integration_id: ACTIONS_APP }] } },
  ];
  /* docs/SECURITY.md §3 step 4, as written: a second ruleset, owner as bypass, asking for one approval and a code owner's */
  const STEP4 = { type: 'pull_request', parameters: { required_approving_review_count: 1, require_code_owner_review: true, require_last_push_approval: true } };
  const without = t => GOOD.filter(r => r.type !== t);
  const withParams = (t, p) => GOOD.map(r => r.type === t ? Object.assign({}, r, { parameters: Object.assign({}, r.parameters, p) }) : r);
  const cases = [
    ['the lock as it was switched on is green', GOOD, 'smoke', 0],
    ['an extra rule on top is still green', GOOD.concat([{ type: 'required_linear_history' }]), 'smoke', 0],
    ['the second ruleset the plan adds (step 4: one approval, code owners, owner as bypass) is still green', GOOD.concat([STEP4]), 'smoke', 0],
    ['no rules at all', [], 'smoke', 1],
    ['GitHub answered something that is not a list', { message: 'Not Found' }, 'smoke', 1],
    ['the CI job could not be read', GOOD, null, 1],
    ['deletion allowed', without('deletion'), 'smoke', 1],
    ['force-push allowed', without('non_fast_forward'), 'smoke', 1],
    ['no pull request required', without('pull_request'), 'smoke', 1],
    ['the lock asks for one approval — the owner is locked out', withParams('pull_request', { required_approving_review_count: 1 }), 'smoke', 1],
    ['the lock asks for a code owner\'s review — the owner is locked out', withParams('pull_request', { require_code_owner_review: true }), 'smoke', 1],
    ['the lock asks for an approval AND step 4 is on — no rule is left that asks for none', withParams('pull_request', { required_approving_review_count: 1 }).concat([STEP4]), 'smoke', 1],
    ['CI not required at all', without('required_status_checks'), 'smoke', 1],
    ['the required check is not pinned to GitHub Actions', withParams('required_status_checks', { required_status_checks: [{ context: 'smoke' }] }), 'smoke', 1],
    ['the required check is pinned to some other app', withParams('required_status_checks', { required_status_checks: [{ context: 'smoke', integration_id: 1 }] }), 'smoke', 1],
    ['up to date no longer required', withParams('required_status_checks', { strict_required_status_checks_policy: false }), 'smoke', 1],
    ['the CI job was renamed and the rule still names the old one', GOOD, 'build', 1],
  ];
  const bad = [];
  const mark = (ok, what, why) => { console.log((ok ? '  ok   ' : '  FAIL ') + what + (ok ? '' : '  (' + why + ')')); if (!ok) bad.push(what); };
  cases.forEach(([what, rules, job, want]) => {
    const got = judge(rules, job).length ? 1 : 0;
    mark(got === want, what, 'wanted ' + (want ? 'red' : 'green') + ', got ' + (got ? 'red' : 'green'));
  });

  /* The network half, with GitHub played by a stub that records every request. Zeni, 2026-09-24: the
     retry without a token had run in no test and in no recorded plant. */
  const answer = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });
  const stub = replies => { const calls = []; const get = async (url, o) => { calls.push({ url, auth: 'Authorization' in o.headers }); return replies[calls.length - 1] || answer(599, null); }; get.calls = calls; return get; };
  const onlyGitHub = calls => calls.every(c => c.url.indexOf('https://api.github.com/repos/') === 0);
  const netCases = [
    ['the token is accepted: one request, with the token, and the answer is read', [answer(200, GOOD)], 'tok', 'list', [true]],
    ['the token is refused (401): asked once more WITHOUT it, and that answer is read', [answer(401, null), answer(200, GOOD)], 'tok', 'list', [true, false]],
    ['the token is refused (403): the same', [answer(403, null), answer(200, GOOD)], 'tok', 'list', [true, false]],
    ['refused with the token and without it: red, naming the second answer', [answer(401, null), answer(403, null)], 'tok', 'HTTP 403', [true, false]],
    ['no token at all and refused: red, and not asked twice', [answer(403, null)], '', 'HTTP 403', [false]],
    ['not found: red, and a token is not thrown away over it', [answer(404, null)], 'tok', 'HTTP 404', [true]],
  ];
  for (const [what, replies, token, want, auths] of netCases) {
    const get = stub(replies);
    let got;
    try { const r = await live('rcguerrero29/meridian-quest', token, get); got = Array.isArray(r) ? 'list' : 'not a list'; }
    catch (e) { got = (e.message.match(/HTTP \d+/) || [e.message])[0]; }
    const sent = get.calls.map(c => c.auth);
    const ok = got === want && JSON.stringify(sent) === JSON.stringify(auths) && onlyGitHub(get.calls);
    mark(ok, what, 'wanted ' + want + ' with token ' + JSON.stringify(auths) + ', got ' + got + ' with token ' + JSON.stringify(sent) + (onlyGitHub(get.calls) ? '' : ', and a request left api.github.com'));
  }

  /* and the job name really is read from the file: this repository's own ci.yml must yield one */
  const job = requiredJob(path.join(__dirname, '..'));
  mark(!!job, job ? 'the job main must wait for, read from ci.yml: "' + job + '"' : 'ci.yml yields no job name', 'no job name');
  const total = cases.length + netCases.length + 1;
  if (bad.length) { console.log('FAIL — ' + bad.length + ' of ' + total); process.exit(1); }
  console.log('OK — ' + total + ' cases, on fixtures, no network.');
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--selftest')) return void selftest();
  const root = path.join(__dirname, '..');
  const job = requiredJob(root);
  const i = process.argv.indexOf('--rules');
  const report = rules => {
    const P = judge(rules, job);
    if (P.length) { console.log('FAIL'); P.forEach(p => console.log('- ' + p)); process.exit(1); }
    console.log('OK — main is locked: no deletion, no force-push, every change through a pull request, a pull-request rule that asks for no review (so the owner is not locked out), and "' + job + '" from GitHub Actions required on an up-to-date branch. (The bypass list is not visible to this check; the owner sees it in Settings → Rules.)');
    process.exit(0);
  };
  if (i > 0) {
    let rules;
    try { rules = JSON.parse(fs.readFileSync(process.argv[i + 1], 'utf8')); }
    catch (e) { console.log('FAIL\n- could not read the saved rules file (' + e.message + ') — that is a red, not a pass'); process.exit(1); }
    report(rules);
  } else {
    const repo = process.env.GITHUB_REPOSITORY || 'rcguerrero29/Taller_Quest';
    live(repo, process.env.GITHUB_TOKEN).then(report, e => {
      console.log('FAIL\n- could not read main\'s rules from GitHub (' + e.message + '), so this check cannot say main is protected — that is a red, not a pass');
      process.exit(1);
    });
  }
}

module.exports = { judge, requiredJob, live };
