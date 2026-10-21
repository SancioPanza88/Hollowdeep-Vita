/* =====================================================================
   THE LANTERN BELOW — gameplay layer
   Floor construction, story events, bosses, camp, endings, death/retry.
   ===================================================================== */

let HD_PENDING = null;
let HD_PULSE = { cd: 0, t: 0 };
let HD_AMB = { ch: 0 };
let HD_MARA = { x: 176, y: 120 };
let HD_SHARD_FX = 0;
let HD_DEATH_COUNTED = false;
let HD_END_SHOWN = false;
let HD_CAMP_MSG = '';
let HD_PRESS = {};

const HD_RUNE_POS = [
  { x: 92, y: 162 }, { x: 148, y: 162 }, { x: 204, y: 162 }, { x: 260, y: 162 }
];
const HD_RUNE_COL = ['#9fd3ff', '#ff8a3c', '#ffd34a', '#7dff9a'];
const HD_RUNE_NAME = ['MOON', 'FLAME', 'EYE', 'ROOT'];
const HD_ECHO_TITLE = {
  1: 'Hollow in the Mud', 2: 'The Sealed Step', 3: 'Grave-Iron',
  4: 'A Garden Under Glass', 5: 'The Last Procession', 6: 'Rot and Rain',
  7: 'The Furnace Door', 8: 'When the Roof Came Down', 9: 'A Room of Mirrors',
  10: 'The Name Below'
};
const HD_ECHO_TEXT = {
  1: 'A voice in the mud repeats a nursery rhyme. It is your voice, but younger. It does not know it is dead.',
  2: 'Someone counted the stairs as they drowned. They reached four hundred and nine. The count is still going.',
  3: 'A gravekeeper polishes a headstone with his sleeve. The name has been scratched out, then written again, then scratched out.',
  4: 'A woman presses flowers between the pages of a ledger. Every flower is labeled with a name. The ink is running.',
  5: 'A procession walks through a drowned street, holding candles above the water. Their reflections do not match.',
  6: 'A priest tells his congregation that the garden will keep them. The congregation has roots where their mouths should be.',
  7: 'A furnace roars. A boy feeds it letters, one by one. Each letter makes the fire say a different name.',
  8: 'The ceiling comes down. Someone is still laughing, because they thought the noise was applause.',
  9: 'A mirror remembers a family at dinner. The table is set for five. Only one chair is occupied.',
  10: 'A king sits on a throne of doors, listening. He has forgotten which side of the door he is on.'
};

/* ------------------------------ helpers ------------------------------ */
function hdChapterForFloor(f) {
  f = +f || 1;
  return f <= 3 ? 1 : f <= 6 ? 2 : 3;
}

function hdClampFloor(f) {
  return Math.max(1, Math.min(10, (+f || 1) | 0));
}

function hdSnapshotGear() {
  if (!ME) return;
  STORY.gear = {
    wp: ME.wp,
    coins: ME.coins || 0
  };
}

function hdRestoreGear() {
  if (!ME || !STORY.gear) return;
  const g = STORY.gear;
  if (g.wp && WS[g.wp]) ME.wp = g.wp;
  if (g.coins) ME.coins = g.coins;
}

function hdFloorBanner(f) {
  const ch = hdChapterForFloor(f);
  const c = CHAPTERS[ch];
  HD_AMB.ch = ch;
  try {
    banner('CHAPTER ' + HD_ROMAN[ch], c.name + ' · FLOOR ' + f + '/10', 3.4);
  } catch (e) {}
}

function hdFloorLore(f) {
  const map = {
    1: ['ashfall', 'hollow'], 2: ['veyra', 'seals'], 3: ['gk'],
    4: ['garden'], 5: ['garden', 'rot'], 6: ['saint'],
    7: ['forge'], 8: ['collapse'], 9: ['mirror'], 10: ['throne']
  };
  (map[f] || []).forEach(hdLore);
}

function hdDecorateFloor() {
  if (!G || !G.story || !G.dun) return;
  const cells = [...G.dun.values()];
  const ev = hdEventForFloor(G.floor);
  let evRoom = null;

  if (ev) {
    evRoom = cells.find(c => c.ladder) || null;
    if (evRoom) {
      evRoom.storyEv = ev;
      evRoom.storyEventDone = !!STORY.done[ev.id];
      evRoom.eventStarted = false;
      if (!evRoom.storyEventDone) evRoom.ladder = false;
      evRoom.echo = null;
    }
  }

  if (!STORY.done['echo' + G.floor]) {
    const pool = cells.filter(c => c !== evRoom && !c.boss && c.type !== 'start' && c.type !== 'treasure' && c.type !== 'shop');
    const fallback = cells.filter(c => c !== evRoom && !c.boss && c.type !== 'start');
    const ec = (pool.length ? pool : fallback)[Math.floor(Math.random() * Math.max(1, (pool.length ? pool : fallback).length))] || null;
    if (ec) ec.echo = { x: 176, y: 112, got: false };
  }

  const st = G.dun.get('0,0');
  if (st) st.storyStart = true;

  hdFloorLore(G.floor);
  HD_AMB.ch = hdChapterForFloor(G.floor);
  HD_MARA.x = 176 - 20;
  HD_MARA.y = 150 - 38;
  hdSaveStory();
}

