const express = require("express")
const router = express.Router()
const {
    hoursBySpecialty,
    studentsByFaculty,
    avgGradeBySpecialty,
    departmentLoad,
    chartDataBySpecialty,
} = require("../controllers/analyticsController")
const { authenticate } = require("../middleware/authenticate")
const { authorize } = require("../middleware/authorize")

router.use(authenticate, authorize("analytics", "read"))

router.get("/hours-by-specialty", authenticate, hoursBySpecialty)
router.get("/students-by-faculty", authenticate, studentsByFaculty)
router.get("/avg-grade-by-specialty", authenticate, avgGradeBySpecialty)
router.get("/department-load", authenticate, departmentLoad)
router.get("/chart-data/:specialty_id", authenticate, chartDataBySpecialty)

module.exports = router
