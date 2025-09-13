import express from "express"
import dotenv from "dotenv"

import authRoutes from "./routes/auth.route.js"
import messagesRoutes from "./routes/messages.route.js"

dotenv.config()

const app = express();

const PORT = process.env.PORT || 3000 




app.use("/api/auth", authRoutes)
app.use("/api/messages", messagesRoutes)





app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`)
})