import { generateToken } from "../lib/utils.js"
import User from "../models/User.js"; 
import bcrypt from "bcryptjs"

import {saneWelcomeEmail} from "../emails/emailHandler.js"
import { ENV } from "../lib/env.js";

export const signup = async (req, res) => {

    const { fullname, email, password } = req.body


    try {
        if (!fullname || !email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 charachters" })
        }

        // check if  emailis valid: regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const user = await User.findOne({email})

        if( user ) return res.status(400).json({message: "Email Alredy exists"})

        // 123456 =>  $dn

        const salt = await bcrypt.genSalt(10)

        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullname,
            email, 
            password: hashedPassword
        })

        if(newUser) {
            // Presist user first, then issues auth cookie
            const savedUser = await newUser.save()
            generateToken(savedUser._id, res) 

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullname,
                email: newUser.email, 
                profilePic: newUser.profilePic
            })

            // todo: send a welcome email to user 

            try{
                await saneWelcomeEmail(savedUser.email, savedUser.fullname, ENV.CLIENT_URL); 
            }catch (error) {
                console.log("Failed to send welcome email:", error)
            }
        } else{
            res.status(400).json({message: "invalid user data"})
        }
    } catch (error) {
        console.log("Error in sighup controller:", error)
        res.status(500).json({message: "Internal server error"})
    }
}

