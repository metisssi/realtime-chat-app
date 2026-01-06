import express from "express"
import cookieParser from "cookie-parser"
import path from "path"
import cors from "cors"
import helmet from 'helmet';

import authRoutes from "./routes/auth.route.js"
import messagesRoutes from "./routes/messages.route.js"
import { connectDB } from "./lib/db.js"
import { ENV } from "./lib/env.js"
import { app, server } from "./lib/socket.js"
import mongoSanitize from 'express-mongo-sanitize';




const PORT = ENV.PORT || 3000 

app.use(mongoSanitize()) // protection against NoSQL injection
app.use(express.json({ limit: "15mb"})) // req.body
app.use(cors({origin:ENV.CLIENT_URL, credentials: true}))
app.use(cookieParser())

const __dirname = path.resolve();


app.use("/api/auth", authRoutes)
app.use("/api/messages", messagesRoutes)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
        }
    }
}));


// Make ready for deployment
if (process.env.NODE_ENV === "production") {
    // Используем path.resolve для абсолютного пути от корня проекта
    const frontendDistPath = path.resolve(__dirname, "..", "..", "frontend", "dist");
    
    console.log("Looking for frontend at:", frontendDistPath); // для отладки
    
    app.use(express.static(frontendDistPath));

    app.get("*", (req, res) => {
        res.sendFile(path.join(frontendDistPath, "index.html"));
    });
}



server.listen(PORT, () => {
    connectDB()
    console.log(`Server running on PORT ${PORT}`)  
})


