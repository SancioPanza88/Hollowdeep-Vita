/* =====================================================================
   HOLLOWDEEP — IT / EN language layer
   - Persists the chosen language.
   - Translates menus, journal, camp and dialogue.
   - Translates canvas text and cutscene lines.
   ===================================================================== */

let HD_LANG = (typeof hdLangPref === 'function' ? hdLangPref() : 'en');

window.HD_T = function (en, it) {
  return HD_LANG === 'it' ? it : en;
};
window.hdLang = function () { return HD_LANG; };

/* ------------------------------ lookup ------------------------------ */
function hdTrCore(core) {
  if (!core) return null;
  const hit = HD_IT[core];
  if (hit !== undefined) return hit;
  if (typeof HD_IT_RULES !== 'undefined') {
    for (let i = 0; i < HD_IT_RULES.length; i++) {
      const rule = HD_IT_RULES[i];
      const m = core.match(rule[0]);
      if (m) {
        const out = rule[1](m);
        if (out !== null && out !== undefined) return out;
      }
    }
  }
  return null;
}

function hdTr(s) {
  if (HD_LANG !== 'it' || s === null || s === undefined) return s;
  if (typeof s !== 'string') return s;
  if (!s.trim()) return s;

  const lead = (s.match(/^\s*/) || [''])[0];
  const trail = (s.match(/\s*$/) || [''])[0];
  const core = s.slice(lead.length, s.length - trail.length);
  if (!core) return s;

  let out = hdTrCore(core);
  if (out !== null) return lead + out + trail;

  // Multi-line strings: translate each line on its own.
  if (core.indexOf('\n') >= 0) {
    let any = false;
    const lines = core.split('\n').map(line => {
      const l = (line.match(/^\s*/) || [''])[0];
      const r = (line.match(/\s*$/) || [''])[0];
      const mid = line.slice(l.length, line.length - r.length);
      if (!mid) return line;
      const t = hdTrCore(mid);
      if (t !== null) { any = true; return l + t + r; }
      return line;
    });
    if (any) return lead + lines.join('\n') + trail;
  }

  // Sentence-level fallback for composed paragraphs.
  if (/[.!?]\s+/.test(core)) {
    let any = false;
    const parts = core.split(/(?<=[.!?])\s+/).map(part => {
      const t = hdTrCore(part);
      if (t !== null) { any = true; return t; }
      return part;
    });
    if (any) return lead + parts.join(' ') + trail;
  }

  return s;
}
window.hdTr = hdTr;

/* --------------------------- DOM translation --------------------------- */
const HD_SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
const HD_SKIP_CLASS = { logo: 1, langSwitch: 1, mnLogo: 1 };

function hdTrNode(node) {
  const el = node.parentElement;
  if (!el) return;
  if (HD_SKIP_TAGS[el.tagName]) return;
  if (el.closest && el.closest('.langSwitch,.mnLogo,.logo')) return;
  const raw = node.nodeValue;
  if (!raw || !raw.trim()) return;
  const out = hdTr(raw);
  if (out !== raw && out !== null && out !== undefined) node.nodeValue = out;
}

function hdTranslateDom(root) {
  if (HD_LANG !== 'it' || !root) return;
  if (root.nodeType === 3) { hdTrNode(root); return; }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) hdTrNode(n);
  const attrs = root.querySelectorAll ? root.querySelectorAll('[title],[placeholder],[aria-label]') : [];
  for (const el of attrs) {
    for (const a of ['title', 'placeholder', 'aria-label']) {
      const v = el.getAttribute(a);
      if (!v || !v.trim()) continue;
      if (el.classList && el.classList.contains('langBtn')) continue;
      const t = hdTr(v);
      if (t !== null && t !== undefined && t !== v) el.setAttribute(a, t);
    }
  }
}
window.hdTranslateDom = hdTranslateDom;

/* --------------------------- language switch --------------------------- */
function hdSetLang(lang) {
  if (lang !== 'it' && lang !== 'en') return;
  if (lang === HD_LANG) return;
  HD_LANG = lang;
  try { localStorage.setItem('hollowdeep_lang_v1', lang); } catch (e) {}
  try { document.documentElement.lang = lang; } catch (e) {}
  try { if (typeof play === 'function') play(620, .06, 'triangle', .03, 120); } catch (e) {}

  // Rebuild the current screen so its direct bilingual labels update too.
  try {
    if (typeof ui === 'function' && typeof scr === 'string' && scr) {
      const isJoin = scr === 'join';
      const codeEl = isJoin ? document.getElementById('code') : null;
      const codeVal = codeEl ? codeEl.value : '';
      ui(scr, 1);
      if (isJoin) {
        const next = document.getElementById('code');
        if (next) next.value = codeVal;
      }
    }
  } catch (e) {}

  // Static cutscene chrome.
  const skip = document.getElementById('cSkip');
  if (skip) skip.innerHTML = HD_T('SKIP ▸', 'SALTA ▸');

  // Live cutscene text (only if the language switch is reachable).
  if (typeof CINE !== 'undefined' && CINE.active) hdRefreshCine();
  hdTranslateDom(document.getElementById('ov'));
}
window.hdSetLang = hdSetLang;

