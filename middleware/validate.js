const Joi = require("joi")

const JOI_OPTS = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
}

const JOI_OPTS_QUERY = { ...JOI_OPTS, allowUnknown: true }

const validate = (schema, target = "body") => {
    return function validateMiddleware(req, res, next) {
        const opts = target === "body" ? JOI_OPTS : JOI_OPTS_QUERY
        const input = req[target]

        const { error, value } = schema.validate(input, opts)

        if (error) {
            const details = error.details.map((d) => ({
                field: d.path.join(".") || target,
                message: d.message,
                type: d.type,
            }))

            return res.status(400).json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: "Помилка валідації вхідних даних",
                errors: details,
            })
        }

        req[target] = value
        next()
    }
}

const validateAll = (bodySchema, paramsSchema) => {
    const middlewares = []
    if (paramsSchema) middlewares.push(validate(paramsSchema, "params"))
    middlewares.push(validate(bodySchema, "body"))
    return middlewares 
}

module.exports = { validate, validateAll }
