import { $, api, toast, closeModal } from "./utils.js"
import { makeChart } from "./chart-config.js"

const loadAnalyticsBtn = document.querySelector(
    "[data-action='load-analytics-detail']",
)

const loadAnalytics = async () => {
    try {
        const [specData, facultyData, deptData] = await Promise.all([
            api("GET", "/analytics/hours-by-specialty"),
            api("GET", "/analytics/students-by-faculty"),
            api("GET", "/analytics/department-load"),
        ])

        const select = $("analytics-spec-select")
        select.innerHTML = '<option value="">— оберіть —</option>'
        specData.data.forEach((s) => {
            select.innerHTML += `<option value="${s.specialty_id}">${s.specialty_code} ${s.specialty_name}</option>`
        })

        // Students by faculty (doughnut)
        const fd = facultyData.data

        makeChart(
            "chart-faculty",
            "bar",
            {
                labels: fd.map(
                    (faculty) =>
                        faculty.faculty_abbr ||
                        faculty.faculty_name.split(" ").pop(),
                ),
                datasets: [
                    {
                        label: "Студентів",
                        data: fd.map((faculty) => faculty.total_students),
                        backgroundColor: [
                            "#1F4E79",
                            "#2E75B6",
                            "#9DC3E6",
                            "#F0A500",
                        ],
                        borderRadius: 4,
                    },
                ],
            },
            { indexAxis: "y", plugins: { legend: { display: false } } },
        )

        // Dept load table
        const tbody = $("dept-load-tbody")
        tbody.innerHTML = deptData.data
            .map(
                (row) => `<tr>
				<td><strong>${row.dept_name}</strong></td>
				<td>${row.subjects_count}</td>
				<td>${row.total_lecture_h}</td>
				<td>${row.total_practice_h}</td>
				<td>${row.total_lab_h}</td>
				<td><strong>${row.total_hours}</strong></td>
				<td>${row.avg_hours_per_subject}</td>
			</tr>`,
            )
            .join("")
    } catch (err) {
        toast(err.message, true)
    }
}
const loadAnalyticsDetail = async () => {
    const specialtyId = $("analytics-spec-select").value
    const semester = $("analytics-sem-select").value
    if (!specialtyId) {
        toast("Оберіть спеціальність", true)
        return
    }

    let path = `/analytics/chart-data/${specialtyId}`
    if (semester) path += `?semester=${semester}`

    try {
        const { chart } = await api("GET", path)
        makeChart("chart-detail", "bar", chart, {
            scales: {
                x: { stacked: true, ticks: { font: { size: 10 } } },
                y: { stacked: true, title: { display: true, text: "Години" } },
            },
        })
    } catch (err) {
        toast(err.message, true)
    }
}

loadAnalyticsBtn.addEventListener("click", loadAnalyticsDetail)

export { loadAnalytics }
