const fs = require('fs');
const files = ['story.js', 'story_cine.js', 'story_scenes.js', 'story_play.js', 'story_ui.js', 'story_render.js'];
const all = [];
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  const re = /(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g;
  let m;
  while ((m = re.exec(c))) {
    const s = m[2];
    if (!/[A-Za-z]/.test(s) || s.length <= 2) continue;
    const line = c.slice(0, m.index).split('\n').length;
    if (/\s/.test(s) || /^[A-Z][A-Z0-9 '!?.,:;-]{3,}$/.test(s)) all.push([f, line, s]);
  }
}
const uniq = [...new Set(all.map(x => x[2]))];
fs.writeFileSync('_strings.txt', all.map(x => x[0] + ':' + x[1] + '\t' + x[2]).join('\n'));
fs.writeFileSync('_strings_uniq.txt', uniq.join('\n'));
console.log('total', all.length, 'unique', uniq.length);
