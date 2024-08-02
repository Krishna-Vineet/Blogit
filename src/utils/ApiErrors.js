// utils/ApiError.js
class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong!", errors = [], stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.success = false;
        this.errorMessage = message; // Add this line

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;

