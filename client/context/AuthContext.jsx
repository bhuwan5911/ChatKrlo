import { createContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: backendUrl,
  timeout: 10000,
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [socket, setSocket] = useState(null);

  const ringtoneRef = useRef(null);

  // 🔔 Ringtone
  const playRingtone = () => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio("/ringtone.mp3");
      ringtoneRef.current.loop = true;
    }
    ringtoneRef.current.play().catch(() =>
      console.log("Ringtone blocked until user interacts")
    );
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  // 🔌 Connect socket
  const connectSocket = (user) => {
    if (!user || socket) return;

    const newSocket = io(backendUrl, {
      query: { userId: user._id },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users || []);
    });

    newSocket.on("incoming-call", (data) => {
      setIncomingCall(data);
      playRingtone();
    });

    newSocket.on("call-rejected", () => {
      stopRingtone();
      setIncomingCall(null);
      setActiveCall(null);
    });

    newSocket.on("call-ended", () => {
      stopRingtone();
      setIncomingCall(null);
      setActiveCall(null);
    });
  };

  const checkAuth = async (savedToken) => {
    try {
      api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
      const { data } = await api.get("/api/auth/check");

      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      } else logout();
    } catch {
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    setIncomingCall(null);
    setActiveCall(null);
    stopRingtone();

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      checkAuth(savedToken);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        axios: api,
        authUser,
        onlineUsers,
        socket,
        incomingCall,
        setIncomingCall,
        activeCall,
        setActiveCall,
        playRingtone,
        stopRingtone,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
