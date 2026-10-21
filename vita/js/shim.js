/* Hollowdeep Vita — minimal browser shim.
 *
 * Provides the small slice of the DOM/Canvas API the game uses: one 2D canvas
 * implementation backed by the native rasterizer, element trees for the menus,
 * keyboard events, timers, localStorage and Image().
 *
 * There is no HTML/CSS layout engine, no network, no WebAudio: ui.js draws the
 * overlay menus itself and audio calls simply find no AudioContext (the game
 * already guards every audio path with try/catch).
 */
(function () {
  'use strict';

  var OP = {
    CANVAS_NEW: 1, CANVAS_FREE: 2, CLEAR_RECT: 3, FILL_RECT: 4, STROKE_RECT: 5,
    SAVE: 6, RESTORE: 7, TRANSLATE: 8, SCALE: 9, ROTATE: 10, SET_TRANSFORM: 11,
    TRANSFORM: 12, BEGIN_PATH: 13, MOVE_TO: 14, LINE_TO: 15, BEZIER: 16, QUAD: 17,
    ARC: 18, ELLIPSE: 19, CLOSE_PATH: 20, RECT_PATH: 21, FILL: 22, STROKE: 23,
    CLIP: 24, DRAW_IMAGE: 25, TEXT: 26, MEASURE: 27, GRAD_NEW: 28, GRAD_STOP: 29,
    IMAGE_NEW: 30, IMAGE_LOAD: 31, IMAGE_FREE: 32, IMAGE_INFO: 33, CANVAS_INFO: 34,
    STORAGE_LOAD: 35, STORAGE_SAVE: 36, LOG: 37, QUIT: 38, RESET: 39,
    SET_CANVAS: 40, SET_OVERLAY: 41
  };
  var G = __g;

  var logCount = 0;
  function log(level, args) {
    if (logCount > 400) return;
    logCount++;
    var s = '';
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (i) s += ' ';
      if (typeof a === 'string') s += a;
      else if (a instanceof Error) s += (a.stack || a.message || String(a));
      else { try { s += JSON.stringify(a); } catch (e) { s += String(a); } }
    }
    G(OP.LOG, level, s);
  }
  var console = {
    log: function () { log(0, arguments); },
    info: function () { log(0, arguments); },
    warn: function () { log(1, arguments); },
    error: function () { log(2, arguments); }
  };

  /* ------------------------------------------------------------- colours */
  var colorCache = {};
  var NAMED = {
    black: 0x000000, white: 0xffffff, red: 0xff0000, green: 0x008000, blue: 0x0000ff,
    yellow: 0xffff00, transparent: 0x00000000
  };
  function pack(r, g, b, a) {
    r = r < 0 ? 0 : r > 255 ? 255 : r | 0;
    g = g < 0 ? 0 : g > 255 ? 255 : g | 0;
    b = b < 0 ? 0 : b > 255 ? 255 : b | 0;
    a = a < 0 ? 0 : a > 255 ? 255 : a | 0;
    return (r | (g << 8) | (b << 16) | (a << 24)) >>> 0;
  }
  var hex2 = function (h) { return parseInt(h, 16); };
  function parseColor(c) {
    if (typeof c === 'number') return c >>> 0;
    if (!c) return 0xff000000;
    var hit = colorCache[c];
    if (hit !== undefined) return hit;
    var v = 0xff000000;
    var s = String(c).trim().toLowerCase();
    if (s.charAt(0) === '#') {
      if (s.length === 4) v = pack(hex2(s[1] + s[1]), hex2(s[2] + s[2]), hex2(s[3] + s[3]), 255);
      else if (s.length === 5) v = pack(hex2(s[1] + s[1]), hex2(s[2] + s[2]), hex2(s[3] + s[3]), hex2(s[4] + s[4]));
      else if (s.length === 7) v = pack(hex2(s.substr(1, 2)), hex2(s.substr(3, 2)), hex2(s.substr(5, 2)), 255);
      else if (s.length === 9) v = pack(hex2(s.substr(1, 2)), hex2(s.substr(3, 2)), hex2(s.substr(5, 2)), hex2(s.substr(7, 2)));
    } else if (s.indexOf('rgba(') === 0 || s.indexOf('rgb(') === 0) {
      var parts = s.replace(/^rgba?\(|\)$/g, '').split(',');
      v = pack(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]),
               parts.length > 3 ? Math.round(parseFloat(parts[3]) * 255) : 255);
    } else if (s.indexOf('hsl(') === 0) {
      var h = s.replace(/^hsl\(|\)$/g, '').split(',');
      v = pack(255, 255, 255, 255);
      var hh = (parseFloat(h[0]) % 360) / 60, ss = parseFloat(h[1]) / 100, ll = parseFloat(h[2]) / 100;
      var c2 = (1 - Math.abs(2 * ll - 1)) * ss, x2 = c2 * (1 - Math.abs((hh % 2) - 1)), m2 = ll - c2 / 2;
      var rr = 0, gg = 0, bb = 0;
      if (hh < 1) { rr = c2; gg = x2; } else if (hh < 2) { rr = x2; gg = c2; }
      else if (hh < 3) { gg = c2; bb = x2; } else if (hh < 4) { gg = x2; bb = c2; }
      else if (hh < 5) { rr = x2; bb = c2; } else { rr = c2; bb = x2; }
      v = pack(Math.round((rr + m2) * 255), Math.round((gg + m2) * 255), Math.round((bb + m2) * 255), 255);
    } else if (NAMED[s] !== undefined) {
      var n = NAMED[s];
      v = pack((n >> 16) & 255, (n >> 8) & 255, n & 255, s === 'transparent' ? 0 : 255);
    }
    colorCache[c] = v;
    return v;
  }

  /* ------------------------------------------------------------ gradients */
  function Gradient(type, x0, y0, r0, x1, y1, r1) {
    this._id = G(OP.GRAD_NEW, type, x0, y0, x1, y1, r0, r1);
  }
  Gradient.prototype.addColorStop = function (p, c) {
    G(OP.GRAD_STOP, this._id, p, parseColor(c));
  };

  /* --------------------------------------------------------------- canvas */
  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function Ctx(canvas) {
    this.canvas = canvas;
    this._id = 0;
    this._fsColor = 0xff000000;
    this._fsGrad = 0;
    this._ssColor = 0xff000000;
    this._ssGrad = 0;
    this._alpha = 1;
    this._comp = 0;
    this._lw = 1;
    this._font = '10px sans-serif';
    this._size = 10;
    this._align = 0;
    this._base = 0;
    this._stack = [];
    this.imageSmoothingEnabled = false;
    this.lineCap = 'butt';
    this.lineJoin = 'miter';
    this.shadowBlur = 0;
    this.shadowColor = 'rgba(0,0,0,0)';
    this.miterLimit = 10;
    this.filter = 'none';
    this.direction = 'ltr';
    this.globalCompositeOperation = 'source-over';
  }
  Ctx.prototype._ensure = function () {
    if (!this._id) {
      if (!this.canvas._cvId) this.canvas._spawn();
      this._id = this.canvas._cvId;
    }
    return this._id;
  };
  Ctx.prototype.save = function () {
    this._stack.push([this._fsColor, this._fsGrad, this._ssColor, this._ssGrad,
                      this._alpha, this._comp, this._lw, this._size, this._align, this._base]);
    G(OP.SAVE, this._ensure());
  };
  Ctx.prototype.restore = function () {
    var s = this._stack.pop();
    if (s) {
      this._fsColor = s[0]; this._fsGrad = s[1]; this._ssColor = s[2]; this._ssGrad = s[3];
      this._alpha = s[4]; this._comp = s[5]; this._lw = s[6]; this._size = s[7];
      this._align = s[8]; this._base = s[9];
    }
    G(OP.RESTORE, this._ensure());
  };
  Ctx.prototype.beginPath = function () { G(OP.BEGIN_PATH, this._ensure()); };
  Ctx.prototype.closePath = function () { G(OP.CLOSE_PATH, this._ensure()); };
  Ctx.prototype.moveTo = function (x, y) { G(OP.MOVE_TO, this._ensure(), x, y); };
  Ctx.prototype.lineTo = function (x, y) { G(OP.LINE_TO, this._ensure(), x, y); };
  Ctx.prototype.bezierCurveTo = function (a, b, c, d, e, f) { G(OP.BEZIER, this._ensure(), a, b, c, d, e, f); };
  Ctx.prototype.quadraticCurveTo = function (a, b, c, d) { G(OP.QUAD, this._ensure(), a, b, c, d); };
  Ctx.prototype.arc = function (x, y, r, a0, a1, ccw) { G(OP.ARC, this._ensure(), x, y, r, a0, a1, ccw ? 1 : 0); };
  Ctx.prototype.ellipse = function (x, y, rx, ry, rot, a0, a1, ccw) {
    G(OP.ELLIPSE, this._ensure(), x, y, rx, ry, rot || 0, a0 || 0, a1 === undefined ? Math.PI * 2 : a1, ccw ? 1 : 0);
  };
  Ctx.prototype.arcTo = function (x1, y1, x2, y2) { this.lineTo(x1, y1); this.lineTo(x2, y2); };
  Ctx.prototype.rect = function (x, y, w, h) { G(OP.RECT_PATH, this._ensure(), x, y, w, h); };
  Ctx.prototype.roundRect = function (x, y, w, h, r) { roundRectPath(this, x, y, w, h, r || 0); };
  Ctx.prototype.fill = function () {
    var id = this._ensure();
    G(OP.FILL, id, this._fsGrad ? 1 : 0, this._fsColor, this._fsGrad, this._alpha, this._comp);
  };
  Ctx.prototype.stroke = function () {
    var id = this._ensure();
    G(OP.STROKE, id, this._ssGrad ? 1 : 0, this._ssColor, this._ssGrad, this._alpha, this._comp, this._lw);
  };
  Ctx.prototype.clip = function () { G(OP.CLIP, this._ensure()); };
  Ctx.prototype.fillRect = function (x, y, w, h) {
    G(OP.FILL_RECT, this._ensure(), x, y, w, h, this._fsGrad ? 1 : 0, this._fsColor, this._fsGrad, this._alpha, this._comp);
  };
  Ctx.prototype.strokeRect = function (x, y, w, h) {
    G(OP.STROKE_RECT, this._ensure(), x, y, w, h, this._ssGrad ? 1 : 0, this._ssColor, this._ssGrad, this._alpha, this._comp, this._lw);
  };
  Ctx.prototype.clearRect = function (x, y, w, h) { G(OP.CLEAR_RECT, this._ensure(), x, y, w, h); };
  Ctx.prototype.fillText = function (s, x, y) {
    G(OP.TEXT, this._ensure(), String(s), x, y, this._size, this._align, this._base, this._fsColor, this._alpha, this._comp);
  };
  Ctx.prototype.strokeText = function (s, x, y) { this.fillText(s, x, y); };
  Ctx.prototype.measureText = function (s) {
    var w = G(OP.MEASURE, String(s), this._size);
    return { width: w, actualBoundingBoxAscent: this._size * 0.8, actualBoundingBoxDescent: this._size * 0.2,
             actualBoundingBoxLeft: 0, actualBoundingBoxRight: w };
  };
  function imgSource(ctx, img) {
    if (!img) return null;
    if (img._cvId !== undefined && img.tagName === 'CANVAS') {
      if (!img._cvId) img._spawn();
      return img._cvId ? { kind: 0, id: img._cvId } : null;
    }
    if (img._imgId) return { kind: 1, id: img._imgId };
    return null;
  }
  Ctx.prototype.drawImage = function (img, a, b, c, d, e, f, g2, h) {
    var src = imgSource(this, img);
    if (!src) return;
    var sx = 0, sy = 0, sw = 0, sh = 0, dx, dy, dw, dh;
    if (arguments.length <= 5) {
      dx = a; dy = b; dw = c === undefined ? img.width : c; dh = d === undefined ? img.height : d;
      sw = img.width; sh = img.height;
    } else {
      sx = a; sy = b; sw = c; sh = d; dx = e; dy = f;
      dw = g2 === undefined ? sw : g2; dh = h === undefined ? sh : h;
    }
    G(OP.DRAW_IMAGE, this._ensure(), src.kind, src.id, sx, sy, sw, sh, dx, dy, dw, dh,
      this._alpha, this._comp);
  };
  Ctx.prototype.translate = function (x, y) { G(OP.TRANSLATE, this._ensure(), x, y); };
  Ctx.prototype.scale = function (x, y) { G(OP.SCALE, this._ensure(), x, y); };
  Ctx.prototype.rotate = function (a) { G(OP.ROTATE, this._ensure(), a); };
  Ctx.prototype.transform = function (a, b, c, d, e, f) { G(OP.TRANSFORM, this._ensure(), a, b, c, d, e, f); };
  Ctx.prototype.setTransform = function (a, b, c, d, e, f) {
    if (arguments.length === 1) { G(OP.SET_TRANSFORM, this._ensure(), a, 0, 0, a, 0, 0); return; }
    G(OP.SET_TRANSFORM, this._ensure(), a, b, c, d, e, f);
  };
  Ctx.prototype.resetTransform = function () { G(OP.SET_TRANSFORM, this._ensure(), 1, 0, 0, 1, 0, 0); };
  Ctx.prototype.reset = function () { G(OP.RESET, this._ensure()); };
  Ctx.prototype.createLinearGradient = function (x0, y0, x1, y1) { return new Gradient(1, x0, y0, 0, x1, y1, 1); };
  Ctx.prototype.createRadialGradient = function (x0, y0, r0, x1, y1, r1) { return new Gradient(2, x0, y0, r0, x1, y1, r1); };
  Ctx.prototype.createPattern = function () { return null; };
  Ctx.prototype.getImageData = function (x, y, w, h) {
    return { width: w | 0, height: h | 0, data: new Uint8ClampedArray(Math.max(0, (w | 0) * (h | 0) * 4)) };
  };
  Ctx.prototype.putImageData = function () {};
  Ctx.prototype.createImageData = function (w, h) {
    return { width: w | 0, height: h | 0, data: new Uint8ClampedArray(Math.max(0, (w | 0) * (h | 0) * 4)) };
  };
  Ctx.prototype.isPointInPath = function () { return false; };
  Ctx.prototype.setLineDash = function () {};
  Ctx.prototype.getLineDash = function () { return []; };

  Object.defineProperties(Ctx.prototype, {
    fillStyle: {
      get: function () { return this._fsGrad ? { _id: this._fsGrad } : this._fsColor; },
      set: function (v) {
        if (v && v._id) { this._fsGrad = v._id; }
        else { this._fsGrad = 0; this._fsColor = parseColor(v); }
      }
    },
    strokeStyle: {
      get: function () { return this._ssGrad ? { _id: this._ssGrad } : this._ssColor; },
      set: function (v) {
        if (v && v._id) { this._ssGrad = v._id; }
        else { this._ssGrad = 0; this._ssColor = parseColor(v); }
      }
    },
    globalAlpha: {
      get: function () { return this._alpha; },
      set: function (v) { v = +v; this._alpha = v < 0 ? 0 : v > 1 ? 1 : (isNaN(v) ? 1 : v); }
    },
    globalCompositeOperation: {
      get: function () { return this._compName || 'source-over'; },
      set: function (v) {
        this._compName = v;
        this._comp = v === 'destination-out' ? 1 : v === 'lighter' ? 2 : v === 'copy' ? 3 : 0;
      }
    },
    lineWidth: {
      get: function () { return this._lw; },
      set: function (v) { v = +v; this._lw = v > 0 ? v : 1; }
    },
    font: {
      get: function () { return this._font; },
      set: function (v) {
        this._font = String(v);
        var m = /([0-9]+(?:\.[0-9]+)?)px/.exec(this._font);
        this._size = m ? Math.max(1, Math.round(parseFloat(m[1]))) : 10;
      }
    },
    textAlign: {
      get: function () { return this._alignName || 'left'; },
      set: function (v) { this._alignName = v; this._align = v === 'center' ? 2 : v === 'right' ? 1 : 0; }
    },
    textBaseline: {
      get: function () { return this._baseName || 'alphabetic'; },
      set: function (v) {
        this._baseName = v;
        this._base = v === 'top' || v === 'hanging' ? 0 : v === 'middle' ? 1 :
                     v === 'bottom' || v === 'ideographic' ? 2 : 3;
      }
    }
  });

  /* -------------------------------------------------------------- elements */
  var VOIDTAGS = { br: 1, img: 1, input: 1, hr: 1, meta: 1, link: 1, source: 1 };

  function ClassList(el) { this.el = el; this._set = {}; }
  ClassList.prototype._sync = function () {
    this.el.attrs['class'] = Object.keys(this._set).join(' ');
  };
  ClassList.prototype.add = function () {
    for (var i = 0; i < arguments.length; i++) this._set[arguments[i]] = 1;
    this._sync();
  };
  ClassList.prototype.remove = function () {
    for (var i = 0; i < arguments.length; i++) delete this._set[arguments[i]];
    this._sync();
  };
  ClassList.prototype.contains = function (c) { return !!this._set[c]; };
  ClassList.prototype.toggle = function (c, force) {
    var on = force === undefined ? !this._set[c] : !!force;
    if (on) this._set[c] = 1; else delete this._set[c];
    this._sync();
    return on;
  };
  ClassList.prototype.item = function (i) { return Object.keys(this._set)[i] || null; };
  Object.defineProperty(ClassList.prototype, 'length', { get: function () { return Object.keys(this._set).length; } });
  Object.defineProperty(ClassList.prototype, 'value', { get: function () { return Object.keys(this._set).join(' '); } });

  var doc = null;

  function TextNode(data, parent) {
    this.nodeType = 3;
    this.data = String(data);
    this.parentNode = parent || null;
  }
  Object.defineProperty(TextNode.prototype, 'nodeValue', {
    get: function () { return this.data; },
    set: function (v) { this.data = String(v); }
  });
  Object.defineProperty(TextNode.prototype, 'parentElement', {
    get: function () {
      var p = this.parentNode;
      while (p && p.nodeType !== 1) p = p.parentNode;
      return p;
    }
  });

  function El(tag) {
    this.tagName = String(tag || 'div').toUpperCase();
    this.nodeType = 1;
    this.childNodes = [];
    this.parentNode = null;
    this._text = '';
    this.classList = new ClassList(this);
    this.dataset = {};
    this.attrs = {};
    this.style = { setProperty: function () {}, removeProperty: function () {}, getPropertyValue: function () { return ''; } };
    this.id = '';
    this.value = '';
    this._ls = {};
    this._cvId = 0;
    this._ctx = null;
    this._w = this.tagName === 'CANVAS' ? 300 : 0;
    this._h = this.tagName === 'CANVAS' ? 150 : 0;
    this._tag = String(tag || 'div').toLowerCase();
  }
  El.prototype._spawn = function () {
    if (this._cvId) G(OP.CANVAS_FREE, this._cvId);
    this._cvId = G(OP.CANVAS_NEW, this._w || 1, this._h || 1);
    if (this._ctx) this._ctx._id = this._cvId;
    return this._cvId;
  };
  El.prototype._destroy = function () {
    for (var i = 0; i < this.childNodes.length; i++) {
      var c = this.childNodes[i];
      if (c && c.nodeType === 1) c._destroy();
    }
    if (this._cvId) { G(OP.CANVAS_FREE, this._cvId); this._cvId = 0; }
    if (this.id && doc && doc._ids[this.id] === this) delete doc._ids[this.id];
  };
  El.prototype.getContext = function (kind) {
    if (kind !== '2d') return null;
    if (!this._ctx) {
      this._ctx = new Ctx(this);
      this._spawn();
      this._ctx._id = this._cvId;
    }
    return this._ctx;
  };
  El.prototype.appendChild = function (node) {
    if (!node) return node;
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.childNodes.push(node);
    if (node.nodeType === 1 && node.id && doc) doc._ids[node.id] = node;
    return node;
  };
  El.prototype.insertBefore = function (node, ref) {
    var i = this.childNodes.indexOf(ref);
    if (i < 0) return this.appendChild(node);
    node.parentNode = this;
    this.childNodes.splice(i, 0, node);
    if (node.nodeType === 1 && node.id && doc) doc._ids[node.id] = node;
    return node;
  };
  El.prototype.removeChild = function (node) {
    var i = this.childNodes.indexOf(node);
    if (i >= 0) this.childNodes.splice(i, 1);
    if (node) node.parentNode = null;
    return node;
  };
  El.prototype.remove = function () { if (this.parentNode) this.parentNode.removeChild(this); };
  El.prototype.setAttribute = function (k, v) {
    this.attrs[k] = String(v);
    if (k === 'class') {
      var parts = String(v).split(/\s+/);
      this.classList._set = {};
      for (var i = 0; i < parts.length; i++) if (parts[i]) this.classList._set[parts[i]] = 1;
    } else if (k === 'id') {
      this.id = String(v);
      if (doc) doc._ids[this.id] = this;
    } else if (k.indexOf('data-') === 0) {
      this.dataset[k.substr(5).replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); })] = String(v);
    } else if (k === 'width' || k === 'height') {
      if (this.tagName === 'CANVAS') {
        this[k === 'width' ? '_w' : '_h'] = parseInt(v, 10) || 0;
        if (this._cvId || this._ctx) this._spawn();
      }
    } else if (k === 'value') {
      this.value = String(v);
    }
  };
  El.prototype.getAttribute = function (k) { return this.attrs[k] === undefined ? null : this.attrs[k]; };
  El.prototype.hasAttribute = function (k) { return this.attrs[k] !== undefined; };
  El.prototype.addEventListener = function (t, fn) {
    (this._ls[t] || (this._ls[t] = [])).push(fn);
  };
  El.prototype.removeEventListener = function (t, fn) {
    var a = this._ls[t];
    if (!a) return;
    var i = a.indexOf(fn);
    if (i >= 0) a.splice(i, 1);
  };
  El.prototype.dispatchEvent = function (ev) {
    if (!ev.target) ev.target = this;
    var node = this;
    while (node) {
      ev.currentTarget = node;
      var a = node._ls && node._ls[ev.type];
      if (a) for (var i = 0; i < a.length; i++) { try { a[i].call(node, ev); } catch (e) { console.error(e); } }
      node = ev.bubbles === false ? null : node.parentNode;
    }
    return true;
  };
  El.prototype.focus = function () {};
  El.prototype.blur = function () {};
  El.prototype.select = function () {};
  El.prototype.getBoundingClientRect = function () {
    return { left: 0, top: 0, width: this._w || 352, height: this._h || 240, right: this._w || 352, bottom: this._h || 240 };
  };
  El.prototype.closest = function (sel) {
    var node = this;
    while (node && node.nodeType === 1) {
      if (matchesSel(node, sel)) return node;
      node = node.parentNode;
    }
    return null;
  };
  El.prototype.matches = function (sel) { return matchesSel(this, sel); };
  El.prototype.querySelector = function (sel) {
    var out = querySelAll(this, sel, 1);
    return out.length ? out[0] : null;
  };
  El.prototype.querySelectorAll = function (sel) { return querySelAll(this, sel, 0); };
  Object.defineProperty(El.prototype, 'width', {
    get: function () { return this._w; },
    set: function (v) {
      this._w = parseInt(v, 10) || 0;
      if (this.tagName === 'CANVAS') this._spawn();
    }
  });
  Object.defineProperty(El.prototype, 'height', {
    get: function () { return this._h; },
    set: function (v) {
      this._h = parseInt(v, 10) || 0;
      if (this.tagName === 'CANVAS') this._spawn();
    }
  });
  Object.defineProperty(El.prototype, 'textContent', {
    get: function () {
      var s = this._text || '';
      for (var i = 0; i < this.childNodes.length; i++) {
        var c = this.childNodes[i];
        s += c.nodeType === 3 ? c.data : c.textContent;
      }
      return s;
    },
    set: function (v) {
      for (var i = 0; i < this.childNodes.length; i++) {
        var c = this.childNodes[i];
        if (c.nodeType === 1) c._destroy();
      }
      this.childNodes = [];
      this._text = v === undefined || v === null ? '' : String(v);
    }
  });
  Object.defineProperty(El.prototype, 'innerHTML', {
    get: function () { return ''; },
    set: function (v) {
      for (var i = 0; i < this.childNodes.length; i++) {
        var c = this.childNodes[i];
        if (c.nodeType === 1) c._destroy();
      }
      this.childNodes = [];
      this._text = '';
      var nodes = parseHTML(v === undefined || v === null ? '' : String(v));
      for (var j = 0; j < nodes.length; j++) this.appendChild(nodes[j]);
    }
  });

  /* --------------------------------------------------------------- parser */
  function decodeEntities(s) {
    return s.replace(/&(amp|lt|gt|quot|nbsp|#39|#x27|#(\d+));/g, function (m, e, num) {
      if (e === 'amp') return '&';
      if (e === 'lt') return '<';
      if (e === 'gt') return '>';
      if (e === 'quot') return '"';
      if (e === 'nbsp') return ' ';
      if (num) return String.fromCharCode(parseInt(num, 10));
      return "'";
    });
  }
  var ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  function parseHTML(html) {
    var root = [];
    var stack = [];
    var i = 0;
    var cur = function () { return stack.length ? stack[stack.length - 1].node : null; };
    var pushNode = function (n) {
      var parent = cur();
      if (parent) { n.parentNode = parent; parent.childNodes.push(n); }
      else root.push(n);
    };
    while (i < html.length) {
      var lt = html.indexOf('<', i);
      if (lt < 0) { pushText(html.substr(i)); break; }
      if (lt > i) pushText(html.substr(i, lt - i));
      if (html.substr(lt, 4) === '<!--') {
        var endc = html.indexOf('-->', lt + 4);
        i = endc < 0 ? html.length : endc + 3;
        continue;
      }
      var gt = html.indexOf('>', lt + 1);
      if (gt < 0) { pushText(html.substr(lt)); break; }
      var tag = html.substring(lt + 1, gt);
      var selfClose = tag.charAt(tag.length - 1) === '/';
      if (selfClose) tag = tag.substring(0, tag.length - 1);
      var close = tag.charAt(0) === '/';
      var nameM = /^\/?\s*([a-zA-Z0-9:-]+)/.exec(tag);
      var name = nameM ? nameM[1].toLowerCase() : '';
      if (close) {
        for (var s = stack.length - 1; s >= 0; s--) {
          if (stack[s].node._tag === name) { stack.length = s; break; }
        }
        i = gt + 1;
        continue;
      }
      var el = new El(name);
      var attrsPart = tag.substring(nameM ? nameM[0].length : 0);
      ATTR_RE.lastIndex = 0;
      var am;
      while ((am = ATTR_RE.exec(attrsPart))) {
        var an = am[1];
        var av = am[2] !== undefined ? am[2] : am[3] !== undefined ? am[3] : am[4] !== undefined ? am[4] : '';
        el.setAttribute(an, decodeEntities(av));
      }
      pushNode(el);
      if (!selfClose && !VOIDTAGS[name]) stack.push({ node: el });
      i = gt + 1;
    }
    return root;
    function pushText(t) {
      t = decodeEntities(t);
      if (!t) return;
      var parent = cur();
      var node = new TextNode(t, parent);
      if (parent) parent.childNodes.push(node);
      else root.push(node);
    }
  }

  /* ------------------------------------------------------------ selectors */
  function matchesSimple(el, part) {
    if (!el || el.nodeType !== 1) return false;
    if (part === '*') return true;
    if (part.charAt(0) === '#') return el.id === part.substr(1);
    if (part.charAt(0) === '.') return el.classList.contains(part.substr(1));
    if (part.charAt(0) === '[') {
      var m = /^\[([^\]=]+)(?:=["']?([^"'\]]*)["']?)?\]$/.exec(part);
      if (!m) return false;
      if (m[2] === undefined) return el.hasAttribute(m[1]);
      return el.getAttribute(m[1]) === m[2];
    }
    return el._tag === part.toLowerCase();
  }
  function matchesSel(el, sel) {
    var groups = String(sel).split(',');
    for (var g = 0; g < groups.length; g++) {
      var parts = groups[g].trim().split(/\s+/);
      if (matchesChain(el, parts, parts.length - 1)) return true;
    }
    return false;
  }
  function matchesChain(el, parts, idx) {
    if (!matchesSimple(el, parts[idx])) return false;
    if (idx === 0) return true;
    var p = el.parentNode;
    while (p && p.nodeType === 1) {
      if (matchesChain(p, parts, idx - 1)) return true;
      p = p.parentNode;
    }
    return false;
  }
  function walkCollect(root, parts, out, limit) {
    for (var i = 0; i < root.childNodes.length; i++) {
      var c = root.childNodes[i];
      if (c.nodeType !== 1) continue;
      if (matchesChain(c, parts, parts.length - 1)) {
        out.push(c);
        if (limit && out.length >= limit) return;
      }
      walkCollect(c, parts, out, limit);
      if (limit && out.length >= limit) return;
    }
  }
  function querySelAll(root, sel, limit) {
    var out = [];
    var groups = String(sel).split(',');
    for (var g = 0; g < groups.length; g++) {
      var parts = groups[g].trim().split(/\s+/);
      walkCollect(root, parts, out, limit);
      if (limit && out.length >= limit) break;
    }
    return out;
  }

  /* ------------------------------------------------------------- document */
  var BASE_HTML =
    '<div id="wrap"><canvas id="c"></canvas><div id="ov"></div>' +
    '<div id="cine" class="h"><canvas id="cc" width="352" height="240"></canvas>' +
    '<div class="cineVig"></div><div class="cineFlash" id="cFlash"></div>' +
    '<div class="cTop"><span id="cSkip" class="cSkip">SKIP</span></div>' +
    '<div id="cCap" class="cCap"><div class="cCapK"></div><div class="cCapT"></div><div class="cCapS"></div></div>' +
    '<div id="cDlg" class="cDlg"><div id="cWho" class="cWho"></div><div id="cText" class="cText"></div>' +
    '<div id="cChoices" class="cChoices"></div><div id="cNext" class="cNext">v</div></div></div></div>';

  doc = {
    _ids: {},
    nodeType: 9,
    title: 'Hollowdeep',
    getElementById: function (id) { return this._ids[id] || null; },
    createElement: function (tag) { return new El(tag); },
    createTextNode: function (t) { return new TextNode(t, null); },
    createTreeWalker: function (root) {
      var nodes = [], idx = 0;
      (function walk(n) {
        for (var i = 0; i < n.childNodes.length; i++) {
          var c = n.childNodes[i];
          if (c.nodeType === 3) nodes.push(c);
          else if (c.nodeType === 1) walk(c);
        }
      })(root);
      return {
        currentNode: null,
        nextNode: function () {
          if (idx < nodes.length) { this.currentNode = nodes[idx++]; return true; }
          return false;
        }
      };
    },
    querySelector: function (sel) {
      var out = querySelAll(this.documentElement, sel, 1);
      return out.length ? out[0] : null;
    },
    querySelectorAll: function (sel) { return querySelAll(this.documentElement, sel, 0); },
    addEventListener: function (t, fn) { addWinListener(t, fn); },
    removeEventListener: function (t, fn) { removeWinListener(t, fn); },
    _destroy: function () {}
  };
  doc.documentElement = new El('html');
  doc.body = new El('body');
  doc.head = new El('head');
  doc.documentElement.appendChild(doc.head);
  doc.documentElement.appendChild(doc.body);

  var baseNodes = parseHTML(BASE_HTML);
  for (var bi = 0; bi < baseNodes.length; bi++) doc.body.appendChild(baseNodes[bi]);
  doc._ids = {};
  (function register(el) {
    if (el.id) doc._ids[el.id] = el;
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 1) register(el.childNodes[i]);
    }
  })(doc.documentElement);

  /* ----------------------------------------------------------------- Image */
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var B64LOOK = null;
  function b64decode(str) {
    if (!B64LOOK) {
      B64LOOK = {};
      for (var k = 0; k < B64.length; k++) B64LOOK[B64.charAt(k)] = k;
    }
    var clean = String(str).replace(/[^A-Za-z0-9+/=]/g, '');
    var len = clean.length;
    while (len > 0 && clean.charAt(len - 1) === '=') len--;
    var out = new Uint8Array((len * 3) >> 2);
    var o = 0, buf = 0, bits = 0;
    for (var i = 0; i < len; i++) {
      buf = (buf << 6) | B64LOOK[clean.charAt(i)];
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out[o++] = (buf >> bits) & 255;
      }
    }
    return out;
  }

  function Image() {
    this.width = 0;
    this.height = 0;
    this.complete = false;
    this._imgId = 0;
    this._src = '';
    this.onload = null;
    this.onerror = null;
  }
  Object.defineProperty(Image.prototype, 'src', {
    get: function () { return this._src; },
    set: function (v) {
      this._src = String(v);
      var comma = this._src.indexOf('base64,');
      if (comma < 0) { this.complete = false; return; }
      if (!this._imgId) this._imgId = G(OP.IMAGE_NEW);
      var bytes = b64decode(this._src.substr(comma + 7));
      var ok = G(OP.IMAGE_LOAD, this._imgId, bytes.buffer);
      if (ok) {
        this.width = G(OP.IMAGE_INFO, this._imgId, 0);
        this.height = G(OP.IMAGE_INFO, this._imgId, 1);
        this.complete = true;
        if (this.onload) { try { this.onload(); } catch (e) { console.error(e); } }
      }
    }
  });

  /* ------------------------------------------------------------ localStorage */
  var store = {};
  var storeDirty = false;
  var storeTimer = 0;
  (function loadStore() {
    var raw = G(OP.STORAGE_LOAD);
    if (raw) {
      try { store = JSON.parse(raw) || {}; } catch (e) { store = {}; }
    }
  })();
  function flushStore() {
    if (!storeDirty) return;
    storeDirty = false;
    try { G(OP.STORAGE_SAVE, JSON.stringify(store)); } catch (e) { console.error(e); }
  }
  var localStorage = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); storeDirty = true; flushStore(); },
    removeItem: function (k) { delete store[k]; storeDirty = true; flushStore(); },
    clear: function () { store = {}; storeDirty = true; flushStore(); },
    key: function (i) { return Object.keys(store)[i] || null; },
    get length() { return Object.keys(store).length; }
  };
  Object.defineProperty(localStorage, 'length', { get: function () { return Object.keys(store).length; } });

  /* --------------------------------------------------------------- events */
  var winListeners = {};
  function addWinListener(t, fn) { (winListeners[t] || (winListeners[t] = [])).push(fn); }
  function removeWinListener(t, fn) {
    var a = winListeners[t];
    if (!a) return;
    var i = a.indexOf(fn);
    if (i >= 0) a.splice(i, 1);
  }
  function dispatchWin(type, ev) {
    var a = winListeners[type];
    if (!a) return;
    ev.type = type;
    for (var i = 0; i < a.length; i++) {
      try { a[i].call(globalThis, ev); } catch (e) { console.error(e); }
    }
  }

  /* --------------------------------------------------------------- timers */
  var timers = [];
  var timerSeq = 1;
  var rafCb = null;
  function setTimeout(fn, ms) {
    var id = timerSeq++;
    timers.push({ id: id, at: nowMs() + (ms || 0), fn: fn, once: true, period: 0 });
    return id;
  }
  function setInterval(fn, ms) {
    var id = timerSeq++;
    var period = Math.max(16, ms || 16);
    timers.push({ id: id, at: nowMs() + period, fn: fn, once: false, period: period });
    return id;
  }
  function clearTimer(id) {
    for (var i = 0; i < timers.length; i++) if (timers[i].id === id) { timers.splice(i, 1); return; }
  }
  function runTimers(t) {
    for (var i = timers.length - 1; i >= 0; i--) {
      var tm = timers[i];
      if (!tm) continue;
      if (tm.at <= t) {
        if (tm.once) timers.splice(i, 1);
        else tm.at = t + tm.period;
        try { tm.fn(); } catch (e) { console.error(e); }
      }
    }
  }
  function requestAnimationFrame(cb) { rafCb = cb; return 1; }
  function cancelAnimationFrame() { rafCb = null; }

  /* ----------------------------------------------------------------- time */
  var pageT0 = G(OP.MEASURE, '', 1) === 0 ? 0 : 0;
  function nowMs() { return Date.now(); }
  void pageT0;

  /* -------------------------------------------------------------- globals */
  var g = globalThis;
  g.window = g;
  g.self = g;
  g.document = doc;
  g.navigator = { language: 'it-IT', languages: ['it-IT'], platform: 'PlayStation Vita', userAgent: 'HollowdeepVita' };
  g.localStorage = localStorage;
  g.console = console;
  g.Image = Image;
  g.Gradient = Gradient;
  g.Ctx = Ctx;
  g.El = El;
  g.addEventListener = addWinListener;
  g.removeEventListener = removeWinListener;
  g.dispatchEvent = function (ev) { dispatchWin(ev.type, ev); return true; };
  g.requestAnimationFrame = requestAnimationFrame;
  g.cancelAnimationFrame = cancelAnimationFrame;
  g.setTimeout = setTimeout;
  g.setInterval = setInterval;
  g.clearTimeout = clearTimer;
  g.clearInterval = clearTimer;
  g.innerWidth = 960;
  g.innerHeight = 544;
  g.devicePixelRatio = 1;
  g.getComputedStyle = function () { return { paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px' }; };
  g.atob = function (s) {
    var bytes = b64decode(s);
    var out = '';
    for (var i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
    return out;
  };
  g.btoa = function (s) {
    var out = '';
    for (var i = 0; i < s.length; i += 3) {
      var a = s.charCodeAt(i) & 255, b = (i + 1 < s.length ? s.charCodeAt(i + 1) : 0) & 255,
          c = (i + 2 < s.length ? s.charCodeAt(i + 2) : 0) & 255;
      out += B64.charAt(a >> 2) + B64.charAt(((a & 3) << 4) | (b >> 4)) +
             (i + 1 < s.length ? B64.charAt(((b & 15) << 2) | (c >> 6)) : '=') +
             (i + 2 < s.length ? B64.charAt(c & 63) : '=');
    }
    return out;
  };
  g.matchMedia = function () { return { matches: false, addListener: function () {}, addEventListener: function () {} }; };
  g.NodeFilter = { SHOW_TEXT: 4, SHOW_ELEMENT: 1, SHOW_ALL: 0xFFFFFFFF };
  g.MutationObserver = function (cb) {
    this._cb = cb;
    this.observe = function () {};
    this.disconnect = function () {};
    this.takeRecords = function () { return []; };
  };
  g.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  g.HTMLElement = function () {};
  g.performance = { now: function () { return nowMs(); } };
  g.__T = {
    selfId: 'VITA0000000000000000',
    joinRoom: function () { throw new Error('Online multiplayer is not available in the Vita build.'); }
  };
  g.__hiddenAudio = true;

  /* ------------------------------------------------------------ input/loop */
  g.__vita_key = function (key, down) {
    var ev = {
      key: key, code: key, repeat: false, target: null, isTrusted: true,
      preventDefault: function () {}, stopPropagation: function () {}
    };
    dispatchWin(down ? 'keydown' : 'keyup', ev);
  };
  g.__vita_touch = function (kind, x, y) {
    var cv = doc.getElementById('c');
    if (!cv) return;
    var ev = {
      type: kind, clientX: x, clientY: y, pageX: x, pageY: y, pointerId: 1,
      pointerType: 'touch', isPrimary: true, button: 0, buttons: kind === 'pointerdown' ? 1 : 0,
      target: cv, preventDefault: function () {}, stopPropagation: function () {},
      setPointerCapture: function () {}, releasePointerCapture: function () {}
    };
    cv.dispatchEvent(ev);
  };

  var lastT = 0;
  g.__vita_frame = function (ms) {
    lastT = ms;
    runTimers(ms);
    if (rafCb) {
      var cb = rafCb;
      rafCb = null;
      try { cb(ms); } catch (e) { console.error('loop: ' + (e && e.stack ? e.stack : e)); }
    }
    try {
      if (g.__vita_render) g.__vita_render(ms);
    } catch (e) {
      console.error('render: ' + (e && e.stack ? e.stack : e));
    }
    flushStore();
  };
  g.__vita_now = function () { return lastT; };
  g.__vita_quit = function () { G(OP.QUIT); };
  g.__vita_set_canvas = function (game, overlay) { G(OP.SET_CANVAS, game || 0, overlay || 0); };
  g.__vita_set_overlay = function (on) { G(OP.SET_OVERLAY, on ? 1 : 0); };
  g.__vita_log = log;
})();
