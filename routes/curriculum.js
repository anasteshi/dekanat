const express = require("express")
const router = express.Router()
const {
    getAllCurricula,
    getCurriculum,
    createCurriculum,
    updateCurriculum,
    removeCurriculum,
} = require("../controllers/curriculumController")
const { authenticate } = require("../middleware/authenticate")
const { authorize } = require("../middleware/authorize")
const { validate, validateAll } = require("../middleware/validate")
const schemas = require("../schemas")

router.get(
    "/",
    authenticate,
    authorize("curriculum", "read"),
    validate(schemas.curriculum.query, "query"),
    getAllCurricula,
)

router.get(
    "/:id",
    authenticate,
    authorize("curriculum", "read"),
    validate(schemas.genericParams, "params"),
    getCurriculum,
)

router.post(
    "/",
    authenticate,
    authorize("curriculum", "create"),
    validate(schemas.curriculum.create),
    createCurriculum,
)

router.put(
    "/:id",
    authenticate,
    authorize("curriculum", "update"),
    ...validateAll(schemas.curriculum.update, schemas.genericParams),
    updateCurriculum,
)

router.delete(
    "/:id",
    authenticate,
    authorize("curriculum", "delete"),
    validate(schemas.genericParams, "params"),
    removeCurriculum,
)

module.exports = router
