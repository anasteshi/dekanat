const { pool } = require("../config/db")

// GET /api/curriculum?specialty_id=1&semester=3
const getAllCurricula = async (req, res) => {
    const { specialty_id, semester } = req.query
    const conditions = []
    const params = []

    if (specialty_id) {
        params.push(Number(specialty_id))
        conditions.push(`cu.specialty_id = $${params.length}`)
    }
    if (semester) {
        params.push(Number(semester))
        conditions.push(`cu.semester = $${params.length}`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const { rows } = await pool.query(
        `SELECT
        cu.curriculum_id,
        cu.semester,
        cu.lecture_hours,
        cu.practice_hours,
        cu.lab_hours,
        (cu.lecture_hours + cu.practice_hours + cu.lab_hours) AS total_hours,
        cu.control_form,
        sp.specialty_code,
        sp.specialty_name,
        sb.subject_name,
        sb.credits,
        d.dept_name
     FROM  curriculum  cu
     JOIN  specialty   sp ON sp.specialty_id = cu.specialty_id
     JOIN  subject     sb ON sb.subject_id   = cu.subject_id
     JOIN  department  d  ON d.dept_id       = sb.dept_id
     ${where}
     ORDER BY sp.specialty_code, cu.semester, sb.subject_name`,
        params,
    )

    res.json({ ok: true, count: rows.length, data: rows })
}

// GET /api/curriculum/:id
const getCurriculum = async (req, res) => {
    const { id } = req.params

    const { rows } = await pool.query(
        `SELECT cu.*, sp.specialty_name, sb.subject_name
     FROM  curriculum cu
     JOIN  specialty  sp ON sp.specialty_id = cu.specialty_id
     JOIN  subject    sb ON sb.subject_id   = cu.subject_id
     WHERE cu.curriculum_id = $1`,
        [id],
    )

    if (!rows.length) {
        return res
            .status(404)
            .json({ ok: false, message: `Запис плану id=${id} не знайдено` })
    }
    res.json({ ok: true, data: rows[0] })
}

// POST /api/curriculum
const createCurriculum = async (req, res) => {
    const {
        specialty_id,
        subject_id,
        semester,
        lecture_hours = 0,
        practice_hours = 0,
        lab_hours = 0,
        control_form = "залік",
    } = req.body

    const missing = ["specialty_id", "subject_id", "semester"].filter(
        (element) =>
            req.body[element] === undefined || req.body[element] === null,
    )
    if (missing.length) {
        return res.status(400).json({
            ok: false,
            message: `Відсутні поля: ${missing.join(", ")}`,
        })
    }

    const { rows } = await pool.query(
        `INSERT INTO curriculum
       (specialty_id, subject_id, semester,
        lecture_hours, practice_hours, lab_hours, control_form)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
        [
            specialty_id,
            subject_id,
            semester,
            lecture_hours,
            practice_hours,
            lab_hours,
            control_form,
        ],
    )

    res.status(201).json({ ok: true, data: rows[0] })
}

// PUT /api/curriculum/:id
const updateCurriculum = async (req, res) => {
    const { id } = req.params
    const { lecture_hours, practice_hours, lab_hours, control_form } = req.body

    const { rows } = await pool.query(
        `UPDATE curriculum SET
        lecture_hours  = COALESCE($1, lecture_hours),
        practice_hours = COALESCE($2, practice_hours),
        lab_hours      = COALESCE($3, lab_hours),
        control_form   = COALESCE($4, control_form)
     WHERE curriculum_id = $5
     RETURNING *`,
        [lecture_hours, practice_hours, lab_hours, control_form, id],
    )

    if (!rows.length) {
        return res
            .status(404)
            .json({ ok: false, message: `Запис плану id=${id} не знайдено` })
    }
    res.json({ ok: true, data: rows[0] })
}

// DELETE /api/curriculum/:id
const removeCurriculum = async (req, res) => {
    const { id } = req.params
    const { rows: cards } = await pool.query(
        `SELECT COUNT(*) AS cnt FROM student_card WHERE curriculum_id = $1`,
        [id],
    )
    if (Number(cards[0].cnt) > 0) {
        return res.status(409).json({
            ok: false,
            message: `Неможливо видалити, бо існує ${cards[0].cnt} карток студентів для цього запису плану`,
        })
    }

    const { rowCount } = await pool.query(
        `DELETE FROM curriculum WHERE curriculum_id = $1`,
        [id],
    )

    if (!rowCount) {
        return res
            .status(404)
            .json({ ok: false, message: `Запис плану id=${id} не знайдено` })
    }
    res.json({ ok: true, message: `Запис curriculum id=${id} видалено` })
}

module.exports = {
    getAllCurricula,
    getCurriculum,
    createCurriculum,
    updateCurriculum,
    removeCurriculum,
}
