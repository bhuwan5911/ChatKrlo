import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets.js";
import { formatMessageTime } from "../lib/utils.js";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import IncomingCallPopup from "./IncomingCallPopup.jsx";
import {
  Users,
  Info,
  Video,
  PhoneOff,
  Maximize2,
  Minimize2,
} from "lucide-react";

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } =
    useContext(ChatContext);

  const {
    authUser,
    onlineUsers,
    socket,
    activeCall,
    setActiveCall,
    stopRingtone,
  } = useContext(AuthContext);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const scrollEnd = useRef(null);

  const [input, setInput] = useState("");
  const [isFull, setIsFull] = useState(false);

  // ---------------- Chat ----------------
  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
  }, [selectedUser]);

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage({ text: input.trim() });
    setInput("");
  };

  // ---------------- Media ----------------
  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    streamRef.current = stream;
    if (myVideo.current) myVideo.current.srcObject = stream;
    return stream;
  };

  const createPeer = (to) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { to, candidate: e.candidate });
      }
    };

    peer.ontrack = (e) => {
      if (userVideo.current) {
        userVideo.current.srcObject = e.streams[0];
        userVideo.current.play().catch(() => {});
      }
    };

    streamRef.current?.getTracks().forEach((track) => {
      peer.addTrack(track, streamRef.current);
    });

    return peer;
  };

  // ---------------- Start Call (Caller) ----------------
  const startCall = async () => {
    if (!selectedUser || !socket) return;

    setActiveCall({ user: selectedUser });

    await getMedia();
    const peer = createPeer(selectedUser._id);
    peerRef.current = peer;

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit("call-user", {
      to: selectedUser._id,
      from: authUser._id,
      offer,
      caller: {
        _id: authUser._id,
        fullName: authUser.fullName,
        profilePic: authUser.profilePic,
      },
    });
  };

  // ---------------- Accept Call (Receiver) ----------------
  const acceptCall = async (callData) => {
    if (!callData || !socket) return;

    stopRingtone();

    const { from, caller, offer } = callData;

    setActiveCall({ user: caller }); // show video UI

    await getMedia();
    const peer = createPeer(from);
    peerRef.current = peer;

    await peer.setRemoteDescription(offer);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer-call", { to: from, answer });
  };

  // ---------------- End Call ----------------
  const endCall = () => {
    const toId = activeCall?.user?._id;
    if (toId) socket.emit("call-ended", { to: toId });
    cleanup();
  };

  const cleanup = () => {
    stopRingtone();
    setActiveCall(null);

    peerRef.current?.close();
    peerRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (myVideo.current) myVideo.current.srcObject = null;
    if (userVideo.current) userVideo.current.srcObject = null;
  };

  // ---------------- Socket listeners ----------------
  useEffect(() => {
    if (!socket) return;

    socket.on("call-answered", async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(answer);
      }
    });

    socket.on("call-ended", cleanup);
    socket.on("call-rejected", cleanup);

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerRef.current && candidate) {
        await peerRef.current.addIceCandidate(candidate);
      }
    });

    return () => {
      socket.off("call-answered");
      socket.off("call-ended");
      socket.off("call-rejected");
      socket.off("ice-candidate");
    };
  }, [socket]);

  const isOnline =
    selectedUser &&
    (onlineUsers.includes(selectedUser._id) ||
      selectedUser.email === "ai@quickchat.com");

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden relative">
      {/* ✅ Incoming Call Popup */}
      <IncomingCallPopup onAccept={acceptCall} />

      {/* No chat selected */}
      {!selectedUser && !activeCall && (
        <div className="flex-1 flex items-center justify-center text-white max-md:hidden">
          Select a chat to start
        </div>
      )}

      {/* Chat UI */}
      {selectedUser && (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-[#232135]">
            {selectedUser.isGroup ? (
              <Users className="text-violet-400" />
            ) : (
              <div className="relative">
                <img
                  src={selectedUser.profilePic || assets.avatar_icon}
                  className="w-10 h-10 rounded-full"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#232135] rounded-full"></span>
                )}
              </div>
            )}

            <h3 className="text-white font-bold flex-1 truncate">
              {selectedUser.isGroup
                ? selectedUser.name
                : selectedUser.fullName}
            </h3>

            {!selectedUser.isGroup && (
              <button
                onClick={startCall}
                className="p-2 hover:bg-white/10 rounded-full text-violet-400"
              >
                <Video />
              </button>
            )}

            <Info className="text-gray-400" />
            <img
              src={assets.arrow_icon}
              onClick={() => setSelectedUser(null)}
              className="w-6 md:hidden invert cursor-pointer"
            />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1a1829]/30">
            {messages.map((msg, i) => {
              const mine = msg.senderId === authUser._id;
              return (
                <div
                  key={i}
                  className={`flex ${
                    mine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm max-w-[70%] ${
                      mine
                        ? "bg-violet-600 text-white"
                        : "bg-[#2e2b3e] text-white"
                    }`}
                  >
                    {msg.text}
                    <div className="text-[10px] text-gray-400 mt-1">
                      {formatMessageTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollEnd}></div>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 flex gap-2 bg-[#232135]"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-white outline-none"
              placeholder="Type message..."
            />
            <button
              type="submit"
              className="bg-violet-600 px-4 rounded-xl text-white"
            >
              Send
            </button>
          </form>
        </>
      )}

      {/* ✅ Video Call UI */}
      {activeCall && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-40">
          <div className={`flex gap-4 ${isFull ? "flex-col" : ""}`}>
            <video
              ref={userVideo}
              autoPlay
              playsInline
              className="w-72 h-52 rounded bg-black"
            />
            <video
              ref={myVideo}
              autoPlay
              muted
              playsInline
              className="w-40 h-32 rounded bg-black"
            />
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setIsFull((p) => !p)}
              className="bg-gray-600 p-3 rounded-full text-white"
            >
              {isFull ? <Minimize2 /> : <Maximize2 />}
            </button>

            <button
              onClick={endCall}
              className="bg-red-500 p-3 rounded-full text-white"
            >
              <PhoneOff />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
