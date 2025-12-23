import express from "express"
import { signup, login, logout, updateProfile } from "../controllers/auth.controllers.js"
import { protectRoute } from "../middleware/auth.middleware.js"
import { arcjetProtection } from "../middleware/arcjet.middleware.js"
import { slidingWindow } from "@arcjet/node";



const authLimiter = slidingWindow({
    mode: "LIVE",
    max: 5, // only 5 attempts
    interval: "15m", // in 15 minutes
});


const router = express.Router()


router.use(arcjetProtection); 


router.post("/signup", signup)

router.post("/login", login)
router.post("/logout", logout)


router.put("/update-profile", protectRoute,  updateProfile )

router.get("/check", protectRoute, (req, res) => {
    res.status(200).json(req.user)
})

export default router   

// middleware 