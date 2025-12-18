import React, { useState, useContext } from 'react';
import { ChatContext } from '../../context/ChatContext';

const CreateGroupModal = ({ closeModal }) => {
  const { users, createGroup } = useContext(ChatContext);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createGroup({ name: groupName, members: selectedUsers });
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2e2b3e] w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Create New Group</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Group Name"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-violet-500"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />

          <p className="text-sm text-gray-400">Select Members:</p>
          <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
            {users.map(user => (
              <label key={user._id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => toggleUserSelection(user._id)}
                  className="w-4 h-4 accent-violet-600"
                />
                <span className="text-sm text-white">{user.fullName}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={closeModal} className="flex-1 p-3 rounded-xl bg-white/5 text-white hover:bg-white/10">Cancel</button>
            <button type="submit" className="flex-1 p-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;