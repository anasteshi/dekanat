import { loadStudents } from "./students.js"
import { loadCurriculum } from "./curriculum.js"
import { loadAnalytics } from "./analytics.js"

const titles = {
    dashboard: "Дашборд",
    students: "Студенти",
    curriculum: "Навчальні плани",
    analytics: "Аналітика",
    reports: "Звіти",
}
export const initNavigation = () => {
    document.querySelectorAll(".nav-item").forEach((el) => {
        el.addEventListener("click", () => {
            document
                .querySelectorAll(".nav-item")
                .forEach((e) => e.classList.remove("active"))
            document
                .querySelectorAll(".view")
                .forEach((e) => e.classList.remove("active"))
            el.classList.add("active")
            const view = el.dataset.view
            document.getElementById(`view-${view}`).classList.add("active")
            document.getElementById("page-title").textContent = titles[view]
            if (view === "students") loadStudents()
            if (view === "curriculum") loadCurriculum()
            if (view === "analytics") loadAnalytics()
        })
    })
}
