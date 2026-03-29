# 💬 QuickChat Full-Stack App

Welcome to **QuickChat**, a modern, feature-rich, full-stack real-time communication platform! This application provides users with seamless text messaging, image sharing, peer-to-peer video calling, and even an integrated AI bot participant.

Built with a beautiful glassmorphic dark-theme UI on the frontend and a scalable, robust Node.js/Express backend.

---

## ✨ Features

- **Real-Time Messaging**: Instant text and image messaging powered by Socket.io.
- **P2P Video Calling**: High-quality, low-latency video and audio calls using WebRTC (ICE candidates and signaling handled via Socket.io).
- **AI Chatbot Integration**: Talk to an integrated AI assistant powered by Google Generative AI and Groq.
- **Authentication**: Secure JWT-based user authentication (Signup, Login, Logout).
- **Profile Management**: Upload and update profile avatars seamlessly.
- **Online Status**: Real-time tracking of when users are online or offline.
- **Modern UI**: A responsive, fully custom glassmorphism design with a dark mode aesthetic.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS v4
- **State Management:** React Context API
- **Real-Time & WebRTC:** Socket.io-client, native WebRTC APIs
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast
- **Icons:** Lucide React

### Backend (Server)
- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB (with Mongoose ORM)
- **Real-Time Engine:** Socket.io
- **Authentication:** JSON Web Tokens (JWT), Bcrypt.js (Password Hashing)
- **File Storage:** Cloudinary (for user avatars and image messages)
- **AI Integrations:** `@google/generative-ai`, `groq-sdk`

---

## 🚀 Getting Started

Follow these instructions to set up the project on your local machine.

### Prerequisites
- Node.js (v18+ recommended)
- A MongoDB cluster (Atlas or local)
- A Cloudinary account
- API keys for Google Gen AI and/or Groq (optional, for AI features)

### 1. Clone & Install Dependencies
First, install the dependencies for both the frontend and backend.

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `server` directory and add the following keys:

```ini
# server/.env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Configuration
GROQ_API_KEY=your_groq_api_key
BOT_ID=your_ai_bot_user_id
```

Create a `.env` file in the `client` directory (if you need to override the default local URL):
```ini
# client/.env
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Run the Application
You will need to run the server and client concurrently in two separate terminal windows.

**Start the Backend:**
```bash
cd server
npm start
# Or use `npm run server` for auto-restarting via nodemon
```

**Start the Frontend:**
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`. 

---

## 🏗️ Project Architecture

- **`client/`**: Contains the complete Vite + React frontend application.
  - `src/components/`: Reusable UI elements (Chat window, Sidebar, etc.).
  - `src/context/`: Contains `AuthContext` and `ChatContext` to manage global user state and socket connections.
  - `src/pages/`: Main application routes (Home, Profile, Login/Signup).
- **`server/`**: Contains the Node.js API and WebSocket server.
  - `controllers/`: Handles core business logic (user auth, sending messages).
  - `models/`: Mongoose schemas for `User` and `Message`.
  - `routes/`: Express API endpoints.
  - `middleware/`: Route protection (JWT verification).
  - `lib/`: Helper config files (Cloudinary, Socket.io, DB connection).

---

## 📜 License
This project is open-source and available for unrestricted use and modification.
