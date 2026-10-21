#!/usr/bin/env node
/* Local smoke test for the JS layer (shim + ui + the game itself).
 * The native rasterizer is replaced by a stub that records calls, so we can
 * check the browser shim and the menu renderer without a compiler.
 *
 *   node tools/local_test.js [frames]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.dirname(__dirname);
const frames = parseInt(process.argv[2] || '240', 10);

const canvases = new Map();
let nextCanvas = 1;
let nextGrad = 1;
let nextImg = 1;
const logs = [];
const opCounts = {};
const errors = [];
let storage = null;

globalThis.__g = function (op, ...args) {
  opCounts[op] = (opCounts[op] || 0) + 1;
  switch (op) {
    case 1: {
      const id = nextCanvas++;
      canvases.set(id, { w: args[0] | 0, h: args[1] | 0 });
      return id;
    }
    case 2: canvases.delete(args[0]); return undefined;
    case 27: return String(args[0]).length * (args[1] || 8) * 0.98;
    case 28: return nextGrad++;
    case 30: return nextImg++;
    case 31: return 1;
    case 33: return args[1] ? 512 : 512;
    case 34: {
      const c = canvases.get(args[0]);
      if (!c) return 0;
      return args[1] ? c.h : c.w;
    }
    case 35: return storage;
    case 36: storage = args[0]; return undefined;
    case 37: logs.push({ level: args[0], msg: String(args[1]) }); return undefined;
    default: return 0;
  }
};

const out = console.log.bind(console); // the game replaces global console with its own
const stderrWrite = process.stderr.write.bind(process.stderr);
const ctx = vm.createContext(globalThis);
globalThis.globalThis = globalThis;

function run(file) {
  const code = fs.readFileSync(file, 'utf8');
  try {
    vm.runInContext(code, ctx, { filename: path.relative(ROOT, file) });
    return true;
  } catch (e) {
    errors.push(path.basename(file) + ': ' + (e && e.stack ? e.stack : e));
    return false;
  }
}

const files = [
  path.join(ROOT, 'vita/js/shim.js'),
  path.join(ROOT, 'vita/js/ui.js'),
];
const assets = path.join(ROOT, 'vita/assets');
for (const f of fs.readdirSync(assets).filter(f => /^game_\d+\.js$/.test(f)).sort()) {
  files.push(path.join(assets, f));
}

for (const f of files) {
  if (!run(f)) {
    stderrWrite('\n[local_test] FAILED loading ' + f + '\n');
    stderrWrite(errors[errors.length - 1] + '\n');
    process.exit(1);
  }
}

function describeScreen() {
  const ov = globalThis.document.getElementById('ov');
  const cine = globalThis.document.getElementById('cine');
  const out = { scr: ov.dataset.scr || '', ovHidden: ov.classList.contains('h') };
  if (!out.ovHidden) {
    const title = ov.querySelector('.logo') || ov.querySelector('.h2');
    out.title = title ? title.textContent.trim() : '';
    out.buttons = ov.querySelectorAll('.mb').map(b => (b.classList.contains('on') ? '*' : ' ') + b.textContent.trim());
    out.cards = ov.querySelectorAll('.cd').map(c => (c.classList.contains('on') ? '*' : '') + (c.querySelector('b') || { textContent: '' }).textContent);
    out.text = ov.textContent.replace(/\s+/g, ' ').trim().slice(0, 160);
  }
  out.cineOpen = !cine.classList.contains('h');
  return out;
}

const key = (k, down) => globalThis.__vita_key(k, down);
const script = {};
function addKey(frame, spec) {
  let down = true;
  if (spec.length > 2 && spec.slice(-2) === 'Up') { spec = spec.slice(0, -2); down = false; }
  if (spec === 'Space') spec = ' ';
  (script[frame] || (script[frame] = [])).push([spec, down]);
}
if (process.argv[3]) {
  for (const part of process.argv[3].split(',')) {
    const i = part.indexOf(':');
    if (i > 0) addKey(parseInt(part.slice(0, i), 10), part.slice(i + 1));
  }
} else {
  // default: story mode intro (NUOVA STORIA -> cinematic)
  addKey(8, 'Enter'); addKey(10, 'EnterUp');
  addKey(30, 'Enter'); addKey(32, 'EnterUp');
  addKey(60, ' '); addKey(62, ' SpaceUp');
}

let crashed = null;
for (let f = 0; f < frames; f++) {
  if (script[f]) for (const [k, d] of script[f]) key(k, d);
  try {
    globalThis.__vita_frame(f * 33.333);
  } catch (e) {
    crashed = e;
    break;
  }
  if (f === 6 || f === 30 || f === 60 || f === 120 || f === 180) {
    out('[frame ' + f + '] ' + JSON.stringify(describeScreen()));
  }
}

out('\n[local_test] ops: ' + Object.keys(opCounts).sort((a, b) => a - b)
  .map(k => k + '=' + opCounts[k]).join(' '));
out('[local_test] console output:');
for (const l of logs.slice(0, 40)) out('  ' + (l.level ? 'warn/err' : 'log') + ': ' + l.msg.slice(0, 400));
if (crashed) {
  out('[local_test] CRASH: ' + (crashed.stack || crashed));
  process.exit(1);
}
const errorLogs = logs.filter(l => l.level === 2);
if (errors.length || errorLogs.length) {
  out('[local_test] FAILED: ' + errors.length + ' load errors, ' + errorLogs.length + ' runtime errors');
  process.exit(1);
}
out('[local_test] OK');
