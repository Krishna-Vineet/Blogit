class ApiResponse {
    constructor(statusCode, data, message = "Success", redirect = false) {
        this.statusCode = statusCode
        this.data = data
        this.message = message
    }
}

export default ApiResponse