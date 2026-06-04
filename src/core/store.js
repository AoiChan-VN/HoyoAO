import globalEventBus from './event-bus.js';

class Store {
  constructor() {
    this.state = {
      settings: null,
      portfolio: null,
      currentSceneId: null,
      activeModalId: null,
      uiState: {
        theme: 'dark',
        menuVisible: true,
        settingsVisible: false
      }
    };
  }

  async init() {
    await this.initIndexedDB();
    await this.loadConfig();
    this.loadLocalState();
    this.applyTheme();
  }

  initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PortfolioVR_DB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets');
        }
      };
    });
  }

  async loadConfig() {
    try {
      const [settingsRes, portfolioRes] = await Promise.all([
        fetch('./data/settings.json'),
        fetch('./data/portfolio.json')
      ]);
      this.state.settings = await settingsRes.json();
      this.state.portfolio = await portfolioRes.json();
      this.state.currentSceneId = this.state.portfolio.scenes[0].id;
    } catch (error) {
      console.error(error);
    }
  }

  loadLocalState() {
    const key = this.state.settings?.system?.storageKey || 'portfolio_vr_state';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state.uiState = { ...this.state.uiState, ...parsed.uiState };
      } catch (e) {
        localStorage.removeItem(key);
      }
    }
  }

  saveLocalState() {
    const key = this.state.settings?.system?.storageKey || 'portfolio_vr_state';
    const dataToSave = { uiState: this.state.uiState };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  }

  getState() {
    return this.state;
  }

  setUiState(key, value) {
    this.state.uiState[key] = value;
    this.saveLocalState();
    if (key === 'theme') {
      this.applyTheme();
    }
    globalEventBus.emit('state:ui', this.state.uiState);
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.state.uiState.theme);
    if (this.state.uiState.theme === 'light') {
      document.documentElement.style.setProperty('--color-bg-raw', '250, 250, 250');
      document.documentElement.style.setProperty('--color-fg-raw', '24, 24, 27');
      document.documentElement.style.setProperty('--color-surface-raw', '255, 255, 255');
      document.documentElement.style.setProperty('--color-border-raw', '228, 228, 231');
      document.documentElement.style.setProperty('--color-accent-raw', '2, 132, 199');
      document.documentElement.style.setProperty('--color-accent-hover-raw', '3, 105, 161');
    } else {
      document.documentElement.style.setProperty('--color-bg-raw', '10, 10, 12');
      document.documentElement.style.setProperty('--color-fg-raw', '244, 244, 245');
      document.documentElement.style.setProperty('--color-surface-raw', '20, 20, 23');
      document.documentElement.style.setProperty('--color-border-raw', '39, 39, 42');
      document.documentElement.style.setProperty('--color-accent-raw', '14, 165, 233');
      document.documentElement.style.setProperty('--color-accent-hover-raw', '56, 189, 248');
    }
  }

  async getAsset(key) {
    return new Promise((resolve) => {
      if (!this.db) return resolve(null);
      const transaction = this.db.transaction('assets', 'readonly');
      const store = transaction.objectStore('assets');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async saveAsset(key, blob) {
    return new Promise((resolve) => {
      if (!this.db) return resolve(false);
      const transaction = this.db.transaction('assets', 'readwrite');
      const store = transaction.objectStore('assets');
      const request = store.put(blob, key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }
}

const globalStore = new Store();
export default globalStore;
 
