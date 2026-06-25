import { database } from "../state/database.js";
import { localStorageSystem } from "../state/local_storage.js";
import { audioSystem } from "../core/audio_system.js";

export const viewShop = {
    render(currencyElement, containerElement) {
        if (!currencyElement || !containerElement) return;

        const credits = database.getCredits();
        currencyElement.textContent = `${credits}$`;

        const items = database.getItems();
        containerElement.innerHTML = "";

        items.forEach(item => {
            const itemCard = document.createElement("div");
            itemCard.className = "shop-item";

            const infoDiv = document.createElement("div");
            infoDiv.className = "shop-item-info";

            const nameDiv = document.createElement("div");
            nameDiv.className = "shop-item-name";
            nameDiv.textContent = item.name;

            const descDiv = document.createElement("div");
            descDiv.className = "shop-item-desc";
            descDiv.textContent = item.desc;

            const costDiv = document.createElement("div");
            costDiv.className = "shop-item-cost";
            costDiv.textContent = item.cost > 0 ? `${item.cost}$` : "MIỄN PHÍ";

            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(descDiv);
            infoDiv.appendChild(costDiv);

            const btn = document.createElement("button");
            btn.className = "shop-item-btn";

            if (item.isOwned) {
                btn.classList.add("owned");
                btn.textContent = "ĐÃ SỞ HỮU";
                btn.disabled = true;
            } else if (credits >= item.cost) {
                btn.classList.add("buy");
                btn.textContent = "MUA TRANG BỊ";
                btn.addEventListener("click", () => {
                    if (database.buyItem(item.id)) {
                        audioSystem.playSFX("sfx_upgrade");
                        localStorageSystem.save();
                        this.render(currencyElement, containerElement);
                    }
                });
            } else {
                btn.classList.add("locked");
                btn.textContent = "KHÔNG ĐỦ TIỀN";
                btn.disabled = true;
            }

            itemCard.appendChild(infoDiv);
            itemCard.appendChild(btn);
            containerElement.appendChild(itemCard);
        });
    }
};
 
