/* =====================================================================
   HOLLOWDEEP — THE LANTERN BELOW
   Story core: save state, scene runner, choices, input wiring.
   Classic script: shares the global lexical scope with the game engine.
   ===================================================================== */

const HD_SAVE_KEY = 'hollowdeep_story_v1';
const HD_VERSION = 1;
const HD_ROMAN = ['', 'I', 'II', 'III', 'IV'];
const HD_ENDINGS = { dawn: 'DAWN', ashes: 'ASHES', crown: 'THE CROWN', forgotten: 'FORGOTTEN' };

const CHAPTERS = {
  1: { name: 'WHAT THE MUD KEEPS', start: 1, end: 3, bossFloor: 3, boss: 'THE GRAVEKEEPER', intro: 'intro', outro: 'ch1_outro', next: 2 },
  2: { name: 'THE ROTTING SAINT', start: 4, end: 6, bossFloor: 6, boss: 'THE ROTTING SAINT', intro: 'ch2_intro', outro: 'ch2_outro', next: 3 },
  3: { name: 'THE EMBER CROWN', start: 7, end: 10, bossFloor: 10, boss: 'THE HOLLOW KING', intro: 'ch3_intro', outro: null, next: null }
};

const HD_UPGRADES = {
  vit:   { name: 'VITALITY',  desc: '+1 heart',         costs: [25, 45] },
  edge:  { name: 'EDGE',      desc: '+1 damage',        costs: [30, 55] },
  swift: { name: 'SWIFTNESS', desc: 'speed & recovery', costs: [25, 45] },
  lamp:  { name: 'LANTERN',   desc: 'stronger pulse',   costs: [30, 50] }
};

const HD_EVENTS = {
  1: { id: 'whisper', scene: 'ev_whisper', title: 'THE WHISPERING DOOR' },
  2: { id: 'puzzle', title: 'THE SEALED MEMORY' },
  4: { id: 'orin', scene: 'ev_orin', title: 'THE RESIN SCHOLAR' },
  5: { id: 'arena', title: 'HOLD THE LIGHT' },
  7: { id: 'witch', scene: 'ev_witch', title: 'THE EMBER WITCH' },
  8: { id: 'chase', title: 'THE COLLAPSE' },
  9: { id: 'mirror', scene: 'ev_mirror', title: 'THE MIRROR OF VEYRA' }
};

/* ------------------------------ state ------------------------------ */
function hdDefaultStory() {
  return {
    v: HD_VERSION, active: false, started: false, completed: false, cycle: 1,
    chapter: 1, floor: 1, checkpoint: { chapter: 1, floor: 1 },
    atCamp: false, campChapter: 1,
    hero: { h: 0, g: 'm' },
    flags: { trust: 0 },
    embers: 0,
    upgrades: { vit: 0, edge: 0, swift: 0, lamp: 0 },
    bonus: { hp: 0, dmg: 0 },
    shards: 0,
    lore: {}, people: {}, bestiary: {}, done: {}, seenBoss: {}, seenScenes: {},
    endings: {}, deaths: 0, kills: 0, startedAt: Date.now(), ending: null
  };
}

let STORY = hdDefaultStory();
let HD_BOSS_MOD = null;

function hdMergeStory(s) {
  const d = hdDefaultStory();
  if (!s || typeof s !== 'object') return d;
  const out = Object.assign(d, s);
  for (const k of ['flags', 'upgrades', 'bonus', 'lore', 'people', 'bestiary', 'done', 'seenBoss', 'seenScenes', 'endings', 'checkpoint']) {
    out[k] = Object.assign({}, d[k] || {}, s[k] || {});
  }
  out.hero = Object.assign({ h: 0, g: 'm' }, s.hero || {});
  out.chapter = Math.max(1, Math.min(3, +s.chapter || 1));
  out.floor = Math.max(1, Math.min(10, +s.floor || 1));
  out.checkpoint.chapter = Math.max(1, Math.min(3, +out.checkpoint.chapter || 1));
  out.checkpoint.floor = Math.max(1, Math.min(10, +out.checkpoint.floor || 1));
  return out;
}

function hdLoadStory() {
  try {
    const raw = localStorage.getItem(HD_SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.v) return null;
    return hdMergeStory(s);
  } catch (e) { return null; }
}