/* --------------------------- scene / queue --------------------------- */
function hdQueueScene(id, done, delay) {
  HD_PENDING = { id: id, done: done || null, delay: Math.max(0, delay || 0) };
}

function hdSyncBossMod() {
  if (!G || !G.story) return;
  const b = ens.find(e => e.boss);
  if (!b) return;
  let mod = 1;
  if (G.floor === 3) {
    if (hdFlag('gkNamed')) mod = .65;
    else if (hdFlag('gkShown')) mod = .8;
  }
  if (G.floor === 6 && hdFlag('burnedFirst')) mod = .8;
  if (HD_BOSS_MOD && HD_BOSS_MOD.hp) mod = Math.min(mod, HD_BOSS_MOD.hp);
  if (G.floor === 10) mod = 1;
  const mh = Math.max(1, Math.round(b.mhp * mod));
  if (mh !== b.mhp) {
    b.mhp = mh;
    b.hp = Math.min(b.hp, mh);
  }
  b.title = G.floor === 3 ? 'THE GRAVEKEEPER' : G.floor === 6 ? 'THE ROTTING SAINT' : G.floor === 10 ? 'THE HOLLOW KING' : b.title;
}

/* ------------------------------ floor build ------------------------------ */
function hdBuildFloor(floor) {
  floor = hdClampFloor(floor);
  netClose();
  STORY.active = true;
  STORY.started = true;
  STORY.chapter = hdChapterForFloor(floor);
  STORY.floor = floor;
  STORY.checkpoint = { chapter: STORY.chapter, floor: floor };
  STORY.atCamp = false;
  HD_PENDING = null;
  HD_BOSS_MOD = null;
  HD_DEATH_COUNTED = false;
  HD_END_SHOWN = false;
  HD_SHARD_FX = 0;
  HD_CAMP_MSG = '';
  HD_PRESS = {};
  HD_PULSE.cd = 0;
  HD_PULSE.t = 0;

  const h = Math.max(0, Math.min(CL.length - 1, (STORY.hero && STORY.hero.h) | 0));
  const g = STORY.hero && STORY.hero.g === 'f' ? 'f' : 'm';
  sel = { i: h, g: g };

  PL = [mkP(0, h, g)];
  ME = PL[0];
  G = {
    floor: floor, kills: 0, msg: '', msgT: 0, pity: 0, clears: 0, lastHeart: 0,
    endless: false, won: false, ban: null, end: null, rec: false, dyT: 0, story: true
  };
  hdApplyBonuses();
  hdRestoreGear();
  newFloor();
  mode = 'play';
  ov.classList.add('h');
  keys.clear();
  atkBuf = 0;
  hdFloorBanner(floor);
  hdMoveMaraToMe();
  hdSaveStory();
}

function hdMoveMaraToMe() {
  if (!ME) return;
  HD_MARA.x = ME.x - 20;
  HD_MARA.y = ME.y - 38;
}

/* ------------------------------ story start ------------------------------ */
function hdBeginStory(skipIntro) {
  netClose();
  const prev = STORY || hdDefaultStory();
  const endings = Object.assign({}, prev.endings || {});
  const cycle = prev.completed ? ((prev.cycle || 1) + 1) : 1;

  STORY = hdDefaultStory();
  STORY.endings = endings;
  STORY.cycle = cycle;
  STORY.active = true;
  STORY.started = true;
  STORY.hero = { h: Math.max(0, Math.min(CL.length - 1, sel.i | 0)), g: sel.g === 'f' ? 'f' : 'm' };
  STORY.startedAt = Date.now();
  HD_PENDING = null;
  HD_BOSS_MOD = null;
  HD_DEATH_COUNTED = false;
  HD_END_SHOWN = false;
  HD_SHARD_FX = 0;
  HD_CAMP_MSG = '';
  HD_PULSE.cd = 0;
  HD_PULSE.t = 0;
  hdSaveStory();

  previewScene();
  G.ban = null;
  G.msgT = 0;
  mode = 'menu';

  if (skipIntro) {
    hdBuildFloor(1);
    return;
  }
  hdPlayScene('intro', () => {
    STORY.seenScenes.intro = true;
    hdPeople('mara');
    hdLore('ashfall');
    hdLore('hollow');
    hdSaveStory();
    hdBuildFloor(1);
  });
}

