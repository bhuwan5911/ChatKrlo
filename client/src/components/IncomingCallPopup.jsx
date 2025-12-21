import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";

const IncomingCallPopup = () => {
  const { incomingCall, setIncomingCall, socket, setActiveCall } =
    useContext(AuthContext);

  if (!incomingCall) return null;

  const { caller, from } = incomingCall;

  const accept = () => {
    socket.emit("answer-call", { to: from });
    setActiveCall({ user: caller });
    setIncomingCall(null);
  };

  const reject = () => {
    socket.emit("reject-call", { to: from });
    setIncomingCall(null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center">
      <div className="bg-[#2e2b3e] p-6 rounded-xl text-white text-center space-y-4 w-72">
        <img
          src={caller?.profilePic || "https://avatar.iran.liara.run/public"}
          className="w-16 h-16 rounded-full mx-auto"
        />
        <p className="font-bold">{caller?.fullName}</p>
        <p>📹 Incoming Video Call</p>
        <div className="flex gap-4 justify-center">
          <button onClick={accept} className="bg-green-500 px-4 py-2 rounded">
            Accept
          </button>
          <button onClick={reject} className="bg-red-500 px-4 py-2 rounded">
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
