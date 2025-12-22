import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import { ChatContext } from "../../context/ChatContext";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      {/* Main container */}
      <div className="backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-[95vh] w-[95vw] max-w-7xl">
        
        {/* 📱 Mobile view */}
        <div className="md:hidden h-full">
          {!selectedUser ? <Sidebar /> : <ChatContainer />}
        </div>

        {/* 🖥 Desktop view */}
        <div className="hidden md:grid h-full grid-cols-[280px_1fr_280px] lg:grid-cols-[320px_1fr_320px]">
          
          {/* Left Sidebar (with scroll) */}
          <div className="border-r border-white/10 flex flex-col overflow-y-auto">
            <Sidebar />
          </div>

          {/* Chat */}
          <div className="min-w-0 flex flex-col overflow-hidden">
            <ChatContainer />
          </div>

          {/* Right Sidebar */}
          <div className="border-l border-white/10 flex flex-col overflow-y-auto">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
