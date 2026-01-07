import express from "express"
import cookieParser from "cookie-parser"
import path from "path"
import { fileURLToPath } from 'url'
import cors from "cors"
import helmet from 'helmet';

import authRoutes from "./routes/auth.route.js"
import messagesRoutes from "./routes/messages.route.js"
import { connectDB } from "./lib/db.js"
import { ENV } from "./lib/env.js"
import { app, server } from "./lib/socket.js"
import mongoSanitize from 'express-mongo-sanitize';

// Правильное определение __dirname для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = ENV.PORT || 3000 


app.use(mongoSanitize()) // protection against NoSQL injection
app.use(express.json({ limit: "50mb"})) // req.body
app.use(cors({origin:ENV.CLIENT_URL, credentials: true}))
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/messages", messagesRoutes)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            mediaSrc: ["'self'", "https://res.cloudinary.com"], // РАЗРЕШАЕМ АУДИО
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "https://res.cloudinary.com", "wss://ваш-сайт.onrender.com"], // Для сокетов
        }
    }
}));

// Make ready for deployment
if (process.env.NODE_ENV === "production") {
    // __dirname сейчас это /opt/render/project/src/backend/src
    // Нужно подняться на 2 уровня вверх, затем в frontend/dist
    const frontendDistPath = path.join(__dirname, "..", "..", "frontend", "dist");
    
    console.log("__dirname:", __dirname);
    console.log("Looking for frontend at:", frontendDistPath);
    
    app.use(express.static(frontendDistPath));

    app.get("*", (req, res) => {
        res.sendFile(path.join(frontendDistPath, "index.html"));
    });
}

server.listen(PORT, () => {
    connectDB()
    console.log(`Server running on PORT ${PORT}`)  
})