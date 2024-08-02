// errorHandler.js
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        errorMessage: err.message || "An unexpected error occurred",
        errors: err.errors || []
    });
};

export default errorHandler;
