import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Send, Paperclip, Smile, ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { SecurityUtils } from "../../utils/Security.js";
import { cn } from "../../lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import EventSourceService from './EventSource.js';
  
// Format message timestamp for display
const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, "h:mm a")}`;
  } else {
    return format(date, "MMM d, h:mm a");
  }
};

// Format date for dividers
const formatDateDivider = (timestamp) => {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "MMMM d, yyyy");
  }
};

// Message bubble component
const MessageBubble = ({ message, isOwn }) => {
  const { content, status } = message;
  const displayTimestamp = message.timestamp || message.created_at;
  
  return (
    <div className={cn("flex mb-4", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && (
        <div className="flex-shrink-0 mr-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.sender_avatar || message.senderAvatar} />
            <AvatarFallback className="bg-purple-900/50 text-sm">
              {(message.sender_name || message.senderName)?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className="max-w-[75%]">
        <div className={cn(
          "px-4 py-2 rounded-2xl break-words",
          isOwn 
            ? "bg-purple-600 text-white rounded-br-none" 
            : "bg-zinc-700 text-gray-100 rounded-bl-none"
        )}>
          <p className="text-sm">{content}</p>
        </div>
        <div className={cn(
          "flex items-center mt-1 text-xs text-gray-400",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <span>{formatMessageTime(displayTimestamp)}</span>
          
          {isOwn && (
            <span class="ml-2">
              {status === "SENDING" && "●"}
              {status === "ERROR" && "⚠️"}
              {status === "SENT" && "✓"}
            </span>
          )}
        </div>
      </div>
      
      {isOwn && (
        <div className="flex-shrink-0 ml-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.sender_avatar || message.senderAvatar} />
            <AvatarFallback className="bg-purple-900/50 text-sm">
              {(message.sender_name || message.senderName)?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
};

// Loading spinner component
const LoadingSpinner = ({ className, size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };
  
  return (
    <div className={cn("flex justify-center py-4", className)}>
      <div className={cn(
        "animate-spin rounded-full border-4 border-zinc-700 border-t-purple-600", 
        sizeClasses[size]
      )}/>
    </div>
  );
};

// Date divider component
const DateDivider = ({ date }) => (
  <div className="flex items-center justify-center my-4">
    <div className="bg-zinc-800 text-gray-400 text-xs px-3 py-1 rounded-full">
      {date}
    </div>
  </div>
);

// Main DirectChat component
export default function DirectChat({ recipientInfo, onBack }) {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  
  // Fetch current user ID when component mounts
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = await SecurityUtils.getCookie("idToken");
        if (!token) {
          console.error("No authentication token found");
          return;
        }
        
        const response = await fetch(`${API_URL}/user-profile/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: token }),
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status === "SUCCESS" && data.user_data && data.user_data.id) {
          setCurrentUserId(data.user_data.id);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        setError("Failed to load user information");
      }
    };
    
    fetchCurrentUser();
  }, [API_URL]);
  
  // Fetch messages when component mounts or recipient changes
  useEffect(() => {
    if (!recipientInfo?.user_id || !currentUserId) return;
    
    fetchMessages();
  }, [recipientInfo?.user_id, currentUserId, API_URL]);
  
  // Add this to the top of DirectChat component after the useState declarations
  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        console.log("Loading timeout triggered - forcing loading state to complete");
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(loadingTimeout);
  }, [isLoading]);
  
  // Fetch messages function
  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = await SecurityUtils.getCookie("idToken");
      if (!token) {
        setError("Authentication required to load messages");
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/get-direct-messages-between-users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: token,
          recipient_id: recipientInfo.user_id,
          page: currentPage,
          page_size: 20
        }),
      });
      
      // Handle 400 Bad Request - this is probably when there are no messages yet
      if (response.status === 400) {
        // Just set empty messages array and stop loading
        setMessages([]);
        setHasMoreMessages(false);
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        const messageData = Array.isArray(data.messages) ? data.messages : [];
        setMessages(messageData);
        setHasMoreMessages(data.pagination?.has_more || false);
      } else {
        throw new Error(data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (!isLoading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);
  
  // Handle scroll events to load more messages
  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    
    if (scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
  };
  
  // Load more messages when scrolling to top
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    
    try {
      const token = await SecurityUtils.getCookie("idToken");
      if (!token) return;
      
      const nextPage = currentPage + 1;
      
      const response = await fetch(`${API_URL}/get-direct-messages-between-users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: token,
          recipient_id: recipientInfo.user_id,
          page: nextPage,
          page_size: 20
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        const container = messagesContainerRef.current;
        const scrollHeight = container.scrollHeight;
        
        const messageData = Array.isArray(data.messages) ? data.messages : [];
        
        setMessages(prevMessages => [...messageData, ...prevMessages]);
        setHasMoreMessages(data.pagination?.has_more || false);
        setCurrentPage(nextPage);
        
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - scrollHeight;
          }
        }, 10);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
  };
  
  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage) return;
    
    setMessageInput("");
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: trimmedMessage,
      sender_id: currentUserId,
      timestamp: new Date().toISOString(),
      status: "SENDING"
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      const token = await SecurityUtils.getCookie("idToken");
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const response = await fetch(`${API_URL}/send-direct-message/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: token,
          recipient_id: recipientInfo.user_id,
          content: trimmedMessage,
          message_type: "TEXT"
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        if (data.message && data.message.id) {
          setMessages(prev => prev.map(msg => 
            msg.id === tempId ? { ...data.message, status: "SENT", sender_id: currentUserId } : msg
          ));
        } else {
          setMessages(prev => prev.map(msg => 
            msg.id === tempId ? { ...msg, status: "SENT" } : msg
          ));
        }
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: "ERROR" } : msg
      ));
    }
  };
  
  // Group messages by date
  const groupMessagesByDate = () => {
    if (!messages.length) return [];
    
    const groups = {};
    messages.forEach(message => {
      if (!message.content && !message.id) {
        return;
      }
      
      const timestamp = message.timestamp || message.created_at;
      if (!timestamp) {
        return;
      }
      
      const dateStr = format(new Date(timestamp), "yyyy-MM-dd");
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(message);
    });
    
    return Object.entries(groups).map(([dateStr, msgs]) => ({
      date: formatDateDivider(new Date(dateStr)),
      messages: msgs
    }));
  };
  
  // Check if message is from current user
  const isOwnMessage = (message) => {
    if (!currentUserId) {
      return false;
    }

    if (String(message.id).startsWith('temp-')) {
      return true;
    }

    if (message.sender_id === currentUserId) {
      return true;
    }

    if (message.is_sent_by_me === true) {
      return true;
    }

    return false;
  };
  
  useEffect(() => {
    if (!currentUserId) return;
    
    // Connect to SSE
    const connectSSE = async () => {
      await EventSourceService.connect(currentUserId);
      
      // Add message listener
      EventSourceService.addEventListener('message', handleSSEMessage);
    };
    
    connectSSE();
    
    // Clean up on unmount
    return () => {
      EventSourceService.removeEventListener('message', handleSSEMessage);
      EventSourceService.disconnect();
    };
  }, [currentUserId]);
  
  const handleSSEMessage = (data) => {
    console.log("SSE message received:", data);
    
    if (data.type === 'direct_message') {
      const newMessage = data.message;
      
      // Only process messages related to this conversation
      if (
        (data.sender_id === recipientInfo.user_id) || 
        (data.is_sent_by_me && data.sender_id === currentUserId)
      ) {
        // Check if we already have this message (avoid duplicates)
        setMessages(prev => {
          // Check if message already exists by comparing message_id
          const messageExists = prev.some(msg => 
            msg.id === newMessage.message_id || 
            msg.message_id === newMessage.message_id
          );
          
          if (messageExists) {
            console.log("Duplicate message detected, not adding");
            return prev;
          }
          
          console.log("Adding new message to state");
          return [...prev, {
            id: newMessage.message_id,
            content: newMessage.content,
            timestamp: newMessage.timestamp,
            sender_id: data.sender_id,
            is_sent_by_me: data.is_sent_by_me,
            message_type: newMessage.message_type,
            status: "SENT"
          }];
        });
      }
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg border border-zinc-800">
      {/* Chat header */}
      <div className="flex items-center px-4 py-3 border-b border-zinc-800">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="mr-2 rounded-full h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={recipientInfo.profile_photo} />
            <AvatarFallback className="bg-purple-900/50">
              {recipientInfo.full_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-medium text-sm">{recipientInfo.full_name}</h3>
          </div>
        </div>
        
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <LoadingSpinner size="lg" className="my-10" />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-red-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-300 font-medium">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-purple-400 mb-2">
              <Send className="h-10 w-10" />
            </div>
            <p className="text-gray-300 font-medium">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Send a message to start your conversation with {recipientInfo.full_name || "this user"}
            </p>
          </div>
        ) : (
          <>
            {isLoadingMore && (
              <LoadingSpinner size="sm" className="mb-4" />
            )}
            
            {groupMessagesByDate().map((group, groupIndex) => (
              <div key={group.date}>
                <DateDivider date={group.date} />
                
                {group.messages.map((message) => (
                  <MessageBubble 
                    key={message.id} 
                    message={message} 
                    isOwn={isOwnMessage(message)} 
                  />
                ))}
              </div>
            ))}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <Button 
            type="button"
            variant="ghost" 
            size="icon"
            className="rounded-full text-gray-400 hover:text-gray-300"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 mx-2">
            <Input
              type="text"
              placeholder="Type a message..."
              className="bg-zinc-800 border-zinc-700 focus:border-purple-500"
              value={messageInput}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="button"
            variant="ghost" 
            size="icon"
            className="rounded-full text-gray-400 hover:text-gray-300"
          >
            <Smile className="h-5 w-5" />
          </Button>
          
          <Button 
            type="submit"
            disabled={!messageInput.trim() || isLoading}
            className={cn(
              "rounded-full ml-1 bg-purple-600 hover:bg-purple-700 text-white p-2",
              !messageInput.trim() && "opacity-50 cursor-not-allowed"
            )}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

DirectChat.propTypes = {
  recipientInfo: PropTypes.shape({
    user_id: PropTypes.string.isRequired,
    full_name: PropTypes.string,
    profile_photo: PropTypes.string,
    email: PropTypes.string
  }).isRequired,
  onBack: PropTypes.func.isRequired
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string,
    created_at: PropTypes.string,
    sender_name: PropTypes.string,
    sender_avatar: PropTypes.string,
    status: PropTypes.string
  }).isRequired,
  isOwn: PropTypes.bool.isRequired
};

LoadingSpinner.propTypes = {
  className: PropTypes.string,
  size: PropTypes.string
};

DateDivider.propTypes = {
  date: PropTypes.string.isRequired
};