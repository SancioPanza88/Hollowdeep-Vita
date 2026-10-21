/* ===== story_cine.js ===== */
/* =====================================================================
   CINEMATIC RENDERER
   ===================================================================== */
const HDCC = document.getElementById('cc');
const hdX = HDCC.getContext('2d');
HDCC.width = W; HDCC.height = H;
hdX.imageSmoothingEnabled = false;
const hdCFlash = document.getElementById('cFlash');

function hdGrad(y0, y1, c0, c1) {
  const g = hdX.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, c0); g.addColorStop(1, c1);
  return g;
}

function hdTile(name, x, y, sc, alpha) {
  const a = A[name]; if (!a) return;
  sc = sc || 1;
  hdX.globalAlpha = alpha === undefined ? 1 : alpha;
  hdX.drawImage(img, a[0], a[1], a[2], a[3], Math.round(x), Math.round(y), a[2] * sc, a[3] * sc);
  hdX.globalAlpha = 1;
}

function hdSpriteC(name, cx, by, sc, fl, alpha, glow) {
  const a = A[name]; if (!a) return;
  sc = sc || 1;
  const w = a[2] * sc, h = a[3] * sc;
  hdX.save();
  hdX.globalAlpha = alpha === undefined ? 1 : alpha;
  if (glow) { hdX.shadowColor = glow; hdX.shadowBlur = 8 * sc; }
  if (fl) {
    hdX.translate(cx + w / 2, by - h);
    hdX.scale(-1, 1);
    hdX.drawImage(img, a[0], a[1], a[2], a[3], -w / 2, 0, w, h);
  } else {
    hdX.drawImage(img, a[0], a[1], a[2], a[3], cx - w / 2, by - h, w, h);
  }
  hdX.restore();
}

function hdStar(x, y, r, c, a) {
  hdX.globalAlpha = a;
  hdX.fillStyle = c || '#fff';
  hdX.fillRect(Math.round(x), Math.round(y), r, r);
  hdX.globalAlpha = 1;
}

function hdMoon(x, y, r) {
  const g = hdX.createRadialGradient(x, y, 2, x, y, r * 2.4);
  g.addColorStop(0, 'rgba(242,230,201,.55)');
  g.addColorStop(.35, 'rgba(224,164,58,.14)');
  g.addColorStop(1, 'rgba(224,164,58,0)');
  hdX.fillStyle = g;
  hdX.fillRect(x - r * 2.5, y - r * 2.5, r * 5, r * 5);
  hdX.fillStyle = '#e8dcc0';
  hdX.beginPath(); hdX.arc(x, y, r, 0, 6.283); hdX.fill();
  hdX.fillStyle = 'rgba(160,140,110,.35)';
  hdX.beginPath(); hdX.arc(x - r * .3, y - r * .2, r * .18, 0, 6.283); hdX.arc(x + r * .24, y + r * .26, r * .12, 0, 6.283); hdX.fill();
}

function hdTorch(x, y, t) {
  const f = 1 + Math.sin(t * 9 + x) * .28 + Math.sin(t * 17 + x * 2) * .12;
  const g = hdX.createRadialGradient(x, y, 2, x, y, 46 * f);
  g.addColorStop(0, 'rgba(255,190,90,.52)');
  g.addColorStop(.4, 'rgba(255,120,40,.16)');
  g.addColorStop(1, 'rgba(255,90,20,0)');
  hdX.fillStyle = g; hdX.fillRect(x - 50, y - 50, 100, 100);
  hdX.fillStyle = '#ffca6a';
  hdX.beginPath(); hdX.ellipse(x, y + Math.sin(t * 12 + x) * 1.5, 2.6 * f, 5.2 * f, 0, 0, 6.283); hdX.fill();
  hdX.fillStyle = '#fff3cc';
  hdX.beginPath(); hdX.ellipse(x, y + 1, 1.2 * f, 2.6 * f, 0, 0, 6.283); hdX.fill();
}

function hdFire(x, y, t, sc) {
  sc = sc || 1;
  const fl = (n) => Math.sin(t * (6 + n * 1.7) + n * 2.1);
  for (let i = 0; i < 3; i++) {
    const w = (13 - i * 3.4) * sc, h = (20 - i * 4) * sc;
    const ox = fl(i + 1) * 2.2 * sc, oy = fl(i + 3) * 1.4 * sc;
    hdX.fillStyle = i === 0 ? 'rgba(190,50,20,.85)' : i === 1 ? 'rgba(255,140,40,.9)' : 'rgba(255,220,120,.95)';
    hdX.beginPath();
    hdX.moveTo(x - w / 2 + ox, y);
    hdX.quadraticCurveTo(x - w * .7 + ox, y - h * .55, x + ox * .4, y - h + oy);
    hdX.quadraticCurveTo(x + w * .65 + ox, y - h * .5, x + w / 2 + ox, y);
    hdX.closePath(); hdX.fill();
  }
  const g = hdX.createRadialGradient(x, y - 8 * sc, 2, x, y - 4 * sc, 60 * sc);
  g.addColorStop(0, 'rgba(255,170,70,.28)');
  g.addColorStop(1, 'rgba(255,120,40,0)');
  hdX.fillStyle = g; hdX.fillRect(x - 66 * sc, y - 70 * sc, 132 * sc, 100 * sc);
}

function hdWisp(x, y, t, sc, col) {
  sc = sc || 1;
  col = col || '#9fd3ff';
  const bob = Math.sin(t * 2.2) * 2.2 * sc;
  const r = 4.2 * sc;
  const g = hdX.createRadialGradient(x, y + bob, 0, x, y + bob, 18 * sc);
  g.addColorStop(0, 'rgba(190,235,255,.75)');
  g.addColorStop(.22, 'rgba(120,190,255,.35)');
  g.addColorStop(1, 'rgba(80,150,255,0)');
  hdX.fillStyle = g; hdX.fillRect(x - 20 * sc, y + bob - 20 * sc, 40 * sc, 40 * sc);
  hdX.fillStyle = col;
  hdX.beginPath(); hdX.arc(x, y + bob, r, 0, 6.283); hdX.fill();
  hdX.fillStyle = '#fff';
  hdX.beginPath(); hdX.arc(x - r * .18, y + bob - r * .2, r * .42, 0, 6.283); hdX.fill();
  for (let i = 0; i < 4; i++) {
    const a = t * (1.1 + i * .13) + i * 1.7;
    const rr = (8 + i * 3.5) * sc;
    hdStar(x + Math.cos(a) * rr, y + bob + Math.sin(a) * rr * .55, 1 * sc, col, .35 + .25 * Math.sin(t * 4 + i));
  }
}

