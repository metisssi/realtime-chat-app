import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true, 
        unique: true
    },

    fullname: {
        type: String,
        required: true, 
    },

    password: {
        type: String,
        required: true, 
        unique: true,
        minLength: 8 
    },

    profilePic: {
        type: String,
        default: ""
    },
}, { timestamps: true} // createdAt && updatedAt
)


const User = mongoose.model("User", userSchema); 

export default User;