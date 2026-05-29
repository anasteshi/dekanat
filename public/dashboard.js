import { $, api, toast, closeModal } from "./utils.js"
import { makeChart } from "./chart-config.js"
import { chipStatus } from "./students.js"

export const loadDashboard = async () => {
    const health = await api("GET", "/")
    $("api-status").textContent = health.ok ? "⬤ API онлайн" : "⬤ Помилка"
    $("api-status").style.color = health.ok ? "var(--ok)" : "var(--danger)"

    // Stats
    const stuResp = await api("GET", "/students?status=активний")
    const hoursResp = await api("GET", "/analytics/hours-by-specialty")
    const gradeResp = await api("GET", "/analytics/avg-grade-by-specialty")
    const debtsResp = await api("GET", "/reports/debts/IT-22")
    console.log(debtsResp)

    $("stat-students").textContent = stuResp.count
    $("stat-specs").textContent = hoursResp.data.length

    const avgAll = gradeResp.data
        .filter((r) => r.avg_grade)
        .map((r) => Number(r.avg_grade))
    $("stat-avg").textContent =
        avgAll.length ?
            (avgAll.reduce((a, b) => a + b, 0) / avgAll.length).toFixed(1)
        :   "—"
    $("stat-debts").textContent = 5
    $("stat-debts").textContent = debtsResp.data.length ?? "—"

    // Hours by specialty (grouped bar)
    const hoursData = hoursResp.data
    makeChart(
        "chart-hours",
        "bar",
        {
            labels: hoursData.map((row) => `${row.specialty_code}`),
            datasets: [
                {
                    label: "Лекції",
                    data: hoursData.map((r) => Number(r.lecture_hours)),
                    backgroundColor: "#1F4E79",
                },
                {
                    label: "Практики",
                    data: hoursData.map((r) => Number(r.practice_hours)),
                    backgroundColor: "#2E75B6",
                },
                {
                    label: "Лабораторні",
                    data: hoursData.map((r) => Number(r.lab_hours)),
                    backgroundColor: "#9DC3E6",
                },
            ],
        },
        {
            scales: { x: { stacked: true }, y: { stacked: true } },
            plugins: { legend: { position: "bottom" } },
        },
    )

    // Grade distribution (doughnut)
    const gradesData = gradeResp.data[0] || {}
    makeChart("chart-grades", "doughnut", {
        labels: ["A (≥90)", "B (82-89)", "C (74-81)", "D/E (60-73)", "F (<60)"],
        datasets: [
            {
                data: [
                    gradesData.grade_a || 0,
                    gradesData.grade_b || 0,
                    gradesData.grade_c || 0,
                    gradesData.grade_de || 0,
                    gradesData.grade_f || 0,
                ],
                backgroundColor: [
                    "#1A7F5A",
                    "#2E75B6",
                    "#F0A500",
                    "#E67E22",
                    "#C0392B",
                ],
                borderWidth: 2,
                borderColor: "#fff",
            },
        ],
    })

    // Recent students table
    const tbody = $("dash-students-tbody")
    tbody.innerHTML = stuResp.data
        .slice(0, 8)
        .map(
            (student) => `
      <tr>
        <td><strong>${student.fullname}</strong></td>
        <td><span style="font-family:var(--mono);font-size:12px">${student.record_book_no}</span></td>
        <td>${student.group_name}</td>
        <td>${student.specialty_code} ${student.specialty_name}</td>
        <td>${chipStatus(student.status)}</td>
      </tr>`,
        )
        .join("") // to make it a string out of an array
}