function hdContinueStory() {
  const s = hdLoadStory();
  if (!s) { ui('main'); return; }
  STORY = s;
  STORY.active = true;
  HD_PENDING = null;
  HD_BOSS_MOD = null;
  HD_DEATH_COUNTED = false;
  HD_END_SHOWN = false;
  HD_SHARD_FX = 0;
  HD_CAMP_MSG = '';
  HD_PULSE.cd = 0;
  HD_PULSE.t = 0;
  sel = {
    i: Math.max(0, Math.min(CL.length - 1, (STORY.hero && STORY.hero.h) | 0)),
    g: STORY.hero && STORY.hero.g === 'f' ? 'f' : 'm'
  };
  netClose();
  if (STORY.completed) {
    mode = 'menu';
    previewScene();
    ui('epilogue');
    return;
  }
  if (STORY.atCamp) {
    mode = 'menu';
    previewScene();
    ui('camp');
    return;
  }
  const ck = STORY.checkpoint || { floor: STORY.floor || 1 };
  hdBuildFloor(ck.floor || 1);
}

/* ------------------------------- camp ------------------------------- */
function hdEnterCamp(chapter) {
  chapter = Math.max(2, Math.min(3, chapter | 0));
  if (ME) hdSnapshotGear();
  STORY.active = true;
  STORY.started = true;
  STORY.chapter = chapter;
  STORY.floor = CHAPTERS[chapter].start;
  STORY.checkpoint = { chapter: chapter, floor: CHAPTERS[chapter].start };
  STORY.atCamp = true;
  STORY.campChapter = chapter;
  HD_PENDING = null;
  HD_BOSS_MOD = null;
  HD_DEATH_COUNTED = false;
  HD_CAMP_MSG = '';
  HD_PULSE.cd = 0;
  HD_PULSE.t = 0;
  hdSaveStory();
  netClose();

  mode = 'menu';
  previewScene();
  G.ban = null;
  G.msgT = 0;
  ui('camp');

  const intro = chapter === 2 ? 'ch1_camp_intro' : chapter === 3 ? 'ch2_camp_intro' : null;
  if (intro && !STORY.seenScenes[intro]) {
    STORY.seenScenes[intro] = true;
    hdSaveStory();
    hdPlayScene(intro, () => { ui('camp'); });
  }
}

function hdCampDescend() {
  if (!STORY.atCamp) return;
  const ch = Math.max(2, Math.min(3, STORY.campChapter || STORY.chapter || 2));
  STORY.atCamp = false;
  hdSaveStory();
  const go = () => hdBuildFloor(CHAPTERS[ch].start);
  const intro = CHAPTERS[ch].intro;
  if (intro && !STORY.seenScenes[intro]) {
    STORY.seenScenes[intro] = true;
    hdSaveStory();
    hdPlayScene(intro, go);
  } else {
    go();
  }
}

function hdBuyUpgrade(k) {
  const u = HD_UPGRADES[k];
  if (!u) return;
  const lvl = STORY.upgrades[k] || 0;
  if (lvl >= u.costs.length) {
    HD_CAMP_MSG = 'THAT FLAME IS ALREADY BRIGHT.';
    hdSfx('wrong');
    ui('camp', 1);
    return;
  }
  const cost = u.costs[lvl];
  if ((STORY.embers || 0) < cost) {
    HD_CAMP_MSG = 'NOT ENOUGH EMBERS.';
    hdSfx('wrong');
    ui('camp', 1);
    return;
  }
  STORY.embers -= cost;
  STORY.upgrades[k] = lvl + 1;
  if (ME) {
    if (k === 'vit') { ME.maxHp += 2; ME.hp = Math.min(ME.maxHp, ME.hp + 2); }
    else if (k === 'edge') { ME.db++; }
    else if (k === 'swift') { ME.spd *= 1.055; ME.cdm = Math.max(.5, ME.cdm * .955); }
  }
  HD_CAMP_MSG = u.name + ' RAISED.';
  hdSfx('camp');
  hdSaveStory();
  ui('camp', 1);
}

function hdCampTalk(id) {
  const map = { mara: 'camp_mara', gk: 'camp_gk', orin: 'camp_orin', witch: 'camp_witch' };
  if (!map[id]) return;
  hdPlayScene(map[id], () => { ui('camp'); });
}

/* ------------------------------- retry ------------------------------- */
function hdRetryFloor() {
  netClose();
  HD_PENDING = null;
  HD_BOSS_MOD = null;
  HD_DEATH_COUNTED = false;
  HD_END_SHOWN = false;
  HD_SHARD_FX = 0;
  const ck = STORY.checkpoint || { chapter: STORY.chapter || 1, floor: STORY.floor || 1 };
  hdBuildFloor(ck.floor || 1);
}

/* ------------------------------- endings ------------------------------- */
function hdFinishEnding() {
  if (HD_END_SHOWN) return;
  HD_END_SHOWN = true;
  const end = STORY.ending || 'ashes';
  STORY.endings = STORY.endings || {};
  STORY.endings[end] = true;
  STORY.completed = true;
  STORY.ending = end;
  STORY.atCamp = false;
  STORY.chapter = 3;
  STORY.floor = 10;
  hdSaveStory();
  netClose();
  mode = 'menu';
  previewScene();
  G.ban = null;
  G.msgT = 0;
  ui('epilogue');
}

