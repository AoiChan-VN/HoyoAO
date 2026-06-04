import { bus } from './event-bus.js';

export const store = {
    state: {
        theme: localStorage.getItem('theme') || 'dark',
        vrEnabled: JSON.parse(localStorage.getItem('vrEnabled') || 'true'),
        currentRoute: '#/'
    },
    set(key, val) {
        this.state[key] = val;
        localStorage.setItem(key, typeof val === 'object' ? JSON.stringify(val) : val);
        bus.emit(`state:${key}`, val);
    }
};

// Cấu hình IndexedDB để lưu trữ Asset / Data offline nếu cần
export const initDB = () => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('PortfolioDB', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('assets')) db.createObjectStore('assets');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};
 
