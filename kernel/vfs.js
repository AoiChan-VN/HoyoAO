// kernel/vfs.js — Virtual File System + adapter
// App KHÔNG chạm storage trực tiếp. Adapter đổi được theo nền tảng.
const NS = 'hoyoao://';

export function localStorageAdapter(){
  return {
    name: 'localStorage',
    async read(p){ const r = localStorage.getItem(NS + p); return r == null ? null : JSON.parse(r); },
    async write(p, d){ localStorage.setItem(NS + p, JSON.stringify(d)); return true; },
    async remove(p){ localStorage.removeItem(NS + p); return true; },
    async list(prefix = ''){
      const out = [];
      for (let i = 0; i < localStorage.length; i++){
        const k = localStorage.key(i);
        if (k.startsWith(NS + prefix)) out.push(k.slice(NS.length));
      }
      return out;
    },
    async size(){
      let b = 0;
      for (let i = 0; i < localStorage.length; i++){
        const k = localStorage.key(i);
        if (k.startsWith(NS)) b += (k.length + (localStorage.getItem(k) || '').length) * 2;
      }
      return b;
    },
  };
}

// VFS scope theo app: mọi path được prefix "apps/<id>/"
export function scopedVFS(base, appId, can){
  const root = `apps/${appId}/`;
  return {
    read:  p => can('vfs.read')  ? base.read(root + p)  : Promise.reject(new Error('no perm: vfs.read')),
    write: (p, d) => can('vfs.write') ? base.write(root + p, d) : Promise.reject(new Error('no perm: vfs.write')),
    remove:p => can('vfs.write') ? base.remove(root + p) : Promise.reject(new Error('no perm')),
    list:  p => base.list(root + (p || '')),
  };
}

export function createVFS(adapter = localStorageAdapter()){
  return { adapter: adapter.name, ...adapter };
} 
