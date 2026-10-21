/* ===== story_render.js ===== */
/* =====================================================================
   THE LANTERN BELOW — renderer
   Floor props, ambient life, HUD, objective panel, camp & epilogue art.
   ===================================================================== */

let HD_ART_LAST = 0;

/* ------------------------------ small helpers ------------------------------ */
function hdGlow(x, y, r, inner, outer) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, inner || 'rgba(255,190,90,.45)');
  g.addColorStop(.45, outer || 'rgba(255,120,40,.12)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function hdDiamond(x, y, r, c, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.globalAlpha = a === undefined ? 1 : a;
  ctx.fillStyle = c;
  ctx.fillRect(-r / 2, -r / 2, r, r);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function hdFlameMain(x, y, sc, low) {
  sc = sc || 1;
  const t = now;
  const f = n => Math.sin(t * (6 + n * 1.7) + n * 2.1 + x * .05);
  const cols = low ? ['rgba(150,40,20,.9)', 'rgba(220,90,30,.9)', 'rgba(255,160,60,.95)']
                   : ['rgba(190,50,20,.85)', 'rgba(255,140,40,.9)', 'rgba(255,225,140,.95)'];
  for (let i = 0; i < 3; i++) {
    const w = (11 - i * 2.8) * sc, h = (17 - i * 3.6) * sc;
    const ox = f(i + 1) * 1.8 * sc, oy = f(i + 3) * 1.2 * sc;
    ctx.fillStyle = cols[i];
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + ox, y);
    ctx.quadraticCurveTo(x - w * .65 + ox, y - h * .55, x + ox * .4, y - h + oy);
    ctx.quadraticCurveTo(x + w * .62 + ox, y - h * .5, x + w / 2 + ox, y);
    ctx.closePath();
    ctx.fill();
  }
  hdGlow(x, y - 6 * sc, 26 * sc, 'rgba(255,180,80,.3)', 'rgba(255,100,30,.1)');
}

