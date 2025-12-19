import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets.js';
import { formatMessageTime } from '../lib/utils.js';
import { ChatContext } from '../../context/ChatContext.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { Users, Info } from 'lucide-react';

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } =
    useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState('');

  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
  }, [selectedUser]);

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage({ text: input.trim() });
    setInput('');
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-white max-md:hidden">
        Select a chat to start
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">

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
            {(onlineUsers.includes(selectedUser._id) ||
              selectedUser.email === "ai@quickchat.com") && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#232135] rounded-full"></span>
            )}
          </div>
        )}

        <h3 className="text-white font-bold flex-1 truncate">
          {selectedUser.isGroup
            ? `${selectedUser.name} (${selectedUser.members?.length || 0})`
            : selectedUser.fullName}
        </h3>

        <Info className="text-gray-400" />
        <img
          src={assets.arrow_icon}
          onClick={() => setSelectedUser(null)}
          className="w-6 md:hidden invert cursor-pointer"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-[#1a1829]/30">
        {messages.map((msg, i) => {
          // ✅ Handle both string & populated object
          const senderId =
            typeof msg.senderId === "object"
              ? msg.senderId._id
              : msg.senderId;

          const mine = senderId === authUser._id;

          return (
            <div
              key={i}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2 rounded-2xl text-sm max-w-[70%] ${
                  mine
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-[#2e2b3e] text-white rounded-bl-sm"
                }`}
              >
                {msg.text}

                <div className="text-[10px] text-gray-400 mt-1 text-right">
                  {formatMessageTime(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={scrollEnd}></div>
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 flex gap-2 bg-[#232135]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-white outline-none"
          placeholder="Type message..."
        />
        <button className="bg-violet-600 px-4 rounded-xl text-white">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatContainer;