/* ------------------------------ backgrounds ------------------------------ */
function hdBgVoid(t) {
  const g = hdX.createRadialGradient(176, 108, 8, 176, 120, 240);
  g.addColorStop(0, '#241638'); g.addColorStop(.55, '#0d0916'); g.addColorStop(1, '#030205');
  hdX.fillStyle = g; hdX.fillRect(0, 0, W, H);
  for (let i = 0; i < 38; i++) {
    const x = (i * 97 + 31) % W, y = (i * 53 + 17) % H;
    hdStar(x, y, (i % 5) ? 1 : 2, i % 3 ? '#b6a2ff' : '#f2e6c9', .1 + .28 * (0.5 + 0.5 * Math.sin(t * .7 + i)));
  }
  for (let i = 0; i < 12; i++) {
    const x = (i * 73 + Math.sin(t * .16 + i) * 34) % 400 - 24;
    const y = (i * 47 + Math.cos(t * .2 + i * 2) * 16) % 230 + 5;
    const s = 1 + (i % 3);
    hdX.save(); hdX.translate(x, y); hdX.rotate(t * .2 + i);
    hdX.globalAlpha = .18 + .12 * Math.sin(t + i);
    hdX.fillStyle = i % 2 ? '#c78bff' : '#6ec1ff';
    hdX.beginPath(); hdX.moveTo(0, -s * 3); hdX.lineTo(s * 2, 0); hdX.lineTo(0, s * 3); hdX.lineTo(-s * 2, 0); hdX.closePath(); hdX.fill();
    hdX.restore();
  }
  hdX.globalAlpha = 1;
}

function hdBgVillage(t) {
  hdX.fillStyle = hdGrad(0, 150, '#080b18', '#241521'); hdX.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) hdStar((i * 83 + 11) % W, (i * 37 + 13) % 120, (i % 6) ? 1 : 2, '#d8cde6', .18 + .3 * (0.5 + 0.5 * Math.sin(t + i)));
  hdMoon(292, 42, 13);
  const glow = hdX.createLinearGradient(0, 100, 0, 170);
  glow.addColorStop(0, 'rgba(150,40,20,0)'); glow.addColorStop(1, 'rgba(150,40,20,.32)');
  hdX.fillStyle = glow; hdX.fillRect(0, 100, W, 80);
  hdX.fillStyle = '#0a0810';
  for (let i = 0; i < 9; i++) {
    const x = i * 45 - 14, w = 26 + (i % 3) * 8, h = 26 + (i % 4) * 9;
    hdX.fillRect(x, 166 - h, w, h);
    hdX.beginPath(); hdX.moveTo(x - 4, 166 - h); hdX.lineTo(x + w / 2, 152 - h); hdX.lineTo(x + w + 4, 166 - h); hdX.closePath(); hdX.fill();
    if (i === 3) { hdX.fillRect(x + w / 2 - 3, 166 - h - 24, 6, 24); hdX.fillRect(x + w / 2 - 7, 166 - h - 26, 14, 4); }
    if (i % 2 === 0) { hdX.fillStyle = 'rgba(255,160,70,.32)'; hdX.fillRect(x + 7, 146, 3, 4); hdX.fillStyle = '#0a0810'; }
  }
  hdX.fillStyle = '#05040a';
  hdX.beginPath(); hdX.moveTo(0, 190); hdX.quadraticCurveTo(90, 160, 176, 176); hdX.quadraticCurveTo(270, 192, 352, 164); hdX.lineTo(352, 240); hdX.lineTo(0, 240); hdX.closePath(); hdX.fill();
  for (let i = 0; i < 26; i++) {
    const x = (i * 61 + t * (7 + i % 5)) % 400 - 30, y = (i * 43 + t * 12) % 260;
    hdStar(x, y, i % 4 ? 1 : 2, i % 3 ? '#b9a9c9' : '#ffb347', .2 + .3 * Math.sin(t * 2 + i));
  }
}

