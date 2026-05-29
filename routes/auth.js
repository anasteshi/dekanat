const express = require("express")
const router = express.Router()
const { login, register, logout } = require("../controllers/authController")
const { validate } = require("../middleware/validate")
const { authenticate } = require("../middleware/authenticate")
const { authorize } = require("../middleware/authorize")
const schemas = require("../schemas")

// POST /api/auth/login
router.post("/login", validate(schemas.auth.login), login)

// POST /api/auth/register  — лише admin
router.post(
    "/register",
    validate(schemas.auth.register),
    register,
)

// POST /api/auth/logout
router.post("/logout", authenticate, logout)

module.exports = router
