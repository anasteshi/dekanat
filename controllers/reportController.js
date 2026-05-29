const { pool } = require("../config/db")
const PDFDoc = require("pdfkit")
const { Parser } = require("json2csv")

const fetchStudentCard = async (studentId) => {
    const { rows } = await pool.query(
        `SELECT * FROM v_student_curriculum WHERE student_id = $1
     ORDER BY semester, subject_name`,
        [studentId],
    )
    return rows
}

// GET /api/reports/student/:id/txt
const TxtStudentCardTxt = async (req, res) => {
    const rows = await fetchStudentCard(req.params.id)

    if (!rows.length) {
        return res
            .status(404)
            .json({ ok: false, message: "Студента не знайдено" })
    }

    const info = rows[0]
    const line = "═".repeat(64)
    const divider = "─".repeat(64)

    let txt = `\n${line}\n`
    txt += `  АКАДЕМІЧНА КАРТКА СТУДЕНТА\n`
    txt += `${line}\n`
    txt += `  Студент      : ${info.student_name}\n`
    txt += `  Залік. книж. : ${info.record_book_no}\n`
    txt += `  Група        : ${info.group_name}   Курс: ${info.year_of_study}\n`
    txt += `  Статус       : ${info.student_status}\n`
    txt += `  Спеціальність: ${info.specialty_code} ${info.specialty_name} (${info.degree})\n`
    txt += `  Факультет    : ${info.faculty_name}\n`
    txt += `${line}\n`

    // Групуємо рядки по семестрах
    const semesters = [...new Set(rows.map((row) => row.semester))]

    for (const sem of semesters) {
        const semRows = rows.filter((row) => row.semester === sem)

        txt += `\n  СЕМЕСТР ${sem}\n`
        txt += `  ${divider.slice(0, 60)}\n`
        txt += `  ${"Дисципліна".padEnd(32)} ${"Год".padStart(4)}  ${"Контроль".padEnd(12)} ${"Оцінка".padStart(6)}  ${"ЄКТС"}\n`
        txt += `  ${divider.slice(0, 60)}\n`

        for (const row of semRows) {
            const grade =
                row.grade != null ? String(row.grade).padStart(6) : "     —"
            const ects = row.ects_grade ?? "—"
            txt += `  ${row.subject_name.padEnd(32)} ${String(row.total_hours).padStart(4)}  ${row.control_form.padEnd(12)} ${grade}  ${ects}\n`
        }

        const semTotal = semRows.reduce((s, r) => s + Number(r.total_hours), 0)
        const semGrades = semRows
            .filter((r) => r.grade != null)
            .map((r) => r.grade)
        const semAvg =
            semGrades.length ?
                (
                    semGrades.reduce((a, b) => a + b, 0) / semGrades.length
                ).toFixed(1)
            :   "—"

        txt += `  ${divider.slice(0, 60)}\n`
        txt += `  Всього годин: ${semTotal}   Середній бал семестру: ${semAvg}\n`
    }

    txt += `\n${line}\n`
    const fileName = `card_${req.params.id}.txt`
    const encodedFileName = encodeURIComponent(fileName)
    res.set("Content-Type", "text/plain; charset=utf-8")
        .set(
            "Content-Disposition",
            `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        )
        .send(txt)
}

// GET /api/reports/student/:id/csv
const CsvStudentCard = async (req, res) => {
    const rows = await fetchStudentCard(req.params.id)

    if (!rows.length) {
        return res
            .status(404)
            .json({ ok: false, message: "Студента не знайдено" })
    }

    const fields = [
        { label: "Семестр", value: "semester" },
        { label: "Дисципліна", value: "subject_name" },
        { label: "Кредити", value: "credits" },
        { label: "Лекції", value: "lecture_hours" },
        { label: "Практики", value: "practice_hours" },
        { label: "Лабораторні", value: "lab_hours" },
        { label: "Всього годин", value: "total_hours" },
        { label: "Форма контр.", value: "control_form" },
        { label: "Оцінка", value: "grade" },
        { label: "ЄКТС", value: "ects_grade" },
        { label: "Дата здачі", value: "exam_date" },
        { label: "Викладач", value: "teacher_name" },
    ]

    const parser = new Parser({ fields, delimiter: ";", withBOM: true })
    const csv = parser.parse(rows)
    const fileName = `card_${rows[0].record_book_no}.csv`
    const encodedFileName = encodeURIComponent(fileName)

    res.set("Content-Type", "text/csv; charset=utf-8")
        .set(
            "Content-Disposition",
            `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        )
        .send(csv)
}

