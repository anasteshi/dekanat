const express = require("express")
const router = express.Router()
const {
    TxtStudentCardTxt,
    CsvStudentCard,
    PdfStudentCard,
    debtsByGroup,
} = require("../controllers/reportController")
const { authenticate } = require("../middleware/authenticate")
const { authorize } = require("../middleware/authorize")

router.get(
    "/student/:id/txt",
    authenticate,
    authorize("reports", "read"),
    TxtStudentCardTxt,
)

router.get(
    "/student/:id/csv",
    authenticate,
    authorize("reports", "read"),
    CsvStudentCard,
)

router.get(
    "/student/:id/pdf",
    authenticate,
    authorize("reports", "read"),
    PdfStudentCard,
)

router.get(
    "/debts/:group",
    authenticate,
    authorize("reports", "read"),
    debtsByGroup,
)

module.exports = router
