import React, { useContext } from "react";
import assets from "../assets/assets.js";
import { AuthContext } from "../../context/AuthContext.jsx";

const IncomingCallPopup = ({ onAccept }) => {
  const { incomingCall, setIncomingCall, socket, stopRingtone } =
    useContext(AuthContext);

  if (!incomingCall) return null;

  const accept = () => {
    stopRingtone();
    setIncomingCall(null);           // ✅ CLOSE POPUP FIRST
    if (onAccept) onAccept(incomingCall);
  };

  const reject = () => {
    socket.emit("reject-call", { to: incomingCall.from });
    stopRingtone();
    setIncomingCall(null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center">
      <div className="bg-[#2e2b3e] p-6 rounded-xl text-white text-center space-y-4 w-80">
        <img
          src={incomingCall.caller?.profilePic || assets.avatar_icon}
          className="w-20 h-20 rounded-full mx-auto"
        />
        <p className="font-bold text-lg">
          {incomingCall.caller?.fullName || "Unknown"}
        </p>
        <p>📞 Incoming video call</p>

        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={accept}
            className="bg-green-500 px-5 py-2 rounded-lg"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={reject}
            className="bg-red-500 px-5 py-2 rounded-lg"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
