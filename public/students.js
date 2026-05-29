import { $, api, toast, closeModal } from "./utils.js"
const loadStudentsBtn = document.querySelector("[data-action='load-students']")
const saveStudentBtn = document.querySelector("[data-action='save-student']")
const openModalBtn = document.querySelector(
    "[data-action='open-modal-student']",
)

// Student status chip
const chipStatus = (status) => {
    const map = {
        активний: "ok",
        відрахований: "danger",
        академвідпустка: "warn",
    }
    return `<span class="chip chip-${map[status] || "muted"}">${status}</span>`
}

const loadStudents = async () => {
    const group = $("filter-group")?.value || ""
    const status = $("filter-status")?.value || ""
    let path = "/students?"
    if (group) path += `group=${group}&`
    if (status) path += `status=${status}&`

    try {
        const { data } = await api("GET", path)
        const tbody = $("students-tbody")
        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted)">Нічого не знайдено</td></tr>`
            return
        }
        tbody.innerHTML = data
            .map(
                (student) => `
      <tr>
        <td><span style="font-family:var(--mono);font-size:11px;color:var(--muted)">${student.student_id}</span></td>
        <td><span style="font-family:var(--mono);font-size:12px">${student.record_book_no}</span></td>
        <td><strong>${student.fullname}</strong></td>
        <td>${student.group_name}</td>
        <td>${student.year_of_study}</td>
        <td>${student.specialty_code} ${student.specialty_name}</td>
        <td>${chipStatus(student.status)}</td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm"
            onclick="openStudentModal(${student.student_id},'${student.fullname}','${student.group_name}',${student.year_of_study},'${student.email || ""}')">
            ✎
          </button>
          <button class="btn btn-danger btn-sm"
            onclick="deleteStudent(${student.student_id},'${student.fullname}')">
            ✕
          </button>
        </td>
      </tr>`,
            )
            .join("")
    } catch (err) {
        toast(err.message, true)
    }
}

const openStudentModal = (id, fullname, group, year, email) => {
    $("modal-student-title").textContent =
        id ? "Редагувати студента" : "Новий студент"
    $("edit-student-id").value = id || ""
    $("s-fullname").value = fullname || ""
    $("s-group").value = group || ""
    $("s-year").value = year || ""
    $("s-email").value = email || ""
    $("s-record").value = ""
    $("s-spec").value = ""
    $("modal-student").classList.add("open")
}

const saveStudent = async () => {
    const id = $("edit-student-id").value
    const body = {
        record_book_no: $("s-record").value,
        fullname: $("s-fullname").value,
        specialty_id: Number($("s-spec").value),
        group_name: $("s-group").value,
        year_of_study: Number($("s-year").value),
        gender: $("s-gender").value || null,
        birth_date: $("s-birth").value || null,
        email: $("s-email").value || null,
    }

    try {
        if (id) {
            await api("PUT", `/students/${id}`, body)
            toast("Студента оновлено ✓")
        } else {
            await api("POST", "/students", body)
            toast("Студента додано ✓")
        }
        closeModal("modal-student")
        loadStudents()
    } catch (err) {
        toast(err.message, true)
    }
}

const deleteStudent = async (id, name) => {
    if (!confirm(`Відрахувати студента «${name}»?`)) return
    try {
        await api("DELETE", `/students/${id}`)
        toast(`${name} — відраховано`)
        loadStudents()
    } catch (e) {
        toast(e.message, true)
    }
}

window.deleteStudent = deleteStudent
window.openStudentModal = openStudentModal

loadStudentsBtn.addEventListener("click", loadStudents)
saveStudentBtn.addEventListener("click", saveStudent)

export { chipStatus, loadStudents }
