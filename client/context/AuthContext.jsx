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

  // ✅ LOGIN / SIGNUP FUNCTION (THIS WAS MISSING)
  const login = async (type, userData) => {
    try {
      const url =
        type === "signup" ? "/api/auth/signup" : "/api/auth/login";

      const { data } = await api.post(url, userData);

      if (data.success) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setAuthUser(data.user);

        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data.token}`;

        connectSocket(data.user);
      } else {
        alert(data.message || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert(
        err?.response?.data?.message ||
          "Something went wrong. Try again."
      );
    }
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

  const updateProfile = async (data) => {
    try {
      const res = await api.put("/api/auth/update-profile", data);
      if (res.data.success) {
        setAuthUser(res.data.user);
        return true;
      } else {
        alert(res.data.message || "Failed to update profile");
        return false;
      }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Error updating profile");
      return false;
    }
  };

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
        login,     // ✅ NOW PROVIDED
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
