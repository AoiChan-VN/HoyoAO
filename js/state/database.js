import { WEAPON_TYPES } from "../config/constants.js";

export const database = {
    items: {
        weapons: [
            {
                id: WEAPON_TYPES.STANDARD,
                name: "LASER TIÊU CHUẨN",
                desc: "Súng Laser cơ bản được trang bị mặc định trên mọi phi thuyền tiêm kích.",
                cost: 0,
                isOwned: true
            },
            {
                id: WEAPON_TYPES.DUAL,
                name: "LASER KÉP SONG HÀNH",
                desc: "Khai hỏa đồng thời hai luồng năng lượng song song, tăng diện tích càn quét.",
                cost: 500,
                isOwned: false
            },
            {
                id: WEAPON_TYPES.PLASMA,
                name: "PHÁO KHỐI PLASMA",
                desc: "Tốc độ bắn chậm nhưng tạo ra xung lực nén Plasma với sát thương cực đại.",
                cost: 1200,
                isOwned: false
            }
        ]
    },
    
    state: {
        credits: 0,
        equippedWeapon: WEAPON_TYPES.STANDARD
    },

    getItems() {
        return this.items.weapons;
    },

    getItem(id) {
        return this.items.weapons.find(w => w.id === id);
    },

    getCredits() {
        return this.state.credits;
    },

    setCredits(amount) {
        this.state.credits = amount;
    },

    addCredits(amount) {
        this.state.credits += amount;
    },

    getEquippedWeapon() {
        return this.state.equippedWeapon;
    },

    equipWeapon(id) {
        const item = this.getItem(id);
        if (item && item.isOwned) {
            this.state.equippedWeapon = id;
            return true;
        }
        return false;
    },

    buyItem(id) {
        const item = this.getItem(id);
        if (item && !item.isOwned && this.state.credits >= item.cost) {
            this.state.credits -= item.cost;
            item.isOwned = true;
            return true;
        }
        return false;
    },

    loadData(savedData) {
        if (!savedData) return;
        this.state.credits = savedData.credits ?? 0;
        this.state.equippedWeapon = savedData.equippedWeapon ?? WEAPON_TYPES.STANDARD;
        if (savedData.ownedWeapons && Array.isArray(savedData.ownedWeapons)) {
            this.items.weapons.forEach(w => {
                if (savedData.ownedWeapons.includes(w.id)) {
                    w.isOwned = true;
                }
            });
        }
    },

    exportData() {
        const ownedWeapons = this.items.weapons.filter(w => w.isOwned).map(w => w.id);
        return {
            credits: this.state.credits,
            equippedWeapon: this.state.equippedWeapon,
            ownedWeapons: ownedWeapons
        };
    }
};
 
