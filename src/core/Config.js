/**
 * Cấu hình hệ thống cấu trúc dữ liệu đóng băng bất biến (Immutable)
 * Đảm bảo các tham số vận hành không bị sửa đổi ngoài ý muốn trong vòng đời Engine.
 */
export const Config = Object.freeze({
    RENDER_SETTINGS: Object.freeze({
        CANVAS_ID: "gl-canvas",
        CONTEXT_ATTRIBUTES: Object.freeze({
            alpha: false,
            depth: true,
            stencil: false,
            antialias: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: true,
            desynchronized: true
        }),
        DEFAULT_FOV: 60.0,
        NEAR_PLANE: 0.1,
        FAR_PLANE: 100.0,
    }),
    
    CAMERA_LIMITS: Object.freeze({
        MIN_PITCH: -Math.PI / 2.0 + 0.01, // Giới hạn nhìn xuống tránh hiện tượng Gimbal Lock
        MAX_PITCH: Math.PI / 2.0 - 0.01,  // Giới hạn nhìn lên
        MOUSE_SENSITIVITY: 0.002,
        TOUCH_SENSITIVITY: 0.004,
        GYRO_SENSITIVITY: 1.0,
        INERTIA_DECAY: 0.92
    }),
    
    ASSETS: Object.freeze({
        BASE_PATH: "assets/textures/skybox-v1/",
        LAYERS: Object.freeze({
            BASE: {
                id: "layer0-base",
                format: "webp",
                enabled: true
            },
            HDRI: {
                id: "layer1-hdri",
                format: "png",
                enabled: true
            }
        }),
        FACES: Object.freeze(["px", "nx", "py", "ny", "pz", "nz"])
    }),

    EVENTS: Object.freeze({
        INPUT_ROTATION: "input:rotation",
        RESIZE: "engine:resize",
        LAYER_TOGGLE: "ui:layer_toggle",
        BLEND_CHANGE: "ui:blend_change",
        CONTEXT_LOST: "engine:context_lost",
        CONTEXT_RESTORED: "engine:context_restored"
    })
});
 
