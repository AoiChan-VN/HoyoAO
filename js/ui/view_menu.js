import { database } from "../state/database.js";

export const viewMenu = {
    render() {
        const currentCredits = database.getCredits();
        const equippedWeaponId = database.getEquippedWeapon();
        const currentWeapon = database.getItem(equippedWeaponId);

        let menuBox = document.querySelector(".menu-box");
        if (!menuBox) return;

        let statsContainer = document.getElementById("menu-player-stats");
        if (!statsContainer) {
            statsContainer = document.createElement("div");
            statsContainer.id = "menu-player-stats";
            statsContainer.style.marginTop = "10px";
            statsContainer.style.padding = "12px";
            statsContainer.style.background = "rgba(255, 255, 255, 0.04)";
            statsContainer.style.border = "1px solid rgba(0, 255, 204, 0.2)";
            statsContainer.style.borderRadius = "4px";
            statsContainer.style.textAlign = "left";
            statsContainer.style.fontSize = "14px";
            statsContainer.style.color = "var(--color-text)";
            statsContainer.style.lineHeight = "1.6";
            
            const title = menuBox.querySelector(".game-title");
            if (title && title.nextSibling) {
                menuBox.insertBefore(statsContainer, title.nextSibling);
            } else {
                menuBox.appendChild(statsContainer);
            }
        }

        statsContainer.innerHTML = `
            <div style="color: #ffcc00; font-weight: bold; letter-spacing: 0.5px;">TÀI KHOẢN: ${currentCredits}$</div>
            <div style="color: var(--color-primary); font-size: 13px; margin-top: 4px;">HỆ THỐNG HOẢ LỰC: <span style="color: #fff;">${currentWeapon ? currentWeapon.name : "CHƯA RÕ"}</span></div>
        `;
    }
};
 