/* ------------------------------ floor props ------------------------------ */
function hdDrawWhisperDoor() {
  const cx = 176, by = 154, w = 50, top = by - 70;
  ctx.save();
  hdGlow(cx, by - 34, 62, 'rgba(120,30,30,.22)', 'rgba(90,20,20,.05)');
  ctx.fillStyle = '#050308';
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, by);
  ctx.lineTo(cx - w / 2, by - 38);
  ctx.quadraticCurveTo(cx - w / 2, top, cx, top);
  ctx.quadraticCurveTo(cx + w / 2, top, cx + w / 2, by - 38);
  ctx.lineTo(cx + w / 2, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(224,164,58,.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#1a1010';
  ctx.fillRect(cx - 20, by - 58, 40, 56);
  ctx.strokeStyle = '#0a0608';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 20, by - 54 + i * 12);
    ctx.lineTo(cx + 20, by - 54 + i * 12);
    ctx.stroke();
  }

  for (let i = 0; i < 8; i++) {
    const mx = cx - 14 + (i % 3) * 14;
    const my = by - 48 + Math.floor(i / 3) * 15;
    const open = 1.8 + 2 * (0.5 + 0.5 * Math.sin(now * 2.2 + i * 1.7));
    ctx.fillStyle = '#3a0a0c';
    ctx.beginPath();
    ctx.ellipse(mx, my, 5.5, open, 0, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = '#080304';
    ctx.beginPath();
    ctx.ellipse(mx, my, 3.2, Math.max(.8, open * .5), 0, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = '#d8c9a8';
    ctx.fillRect(mx - 4, my - open - 1, 1, 1);
    ctx.fillRect(mx + 3, my - open - 1, 1, 1);
  }

  for (let i = 0; i < 10; i++) {
    const a = now * .75 + i * 1.9;
    const x = cx + Math.cos(a) * (22 + (i % 5) * 8);
    const y = by - 30 + Math.sin(a * .8) * (16 + (i % 4) * 7);
    hdDiamond(x, y, 1.5, i % 3 ? '#d87867' : '#ffd98a', .25 + .25 * Math.sin(now * 2 + i));
  }
  ctx.restore();
}

function hdDrawOrin() {
  const cx = 176, cy = 112;
  hdGlow(cx, cy, 58, 'rgba(255,190,80,.25)', 'rgba(200,120,30,.09)');
  ctx.fillStyle = 'rgba(170,110,40,.5)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 23, 47, 0, 0, 6.283);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,140,.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14 + i * 3.2, 34 + i * 4.5, .18, 0, 6.283);
    ctx.stroke();
  }
  ctx.globalAlpha = .55;
  S('wizzard_m_idle_anim_f' + Math.floor(now * 3) % 4, cx - 8, cy - 20);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 8; i++) {
    const x = cx - 16 + (i * 13) % 36;
    const y = cy - 34 + ((now * (4 + i % 3) + i * 13) % 74);
    ctx.globalAlpha = .5;
    ctx.fillStyle = '#d6a24a';
    ctx.beginPath();
    ctx.ellipse(x, y, 1.4, 3.2, 0, 0, 6.283);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function hdDrawWitch() {
  const cx = 254, cy = 140;
  hdGlow(cx, cy - 6, 56, 'rgba(255,120,40,.3)', 'rgba(200,60,20,.08)');
  ctx.fillStyle = '#0a0505';
  ctx.fillRect(cx - 34, cy - 20, 44, 34);
  ctx.fillStyle = '#2a0f06';
  ctx.fillRect(cx - 30, cy - 16, 36, 26);
  hdFlameMain(cx - 12, cy + 8, 1.05, false);
  ctx.fillStyle = '#0a0606';
  ctx.fillRect(cx + 18, cy - 2, 30, 7);
  ctx.fillRect(cx + 26, cy + 5, 14, 16);
  ctx.fillRect(cx + 22, cy + 20, 22, 4);
  ctx.globalAlpha = .95;
  S('wizzard_f_idle_anim_f' + Math.floor(now * 4) % 4, cx + 2, cy - 28, true);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 12; i++) {
    const x = cx - 12 + Math.sin(now * 3 + i * 2.1) * (8 + (i % 5) * 7);
    const y = cy + 8 - ((now * (18 + i % 10) + i * 11) % 72);
    ctx.fillStyle = i % 3 ? '#ffb347' : '#fff3cc';
    ctx.globalAlpha = .3 + .3 * Math.sin(now * 5 + i);
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

function hdDrawMirror() {
  const cx = 176, cy = 92;
  hdGlow(cx, cy, 76, 'rgba(110,193,255,.16)', 'rgba(110,193,255,.04)');
  ctx.fillStyle = '#0a0810';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 31, 45, 0, 0, 6.283);
  ctx.fill();
  const g = ctx.createLinearGradient(0, cy - 42, 0, cy + 42);
  g.addColorStop(0, '#2c2a44');
  g.addColorStop(.5, '#171528');
  g.addColorStop(1, '#0e0c18');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 26, 40, 0, 0, 6.283);
  ctx.fill();
  ctx.globalAlpha = .55;
  ctx.fillStyle = '#3d5a7a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, 23, 23, 0, 0, 6.283);
  ctx.fill();
  ctx.fillStyle = '#8fb8d8';
  for (let i = 0; i < 5; i++) ctx.fillRect(cx - 16 + i * 7, cy - 8 + (i % 2) * 6, 3, 15 + (i % 3) * 5);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(199,139,255,.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 30);
  ctx.lineTo(cx - 1, cy - 8);
  ctx.lineTo(cx - 8, cy + 8);
  ctx.lineTo(cx + 2, cy + 25);
  ctx.stroke();
  ctx.fillStyle = '#14101a';
  ctx.fillRect(cx - 18, cy + 44, 36, 6);
  ctx.fillRect(cx - 12, cy + 50, 24, 3);
  for (let i = 0; i < 8; i++) {
    const x = cx - 30 + ((now * (8 + i % 4) + i * 17) % 60);
    const y = cy - 34 + ((i * 19 + now * 6) % 78);
    ctx.globalAlpha = .15 + .18 * Math.sin(now + i);
    ctx.fillStyle = i % 4 ? '#b9a9c9' : '#ffb347';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

function hdDrawArena() {
  const a = room.storyArena;
  if (!a) return;
  const pts = [[62, 66], [290, 66], [62, 178], [290, 178]];
  const low = a.timer < 5;
  ctx.save();
  ctx.globalAlpha = .18 + .08 * Math.sin(now * 3);
  ctx.strokeStyle = low ? '#e23b3b' : '#ffb347';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const p = pts[i], q = pts[(i + 1) % 4];
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(q[0], q[1]);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  const fac = Math.max(.35, Math.min(1, a.timer / 20));
  for (const p of pts) {
    ctx.fillStyle = '#1b1320';
    ctx.fillRect(p[0] - 8, p[1] + 4, 16, 5);
    ctx.fillRect(p[0] - 5, p[1] + 9, 10, 3);
    ctx.fillStyle = '#0a0608';
    ctx.fillRect(p[0] - 7, p[1] - 2, 14, 7);
    hdFlameMain(p[0], p[1] - 1, .55 + .45 * fac, low);
  }
  ctx.restore();
}

function hdDrawChase() {
  const c = room.storyChase;
  if (!c) return;
  for (const s of c.seals) {
    const t = now * 3 + s.x * .05;
    hdGlow(s.x, s.y - 8, s.on ? 30 : 18,
      s.on ? 'rgba(159,211,255,.45)' : 'rgba(90,70,120,.14)',
      s.on ? 'rgba(80,150,255,.12)' : 'rgba(40,30,60,.04)');
    ctx.fillStyle = '#1b1426';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 5, 11, 5, 0, 0, 6.283);
    ctx.fill();
    ctx.strokeStyle = s.on ? '#9fd3ff' : '#6b5a8a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 4, 9, 4, 0, 0, 6.283);
    ctx.stroke();
    ctx.fillStyle = '#2d2138';
    ctx.fillRect(s.x - 1, s.y - 15, 2, 15);
    ctx.strokeStyle = s.on ? '#ffd98a' : '#5a4c70';
    ctx.strokeRect(s.x - 5.5, s.y - 24.5, 11, 11);
    ctx.fillStyle = s.on ? '#ffcf6a' : '#141020';
    ctx.fillRect(s.x - 3, s.y - 22, 6, 6);
    if (s.on) {
      ctx.fillStyle = '#fff3cc';
      ctx.beginPath();
      ctx.ellipse(s.x, s.y - 19 + Math.sin(now * 8 + s.x) * .8, 1.4, 2.8, 0, 0, 6.283);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        hdDiamond(s.x + Math.cos(t + i * 2.1) * 9, s.y - 15 + Math.sin(t * .8 + i) * 5, 1.4, '#9fd3ff', .5);
      }
    } else {
      ctx.globalAlpha = .5 + .2 * Math.sin(now * 2 + s.x);
      hdDiamond(s.x, s.y - 19, 1.6, '#7a6aa0', .8);
      ctx.globalAlpha = 1;
    }
  }

  const wx = Math.max(-12, c.wall);
  const g = ctx.createLinearGradient(wx - 30, 0, wx + 20, 0);
  g.addColorStop(0, 'rgba(1,0,3,.99)');
  g.addColorStop(.7, 'rgba(3,1,7,.95)');
  g.addColorStop(1, 'rgba(12,4,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, Math.max(0, wx + 20), H);

  ctx.strokeStyle = 'rgba(22,9,33,.9)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const y = i * 26 + 8;
    const x = wx + Math.sin(now * 2.3 + i * 1.7) * 7;
    ctx.beginPath();
    ctx.moveTo(wx - 14, y);
    ctx.quadraticCurveTo(x + 6, y + 6, x + 14 + Math.sin(now + i) * 6, y + 2);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const y = 46 + i * 44 + Math.sin(now * 1.1 + i) * 5;
    const x = wx - 6 + Math.sin(now * .8 + i * 2) * 4;
    if (x > 2) {
      ctx.globalAlpha = .2 + .15 * Math.sin(now * 2 + i);
      ctx.fillStyle = '#d87867';
      ctx.fillRect(x, y, 2, 1);
      ctx.globalAlpha = 1;
    }
  }
}