function hdBgCamp(t) {
  hdX.fillStyle = hdGrad(0, 170, '#070a16', '#1a1018'); hdX.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) hdStar((i * 79 + 7) % W, (i * 41 + 9) % 140, (i % 7) ? 1 : 2, '#e8dcc0', .15 + .32 * (0.5 + 0.5 * Math.sin(t * .9 + i * 2)));
  hdMoon(66, 38, 10);
  hdX.fillStyle = '#0a0810';
  hdX.beginPath(); hdX.moveTo(0, 176); hdX.quadraticCurveTo(120, 154, 240, 170); hdX.quadraticCurveTo(310, 180, 352, 166); hdX.lineTo(352, 240); hdX.lineTo(0, 240); hdX.closePath(); hdX.fill();
  // pine silhouettes
  for (let i = 0; i < 7; i++) {
    const x = 14 + i * 56, h = 34 + (i % 3) * 16;
    hdX.fillStyle = '#06050b';
    for (let j = 0; j < 3; j++) {
      const yy = 176 - j * h * .28;
      hdX.beginPath(); hdX.moveTo(x - (12 + j * 3), yy); hdX.lineTo(x, yy - h * .5); hdX.lineTo(x + (12 + j * 3), yy); hdX.closePath(); hdX.fill();
    }
  }
  // tent
  hdX.fillStyle = '#1a1522'; hdX.beginPath(); hdX.moveTo(262, 186); hdX.lineTo(300, 132); hdX.lineTo(342, 186); hdX.closePath(); hdX.fill();
  hdX.strokeStyle = 'rgba(224,164,58,.28)'; hdX.lineWidth = 1; hdX.beginPath(); hdX.moveTo(262, 186); hdX.lineTo(300, 132); hdX.lineTo(342, 186); hdX.stroke();
  hdX.fillStyle = '#0b0810'; hdX.beginPath(); hdX.moveTo(292, 186); hdX.lineTo(300, 148); hdX.lineTo(310, 186); hdX.closePath(); hdX.fill();
  // ground
  hdX.fillStyle = '#0b0810'; hdX.fillRect(0, 186, W, 54);
  hdX.fillStyle = '#14101a'; hdX.fillRect(0, 186, W, 2);
  // fire
  hdFire(176, 194, t, 1.15);
  // logs
  hdX.strokeStyle = '#2a1a12'; hdX.lineWidth = 3;
  hdX.beginPath(); hdX.moveTo(164, 198); hdX.lineTo(190, 193); hdX.moveTo(162, 193); hdX.lineTo(188, 199); hdX.stroke();
  // sitting silhouettes
  const sit = (x, spr, alpha) => { hdX.globalAlpha = alpha || 1; hdSpriteC(spr, x, 190, 1.35, false, alpha || 1); hdX.globalAlpha = 1; };
  sit(138, hdHeroKey() + '_idle_anim_f' + (Math.floor(t * 5) % 4), 1);
  if (hdFlag('sparedGK')) sit(212, 'ogre_idle_anim_f' + (Math.floor(t * 5) % 4), .95);
  if (hdFlag('orin')) sit(246, 'wizzard_m_idle_anim_f' + (Math.floor(t * 5) % 4), .95);
  hdWisp(202, 156, t, 1, '#9fd3ff');
  // embers
  for (let i = 0; i < 14; i++) {
    const y = 190 - ((t * (12 + i % 7) + i * 19) % 80);
    const x = 176 + Math.sin(t * 1.6 + i * 2.7) * (8 + (i % 6) * 7);
    hdStar(x, y, 1, i % 3 ? '#ffb347' : '#ffd98a', .25 + .35 * (0.5 + 0.5 * Math.sin(t * 3 + i)));
  }
  hdX.fillStyle = 'rgba(8,5,12,.35)'; hdX.fillRect(0, 0, W, 10);
}

function hdBgCrypt(t) {
  hdX.fillStyle = '#08060c'; hdX.fillRect(0, 0, W, H);
  // back wall
  for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) hdTile(r === 2 ? 'wall_mid' : 'wall_top_mid', c * 32 - 6, r * 30 + 16, 2, .8);
  // floor
  for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) hdTile((r + c) % 3 === 0 ? 'floor_2' : 'floor_1', c * 32 - 6, 138 + r * 34, 2, .75);
  // banners
  hdX.globalAlpha = .65;
  hdTile('wall_banner_red', 78, 34, 2); hdTile('wall_banner_blue', 240, 34, 2);
  hdX.globalAlpha = 1;
  hdTorch(48, 74, t); hdTorch(304, 74, t + 1.4);
  // fog
  for (let i = 0; i < 5; i++) {
    const x = ((t * (7 + i * 2) + i * 74) % 440) - 44;
    hdX.globalAlpha = .045;
    hdX.fillStyle = '#b9a9c9';
    hdX.beginPath(); hdX.ellipse(x, 150 + i * 15, 90, 18, 0, 0, 6.283); hdX.fill();
  }
  hdX.globalAlpha = 1;
  // candles
  for (let i = 0; i < 4; i++) { hdTorch(118 + i * 38, 198, t + i * .7); }
}

function hdBgDepths(t) {
  hdX.fillStyle = hdGrad(0, 240, '#07110d', '#0b1a12'); hdX.fillRect(0, 0, W, H);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) hdTile(r === 2 ? 'wall_mid' : 'wall_top_mid', c * 32 - 6, r * 30 + 16, 2, .7);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) hdTile('floor_5', c * 32 - 6, 138 + r * 34, 2, .7);
  hdX.fillStyle = 'rgba(70,160,100,.12)'; hdX.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) {
    const x = 20 + i * 50 + Math.sin(t * .5 + i) * 6;
    const h = 26 + (i * 13) % 46;
    hdX.fillStyle = 'rgba(120,200,130,.16)';
    hdX.fillRect(x, 16, 3, h);
    hdX.globalAlpha = .25;
    hdX.beginPath(); hdX.arc(x + 1.5, 16 + h, 2.2 + Math.sin(t * 2 + i), 0, 6.283); hdX.fill();
    hdX.globalAlpha = 1;
  }
  for (let i = 0; i < 12; i++) {
    const y = 180 - ((t * (6 + i % 5) + i * 23) % 90);
    const x = (i * 67 + Math.sin(t + i) * 14) % W;
    hdX.globalAlpha = .18 + .2 * Math.sin(t * 2 + i);
    hdX.fillStyle = i % 2 ? '#9ee6ae' : '#6cff9a';
    hdX.beginPath(); hdX.arc(x, y, 1 + i % 3, 0, 6.283); hdX.fill();
  }
  hdX.globalAlpha = 1;
  hdTorch(70, 80, t); hdTorch(286, 80, t + 2);
  for (let i = 0; i < 4; i++) {
    const x = ((t * (3 + i) + i * 100) % 430) - 40;
    hdX.globalAlpha = .06; hdX.fillStyle = '#7dff9a';
    hdX.beginPath(); hdX.ellipse(x, 160 + i * 16, 80, 14, 0, 0, 6.283); hdX.fill();
  }
  hdX.globalAlpha = 1;
}

