import cloudinary from "../lib/cloudinary.js"
import { getRecieverSocketId, io } from "../lib/socket.js"
import Message from "../models/Message.js"
import User from "../models/User.js"

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

export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params
        const message = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]
        });
        res.status(200).json(message)
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

        if(!text && !image && !audio) {
            return res.status(400).json({ message: "Text, image or audio is required"})
        }

        if (senderId.equals(receiverId)) {
            return res.status(404).json({ message: "Receiver not found"})
        }

        const receiverExists = await User.exists({ _id: receiverId})
        if(!receiverExists) {
            return res.status(400).json({ message: 'Receiver not found.'})
        }

        let imageUrl
        let audioUrl

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        if (audio) {
            try {
                console.log("Starting audio upload to Cloudinary...");
                console.log("Audio data preview:", audio.substring(0, 100));
                
                // Загружаем аудио файл
                const uploadResponse = await cloudinary.uploader.upload(audio, {
                    resource_type: "video", // Cloudinary использует "video" для всех аудио
                    folder: "chat_audio",
                    allowed_formats: ["mp3", "wav", "ogg", "webm", "m4a", "aac"],
                })
                
                audioUrl = uploadResponse.secure_url
                console.log("Audio uploaded successfully:", {
                    url: audioUrl,
                    format: uploadResponse.format,
                    resource_type: uploadResponse.resource_type,
                    bytes: uploadResponse.bytes
                });
                
            } catch (uploadError) {
                console.error("Audio upload error:", {
                    message: uploadError.message,
                    stack: uploadError.stack,
                    error: uploadError
                })
                return res.status(500).json({ 
                    message: "Failed to upload audio",
                    error: uploadError.message 
                })
            }
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            audio: audioUrl,
            audioDuration: audioDuration || 0,
        });

        await newMessage.save();

        const recieverSocketId = getRecieverSocketId(receiverId)
        if(recieverSocketId) {
            io.to(recieverSocketId).emit("newMessage", newMessage)
        }

        res.status(201).json(newMessage)
    } catch (error) {
        console.log("Error in sendMessage controller:", error.message)
        res.status(500).json({ error: "Internal server error" })
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