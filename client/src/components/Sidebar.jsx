import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ChatContext } from '../../context/ChatContext.jsx';
import {
  Search,
  Menu,
  User,
  LogOut,
  Loader2,
  Users,
  Plus,
  Trash2,
  X
} from 'lucide-react';

const Sidebar = () => {
  const {
    getUsers,
    users,
    groups,
    getGroups,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    createGroup,
    deleteGroup,
    deletePrivateChat
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // ✅ PIN AI BOT ON TOP
  const filteredUsers =
    users
      ?.filter(u =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const isBotA = a.email?.toLowerCase() === "ai@quickchat.com";
        const isBotB = b.email?.toLowerCase() === "ai@quickchat.com";
        if (isBotA) return -1;
        if (isBotB) return 1;
        return 0;
      }) || [];

  const filteredGroups =
    groups?.filter(g =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName || selectedMembers.length === 0) return;

    const ok = await createGroup({
      name: groupName,
      members: selectedMembers,
    });

    if (ok) {
      setIsModalOpen(false);
      setGroupName("");
      setSelectedMembers([]);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    const confirm = window.confirm(
      selectedUser.isGroup
        ? "Are you sure you want to delete this group?"
        : "Are you sure you want to delete this chat?"
    );

    if (!confirm) return;

    try {
      if (selectedUser.isGroup) {
        await deleteGroup(selectedUser._id);
      } else {
        await deletePrivateChat(selectedUser._id);
      }
      setSelectedUser(null);
      setMenuOpen(false);
    } catch {
      alert("Delete failed");
    }
  };

  if (isUsersLoading) {
    return (
      <div className="h-full w-full bg-[#232135] flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className={`bg-[#232135] border-r border-white/5 h-full w-full md:w-80 
      flex flex-col min-h-0 text-white transition-all duration-300 
      ${selectedUser ? "max-md:hidden" : 'block'}`}>

      {/* Header */}
      <div className='p-6 border-b border-white/5'>
        <div className='flex justify-between items-center mb-6 relative'>
          <div className='flex items-center gap-3'>
            <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center font-bold text-xl">
              Q
            </div>
            <h2 className='text-xl font-bold'>QuickChat</h2>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 hover:bg-white/10 rounded-full text-violet-400"
            >
              <Plus className='w-5 h-5' />
            </button>

            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <Menu className='w-5 h-5 text-gray-400' />
            </button>

            {menuOpen && (
              <div className='absolute top-full right-0 mt-2 z-50 w-48 p-2 rounded-xl 
                bg-[#2e2b3e] border border-white/10 shadow-2xl'>
                
                <button
                  onClick={() => navigate('/profile')}
                  className='w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg text-sm'
                >
                  <User className="w-4 h-4" /> My Profile
                </button>

                {selectedUser && (
                  <button
                    onClick={handleDelete}
                    className='w-full flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 
                    text-red-400 rounded-lg text-sm'
                  >
                    <Trash2 className="w-4 h-4" />
                    {selectedUser.isGroup ? "Delete Group" : "Delete Chat"}
                  </button>
                )}

                <div className="h-[1px] bg-white/10 my-1" />

                <button
                  onClick={logout}
                  className='w-full flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 
                  text-red-400 rounded-lg text-sm'
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className='relative'>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full bg-white/5 border border-white/10 rounded-xl 
            py-2.5 pl-10 pr-4 text-sm text-white outline-none'
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Scroll */}
      <div className='flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-1'>
        {filteredGroups.length > 0 && (
          <p className='text-[10px] font-bold text-gray-500 uppercase px-3 py-2'>Groups</p>
        )}

        {filteredGroups.map(group => (
          <button
            key={group._id}
            onClick={() => setSelectedUser(group)}
            className='w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5'
          >
            <div className='w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center'>
              <Users className="text-violet-400 w-6 h-6" />
            </div>
            <div className='text-left'>
              <p className="font-semibold">{group.name}</p>
              <p className="text-xs text-gray-400">Group Chat</p>
            </div>
          </button>
        ))}

        <p className='text-[10px] font-bold text-gray-500 uppercase px-3 py-2 mt-4'>
          Direct Messages
        </p>

        {filteredUsers.map(user => {
          const isBot = user.email?.toLowerCase().trim() === "ai@quickchat.com";
          const isOnline = isBot || onlineUsers.includes(user._id);

          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className='w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5'
            >
              <div className='relative flex-shrink-0'>
                <img
                  src={user.profilePic || "https://avatar.iran.liara.run/public"}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
                {isOnline && (
                  <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 
                  border-2 border-[#232135] rounded-full'></span>
                )}
              </div>
              <div className='text-left min-w-0'>
                <p className="font-semibold truncate">
                  {user.fullName} {isBot && "🤖"}
                </p>
                <p className="text-xs text-gray-400">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center 
          bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#2e2b3e] w-full max-w-md rounded-2xl border 
            border-white/10 shadow-2xl">

            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-lg">Create New Group</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-4 flex flex-col gap-3">
              <input
                type="text"
                placeholder="Group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="bg-white/10 p-3 rounded text-white outline-none"
              />

              <div className="max-h-48 overflow-y-auto space-y-1">
                {users.map(u => (
                  <div
                    key={u._id}
                    onClick={() => toggleMember(u._id)}
                    className={`p-2 rounded cursor-pointer ${
                      selectedMembers.includes(u._id)
                        ? "bg-violet-600"
                        : "hover:bg-white/10"
                    }`}
                  >
                    {u.fullName}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="bg-violet-600 py-3 rounded-xl font-bold"
              >
                Create Group Chat
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