function hdBgHall(t) {
  hdX.fillStyle = hdGrad(0, 240, '#140806', '#2a0f06'); hdX.fillRect(0, 0, W, H);
  // columns
  for (let i = 0; i < 6; i++) {
    const x = i * 64 + 8;
    hdX.fillStyle = '#1d0f0b'; hdX.fillRect(x, 10, 30, 190);
    hdX.fillStyle = '#2a1710'; hdX.fillRect(x + 3, 14, 24, 182);
    hdX.fillStyle = '#120806'; hdX.fillRect(x, 10, 30, 8); hdX.fillRect(x, 190, 30, 10);
    hdX.strokeStyle = 'rgba(224,120,50,.13)'; hdX.lineWidth = 1; hdX.strokeRect(x + 9.5, 20.5, 11, 160);
  }
  // forge glow
  const g = hdX.createRadialGradient(176, 210, 8, 176, 190, 140);
  g.addColorStop(0, 'rgba(255,130,40,.4)'); g.addColorStop(.5, 'rgba(200,60,20,.13)'); g.addColorStop(1, 'rgba(120,20,10,0)');
  hdX.fillStyle = g; hdX.fillRect(0, 60, W, 180);
  // chains
  hdX.strokeStyle = 'rgba(120,100,90,.35)'; hdX.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const x = 40 + i * 68;
    hdX.beginPath(); hdX.moveTo(x, 0);
    for (let y = 0; y < 90; y += 6) hdX.lineTo(x + Math.sin(y * .2 + i) * 2, y);
    hdX.stroke();
  }
  hdX.fillStyle = '#0b0605';
  for (let i = 0; i < 12; i++) { const x = i * 33; hdX.fillRect(x, 200, 22, 40); }
  hdTorch(84, 92, t); hdTorch(268, 92, t + .8);
  for (let i = 0; i < 18; i++) {
    const y = 236 - ((t * (10 + i % 8) + i * 17) % 200);
    const x = (i * 71 + Math.sin(t * 2 + i) * 18) % W;
    hdStar(x, y, 1, i % 3 ? '#ff8a3c' : '#ffd98a', .2 + .35 * Math.sin(t * 3 + i));
  }
}

function hdBgThrone(t, dark) {
  hdX.fillStyle = dark ? hdGrad(0, 240, '#0c0614', '#1a0a1c') : hdGrad(0, 240, '#120a1e', '#24102a'); hdX.fillRect(0, 0, W, H);
  // pillars
  for (let i = 0; i < 4; i++) {
    const x = 18 + i * 100, w = 34;
    hdX.fillStyle = '#090510'; hdX.fillRect(x, 0, w, 200);
    hdX.strokeStyle = 'rgba(199,139,255,.12)'; hdX.lineWidth = 1; hdX.strokeRect(x + 6.5, 12.5, w - 13, 176);
  }
  // steps
  for (let i = 0; i < 5; i++) {
    hdX.fillStyle = i % 2 ? '#150b1a' : '#100713';
    hdX.fillRect(60 - i * 10, 156 + i * 10, 232 + i * 20, 14);
  }
  // throne
  hdX.fillStyle = '#06030a';
  hdX.beginPath(); hdX.moveTo(150, 164); hdX.lineTo(150, 74); hdX.lineTo(176, 48); hdX.lineTo(202, 74); hdX.lineTo(202, 164); hdX.closePath(); hdX.fill();
  hdX.fillStyle = '#0c0612';
  hdX.fillRect(132, 130, 88, 34);
  hdX.strokeStyle = 'rgba(224,164,58,.25)'; hdX.lineWidth = 1; hdX.strokeRect(132.5, 130.5, 87, 33);
  // crown glow
  const g = hdX.createRadialGradient(176, 64, 2, 176, 64, 72);
  g.addColorStop(0, 'rgba(199,139,255,.42)'); g.addColorStop(.5, 'rgba(140,60,220,.12)'); g.addColorStop(1, 'rgba(80,20,120,0)');
  hdX.fillStyle = g; hdX.fillRect(100, 0, 152, 140);
  // candles
  for (let i = 0; i < 6; i++) hdTorch(40 + i * 55, 190, t + i * .6);
  // floating dust
  for (let i = 0; i < 24; i++) {
    const x = (i * 53 + Math.sin(t * .4 + i) * 20) % W;
    const y = (i * 37 + Math.cos(t * .5 + i * 2) * 18) % H;
    hdStar(x, y, 1, i % 3 ? '#b6a2ff' : '#ffd98a', .08 + .18 * (0.5 + 0.5 * Math.sin(t + i)));
  }
}

function hdBgMirror(t) {
  hdX.fillStyle = hdGrad(0, 240, '#0b0a12', '#171320'); hdX.fillRect(0, 0, W, H);
  for (let i = 0; i < 24; i++) hdStar((i * 71 + 9) % W, (i * 47 + 17) % 130, 1, '#b9a9c9', .12 + .2 * Math.sin(t + i));
  hdX.fillStyle = '#0b0810';
  hdX.beginPath(); hdX.moveTo(0, 196); hdX.quadraticCurveTo(130, 178, 220, 194); hdX.quadraticCurveTo(300, 204, 352, 188); hdX.lineTo(352, 240); hdX.lineTo(0, 240); hdX.closePath(); hdX.fill();
  // mirror
  hdX.save();
  hdX.translate(176, 112);
  const g = hdX.createLinearGradient(0, -66, 0, 66);
  g.addColorStop(0, '#2c2a44'); g.addColorStop(.5, '#171528'); g.addColorStop(1, '#0e0c18');
  hdX.fillStyle = '#0a0810';
  hdX.beginPath(); hdX.ellipse(0, 0, 46, 68, 0, 0, 6.283); hdX.fill();
  hdX.fillStyle = g;
  hdX.beginPath(); hdX.ellipse(0, 0, 39, 60, 0, 0, 6.283); hdX.fill();
  hdX.globalAlpha = .5;
  hdX.fillStyle = '#3d5a7a';
  hdX.beginPath(); hdX.ellipse(0, 18, 35, 34, 0, 0, 6.283); hdX.fill();
  hdX.fillStyle = '#8fb8d8';
  for (let i = 0; i < 5; i++) hdX.fillRect(-24 + i * 11, -22 + (i % 2) * 9, 5, 22 + (i % 3) * 8);
  hdX.globalAlpha = 1;
  // cracks
  hdX.strokeStyle = 'rgba(199,139,255,.35)'; hdX.lineWidth = 1;
  hdX.beginPath(); hdX.moveTo(-18, -46); hdX.lineTo(-2, -12); hdX.lineTo(-12, 12); hdX.lineTo(4, 38); hdX.stroke();
  hdX.restore();
  const glow = hdX.createRadialGradient(176, 112, 10, 176, 112, 90);
  glow.addColorStop(0, 'rgba(110,193,255,.16)'); glow.addColorStop(1, 'rgba(110,193,255,0)');
  hdX.fillStyle = glow; hdX.fillRect(80, 20, 200, 200);
  // ash
  for (let i = 0; i < 26; i++) {
    const x = (i * 59 + t * (6 + i % 4)) % 400 - 20;
    const y = (i * 31 + t * 9) % 250;
    hdStar(x, y, 1, i % 4 ? '#b9a9c9' : '#ffb347', .15 + .2 * Math.sin(t + i));
  }
}

