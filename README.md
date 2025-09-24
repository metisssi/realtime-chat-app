# 💬 Realtime Chat App

Modern real-time messaging app with image sharing and animated UI.

## ✨ Features

- ⚡ **Real-time messaging** (Socket.io)
- 🖼️ **Image sharing** (Cloudinary)
- 👥 **Online status** indicators
- 🔐 **JWT authentication**
- 🎨 **Animated design**
- 🔒 **Bot protection** (Arcjet)

## 🛠️ Tech Stack

**Frontend:** React 19, Tailwind CSS, Zustand, Socket.io  
**Backend:** Node.js, Express, MongoDB, JWT, Socket.io  
**Services:** Cloudinary, Resend, Arcjet

## 🌐 Live Demo

**Try it here:** https://realtime-chat-app-r3d2x.sevalla.app/login

### 📸 How to Use

1. **Login Page** - Enter your credentials or click "Sign Up" to create account
   
   <img width="800" alt="Login Page" src="https://github.com/user-attachments/assets/dcc174b7-6f94-4076-b917-4e6b08eac515" />

2. **Sign Up** - Fill all fields and click "Create Account"
   
   <img width="800" alt="Sign Up Page" src="https://github.com/user-attachments/assets/e1022820-2258-436d-ba99-bbecb770cdd7" />

3. **Chat Interface** - Switch between "Chats" (your conversations) and "Contacts" (all users)
   
   **Chats Tab:**
   <img width="800" alt="Chats Tab" src="https://github.com/user-attachments/assets/2f0f658b-6c35-46c8-b358-28a818d8bcc0" />
   
   **Contacts Tab:**
   <img width="800" alt="Contacts Tab" src="https://github.com/user-attachments/assets/7efd92b3-3835-4796-ba4d-5e8fabc0695d" />

4. **Real-time Messaging** - Start chatting with any user instantly
   
   <img width="800" alt="Chat Messages" src="https://github.com/user-attachments/assets/c10573fa-9329-443f-bf85-e7d3b8862b5f" />

5. **Active Conversations** - All your chat partners appear in the Chats tab
   
   <img width="800" alt="Active Chats" src="https://github.com/user-attachments/assets/a99d7d14-e68c-48ff-a208-6662d4cbc296" />

6. **Profile Avatar** - Click your avatar to upload a profile picture (visible to all users)
   
   <img width="800" alt="Profile Upload" src="https://github.com/user-attachments/assets/448706da-47e2-40cc-8737-1908aa16f26b" />
   
   <img width="400" alt="Avatar Visible to Others" src="https://github.com/user-attachments/assets/298e3dcd-c1d7-49e8-8b9e-7c666f211940" />

7. **Settings** - Toggle sound effects and logout
   
   <img width="200" alt="Settings Panel" src="https://github.com/user-attachments/assets/eb1626eb-4344-4c41-8c8a-3e78e35dbd14" />

8. **Online Status** - See when users go offline in real-time
   
   <img width="800" alt="Offline Status" src="https://github.com/user-attachments/assets/87dd476d-df72-41c4-86e6-6e5b69c5eb54" />

## 🚀 Local Setup

1. **Clone & Install**
```bash
git clone https://github.com/metisssi/realtime-chat-app.git
cd realtime-chat-app
npm run build
```

2. **Environment Setup**

Create `backend/.env`:
```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_key
EMAIL_FROM=your_email@domain.com
EMAIL_FROM_NAME=Chat App
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINAR_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development
```

3. **Run Development Servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

4. **Open Browser**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 🌐 API Endpoints

```
POST /api/auth/signup         # Register user
POST /api/auth/login          # Login user
POST /api/auth/logout         # Logout user
GET  /api/auth/check          # Check auth status
PUT  /api/auth/update-profile # Update profile

GET  /api/messages/contacts   # Get all users
GET  /api/messages/chats      # Get chat partners
GET  /api/messages/:id        # Get messages with user
POST /api/messages/send/:id   # Send message
```

## 🚀 Production Deploy

```bash
npm run build  # Build for production
npm start      # Start production server
```

The app serves frontend from `backend` in production mode.

---

**Repository:** [GitHub](https://github.com/metisssi/realtime-chat-app)