function hdDrawPuzzle() {
  const pz = room.storyPuzzle;
  if (!pz || pz.done) return;
  const total = 3.6;
  let lit = -1;
  if (pz.preview > 0) {
    const elapsed = total - pz.preview;
    const slot = Math.floor(elapsed / .72);
    const local = elapsed - slot * .72;
    if (slot >= 0 && slot < pz.seq.length && local < .5) lit = pz.seq[slot];
  }
  if (pz.onRune >= 0) lit = pz.onRune;
  for (let i = 0; i < HD_RUNE_POS.length; i++) {
    const p = HD_RUNE_POS[i];
    const col = HD_RUNE_COL[i];
    const hot = i === lit;
    if (hot) hdGlow(p.x, p.y, 30, 'rgba(255,240,200,.18)', 'rgba(255,200,100,.08)');
    ctx.globalAlpha = hot ? .3 + .18 * Math.sin(now * 8) : .11;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, hot ? 14 : 11, 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = hot ? '#fff3cc' : 'rgba(159,211,255,.34)';
    ctx.lineWidth = hot ? 2 : 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, hot ? 13 : 10, 0, 6.283);
    ctx.stroke();
    hdRuneGlyph(i, p.x, p.y, hot ? 1.2 : 1, hot ? '#fff3cc' : col);
    if (hot) {
      for (let k = 0; k < 4; k++) {
        const a = now * 4 + k * 1.57;
        hdDiamond(p.x + Math.cos(a) * 17, p.y + Math.sin(a) * 17, 1.6, col, .7);
      }
    }
  }
  const label = pz.preview > 0 ? 'WATCH THE RUNES' : 'SPEAK THE RUNES  ' + pz.progress + '/' + pz.seq.length;
  tx(label, 176, 118, pz.preview > 0 ? '#9fd3ff' : '#ffd98a', 'center', 6);
  const y = 131;
  for (let i = 0; i < pz.seq.length; i++) {
    const on = i < pz.progress;
    hdDiamond(161 + i * 9, y, on ? 3 : 2, on ? '#ffd98a' : '#4a4260', on ? 1 : .6);
  }
}

function hdRuneGlyph(i, x, y, s, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  if (i === 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 5, .7, 5.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1.6, -.5, 4, 2.2, 4.1);
    ctx.stroke();
  } else if (i === 1) {
    ctx.beginPath();
    ctx.moveTo(0, -5.5);
    ctx.quadraticCurveTo(4.5, .5, 0, 5.5);
    ctx.quadraticCurveTo(-4.5, .5, 0, -5.5);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(0, 5);
    ctx.stroke();
  } else if (i === 2) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.5, 3.2, 0, 0, 6.283);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 1.4, 0, 6.283);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(-3, -2);
    ctx.moveTo(6, -4);
    ctx.lineTo(3, -2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, 5.5);
    ctx.lineTo(0, -1);
    ctx.moveTo(0, 1);
    ctx.lineTo(-4, -3);
    ctx.moveTo(0, 1);
    ctx.lineTo(4, -3);
    ctx.moveTo(0, 3);
    ctx.lineTo(-3, 5);
    ctx.moveTo(0, 3);
    ctx.lineTo(3, 5);
    ctx.stroke();
  }
  ctx.restore();
}

function hdDrawEchoProp() {
  const e = room.echo;
  if (!e || e.got || STORY.done['echo' + G.floor]) return;
  const t = now;
  const x = e.x;
  const y = e.y - 8 + Math.sin(t * 2.4) * 2.5;
  hdGlow(x, y, 26, 'rgba(190,235,255,.5)', 'rgba(80,150,255,.12)');
  ctx.fillStyle = '#9fd3ff';
  ctx.beginPath();
  ctx.arc(x, y, 3.4, 0, 6.283);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - .6, y - .8, 1.3, 0, 6.283);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = t * (1.1 + i * .12) + i * 1.7;
    const rr = 7 + i * 2.4;
    hdDiamond(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .6, 1.4, i % 3 ? '#9fd3ff' : '#fff3cc', .35 + .3 * Math.sin(t * 4 + i));
  }
  ctx.globalAlpha = .5 + .2 * Math.sin(t * 2);
  tx('ECHO', x, y - 20, '#9fd3ff', 'center', 6);
  ctx.globalAlpha = 1;
}

