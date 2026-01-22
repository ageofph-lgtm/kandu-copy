import React, { useState, useEffect, useCallback } from "react";
import { ChatMessage } from "@/entities/ChatMessage";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle,
  ArrowLeft,
  Loader2,
  Search,
  Settings,
  Phone,
  Send,
  Paperclip,
  Image,
  FileText,
  Download
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// Conversation List Item
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
      {/* Unread indicator */}
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
        {/* Online indicator */}
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

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center font-bold">
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
              ? 'bg-[var(--primary)] text-white rounded-br-sm' 
              : 'bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-bl-sm'
          }`}>
            <p className="text-sm leading-relaxed">{message.message}</p>
          </div>
        )}

        {hasAttachment && (
          <div className={`mt-2 p-3 rounded-xl ${
            isOwn ? 'bg-[var(--primary)]/80' : 'bg-[var(--surface-secondary)]'
          }`}>
            {message.attachment_type === 'image' ? (
              <img 
                src={message.attachment_url} 
                alt="Attachment" 
                className="rounded-lg max-w-full h-auto"
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isOwn ? 'bg-white/20' : 'bg-[var(--primary)]/10'
                }`}>
                  <FileText className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-[var(--primary)]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                    Documento
                  </p>
                  <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>PDF</p>
                </div>
                <Button size="icon" variant="ghost" className={isOwn ? 'text-white' : ''}>
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
      console.log("User not authenticated");
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
      conversationList.sort((a, b) =>
        new Date(b.last_message.created_date) - new Date(a.last_message.created_date)
      );

      setConversations(conversationList);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId, currentUser) => {
    if (!currentUser || !conversationId) return;
    try {
      const messageList = await ChatMessage.filter(
        { conversation_id: conversationId },
        "created_date"
      );
      setMessages(messageList);

      const unreadMessages = messageList.filter(msg =>
        !msg.is_read && msg.receiver_id === currentUser.id
      );
      for (const msg of unreadMessages) {
        await ChatMessage.update(msg.id, { is_read: true });
      }

      await loadConversations(currentUser);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, [loadConversations]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    const currentUser = await loadUser();
    if(currentUser) {
      await loadConversations(currentUser);
    }
    setLoading(false);
  }, [loadUser, loadConversations]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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
      const messageData = {
        conversation_id: selectedConversation.conversation_id,
        sender_id: user.id,
        receiver_id: selectedConversation.other_user.id,
        message: newMessage,
      };

      await ChatMessage.create(messageData);

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
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">A carregar conversas...</p>
      </div>
    );
  }

  // Mobile: Show conversation list or chat
  if (selectedConversation) {
    return (
      <div className="h-screen flex flex-col bg-[var(--background)]">
        {/* Chat Header */}
        <div className="flex-shrink-0 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setSelectedConversation(null)}
              className="md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="w-10 h-10 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
              {selectedConversation.other_user?.avatar_url ? (
                <img src={selectedConversation.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-[var(--text-muted)]">
                  {selectedConversation.other_user?.full_name?.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-[var(--text-primary)]">
                {selectedConversation.other_user?.full_name}
              </h3>
              <p className="text-xs text-green-500">Ativo agora</p>
            </div>
            
            <Button size="icon" variant="ghost">
              <Phone className="w-5 h-5 text-[var(--text-secondary)]" />
            </Button>
          </div>

          {/* Job Contract Button */}
          <div className="flex justify-center mt-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-full text-sm font-semibold">
              <FileText className="w-4 h-4" />
              Contrato do Trabalho
            </button>
          </div>
        </div>

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
            <Button size="icon" variant="ghost">
              <Paperclip className="w-5 h-5 text-[var(--text-secondary)]" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escrever mensagem..."
              className="flex-1 bg-[var(--surface-secondary)] border-[var(--border)] rounded-full"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button 
              size="icon" 
              onClick={sendMessage}
              className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] rounded-full"
            >
              <Send className="w-5 h-5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation List
  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-[var(--primary)]">KANDU</h1>
          <Button size="icon" variant="ghost">
            <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <Input
              placeholder="Pesquisar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[var(--surface-secondary)] border-[var(--border)] rounded-xl"
            />
          </div>
        </div>

        {/* Active Sites */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[var(--text-primary)]">Sites Ativos</h3>
            <button className="text-[var(--primary)] text-xs font-bold uppercase">Ver Todos</button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {filteredConversations.slice(0, 4).map(conv => (
              <div key={conv.conversation_id} className="flex flex-col items-center gap-2 min-w-[72px]">
                <div className="relative w-[72px] h-[80px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-orange-600 hexagon" />
                  <div className="absolute inset-[2px] bg-[var(--surface)] hexagon overflow-hidden">
                    {conv.other_user?.avatar_url ? (
                      <img src={conv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] font-bold">
                        {conv.other_user?.full_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--surface)]" />
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] text-center truncate w-full">
                  {conv.other_user?.full_name?.split(' ')[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-bold text-[var(--text-primary)]">Mensagens Recentes</h3>
          <Button size="icon" variant="ghost">
            <Settings className="w-4 h-4 text-[var(--text-muted)]" />
          </Button>
        </div>

        {filteredConversations.length > 0 ? (
          filteredConversations.map(conv => (
            <ConversationItem 
              key={conv.conversation_id}
              conversation={conv}
              isSelected={selectedConversation?.conversation_id === conv.conversation_id}
              onClick={() => setSelectedConversation(conv)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 hexagon bg-[var(--surface)] flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-secondary)]">Nenhuma conversa encontrada</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="absolute bottom-24 right-6">
        <Button 
          size="icon" 
          className="w-14 h-14 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] shadow-lg"
          style={{ boxShadow: '0 0 20px rgba(236, 127, 19, 0.4)' }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </div>
    </div>
  );
}