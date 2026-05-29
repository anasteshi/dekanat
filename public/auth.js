import { $, api, toast, closeModal } from "./utils.js"
import { initNavigation } from "./navigation.js"
import { loadDashboard } from "./dashboard.js"

const Token = {
    token: null,
    user: null,

    save(data) {
        this.token = data.token
        this.user = data.user
        sessionStorage.setItem("dekanat_token", data.token)
        sessionStorage.setItem("dekanat_user", JSON.stringify(data.user))
    },

    load() {
        this.token = sessionStorage.getItem("dekanat_token")
        const user = sessionStorage.getItem("dekanat_user")
        this.user = user ? JSON.parse(user) : null
    },

    clear() {
        this.token = this._refresh = this.user = null
        sessionStorage.removeItem("dekanat_token")
        sessionStorage.removeItem("dekanat_refresh")
        sessionStorage.removeItem("dekanat_user")
    },

    get isLoggedIn() {
        return !!this.token
    },
}

const showRegisterForm = () => {
    $("login-box").style.display = "none"
    $("register-box").style.display = "block"
    $("reg-error").style.display = "none"
}

const showLoginForm = () => {
    $("login-box").style.display = "block"
    $("register-box").style.display = "none"
    $("login-error").style.display = "none"
}

const doRegister = async () => {
    const username = $("reg-username").value.trim()
    const password = $("reg-password").value
    const role = $("reg-role").value
    const errEl = $("reg-error")
    const btn = $("btn-register")

    errEl.style.display = "none"
    if (!username || !password) {
        errEl.textContent = "Введіть логін і пароль"
        errEl.style.display = "block"
        return
    }
    if (username.length < 3) {
        errEl.textContent = "Логін має бути не менше 3 символів"
        errEl.style.display = "block"
        return
    }

    if (/^\d+$/.test(username)) {
        errEl.textContent = "Логін не може складатися лише з цифр"
        errEl.style.display = "block"
        return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errEl.textContent =
            "Логін може містити лише латинські літери, цифри та знак підкреслення (_)"
        errEl.style.display = "block"
        return
    }

    btn.disabled = true
    btn.textContent = "Реєстрація…"

    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role }),
        })
        const data = await res.json()

        if (!res.ok) {
            errEl.textContent = data.message || "Помилка при реєстрації"
            errEl.style.display = "block"
            return
        }

        $("reg-username").value = ""
        $("reg-password").value = ""
        showLoginForm()
    } catch (err) {
        errEl.textContent = "Помилка з'єднання з сервером"
        errEl.style.display = "block"
    }
}

const fillDemo = (username, password) => {
    $("login-username").value = username
    $("login-password").value = password
    $("login-username").focus()
}

const doLogin = async () => {
    const username = $("login-username").value.trim()
    const password = $("login-password").value
    const errEl = $("login-error")
    const btn = $("btn-login")

    errEl.style.display = "none"
    if (!username || !password) {
        errEl.textContent = "Введіть логін і пароль"
        errEl.style.display = "block"
        return
    }

    btn.disabled = true
    btn.textContent = "Вхід…"

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        })
        const data = await res.json()
        if (!data.ok) {
            errEl.textContent = data.message || "Невірний логін або пароль"
            errEl.style.display = "block"
            return
        }

        Token.save(data)
        showApp()
    } catch (e) {
        errEl.textContent = "Помилка з'єднання з сервером"
        errEl.style.display = "block"
    } finally {
        btn.disabled = false
        btn.textContent = "Увійти"
    }
}

const doLogout = async () => {
    try {
        await api("POST", "/auth/logout")
    } catch (_) {}
    Token.clear()
    showLogin()
}

const showLogin = () => {
    $("app").classList.remove("visible")
    $("login-screen").style.display = "flex"
    $("login-password").value = ""
    $("login-error").style.display = "none"
}

const showApp = () => {
    $("login-screen").style.display = "none"
    $("app").classList.add("visible")

    const user = Token.user
    if (user) {
        $("user-name").textContent = user.username
        $("user-role-label").textContent = user.role
        $("user-avatar").textContent = user.username[0].toUpperCase()

        const rb = $("role-badge")
        rb.textContent = user.role
        rb.className = `role-badge role-${user.role}`

        applyRoleUI(user.role)
    }

    initNavigation()
    loadDashboard()
}

const applyRoleUI = (role) => {
    const readOnly = ["teacher"]
    if (readOnly.includes(role)) {
        $("btn-add-student") && ($("btn-add-student").style.display = "none")
        $("btn-add-curriculum") &&
            ($("btn-add-curriculum").style.display = "none")
    } else {
        $("btn-add-student") && ($("btn-add-student").style.display = "block")
        $("btn-add-curriculum") &&
            ($("btn-add-curriculum").style.display = "block")
    }
}

$("link-to-register").addEventListener("click", showRegisterForm)
$("link-to-login").addEventListener("click", showLoginForm)

$("btn-login").addEventListener("click", doLogin)
$("btn-register").addEventListener("click", doRegister)
$("btn-logout").addEventListener("click", doLogout)

$("admin").addEventListener("click", () => {
    fillDemo("admin", "Admin1234")
})
$("teacher").addEventListener("click", () => {
    fillDemo("teacher1", "Teach1234")
})
$("methodist").addEventListener("click", () => {
    fillDemo("methodist1", "Metod1234")
})

export { Token, showApp }