function hdDrawStartLantern() {
  if (G.floor !== 1 || !room || room.type !== 'start') return;
  const x = 208, y = 150;
  hdGlow(x, y - 12, 42, 'rgba(255,190,90,.42)', 'rgba(255,120,40,.1)');
  ctx.fillStyle = '#2a1a12';
  ctx.fillRect(x - 1, y - 4, 2, 8);
  ctx.fillRect(x - 5, y + 4, 10, 2);
  ctx.fillStyle = '#3a2a20';
  ctx.fillRect(x - 4, y - 20, 8, 15);
  ctx.fillStyle = '#ffcf6a';
  ctx.fillRect(x - 2, y - 17, 4, 9);
  ctx.strokeStyle = 'rgba(255,220,150,.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 4.5, y - 20.5, 9, 16);
  const f = 1 + Math.sin(now * 9) * .2;
  ctx.globalAlpha = .35;
  ctx.fillStyle = '#fff3cc';
  ctx.beginPath();
  ctx.ellipse(x, y - 13, 1.6 * f, 3.4 * f, 0, 0, 6.283);
  ctx.fill();
  ctx.globalAlpha = 1;
  tx('THE LANTERN', x, y + 10, '#ffd98a', 'center', 6);
}

function hdDrawBossSigil() {
  if (!room || !room.boss) return;
  const col = G.floor >= 10 ? '#c78bff' : G.floor >= 6 ? '#9ee6ae' : '#c7a17a';
  ctx.save();
  ctx.globalAlpha = .2 + .06 * Math.sin(now * 2);
  ctx.strokeStyle = col;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(176, 130, 42 + i * 15, 16 + i * 6, 0, 0, 6.283);
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * 6.283 + now * .08;
    hdDiamond(176 + Math.cos(a) * 56, 130 + Math.sin(a) * 21, 2, col, .6);
  }
  ctx.globalAlpha = 1;
  for (const p of [[92, 84], [260, 84], [92, 176], [260, 176]]) {
    ctx.fillStyle = '#0c0910';
    ctx.fillRect(p[0] - 2, p[1], 4, 8);
    hdFlameMain(p[0], p[1], .34, false);
  }
  ctx.restore();
}

function storyDrawFloor() {
  if (!(STORY && STORY.active && G && G.story && room)) return;
  const ev = room.storyEv;
  if (ev && !room.storyEventDone) {
    if (ev.id === 'whisper') hdDrawWhisperDoor();
    else if (ev.id === 'orin') hdDrawOrin();
    else if (ev.id === 'witch') hdDrawWitch();
    else if (ev.id === 'mirror') hdDrawMirror();
  }
  if (room.storyPuzzle && !room.storyPuzzle.done) hdDrawPuzzle();
  if (room.storyArena && room.storyArena.active) hdDrawArena();
  if (room.storyChase && room.storyChase.active) hdDrawChase();
  hdDrawStartLantern();
  hdDrawEchoProp();
  hdDrawBossSigil();
}

/* ------------------------------ ambient / companion ------------------------------ */
function hdDrawAmbient() {
  const ch = HD_AMB.ch || hdChapterForFloor(G.floor);
  const t = now;
  const n = 20;
  for (let i = 0; i < n; i++) {
    if (ch === 1) {
      const x = ((i * 61 + t * (7 + i % 5)) % (W + 30)) - 15;
      const y = ((i * 43 + t * (11 + i % 4)) % (H + 20)) - 10;
      ctx.globalAlpha = .1 + .18 * (.5 + .5 * Math.sin(t * 1.3 + i));
      ctx.fillStyle = i % 4 ? '#b9a9c9' : '#ffb347';
      ctx.fillRect(x, y, i % 6 ? 1 : 2, 1);
    } else if (ch === 2) {
      const x = (i * 67 + Math.sin(t * .5 + i) * 12) % W;
      const y = (H - ((i * 47 + t * (7 + i % 5)) % (H + 20))) + 6;
      ctx.globalAlpha = .1 + .16 * (.5 + .5 * Math.sin(t * 2 + i));
      ctx.fillStyle = i % 3 ? '#7dff9a' : '#9ee6ae';
      ctx.fillRect(x, y, i % 5 ? 1 : 2, 2);
    } else {
      const x = (i * 71 + Math.sin(t * 1.6 + i * 2.7) * (7 + (i % 6) * 5)) % W;
      const y = (H - ((i * 53 + t * (12 + i % 7)) % (H + 24))) + 4;
      ctx.globalAlpha = .14 + .25 * (.5 + .5 * Math.sin(t * 3 + i));
      ctx.fillStyle = i % 3 ? '#ffb347' : '#ffd98a';
      ctx.fillRect(x, y, i % 5 ? 1 : 2, 1);
    }
  }
  ctx.globalAlpha = 1;
}

function hdDrawMara() {
  if (!ME || ME.down || !STORY.active) return;
  const x = HD_MARA.x, y = HD_MARA.y;
  const t = now;
  hdGlow(x, y, 22, 'rgba(190,235,255,.65)', 'rgba(80,150,255,.14)');
  ctx.strokeStyle = 'rgba(159,211,255,.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 2.5, y - 4.5, 5, 8);
  ctx.beginPath();
  ctx.arc(x, y - 5.5, 2.4, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#9fd3ff';
  ctx.beginPath();
  ctx.arc(x, y - .5, 2.1, 0, 6.283);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - .6, y - 1.2, .8, 0, 6.283);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const a = t * (1.2 + i * .14) + i * 1.7;
    const rr = 7 + i * 3;
    hdDiamond(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .55, 1.3, i % 2 ? '#9fd3ff' : '#fff3cc', .28 + .2 * Math.sin(t * 4 + i));
  }
}

