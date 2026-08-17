async loadModules(list){
  for (const entry of list.filter(m => m.enabled !== false)) {
    try {
      const mod = await import(new URL('../' + entry.path, import.meta.url).href);
      const inst = mod.default;
      inst.__entry = entry;
      this.modules.push(inst);
      (inst.manifest.routes || []).forEach(r => this.routes.set(r, inst));
      
      if (inst.manifest.styles) {
        const href = new URL(inst.manifest.styles, import.meta.url).href;
        if (!document.querySelector(`link[data-mod="${entry.id}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet'; link.href = href;
          link.dataset.mod = entry.id;
          document.head.append(link);
        }
      }
      await inst.init?.(this);
    } catch (err) {
      console.error(`[Kernel] Module "${entry.id}" fail:`, err);
    }
  }
} 
