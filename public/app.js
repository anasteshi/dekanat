import "./utils.js"
import "./analytics.js"
import "./reports.js"
import "./auth.js"
import { Token, showApp } from "./auth.js"
import { $, api, toast, closeModal } from "./utils.js"
console.log("hi")
Token.load()
if (Token.isLoggedIn) {
    showApp()
} else {
}

window.closeModal = (id) => $(id).classList.remove("open")