// GET /api/reports/student/:id/pdf
const PdfStudentCard = async (req, res) => {
    const fontPath = "./public/fonts/TimesNewerRoman-Regular.otf"
    const rows = await fetchStudentCard(req.params.id)

    if (!rows.length) {
        return res
            .status(404)
            .json({ ok: false, message: "Студента не знайдено" })
    }

    const info = rows[0]
    const doc = new PDFDoc({ margin: 40, size: "A4" })

    const fileName = `card_${info.record_book_no}.pdf`
    const encodedFileName = encodeURIComponent(fileName)

    res.set("Content-Type", "application/pdf")
    res.set(
        "Content-Disposition",
        `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
    )
    doc.pipe(res)

    // Heading
    doc.fontSize(16)
        .font(fontPath)
        .text("АКАДЕМІЧНА КАРТКА СТУДЕНТА", { align: "center" })
    doc.moveDown(0.5)

    // Main
    doc.fontSize(11).font(fontPath)
    const infoLines = [
        ["Студент", info.student_name],
        ["Залік. книжка", info.record_book_no],
        ["Група / Курс", `${info.group_name} / ${info.year_of_study} курс`],
        [
            "Спеціальність",
            `${info.specialty_code} ${info.specialty_name} (${info.degree})`,
        ],
        ["Факультет", info.faculty_name],
        ["Статус", info.student_status],
    ]
    for (const [label, value] of infoLines) {
        doc.font(fontPath)
            .text(`${label}: `, { continued: true })
            .font(fontPath)
            .text(value)
    }

    doc.moveDown(1)

    // Semesters
    const semesters = [...new Set(rows.map((r) => r.semester))]

    for (const sem of semesters) {
        const semRows = rows.filter((r) => r.semester === sem)

        doc.fontSize(12)
            .font(fontPath)
            .text(`Семестр ${sem}`, { underline: true })
        doc.moveDown(0.3)

        const COL = [200, 50, 80, 60, 40]
        const headers = ["Дисципліна", "Год", "Контроль", "Оцінка", "ЄКТС"]
        let x = doc.x
        const y0 = doc.y
        doc.fontSize(9).font(fontPath)
        headers.forEach((h, i) => {
            doc.text(h, x, y0, {
                width: COL[i],
                align: i > 0 ? "center" : "left",
            })
            x += COL[i]
        })
        doc.moveDown(0.2)
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#333").stroke()
        doc.moveDown(0.2)

        doc.fontSize(9).font(fontPath)
        for (const r of semRows) {
            x = 40
            const rowY = doc.y
            const cells = [
                r.subject_name,
                String(r.total_hours),
                r.control_form,
                r.grade != null ? String(r.grade) : "—",
                r.ects_grade ?? "—",
            ]
            cells.forEach((c, i) => {
                doc.text(c, x, rowY, {
                    width: COL[i],
                    align: i > 0 ? "center" : "left",
                })
                x += COL[i]
            })
            doc.moveDown(0.4)
        }

        doc.moveDown(0.5)
    }

    doc.end()
}

// GET /api/reports/debts/:group
const debtsByGroup = async (req, res) => {
    const { group } = req.params

    const { rows } = await pool.query(
        `SELECT student_name, record_book_no, subject_name,
            semester, control_form, grade, attempt_no
     FROM   v_student_debts
     WHERE  group_name = $1
     ORDER  BY student_name, semester`,
        [group],
    )

    if (!rows.length) {
        return res.json({
            ok: true,
            message: "Заборгованостей не знайдено",
            data: [],
        })
    }

    const parser = new Parser({ delimiter: ";", withBOM: true })
    const csv = parser.parse(rows)

    const fileName = `debts_${group}.csv`
    const encodedFileName = encodeURIComponent(fileName)

    res.set("Content-Type", "text/csv; charset=utf-8")
        .set(
            "Content-Disposition",
            `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}"`,
        )
        .send(csv)
}

module.exports = {
    TxtStudentCardTxt,
    CsvStudentCard,
    PdfStudentCard,
    debtsByGroup,
}
