const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');
const start = c.indexOf('<script>', c.indexOf('</head>'));
const end = c.indexOf('<script src="story.js">');
const code = c.slice(start, end);
const re = /(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const out = [];
let m;
while ((m = re.exec(code))) {
  const s = m[2];
  if (!/[A-Za-z]/.test(s) || s.length <= 2) continue;
  if (!/\s/.test(s) && !/^[A-Z][A-Z0-9 '!?.,:;-]{3,}$/.test(s)) continue;
  if (/^[a-z-]+$/.test(s)) continue;
  if (/^(rgba?|linear-gradient|data:|https?:|[0-9])/.test(s)) continue;
  if (/px |cqw|font|monospace|animation|gradient/.test(s)) continue;
  const line = code.slice(0, m.index).split('\n').length;
  out.push([line, s]);
}
const uniq = [...new Set(out.map(x => x[1]))];
fs.writeFileSync('_engine_strings.txt', out.map(x => x[0] + '\t' + x[1]).join('\n'));
console.log('total', out.length, 'unique', uniq.length);
