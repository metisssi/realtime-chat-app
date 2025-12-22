import { generateToken } from "../lib/utils.js"
import User from "../models/User.js";
import bcrypt from "bcryptjs"

import { saneWelcomeEmail } from "../emails/emailHandler.js"
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";


export const signup = async (req, res) => {

    const { fullname, email, password } = req.body


    try {
        if (!fullname || !email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        // УСИЛЕННАЯ ВАЛИДАЦИЯ ПАРОЛЯ
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        // Проверка на цифру
        if (!/\d/.test(password)) {
            return res.status(400).json({ message: "Password must contain at least one number" })
        }

        // Проверка на заглавную букву
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ message: "Password must contain at least one uppercase letter" })
        }

        // Проверка на строчную букву
        if (!/[a-z]/.test(password)) {
            return res.status(400).json({ message: "Password must contain at least one lowercase letter" })
        }

        // Опционально: проверка на спецсимвол (можешь раскомментировать)
        // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        //     return res.status(400).json({ message: "Password must contain at least one special character" })
        // }

        // check if email is valid: regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const user = await User.findOne({ email })

        if (user) return res.status(400).json({ message: "Email already exists" })

        // Хеширование пароля с salt
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullname,
            email,
            password: hashedPassword
        })

        if (newUser) {
            // Сохраняем пользователя, потом выдаем токен
            const savedUser = await newUser.save()
            generateToken(savedUser._id, res)

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullname,
                email: newUser.email,
                profilePic: newUser.profilePic
            })

            // Отправка welcome email (уже работает)
            try {
                await saneWelcomeEmail(savedUser.email, savedUser.fullname, ENV.CLIENT_URL);
            } catch (error) {
                console.log("Failed to send welcome email:", error)
            }
        } else {
            res.status(400).json({ message: "Invalid user data" })
        }
    } catch (error) {
        console.log("Error in signup controller:", error)
        res.status(500).json({ message: "Internal server error" })
    }
}


export const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" })
    }

    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid Credentials" })

        generateToken(user._id, res)

        res.status(200).json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            profilePic: user.profilePic,
        })
    } catch (error) {
        console.error("Error in login controller:", error)
        res.status(500).json({ message: "Internal server error" })
    }
}


export const logout = (_, res) => {
    res.cookie("jwt", "", { maxAge: 0 })
    res.status(200).json({ message: "Logged out successfully" })
}


export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body

        if (!profilePic) return res.status(400).json({ message: "Profile pic is required" })

        const userId = req.user._id

        const uploadResponse = await cloudinary.uploader.upload(profilePic)

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );

        res.status(200).json(updatedUser)
    } catch (error) {
        console.log('Error in update profile:', error)
        res.status(500).json({ message: "Internal server error" })
    }
}




