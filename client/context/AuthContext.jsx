import { createContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// ✅ Axios instance
const api = axios.create({
  baseURL: backendUrl,
  timeout: 10000,
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  const ringtoneRef = useRef(null);
  const loggingRef = useRef(false);

  // 🔔 ringtone helpers
  const playRingtone = () => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio("/ringtone.mp3");
      ringtoneRef.current.loop = true;
    }
    ringtoneRef.current.play().catch(() => {});
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  // 🔌 connect socket
  const connectSocket = (user) => {
    if (!user) return;
    if (socket?.connected) return; // ✅ already connected

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

    newSocket.on("call-answered", () => {
      stopRingtone();
      setIncomingCall(null);
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

  // ✅ check auth
  const checkAuth = async (savedToken) => {
    try {
      api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
      const { data } = await api.get("/api/auth/check");

      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Auth check failed");
      logout();
    }
  };

  // ✅ login / signup
  const login = async (state, credentials) => {
    if (loggingRef.current) return;
    loggingRef.current = true;

    try {
      const { data } = await api.post(`/api/auth/${state}`, credentials);

      if (data.success) {
        setAuthUser(data.userData);
        setToken(data.token);
        localStorage.setItem("token", data.token);

        api.defaults.headers.common["Authorization"] =
          `Bearer ${data.token}`;

        connectSocket(data.userData);
        toast.success(data.message);
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Backend not responding. Check server.");
    } finally {
      loggingRef.current = false;
    }
  };

  // ✅ logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    setIncomingCall(null);
    setActiveCall(null);
    stopRingtone();

    delete api.defaults.headers.common["Authorization"];

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      setSocket(null);
    }
  };

  // 🔁 init on reload
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
        login,
        logout,
        incomingCall,
        setIncomingCall,
        activeCall,
        setActiveCall,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
