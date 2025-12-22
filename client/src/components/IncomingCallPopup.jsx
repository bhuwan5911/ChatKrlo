import React, { useContext, useEffect, useRef } from "react";
import assets from "../assets/assets.js";
import { AuthContext } from "../../context/AuthContext.jsx";

const IncomingCallPopup = ({ onAccept = () => {} }) => {
  const {
    incomingCall,
    activeCall,
    setIncomingCall,
    socket,
    stopRingtone,
    playRingtone,
  } = useContext(AuthContext);

  const hasPlayed = useRef(false);

  useEffect(() => {
    if (incomingCall && !activeCall && !hasPlayed.current) {
      playRingtone();
      hasPlayed.current = true;
    }
    if (!incomingCall) hasPlayed.current = false;
  }, [incomingCall, activeCall, playRingtone]);

  if (!incomingCall || activeCall) return null;

  const handleAccept = async () => {
    console.log("Accept clicked");

    stopRingtone();
    setIncomingCall(null);   // ✅ CLOSE POPUP ALWAYS
    await onAccept(incomingCall); // try to start call
  };

  const handleReject = () => {
    if (socket && incomingCall?.from) {
      socket.emit("reject-call", { to: incomingCall.from });
    }
    stopRingtone();
    setIncomingCall(null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center">
      <div className="bg-[#2e2b3e] p-8 rounded-xl text-white text-center space-y-4 w-80">
        <img
          src={incomingCall.caller?.profilePic || assets.avatar_icon}
          className="w-24 h-24 rounded-full mx-auto"
          alt="Caller"
        />
        <p className="font-bold text-xl">
          {incomingCall.caller?.fullName || "Unknown"}
        </p>
        <p className="text-violet-400 text-sm">Incoming video call</p>

        <div className="flex gap-4 justify-center mt-6">
          <button
            type="button"
            onClick={handleAccept}
            className="bg-green-500 px-6 py-3 rounded-lg"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="bg-red-500 px-6 py-3 rounded-lg"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