function hdBgDoor(t) {
  hdX.fillStyle = hdGrad(0, 240, '#0b0710', '#1a0f16'); hdX.fillRect(0, 0, W, H);
  hdTile('wall_top_mid', 0, 0, 2, .5); hdTile('wall_top_mid', 96, 0, 2, .5); hdTile('wall_top_mid', 192, 0, 2, .5); hdTile('wall_top_mid', 288, 0, 2, .5);
  // arch
  hdX.fillStyle = '#050308';
  hdX.beginPath(); hdX.moveTo(118, 220); hdX.lineTo(118, 96); hdX.quadraticCurveTo(176, 32, 234, 96); hdX.lineTo(234, 220); hdX.closePath(); hdX.fill();
  hdX.strokeStyle = 'rgba(224,164,58,.22)'; hdX.lineWidth = 2; hdX.stroke();
  // door boards
  hdX.fillStyle = '#1a1010'; hdX.fillRect(128, 102, 96, 118);
  hdX.strokeStyle = '#0a0608'; hdX.lineWidth = 1;
  for (let i = 0; i < 6; i++) { hdX.beginPath(); hdX.moveTo(128, 108 + i * 20); hdX.lineTo(224, 108 + i * 20); hdX.stroke(); }
  // mouths
  for (let i = 0; i < 7; i++) {
    const x = 143 + (i % 3) * 32, y = 124 + Math.floor(i / 3) * 33;
    const open = 2 + 2.2 * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7));
    hdX.fillStyle = '#3a0a0c';
    hdX.beginPath(); hdX.ellipse(x, y, 7, open, 0, 0, 6.283); hdX.fill();
    hdX.fillStyle = '#0a0406';
    hdX.beginPath(); hdX.ellipse(x, y, 4, Math.max(1, open * .55), 0, 0, 6.283); hdX.fill();
    hdX.fillStyle = '#d8c9a8';
    hdX.fillRect(x - 5, y - open - 1, 2, 1); hdX.fillRect(x + 3, y - open - 1, 2, 1);
  }
  // whispers
  for (let i = 0; i < 14; i++) {
    const a = t * .7 + i * 1.9;
    const x = 176 + Math.cos(a) * (26 + (i % 5) * 8);
    const y = 160 + Math.sin(a * .8) * (18 + (i % 4) * 7);
    hdStar(x, y, 1, i % 3 ? '#d87867' : '#ffd98a', .12 + .25 * (0.5 + 0.5 * Math.sin(t * 2 + i)));
  }
  hdX.fillStyle = '#050308'; hdX.fillRect(0, 220, W, 20);
}

function hdBgResin(t) {
  hdX.fillStyle = hdGrad(0, 240, '#120d07', '#241408'); hdX.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) {
    const x = 40 + i * 35, h = 70 + (i * 29) % 100;
    hdX.fillStyle = 'rgba(90,60,20,.25)';
    hdX.fillRect(x, 220 - h, 5, h);
  }
  const g = hdX.createRadialGradient(176, 122, 10, 176, 122, 90);
  g.addColorStop(0, 'rgba(255,190,80,.28)'); g.addColorStop(.5, 'rgba(200,120,30,.12)'); g.addColorStop(1, 'rgba(120,60,10,0)');
  hdX.fillStyle = g; hdX.fillRect(70, 20, 212, 210);
  // cocoon
  hdX.fillStyle = 'rgba(170,110,40,.45)';
  hdX.beginPath(); hdX.ellipse(176, 124, 30, 62, 0, 0, 6.283); hdX.fill();
  hdX.strokeStyle = 'rgba(255,220,140,.3)'; hdX.lineWidth = 1;
  for (let i = 0; i < 4; i++) { hdX.beginPath(); hdX.ellipse(176, 124, 18 + i * 4, 44 + i * 6, .2, 0, 6.283); hdX.stroke(); }
  // suspended scholar
  hdSpriteC('wizzard_m_idle_anim_f' + (Math.floor(t * 3) % 4), 176, 168, 1.5, false, .55);
  // amber drips
  for (let i = 0; i < 10; i++) {
    const x = 146 + (i * 23) % 70, y = 60 + ((t * (4 + i % 3) + i * 13) % 108);
    hdX.globalAlpha = .5; hdX.fillStyle = '#d6a24a';
    hdX.beginPath(); hdX.ellipse(x, y, 1.5, 3.6, 0, 0, 6.283); hdX.fill();
  }
  hdX.globalAlpha = 1;
}

