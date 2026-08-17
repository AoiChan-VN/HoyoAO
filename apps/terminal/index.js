// apps/terminal/index.js — app THẬT, chỉ dùng ctx
export default {
  manifest: {
    id: 'terminal', name: 'Terminal', icon: 'pulse', group: 'MỞ RỘNG',
    entry: 'index.js', styles: ['style.css'], routes: ['terminal'],
    permissions: ['vfs.read', 'vfs.write', 'telemetry', 'router'], singleton: true,
  },

  mount(ctx, root){
    const { el } = ctx.ui;
    this.ctx = ctx;
    this.out = el('div', { class: 'term-out' });
    this.input = el('input', { class: 'term-in', placeholder: 'gõ: help',
      onkeydown: e => e.key === 'Enter' && this.run(e.target.value) });

    root.append(el('section', { class: 'panel terminal' },
      el('header', { class: 'term-head' },
        el('div', { class: 'term-dots' },
          el('span', { class: 'dot red' }), el('span', { class: 'dot yel' }), el('span', { class: 'dot grn' })),
        el('span', { class: 'term-title' }, `~ ${ctx.manifest.name}`)),
      el('div', { class: 'term-body', onclick: () => this.input.focus() },
        this.out,
        el('div', { class: 'term-line' }, el('span', { class: 'term-prompt' }, '❯ '), this.input))));

    this.print(`Welcome. Gõ <b>help</b>.`, 'raw');
  },

  unmount(){},

  print(t, mode = 'raw'){
    const line = this.ctx.ui.el('div', { class: 'term-line' });
    mode === 'raw' ? line.innerHTML = t : line.textContent = t;
    this.out.append(line); this.out.scrollTop = this.out.scrollHeight;
  },

  async run(cmd){
    const [name, ...args] = cmd.trim().split(/\s+/);
    this.print('❯ ' + cmd, 'text');
    const T = this.ctx.telemetry;
    const cmds = {
      help: () => 'help · sys · ping · ls · clear',
      sys: () => `platform: ${this.ctx.bridge.platform} · storage: ${T ? T.storageKB() + ' KB' : '—'}`,
      ping: async () => { const t0 = performance.now();
        await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
        return `PONG ${Math.round(performance.now() - t0)} ms`; },
      ls: async () => (await this.ctx.vfs.list('')).join('\n') || '(trống)',
      clear: () => '__CLEAR__',
    };
    const fn = cmds[name];
    if (!fn) return this.print(`not found: ${name}`, 'text');
    const out = await fn(args);
    if (out === '__CLEAR__') this.out.innerHTML = '';
    else if (out != null) this.print(out, 'raw');
    this.input.value = '';
  },
}; 
