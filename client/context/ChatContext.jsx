import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const { socket, axios, authUser } = useContext(AuthContext);

  // ✅ Users
  const getUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) setUsers(data.users);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsUsersLoading(false);
    }
  }, [axios]);

  // ✅ Groups
  const getGroups = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/groups/my-groups");
      if (data.success) {
        setGroups(data.groups.map(g => ({ ...g, isGroup: true })));
      }
    } catch {
      toast.error("Failed to load groups");
    }
  }, [axios]);

  // ✅ Messages
  const getMessages = async (id) => {
    try {
      const endpoint = selectedUser?.isGroup
        ? `/api/groups/messages/${id}`
        : `/api/messages/${id}`;

      const { data } = await axios.get(endpoint);
      if (data.success) setMessages(data.messages);
    } catch {
      toast.error("Could not load messages");
    }
  };

  // ✅ Send
  const sendMessage = async (messageData) => {
    if (!selectedUser) return;

    try {
      const body = selectedUser.isGroup
        ? { ...messageData, groupId: selectedUser._id }
        : messageData;

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        body
      );

      if (data.success) {
        setMessages(prev => [...prev, data.newMessage]);
      }
    } catch {
      toast.error("Message failed");
    }
  };

  // ✅ Create group
  const createGroup = async (groupData) => {
    try {
      const { data } = await axios.post("/api/groups/create", groupData);
      if (data.success) {
        setGroups(prev => [...prev, { ...data.group, isGroup: true }]);
        toast.success("Group created");
        return true;
      }
    } catch {
      toast.error("Create group failed");
    }
    return false;
  };

  // ✅ Add member
  const addGroupMember = async (groupId, userId) => {
    try {
      const { data } = await axios.post("/api/groups/add-member", { groupId, userId });
      if (data.success) {
        const updated = { ...data.group, isGroup: true };
        setSelectedUser(updated);
        setGroups(prev => prev.map(g => g._id === groupId ? updated : g));
        toast.success("Member added");
      }
    } catch {
      toast.error("Add member failed");
    }
  };

  // ✅ Remove member
  const removeGroupMember = async (groupId, userId) => {
    try {
      const { data } = await axios.post("/api/groups/remove-member", { groupId, userId });
      if (data.success) {
        const updated = { ...data.group, isGroup: true };
        setSelectedUser(updated);
        setGroups(prev => prev.map(g => g._id === groupId ? updated : g));
        toast.success("Member removed");
      }
    } catch {
      toast.error("Remove member failed");
    }
  };

  // ✅ Delete group
  const deleteGroup = async (groupId) => {
    try {
      const { data } = await axios.delete(`/api/groups/${groupId}`);
      if (data.success) {
        setGroups(prev => prev.filter(g => g._id !== groupId));
        setSelectedUser(null);
        toast.success("Group deleted");
      }
    } catch {
      toast.error("Delete group failed");
    }
  };

  // ✅ Clear private chat
  const clearPrivateChat = async (userId) => {
    try {
      const { data } = await axios.delete(`/api/messages/clear/${userId}`);
      if (data.success) {
        setMessages([]);
        toast.success("Chat cleared");
      }
    } catch {
      toast.error("Clear chat failed");
    }
  };

  const deletePrivateChat = clearPrivateChat;

  // ✅ Socket
  useEffect(() => {
    if (!socket || !authUser) return;

    const handleNewMessage = (newMessage) => {
      if (!selectedUser) return;

      const isGroup =
        selectedUser.isGroup && newMessage.groupId === selectedUser._id;

      const isPrivate =
        !selectedUser.isGroup &&
        (newMessage.senderId === selectedUser._id ||
          newMessage.receiverId === selectedUser._id);

      const isFromMe = newMessage.senderId === authUser._id;

      if ((isGroup || isPrivate) && !isFromMe) {
        setMessages(prev => [...prev, newMessage]);
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, selectedUser, authUser]);

  return (
    <ChatContext.Provider value={{
      messages,
      users,
      groups,
      selectedUser,
      isUsersLoading,
      getUsers,
      getGroups,
      getMessages,
      sendMessage,
      setSelectedUser,
      setMessages,
      createGroup,
      addGroupMember,
      removeGroupMember,
      deleteGroup,
      clearPrivateChat,
      deletePrivateChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
