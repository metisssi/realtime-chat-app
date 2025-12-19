import cloudinary from "../lib/cloudinary.js"
import { getRecieverSocketId, io } from "../lib/socket.js"
import Message from "../models/Message.js"

import User from "../models/User.js"

export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id

        // Not equal to 
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

        // me and you 
        // i send you the message
        // you send me the message

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
            return res.status(404).json({ message: "Recevier not found"})
        }

        const receiverExists = await User.exists({ _id: receiverId})
        if(!receiverExists) {
            return res.status(400).json({ message: 'Recevier not found.'})
        }




        let imageUrl
        let audioUrl

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        if (audio) {
            const uploadResponse = await cloudinary.uploader.upload(audio, {
                resource_type: "video", // Cloudinary использует "video" для аудио файлов
                format: "mp3"
            })
            audioUrl = uploadResponse.secure_url
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            audio: audioUrl,
            audioDuration,
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

    // find all the messages where the logged-in user is either sender or receiver
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