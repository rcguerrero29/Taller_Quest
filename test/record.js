/* The city record is what a clerk can read: the shape of status.json (#14). Run after
   .github/scripts/city-record.js, in the deploy and by hand. */
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.resolve(__dirname, '..', 'status.json');
const fails = [];
let rec = null;
try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { fails.push('status.json is missing or not JSON: ' + e.message); }
if (rec) {
  if (rec.v !== 1) fails.push('v is not 1');
  if (isNaN(Date.parse(rec.written))) fails.push('written is not a date');
  const cfg = fs.readFileSync(path.resolve(__dirname, '..', 'content', 'meridian', 'config.js'), 'utf8');
  const gv = (cfg.match(/GAMEV="(mq-v\d+)"/) || [])[1];
  if (rec.deployed !== gv) fails.push(`deployed is ${rec.deployed}, the game says ${gv}`);
  if (!Array.isArray(rec.permits)) fails.push('permits is not a list');
  else rec.permits.forEach(p => { if (!Number.isInteger(p.n) || typeof p.title !== 'string' || typeof p.green !== 'boolean' || typeof p.mergeable !== 'boolean') fails.push('a permit is missing n, title, green or mergeable: ' + JSON.stringify(p)); });
  const extra = Object.keys(rec).filter(k => !['v', 'written', 'deployed', 'permits', 'note'].includes(k));
  if (extra.length) fails.push('the record carries more than it should: ' + extra.join(', ') + ' (asks live as issues; branches nobody asks about)');
}
if (fails.length) { console.log('FAIL'); fails.forEach(f => console.log('- ' + f)); process.exit(1); }
console.log(`OK — the city record says ${rec.deployed}, ${rec.permits.length} permit(s), written ${rec.written}.`);