function hdBgForge(t) {
  hdX.fillStyle = hdGrad(0, 240, '#160805', '#2a0f07'); hdX.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) {
    const x = i * 80;
    hdX.fillStyle = '#1c0d08'; hdX.fillRect(x, 0, 14, 180);
  }
  // anvil
  hdX.fillStyle = '#0a0606'; hdX.fillRect(230, 158, 54, 12); hdX.fillRect(248, 170, 18, 22); hdX.fillRect(240, 192, 34, 8);
  // forge
  hdX.fillStyle = '#0a0505'; hdX.fillRect(76, 130, 90, 62);
  hdX.fillStyle = '#2a0f06'; hdX.fillRect(84, 138, 74, 46);
  hdFire(121, 178, t, 1.3);
  // sparks
  for (let i = 0; i < 26; i++) {
    const x = 121 + Math.sin(t * 4 + i * 2.1) * (10 + (i % 6) * 9);
    const y = 180 - ((t * (20 + i % 12) + i * 13) % 130);
    hdStar(x, y, 1, i % 3 ? '#ffb347' : '#fff3cc', .3 + .35 * Math.sin(t * 5 + i));
  }
  hdTorch(300, 92, t);
  hdX.fillStyle = '#0b0808'; hdX.fillRect(0, 200, W, 40);
}

function hdBgDawn(t) {
  hdX.fillStyle = hdGrad(0, 200, '#1a1426', '#e0a43a'); hdX.fillRect(0, 0, W, H);
  const g = hdX.createRadialGradient(176, 190, 10, 176, 190, 220);
  g.addColorStop(0, 'rgba(255,236,180,.85)'); g.addColorStop(.35, 'rgba(255,180,80,.3)'); g.addColorStop(1, 'rgba(255,120,40,0)');
  hdX.fillStyle = g; hdX.fillRect(0, 0, W, H);
  hdX.fillStyle = '#2a1620';
  for (let i = 0; i < 8; i++) {
    const x = i * 52 - 16, w = 34, h = 22 + (i % 3) * 8;
    hdX.fillRect(x, 166 - h, w, h);
    hdX.beginPath(); hdX.moveTo(x - 4, 166 - h); hdX.lineTo(x + w / 2, 152 - h); hdX.lineTo(x + w + 4, 166 - h); hdX.closePath(); hdX.fill();
  }
  hdX.fillStyle = '#1a0f16';
  hdX.beginPath(); hdX.moveTo(0, 190); hdX.quadraticCurveTo(140, 172, 352, 186); hdX.lineTo(352, 240); hdX.lineTo(0, 240); hdX.closePath(); hdX.fill();
  // rays
  hdX.globalAlpha = .09; hdX.fillStyle = '#fff3cc';
  for (let i = 0; i < 9; i++) { hdX.beginPath(); hdX.moveTo(176, 200); hdX.lineTo(176 + Math.cos(i * .7 + t * .05) * 260, 200 - Math.sin(i * .7 + t * .05) * 260); hdX.lineTo(176 + Math.cos(i * .7 + .2 + t * .05) * 260, 200 - Math.sin(i * .7 + .2 + t * .05) * 260); hdX.closePath(); hdX.fill(); }
  hdX.globalAlpha = 1;
  for (let i = 0; i < 20; i++) {
    const y = 220 - ((t * (4 + i % 5) + i * 29) % 180);
    hdStar((i * 61 + Math.sin(t + i) * 12) % W, y, 1, '#fff3cc', .15 + .25 * Math.sin(t * 2 + i));
  }
}

function hdBgAshes(t) {
  hdX.fillStyle = hdGrad(0, 240, '#16161a', '#2a2626'); hdX.fillRect(0, 0, W, H);
  hdX.fillStyle = 'rgba(200,200,200,.06)';
  hdX.beginPath(); hdX.arc(176, 100, 60, 0, 6.283); hdX.fill();
  hdX.fillStyle = '#0d0d10';
  for (let i = 0; i < 8; i++) { const x = i * 50 - 10, h = 18 + (i % 3) * 7; hdX.fillRect(x, 172 - h, 28, h); }
  hdX.fillStyle = '#08080a'; hdX.fillRect(0, 196, W, 44);
  for (let i = 0; i < 40; i++) {
    const x = (i * 59 + t * (5 + i % 5)) % 400 - 20;
    const y = (i * 37 + t * 8) % 250;
    hdStar(x, y, 1, i % 4 ? '#9a9494' : '#c8c0b8', .1 + .22 * (0.5 + 0.5 * Math.sin(t + i)));
  }
  // lone lantern
  hdX.fillStyle = '#3a3430'; hdX.fillRect(250, 184, 8, 10);
  hdX.fillStyle = 'rgba(255,180,70,.25)'; hdX.beginPath(); hdX.arc(254, 182, 14, 0, 6.283); hdX.fill();
  hdX.fillStyle = '#ffb347'; hdX.fillRect(252, 179, 4, 5);
}

function hdBgCrown(t) {
  hdBgThrone(t, true);
  hdX.fillStyle = 'rgba(120,20,40,.12)'; hdX.fillRect(0, 0, W, H);
  // crown
  hdX.save(); hdX.translate(176, 66);
  hdX.fillStyle = '#e0a43a';
  hdX.beginPath(); hdX.moveTo(-16, 6); hdX.lineTo(-20, -10); hdX.lineTo(-8, -2); hdX.lineTo(0, -16); hdX.lineTo(8, -2); hdX.lineTo(20, -10); hdX.lineTo(16, 6); hdX.closePath(); hdX.fill();
  hdX.fillStyle = '#c78bff'; hdX.fillRect(-2, -10, 4, 4);
  hdX.restore();
  hdX.fillStyle = 'rgba(255,20,40,' + (.05 + .03 * Math.sin(t * 3)) + ')'; hdX.fillRect(0, 0, W, H);
}

