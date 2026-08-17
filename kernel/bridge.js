// kernel/bridge.js — Native Bridge (Universal Platform)
function detect(){
  if (window.__TAURI__)   return 'tauri';
  if (window.electronAPI) return 'electron';
  if (matchMedia('(display-mode: standalone)').matches) return 'pwa';
  return 'web';
}
export const bridge = {
  platform: detect(),
  get isNative(){ return this.platform === 'electron' || this.platform === 'tauri'; },
  // Chọn adapter VFS theo nền tảng (hiện tại: localStorage; native sẽ thay bằng fs)
  pickAdapter(localStorageAdapter){
    // if (this.platform==='electron') return electronFSAdapter(window.electronAPI);
    // if (this.platform==='tauri')    return tauriFSAdapter(window.__TAURI__);
    return localStorageAdapter;
  },
  async openExternal(url){
    if (this.platform === 'tauri')  return window.__TAURI__.shell?.open?.(url);
    if (this.platform === 'electron') return window.electronAPI?.openExternal?.(url);
    window.open(url, '_blank');
  },
}; 
