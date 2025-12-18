import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]); // New state for groups
    const [selectedUser, setSelectedUser] = useState(null); 
    const [unseenMessages, setUnseenMessages] = useState({});
    const [isUsersLoading, setIsUsersLoading] = useState(false);

    const { socket, axios, authUser } = useContext(AuthContext);

    // ✅ Load all users for sidebar
    const getUsers = async () => {
        setIsUsersLoading(true);
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsUsersLoading(false);
        }
    };

    // ✅ Load all groups I belong to
    const getGroups = async () => {
        try {
            const { data } = await axios.get("/api/groups/my-groups");
            if (data.success) {
                // Add a flag to distinguish groups from users in the UI
                const groupsWithFlag = data.groups.map(g => ({ ...g, isGroup: true }));
                setGroups(groupsWithFlag);
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    };

    // ✅ Create a new group
    const createGroup = async (groupData) => {
        try {
            const { data } = await axios.post("/api/groups/create", groupData);
            if (data.success) {
                const newGroup = { ...data.group, isGroup: true };
                setGroups((prev) => [...prev, newGroup]);
                toast.success("Group created!");
                return true;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create group");
            return false;
        }
    };

    // ✅ Smart Get Messages (Works for both User and Group)
    const getMessages = async (id) => {
        try {
            const endpoint = selectedUser?.isGroup 
                ? `/api/groups/messages/${id}` 
                : `/api/messages/${id}`;
            
            const { data } = await axios.get(endpoint);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error("Could not load messages");
        }
    };

    // ✅ Smart Send Message
    const sendMessage = async (messageData) => {
        try {
            const body = selectedUser?.isGroup 
                ? { ...messageData, groupId: selectedUser._id } 
                : messageData;

            const endpoint = selectedUser?.isGroup 
                ? `/api/messages/send/group` // You can use a dummy ID or update route
                : `/api/messages/send/${selectedUser._id}`;

            const { data } = await axios.post(endpoint, body);

            if (data.success) {
                // For groups, the socket handles the UI update via the listener
                // For 1v1, we update manually to feel faster
                if (!selectedUser?.isGroup) {
                    setMessages((prev) => [...prev, data.newMessage]);
                }
            }
        } catch (error) {
            toast.error("Message failed to send");
        }
    };

    // 🔥 HANDLE SOCKET ROOMS (Join/Leave)
    useEffect(() => {
        if (!socket || !selectedUser) return;

        if (selectedUser.isGroup) {
            socket.emit("joinGroup", selectedUser._id);
            console.log("Joined Room:", selectedUser.name);
        }

        return () => {
            if (selectedUser?.isGroup) {
                socket.emit("leaveGroup", selectedUser._id);
            }
        };
    }, [socket, selectedUser]);

    // 🔥 REAL-TIME SOCKET LISTENER
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            if (!selectedUser) return;

            const isCurrentGroup = selectedUser.isGroup && newMessage.groupId === selectedUser._id;
            const isCurrentUser = !selectedUser.isGroup && newMessage.senderId === selectedUser._id;

            if (isCurrentGroup || isCurrentUser) {
                // Don't add my own message twice if I'm the sender in 1v1
                if (newMessage.senderId === authUser._id && !selectedUser.isGroup) return;
                
                setMessages((prev) => [...prev, newMessage]);
                
                if (!selectedUser.isGroup) {
                    axios.put(`/api/messages/mark/${newMessage._id}`);
                }
            } else {
                // Handle notifications for other chats
                const id = newMessage.groupId || newMessage.senderId;
                setUnseenMessages((prev) => ({
                    ...prev,
                    [id]: (prev[id] || 0) + 1,
                }));
            }
        };

        socket.on("newMessage", handleNewMessage);
        return () => socket.off("newMessage");
    }, [socket, selectedUser, authUser]);

    const value = {
        messages,
        users,
        groups,
        selectedUser,
        isUsersLoading,
        getUsers,
        getGroups,
        createGroup,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        setMessages,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};