import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets.js";
import { formatMessageTime } from "../lib/utils.js";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import IncomingCallPopup from "./IncomingCallPopup.jsx";
import { Video, PhoneOff } from "lucide-react";

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
    setIncomingCall,
  } = useContext(AuthContext);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const scrollEnd = useRef(null);
  const pendingIce = useRef([]);

  const [input, setInput] = useState("");

  // Load messages
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

  // 🎥 Get media
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (myVideo.current) myVideo.current.srcObject = stream;
      return stream;
    } catch {
      alert("Camera/Microphone permission denied");
      return null;
    }
  };

  // 🔗 Create peer
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

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) =>
        peer.addTrack(t, streamRef.current)
      );
    }

    return peer;
  };

  // 📞 Start call
  const startCall = async () => {
    if (!selectedUser || !socket) return;

    const stream = await getMedia();
    if (!stream) return;

    setActiveCall({ user: selectedUser });

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

  // ✅ Accept call
  const acceptCall = async (callData) => {
    if (!callData || !socket) return;

    stopRingtone();
    setIncomingCall(null);

    const { from, caller, offer } = callData;

    const stream = await getMedia();
    if (!stream) return;

    setActiveCall({ user: caller });

    const peer = createPeer(from);
    peerRef.current = peer;

    await peer.setRemoteDescription(new RTCSessionDescription(offer));

    // Flush pending ICE
    pendingIce.current.forEach((c) =>
      peer.addIceCandidate(new RTCIceCandidate(c))
    );
    pendingIce.current = [];

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer-call", { to: from, answer });
  };

  // ❌ End call
  const endCall = () => {
    const toId = activeCall?.user?._id;
    if (toId && socket) socket.emit("call-ended", { to: toId });
    cleanup();
  };

  const cleanup = () => {
    stopRingtone();
    setActiveCall(null);
    setIncomingCall(null);

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (myVideo.current) myVideo.current.srcObject = null;
    if (userVideo.current) userVideo.current.srcObject = null;
  };

  // 🔌 Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onAnswered = async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        pendingIce.current.forEach((c) =>
          peerRef.current.addIceCandidate(new RTCIceCandidate(c))
        );
        pendingIce.current = [];
      }
    };

    const onIce = async ({ candidate }) => {
      try {
        if (peerRef.current?.remoteDescription) {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } else {
          pendingIce.current.push(candidate);
        }
      } catch (err) {
        console.error("ICE error:", err);
      }
    };

    const onEnd = () => cleanup();

    socket.on("call-answered", onAnswered);
    socket.on("ice-candidate", onIce);
    socket.on("call-ended", onEnd);
    socket.on("call-rejected", onEnd);

    return () => {
      socket.off("call-answered", onAnswered);
      socket.off("ice-candidate", onIce);
      socket.off("call-ended", onEnd);
      socket.off("call-rejected", onEnd);
    };
  }, [socket]);

  return (
    <div className="flex flex-col h-full relative">
      <IncomingCallPopup onAccept={acceptCall} />

      {!activeCall && selectedUser && (
        <>
          <div className="flex items-center gap-3 p-4 bg-[#232135]">
            <img
              src={selectedUser.profilePic || assets.avatar_icon}
              className="w-10 h-10 rounded-full"
            />
            <h3 className="text-white flex-1 truncate">
              {selectedUser.fullName}
            </h3>
            <button onClick={startCall} className="text-violet-400">
              <Video />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((msg, i) => {
              const mine = msg.senderId === authUser._id;
              return (
                <div
                  key={i}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 rounded-xl ${
                      mine ? "bg-violet-600" : "bg-[#2e2b3e]"
                    } text-white`}
                  >
                    {msg.text}
                    <div className="text-xs text-gray-400">
                      {formatMessageTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollEnd}></div>
          </div>

          <form onSubmit={handleSendMessage} className="p-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-white"
              placeholder="Type..."
            />
            <button className="bg-violet-600 px-4 rounded-xl text-white">
              Send
            </button>
          </form>
        </>
      )}

      {/* 🎥 Call UI */}
      {activeCall && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-40">
          <video ref={userVideo} autoPlay playsInline className="w-96 h-72" />
          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            className="w-40 h-32 mt-4"
          />

          <button
            onClick={endCall}
            className="mt-6 bg-red-500 p-3 rounded-full text-white"
          >
            <PhoneOff />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
