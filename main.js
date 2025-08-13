// main.js
import { Terminal } from './terminal.js';
import { GridSession } from './gridview.js';
import { buildGolFile } from './atlas_gen.js';
import atlas from './data/atlas.map.js';
import { ecc_repair } from './ecc_repair.js';
import { buildFS } from './fs.js';

const root = buildFS();
const term = new Terminal(root, makeExes());
let session = new GridSession('.');

// ---------- UI elements ----------
const screen = document.getElementById('screen');
const input  = document.getElementById('input');
const promptEl = document.getElementById('prompt');


// === OVERLAY (canonical) ===
const overlay = document.getElementById('overlay');
const closeOverlayBtn = document.getElementById('closeOverlay');
const inputEl = document.getElementById('input');

function openOverlay() {
  overlay.hidden = false;            // semantic
  overlay.style.display = 'grid';    // visual (matches our CSS)
  (closeOverlayBtn || inputEl).focus();
}
function closeOverlay() {
  overlay.hidden = true;
  overlay.style.display = 'none';
  inputEl?.focus();
}
function toggleOverlay() {
  // Show if hidden OR display is 'none'; otherwise close
  const isHidden = overlay.hidden || getComputedStyle(overlay).display === 'none';
  if (isHidden) openOverlay(); else closeOverlay();
}

// Backdrop click closes (only if you click outside the inner panel)
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeOverlay();
});

// Close button
closeOverlayBtn?.addEventListener('click', () => closeOverlay());

// Keys: F1 toggles, Esc closes
document.addEventListener('keydown', (e) => {
  if (e.key === 'F1') { e.preventDefault(); toggleOverlay(); }
  if (e.key === 'Escape' || e.key === 'Esc') closeOverlay();
});
// === END OVERLAY ===


// ---------- State for UX ----------
const CMD_LIST = ["ls","cd","open","cat","run","history","clear","help","bloom","calibrate","aim","atlas","transmit"];
let history = [];
let histIdx = -1;
let lastLsBasePath = '/'; // for clickable ls items

// ---------- Boot ----------
write(`FotE Terminal – type "help" to begin.`);
renderPrompt();
input.focus();

// ---------- Events (except overlay) ----------
input.addEventListener('keydown', onKeyDown);
document.addEventListener('click', (e)=> {
  // copy on dblclick
  if (e.detail === 2) {
    const sel = window.getSelection().toString();
    if (sel.trim()) {
      navigator.clipboard?.writeText(sel).then(()=> flash(`[copied ${sel.length} chars]`));
    }
  }
});


// ---------- Input handling ----------
function onKeyDown(e) {
  // History nav
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (history.length === 0) return;
    if (histIdx < 0) histIdx = history.length - 1;
    else histIdx = Math.max(0, histIdx - 1);
    input.value = history[histIdx];
    setCaretToEnd(input);
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (history.length === 0) return;
    if (histIdx < 0) return;
    histIdx++;
    if (histIdx >= history.length) {
      histIdx = -1;
      input.value = '';
    } else {
      input.value = history[histIdx];
      setCaretToEnd(input);
    }
    return;
  }

  // Clear
  if (e.ctrlKey && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    screen.textContent = '';
    renderPrompt();
    return;
  }

  // Tab complete
  if (e.key === 'Tab') {
    e.preventDefault();
    doAutocomplete();
    return;
  }

  // Enter
  if (e.key === 'Enter') {
    const cmd = input.value.trim();
    beep(110, 0.04);
    write(`${getPwd()} $ ${cmd}`);
    if (cmd) { history.push(cmd); histIdx = -1; }
    const out = execute(cmd);
    if (out && typeof out === 'string') {
      // If this was `ls`, render rich
      const wasLs = cmd.split(/\s+/)[0] === 'ls';
      if (wasLs) renderLs(out);
      else write(out);
    }
    input.value = '';
    renderPrompt();
    return;
  }
}

// ---------- Execute commands ----------
function execute(raw) {
  if (!raw) return '';
  const [cmd, ...rest] = raw.trim().split(/\s+/);

  // intercept ls to capture base path for clickable items
  if (cmd === 'ls') {
    lastLsBasePath = normBase(rest[0]);
    try { return term.list(rest[0]); }
    catch (e) { return `Error: ${e.message}`; }
  }

  // let Terminal handle everything else
  const out = term.cmd(raw);

  // keep countdown visible if present
  if (term.state.armed || term.state.defused) {
    const node = term.find('/.eden/flower/countdown.gen');
    if (node) {
      writeDim(node.content);
    }
  }
  return out;
}

