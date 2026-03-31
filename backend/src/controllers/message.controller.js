import cloudinary from "../lib/cloudinary.js"
import { getRecieverSocketId, io } from "../lib/socket.js"
import Message from "../models/Message.js"
import User from "../models/User.js"
import { encrypt, decrypt } from "../lib/encryption.js" // ← přidej import

// getMessagesByUserId — dešifruj před odesláním na frontend
export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]
        });

        // dešifruj text a audio URL každé zprávy
        const decryptedMessages = messages.map(msg => ({
            ...msg._doc,
            text: msg.text ? decrypt(msg.text) : null,
            audio: msg.audio ? decrypt(msg.audio) : null
        }))

        res.status(200).json(decryptedMessages)
    } catch (error) {
        console.log("Error in getMessage controller:", error.message)
        res.status(500).json({ error: "Internal server error" })
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image, audio, audioDuration } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!text && !image && !audio) {
            return res.status(400).json({ message: "Text, image or audio is required" })
        }

        if (senderId.equals(receiverId)) {
            return res.status(404).json({ message: "Receiver not found" })
        }

        const receiverExists = await User.exists({ _id: receiverId })
        if (!receiverExists) {
            return res.status(400).json({ message: 'Receiver not found.' })
        }

        let imageUrl
        let audioUrl

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        if (audio) {
            try {
                const base64String = audio.split(",")[1];
                const audioBuffer = Buffer.from(base64String, "base64");

                const uploadResponse = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: "video",
                            folder: "chat_audio",
                            format: "mp3",
                            transformation: [{ bit_rate: "64k" }]
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(audioBuffer);
                });

                audioUrl = uploadResponse.secure_url;
            } catch (error) {
                console.error("Cloudinary upload error:", error);
            }
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text: text ? encrypt(text) : undefined,       // šifruj text před uložením
            image: imageUrl,
            audio: audioUrl ? encrypt(audioUrl) : undefined, // šifruj audio URL před uložením
            audioDuration: audioDuration || 0,
        });

        await newMessage.save();

        // pro socket pošli dešifrovanou verzi (frontend to rovnou zobrazí)
        const messageForSocket = {
            ...newMessage._doc,
            text: text || null,      // plaintext pro real-time zobrazení
            audio: audioUrl || null  // plaintext audio URL pro real-time zobrazení
        }

        const recieverSocketId = getRecieverSocketId(receiverId)
        if (recieverSocketId) {
            io.to(recieverSocketId).emit("newMessage", messageForSocket)
        }

        res.status(201).json(messageForSocket) // ← vrať plaintext, ne šifrované

    } catch (error) {
        console.log("Error in sendMessage controller:", error.message)
        res.status(500).json({ error: "Internal server error" })
    }
}

// getAllContacts a getChatPartners zůstávají beze změny
export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id
        const filteredUsers = await User.find({
            _id: { $ne: loggedInUserId }
        }).select("-password")
        res.status(200).json(filteredUsers)
    } catch (error) {
        console.log("Error in getAllContact:", error);
        res.status(500).json({ message: "Server error" })
    }
}

export const getChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const messages = await Message.find({
            $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
        });

        const chatPartnerIds = [
            ...new Set(
                messages.map((msg) =>
                    msg.senderId.toString() === loggedInUserId.toString()
                        ? msg.receiverId.toString()
                        : msg.senderId.toString()
                )
            ),
        ];

        const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");
        res.status(200).json(chatPartners);
    } catch (error) {
        console.error("Error in getChatPartners: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
