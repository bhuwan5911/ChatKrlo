import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets.js";
import { formatMessageTime } from "../lib/utils.js";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import IncomingCallPopup from "./IncomingCallPopup.jsx";
import { Video, PhoneOff, Mic, MicOff, VideoOff } from "lucide-react";

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
  const remoteAudio = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const scrollEnd = useRef(null);
  const pendingIce = useRef([]);

  const [input, setInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

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
      alert("Camera or microphone permission denied");
      return null;
    }
  };

  const createPeer = (to) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) socket.emit("ice-candidate", { to, candidate: e.candidate });
    };

    peer.ontrack = (e) => {
      if (userVideo.current) userVideo.current.srcObject = e.streams[0];
      if (remoteAudio.current) remoteAudio.current.srcObject = e.streams[0];
    };

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) =>
        peer.addTrack(t, streamRef.current)
      );
    }

    pendingIce.current.forEach((c) =>
      peer.addIceCandidate(new RTCIceCandidate(c))
    );
    pendingIce.current = [];

    return peer;
  };

  const startCall = async () => {
    if (!selectedUser) return;
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

  const acceptCall = async (callData) => {
    stopRingtone();
    setIncomingCall(null);

    const { from, caller, offer } = callData;

    const stream = await getMedia();
    if (!stream) return;

    setActiveCall({ user: caller });

    const peer = createPeer(from);
    peerRef.current = peer;

    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer-call", { to: from, answer });
  };

  const toggleMute = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoOff(!track.enabled);
    }
  };

  const endCall = () => {
    const toId = activeCall?.user?._id;
    if (toId) socket.emit("call-ended", { to: toId });
    cleanup();
  };

  const cleanup = () => {
    stopRingtone();
    setActiveCall(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoOff(false);

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
    if (remoteAudio.current) remoteAudio.current.srcObject = null;
  };

  useEffect(() => {
    if (!socket) return;

    const onAnswered = async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    };

    const onIce = async ({ candidate }) => {
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch {}
      } else pendingIce.current.push(candidate);
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

  const isOnline =
    selectedUser &&
    (onlineUsers.includes(selectedUser._id) ||
      selectedUser.email === "ai@quickchat.com");

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 max-w-full overflow-hidden relative w-full">
      <IncomingCallPopup onAccept={acceptCall} />

      {selectedUser && !activeCall && (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 p-4 bg-[#232135] border-b border-white/10 shrink-0">
            <img
              src={selectedUser.profilePic || assets.avatar_icon}
              className="w-10 h-10 rounded-full object-cover"
            />
            <h3 className="text-white font-semibold flex-1 truncate">
              {selectedUser.fullName}
            </h3>

            {isOnline && (
              <button
                onClick={startCall}
                className="p-2 hover:bg-white/10 rounded-full text-violet-400"
              >
                <Video size={20} />
              </button>
            )}

            <img
              src={assets.arrow_icon}
              onClick={() => setSelectedUser(null)}
              className="w-6 md:hidden invert cursor-pointer"
            />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 min-w-0">
            {messages.map((msg, i) => {
              const mine = msg.senderId === authUser._id;
              return (
                <div
                  key={i}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm max-w-[75%] break-words ${
                      mine ? "bg-violet-600" : "bg-[#2e2b3e]"
                    } text-white`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {msg.text}
                    </div>
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
            className="p-4 flex gap-2 bg-[#232135] shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 min-w-0 bg-white/10 rounded-xl px-4 py-2 text-white outline-none"
              placeholder="Type a message..."
            />
            <button className="bg-violet-600 px-4 rounded-xl text-white">
              Send
            </button>
          </form>
        </>
      )}

      {/* 🎥 Call UI */}
      {activeCall && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden">
            <video
              ref={userVideo}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <audio ref={remoteAudio} autoPlay />

            <video
              ref={myVideo}
              autoPlay
              muted
              playsInline
              className="hidden"
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full ${
                isMuted ? "bg-red-500" : "bg-gray-700"
              } text-white`}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full ${
                isVideoOff ? "bg-red-500" : "bg-gray-700"
              } text-white`}
            >
              {isVideoOff ? <VideoOff /> : <Video />}
            </button>

            <button
              onClick={endCall}
              className="p-4 rounded-full bg-red-500 text-white"
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
