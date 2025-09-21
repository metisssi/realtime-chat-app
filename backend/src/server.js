import express from "express"
import cookieParser from "cookie-parser"
import path from "path"
import cors from "cors"


import authRoutes from "./routes/auth.route.js"
import messagesRoutes from "./routes/messages.route.js"
import { connectDB } from "./lib/db.js"
import { ENV } from "./lib/env.js"
import { app, server } from "./lib/socket.js"





const PORT = ENV.PORT || 3000 


app.use(express.json({ limit: "15mb"})) // req.body
app.use(cors({origin:ENV.CLIENT_URL, credentials: true}))
app.use(cookieParser())

const __dirname = path.resolve();


app.use("/api/auth", authRoutes)
app.use("/api/messages", messagesRoutes)

// Make ready for deployment
if(ENV.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")))

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    })
}



server.listen(PORT, () => {
    connectDB()
    console.log(`Server running on PORT ${PORT}`)  
})


