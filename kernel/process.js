// kernel/process.js — Process Manager
export function createProcessManager(bus){
  const procs = new Map(); let pid = 0;
  return {
    spawn(app){
      const p = { pid: ++pid, id: app.manifest.id, name: app.manifest.name,
        state: 'running', startedAt: Date.now() };
      procs.set(p.pid, p); bus.emit('proc:spawn', p); return p;
    },
    suspend(pid){ const p = procs.get(pid); if (p) { p.state = 'suspended'; bus.emit('proc:suspend', p); } },
    kill(pid){ const p = procs.get(pid); if (p) { p.state = 'stopped'; bus.emit('proc:kill', p); procs.delete(pid); } },
    list(){ return [...procs.values()]; },
    get(pid){ return procs.get(pid); },
  };
} 
