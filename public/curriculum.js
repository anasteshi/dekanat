import { $, api, toast, closeModal } from "./utils.js"

const loadBtn = document.querySelector("[data-action='load-curriculum']")
const saveBtn = document.querySelector("[data-action='save-curriculum']")
const deleteBtn = document.querySelector("[data-action='delete-curriculum']")
const openBtn = document.querySelector("[data-action='open-modal-curriculum']")
const closeBtn = document.querySelector(
    "[data-action='close-modal-curriculum']",
)

const controlChip = (cf) => {
    const map = {
        іспит: "blue",
        залік: "ok",
        "диф. залік": "warn",
        "курсова робота": "accent",
    }
    const statusColor = map[cf] || "muted"
    return `<span class="chip chip-${statusColor}">${cf}</span>`
}

export const loadCurriculum = async () => {
    const specialty = $("filter-spec")?.value || ""
    const semester = $("filter-sem")?.value || ""
    let path = "/curriculum?"

    if (specialty) {
        path += `specialty_id=${specialty}&`
    }
    if (semester) {
        path += `semester=${semester}&`
    }

    try {
        const { data } = await api("GET", path)
        const tbody = $("curriculum-tbody")
        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--muted)">Нічого не знайдено</td></tr>`
            return
        }
        tbody.innerHTML = data
            .map(
                (row) => `<tr>
				<td><span style="font-family:var(--mono);font-size:11px;color:var(--muted)">${row.curriculum_id}</span></td>
				<td>${row.specialty_code}</td>
				<td>${row.subject_name}</td>
				<td>${row.semester}</td>
				<td>${row.lecture_hours}</td>
				<td>${row.practice_hours}</td>
				<td>${row.lab_hours}</td>
				<td><strong>${row.total_hours}</strong></td>
				<td>${controlChip(row.control_form)}</td>
				<td>
					<button class="btn btn-danger btn-sm"
					onclick="deleteCurriculum(${row.curriculum_id})">✕</button>
				</td>
				</tr>`,
            )
            .join("")
    } catch (err) {
        toast(err.message, true)
    }
}

export const openCurriculumModal = () => {
    $("modal-curriculum").classList.add("open")
}

export const saveCurriculum = async () => {
    const body = {
        specialty_id: Number($("c-spec").value),
        subject_id: Number($("c-subject").value),
        semester: Number($("c-semester").value),
        lecture_hours: Number($("c-lec").value),
        practice_hours: Number($("c-prac").value),
        lab_hours: Number($("c-lab").value),
        control_form: $("c-control").value,
    }
    try {
        await api("POST", "/curriculum", body)
        toast("Запис навчального плану додано ✓")
        closeModal("modal-curriculum")
        loadCurriculum()
    } catch (err) {
        toast(err.message, true)
        closeModal("modal-curriculum")
    }
}

export const deleteCurriculum = async (id) => {
    if (!confirm(`Видалити запис curriculum id=${id}?`)) return
    try {
        await api("DELETE", `/curriculum/${id}`)
        toast(`Запис ${id} видалено`)
        loadCurriculum()
    } catch (err) {
        toast(err.message, true)
    }
}
loadBtn.addEventListener("click", loadCurriculum)
saveBtn.addEventListener("click", saveCurriculum)
deleteBtn.addEventListener("click", deleteCurriculum)
openBtn.addEventListener("click", openCurriculumModal)
closeBtn.addEventListener("click", () => {
    closeModal("modal-curriculum")
})
