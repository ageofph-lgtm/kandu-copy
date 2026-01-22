import React, { useState, useEffect, useCallback } from "react";
import { ChatMessage } from "@/entities/ChatMessage";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Paperclip, Phone, FileText, Download, ArrowLeft, Settings, Search } from "lucide-react";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

// Conversation Item
function ConversationItem({ conversation, isSelected, onClick }) {
  const otherUser = conversation.other_user;
  const lastMessage = conversation.last_message;
  const unreadCount = conversation.unread_count || 0;

  const timeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div 
      onClick={onClick}
      className={`relative flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-[var(--border)] ${
        isSelected ? 'bg-[var(--primary)]/10' : 'hover:bg-[var(--surface-secondary)]'
      }`}
    >
      {unreadCount > 0 && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
      )}

      {/* Avatar */}
      <div className="relative">
        <div className="w-12 h-14 hexagon bg-[var(--surface-secondary)] overflow-hidden flex-shrink-0">
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} alt={otherUser.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] font-bold">
              {otherUser?.full_name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--surface)]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={`font-semibold text-[var(--text-primary)] truncate ${unreadCount > 0 ? 'font-bold' : ''}`}>
            {otherUser?.full_name || 'Utilizador'}
          </h4>
          <span className={`text-xs whitespace-nowrap ${unreadCount > 0 ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
            {timeAgo(lastMessage?.created_date)}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
          {lastMessage?.message || 'Sem mensagens'}
        </p>
      </div>

      {unreadCount > 0 && (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--primary)] text-gray-900 text-xs flex items-center justify-center font-bold">
          {unreadCount}
        </span>
      )}
    </div>
  );
}

// Message Bubble
function MessageBubble({ message, isOwn, showAvatar, otherUser }) {
  const hasAttachment = message.attachment_url;

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] overflow-hidden flex-shrink-0">
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
              {otherUser?.full_name?.charAt(0)}
            </div>
          )}
        </div>
      )}
      {!isOwn && !showAvatar && <div className="w-8" />}

      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {message.message && (
          <div className={`px-4 py-2.5 rounded-2xl ${
            isOwn 
              ? 'bg-[var(--primary)] text-gray-900 rounded-br-sm' 
              : 'bg-[var(--surface)] text-[var(--text-primary)] rounded-bl-sm shadow-sm'
          }`}>
            <p className="text-sm leading-relaxed">{message.message}</p>
          </div>
        )}

        {hasAttachment && (
          <div className={`mt-2 p-3 rounded-xl ${
            isOwn ? 'bg-[var(--primary)]/80' : 'bg-[var(--surface)]'
          }`}>
            {message.attachment_type === 'image' ? (
              <img src={message.attachment_url} alt="Attachment" className="rounded-lg max-w-full h-auto" />
            ) : (
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isOwn ? 'bg-gray-900/20' : 'bg-red-100'
                }`}>
                  <FileText className={`w-5 h-5 ${isOwn ? 'text-gray-900' : 'text-red-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isOwn ? 'text-gray-900' : 'text-[var(--text-primary)]'}`}>
                    Documento
                  </p>
                  <p className={`text-xs ${isOwn ? 'text-gray-900/70' : 'text-[var(--text-muted)]'}`}>PDF</p>
                </div>
                <Button size="icon" variant="ghost" className={isOwn ? 'text-gray-900' : ''}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        <p className={`text-xs mt-1 ${isOwn ? 'text-right' : 'text-left'} text-[var(--text-muted)]`}>
          {format(new Date(message.created_date), "HH:mm")}
        </p>
      </div>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadUser = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      return userData;
    } catch (error) {
      return null;
    }
  }, []);

  const loadConversations = useCallback(async (currentUser) => {
    if (!currentUser) return;
    try {
      const allMessages = await ChatMessage.list("-created_date");
      const userCache = new Map();
      const conversationMap = new Map();
      
      const getUser = async (userId) => {
        if (userCache.has(userId)) return userCache.get(userId);
        const [userData] = await User.filter({ id: userId });
        if(userData) userCache.set(userId, userData);
        return userData;
      };

      for (const message of allMessages) {
        let isParticipant = message.sender_id === currentUser.id || message.receiver_id === currentUser.id;

        if (currentUser.user_type === 'admin' || isParticipant) {
          const conversationId = message.conversation_id;
          
          if (!conversationMap.has(conversationId)) {
            const user1 = await getUser(message.sender_id);
            const user2 = await getUser(message.receiver_id);
            
            if (user1 && user2) {
              const otherUser = user1.id === currentUser.id ? user2 : user1;
              conversationMap.set(conversationId, {
                conversation_id: conversationId,
                participants: [user1, user2],
                other_user: otherUser,
                last_message: message,
                unread_count: 0
              });
            }
          }
          
          const conversation = conversationMap.get(conversationId);
          if (conversation) {
            if (new Date(message.created_date) > new Date(conversation.last_message.created_date)) {
              conversation.last_message = message;
            }
            if (!message.is_read && message.receiver_id === currentUser.id) {
              conversation.unread_count = (conversation.unread_count || 0) + 1;
            }
          }
        }
      }

      const conversationList = Array.from(conversationMap.values());
      conversationList.sort((a, b) => new Date(b.last_message.created_date) - new Date(a.last_message.created_date));
      setConversations(conversationList);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId, currentUser) => {
    if (!currentUser || !conversationId) return;
    try {
      const messageList = await ChatMessage.filter({ conversation_id: conversationId }, "created_date");
      setMessages(messageList);

      const unreadMessages = messageList.filter(msg => !msg.is_read && msg.receiver_id === currentUser.id);
      for (const msg of unreadMessages) {
        await ChatMessage.update(msg.id, { is_read: true });
      }
      await loadConversations(currentUser);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, [loadConversations]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const currentUser = await loadUser();
      if (currentUser) await loadConversations(currentUser);
      setLoading(false);
    };
    init();
  }, [loadUser, loadConversations]);

  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages(selectedConversation.conversation_id, user);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, user, loadMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedConversation) return;

    try {
      await ChatMessage.create({
        conversation_id: selectedConversation.conversation_id,
        sender_id: user.id,
        receiver_id: selectedConversation.other_user.id,
        message: newMessage,
      });

      await Notification.create({
        user_id: selectedConversation.other_user.id,
        type: "new_message",
        title: `Nova mensagem de ${user.full_name}`,
        message: newMessage.substring(0, 50) + (newMessage.length > 50 ? '...' : ''),
        related_id: user.id,
        action_url: createPageUrl("Chat"),
      });

      setNewMessage("");
      await loadMessages(selectedConversation.conversation_id, user);
      await loadConversations(user);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">A carregar conversas...</p>
      </div>
    );
  }

  // Chat Window View
  if (selectedConversation) {
    return (
      <div className="h-screen flex flex-col bg-[var(--background)]">
        {/* Header */}
        <header className="flex-shrink-0 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedConversation(null)} className="w-10 h-10 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center md:hidden">
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            
            <div className="w-10 h-12 hexagon bg-[var(--surface-secondary)] overflow-hidden">
              {selectedConversation.other_user?.avatar_url ? (
                <img src={selectedConversation.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-[var(--text-muted)]">
                  {selectedConversation.other_user?.full_name?.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-[var(--text-primary)]">{selectedConversation.other_user?.full_name}</h3>
              <p className="text-xs text-green-500">Active now</p>
            </div>
            
            <button className="w-10 h-10 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center">
              <Phone className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Job Contract Button */}
          <div className="flex justify-center mt-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-gray-900 rounded-full text-sm font-semibold shadow-lg">
              <FileText className="w-4 h-4" />
              JOB CONTRACT
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message, index) => {
            const isOwn = message.sender_id === user?.id;
            const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
            return (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isOwn={isOwn}
                showAvatar={showAvatar}
                otherUser={selectedConversation.other_user}
              />
            );
          })}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 bg-[var(--surface)] border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-[var(--surface-secondary)] border-none rounded-full"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={sendMessage}
              className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-lg"
            >
              <Send className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation List View
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center">
          <span className="material-icons-round text-[var(--text-secondary)]">menu</span>
        </button>
        <h1 className="text-xl font-bold text-[var(--primary)]">KANDU</h1>
        <button className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center">
          <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
      </header>

      {/* Search */}
      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input
            placeholder="Search chats or professionals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-10 pr-4 bg-[var(--surface)] border-none rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Active Sites */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[var(--text-primary)]">Active Sites</h3>
          <button className="text-[var(--primary)] text-xs font-bold uppercase">View All</button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {filteredConversations.slice(0, 4).map(conv => (
            <div key={conv.conversation_id} className="flex flex-col items-center gap-2 min-w-[72px]">
              <div className="relative w-[72px] h-[80px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-amber-600 hexagon" />
                <div className="absolute inset-[2px] bg-[var(--surface)] hexagon overflow-hidden">
                  {conv.other_user?.avatar_url ? (
                    <img src={conv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] font-bold">
                      {conv.other_user?.full_name?.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] text-center truncate w-full">
                {conv.other_user?.full_name?.split(' ')[0]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Conversations */}
      <div className="bg-[var(--surface)] rounded-t-3xl flex-1 pb-24">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="font-bold text-[var(--text-primary)]">Recent Messages</h3>
          <button className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center">
            <span className="material-icons-round text-sm text-[var(--text-muted)]">filter_list</span>
          </button>
        </div>

        {filteredConversations.length > 0 ? (
          filteredConversations.map(conv => (
            <ConversationItem 
              key={conv.conversation_id}
              conversation={conv}
              isSelected={false}
              onClick={() => setSelectedConversation(conv)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-18 hexagon bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
              <span className="material-icons-round text-3xl text-[var(--text-muted)]">chat_bubble</span>
            </div>
            <p className="text-[var(--text-secondary)]">No conversations yet</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 right-6">
        <button className="w-14 h-14 rounded-full bg-[var(--primary)] shadow-xl flex items-center justify-center animate-pulse-glow">
          <span className="material-icons-round text-2xl text-gray-900">edit</span>
        </button>
      </div>
    </div>
  );
}