function hdDrawPulseFx() {
  if (!ME) return;
  if (HD_PULSE.t > 0) {
    const p = 1 - HD_PULSE.t / .65;
    const r = 8 + p * 88;
    ctx.globalAlpha = Math.max(0, 1 - p);
    ctx.strokeStyle = '#9fd3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(ME.x, ME.y - 8, r, r * .55, 0, 0, 6.283);
    ctx.stroke();
    ctx.strokeStyle = '#fff3cc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(ME.x, ME.y - 8, r * .7, r * .38, 0, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (HD_PULSE.cd <= 0 && !ME.down) {
    const a = .16 + .06 * Math.sin(now * 3);
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#9fd3ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(ME.x, ME.y - 1, 10, 4, 0, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function hdDrawShardFx() {
  if (HD_SHARD_FX <= 0 || !ME) return;
  const a = Math.min(1, HD_SHARD_FX / 1.2);
  const k = 2.2 - HD_SHARD_FX;
  for (let i = 0; i < 10; i++) {
    const ang = now * 1.6 + i * .63;
    const r = 14 + k * 22;
    const x = ME.x + Math.cos(ang) * r;
    const y = ME.y - 18 + Math.sin(ang) * r * .5 - k * 16;
    hdDiamond(x, y, 2.2, i % 3 ? '#9fd3ff' : '#fff3cc', a * (.5 + .5 * Math.sin(now * 5 + i)));
  }
}

function hdDrawStoryPrompts() {
  if (!ME || ME.down) return;
  const c = room && room.storyChase;
  if (c && c.active) {
    let best = null, bd = 24;
    for (const s of c.seals) {
      if (s.on) continue;
      const d = Math.hypot(ME.x - s.x, ME.y - s.y);
      if (d < bd) { bd = d; best = s; }
    }
    if (best) bubble([['E: LIGHT THE SEAL', '#ffd98a']], best.x, best.y - 18);
  }
  const e = room && room.echo;
  if (e && !e.got && !STORY.done['echo' + G.floor] && Math.hypot(ME.x - e.x, ME.y - e.y) < 30) {
    bubble([['ECHO OF VEYRA', '#9fd3ff'], ['WALK INTO IT', '#fff']], e.x, e.y - 18);
  }
}

function storyDrawFx() {
  if (!(STORY && STORY.active && G && G.story && room)) return;
  if (mode === 'play' || mode === 'dying') {
    hdDrawAmbient();
    hdDrawMara();
    hdDrawPulseFx();
    hdDrawShardFx();
    hdDrawStoryPrompts();
  }
}

/* ------------------------------ HUD ------------------------------ */
function hdStoryHud() {
  ctx.fillStyle = '#120d18';
  ctx.fillRect(0, 0, W, HUD);
  ctx.fillStyle = '#2e2440';
  ctx.fillRect(0, HUD - 1, W, 1);
  ctx.fillStyle = 'rgba(224,164,58,.18)';
  ctx.fillRect(0, HUD - 2, W, 1);

  const hearts = Math.max(1, Math.ceil(ME.maxHp / 2));
  for (let i = 0; i < hearts; i++) {
    S(ME.hp >= 2 * i + 2 ? 'ui_heart_full' : ME.hp === 2 * i + 1 ? 'ui_heart_half' : 'ui_heart_empty', 4 + i * 14, 2);
  }

  tx('CH.' + HD_ROMAN[STORY.chapter] + ' F' + G.floor, 124, 4, '#cbb7e0', 'left', 6);

  S('coin_anim_f' + Math.floor(now * 8) % 4, 190, 5);
  tx(ME.coins, 199, 4, '#ffd34a', 'left', 6);

  for (let i = 0; i < 3; i++) {
    hdDiamond(238 + i * 8, 7, 4, i < (STORY.shards || 0) ? '#9fd3ff' : '#3a3348', 1);
  }

  hdDiamond(283, 7, 5, '#ff8a3c', 1);
  hdDiamond(283, 7, 2.2, '#ffe0a0', 1);
  tx(STORY.embers || 0, 290, 4, '#ffd98a', 'left', 6);

  tx('Q', 332, 4, HD_PULSE.cd <= 0 ? '#9fd3ff' : '#5a526e', 'center', 7);

  if (PL.length > 1) {
    let y = HUD + 3;
    for (const p of PL) {
      if (p === ME || p.gone) continue;
      ctx.fillStyle = 'rgba(8,5,12,.7)';
      ctx.fillRect(2, y - 1, 50, 9);
      tx('P' + (p.slot + 1), 4, y + 1, PC[p.slot], 'left', 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(22, y + 1, 28, 5);
      ctx.fillStyle = p.down ? '#555' : '#e23b3b';
      ctx.fillRect(23, y + 2, 26 * p.hp / p.maxHp, 3);
      y += 10;
    }
  }
}

/* ------------------------------ objective panel ------------------------------ */
function hdObjectivePanel() {
  if (!(STORY.active && G && G.story && room)) return;
  const o = hdObjective();
  if (!o) return;
  ctx.save();
  ctx.font = "7px 'Press Start 2P',monospace";
  const wt = ctx.measureText(o.t).width;
  ctx.font = "6px 'Press Start 2P',monospace";
  const ws = ctx.measureText(o.s || '').width;
  const wh = o.h ? ctx.measureText(o.h).width : 0;
  const w = Math.min(268, Math.max(120, Math.max(wt, ws, wh) + 14));
  const h = o.h ? 34 : 26;
  const x = 6, y = 21;
  ctx.fillStyle = 'rgba(8,5,12,.76)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(224,164,58,.34)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
  ctx.fillStyle = '#e0a43a';
  ctx.fillRect(x, y, 2, h);
  tx(o.t, x + 8, y + 4, '#ffd98a', 'left', 7);
  tx(o.s, x + 8, y + 14, '#e8dcc0', 'left', 6);
  if (o.h) tx(o.h, x + 8, y + 23, '#8f84a8', 'left', 6);
  ctx.restore();
}

function hdTouchPulse() {
  if (!(mode === 'play' && (joy || matchMedia('(pointer:coarse)').matches))) return;
  ctx.globalAlpha = .28;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(268, 156, 18, 0, 6.283);
  ctx.fill();
  ctx.globalAlpha = 1;
  tx('Q', 268, 149, '#fff', 'center', 8);
  if (HD_PULSE.cd > 0) {
    const p = 1 - HD_PULSE.cd / Math.max(3.2, 9 - (STORY.upgrades.lamp || 0) * 2.2);
    ctx.strokeStyle = '#9fd3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(268, 156, 16, -Math.PI / 2, -Math.PI / 2 + 6.283 * Math.max(0, p));
    ctx.stroke();
  }
}

/* ------------------------------ menu art ------------------------------ */
function hdArtSpr(g, name, cx, by, sc, alpha, fl) {
  const a = A[name];
  if (!a || !img.complete) return;
  const w = a[2] * sc, h = a[3] * sc;
  g.save();
  g.globalAlpha = alpha === undefined ? 1 : alpha;
  if (fl) {
    g.translate(cx + w / 2, by - h);
    g.scale(-1, 1);
    g.drawImage(img, a[0], a[1], a[2], a[3], -w / 2, 0, w, h);
  } else {
    g.drawImage(img, a[0], a[1], a[2], a[3], cx - w / 2, by - h, w, h);
  }
  g.restore();
}

function hdArtFlame(g, x, y, sc, t) {
  sc = sc || 1;
  for (let i = 0; i < 3; i++) {
    const w = (12 - i * 3) * sc, h = (18 - i * 4) * sc;
    const ox = Math.sin(t * (6 + i * 1.7) + i * 2.1) * 2 * sc;
    g.fillStyle = i === 0 ? 'rgba(190,50,20,.85)' : i === 1 ? 'rgba(255,140,40,.9)' : 'rgba(255,225,140,.95)';
    g.beginPath();
    g.moveTo(x - w / 2 + ox, y);
    g.quadraticCurveTo(x - w * .65 + ox, y - h * .55, x + ox * .4, y - h);
    g.quadraticCurveTo(x + w * .62 + ox, y - h * .5, x + w / 2 + ox, y);
    g.closePath();
    g.fill();
  }
  const gr = g.createRadialGradient(x, y - 8 * sc, 2, x, y, 30 * sc);
  gr.addColorStop(0, 'rgba(255,180,80,.32)');
  gr.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = gr;
  g.fillRect(x - 32 * sc, y - 34 * sc, 64 * sc, 40 * sc);
}

function hdCampArt(g) {
  const w = 352, h = 84, t = now;
  g.clearRect(0, 0, w, h);
  g.imageSmoothingEnabled = false;
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#070a16');
  sky.addColorStop(1, '#241521');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 34; i++) {
    const x = (i * 79 + 7) % w, y = (i * 37 + 9) % 54;
    g.globalAlpha = .16 + .32 * (0.5 + 0.5 * Math.sin(t * .9 + i * 2));
    g.fillStyle = '#e8dcc0';
    g.fillRect(x, y, i % 7 ? 1 : 2, i % 7 ? 1 : 2);
  }
  g.globalAlpha = 1;
  const mg = g.createRadialGradient(58, 20, 2, 58, 20, 32);
  mg.addColorStop(0, 'rgba(242,230,201,.45)');
  mg.addColorStop(1, 'rgba(224,164,58,0)');
  g.fillStyle = mg;
  g.fillRect(18, -12, 80, 64);
  g.fillStyle = '#e8dcc0';
  g.beginPath();
  g.arc(58, 20, 8, 0, 6.283);
  g.fill();

  g.fillStyle = '#0a0810';
  g.beginPath();
  g.moveTo(0, 66);
  g.quadraticCurveTo(90, 48, 176, 60);
  g.quadraticCurveTo(270, 72, 352, 54);
  g.lineTo(352, 84);
  g.lineTo(0, 84);
  g.closePath();
  g.fill();
  for (let i = 0; i < 7; i++) {
    const x = 10 + i * 53, hh = 22 + (i % 3) * 10;
    g.fillStyle = '#06050b';
    for (let j = 0; j < 3; j++) {
      const yy = 64 - j * hh * .26;
      g.beginPath();
      g.moveTo(x - (9 + j * 2), yy);
      g.lineTo(x, yy - hh * .48);
      g.lineTo(x + (9 + j * 2), yy);
      g.closePath();
      g.fill();
    }
  }
  g.fillStyle = '#0b0810';
  g.fillRect(0, 66, w, h - 66);
  g.fillStyle = '#14101a';
  g.fillRect(0, 66, w, 1);

  g.fillStyle = '#1a1522';
  g.beginPath();
  g.moveTo(278, 70);
  g.lineTo(310, 30);
  g.lineTo(342, 70);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(224,164,58,.26)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(278, 70);
  g.lineTo(310, 30);
  g.lineTo(342, 70);
  g.stroke();
  g.fillStyle = '#0b0810';
  g.beginPath();
  g.moveTo(304, 70);
  g.lineTo(310, 44);
  g.lineTo(317, 70);
  g.closePath();
  g.fill();

  hdArtFlame(g, 176, 74, 1.1, t);
  g.strokeStyle = '#2a1a12';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(166, 76);
  g.lineTo(188, 72);
  g.moveTo(165, 72);
  g.lineTo(186, 77);
  g.stroke();

  hdArtSpr(g, hdHeroKey() + '_idle_anim_f' + Math.floor(t * 5) % 4, 142, 71, 1.3, 1, false);
  if (hdFlag('sparedGK')) hdArtSpr(g, 'ogre_idle_anim_f' + Math.floor(t * 5) % 4, 212, 71, 1.1, .95, true);
  if (hdFlag('orin')) hdArtSpr(g, 'wizzard_m_idle_anim_f' + Math.floor(t * 5) % 4, 246, 71, 1.2, .95, true);
  hdArtSpr(g, 'wizzard_f_idle_anim_f' + Math.floor(t * 5) % 4, 194, 54, .9, .2, false);

  g.save();
  const wg = g.createRadialGradient(194, 50, 1, 194, 50, 12);
  wg.addColorStop(0, 'rgba(190,235,255,.7)');
  wg.addColorStop(1, 'rgba(80,150,255,0)');
  g.fillStyle = wg;
  g.fillRect(180, 36, 28, 28);
  g.fillStyle = '#9fd3ff';
  g.beginPath();
  g.arc(194, 50 + Math.sin(t * 2.2) * 1.5, 2.6, 0, 6.283);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(193.4, 49.4, .9, 0, 6.283);
  g.fill();
  g.restore();

  for (let i = 0; i < 16; i++) {
    const y = 74 - ((t * (10 + i % 7) + i * 17) % 54);
    const x = 176 + Math.sin(t * 1.6 + i * 2.7) * (6 + (i % 6) * 5);
    g.globalAlpha = .25 + .3 * (0.5 + 0.5 * Math.sin(t * 3 + i));
    g.fillStyle = i % 3 ? '#ffb347' : '#ffd98a';
    g.fillRect(x, y, 1, 1);
  }
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(8,5,12,.24)';
  g.fillRect(0, 0, w, 8);
}

function hdEpiArt(g) {
  const w = 352, h = 84, t = now, end = STORY.ending || 'ashes';
  g.clearRect(0, 0, w, h);
  g.imageSmoothingEnabled = false;
  if (end === 'dawn') {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#1a1426');
    sky.addColorStop(.55, '#8a4b32');
    sky.addColorStop(1, '#e0a43a');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    const sg = g.createRadialGradient(176, 62, 3, 176, 62, 90);
    sg.addColorStop(0, 'rgba(255,246,200,.95)');
    sg.addColorStop(.35, 'rgba(255,200,110,.4)');
    sg.addColorStop(1, 'rgba(255,140,50,0)');
    g.fillStyle = sg;
    g.fillRect(60, 0, 232, h);
    g.fillStyle = '#fff3cc';
    g.beginPath();
    g.arc(176, 64, 14, Math.PI, 6.283);
    g.fill();
    g.fillStyle = '#2a1620';
    for (let i = 0; i < 8; i++) {
      const x = i * 52 - 16, ww = 34, hh = 14 + (i % 3) * 5;
      g.fillRect(x, 66 - hh, ww, hh);
      g.beginPath();
      g.moveTo(x - 4, 66 - hh);
      g.lineTo(x + ww / 2, 54 - hh);
      g.lineTo(x + ww + 4, 66 - hh);
      g.closePath();
      g.fill();
    }
    g.fillStyle = '#1a0f16';
    g.beginPath();
    g.moveTo(0, 76);
    g.quadraticCurveTo(140, 64, 352, 72);
    g.lineTo(352, 84);
    g.lineTo(0, 84);
    g.closePath();
    g.fill();
    hdArtSpr(g, hdHeroKey() + '_idle_anim_f' + Math.floor(t * 4) % 4, 128, 76, 1.2, .9, false);
    hdArtSpr(g, 'wizzard_f_idle_anim_f' + Math.floor(t * 4) % 4, 160, 62, .7, .45, false);
    g.fillStyle = '#ffcf6a';
    g.fillRect(146, 64, 3, 5);
    for (let i = 0; i < 12; i++) {
      g.globalAlpha = .15 + .25 * Math.sin(t * 2 + i);
      g.fillStyle = '#fff3cc';
      g.fillRect((i * 61 + t * 5) % w, 70 - (i * 13) % 40, 1, 1);
    }
    g.globalAlpha = 1;
  } else if (end === 'ashes') {
    g.fillStyle = '#16161a';
    g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(80,80,86,.4)');
    gr.addColorStop(1, 'rgba(20,20,24,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, 46);
    for (let i = 0; i < 8; i++) {
      const x = i * 50 - 10, hh = 12 + (i % 3) * 5;
      g.fillStyle = '#0d0d10';
      g.fillRect(x, 68 - hh, 28, hh);
      g.fillRect(x + 4, 68 - hh - 4, 4, 4);
    }
    g.fillStyle = '#08080a';
    g.fillRect(0, 68, w, 16);
    hdArtSpr(g, hdHeroKey() + '_idle_anim_f' + Math.floor(t * 3) % 4, 198, 74, 1.1, .55, true);
    g.fillStyle = '#3a3430';
    g.fillRect(250, 66, 8, 10);
    g.fillStyle = 'rgba(255,180,70,.22)';
    g.beginPath();
    g.arc(254, 64, 12, 0, 6.283);
    g.fill();
    g.fillStyle = '#ffb347';
    g.fillRect(252, 62, 3, 4);
    for (let i = 0; i < 30; i++) {
      g.globalAlpha = .1 + .2 * (.5 + .5 * Math.sin(t + i));
      g.fillStyle = i % 4 ? '#9a9494' : '#c8c0b8';
      g.fillRect((i * 59 + t * (4 + i % 4)) % w, (i * 37 + t * 6) % h, 1, 1);
    }
    g.globalAlpha = 1;
  } else if (end === 'crown') {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#0c0614');
    gr.addColorStop(1, '#2a0f1c');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#06030a';
    for (let i = 0; i < 6; i++) {
      g.fillStyle = '#090510';
      g.fillRect(24 + i * 56, 0, 24, 70);
    }
    g.fillStyle = '#0c0612';
    g.fillRect(138, 52, 76, 24);
    g.fillStyle = '#06030a';
    g.beginPath();
    g.moveTo(154, 66);
    g.lineTo(154, 24);
    g.lineTo(176, 8);
    g.lineTo(198, 24);
    g.lineTo(198, 66);
    g.closePath();
    g.fill();
    const cg = g.createRadialGradient(176, 30, 2, 176, 30, 44);
    cg.addColorStop(0, 'rgba(199,139,255,.5)');
    cg.addColorStop(1, 'rgba(80,20,120,0)');
    g.fillStyle = cg;
    g.fillRect(128, 0, 96, 76);
    g.save();
    g.translate(176, 28);
    g.fillStyle = '#e0a43a';
    g.beginPath();
    g.moveTo(-11, 3);
    g.lineTo(-13, -7);
    g.lineTo(-5, -1);
    g.lineTo(0, -11);
    g.lineTo(5, -1);
    g.lineTo(13, -7);
    g.lineTo(11, 3);
    g.closePath();
    g.fill();
    g.fillStyle = '#c78bff';
    g.fillRect(-1.5, -7, 3, 3);
    g.restore();
    for (let i = 0; i < 4; i++) {
      g.globalAlpha = .25;
      g.fillStyle = '#ffb347';
      g.fillRect(44 + i * 80, 66, 2, 4);
    }
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(120,20,40,.12)';
    g.fillRect(0, 0, w, h);
  } else {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#cfd8e6');
    gr.addColorStop(1, '#e8e4da');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    const wg = g.createRadialGradient(176, 50, 10, 176, 50, 160);
    wg.addColorStop(0, 'rgba(255,255,255,.95)');
    wg.addColorStop(1, 'rgba(220,225,235,.15)');
    g.fillStyle = wg;
    g.fillRect(0, 0, w, h);
    g.globalAlpha = .18;
    hdArtSpr(g, hdHeroKey() + '_idle_anim_f' + Math.floor(t * 3) % 4, 168, 74, 1.3, .35, false);
    hdArtSpr(g, 'wizzard_f_idle_anim_f' + Math.floor(t * 3) % 4, 196, 66, .95, .2, true);
    g.globalAlpha = 1;
    g.fillStyle = '#6f6a64';
    g.fillRect(166, 66, 12, 12);
    g.fillStyle = '#d8cde6';
    g.fillRect(168, 62, 8, 5);
    for (let i = 0; i < 26; i++) {
      g.globalAlpha = .15 + .25 * (.5 + .5 * Math.sin(t * 2 + i));
      g.fillStyle = i % 3 ? '#ffffff' : '#c78bff';
      g.fillRect((i * 67 + t * (4 + i % 3)) % w, 74 - (i * 17 + t * (5 + i % 5)) % 68, 1, 1);
    }
    g.globalAlpha = 1;
  }
  g.fillStyle = 'rgba(0,0,0,.18)';
  g.fillRect(0, 0, w, 6);
}

function hdDrawMenuArt() {
  if (scr === 'camp') {
    const c = document.getElementById('campArt');
    if (c) hdCampArt(c.getContext('2d'));
  } else if (scr === 'epilogue') {
    const c = document.getElementById('epiArt');
    if (c) hdEpiArt(c.getContext('2d'));
  }
}

/* ------------------------------ wrappers / boot ------------------------------ */
const _hdDrawHud = drawHud;
drawHud = function () {
  if (STORY && STORY.active && G && G.story && ME) hdStoryHud();
  else _hdDrawHud();
};

const _hdDraw = draw;
draw = function () {
  _hdDraw();
  if (CINE.active) hdCineFrame();
  if (STORY && STORY.active && G && G.story) {
    if (mode === 'play' || mode === 'dying') {
      hdObjectivePanel();
      hdTouchPulse();
    }
  }
  hdDrawMenuArt();
};

function hdBoot() {
  const s = hdLoadStory();
  if (s) {
    STORY = s;
    STORY.active = !!(s.started || s.active);
    if (STORY.hero) {
      sel = {
        i: Math.max(0, Math.min(CL.length - 1, (STORY.hero.h | 0))),
        g: STORY.hero.g === 'f' ? 'f' : 'm'
      };
    }
  } else {
    STORY = hdDefaultStory();
  }
  mode = 'menu';
  previewScene();
  ui('main');
}

setTimeout(hdBoot, 0);
