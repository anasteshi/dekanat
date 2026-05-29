import { $, api, toast, closeModal } from "./utils.js"
const previewBtn = document.querySelector("[data-action='preview-report']")
const downloadBtn = document.querySelector("[data-action='download-report']")
const debtsBtn = document.querySelector("[data-action='download-debts']")

const previewReport = async () => {
    const id = $("report-student-id").value
    if (!id) {
        toast("Введіть ID студента", true)
        return
    }
    const preview = $("card-preview")
    preview.style.display = "block"
    preview.textContent = "Завантаження…"
    const token = sessionStorage.getItem("dekanat_token")
    try {
        const res = await fetch(`/api/reports/student/${id}/txt`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log(res)
        const text = await res.text()
        preview.textContent = text
    } catch (err) {
        preview.textContent = "Помилка: " + err.message
    }
}

const downloadReport = () => {
    const id = $("report-student-id").value
    const format = $("report-format").value
    if (!id) {
        toast("Введіть ID студента", true)
        return
    }
    const token = sessionStorage.getItem("dekanat_token")
    window.location = `/api/reports/student/${id}/${format}?token=${encodeURIComponent(token)}`
}

const downloadDebts = async () => {
    const id = $("debts-group").value

    if (!id) {
        toast("Введіть ID групи", true)
        return
    }

    const token = sessionStorage.getItem("dekanat_token")

    try {
        const res = await fetch(
            `/api/reports/debts/${id}?token=${encodeURIComponent(token)}`,
        )
        const contentType = res.headers.get("content-type")
        
        if (contentType.includes("application/json")) {
            const data = await res.json()
            toast(data.message, false)
            return
        }
        window.location = `/api/reports/debts/${id}?token=${encodeURIComponent(token)}`
    } catch (err) {
        console.log(err)
    }
}

previewBtn.addEventListener("click", previewReport)
downloadBtn.addEventListener("click", downloadReport)
debtsBtn.addEventListener("click", downloadDebts)

export { previewReport, downloadReport }
