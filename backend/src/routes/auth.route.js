import express from "express"


const router = express.Router()

router.get("/sighup", (req, res) => {
    res.send("Signup endpoint")
})

router.get("/login", (req, res) => {
    res.send("Login endpoin")
})

router.get("/logout", (req, res) => {
    res.send("Logout endpoin")
})


export default router