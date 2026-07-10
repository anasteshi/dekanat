import "./utils.js"
import "./analytics.js"
import "./reports.js"
import "./auth.js"
import { Token, showApp } from "./auth.js"
import { $, api, toast, closeModal } from "./utils.js"
Token.load()
if (Token.isLoggedIn) {
    showApp()
}

window.closeModal = (id) => $(id).classList.remove("open")
