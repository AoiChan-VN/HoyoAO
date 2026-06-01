 export class AppError extends Error {

    constructor(code, message, details = null) {

        super(message);

        this.name = "AppError";
        this.code = code;
        this.details = details;
        this.timestamp = Date.now();

    }

}
