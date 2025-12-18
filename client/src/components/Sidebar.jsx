import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Context imports (as per your paths)
import { AuthContext } from '../../context/AuthContext.jsx';
import { ChatContext } from '../../context/ChatContext.jsx';
// Icons ke liye hum Lucide React use kar sakte hain ya aapke assets
import { Search, Menu, User, LogOut, Loader2 } from 'lucide-react';

const Sidebar = () => {
    const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useContext(ChatContext);
    const { logout, onlineUsers } = useContext(AuthContext);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // Users filtering logic
    const filteredUsers = (users && users.length > 0) 
        ? users.filter((user) => user.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    useEffect(() => {
        getUsers();
    }, [getUsers]); 

    // Loading State
    if (isUsersLoading) {
        return (
            <div className="h-full w-full bg-[#232135] flex items-center justify-center">
                <Loader2 className="animate-spin text-violet-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className={`bg-[#232135] border-r border-white/5 h-full w-full md:w-80 flex flex-col text-white transition-all duration-300 ${selectedUser ? "max-md:hidden" : 'block'}`}>
            
            {/* Sidebar Header */}
            <div className='p-6 border-b border-white/5'>
                <div className='flex justify-between items-center mb-6'>
                    <div className='flex items-center gap-3'>
                        <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-900/20">
                            <span className="font-bold text-xl">Q</span>
                        </div>
                        <h2 className='text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent'>
                            QuickChat
                        </h2>
                    </div>
                    
                    {/* Settings Dropdown */}
                    <div className="relative group">
                        <button className="p-2 hover:bg-white/5 rounded-full transition-all active:scale-95">
                            <Menu className='w-5 h-5 text-gray-400 group-hover:text-white' />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className='absolute top-full right-0 mt-2 z-50 w-48 p-1.5 rounded-xl bg-[#2e2b3e] border border-white/10 shadow-2xl scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 origin-top-right'>
                            <button 
                                onClick={() => navigate('/profile')} 
                                className='w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm transition-colors'
                            >
                                <User className="w-4 h-4" /> My Profile
                            </button>
                            <div className="h-[1px] bg-white/5 my-1" />
                            <button 
                                onClick={logout} 
                                className='w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-500/10 text-red-400 rounded-lg text-sm transition-colors font-medium'
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className='relative group'>
                    <input 
                        type="text" 
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-gray-500'
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                </div>
            </div>

            {/* User List Container */}
            <div className='flex-1 overflow-y-auto custom-scrollbar scroll-smooth'>
                <div className='p-3 space-y-1'>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => {
                            // AI Bot special logic + Online check
                            const isOnline = onlineUsers.includes(user._id) || user.email === "ai@quickchat.com";
                            const isSelected = selectedUser?._id === user._id;

                            return (
                                <button 
                                    key={user._id} 
                                    onClick={() => setSelectedUser(user)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative ${
                                        isSelected 
                                        ? 'bg-violet-600 shadow-lg shadow-violet-900/20' 
                                        : 'hover:bg-white/5 active:bg-white/10'
                                    }`}
                                >
                                    {/* Avatar with Status Indicator */}
                                    <div className='relative flex-shrink-0'>
                                        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-transform duration-200 group-hover:scale-105 ${isSelected ? 'border-white/30' : 'border-transparent'}`}>
                                            <img 
                                                src={user.profilePic || "https://avatar.iran.liara.run/public"} 
                                                alt={user.fullName} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {isOnline && (
                                            <span className='absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] border-[#232135] rounded-full shadow-lg'></span>
                                        )}
                                    </div>

                                    {/* Name and Status Text */}
                                    <div className='flex-1 text-left min-w-0'>
                                        <p className={`font-semibold truncate text-[15px] ${isSelected ? 'text-white' : 'text-gray-100'}`}>
                                            {user.fullName}
                                            {user.email === "ai@quickchat.com" && (
                                                <span className="ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium uppercase tracking-wider">AI</span>
                                            )}
                                        </p>
                                        <p className={`text-xs truncate transition-colors ${isSelected ? 'text-violet-100' : 'text-gray-400'}`}>
                                            {isOnline ? 'Online' : 'Offline'}
                                        </p>
                                    </div>

                                    {/* Selected Indicator Bar */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-lg" />
                                    )}
                                </button>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                                <Search className="w-6 h-6 text-gray-600" />
                            </div>
                            <p className="text-gray-400 text-sm font-medium">No users found</p>
                            <p className="text-gray-600 text-xs mt-1">Try a different name</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Info (Optional - Current User Info) */}
            <div className="p-4 border-t border-white/5 bg-[#1a1829]/50">
                 <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                     {onlineUsers.length} Users Online
                 </div>
            </div>
        </div>
    );
};

export default Sidebar;