function hdNewCycle() {
  const endings = Object.assign({}, STORY.endings || {});
  const cycle = (STORY.cycle || 1) + 1;
  STORY = hdDefaultStory();
  STORY.endings = endings;
  STORY.cycle = cycle;
  STORY.active = true;
  STORY.started = true;
  STORY.hero = { h: Math.max(0, Math.min(CL.length - 1, sel.i | 0)), g: sel.g === 'f' ? 'f' : 'm' };
  STORY.startedAt = Date.now();
  HD_PENDING = null;
  HD_BOSS_MOD = null;
  HD_DEATH_COUNTED = false;
  HD_END_SHOWN = false;
  HD_SHARD_FX = 0;
  HD_CAMP_MSG = '';
  HD_PULSE.cd = 0;
  HD_PULSE.t = 0;
  hdSaveStory();
  hdBuildFloor(1);
}

/* ------------------------------- events ------------------------------- */
function hdStartEvent() {
  if (!room || !room.storyEv || room.storyEventDone || room.eventStarted) return;
  const ev = room.storyEv;
  room.eventStarted = true;
  room.chest = null;

  if (ev.id === 'puzzle') { hdStartPuzzle(); return; }
  if (ev.id === 'arena') { hdStartArena(); return; }
  if (ev.id === 'chase') { hdStartChase(); return; }

  if (ev.scene) {
    room.open = false;
    hdPlayScene(ev.scene, () => hdCompleteEvent(ev, { embers: 20 }));
  } else {
    hdCompleteEvent(ev, { embers: 10 });
  }
}

function hdCompleteEvent(ev, opts) {
  opts = opts || {};
  if (!ev) return;
  const first = !STORY.done[ev.id];
  STORY.done[ev.id] = true;
  if (room) {
    room.storyEventDone = true;
    room.eventStarted = false;
    room.ladder = true;
    room.cleared = true;
    room.open = true;
    if (room.chest && Math.abs(room.chest.x - 176) < 2) {
      room.chest.x = 120;
      room.chest.y = 120;
      clearObs(120, 120);
    }
    clearObs(176, 120);
    if (!room.chest) room.chest = { x: 120, y: 120, s: 0, t: 0 };
  }
  if (first) {
    if (opts.embers) hdEmbers(opts.embers);
    if (opts.shard) hdAwardShard(opts.shard);
  }
  if (ev.id === 'whisper') { hdPeople('door'); hdLore('mouths'); }
  if (ev.id === 'orin') hdPeople('orin');
  if (ev.id === 'witch') { hdPeople('witch'); hdLore('forge'); }
  if (ev.id === 'mirror') { hdPeople('aurel'); hdPeople('mara'); hdLore('mirror'); }
  if (ev.id === 'puzzle') hdLore('seals');
  if (ev.id === 'arena') hdLore('rot');
  if (ev.id === 'chase') hdLore('collapse');
  hdSaveStory();
  hdSfx('bell');
  if (first && opts.shard) say('MEMORY SHARD FOUND — THE WAY OPENS', 3);
  else say('THE WAY BELOW IS OPEN', 2.4);
}

function hdAwardShard(id) {
  const key = 'shard_' + id;
  if (STORY.done[key]) return false;
  STORY.done[key] = true;
  STORY.shards = Math.min(3, (STORY.shards || 0) + 1);
  HD_SHARD_FX = 2.2;
  hdSfx('shard');
  hdSaveStory();
  return true;
}

/* ------------------------------- puzzle ------------------------------- */
function hdStartPuzzle() {
  const seq = [];
  let last = -1;
  for (let i = 0; i < 4; i++) {
    let n = Math.floor(Math.random() * 4);
    if (n === last) n = (n + 1 + Math.floor(Math.random() * 3)) % 4;
    seq.push(n);
    last = n;
  }
  room.storyPuzzle = {
    seq: seq, progress: 0, preview: 3.6, onRune: -1, lock: 0,
    done: false, active: true, glow: 0, fail: 0
  };
  for (const p of HD_RUNE_POS) clearObs(p.x, p.y);
  room.open = false;
  room.cleared = false;
  room.chest = null;
  hdSfx('bell');
  say('THE SEAL REMEMBERS. WATCH.', 2.6);
}

function hdPuzzleInput(r) {
  const pz = room && room.storyPuzzle;
  if (!pz || pz.done || !pz.active || pz.preview > 0 || pz.lock > 0) return;
  if (r === pz.seq[pz.progress]) {
    pz.progress++;
    pz.glow = .6;
    hdSfx('choice');
    spark(HD_RUNE_POS[r].x, HD_RUNE_POS[r].y - 6, HD_RUNE_COL[r], 10, 70);
    if (pz.progress >= pz.seq.length) {
      pz.done = true;
      pz.active = false;
      room.storyPuzzle = pz;
      hdCompleteEvent(room.storyEv, { embers: 30, shard: 'puzzle' });
    }
  } else {
    pz.progress = 0;
    pz.preview = 2.6;
    pz.lock = .8;
    pz.fail = 1;
    hdSfx('wrong');
    shakeIt(.3);
    hurtP(ME, 1, null);
    say('THE SEAL REJECTS YOU', 1.8);
  }
}

