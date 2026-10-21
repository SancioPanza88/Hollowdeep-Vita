/* Build the portable single-file release from index.html + story modules. */
const fs = require('fs');
const path = require('path');

const root = __dirname;
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const modules = [
  'story.js', 'story_cine.js', 'story_scenes.js', 'story_play.js', 'story_ui.js', 'story_render.js',
  'i18n_it.js', 'i18n_it_2.js', 'i18n_it_3.js', 'i18n_it_4.js', 'i18n_it_5.js', 'i18n_it_6.js',
  'i18n_it_rules.js', 'i18n.js'
];

for (const file of modules) {
  const tag = '<script src="' + file + '"></script>';
  if (!html.includes(tag)) throw new Error('missing script tag for ' + file);
  let code = fs.readFileSync(path.join(root, file), 'utf8');
  if (code.includes('</script>')) throw new Error('inline </script> found in ' + file);
  html = html.replace(tag, '<script>\n/* ===== ' + file + ' ===== */\n' + code + '\n</script>');
}

if (/src="(story_[^"]+|i18n[^"]*)\.js"/.test(html)) throw new Error('un-inlined runtime module remains');
if (html.includes('fonts.googleapis.com')) throw new Error('external font link remains');

const out = path.join(root, 'Hollowdeep.html');
fs.writeFileSync(out, html, 'utf8');
console.log('Wrote', out, (html.length / 1024).toFixed(1) + ' KB');
