/* js/mobile/dom-updater.js */
export function updateMobileDOM(transforms) {
    const root = document.documentElement;
    
    // Ghi nhận trực tiếp giá trị góc xoay vào biến CSS đã định nghĩa trong css/mobile/variables.css
    root.style.setProperty('--mobile-scroll-rotation-x', `${transforms.rotationX}deg`);
    root.style.setProperty('--mobile-scroll-rotation-y', `${transforms.rotationY}deg`);
}