function hdPuzzleTick(dt) {
  const pz = room && room.storyPuzzle;
  if (!pz || pz.done) return;
  if (pz.preview > 0) pz.preview = Math.max(0, pz.preview - dt);
  if (pz.lock > 0) pz.lock = Math.max(0, pz.lock - dt);
  if (pz.glow > 0) pz.glow = Math.max(0, pz.glow - dt);
  if (pz.fail > 0) pz.fail = Math.max(0, pz.fail - dt);
  if (!ME || ME.down) return;
  let r = -1;
  for (let i = 0; i < HD_RUNE_POS.length; i++) {
    const d = Math.hypot(ME.x - HD_RUNE_POS[i].x, ME.y - HD_RUNE_POS[i].y);
    if (d < 14) { r = i; break; }
  }
  if (r !== pz.onRune) {
    pz.onRune = r;
    if (r >= 0 && pz.preview <= 0 && pz.lock <= 0) hdPuzzleInput(r);
  }
}

/* ------------------------------- arena ------------------------------- */
function hdArenaSpawn(wave) {
  const types = G.floor >= 7 ? POOL[2] : POOL[1];
  const spots = [[64, 64], [288, 64], [64, 178], [288, 178], [176, 58], [176, 192], [100, 118], [252, 118]];
  const n = 2 + wave + (wave === 3 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const sp = spots[(i + wave) % spots.length];
    const e = mk(pk(types), sp[0], sp[1]);
    e.arena = true;
    if (wave >= 2) { e.hp = Math.round(e.hp * 1.12); e.mhp = e.hp; }
    if (wave === 3 && i === 0) { e.hp = Math.round(e.hp * 1.5); e.mhp = e.hp; }
    ens.push(e);
  }
}

function hdStartArena() {
  room.storyArena = { active: true, done: false, wave: 1, timer: 20, next: 0 };
  for (const p of [[62, 66], [290, 66], [62, 178], [290, 178], [176, 120]]) clearObs(p[0], p[1]);
  room.open = false;
  room.cleared = false;
  room.chest = null;
  hdArenaSpawn(1);
  hdSfx('dark');
  say('HOLD THE LIGHT — WAVE 1/3', 2.2);
}

function hdArenaComplete() {
  const a = room && room.storyArena;
  if (!a) return;
  a.active = false;
  a.done = true;
  for (const e of ens.slice()) {
    if (e.arena) {
      spark(e.x, e.y - 8, '#ff8a3c', 8, 80);
      ens.splice(ens.indexOf(e), 1);
    }
  }
  hdCompleteEvent(room.storyEv, { embers: 50, shard: 'arena' });
}

function hdArenaTick(dt) {
  const a = room && room.storyArena;
  if (!a || !a.active) return;
  a.timer -= dt;
  if (a.timer <= 0) {
    a.timer = 15;
    if (ME && !ME.down) hurtP(ME, 2, null);
    shakeIt(.4);
    hdSfx('dark');
    hdArenaSpawn(a.wave);
    say('THE LIGHT FALTERS', 1.8);
  }
  const alive = ens.filter(e => e.arena).length;
  if (alive > 0) { a.next = 0; return; }
  if (a.wave >= 3) { hdArenaComplete(); return; }
  if (a.next <= 0) a.next = 1.1;
  a.next -= dt;
  if (a.next <= 0) {
    a.wave++;
    a.timer = 18;
    a.next = 0;
    hdArenaSpawn(a.wave);
    say('WAVE ' + a.wave + '/3', 1.8);
  }
}

/* ------------------------------- chase ------------------------------- */
function hdStartChase() {
  room.storyChase = {
    active: true, done: false, wall: -48, speed: 11, time: 0, hit: 0, doneSeals: 0,
    seals: [
      { x: 88, y: 162, on: false },
      { x: 176, y: 62, on: false },
      { x: 264, y: 162, on: false }
    ]
  };
  for (const s of room.storyChase.seals) clearObs(s.x, s.y);
  room.open = false;
  room.cleared = false;
  room.chest = null;
  hdSfx('dark');
  say('RUN. THE DARK IS COMING.', 2.4);
}

