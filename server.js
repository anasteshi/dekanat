require("dotenv").config()
require("express-async-errors")
const express = require("express")
const { connectDB } = require("./config/db")
const { errorHandlerMiddleware } = require("./middleware/errorHandler")
const studentRouter = require("./routes/students")
const curriculumRouter = require("./routes/curriculum")
const analyticsRouter = require("./routes/analytics")
const reportsRouter = require("./routes/reports")
const authRouter = require("./routes/auth")
const { notFound } = require("./middleware/not-found")
const app = express()
const port = process.env.PORT

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(express.static("./public"))

// Routes
app.use("/api/auth", authRouter)
app.use("/api/students", studentRouter)
app.use("/api/curriculum", curriculumRouter)
app.use("/api/analytics", analyticsRouter)
app.use("/api/reports", reportsRouter)

app.get("/api", (req, res) =>
    res.json({ ok: true, time: new Date().toISOString() }),
)

app.get("*", notFound)

app.use(errorHandlerMiddleware)

const start = async () => {
    try {
        await connectDB()
        app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`),
        )
    } catch (error) {
        console.log(error)
    }
}

start()
