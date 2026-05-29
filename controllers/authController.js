require("dotenv").config()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { pool } = require("../config/db")
const { authenticate } = require("../middleware/authenticate")
const { UnauthenticatedError } = require("../errors")

// POST /api/auth/login
const login = async (req, res) => {
    console.log("lol")
    const { username, password } = req.body
    const { rows } = await pool.query(
        `SELECT u.id, u.username, u.password_hash, u.role,
            u.is_active, u.teacher_id
     FROM   app_user u
     WHERE  u.username = $1`,
        [username],
    )
    const user = rows[0]
    if (!user) throw new UnauthenticatedError("Invalid username or password.")

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
        throw new UnauthenticatedError("Invalid username or password.")
    }

    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        teacher_id: user.teacher_id ?? null,
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d",
    })
    res.json({
        ok: true,
        token,
        user: payload,
    })
}

// POST /api/auth/register
async function register(req, res) {
    const { username, password, role, teacher_id = null } = req.body

    const { rows: existing } = await pool.query(
        `SELECT id FROM app_user WHERE username = $1`,
        [username],
    )
    if (existing.length) {
        return res.status(409).json({
            ok: false,
            code: "USERNAME_TAKEN",
            message: `Логін «${username}» вже зайнятий`,
        })
    }

    const hash = await bcrypt.hash(password, 12)

    const { rows } = await pool.query(
        `INSERT INTO app_user (username, password_hash, role, teacher_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, role, teacher_id, created_at`,
        [username, hash, role, teacher_id],
    )

    res.status(201).json({ ok: true, data: rows[0] })
}

// POST /api/auth/logout
const logout = async (req, res) => {
    await pool.query(`UPDATE app_user SET refresh_token = NULL WHERE id = $1`, [
        req.user.id,
    ])
    res.json({ ok: true, message: "Вихід виконано" })
}

module.exports = { login, register, logout }
