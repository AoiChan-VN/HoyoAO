// kernel/bus.js — IPC event bus: namespaced + wildcard
export function createBus(){
  const map = new Map(); let seq = 0;
  const match = (pattern, ch) => {
    if (!pattern.includes('*')) return pattern === ch;
    return new RegExp('^' + pattern.split('*').join('.*') + '$').test(ch);
  };
  return {
    on(ch, fn){
      const id = ++seq;
      if (!map.has(ch)) map.set(ch, new Map());
      map.get(ch).set(id, fn);
      return () => map.get(ch)?.delete(id);
    },
    once(ch, fn){ const off = this.on(ch, d => { off(); fn(d); }); return off; },
    emit(ch, payload){
      for (const [pattern, fns] of map)
        if (match(pattern, ch)) fns.forEach(fn => fn(payload));
    },
    offAll(ch){ map.delete(ch); },
  };
} 
