import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { PlusCircle, MessageCircle, MessageSquareDot, Search, X } from "lucide-react";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { SecurityUtils } from "../../utils/Security.js";
import { Input } from "../ui/input";

// New Message Modal component
const NewMessageModal = ({ isOpen, onClose, onSelectFriend }) => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = await SecurityUtils.getCookie("idToken");
      if (!token) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/get-user-friends/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: token }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        // Filter out any friends with PENDING or BLOCKED status
        const activeFriends = (data.friends || []).filter(
          friend => friend.status === "ACCEPTED" || friend.status === "accepted"
        );
        setFriends(activeFriends);
      } else {
        throw new Error(data.message || "Failed to load friends");
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
      setError(error.message || "Failed to load friends");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter friends based on search term
  const filteredFriends = searchTerm.trim() === "" 
    ? friends 
    : friends.filter(friend => 
        friend.friend_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        friend.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New Message</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full h-8 w-8 p-0" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mb-4 relative">
          <Input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-zinc-700 border-zinc-600"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-zinc-700 border-t-purple-600" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <p>{error}</p>
            <Button className="mt-4" onClick={fetchFriends}>Retry</Button>
          </div>
        ) : filteredFriends.length > 0 ? (
          <div className="max-h-[60vh] overflow-y-auto">
            <ul className="space-y-2">
              {filteredFriends.map((friend) => (
                <li key={friend.friend_id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start py-2 px-3 hover:bg-zinc-700"
                    onClick={() => onSelectFriend({
                      user_id: friend.friend_id,
                      full_name: friend.friend_name,
                      profile_photo: friend.profile_photo,
                      email: friend.email
                    })}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={friend.profile_photo} alt={friend.friend_name} />
                      <AvatarFallback className="bg-purple-900/50">
                        {friend.friend_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium">{friend.friend_name}</p>
                      <p className="text-xs text-gray-400">{friend.username}</p>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : searchTerm.trim() !== "" ? (
          <div className="text-center py-8 text-gray-400">
            <p>No matching friends found</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No friends available to message</p>
            <p className="text-xs mt-2">Add friends to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Add null check for chat.name
export const DirectMessageItem = ({ chat, onOpenChat }) => {
  // Add safety check to prevent null/undefined errors
  if (!chat) {
    console.error("Invalid chat object:", chat);
    return null;
  }
  
  // Get initials safely with null checks
  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ")
      .map(n => n[0] || "")
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Ensure we have values for required properties
  const safeChat = {
    ...chat,
    name: chat.name || chat.full_name || "Unknown User",
    avatarSrc: chat.avatarSrc || chat.profile_photo || "/placeholder.svg?height=40&width=40",
    lastMessage: chat.lastMessage || "No messages yet",
    lastMessageTime: chat.lastMessageTime || "",
    id: chat.id || chat.user_id || Math.random().toString(),
    userId: chat.userId || chat.user_id || chat.id,
    unreadCount: chat.unreadCount || 0
  };

  return (
    <Button 
      variant="ghost" 
      className="w-full p-0 h-auto bg-zinc-800 hover:bg-zinc-700 rounded-lg overflow-hidden"
      onClick={() => onOpenChat(safeChat)}
    >
      <div className="w-full py-3 px-4 flex items-center">
        {/* LEFT: Avatar with online indicator */}
        <div className="relative flex-shrink-0 mr-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={safeChat.avatarSrc} alt={safeChat.name} />
            <AvatarFallback className="bg-purple-900/50 text-sm">
              {getInitials(safeChat.name)}
            </AvatarFallback>
          </Avatar>
          {safeChat.online && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-800 rounded-full"></span>
          )}
        </div>
        
        {/* MIDDLE: Name and message */}
        <div className="flex-1 min-w-0 self-center">
          <div className="flex items-center">
            <p className="font-medium truncate">{safeChat.name}</p>
            {safeChat.unreadCount > 0 && (
              <MessageSquareDot className="h-4 w-4 ml-2 text-purple-400 flex-shrink-0" />
            )}
          </div>
          {safeChat.isTyping ? (
            <p className="text-sm text-purple-400 font-medium">typing...</p>
          ) : (
            <p className="text-sm text-gray-400 truncate">{safeChat.lastMessage}</p>
          )}
        </div>
        
        {/* RIGHT: Time and unread count */}
        <div className="flex-shrink-0 ml-2 flex flex-col items-end justify-center">
          <span className="text-xs text-gray-400 mb-1">{safeChat.lastMessageTime}</span>
          {(safeChat.unreadCount > 0) && (
            <span className="bg-purple-600 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
              {safeChat.unreadCount > 9 ? "9+" : safeChat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Button>
  );
};

export default function DirectMessagesList({ directChats = [], onOpenChat }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleSelectFriend = (friendInfo) => {
    onOpenChat(friendInfo);
    setIsModalOpen(false);
  };

  // Ensure directChats is always an array
  const chats = Array.isArray(directChats) ? directChats : [];
  
  // Mock data for visual display purposes
  const demoChats = [
    {
      id: 1,
      name: "Alice Johnson",
      avatarSrc: "/placeholder.svg?height=40&width=40",
      lastMessage: "Thanks for paying!",
      lastMessageTime: "11:45 AM",
      unreadCount: 1,
      online: true,
      isTyping: false
    },
    {
      id: 2,
      name: "Bob Smith",
      avatarSrc: "/placeholder.svg?height=40&width=40",
      lastMessage: "I'll send you my part tomorrow",
      lastMessageTime: "Yesterday",
      unreadCount: 0,
      online: true,
      isTyping: true
    },
    {
      id: 3,
      name: "Charlie Brown",
      avatarSrc: "/placeholder.svg?height=40&width=40",
      lastMessage: "Did you see the bill?",
      lastMessageTime: "Monday",
      unreadCount: 0,
      online: false,
      isTyping: false
    },
    {
      id: 4,
      name: "Dana Davis",
      avatarSrc: "/placeholder.svg?height=40&width=40",
      lastMessage: "Let's split the rent 50/50",
      lastMessageTime: "Sunday",
      unreadCount: 0,
      online: false,
      isTyping: false
    },
    {
      id: 5,
      name: "Elijah Wilson",
      avatarSrc: "/placeholder.svg?height=40&width=40",
      lastMessage: "Movie tonight?",
      lastMessageTime: "Mar 22",
      unreadCount: 0,
      online: false,
      isTyping: false
    },
    {
      id: 6,
      name: "Fiona Green",
      avatarSrc: "/placeholder.svg?height=40&width=40",
      lastMessage: "I paid for dinner",
      lastMessageTime: "Mar 20",
      unreadCount: 2,
      online: true,
      isTyping: false
    },
  ];

  // Use the actual props in a real implementation
  const displayChats = chats.length > 0 ? chats : demoChats;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Direct Messages</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-purple-400 border-purple-400 hover:bg-purple-400/10"
          onClick={handleOpenModal}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
        {displayChats.length > 0 ? (
          <ul className="space-y-2">
            {displayChats.map((chat) => (
              <li key={chat?.id || Math.random().toString(36)}>
                <DirectMessageItem chat={chat} onOpenChat={onOpenChat} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 bg-zinc-800 rounded-lg">
            <div className="flex justify-center mb-3">
              <MessageCircle className="h-10 w-10 text-purple-400" />
            </div>
            <p className="text-gray-400 mb-3">No conversations yet</p>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleOpenModal}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Start a conversation
            </Button>
          </div>
        )}
      </div>
      
      <NewMessageModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSelectFriend={handleSelectFriend}
      />
    </div>
  );
}

// Add PropTypes for the new component
NewMessageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectFriend: PropTypes.func.isRequired
};

DirectMessageItem.propTypes = {
  chat: PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]).isRequired,
    name: PropTypes.string.isRequired,
    avatarSrc: PropTypes.string,
    lastMessage: PropTypes.string,
    lastMessageTime: PropTypes.string,
    unreadCount: PropTypes.number,
    online: PropTypes.bool,
    isTyping: PropTypes.bool
  }).isRequired,
  onOpenChat: PropTypes.func.isRequired
};

DirectMessagesList.propTypes = {
  directChats: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]).isRequired,
      name: PropTypes.string.isRequired,
      avatarSrc: PropTypes.string,
      lastMessage: PropTypes.string,
      lastMessageTime: PropTypes.string,
      unreadCount: PropTypes.number,
      online: PropTypes.bool,
      isTyping: PropTypes.bool
    })
  ).isRequired,
  onOpenChat: PropTypes.func.isRequired
};