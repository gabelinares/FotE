// terminal.js
export class FileNode {
  constructor(type, opts = {}) {
    this.type = type;                   // 'dir' | 'file'
    this.children = opts.children || {};
    this.content = opts.content || '';
    this.hidden = !!opts.hidden;
    this.clearance = opts.clearance ?? 1;
    this.exec = !!opts.exec;            // treated as EXE by dispatcher
    this.live = !!opts.live;
    this.name = opts.name || '';        // helpful for debugging
  }
}

export class Terminal {
  constructor(fsRoot, exes) {
    this.root = fsRoot;
    this.cwd = ['/'];
    this.showHidden = false;
    this.clearance = 1;
    this.exes = exes;
    this.history = [];

    this.state = {
      armed: false,
      gen: 0,
      defused: false,
      focuser: 'ENGAGED',
      liveCounters: {},                 // path -> index (for LIVE appends)
      lastOpenedPath: null
    };
  }

  // ---------- FS helpers ----------
  normPath(path) {
    if (!path || path === '.') return this.cwd.join('/');
    if (path.startsWith('/')) return path;
    const base = this.cwd.join('/');
    return (base.endsWith('/') ? base : base + '/') + path;
  }
  resolve(path) {
    const parts = this.normPath(path).split('/').filter(Boolean);
    let node = this.root;
    for (const p of parts) {
      if (!node || node.type !== 'dir') return null;
      node = node.children[p];
    }
    return node || this.root;
  }
  list(path='.') {
    const node = this.resolve(path);
    if (!node || node.type !== 'dir') throw new Error('Not a directory');
    const out = [];
    for (const [name, child] of Object.entries(node.children)) {
      if (!this.showHidden && (name.startsWith('.') || child.hidden)) continue;
      if (this.clearance < (child.clearance ?? 1)) continue;
      out.push(name + (child.type === 'dir' ? '/' : ''));
    }
    return out.join('\n');
  }
  cd(path) {
    const p = this.normPath(path);
    const node = this.resolve(p);
    if (!node || node.type !== 'dir') throw new Error('No such directory');
    if (this.clearance < (node.clearance ?? 1)) throw new Error('Insufficient clearance');

    this.cwd = p.split('/').filter(Boolean);
    this.cwd.unshift('/');

    // Protocol hook: entering /.eden/flower arms if not defused
    if (p.endsWith('/.eden/flower') && !this.state.defused && !this.state.armed) {
      this.state.armed = true;
      this.state.gen = 0;
      this.updateCountdown();
    }
    return '';
  }

  // LIVE append behavior
  liveAppendFor(path, index) {
    if (path.endsWith('/sensors/cmb.txt')) {
      const phrase = 'STRANGELET_LENS.OFF';
      if (index < phrase.length) return phrase[index];
      return null;
    }
    return null;
  }

  cat(path) {
    const node = this.resolve(path);
    if (!node || node.type !== 'file') throw new Error('No such file');
    if (this.clearance < (node.clearance ?? 1)) throw new Error('Insufficient clearance');

    this.state.lastOpenedPath = this.normPath(path);

    // LIVE files mutate on open
    if (node.live) {
      const key = this.normPath(path);
      const i = (this.state.liveCounters[key] ?? 0);
      const append = this.liveAppendFor(key, i);
      this.state.liveCounters[key] = i + 1;
      if (append) node.content = node.content.replace(/\s*$/, '') + '\n' + append;
    }
    return node.content;
  }
  open(path) { return this.cat(path); }

  // Utilities for protocol
  find(path) { return this.resolve(path); }
  updateCountdown() {
    const f = this.find('/.eden/flower/countdown.gen');
    if (f) {
      const status = this.state.armed ? 'ARMED' : 'DISARMED';
      f.content = `GEN: ${this.state.gen}/19 (${status})`;
    }
  }

  run(exeName, ...args) {
    const fn = this.exes[exeName];
    if (!fn) throw new Error(`Unknown program: ${exeName}`);
    return fn(args, this);
  }

  // ---------- Commands ----------
  cmd(input) {
    if (!input.trim()) return '';
    this.history.push(input);
    const [cmd, ...rest] = input.trim().split(/\s+/);
    try {
      switch (cmd) {
        case 'ls':      return this.list(rest[0]);
        case 'cd':      return this.cd(rest[0] || '/');
        case 'cat':
        case 'open':    return this.cat(rest[0]);
        case 'run':     return this.run(rest[0], ...rest.slice(1));
        case 'history': return this.history.join('\n');
        case 'clear':   return '';
        case 'help':    return this.helpText();
        case 'bloom':   this.showHidden = true; return 'Hidden entries visible.';
        case 'calibrate': return this.calibrate(rest.join(' '));
        case 'aim':     return this.aim(rest.join(' '));
        case 'atlas':   return this.run('atlas.exe');
        case 'transmit':return this.run('transmit.exe');
        default:        return `Unknown command: ${cmd}`;
      }
    } catch (e) {
      return `Error: ${e.message}`;
    }
  }

  helpText() {
    return `Commands: ls, cd, open|cat, run <exe>, history, clear, help, bloom, calibrate, aim, atlas, transmit`;
  }

  calibrate(argLine) {
    const s = /S:\s*([0-9,]+)/i.exec(argLine);
    const b = /B:\s*([0-9,]+)/i.exec(argLine);
    if (!s || !b) return 'Enter laws as: calibrate S:2,3 B:3';
    const S = s[1].split(',').map(n => +n).sort().join(',');
    const B = b[1].split(',').map(n => +n).sort().join(',');
    if (S === '2,3' && B === '3') {
      this.clearance = Math.max(this.clearance, 2);
      return 'Calibration accepted. Clearance = 2.';
    }
    return 'Calibration rejected.';
  }

  aim(arg) {
    if (/STRANGELET_LENS\.OFF/.test(arg)) {
      this.state.focuser = 'DISENGAGED';
      this.clearance = Math.max(this.clearance, 5);
      this.state.defused = true;
      this.state.armed = false;
      this.updateCountdown();
      return 'Focuser DISENGAGED permanently.';
    }
    if (this.state.armed && this.state.gen >= 3) {
      this.state.armed = false;
      this.state.defused = true;
      this.state.focuser = 'DISENGAGED';
      this.clearance = Math.max(this.clearance, 4);
      this.updateCountdown();
      return 'Alignment dropped at Gen 3/19. Protocol DISARMED.';
    }
    return 'Nothing to defocus.';
  }
}
