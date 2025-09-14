import express from "express"
import { signup } from "../controllers/auth.controllers.js"

const router = express.Router()

router.post("/sighup", signup)

router.get("/login", (req, res) => {
    res.send("Login endpoin")
})

router.get("/logout", (req, res) => {
    res.send("Logout endpoin")
})


export default router