function hdSaveStory() {
  try {
    STORY.active = true;
    localStorage.setItem(HD_SAVE_KEY, JSON.stringify(STORY));
  } catch (e) {}
}

function hdClearStory() {
  try { localStorage.removeItem(HD_SAVE_KEY); } catch (e) {}
}

function hdNewStoryState(keepGallery) {
  const old = STORY || {};
  const gallery = keepGallery ? (old.endings || {}) : {};
  const cycle = keepGallery ? ((old.cycle || 1) + 1) : 1;
  STORY = hdDefaultStory();
  STORY.endings = Object.assign({}, gallery);
  STORY.cycle = cycle;
}

const hdOn = () => !!STORY.active;
const hdChapter = () => CHAPTERS[STORY.chapter] || CHAPTERS[1];
const hdIsBossFloor = f => !!(hdChapter().bossFloor === +f);
const hdEventForFloor = f => HD_EVENTS[+f] || null;
const hdFlag = k => !!(STORY.flags && STORY.flags[k]);
const hdSetFlag = (k, v) => { STORY.flags[k] = v === undefined ? true : v; hdSaveStory(); };
const hdAddTrust = n => { STORY.flags.trust = (STORY.flags.trust || 0) + n; };
const hdLore = id => { if (id) STORY.lore[id] = true; };
const hdPeople = id => { if (id) STORY.people[id] = true; };
const hdBest = id => { if (id) STORY.bestiary[id] = true; };
const hdEmbers = n => { STORY.embers = Math.max(0, (STORY.embers || 0) + n); };
const hdShard = () => { STORY.shards = Math.min(3, (STORY.shards || 0) + 1); hdSaveStory(); };
const hdHealHero = n => { if (ME && !ME.down) ME.hp = Math.min(ME.maxHp, ME.hp + n); };
const hdHurtHero = n => { if (ME && !ME.down) { ME.hp = Math.max(1, ME.hp - n); ME.inv = Math.max(ME.inv, 1.1); } };
const hdPermanentHp = n => { STORY.bonus.hp = (STORY.bonus.hp || 0) + n; if (ME) { ME.maxHp += n * 2; ME.hp += n * 2; } hdSaveStory(); };
const hdPermanentDmg = n => { STORY.bonus.dmg = (STORY.bonus.dmg || 0) + n; if (ME) ME.db += n; hdSaveStory(); };

const hdDawnReady = () => (STORY.flags.trust || 0) >= 2 && hdFlag('sparedGK') && hdFlag('orin') && !hdFlag('branded') && hdFlag('sawTruth') && STORY.shards >= 3;
const hdSecretReady = () => hdFlag('sawTruth') && hdFlag('orin') && STORY.shards >= 3;

function hdEndingCount() { return Object.keys(STORY.endings || {}).length; }

/* --------------------------- story helpers -------------------------- */
function hdHeroKey() {
  const h = Math.max(0, Math.min(CL.length - 1, (STORY.hero && STORY.hero.h) | 0));
  const g = STORY.hero && STORY.hero.g === 'f' ? 'f' : 'm';
  return CL[h].spr + '_' + g;
}

function hdHeroName() {
  return CL[Math.max(0, Math.min(CL.length - 1, (STORY.hero && STORY.hero.h) | 0))].n;
}

function hdSaveCheckpoint(chapter, floor) {
  STORY.chapter = chapter;
  STORY.checkpoint = { chapter: chapter, floor: floor };
  hdSaveStory();
}

function hdApplyBonuses() {
  if (!ME) return;
  const u = STORY.upgrades || {};
  const b = STORY.bonus || {};
  const extra = (b.hp || 0) + (u.vit || 0) + (hdFlag('branded') ? 1 : 0);
  ME.maxHp = ME.cls.hp + extra * 2;
  ME.hp = ME.maxHp;
  ME.db = (u.edge || 0) + (b.dmg || 0) + (hdFlag('branded') ? 1 : 0);
  ME.spd = ME.cls.spd * (1 + (u.swift || 0) * 0.055);
  ME.cdm = Math.max(0.5, 1 - (u.swift || 0) * 0.045);
  STORY.light = 100;
  STORY.lightMax = 100;
}

