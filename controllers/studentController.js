const { pool } = require("../config/db")

// GET /api/students
// ?group=ІТ-22  ?specialty_id=1  ?status=активний
const getAllStudents = async (req, res) => {
    const { group, specialty_id, status } = req.query
    const conditions = []
    const params = []

    if (group) {
        params.push(`%${group}%`)
        conditions.push(`st.group_name ILIKE $${params.length}`)
    }
    if (specialty_id) {
        params.push(Number(specialty_id))
        conditions.push(`st.specialty_id = $${params.length}`)
    }
    if (status) {
        params.push(status)
        conditions.push(`st.status = $${params.length}`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const { rows } = await pool.query(
        `SELECT
        st.student_id,
        st.record_book_no,
        st.fullname,
        st.group_name,
        st.year_of_study,
        st.status,
        st.email,
        sp.specialty_name,
        sp.specialty_code,
        f.faculty_name
     FROM  student    st
     JOIN  specialty  sp ON sp.specialty_id = st.specialty_id
     JOIN  faculty    f  ON f.faculty_id    = sp.faculty_id
     ${where}
     ORDER BY st.group_name, st.fullname`,
        params,
    )

    res.json({ ok: true, count: rows.length, data: rows })
}

// GET /api/students/:id
const getStudent = async (req, res) => {
    const { id } = req.params

    const { rows } = await pool.query(
        `SELECT
        st.*,
        sp.specialty_name, sp.specialty_code, sp.degree,
        f.faculty_name
     FROM  student   st
     JOIN  specialty sp ON sp.specialty_id = st.specialty_id
     JOIN  faculty   f  ON f.faculty_id    = sp.faculty_id
     WHERE st.student_id = $1`,
        [id],
    )

    if (!rows.length) {
        return res
            .status(404)
            .json({ ok: false, message: `Студента з id=${id} не знайдено` })
    }
    res.json({ ok: true, data: rows[0] })
}

// POST /api/students
const createStudent = async (req, res) => {
    const {
        record_book_no,
        fullname,
        specialty_id,
        group_name,
        year_of_study,
        birth_date = null,
        gender = null,
        email = null,
        phone = null,
        enrollment_date = null,
    } = req.body

    const missing = [
        "record_book_no",
        "fullname",
        "specialty_id",
        "group_name",
        "year_of_study",
    ].filter((f) => !req.body[f])
    if (missing.length) {
        return res.status(400).json({
            ok: false,
            message: `Відсутні поля: ${missing.join(", ")}`,
        })
    }

    const { rows } = await pool.query(
        `INSERT INTO student
       (record_book_no, fullname, specialty_id, group_name,
        year_of_study, birth_date, gender, email, phone, enrollment_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10, CURRENT_DATE))
     RETURNING student_id, record_book_no, fullname, group_name, status`,
        [
            record_book_no,
            fullname,
            specialty_id,
            group_name,
            year_of_study,
            birth_date,
            gender,
            email,
            phone,
            enrollment_date,
        ],
    )

    res.status(201).json({ ok: true, data: rows[0] })
}

// PUT /api/students/:id
const updateStudent = async (req, res) => {
    const { id } = req.params
    const {
        fullname,
        group_name,
        year_of_study,
        status,
        email,
        phone,
        expulsion_date = undefined,
    } = req.body

    const { rows } = await pool.query(
        `UPDATE student SET
        fullname        = COALESCE($1, fullname),
        group_name      = COALESCE($2, group_name),
        year_of_study   = COALESCE($3, year_of_study),
        status          = COALESCE($4, status),
        email           = COALESCE($5, email),
        phone           = COALESCE($6, phone),
        expulsion_date  = COALESCE($7, expulsion_date)
     WHERE student_id = $8
     RETURNING student_id, fullname, group_name, status`,
        [
            fullname,
            group_name,
            year_of_study,
            status,
            email,
            phone,
            expulsion_date ?? null,
            id,
        ],
    )

    if (!rows.length) {
        return res
            .status(404)
            .json({ ok: false, message: `Студента з id=${id} не знайдено` })
    }
    res.json({ ok: true, data: rows[0] })
}

// DELETE /api/students/:id
const removeStudent = async (req, res) => {
    const { id } = req.params

    const { rows } = await pool.query(
        `UPDATE student
     SET status = 'відрахований', expulsion_date = CURRENT_DATE
     WHERE student_id = $1
     RETURNING student_id, fullname, status`,
        [id],
    )

    if (!rows.length) {
        return res
            .status(404)
            .json({ ok: false, message: `Студента з id=${id} не знайдено` })
    }
    res.json({ ok: true, message: "Студента відраховано", data: rows[0] })
}

module.exports = {
    getAllStudents,
    getStudent,
    createStudent,
    updateStudent,
    removeStudent,
}
