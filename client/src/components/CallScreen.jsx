import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";

const CallScreen = () => {
  const { incomingCall, activeCall } = useContext(AuthContext);

  // caller info priority: active call > incoming
  const caller = activeCall?.user || incomingCall?.caller;

  if (!caller) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[150]">
      <div className="bg-[#2e2b3e] p-6 rounded-xl text-white text-center w-80">
        <img
          src={caller.profilePic || "https://avatar.iran.liara.run/public"}
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <h2 className="text-xl font-bold mb-2">
          {caller.fullName}
        </h2>
        <p className="text-gray-300">
          {activeCall ? "In call..." : "Calling..."}
        </p>
      </div>
    </div>
  );
};

export default CallScreen;