/* ------------------------------ audio ------------------------------ */
function hdSfx(kind) {
  try {
    if (kind === 'bell') { play(880, .5, 'sine', .045, 120); play(1320, .6, 'triangle', .02, 80); }
    else if (kind === 'dark') { play(70, .7, 'sawtooth', .055, -25); }
    else if (kind === 'choice') { play(620, .07, 'triangle', .028, 140); }
    else if (kind === 'step') { play(440, .05, 'triangle', .02, 80); }
    else if (kind === 'wrong') { play(130, .2, 'sawtooth', .05, -50); }
    else if (kind === 'pulse') { play(180, .4, 'sine', .075, 620); play(90, .5, 'triangle', .04, 200); }
    else if (kind === 'shard') { play(1040, .3, 'sine', .05, 400); play(1560, .55, 'triangle', .025, -160); }
    else if (kind === 'camp') { play(330, .2, 'triangle', .03, 110); }
  } catch (e) {}
}

/* =====================================================================
   CUTSCENE THEATER
   ===================================================================== */
const CINE = {
  active: false, id: '', lines: [], idx: 0, labels: {}, bg: 'void', actors: [], fx: '',
  t: 0, parts: [], typing: false, full: '', shown: 0, revealT: 0,
  choice: null, choiceSel: 0, capT: 0, capAuto: 0, capOn: false,
  prevMode: 'menu', ovWasOpen: false, onDone: null, nextScene: null,
  skipOk: true, flash: 0, shake: 0, last: 0
};

const cEl = id => document.getElementById(id);

function hdSceneDef(def) {
  if (!def) return null;
  return Array.isArray(def) ? { lines: def } : def;
}

function hdPlayScene(id, onDone) {
  const def = hdSceneDef(SCENES[id]);
  if (!def) { try { console.warn('[story] missing scene', id); } catch (e) {} if (onDone) onDone(); return; }
  netClose();
  CINE.active = true;
  CINE.id = id;
  CINE.lines = def.lines;
  CINE.idx = 0;
  CINE.labels = {};
  def.lines.forEach((e, i) => { if (e && e.label) CINE.labels[e.label] = i; });
  CINE.bg = def.bg || 'void';
  CINE.actors = def.actors ? def.actors.slice() : [];
  CINE.fx = def.fx || 'dust';
  CINE.t = 0;
  CINE.parts = [];
  CINE.choice = null;
  CINE.choiceSel = 0;
  CINE.capOn = false;
  CINE.capT = 0;
  CINE.capAuto = 0;
  CINE.typing = false;
  CINE.onDone = onDone || null;
  CINE.nextScene = def.next || null;
  CINE.skipOk = def.skip !== false && !def.lines.some(e => e && e.choice);
  CINE.prevMode = (mode === 'play') ? 'play' : 'menu';
  CINE.ovWasOpen = !ov.classList.contains('h');
  CINE.last = 0;
  CINE.flash = 0;
  if (CINE.prevMode === 'play') mode = 'menu';
  ov.classList.add('h');
  cEl('cine').classList.remove('h');
  cEl('cDlg').classList.remove('show');
  cEl('cCap').classList.remove('show');
  cEl('cSkip').classList.toggle('dim', !CINE.skipOk);
  hdCineEnter(0);
}

function hdCineEnter(i) {
  let guard = 0;
  while (guard++ < 400) {
    if (i >= CINE.lines.length) { hdCineFinish(); return; }
    const e = CINE.lines[i];
    if (!e) { i++; continue; }
    if (e.if && !e.if()) { i++; continue; }
    if (e.label) { CINE.labels[e.label] = i; i++; continue; }
    if (e.jump !== undefined) {
      const j = CINE.labels[e.jump];
      i = (j === undefined) ? i + 1 : j;
      continue;
    }
    if (e.bg) CINE.bg = e.bg;
    if (e.actors) CINE.actors = e.actors.slice();
    if (e.fx !== undefined) { CINE.fx = e.fx; CINE.parts = []; }
    if (e.flash) CINE.flash = Math.max(CINE.flash, e.flash);
    if (e.shake) CINE.shake = Math.max(CINE.shake, e.shake);
    if (e.sfx) hdSfx(e.sfx);
    if (e.do) { try { e.do(); } catch (err) { console.warn(err); } }

    if (e.cap !== undefined) {
      hdShowCap(e);
      CINE.idx = i + 1;
      return;
    }
    if (e.choice && e.choice.length) {
      hdShowChoices(e.choice, i);
      return;
    }
    if (e.text !== undefined && e.text !== null) {
      hdShowLine(e, i);
      return;
    }
    i++;
  }
  hdCineFinish();
}

