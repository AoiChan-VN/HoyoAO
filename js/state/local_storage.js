import { database } from "./database.js";

export const localStorageSystem = {
    key: "3d_plane_shooter_2026_save",

    initialize() {
        this.load();
    },

    save() {
        try {
            const dataToSave = database.exportData();
            const serializedData = JSON.stringify(dataToSave);
            window.localStorage.setItem(this.key, serializedData);
            return true;
        } catch (e) {
            return false;
        }
    },

    load() {
        try {
            const serializedData = window.localStorage.getItem(this.key);
            if (!serializedData) {
                return false;
            }
            const parsedData = JSON.parse(serializedData);
            if (parsedData) {
                database.loadData(parsedData);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    },

    clear() {
        try {
            window.localStorage.removeItem(this.key);
            return true;
        } catch (e) {
            return false;
        }
    }
};
 
