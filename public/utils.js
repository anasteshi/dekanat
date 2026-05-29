// API helper function
const BASE = "/api"

export const $ = (id) => {
    return document.getElementById(id)
}

export const api = async (method, path, body) => {
    const token = sessionStorage.getItem("dekanat_token")
    const opts = {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    }
    if (body) {
        opts.body = JSON.stringify(body)
    }
    const res = await fetch(BASE + path, opts)

    const data = await res.json()
    if (!data.ok) throw new Error(data.message)
    return data
}

// Popup message
export const toast = async (msg, isErr = false) => {
    const t = $("toast")
    t.textContent = msg
    t.style.borderLeftColor = isErr ? "var(--danger)" : "var(--accent)"
    t.classList.add("show")
    setTimeout(() => t.classList.remove("show"), 3000)
}

export const closeModal = (id) => {
    $(id).classList.remove("open")
}

document.querySelectorAll(".modal-overlay").forEach((el) => {
    el.addEventListener("click", (e) => {
        if (e.target === el) el.classList.remove("open")
    })
})
