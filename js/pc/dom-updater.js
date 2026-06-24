/* js/pc/dom-updater.js */
export function updatePCDOM(transforms) {
    const root = document.documentElement;

    // Cập nhật ma trận xoay góc nhìn của toàn bộ không gian chứa hộp
    root.style.setProperty('--pc-rotation-x', `${transforms.world.rotX}deg`);
    root.style.setProperty('--pc-rotation-y', `${transforms.world.rotY}deg`);

    // Cập nhật tọa độ tịnh tiến thị sai riêng biệt cho TẦNG GẦN
    root.style.setProperty('--pc-parallax-near-x', `${transforms.layers.near.x}px`);
    root.style.setProperty('--pc-parallax-near-y', `${transforms.layers.near.y}px`);

    // Cập nhật tọa độ tịnh tiến thị sai riêng biệt cho TẦNG VỪA
    root.style.setProperty('--pc-parallax-medium-x', `${transforms.layers.medium.x}px`);
    root.style.setProperty('--pc-parallax-medium-y', `${transforms.layers.medium.y}px`);

    // Cập nhật tọa độ tịnh tiến thị sai riêng biệt cho TẦNG XA
    root.style.setProperty('--pc-parallax-far-x', `${transforms.layers.far.x}px`);
    root.style.setProperty('--pc-parallax-far-y', `${transforms.layers.far.y}px`);
}
 