function hdBgForgotten(t) {
  hdX.fillStyle = hdGrad(0, 240, '#cfd8e6', '#e8e4da'); hdX.fillRect(0, 0, W, H);
  const g = hdX.createRadialGradient(176, 120, 20, 176, 120, 220);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(220,225,235,.2)');
  hdX.fillStyle = g; hdX.fillRect(0, 0, W, H);
  // fading silhouettes
  hdX.globalAlpha = .13; hdX.fillStyle = '#5a5a6a';
  hdSpriteC(hdHeroKey() + '_idle_anim_f' + (Math.floor(t * 3) % 4), 176, 186, 1.7, false, .2);
  hdSpriteC('wizzard_f_idle_anim_f' + (Math.floor(t * 3) % 4), 208, 186, 1.4, true, .1);
  hdX.globalAlpha = 1;
  // lantern on ground
  hdX.fillStyle = '#6f6a64'; hdX.fillRect(168, 192, 12, 14);
  hdX.fillStyle = '#d8cde6'; hdX.fillRect(170, 188, 8, 6);
  for (let i = 0; i < 26; i++) {
    const x = (i * 67 + t * (5 + i % 4)) % 400 - 20;
    const y = 200 - ((t * (6 + i % 6) + i * 17) % 190);
    hdStar(x, y, 1, i % 3 ? '#ffffff' : '#c78bff', .18 + .3 * (0.5 + 0.5 * Math.sin(t * 2 + i)));
  }
}

function hdDrawBg(name, t) {
  switch (name) {
    case 'village': hdBgVillage(t); break;
    case 'camp': hdBgCamp(t); break;
    case 'crypt': hdBgCrypt(t); break;
    case 'depths': hdBgDepths(t); break;
    case 'hall': hdBgHall(t); break;
    case 'throne': hdBgThrone(t); break;
    case 'mirror': hdBgMirror(t); break;
    case 'door': hdBgDoor(t); break;
    case 'resin': hdBgResin(t); break;
    case 'forge': hdBgForge(t); break;
    case 'dawn': hdBgDawn(t); break;
    case 'ashes': hdBgAshes(t); break;
    case 'crown': hdBgCrown(t); break;
    case 'forgotten': hdBgForgotten(t); break;
    default: hdBgVoid(t);
  }
}

/* ------------------------------ actors ------------------------------ */
function hdActorSprite(a, t) {
  const sc = a.sc || 1.8;
  const alpha = a.a === undefined ? 1 : a.a;
  const fl = !!a.fl;
  const glow = a.glow || null;
  const fr = Math.floor(t * (a.fast ? 9 : 5.5) + (a.ph || 0)) % 4;
  if (a.k === 'mara') {
    hdSpriteC('wizzard_f_idle_anim_f' + fr, a.x, a.y, sc * .8, fl, alpha * .22, '#6ec1ff');
    hdWisp(a.x, a.y - 28 * sc * .55, t, sc * .8, '#9fd3ff');
    return;
  }
  if (a.k === 'hero') {
    hdSpriteC(hdHeroKey() + '_' + (a.run ? 'run' : 'idle') + '_anim_f' + fr, a.x, a.y, sc, fl, alpha, glow);
    return;
  }
  if (a.k === 'orin') { hdSpriteC('wizzard_m_idle_anim_f' + fr, a.x, a.y, sc, fl, alpha, '#ffd98a'); return; }
  if (a.k === 'witch') { hdSpriteC('wizzard_f_idle_anim_f' + fr, a.x, a.y, sc, fl, alpha, '#ff5a3c'); return; }
  if (a.k === 'gk') { hdSpriteC('ogre_idle_anim_f' + fr, a.x, a.y, sc * 1.15, fl, alpha, '#c7a17a'); return; }
  if (a.k === 'saint') { hdSpriteC('big_zombie_idle_anim_f' + fr, a.x, a.y, sc * 1.15, fl, alpha, '#9ee6ae'); return; }
  if (a.k === 'king') { hdSpriteC('big_demon_idle_anim_f' + fr, a.x, a.y, sc * 1.15, fl, alpha, '#c78bff'); return; }
  if (a.k === 'doc') { hdSpriteC('doc_idle_anim_f' + fr, a.x, a.y, sc, fl, alpha, glow); return; }
  if (a.spr) { hdSpriteC(a.spr + (a.anim ? '_anim_f' + fr : ''), a.x, a.y, sc, fl, alpha, glow); }
}

function hdDrawActors(t) {
  for (const a of CINE.actors) {
    if (!a) continue;
    if (a.k === 'king' && a.rise !== false) {
      hdX.save(); hdX.globalAlpha = .18; hdX.fillStyle = '#c78bff';
      hdX.beginPath(); hdX.ellipse(a.x, a.y + 2, 28, 5, 0, 0, 6.283); hdX.fill(); hdX.restore();
    }
    hdActorSprite(a, t);
    if (a.k === 'king') hdWisp(a.x + 26, a.y - 74, t * .6, .7, '#c78bff');
  }
}

/* ------------------------------ particles ------------------------------ */
function hdEmit(fx, t) {
  const rnd = Math.random;
  if (fx === 'ash') {
    for (let i = 0; i < 2; i++) CINE.parts.push({ k: 'ash', x: rnd() * W, y: -6, vx: -8 - rnd() * 14, vy: 10 + rnd() * 16, s: 1 + (rnd() < .3 ? 1 : 0), l: 1, c: rnd() < .3 ? '#ffb347' : '#b9a9c9' });
  } else if (fx === 'embers') {
    for (let i = 0; i < 2; i++) CINE.parts.push({ k: 'ember', x: 120 + rnd() * 120, y: 210 + rnd() * 20, vx: (rnd() - .5) * 14, vy: -18 - rnd() * 26, s: 1 + (rnd() < .4 ? 1 : 0), l: 1, c: rnd() < .4 ? '#ffd98a' : '#ff8a3c' });
  } else if (fx === 'fog') {
    if (rnd() < .09) CINE.parts.push({ k: 'fog', x: rnd() * W, y: 80 + rnd() * 130, vx: 6 + rnd() * 10, vy: 0, s: 60 + rnd() * 80, l: 1, c: 'rgba(180,170,200,.045)' });
  } else if (fx === 'rain') {
    for (let i = 0; i < 3; i++) CINE.parts.push({ k: 'rain', x: rnd() * (W + 30), y: -8, vx: -26, vy: 150 + rnd() * 90, s: 6 + rnd() * 10, l: 1, c: 'rgba(140,190,220,.25)' });
  } else if (fx === 'spores') {
    for (let i = 0; i < 2; i++) CINE.parts.push({ k: 'spore', x: rnd() * W, y: 40 + rnd() * 180, vx: (rnd() - .5) * 8, vy: -3 - rnd() * 8, s: 1 + (rnd() < .25 ? 1 : 0), l: 1, c: rnd() < .5 ? '#7dff9a' : '#9ee6ae' });
  } else if (fx === 'void') {
    if (rnd() < .2) CINE.parts.push({ k: 'shard', x: rnd() * W, y: H + 8, vx: (rnd() - .5) * 10, vy: -10 - rnd() * 18, s: 1 + rnd() * 2, l: 1, c: rnd() < .5 ? '#c78bff' : '#6ec1ff' });
  } else if (fx === 'dust') {
    if (rnd() < .4) CINE.parts.push({ k: 'dust', x: rnd() * W, y: 20 + rnd() * 200, vx: (rnd() - .5) * 5, vy: -2 - rnd() * 4, s: 1, l: 1, c: '#d8cde6' });
  } else if (fx === 'snow') {
    for (let i = 0; i < 2; i++) CINE.parts.push({ k: 'snow', x: rnd() * W, y: -4, vx: (rnd() - .5) * 10, vy: 8 + rnd() * 14, s: 1 + (rnd() < .3 ? 1 : 0), l: 1, c: '#fff' });
  }
}