function hdChaseTick(dt) {
  const c = room && room.storyChase;
  if (!c || !c.active) return;
  c.time += dt;
  c.speed = 11 + c.time * .2;
  c.wall += c.speed * dt;
  if (c.hit > 0) c.hit = Math.max(0, c.hit - dt);
  if (ME && !ME.down) {
    if (ME.x < c.wall + 10) {
      if (ME.inv <= 0) {
        hurtP(ME, 2, null);
        shakeIt(.5);
        hdSfx('dark');
      }
      ME.x = Math.max(ME.x, c.wall + 14);
    }
    if (HD_PRESS.e) {
      let best = -1, bd = 24;
      for (let i = 0; i < c.seals.length; i++) {
        const s = c.seals[i];
        if (s.on) continue;
        const d = Math.hypot(ME.x - s.x, ME.y - s.y);
        if (d < bd) { bd = d; best = i; }
      }
      if (best >= 0) {
        const s = c.seals[best];
        s.on = true;
        c.doneSeals++;
        c.wall = Math.max(-60, c.wall - 24);
        hdEmbers(5);
        hdSfx('bell');
        spark(s.x, s.y - 8, '#ffd98a', 18, 100);
        if (c.doneSeals >= 3) {
          c.active = false;
          c.done = true;
          hdCompleteEvent(room.storyEv, { embers: 40, shard: 'chase' });
          return;
        }
        say('SEAL LIT — ' + c.doneSeals + '/3', 1.5);
      }
    }
  }
  if (c.doneSeals >= 3) {
    c.active = false;
    c.done = true;
    hdCompleteEvent(room.storyEv, { embers: 40, shard: 'chase' });
  }
}

/* ------------------------------- pulse ------------------------------- */
function hdPulse() {
  if (!(G && G.story && STORY.active)) return;
  if (!(mode === 'play' && inputOn()) || !ME || ME.down) return;
  if (HD_PULSE.cd > 0) { hdSfx('wrong'); return; }
  const lvl = STORY.upgrades.lamp || 0;
  HD_PULSE.cd = Math.max(3.2, 9 - lvl * 2.2);
  HD_PULSE.t = .65;
  hdSfx('pulse');
  shakeIt(.22);
  spark(ME.x, ME.y - 8, '#9fd3ff', 22, 140);
  for (const e of ens.slice()) {
    if (e.sp > 0) continue;
    const dx = e.x - ME.x, dy = e.y - ME.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < 92) hitE(e, e.boss ? 1 : (2 + lvl), dx / d, dy / d, e.boss ? .12 : .55);
  }
  if (room && room.storyChase && room.storyChase.active) {
    room.storyChase.wall = Math.max(-60, room.storyChase.wall - 22);
    say('THE DARK RECOILS', 1.2);
  }
}

/* ------------------------------- objective ------------------------------- */
function hdObjective() {
  if (!(G && G.story && room)) return null;
  const c = room.storyChase;
  if (c && c.active) return { t: 'THE COLLAPSE', s: 'LIGHT THE SEALS — ' + c.doneSeals + '/3', h: 'E NEAR A SEAL · Q PUSHES THE DARK BACK' };
  const pz = room.storyPuzzle;
  if (pz && !pz.done) return { t: 'THE SEALED MEMORY', s: pz.preview > 0 ? 'WATCH THE RUNES' : 'REPEAT THE RUNES — ' + pz.progress + '/' + pz.seq.length, h: 'STEP ON A RUNE TO SPEAK IT' };
  const a = room.storyArena;
  if (a && a.active) return { t: 'HOLD THE LIGHT', s: 'WAVE ' + a.wave + '/3 — ' + Math.max(0, Math.ceil(a.timer)) + 's', h: 'KEEP THE FIRE BURNING' };
  if (room.storyEv && !room.storyEventDone) return { t: room.storyEv.title, s: room.cleared ? 'A SEAL HOLDS THE STAIRS' : 'CLEAR THE CHAMBER', h: '' };
  if (room.boss) {
    const b = ens.find(e => e.boss);
    if (b) return { t: b.title || CHAPTERS[hdChapterForFloor(G.floor)].boss, s: 'THE WAY DOWN IS THROUGH HIM', h: '' };
  }
  if (room.storyEv && room.storyEventDone && room.ladder && room.cleared) return { t: 'THE WAY IS OPEN', s: 'DESCEND', h: '' };
  if (G.floor === 1 && room.type === 'start') return { t: 'THE LANTERN BELOW', s: 'FIND THE STAIRS', h: '' };
  return null;
}

