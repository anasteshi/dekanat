const { CustomAPIError } = require("../errors")
const { StatusCodes } = require("http-status-codes")
const errorHandlerMiddleware = (err, req, res, _next) => {
    if (err instanceof CustomAPIError) {
        return res.status(err.statusCode).json({ msg: err.message })
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err.message)
}

module.exports = { errorHandlerMiddleware }
