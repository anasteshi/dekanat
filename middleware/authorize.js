const { hasAccess } = require("../config/roles")

const authorize = (resource, action) => {
    return function (req, res, next) {
        const { role, username } = req.user

        if (!hasAccess(role, resource, action)) {
            return res
                .status(403)
                .json({
                    message:
                        "You do not have the rights to proceed with this action.",
                })
        }
        return next()
    }
}

module.exports = { authorize }
