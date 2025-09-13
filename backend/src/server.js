import express from "express"
import dotenv from "dotenv"
import path from "path"

import authRoutes from "./routes/auth.route.js"
import messagesRoutes from "./routes/messages.route.js"

dotenv.config()

const app = express();

const PORT = process.env.PORT || 3000 

const __dirname = path.resolve();


app.use("/api/auth", authRoutes)
app.use("/api/messages", messagesRoutes)

// Make ready for deployment
if(process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")))

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    })
}



app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`)
})