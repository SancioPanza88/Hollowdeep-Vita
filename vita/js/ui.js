/* Hollowdeep Vita — overlay renderer.
 *
 * The browser build draws its menus as HTML/CSS and the cinematic layer as a
 * DOM dialogue box. There is no HTML renderer in the native port, so this file
 * lays those same element trees out on the 352x240 canvas with the game's own
 * pixel font and palette. Game logic is untouched: it still fills #ov/#cine,
 * toggles classes and listens for keys exactly as before.
 */
(function () {
  'use strict';

  var W = 352, H = 240;
  var FG = '#f2e6c9', AC = '#e0a43a', AC2 = '#ffd98a', DIM = '#8f84a8', BG = '#0b0810';
  var RED = '#9f1a20';
  var FONT = "'Press Start 2P',monospace";

  var doc = document;
  var overlayEl = doc.createElement('canvas');
  overlayEl.width = W;
  overlayEl.height = H;
  var ctx = overlayEl.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function font(size) { ctx.font = size + 'px ' + FONT; }
  function measure(s, size) { font(size); return ctx.measureText(String(s)).width; }

  function text(s, x, y, size, color, align, baseline) {
    if (s === undefined || s === null) return 0;
    s = String(s);
    if (!s.length) return 0;
    font(size);
    ctx.textAlign = align || 'left';
    ctx.textBaseline = baseline || 'top';
    ctx.fillStyle = '#000';
    ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = color || FG;
    ctx.fillText(s, x, y);
    return ctx.measureText(s).width;
  }

  function wrap(s, size, maxW) {
    var words = String(s).split(/\s+/), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var t = cur ? cur + ' ' + words[i] : words[i];
      if (measure(t, size) > maxW && cur) { lines.push(cur); cur = words[i]; }
      else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function box(x, y, w, h, fill, border) {
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
    if (border) { ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
  }

  function gradBox(x, y, w, h, top, bottom, border) {
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    if (border) { ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
  }

  /* --------------------------------------------------------------- blocks */

  function elLines(el) {
    var lines = [[]];
    (function walk(node, color) {
      for (var i = 0; i < node.childNodes.length; i++) {
        var c = node.childNodes[i];
        if (c.nodeType === 3) {
          var t = c.data.replace(/\s+/g, ' ');
          if (t.trim() || lines[lines.length - 1].length) lines[lines.length - 1].push({ t: t, c: color });
        } else if (c.nodeType === 1) {
          if (c._tag === 'br') { lines.push([]); continue; }
          var col = color;
          if (c.classList.contains('ac')) col = AC2;
          else if (c.classList.contains('dim')) col = DIM;
          walk(c, col);
        }
      }
    })(el, null);
    return lines.filter(function (l) {
      for (var i = 0; i < l.length; i++) if (l[i].t.trim()) return true;
      return false;
    });
  }

  function inlineWidth(line, size) {
    var w = 0;
    for (var i = 0; i < line.length; i++) w += measure(line[i].t, size);
    return w;
  }

  function drawLines(lines, x, y, w, size, color, align) {
    var a = align || 'center', lh = size + 3, cy = y;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i], lw = inlineWidth(line, size);
      if (lw > w && line.length === 1) {
        var parts = wrap(line[0].t.trim(), size, w);
        for (var p = 0; p < parts.length; p++) {
          text(parts[p], a === 'center' ? x + w / 2 : x, cy, size, line[0].c || color, a);
          cy += lh;
        }
        continue;
      }
      var cx = a === 'center' ? x + (w - lw) / 2 : x;
      for (var k = 0; k < line.length; k++) {
        cx += text(line[k].t, cx, cy, size, line[k].c || color, 'left');
      }
      cy += lh;
    }
    return cy - y;
  }

  function mbText(el) {
    var l = el.querySelector('.mnLbl') || el.querySelector('.t') || el.querySelector('b');
    return (l ? l.textContent : el.textContent).replace(/\s+/g, ' ').trim();
  }

  function measureEl(el, w) {
    if (!el || el.nodeType === 3) return 0;
    var cl = el.classList;
    if (cl.contains('fx') || cl.contains('langSwitch') || el._tag === 'svg') return 0;
    if (cl.contains('fx') || cl.contains('mnStat') || cl.contains('mnProgress') ||
        cl.contains('mnMobileBrand') || cl.contains('mnRule') || cl.contains('mnDesc') ||
        cl.contains('mnFootL') || cl.contains('menuMeta')) return 0;
    if (cl.contains('logo')) return 22;
    if (cl.contains('mnLogo')) return 16;
    if (cl.contains('mnKick') || cl.contains('mnSub') || cl.contains('mnCardK')) return 7;
    if (cl.contains('mnCardT')) return 11;
    if (cl.contains('mnCardD')) return 16;
    if (cl.contains('mnTopT')) return 8;
    if (cl.contains('mnTopS')) return 8;
    if (cl.contains('h2')) return 16;
    if (cl.contains('sub')) return 10;
    if (cl.contains('foot')) return 12;
    if (cl.contains('big')) return 18;
    if (cl.contains('mbs')) {
      var row = cl.contains('row');
      var bs = el.querySelectorAll('.mb');
      if (row) return bs.length ? 14 : 0;
      return bs.length * 14;
    }
    if (cl.contains('cards')) return 92;
    if (cl.contains('slots')) return 30;
    if (cl.contains('tx') || cl.contains('warnline') || cl.contains('quote') || cl.contains('disc')) {
      var lines = elLines(el), n = 0;
      for (var i = 0; i < lines.length; i++) {
        n += Math.max(1, wrap(lines[i].map(function (r) { return r.t; }).join('').trim(), 5, w).length);
      }
      return n * 8 + 2;
    }
    if (el._tag === 'input') return 16;
    if (el._tag === 'canvas') return (el.height || 0) + 2;
    if (cl.contains('hw')) {
      var rows = Math.ceil(el.querySelectorAll('.hc').length / 3);
      return Math.max(1, rows) * 34;
    }
    var h = 0;
    for (var k = 0; k < el.childNodes.length; k++) {
      var c = el.childNodes[k];
      if (c.nodeType === 1) h += measureEl(c, w);
      else if (c.nodeType === 3 && c.data.trim()) h += 10;
    }
    return h;
  }

  function drawEl(el, x, y, w, h) {
    if (!el || el.nodeType === 3) return 0;
    var cl = el.classList;
    if (cl.contains('fx') || cl.contains('langSwitch') || el._tag === 'svg') return 0;
    if (cl.contains('fx') || cl.contains('mnStat') || cl.contains('mnProgress') ||
        cl.contains('mnMobileBrand') || cl.contains('mnRule') || cl.contains('mnDesc') ||
        cl.contains('mnFootL') || cl.contains('menuMeta')) return 0;
    if (cl.contains('logo')) {
      ctx.fillStyle = 'rgba(224,164,58,.13)';
      ctx.beginPath();
      ctx.ellipse(W / 2, y + 7, 120, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      text(el.textContent.trim() || 'HOLLOWDEEP', W / 2, y + 3, 12, AC2, 'center');
      return 22;
    }
    if (cl.contains('mnLogo')) {
      text(el.textContent.trim(), W / 2, y + 3, 11, AC2, 'center');
      return 16;
    }
    if (cl.contains('mnKick')) {
      text(el.textContent.trim().toUpperCase(), W / 2, y + 1, 4, AC, 'center');
      return 7;
    }
    if (cl.contains('mnSub')) {
      text(el.textContent.trim(), W / 2, y + 1, 3, DIM, 'center');
      return 7;
    }
    if (cl.contains('mnCardK')) {
      text(el.textContent.trim().toUpperCase(), W / 2, y + 1, 3, DIM, 'center');
      return 7;
    }
    if (cl.contains('mnCardT')) {
      text(el.textContent.trim(), W / 2, y + 2, 6, AC2, 'center');
      return 11;
    }
    if (cl.contains('mnCardD')) {
      var dl = wrap(el.textContent.replace(/\s+/g, ' ').trim(), 3, w - 14);
      var dy = y;
      for (var di = 0; di < dl.length && di < 3; di++) {
        text(dl[di], W / 2, dy, 3, 'rgba(242,230,201,.75)', 'center');
        dy += 5;
      }
      return 16;
    }
    if (cl.contains('mnTopT')) {
      text(el.textContent.trim(), W / 2, y + 1, 5, AC2, 'center');
      return 8;
    }
    if (cl.contains('mnTopS')) {
      text(el.textContent.trim(), W / 2, y + 1, 3, DIM, 'center');
      return 8;
    }
    if (cl.contains('h2')) {
      text(el.textContent.trim(), W / 2, y + 3, 9, AC2, 'center');
      return 16;
    }
    if (cl.contains('sub')) {
      text(el.textContent.trim(), W / 2, y + 1, 5, DIM, 'center');
      return 10;
    }
    if (cl.contains('foot')) {
      text(el.textContent.trim(), W / 2, y + 2, 4, DIM, 'center');
      return 12;
    }
    if (cl.contains('big')) {
      text(el.textContent.trim(), W / 2, y + 3, 12, AC, 'center');
      return 18;
    }
    if (cl.contains('mbs')) {
      var bs = el.querySelectorAll('.mb');
      var row = cl.contains('row');
      if (row) {
        var widths = [], total = 0, gap = 4, i;
        for (i = 0; i < bs.length; i++) { widths.push(measure(mbText(bs[i]), 4) + 12); total += widths[i] + (i ? gap : 0); }
        var cx = W / 2 - total / 2;
        for (i = 0; i < bs.length; i++) {
          drawBtn(bs[i], cx, y, widths[i], 13);
          cx += widths[i] + gap;
        }
        return 14;
      }
      var by = y;
      for (var b = 0; b < bs.length; b++) {
        var bw = Math.min(210, Math.max(120, measure(mbText(bs[b]), 5) + 22));
        drawBtn(bs[b], W / 2 - bw / 2, by, bw, 13);
        by += 14;
      }
      return Math.max(0, by - y);
    }
    if (cl.contains('cards')) {
      var cards = el.querySelectorAll('.cd');
      if (!cards.length) return 0;
      var gap = 4, cwid = Math.min(66, Math.floor((w - gap * (cards.length - 1)) / cards.length));
      var totalW = cwid * cards.length + gap * (cards.length - 1);
      var cx0 = W / 2 - totalW / 2;
      for (var ci = 0; ci < cards.length; ci++) drawCard(cards[ci], cx0 + ci * (cwid + gap), y, cwid);
      return 92;
    }
    if (cl.contains('slots')) {
      var sl = el.querySelectorAll('.sl');
      var sw = Math.min(78, Math.floor((w - 3 * 5) / 4));
      var tot = sw * sl.length + 5 * (sl.length - 1);
      var sx = W / 2 - tot / 2;
      for (var s = 0; s < sl.length; s++) {
        box(sx, y, sw, 26, 'rgba(255,255,255,.05)', 'rgba(224,164,58,.25)');
        drawLines(elLines(sl[s]), sx + 3, y + 5, sw - 6, 4, FG, 'center');
        sx += sw + 5;
      }
      return 30;
    }
    if (cl.contains('tx') || cl.contains('warnline') || cl.contains('quote') || cl.contains('disc')) {
      var lines = elLines(el);
      var cy = y + 1, size = 5;
      for (var li = 0; li < lines.length; li++) {
        var merged = [], mtxt = '', mcol = null;
        for (var ri = 0; ri < lines[li].length; ri++) {
          if (mcol === null) mcol = lines[li][ri].c;
          mtxt += lines[li][ri].t;
        }
        var wrapped = wrap(mtxt.replace(/\s+/g, ' ').trim(), size, w);
        for (var wi = 0; wi < wrapped.length; wi++) {
          text(wrapped[wi], W / 2, cy, size, mcol || (cl.contains('dim') ? DIM : FG), 'center');
          cy += 8;
        }
        void merged;
      }
      return cy - y + 1;
    }
    if (el._tag === 'input') {
      box(x, y, Math.min(160, w), 14, 'rgba(0,0,0,.55)', 'rgba(224,164,58,.5)');
      text(el.value || '', W / 2, y + 4, 6, AC2, 'center');
      return 16;
    }
    if (el._tag === 'canvas') {
      drawCanvasEl(el, x, y, el.width || 0, el.height || 0);
      return (el.height || 0) + 2;
    }
    if (cl.contains('hw')) {
      var items = el.querySelectorAll('.hc');
      var iw = Math.floor((w - 8) / 3), ih = 32;
      for (var it = 0; it < items.length; it++) {
        var col = it % 3, rowN = Math.floor(it / 3);
        drawHowItem(items[it], x + col * (iw + 4), y + rowN * 34, iw, ih);
      }
      return Math.max(1, Math.ceil(items.length / 3)) * 34;
    }
    var yy = y;
    for (var k = 0; k < el.childNodes.length; k++) {
      var ch = el.childNodes[k];
      if (ch.nodeType === 3) {
        if (!ch.data.trim()) continue;
        var tl = wrap(ch.data.trim(), 5, w);
        for (var t = 0; t < tl.length; t++) { text(tl[t], W / 2, yy, 5, FG, 'center'); yy += 8; }
      } else {
        yy += drawEl(ch, x, yy, w, h);
      }
    }
    return yy - y;
  }

  function drawBtn(el, x, y, w, h) {
    var on = el.classList.contains('on');
    var primary = el.classList.contains('primary');
    if (on) {
      gradBox(x, y, w, h, '#ffe8a8', '#c98a25', '#fff0c0');
      text(mbText(el), x + w / 2, y + 4, 5, '#241506', 'center');
      text('>', x + 4, y + 4, 5, '#7a3a08', 'left');
    } else {
      gradBox(x, y, w, h, primary ? '#7d1218' : 'rgba(255,255,255,.08)',
              primary ? '#3a0509' : 'rgba(8,5,12,.6)',
              primary ? 'rgba(255,120,100,.55)' : 'rgba(224,164,58,.32)');
      text(mbText(el), x + w / 2, y + 4, 5, FG, 'center');
    }
  }

  function drawCard(cd, x, y, w) {
    var on = cd.classList.contains('on');
    box(x, y, w, 86, on ? 'rgba(224,164,58,.16)' : 'rgba(255,255,255,.05)',
        on ? AC : 'rgba(224,164,58,.18)');
    var cv = cd.querySelector('canvas');
    if (cv) {
      var cw = 16, chh = 28, scale = 1.9;
      drawCanvasEl(cv, x + w / 2 - cw * scale / 2, y + 4, cw * scale, chh * scale);
    }
    var nm = cd.querySelector('b');
    text(nm ? nm.textContent.trim() : '', x + w / 2, y + 64, 4, on ? AC2 : FG, 'center');
    var stats = cd.querySelectorAll('.st');
    for (var i = 0; i < stats.length && i < 3; i++) {
      var sp = stats[i].querySelector('span');
      var barEl = stats[i].querySelector('i');
      var pct = 0.5;
      if (barEl && barEl.attrs && barEl.attrs.style) {
        var m = /width:\s*([0-9.]+)%/.exec(barEl.attrs.style);
        if (m) pct = parseFloat(m[1]) / 100;
      }
      var by = y + 71 + i * 5;
      text(sp ? sp.textContent.trim() : '', x + 3, by, 3, DIM, 'left');
      box(x + w - 33, by + 1, 30, 3, 'rgba(0,0,0,.6)', null);
      ctx.fillStyle = on ? AC2 : AC;
      ctx.fillRect(x + w - 32, by + 2, Math.max(1, Math.round(28 * pct)), 1);
    }
  }

  function drawHowItem(hc, x, y, w, h) {
    box(x, y, w, h, 'rgba(255,255,255,.05)', 'rgba(224,164,58,.22)');
    var cv = hc.querySelector('canvas');
    if (cv) {
      var s = Math.min((w - 8) / 64, (h - 10) / 40);
      drawCanvasEl(cv, x + 4, y + 2, 64 * s, 40 * s);
    }
    var ht = hc.querySelector('.ht');
    text(ht ? ht.textContent.trim() : '', x + w / 2, y + h - 8, 3, AC2, 'center');
  }

  function drawCanvasEl(el, x, y, w, h) {
    if (!el._cvId) el._spawn();
    if (!el._cvId) return;
    ctx.drawImage(el, x, y, Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }

  /* --------------------------------------------------------------- screens */

  function backdrop() {
    // semi-transparent: the game keeps animating its preview scene on #c
    var g = ctx.createRadialGradient(W / 2, H * 0.38, 10, W / 2, H * 0.38, 230);
    g.addColorStop(0, 'rgba(26,16,36,.84)');
    g.addColorStop(0.55, 'rgba(11,8,16,.90)');
    g.addColorStop(1, 'rgba(3,2,6,.96)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    var b = ctx.createRadialGradient(W * 0.18, H * 0.82, 4, W * 0.18, H * 0.82, 120);
    b.addColorStop(0, 'rgba(120,14,22,.22)');
    b.addColorStop(1, 'rgba(120,14,22,0)');
    ctx.fillStyle = b;
    ctx.fillRect(0, 0, W, H);
  }

  function renderMenu(ov) {
    backdrop();
    var kids = ov.childNodes;
    var total = 0, i;
    for (i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.nodeType === 3) { if (k.data.trim()) total += 10; }
      else total += measureEl(k, W - 28);
    }
    var lang = ov.querySelector('.langSwitch');
    var foot = ov.querySelector('.foot');
    var y = Math.max(6, Math.round((H - total) / 2) - (lang ? 6 : 0));
    for (i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (c.nodeType === 3) {
        if (!c.data.trim()) continue;
        text(c.data.trim(), W / 2, y, 5, FG, 'center');
        y += 10;
      } else {
        y += drawEl(c, 10, y, W - 20, H);
      }
    }
    if (lang) drawLang(lang);
    if (foot && y > H - 14) text(foot.textContent.trim(), W / 2, H - 8, 4, DIM, 'center');
  }

  function drawLang(lang) {
    var btns = lang.querySelectorAll('button');
    var x = W - 34, y = H - 12;
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].classList.contains('on');
      var lbl = btns[i].textContent.replace(/\s+/g, '').trim() || (i ? 'EN' : 'IT');
      box(x + i * 16, y, 14, 10, on ? AC : 'rgba(255,255,255,.08)', on ? '#fff0c0' : 'rgba(224,164,58,.3)');
      text(lbl, x + i * 16 + 7, y + 3, 4, on ? '#241506' : DIM, 'center');
    }
  }

  function cineVisible() {
    var c = doc.getElementById('cine');
    return c && !c.classList.contains('h');
  }

  function renderCine() {
    var cc = doc.getElementById('cc');
    if (cc) drawCanvasEl(cc, 0, 0, W, H);
    else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }

    var flash = doc.getElementById('cFlash');
    if (flash) {
      var op = parseFloat(flash.style.opacity);
      if (op > 0.01) {
        ctx.fillStyle = 'rgba(255,245,220,' + Math.min(0.85, op) + ')';
        ctx.fillRect(0, 0, W, H);
      }
    }

    var skip = doc.getElementById('cSkip');
    if (skip) {
      var dim = skip.classList.contains('dim');
      text('SKIP >', W - 6, 4, 4, dim ? 'rgba(143,132,168,.45)' : DIM, 'right');
    }

    var cap = doc.getElementById('cCap');
    if (cap && cap.classList.contains('show')) {
      var kk = cap.querySelector('.cCapK');
      var tt = cap.querySelector('.cCapT');
      var ss = cap.querySelector('.cCapS');
      var cy = H * 0.30;
      ctx.fillStyle = 'rgba(3,2,6,.55)';
      ctx.fillRect(0, cy - 14, W, 62);
      if (kk && kk.textContent.trim()) { text(kk.textContent.trim(), W / 2, cy - 10, 4, DIM, 'center'); cy += 6; }
      if (tt) {
        var tl = wrap(tt.textContent.trim(), 10, W - 30);
        for (var i = 0; i < tl.length; i++) { text(tl[i], W / 2, cy + 2, 10, AC2, 'center'); cy += 13; }
      }
      if (ss) {
        var sl = wrap(ss.textContent.trim(), 5, W - 60);
        for (var j = 0; j < sl.length; j++) { text(sl[j], W / 2, cy + 4, 5, DIM, 'center'); cy += 8; }
      }
    }

    var dlg = doc.getElementById('cDlg');
    if (dlg && dlg.classList.contains('show')) {
      var top = 148, hgt = H - top - 6;
      box(4, top, W - 8, hgt, 'rgba(6,4,10,.94)', 'rgba(224,164,58,.45)');
      var who = doc.getElementById('cWho');
      var wy = top + 6;
      if (who) {
        var col = who.style.color || AC2;
        if (who.textContent.trim()) text(who.textContent.trim(), 12, wy, 6, col, 'left');
        wy += 10;
      }
      var body = doc.getElementById('cText');
      var choices = doc.getElementById('cChoices');
      var maxW = W - 24;
      if (body && body.textContent.trim()) {
        var lines = wrap(body.textContent.trim(), 5, maxW);
        var maxLines = choices && choices.childNodes.length ? 3 : 5;
        for (var L = 0; L < lines.length && L < maxLines; L++) {
          text(lines[L], 10, wy, 5, FG, 'left');
          wy += 8;
        }
      }
      if (choices) {
        var bs = choices.querySelectorAll('button');
        for (var b = 0; b < bs.length && wy < H - 12; b++) {
          var on = bs[b].classList.contains('on');
          text((on ? '> ' : '  ') + bs[b].textContent.replace(/\s+/g, ' ').trim(),
               10, wy, 5, on ? AC2 : DIM, 'left');
          wy += 8;
        }
      }
      var next = doc.getElementById('cNext');
      if (next && next.classList.contains('show')) {
        text('v', W - 16, H - 14, 5, AC, 'center');
      }
    }
  }

  /* ---------------------------------------------------------------- frame */

  function render() {
    var game = doc.getElementById('c');
    if (game && game._cvId) __vita_set_canvas(game._cvId, overlayEl._cvId);
    ctx.reset();
    ctx.clearRect(0, 0, W, H);
    var active = false;
    var cine = doc.getElementById('cine');
    var ov = doc.getElementById('ov');
    if (cine && !cine.classList.contains('h')) {
      renderCine();
      active = true;
    } else if (ov && !ov.classList.contains('h')) {
      renderMenu(ov);
      active = true;
    }
    __vita_set_overlay(active ? 1 : 0);
  }

  globalThis.__vita_render = render;
})();
