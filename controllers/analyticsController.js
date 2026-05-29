const { pool } = require("../config/db")

// GET /api/analytics/hours-by-specialty
const hoursBySpecialty = async (req, res) => {
    const { rows } = await pool.query(`
    SELECT
        sp.specialty_id,
        sp.specialty_code,
        sp.specialty_name,
        sp.degree,
        COUNT(DISTINCT cu.subject_id)                              AS subjects_count,
        SUM(cu.lecture_hours)                                      AS lecture_hours,
        SUM(cu.practice_hours)                                     AS practice_hours,
        SUM(cu.lab_hours)                                          AS lab_hours,
        SUM(cu.lecture_hours + cu.practice_hours + cu.lab_hours)   AS total_hours,
        ROUND(AVG(cu.lecture_hours + cu.practice_hours
                  + cu.lab_hours), 1)                              AS avg_hours_per_subject
    FROM  specialty  sp
    JOIN  curriculum cu ON cu.specialty_id = sp.specialty_id
    GROUP BY sp.specialty_id, sp.specialty_code, sp.specialty_name, sp.degree
    ORDER BY total_hours DESC
  `)

    res.json({ ok: true, data: rows })
}

// GET /api/analytics/students-by-faculty
const studentsByFaculty = async (req, res) => {
    const { rows } = await pool.query(`
    SELECT
        f.faculty_id,
        f.faculty_name,
        f.faculty_abbr,
        sp.specialty_id,
        sp.specialty_code,
        sp.specialty_name,
        COUNT(st.student_id)                                        AS total_students,
        COUNT(st.student_id) FILTER (WHERE st.status = 'активний') AS active_students,
        COUNT(st.student_id) FILTER (WHERE st.status = 'відрахований') AS expelled_students
    FROM  faculty    f
    JOIN  specialty  sp ON sp.faculty_id  = f.faculty_id
    LEFT JOIN student st ON st.specialty_id = sp.specialty_id
    GROUP BY f.faculty_id, f.faculty_name, f.faculty_abbr,
             sp.specialty_id, sp.specialty_code, sp.specialty_name
    ORDER BY f.faculty_name, sp.specialty_name
  `)

    const faculties = {}
    for (const row of rows) {
        if (!faculties[row.faculty_id]) {
            faculties[row.faculty_id] = {
                faculty_id: row.faculty_id,
                faculty_name: row.faculty_name,
                faculty_abbr: row.faculty_abbr,
                specialties: [],
                total_students: 0,
            }
        }
        faculties[row.faculty_id].specialties.push({
            specialty_id: row.specialty_id,
            specialty_code: row.specialty_code,
            specialty_name: row.specialty_name,
            total_students: Number(row.total_students),
            active_students: Number(row.active_students),
            expelled_students: Number(row.expelled_students),
        })
        faculties[row.faculty_id].total_students += Number(row.total_students)
    }

    res.json({ ok: true, data: Object.values(faculties) })
}

// GET /api/analytics/avg-grade-by-specialty
const avgGradeBySpecialty = async (req, res) => {
    const { rows } = await pool.query(`
    SELECT
        sp.specialty_code,
        sp.specialty_name,
        COUNT(DISTINCT st.student_id)                                   AS students_count,
        COUNT(sc.card_id) FILTER (WHERE sc.grade IS NOT NULL)           AS exams_taken,
        ROUND(AVG(sc.grade) FILTER (WHERE sc.grade IS NOT NULL), 2)     AS avg_grade,
        COUNT(sc.card_id) FILTER (WHERE sc.grade >= 90)                 AS grade_a,
        COUNT(sc.card_id) FILTER (WHERE sc.grade BETWEEN 82 AND 89)     AS grade_b,
        COUNT(sc.card_id) FILTER (WHERE sc.grade BETWEEN 74 AND 81)     AS grade_c,
        COUNT(sc.card_id) FILTER (WHERE sc.grade BETWEEN 60 AND 73)     AS grade_de,
        COUNT(sc.card_id) FILTER (WHERE sc.grade < 60 AND sc.grade IS NOT NULL) AS grade_f
    FROM  specialty    sp
    JOIN  student      st ON st.specialty_id  = sp.specialty_id
    LEFT JOIN student_card sc ON sc.student_id = st.student_id
    GROUP BY sp.specialty_id, sp.specialty_code, sp.specialty_name
    ORDER BY avg_grade DESC NULLS LAST
  `)

    res.json({ ok: true, data: rows })
}

// GET /api/analytics/department-load
const departmentLoad = async (req, res) => {
    const { rows } = await pool.query(`SELECT * FROM v_department_load`)
    res.json({ ok: true, data: rows })
}

// GET /api/analytics/chart-data/:specialty_id
const chartDataBySpecialty = async (req, res) => {
    const { specialty_id } = req.params
    const { semester } = req.query

    const conditions = ["cu.specialty_id = $1"]
    const params = [specialty_id]

    if (semester) {
        params.push(Number(semester))
        conditions.push(`cu.semester = $${params.length}`)
    }

    const { rows } = await pool.query(
        `SELECT
        sb.subject_name     AS label,
        cu.semester,
        cu.lecture_hours,
        cu.practice_hours,
        cu.lab_hours,
        (cu.lecture_hours + cu.practice_hours + cu.lab_hours) AS total_hours
     FROM  curriculum cu
     JOIN  subject    sb ON sb.subject_id = cu.subject_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY cu.semester, total_hours DESC`,
        params,
    )

    res.json({
        ok: true,
        chart: {
            labels: rows.map((r) => r.label),
            datasets: [
                {
                    label: "Лекції",
                    data: rows.map((r) => Number(r.lecture_hours)),
                    backgroundColor: "#1F4E79",
                },
                {
                    label: "Практики",
                    data: rows.map((r) => Number(r.practice_hours)),
                    backgroundColor: "#2E75B6",
                },
                {
                    label: "Лабораторні",
                    data: rows.map((r) => Number(r.lab_hours)),
                    backgroundColor: "#9DC3E6",
                },
            ],
        },
        raw: rows,
    })
}

module.exports = {
    hoursBySpecialty,
    studentsByFaculty,
    avgGradeBySpecialty,
    departmentLoad,
    chartDataBySpecialty,
}
