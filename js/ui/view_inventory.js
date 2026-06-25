import { database } from "../state/database.js";
import { localStorageSystem } from "../state/local_storage.js";
import { audioSystem } from "../core/audio_system.js";

export const viewInventory = {
    render(containerElement) {
        if (!containerElement) return;

        const items = database.getItems();
        const equippedWeapon = database.getEquippedWeapon();
        containerElement.innerHTML = "";

        items.forEach(item => {
            if (!item.isOwned) return;

            const isCurrent = item.id === equippedWeapon;

            const itemCard = document.createElement("div");
            itemCard.className = "inventory-item";
            if (isCurrent) {
                itemCard.classList.add("equipped");
            }

            const infoDiv = document.createElement("div");
            infoDiv.className = "inventory-item-info";

            const nameDiv = document.createElement("div");
            nameDiv.className = "inventory-item-name";
            nameDiv.textContent = item.name;

            if (isCurrent) {
                const badge = document.createElement("span");
                badge.textContent = "SỬ DỤNG";
                nameDiv.appendChild(badge);
            }

            const descDiv = document.createElement("div");
            descDiv.className = "inventory-item-desc";
            descDiv.textContent = item.desc;

            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(descDiv);

            const btn = document.createElement("button");
            btn.className = "inventory-item-btn";

            if (isCurrent) {
                btn.classList.add("active");
                btn.textContent = "ĐANG TRANG BỊ";
                btn.disabled = true;
            } else {
                btn.classList.add("equip");
                btn.textContent = "KÍCH HOẠT";
                btn.addEventListener("click", () => {
                    if (database.equipWeapon(item.id)) {
                        audioSystem.playSFX("sfx_upgrade");
                        localStorageSystem.save();
                        this.render(containerElement);
                    }
                });
            }

            itemCard.appendChild(infoDiv);
            itemCard.appendChild(btn);
            containerElement.appendChild(itemCard);
        });
    }
};
 
