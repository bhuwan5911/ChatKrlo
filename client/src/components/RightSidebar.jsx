import React, { useContext } from 'react';
import assets from '../assets/assets.js';
import { ChatContext } from '../../context/ChatContext.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';

const RightSidebar = () => {
  const {
    selectedUser,
    users,
    addGroupMember,
    removeGroupMember
  } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  // Don't show if no user selected
  if (!selectedUser) return null;

  // Check if user is online
  const isOnline = onlineUsers.includes(selectedUser._id) || 
                   selectedUser.email === "ai@quickchat.com";

  // ✅ GROUP CHAT VIEW
  if (selectedUser.isGroup) {
    const adminId =
      typeof selectedUser.admin === "object"
        ? selectedUser.admin?._id
        : selectedUser.admin;

    const isAdmin = adminId === authUser._id;

    return (
      <div className="bg-[#8185B2]/10 text-white w-full flex flex-col h-full overflow-hidden">
        {/* Group Header */}
        <div className='pt-10 flex flex-col items-center gap-2 text-sm'>
          <img src={assets.avatar_icon} className='w-20 h-20 rounded-full' alt="Group" />
          <h2 className='text-xl font-semibold'>{selectedUser.name}</h2>
          <p className='text-gray-400'>
            {selectedUser.members.length} members
          </p>
        </div>

        {/* Members */}
        <div className="px-5 mt-6 flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-xs text-gray-400 mb-3">Members</p>

          {selectedUser.members.map((m) => (
            <div key={m._id} className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <img
                  src={m.profilePic || assets.avatar_icon}
                  className="w-8 h-8 rounded-full object-cover"
                  alt={m.fullName}
                />
                <span className="text-sm">{m.fullName}</span>
              </div>

              {isAdmin && m._id !== authUser._id && (
                <button
                  onClick={() => removeGroupMember(selectedUser._id, m._id)}
                  className="text-red-400 text-xs hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          {/* Add members (admin only) */}
          {isAdmin && (
            <>
              <p className="text-xs text-gray-400 mt-6 mb-3">Add Members</p>

              {users
                .filter(u => !selectedUser.members.find(m => m._id === u._id))
                .map(u => (
                  <div key={u._id} className="flex items-center justify-between mb-3">
                    <span className="text-sm">{u.fullName}</span>
                    <button
                      onClick={() => addGroupMember(selectedUser._id, u._id)}
                      className="text-green-400 text-xs hover:underline"
                    >
                      Add
                    </button>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // ✅ INDIVIDUAL CHAT VIEW
  return (
    <div className="bg-[#8185B2]/10 text-white w-full flex flex-col h-full overflow-hidden">
      {/* User Header */}
      <div className='pt-10 flex flex-col items-center gap-3'>
        <div className="relative">
          <img 
            src={selectedUser.profilePic || assets.avatar_icon} 
            className='w-24 h-24 rounded-full object-cover border-4 border-violet-500' 
            alt={selectedUser.fullName}
          />
          {isOnline && (
            <span className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-[#8185B2]/10 rounded-full"></span>
          )}
        </div>
        
        <h2 className='text-xl font-semibold'>{selectedUser.fullName}</h2>
        <p className='text-sm text-gray-400'>
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>

      {/* User Info */}
      <div className="px-6 mt-8 flex-1 overflow-y-auto space-y-6">
        <div>
          <p className="text-xs text-gray-400 mb-2">Email</p>
          <p className="text-sm">{selectedUser.email}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2">Username</p>
          <p className="text-sm">@{selectedUser.fullName.toLowerCase().replace(/\s+/g, '')}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2">Status</p>
          <p className="text-sm text-violet-400">
            {isOnline ? '🟢 Available' : '⚫ Away'}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2">About</p>
          <p className="text-sm text-gray-300">
            Hey there! I'm using QuickChat.
          </p>
        </div>

        {/* Media section (optional) */}
        <div>
          <p className="text-xs text-gray-400 mb-3">Shared Media</p>
          <div className="grid grid-cols-3 gap-2">
            {/* Placeholder for shared media */}
            <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📷</span>
            </div>
            <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📹</span>
            </div>
            <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;