/* ------------------------------- update wrapper ------------------------------- */
function hdStoryTick(dt) {
  if (HD_PULSE.cd > 0) HD_PULSE.cd = Math.max(0, HD_PULSE.cd - dt);
  if (HD_PULSE.t > 0) HD_PULSE.t = Math.max(0, HD_PULSE.t - dt);
  if (HD_SHARD_FX > 0) HD_SHARD_FX = Math.max(0, HD_SHARD_FX - dt);
  if (ME) {
    const tx = ME.x - 20 + Math.sin(now * 1.7) * 6;
    const ty = ME.y - 38 + Math.sin(now * 2.3) * 4;
    HD_MARA.x += (tx - HD_MARA.x) * Math.min(1, dt * 6);
    HD_MARA.y += (ty - HD_MARA.y) * Math.min(1, dt * 6);
  }

  if (ME && !ME.down && room && room.echo && !room.echo.got && !STORY.done['echo' + G.floor]) {
    if (Math.hypot(ME.x - room.echo.x, ME.y - room.echo.y) < 16) {
      room.echo.got = true;
      STORY.done['echo' + G.floor] = true;
      hdLore('echo' + G.floor);
      hdEmbers(12);
      HD_SHARD_FX = 1.4;
      hdSfx('shard');
      say('ECHO OF VEYRA — ' + (HD_ECHO_TITLE[G.floor] || 'A MEMORY'), 2.4);
      hdSaveStory();
    }
  }

  if (room) {
    if (room.storyPuzzle && !room.storyPuzzle.done) hdPuzzleTick(dt);
    if (room.storyArena && room.storyArena.active) hdArenaTick(dt);
    if (room.storyChase && room.storyChase.active) hdChaseTick(dt);
  }
  if (mode !== 'play') return;

  if (G.floor === 10 && room && room.boss) {
    const b = ens.find(e => e.boss);
    if (b) {
      if (!STORY.seenScenes.king_phase2 && b.hp <= b.mhp * .66) {
        STORY.seenScenes.king_phase2 = true;
        hdSaveStory();
        hdPlayScene('king_phase2');
        return;
      }
      if (STORY.seenScenes.king_phase2 && !STORY.seenScenes.king_phase3 && b.hp <= b.mhp * .33) {
        STORY.seenScenes.king_phase3 = true;
        hdSaveStory();
        hdPlayScene('king_phase3');
        return;
      }
    }
  }
}

const _hdUpdate = update;
update = function (dt) {
  if (!(G && G.story)) { _hdUpdate(dt); return; }
  if (HD_PENDING) {
    HD_PENDING.delay -= dt;
    if (HD_PENDING.delay <= 0) {
      const p = HD_PENDING;
      HD_PENDING = null;
      HD_PRESS = {};
      hdPlayScene(p.id, p.done);
      return;
    }
  }
  _hdUpdate(dt);
  if (mode === 'play') hdStoryTick(dt);
  HD_PRESS = {};
};

/* ------------------------------- room transitions ------------------------------- */
const _hdEnter = enter;
enter = function (c, dir) {
  const story = !!(G && G.story);
  _hdEnter(c, dir);
  if (!story || !G || !G.story || !c) return;

  if (c.echo && !c.echo.got) clearObs(c.echo.x, c.echo.y);
  if (c.storyEv && !c.storyEventDone) c.ladder = false;

  if (c.type === 'boss') {
    const b = ens.find(e => e.boss);
    if (b) b.title = G.floor === 3 ? 'THE GRAVEKEEPER' : G.floor === 6 ? 'THE ROTTING SAINT' : 'THE HOLLOW KING';
    const key = 'boss' + G.floor;
    if (!STORY.seenBoss[key]) {
      STORY.seenBoss[key] = true;
      hdSaveStory();
      const scene = G.floor === 3 ? 'boss_gravekeeper' : G.floor === 6 ? 'boss_saint' : 'boss_king';
      hdPlayScene(scene, () => { hdSyncBossMod(); hdSaveStory(); });
    } else {
      hdSyncBossMod();
    }
  }
};

const _hdClearRoom = clearRoom;
clearRoom = function () {
  _hdClearRoom();
  if (!(G && G.story) || !room) return;
  if (room.storyEv && !room.storyEventDone && !room.eventStarted) hdStartEvent();
};

const _hdDescend = descend;
descend = function () {
  if (!(G && G.story)) { _hdDescend(); return; }
  if (G.floor >= 10) return;
  const next = hdClampFloor(G.floor + 1);
  hdSnapshotGear();
  STORY.chapter = hdChapterForFloor(next);
  STORY.floor = next;
  STORY.checkpoint = { chapter: STORY.chapter, floor: next };
  STORY.atCamp = false;
  HD_PENDING = null;
  HD_BOSS_MOD = null;
  HD_DEATH_COUNTED = false;
  HD_SHARD_FX = 0;
  hdSaveStory();
  _hdDescend();
  if (G && G.story) {
    hdFloorBanner(next);
    hdMoveMaraToMe();
    hdSaveStory();
  }
};

const _hdNewFloor = newFloor;
newFloor = function () {
  _hdNewFloor();
  if (G && G.story) hdDecorateFloor();
};

const _hdKill = kill;
kill = function (e, dx, dy) {
  const story = !!(G && G.story);
  const boss = !!(e && e.boss);
  const type = e && e.type;
  _hdKill(e, dx, dy);
  if (!story || !G || !G.story) return;
  STORY.kills = (STORY.kills || 0) + 1;
  if (type) hdBest(type);
  if (!boss) return;

  const bid = G.floor === 3 ? 'gravekeeper' : G.floor === 6 ? 'saint' : 'king';
  hdBest(bid);
  hdPeople(bid === 'gravekeeper' ? 'gravekeeper' : bid === 'king' ? 'aurel' : 'saint');
  hdEmbers(50);
  if (ME) ME.inv = Math.max(ME.inv, 2.5);
  for (const o of ens.slice()) {
    if (o && !o.boss) {
      spark(o.x, o.y - 8, '#c9c9c9', 6, 60);
      ens.splice(ens.indexOf(o), 1);
    }
  }
  if (room) {
    room.ladder = false;
    room.cleared = true;
    room.open = true;
    room.chest = null;
  }
  if (G.floor === 3) hdQueueScene('ch1_outro', () => hdEnterCamp(2), 1.2);
  else if (G.floor === 6) hdQueueScene('ch2_outro', () => hdEnterCamp(3), 1.2);
  else if (G.floor >= 10) hdQueueScene('final_choice', hdFinishEnding, 1.3);
  hdSaveStory();
};