function normBase(p) {
  if (!p) return term.cwd.join('/').replace(/\/$/, '');
  if (p.startsWith('/')) return p.replace(/\/$/, '');
  const base = term.cwd.join('/').replace(/\/$/, '');
  return base + '/' + p.replace(/\/$/, '');
}

// ---------- Rendering ----------
function renderPrompt() {
  promptEl.textContent = `${getPwd()} $`;
}
function getPwd() { return term.cwd.join('/'); }

function write(text='') {
  if (!text.endsWith('\n')) text += '\n';
  screen.textContent += text;
  screen.scrollTop = screen.scrollHeight;
}
function writeDim(text='') {
  if (!text) return;
  const span = document.createElement('span');
  span.className = 'copyhint';
  span.textContent = `\n${text}\n`;
  screen.appendChild(span);
  screen.scrollTop = screen.scrollHeight;
}
function flash(msg) {
  const span = document.createElement('span');
  span.className = 'copyhint';
  span.textContent = `\n${msg}\n`;
  screen.appendChild(span);
  setTimeout(()=> span.remove(), 1200);
}

// Rich `ls` with clickable tokens
function renderLs(listString) {
  const base = lastLsBasePath || getPwd();
  const names = listString.split('\n').filter(Boolean);
  if (names.length === 0) { write('(empty)'); return; }

  const line = document.createElement('div');
  for (let i=0;i<names.length;i++) {
    const name = names[i];
    const span = document.createElement('span');
    const isDir = name.endsWith('/');
    span.textContent = name;
    span.className = `token ${isDir ? 'dir' : classifyFile(name)}`;
    span.title = isDir ? `cd ${joinPath(base, name)}` : `open ${joinPath(base, name)}`;
    span.addEventListener('click', () => {
      const path = joinPath(base, name);
      write(`${getPwd()} $ ${isDir ? 'cd' : 'open'} ${path}`);
      const out = isDir ? term.cmd(`cd ${path}`) : term.cmd(`open ${path}`);
      if (out) write(out);
      renderPrompt();
    });
    line.appendChild(span);
    if (i < names.length - 1) line.appendChild(document.createTextNode('  '));
  }
  screen.appendChild(line);
  screen.appendChild(document.createTextNode('\n'));
  screen.scrollTop = screen.scrollHeight;
}

function classifyFile(name) {
  if (name.endsWith('.exe')) return 'exec';
  return 'file';
}

function joinPath(base, name) {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  return (name.startsWith('/') ? name : `${b}/${name}`).replace(/\/+/g, '/').replace(/\/$/, '');
}

function setCaretToEnd(el) {
  const len = el.value.length;
  el.setSelectionRange(len, len);
}

// ---------- Autocomplete ----------
function doAutocomplete() {
  const raw = input.value;
  const parts = raw.split(/\s+/);
  const atCmd = parts.length <= 1 || raw.endsWith(' ');
  // complete command
  if (parts.length === 1 || (parts.length > 1 && parts[0] === '' && !raw.includes(' '))) {
    const sub = parts[0] || '';
    const matches = CMD_LIST.filter(c => c.startsWith(sub));
    if (matches.length === 1) input.value = matches[0] + ' ';
    else if (matches.length > 1) write(matches.join('   '));
    return;
  }
  // complete path after cd/open/cat/run plaintext.exe load
  const cmd = parts[0];
  const partial = parts.slice(1).join(' ').trim();
  if (['cd','open','cat','ls'].includes(cmd) || (cmd==='run' && /plaintext\.exe\s+load/.test(raw))) {
    const baseDir = term.cwd.join('/');
    const { dirPart, namePart, node } = resolveDirAndName(partial, baseDir);
    if (!node || node.type !== 'dir') return;
    const candidates = Object.keys(node.children)
      .filter(n => (term.showHidden || (!n.startsWith('.') && !node.children[n].hidden)))
      .filter(n => term.clearance >= (node.children[n].clearance ?? 1))
      .filter(n => n.startsWith(namePart));
    if (candidates.length === 1) {
      const suffix = node.children[candidates[0]].type === 'dir' ? '/' : '';
      const completed = dirPart + candidates[0] + suffix;
      input.value = `${cmd} ${completed}`;
    } else if (candidates.length > 1) {
      write(candidates.map(n => node.children[n].type==='dir' ? n+'/' : n).join('  '));
    }
  }
}