function hdUpdateParts(dt, t) {
  if (CINE.fx) hdEmit(CINE.fx, t);
  for (const p of CINE.parts) {
    p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
    if (p.k === 'ash' || p.k === 'snow') p.x += Math.sin(t * 1.7 + p.y * .04) * 7 * dt;
    if (p.k === 'ember') p.x += Math.sin(t * 2.3 + p.y * .05) * 5 * dt;
    if (p.k === 'shard') p.y -= 2 * dt;
  }
  CINE.parts = CINE.parts.filter(p => p.y > -20 && p.y < H + 20 && p.x > -30 && p.x < W + 30);
  if (CINE.parts.length > 110) CINE.parts.splice(0, CINE.parts.length - 110);
}

function hdDrawParts() {
  for (const p of CINE.parts) {
    if (p.k === 'rain') {
      hdX.strokeStyle = p.c; hdX.lineWidth = 1;
      hdX.beginPath(); hdX.moveTo(p.x, p.y); hdX.lineTo(p.x + 2, p.y + p.s); hdX.stroke();
    } else if (p.k === 'fog') {
      hdX.fillStyle = p.c;
      hdX.beginPath(); hdX.ellipse(p.x, p.y, p.s, p.s * .22, 0, 0, 6.283); hdX.fill();
    } else if (p.k === 'shard') {
      hdX.fillStyle = p.c; hdX.globalAlpha = .45;
      hdX.save(); hdX.translate(p.x, p.y); hdX.rotate(p.y * .02);
      hdX.beginPath(); hdX.moveTo(0, -p.s * 2); hdX.lineTo(p.s, 0); hdX.lineTo(0, p.s * 2); hdX.lineTo(-p.s, 0); hdX.closePath(); hdX.fill();
      hdX.restore(); hdX.globalAlpha = 1;
    } else {
      hdStar(p.x, p.y, p.s, p.c, p.k === 'dust' ? .25 : .55);
    }
  }
}

/* ------------------------------ frame ------------------------------ */
function hdCineFrame() {
  if (!CINE.active) { CINE.last = 0; return; }
  const nowMs = performance.now();
  let dt = CINE.last ? (nowMs - CINE.last) / 1000 : 1 / 60;
  CINE.last = nowMs;
  dt = Math.max(0, Math.min(.05, dt));
  CINE.t += dt;
  if (CINE.shake > 0) CINE.shake = Math.max(0, CINE.shake - dt * 1.6);
  if (CINE.flash > 0) CINE.flash = Math.max(0, CINE.flash - dt * 2.2);
  hdCFlash.style.opacity = CINE.flash.toFixed(3);
  if (CINE.typing) {
    CINE.revealT += dt;
    const n = Math.floor(CINE.revealT * 56);
    if (n !== CINE.shown) {
      CINE.shown = Math.min(CINE.full.length, n);
      cEl('cText').textContent = CINE.full.slice(0, CINE.shown);
      if (CINE.shown >= CINE.full.length) {
        CINE.typing = false;
        cEl('cNext').classList.add('show');
      }
    }
  }
  if (CINE.capOn && CINE.capAuto > 0) {
    CINE.capT += dt;
    if (CINE.capT >= CINE.capAuto) { hdAdvance(); return; }
  }
  hdDrawCine(dt);
}

function hdDrawCine(dt) {
  const t = CINE.t;
  hdX.setTransform(1, 0, 0, 1, 0, 0);
  hdX.globalAlpha = 1;
  hdX.clearRect(0, 0, W, H);
  const shake = CINE.shake > 0 ? (Math.random() - .5) * CINE.shake * 10 : 0;
  const camX = Math.sin(t * .18) * 3;
  const camY = Math.cos(t * .13) * 2;
  hdX.save();
  hdX.translate(camX + shake, camY);
  hdDrawBg(CINE.bg, t);
  hdUpdateParts(dt, t);
  hdDrawActors(t);
  hdDrawParts();
  hdX.restore();
  // cinematic bars + bottom gradient
  hdX.fillStyle = 'rgba(0,0,0,.92)';
  hdX.fillRect(0, 0, W, 9);
  hdX.fillRect(0, H - 22, W, 22);
  const g = hdX.createLinearGradient(0, 138, 0, 210);
  g.addColorStop(0, 'rgba(4,2,8,0)'); g.addColorStop(1, 'rgba(4,2,8,.72)');
  hdX.fillStyle = g; hdX.fillRect(0, 138, W, 72);
  hdX.fillStyle = 'rgba(224,164,58,.18)';
  hdX.fillRect(0, 9, W, 1);
  hdX.fillRect(0, H - 22, W, 1);
}
