import crypto from "crypto"
import { ENV } from "./env.js"

const KEY = Buffer.from(ENV.ENCRYPTION_KEY, "hex") // 32 bytes

export const encrypt = (text) => {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv)
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
    return iv.toString("hex") + ":" + encrypted.toString("hex")
}

export const decrypt = (encryptedText) => {
    try {
        const [ivHex, encryptedHex] = encryptedText.split(":")
        const iv = Buffer.from(ivHex, "hex")
        const encrypted = Buffer.from(encryptedHex, "hex")
        const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv)
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
        return decrypted.toString("utf8")
    } catch {
        return encryptedText // fallback pro starý nešifrovaný text v DB
    }
}