function resolveDirAndName(text, baseDir) {
  let dirPart = '';
  let namePart = '';
  if (!text || text === '.') {
    dirPart = '';
    namePart = '';
  } else {
    const hasSlash = text.lastIndexOf('/') !== -1;
    if (hasSlash) {
      dirPart = text.slice(0, text.lastIndexOf('/') + 1);
      namePart = text.slice(text.lastIndexOf('/') + 1);
    } else {
      dirPart = '';
      namePart = text;
    }
  }
  const fullDir = (dirPart.startsWith('/') ? dirPart : (baseDir.replace(/\/$/, '') + '/' + dirPart)).replace(/\/+$/, '/');
  const node = term.find(fullDir);
  return { dirPart: (dirPart || ''), namePart, node };
}

// ---------- Tiny SFX ----------
let audioCtx;
function beep(freq = 120, dur = 0.05) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.value = 0.02;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    setTimeout(()=> { o.stop(); o.disconnect(); g.disconnect(); }, dur * 1000);
  } catch {}
}

// ---------- EXEs ----------
function makeExes() {
  return {
    'plaintext.exe': (args, term) => {
      const mode = (args[0] || '').toLowerCase();
      if (mode === 'load' && args[1]) {
        const node = term.find(args[1]);
        if (!node || node.type !== 'file') return 'No such file.';
        session.load(node.content);
        const userLast = term.find('/patterns/user/last.txt');
        if (userLast) userLast.content = node.content;
        return `Pattern loaded from ${args[1]}.`;
      }
      const text = args.join(' ') || '.';
      session.load(text);
      const userLast = term.find('/patterns/user/last.txt');
      if (userLast) userLast.content = text;
      return 'Pattern loaded into session.';
    },

    'gridview.exe': (args, term) => {
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'next') {
        const out = session.next();
        if (term.state.armed) {
          term.state.gen = Math.min(19, term.state.gen + 1);
          term.updateCountdown();
          if (term.state.gen > 3 && !term.state.defused) {
            return out + `\n[WARN] Protocol beyond Gen 3 (${term.state.gen}/19). Use 'aim' to defocus.`;
          }
        }
        return out;
      }
      if (sub === 'prev') return session.prev();
      if (sub === 'measure') {
        const m = session.measure(10);
        return `period=${m.period ?? 'unknown'}\nheat=${m.heat.toFixed(2)}\nvolatility=${(m.volatility*100).toFixed(2)}%\nspeed=${m.speed ?? '—'}`;
      }
      return `Usage: run gridview.exe next|prev|measure`;
    },

    'spectra.exe': () => `λ21cm: stable\nCMB: ripples detected\n(note: visualization omitted in TTY)`,

    'atlas.exe': () => `Atlas ready. Loaded ${Object.keys(atlas.glyphs).length} glyphs at +${atlas.generation}.`,

    'ecc_repair.exe': (args, term) => {
      if (!args || !args[0]) {
        const node = term.find('/.eden/flower/message.cor');
        if (!node) return 'No default message found.';
        try {
          const out = ecc_repair(node.content);
          node.content = out.repaired_message + '\n' + node.content.split('\n')[1];
          return `Repaired: ${out.repaired_message}\nRecovered=${out.recovered} (ASCII ${out.ascii})`;
        } catch (e) {
          return `ECC error: ${e.message}`;
        }
      } else {
        try {
          const out = ecc_repair(args[0]);
          return `Repaired: ${out.repaired_message}\nRecovered=${out.recovered} (ASCII ${out.ascii})`;
        } catch (e) {
          return `ECC error: ${e.message}`;
        }
      }
    },

    'transmit.exe': (args, term) => {
      const phrase = (args && args.length) ? args.join(' ') : 'WE ARE OUR OWN ANCESTOR DEFUSE THE LENS DECIDE WHAT TO SEND';
      const gol = buildGolFile(phrase, atlas, { glyphsPerRow: 8, colSpacing: 1, rowSpacing: 1 });
      const outDir = term.find('/out');
      outDir.children['transmitted.txt'] = new (term.root.constructor)('file', { content: gol, name:'transmitted.txt' });
      return `Transmission prepared to /out/transmitted.txt\n(Preview)\n${gol}`;
    },

    'blind.exe': (args, term) => {
      const atlasLock = term.find('/.eden/locks/atlas.lock');
      if (atlasLock) atlasLock.content = 'DELETED';
      const msg = term.find('/.eden/flower/message.gol');
      if (msg) msg.content = '[PURGED]';
      return 'Atlas purged and message removed. The satellite goes dark.';
    },
  };
}
