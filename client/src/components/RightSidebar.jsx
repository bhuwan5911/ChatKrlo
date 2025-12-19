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

  const { authUser } = useContext(AuthContext);

  if (!selectedUser || !selectedUser.isGroup) return null;

  // ✅ Strong admin check
  const adminId =
    typeof selectedUser.admin === "object"
      ? selectedUser.admin?._id
      : selectedUser.admin;

  const isAdmin = adminId === authUser._id;

  return (
    <div className="bg-[#8185B2]/10 text-white w-full flex flex-col h-full overflow-hidden max-md:hidden">

      {/* Header */}
      <div className='pt-10 flex flex-col items-center gap-2 text-sm'>
        <img src={assets.avatar_icon} className='w-20 h-20 rounded-full' />
        <h2 className='text-xl font-semibold'>{selectedUser.name}</h2>
        <p className='text-gray-400'>
          {selectedUser.members.length} members
        </p>
      </div>

      {/* Members */}
      <div className="px-5 mt-6 flex-1 overflow-y-auto custom-scrollbar">
        <p className="text-xs mb-2">Members</p>

        {selectedUser.members.map((m) => (
          <div key={m._id} className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img
                src={m.profilePic || assets.avatar_icon}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm">{m.fullName}</span>
            </div>

            {isAdmin && m._id !== authUser._id && (
              <button
                onClick={() =>
                  removeGroupMember(selectedUser._id, m._id)
                }
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
            <p className="text-xs mt-6 mb-2">Add Members</p>

            {users
              .filter(
                u => !selectedUser.members.find(m => m._id === u._id)
              )
              .map(u => (
                <div key={u._id} className="flex items-center justify-between mb-3">
                  <span className="text-sm">{u.fullName}</span>
                  <button
                    onClick={() =>
                      addGroupMember(selectedUser._id, u._id)
                    }
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
};

export default RightSidebar;
