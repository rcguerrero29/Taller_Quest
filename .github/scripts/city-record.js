/* The city record (#14 ❗El expediente — owner, 2026-09-07: "ok go for your recommendations"):
   `status.json` beside the deployed game, written by the deploy, never by the game. Version and
   permits, nothing more: the version is what a clerk needs to say "you are on mq-v105" without a
   token; the permits are the open pull requests the owner authored — number, title, whether the
   checks are green, whether it is mergeable. No asks (they live as issues, read live) and no
   branches (nobody asks about them). Five requests on a normal day: one for the list, one for
   each permit's checks and mergeability. Without a token (a local run) the permits are simply
   absent and the file says so. */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const cfg = fs.readFileSync(path.join(root, 'content', 'meridian', 'config.js'), 'utf8');
const deployed = (cfg.match(/GAMEV="(mq-v\d+)"/) || [])[1] || null;
const token = process.env.GITHUB_TOKEN, repo = process.env.REPO || 'rcguerrero29/meridian-quest', owner = process.env.OWNER || repo.split('/')[0];
const api = async (p) => {
  const r = await fetch('https://api.github.com' + p, { headers: { authorization: 'Bearer ' + token, accept: 'application/vnd.github+json', 'user-agent': 'meridian-city-record' } });
  if (!r.ok) throw new Error(p + ' → ' + r.status);
  return r.json();
};
(async () => {
  const rec = { v: 1, written: new Date().toISOString(), deployed, permits: [] };
  if (!token) { rec.note = 'no token: the permits were not read'; }
  else try {
    const open = (await api(`/repos/${repo}/pulls?state=open&per_page=50`)).filter(pr => pr.user && pr.user.login === owner);
    for (const pr of open) {
      const full = await api(`/repos/${repo}/pulls/${pr.number}`);
      const runs = (await api(`/repos/${repo}/commits/${pr.head.sha}/check-runs?per_page=50`)).check_runs || [];
      const green = runs.length > 0 && runs.every(c => c.status === 'completed' && c.conclusion === 'success');
      rec.permits.push({ n: pr.number, title: String(pr.title).slice(0, 120), green, mergeable: full.mergeable === true });
    }
  } catch (e) { rec.permits = []; rec.note = 'the permits could not be read: ' + (e.message || e); } /* the version still ships; a clerk says "open" instead of "green" */
  const out = path.join(process.env.OUT_DIR || root, 'status.json');
  fs.writeFileSync(out, JSON.stringify(rec, null, 1) + '\n');
  console.log('city record written: ' + out + ' — ' + deployed + ', ' + rec.permits.length + ' permit(s)' + (rec.note ? ' (' + rec.note + ')' : ''));
})().catch(e => { console.error(e.message || e); process.exit(1); });
