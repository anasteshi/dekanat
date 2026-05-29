const { Pool } = require("pg")

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
})

const connectDB = async () => {
    try {
        await pool.connect()
        console.log("Connected to DB")
    } catch (error) {
        console.error("An error occurred connecting to DB:", error.message)
    }
}

module.exports = { connectDB, pool }
