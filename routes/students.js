const express = require("express")
const router = express.Router()
const {
    getStudent,
    getAllStudents,
    createStudent,
    updateStudent,
    removeStudent,
} = require("../controllers/studentController")
const { authenticate } = require("../middleware/authenticate")
const { authorize } = require("../middleware/authorize")
const { validate, validateAll } = require("../middleware/validate")
const { asyncHandler } = require("../middleware/errorHandler")
const schemas = require("../schemas")

// GET /api/students?group=ІТ-22&status=активний
router.get(
    "/",
    authenticate,
    authorize("students", "read"),
    validate(schemas.student.query, "query"),
    getAllStudents,
)

// GET /api/students/:id
router.get(
    "/:id",
    authenticate,
    authorize("students", "read"),
    validate(schemas.genericParams, "params"),
    getStudent,
)

// POST /api/students
router.post(
    "/",
    authenticate,
    authorize("students", "create"),
    validate(schemas.student.create),
    createStudent,
)

// PUT /api/students/:id
router.put(
    "/:id",
    authenticate,
    authorize("students", "update"),
    ...validateAll(schemas.student.update, schemas.genericParams),
    updateStudent,
)

// DELETE /api/students/:id
router.delete(
    "/:id",
    authenticate,
    authorize("students", "delete"),
    validate(schemas.genericParams, "params"),
    removeStudent,
)

module.exports = router