/* --------------------------- cutscene wrappers --------------------------- */
function hdTrLine(e, keys) {
  const o = Object.assign({}, e);
  keys.forEach(k => { if (o[k] !== undefined && o[k] !== null) o[k] = hdTr(o[k]); });
  return o;
}

const _hdShowCap = hdShowCap;
hdShowCap = function (e) {
  return _hdShowCap(hdTrLine(e, ['kicker', 'cap', 'sub']));
};

const _hdShowLine = hdShowLine;
hdShowLine = function (e, i) {
  return _hdShowLine(hdTrLine(e, ['text']), i);
};

const _hdShowChoices = hdShowChoices;
hdShowChoices = function (opts, i) {
  const translated = (opts || []).map(o => hdTrLine(o, ['t', 'hint', 'lockHint']));
  return _hdShowChoices(translated, i);
};

// Keeps a copy of the current line so a language switch can refresh it.
const _hdCineEnter = hdCineEnter;
hdCineEnter = function (i) {
  const r = _hdCineEnter(i);
  return r;
};

function hdRefreshCine() {
  try {
    const textEl = document.getElementById('cText');
    const capEl = document.getElementById('cCap');
    if (capEl && capEl.classList.contains('show')) {
      const capT = capEl.querySelector('.cCapT');
      const capK = capEl.querySelector('.cCapK');
      const capS = capEl.querySelector('.cCapS');
      if (capT) capT.textContent = hdTr(capT.textContent);
      if (capK) capK.textContent = hdTr(capK.textContent);
      if (capS) capS.textContent = hdTr(capS.textContent);
    }
    if (textEl && textEl.textContent) {
      // CINE.full is already translated in the active language; re-translate
      // from the scene source when possible.
      const e = CINE.lines[CINE.idx - 1];
      if (e && e.text !== undefined) {
        CINE.full = hdTr(e.text);
        if (!CINE.typing) textEl.textContent = CINE.full;
      }
    }
  } catch (err) {}
}

/* --------------------------- canvas translation --------------------------- */
const _hdTx = tx;
tx = function (s, x, y, c, al, sz) {
  return _hdTx(typeof s === 'string' ? hdTr(s) : s, x, y, c, al, sz);
};

const _hdBubble = bubble;
bubble = function (lines, x, y) {
  return _hdBubble((lines || []).map(l => [typeof l[0] === 'string' ? hdTr(l[0]) : l[0], l[1]]), x, y);
};

const _hdBanner = banner;
banner = function (a, b, l) {
  return _hdBanner(hdTr(a), hdTr(b), l);
};

const _hdObjective = hdObjective;
hdObjective = function () {
  const o = _hdObjective();
  if (!o) return o;
  return hdTrLine(o, ['t', 's', 'h']);
};

/* --------------------------- UI + observer --------------------------- */
const _hdUi = ui;
ui = function (name, keep) {
  const r = _hdUi(name, keep);
  hdTranslateDom(ov);
  return r;
};

let hdObsBusy = false;
const hdObserver = new MutationObserver(() => {
  if (hdObsBusy || HD_LANG !== 'it') return;
  hdObsBusy = true;
  requestAnimationFrame(() => {
    try { hdTranslateDom(ov); } catch (e) {}
    hdObsBusy = false;
  });
});

try {
  hdObserver.observe(ov, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label'] });
} catch (e) {}

/* --------------------------- boot --------------------------- */
try { document.documentElement.lang = HD_LANG; } catch (e) {}
try {
  const skip = document.getElementById('cSkip');
  if (skip) skip.innerHTML = HD_T('SKIP ▸', 'SALTA ▸');
} catch (e) {}

// hdBoot is queued from story_render.js, which loads before this file. If the
// timer already fired, the menu was built before HD_T existed: rebuild it now
// so the saved/browser language wins on the very first screen.
try {
  if (typeof scr === 'string' && scr === 'main' && typeof ui === 'function') ui('main', 1);
} catch (e) {}