function hdShowCap(e) {
  CINE.capOn = true;
  CINE.capT = 0;
  CINE.capAuto = e.auto || 0;
  CINE.typing = false;
  CINE.choice = null;
  const cap = cEl('cCap');
  cap.querySelector('.cCapK').textContent = e.kicker || '';
  cap.querySelector('.cCapT').textContent = e.cap || '';
  cap.querySelector('.cCapS').textContent = e.sub || '';
  cap.classList.add('show');
  cEl('cDlg').classList.remove('show');
  cEl('cChoices').innerHTML = '';
  hdSfx('bell');
}

function hdShowLine(e, i) {
  CINE.capOn = false;
  CINE.capAuto = 0;
  cEl('cCap').classList.remove('show');
  CINE.idx = i + 1;
  CINE.full = String(e.text || '');
  CINE.shown = 0;
  CINE.typing = true;
  CINE.revealT = 0;
  CINE.choice = null;
  hdSpeaker(e.who, e.color);
  cEl('cDlg').classList.add('show');
  cEl('cChoices').innerHTML = '';
  cEl('cText').textContent = '';
  cEl('cNext').classList.remove('show');
  hdSfx('step');
}

const HD_SPEAKERS = {
  MARA: '#9fd3ff', ORIN: '#ffd98a', GRAVEKEEPER: '#c7a17a', 'THE GRAVEKEEPER': '#c7a17a',
  'EMBER WITCH': '#ff8a6b', AUREL: '#c78bff', 'THE HOLLOW KING': '#c78bff',
  'THE SAINT': '#9ee6ae', 'THE DOOR': '#d87867', NARRATOR: '#8f84a8', YOU: '#f2e6c9'
};

function hdSpeaker(who, color) {
  const w = cEl('cWho');
  if (!who || who === 'NARRATOR') {
    w.textContent = who === 'NARRATOR' ? '— — —' : '';
    w.style.color = '#8f84a8';
  } else {
    w.textContent = (typeof hdTr === 'function') ? hdTr(who) : who;
    w.style.color = color || HD_SPEAKERS[who] || '#ffd98a';
  }
}

function hdShowChoices(opts, i) {
  CINE.capOn = false;
  cEl('cCap').classList.remove('show');
  CINE.idx = i + 1;
  CINE.typing = false;
  CINE.choice = opts;
  CINE.choiceSel = 0;
  cEl('cDlg').classList.add('show');
  cEl('cNext').classList.remove('show');
  const box = cEl('cChoices');
  box.innerHTML = '';
  opts.forEach((o, j) => {
    const locked = typeof o.locked === 'function' ? !!o.locked() : !!o.locked;
    const b = document.createElement('button');
    b.className = 'cbtn' + (locked ? ' locked' : '') + (j === 0 ? ' on' : '');
    b.type = 'button';
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(j + 1) + '.';
    b.appendChild(num);
    b.appendChild(document.createTextNode(o.t || '...'));
    if (o.hint) {
      const h = document.createElement('span');
      h.className = 'hint';
      h.textContent = o.hint;
      b.appendChild(h);
    }
    if (typeof o.locked === 'function' && locked && o.lockHint) {
      const h2 = document.createElement('span');
      h2.className = 'hint';
      h2.textContent = o.lockHint;
      b.appendChild(h2);
    }
    b.addEventListener('click', ev => { ev.stopPropagation(); if (!locked) hdChoose(j); });
    box.appendChild(b);
  });
  hdSfx('choice');
}

