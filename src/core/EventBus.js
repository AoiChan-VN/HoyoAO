/**
 * Cơ chế Pub/Sub trung tâm quản lý giao tiếp phi liên kết (Decoupled Communication)
 * Đảm bảo kiểm tra kiểu dữ liệu nghiêm ngặt và ngăn chặn rò rỉ bộ nhớ.
 */
export class EventBus {
    constructor() {
        this._listeners = new Map();
    }

    /**
     * Đăng ký một hàm lắng nghe sự kiện
     * @param {string} eventType 
     * @param {Function} callback 
     */
    on(eventType, callback) {
        if (typeof eventType !== "string") {
            throw new TypeError("Kiểu sự kiện phải là chuỗi ký tự.");
        }
        if (typeof callback !== "function") {
            throw new TypeError("Hàm callback phải là một cấu trúc thực thi Function.");
        }

        if (!this._listeners.has(eventType)) {
            this._listeners.set(eventType, new Set());
        }
        this._listeners.get(eventType).add(callback);
    }

    /**
     * Hủy đăng ký một hàm lắng nghe sự kiện
     * @param {string} eventType 
     * @param {Function} callback 
     */
    off(eventType, callback) {
        if (!this._listeners.has(eventType)) return;
        const callbacks = this._listeners.get(eventType);
        callbacks.delete(callback);
        if (callbacks.size === 0) {
            this._listeners.delete(eventType);
        }
    }

    /**
     * Phát tán sự kiện đi khắp hệ thống dữ liệu ứng dụng
     * @param {string} eventType 
     * @param {any} data 
     */
    emit(eventType, data = null) {
        if (!this._listeners.has(eventType)) return;
        const callbacks = this._listeners.get(eventType);
        for (const callback of callbacks) {
            try {
                callback(data);
            } catch (error) {
                console.error(`Lỗi thực thi trong hàm callback của sự kiện [${eventType}]:`, error);
            }
        }
    }

    /**
     * Purge toàn bộ bộ nhớ đăng ký sự kiện khi Module bị hủy
     */
    destroy() {
        if (this._listeners) {
            this._listeners.clear();
            this._listeners = null;
        }
    }
}
 