const _hdEndShow = endShow;
endShow = function (kind) {
  if (kind === 'over' && G && G.story) {
    G.ban = null;
    G.msgT = 0;
    if (!HD_DEATH_COUNTED) {
      STORY.deaths = (STORY.deaths || 0) + 1;
      HD_DEATH_COUNTED = true;
      hdSaveStory();
    }
  }
  _hdEndShow(kind);
};

const _hdWin = win;
win = function () {
  if (G && G.story) {
    if (G.floor >= 10 && !HD_END_SHOWN && !HD_PENDING) hdQueueScene('final_choice', hdFinishEnding, 0);
    return;
  }
  _hdWin();
};

/* keep the world still behind a cutscene */
const _hdMenuScene = menuScene;
menuScene = function (dt) {
  if (CINE.active) { now += dt; return; }
  _hdMenuScene(dt);
};

/* ------------------------------- input ------------------------------- */
addEventListener('keydown', function (e) {
  if (e.repeat || CINE.active || !(G && G.story && STORY.active)) return;
  const k = (e.key || '').toLowerCase();
  if (mode === 'play' && inputOn()) {
    if (k === 'e') HD_PRESS.e = true;
    if (k === 'q') { e.preventDefault(); hdPulse(); }
  }
}, true);

addEventListener('keydown', function (e) {
  if (e.repeat || CINE.active || mode !== 'play' || !inputOn()) return;
  if (!(G && G.story && STORY.active)) return;
  if ((e.key || '').toLowerCase() === 'e') HD_PRESS.e = true;
});

/* touch pulse button */
cv.addEventListener('pointerdown', function (e) {
  if (e.pointerType !== 'touch' || CINE.active || mode !== 'play' || !inputOn()) return;
  if (!(G && G.story && STORY.active)) return;
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * W;
  const y = (e.clientY - r.top) / r.height * H;
  if (Math.hypot(x - (W - 84), y - (H - 84)) < 24) {
    e.preventDefault();
    e.stopImmediatePropagation();
    hdPulse();
  }
}, true);

/* ------------------------------- boot helpers / debug ------------------------------- */
function hdDebugJumpEvent(f) {
  hdBuildFloor(f);
  const c = [...G.dun.values()].find(x => x.storyEv);
  if (!c) return 'no event';
  enter(c, null);
  ens = [];
  if (room) {
    room.gap = 0;
    clearObs(176, 120);
    clearRoom();
  }
  return 'ok';
}

function hdDebugBoss(f) {
  hdBuildFloor(f);
  const c = [...G.dun.values()].find(x => x.type === 'boss' || x.boss);
  if (!c) return 'no boss';
  enter(c, null);
  return 'ok';
}

function hdDebugSolvePuzzle() {
  const pz = room && room.storyPuzzle;
  if (!pz || pz.done) return 'no puzzle';
  pz.preview = 0;
  pz.lock = 0;
  const seq = pz.seq.slice();
  for (const r of seq) hdPuzzleInput(r);
  return pz.done ? 'solved' : 'failed';
}

function hdDebugClearArena() {
  for (const e of ens.slice()) if (e.arena) ens.splice(ens.indexOf(e), 1);
}

function hdDebugLightSeals() {
  const c = room && room.storyChase;
  if (!c) return;
  for (const s of c.seals) s.on = true;
  c.doneSeals = 3;
  hdChaseTick(.016);
}

window.__hollow = {
  story: () => STORY,
  game: () => G,
  room: () => room,
  cine: () => CINE,
  begin: hdBeginStory,
  continueStory: hdContinueStory,
  build: hdBuildFloor,
  retry: hdRetryFloor,
  camp: hdEnterCamp,
  descendCamp: hdCampDescend,
  finish: hdFinishEnding,
  newCycle: hdNewCycle,
  scene: hdPlayScene,
  advance: hdAdvance,
  choose: hdChoose,
  skip: hdSkipScene,
  jumpEvent: hdDebugJumpEvent,
  jumpBoss: hdDebugBoss,
  solvePuzzle: hdDebugSolvePuzzle,
  clearArena: hdDebugClearArena,
  lightSeals: hdDebugLightSeals,
  pulse: hdPulse,
  buy: hdBuyUpgrade,
  talk: hdCampTalk,
  objective: () => hdObjective()
};
