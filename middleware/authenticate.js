const jwt = require("jsonwebtoken")
const { UnauthenticatedError } = require("../errors")

const secret = process.env.JWT_SECRET
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization
    let token

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]
    } else if (req.query && req.query.token) {
        token = req.query.token
    }

    if (!token) throw new UnauthenticatedError("Authentication invalid.")

    try {
        const payload = jwt.verify(token, secret)
        req.user = payload
        next()
    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    authenticate,
}
