/* js/pc/state.js */
export const PC_STATE = {
    // Trạng thái điều khiển chuột (Mouse move / Drag góc nhìn)
    mouse: {
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0,
        lerpX: 0,
        lerpY: 0
    },

    // Trạng thái điều khiển cuộn (Scroll wheel)
    scroll: {
        targetY: 0,
        lerpY: 0
    },

    // Kích thước khung nhìn hiện tại của màn hình máy tính (Dùng để chuẩn hóa tọa độ)
    window: {
        width: window.innerWidth,
        height: window.innerHeight
    }
};
 