function hdChoose(j) {
  const opts = CINE.choice;
  if (!opts || !opts[j]) return;
  const o = opts[j];
  const locked = typeof o.locked === 'function' ? !!o.locked() : !!o.locked;
  if (locked) { hdSfx('wrong'); return; }
  CINE.choice = null;
  cEl('cChoices').innerHTML = '';
  hdSfx('choice');
  try {
    if (o.do) o.do();
    if (o.set) for (const k in o.set) STORY.flags[k] = o.set[k];
    if (o.trust) hdAddTrust(o.trust);
    if (o.embers) hdEmbers(o.embers);
    if (o.lore) (Array.isArray(o.lore) ? o.lore : [o.lore]).forEach(hdLore);
    if (o.people) (Array.isArray(o.people) ? o.people : [o.people]).forEach(hdPeople);
    if (o.shard) hdShard();
    if (o.bonus) {
      if (o.bonus.hp) hdPermanentHp(o.bonus.hp);
      if (o.bonus.dmg) hdPermanentDmg(o.bonus.dmg);
    }
  } catch (err) { console.warn(err); }
  if (o.next) CINE.nextScene = o.next;
  hdSaveStory();
  if (o.jump !== undefined) {
    const target = CINE.labels[o.jump];
    hdCineEnter(target === undefined ? CINE.idx : target);
  } else {
    hdCineEnter(CINE.idx);
  }
}

function hdAdvance() {
  if (!CINE.active) return;
  if (CINE.choice) return;
  if (CINE.capOn) {
    CINE.capOn = false;
    cEl('cCap').classList.remove('show');
    hdCineEnter(CINE.idx);
    return;
  }
  if (CINE.typing) {
    CINE.shown = CINE.full.length;
    CINE.typing = false;
    cEl('cText').textContent = CINE.full;
    cEl('cNext').classList.add('show');
    return;
  }
  hdCineEnter(CINE.idx);
}

function hdSkipScene() {
  if (!CINE.active) return;
  if (!CINE.skipOk) { hdSfx('wrong'); return; }
  hdCineFinish();
}

function hdCineFinish() {
  const next = CINE.nextScene;
  const done = CINE.onDone;
  CINE.active = false;
  CINE.nextScene = null;
  CINE.onDone = null;
  cEl('cine').classList.add('h');
  cEl('cChoices').innerHTML = '';
  if (CINE.ovWasOpen) ov.classList.remove('h');
  mode = CINE.prevMode;
  if (next) hdPlayScene(next, done);
  else if (done) { try { done(); } catch (err) { console.warn(err); } }
}

function hdCineKey(e) {
  if (!CINE.active) return false;
  const k = (e.key || '').toLowerCase();
  if (k === 'escape') { e.preventDefault(); hdSkipScene(); return true; }
  if (k === ' ' || k === 'enter') { e.preventDefault(); if (CINE.choice) hdChoose(CINE.choiceSel); else hdAdvance(); return true; }
  if (CINE.choice) {
    if (k === 'arrowup' || k === 'w') {
      e.preventDefault();
      CINE.choiceSel = (CINE.choiceSel + CINE.choice.length - 1) % CINE.choice.length;
      hdChoiceHighlight(); return true;
    }
    if (k === 'arrowdown' || k === 's') {
      e.preventDefault();
      CINE.choiceSel = (CINE.choiceSel + 1) % CINE.choice.length;
      hdChoiceHighlight(); return true;
    }
    if (k >= '1' && k <= '9') {
      const n = +k - 1;
      if (n < CINE.choice.length) { e.preventDefault(); hdChoose(n); return true; }
    }
  }
  return false;
}

function hdChoiceHighlight() {
  const bs = [...cEl('cChoices').querySelectorAll('.cbtn')];
  bs.forEach((b, j) => b.classList.toggle('on', j === CINE.choiceSel));
}

/* --------------------------- cutscene UI wiring --------------------------- */
cEl('cSkip').addEventListener('click', e => { e.stopPropagation(); hdSkipScene(); });
cEl('cine').addEventListener('click', e => {
  if (e.target.closest && (e.target.closest('.cbtn') || e.target.closest('.cSkip'))) return;
  hdAdvance();
});
addEventListener('keydown', e => {
  if (!CINE.active) return;
  if (hdCineKey(e)) { e.stopPropagation(); }
}, true);

/* ------------------------------ scene helpers ------------------------------ */
const HD_L = (who, text, extra) => Object.assign({ who: who, text: text }, extra || {});
const HD_CAP = (cap, sub, auto, kicker) => ({ cap: cap, sub: sub || '', auto: auto || 0, kicker: kicker || '' });
const HD_OPT = (t, extra) => Object.assign({ t: t }, extra || {});
const HD_CH = (...opts) => ({ choice: opts });
