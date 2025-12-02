
import React, { useState, useEffect, useCallback } from "react";
import { ChatMessage } from "@/entities/ChatMessage";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle,
  ArrowLeft,
  Settings // Add Settings icon
} from "lucide-react";
import { createPageUrl } from "@/utils";

import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
                other_user: otherUser, // Mantém para compatibilidade
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

      // Marcar mensagens como lidas
      const unreadMessages = messageList.filter(msg =>
        !msg.is_read && msg.receiver_id === currentUser.id
      );
      for (const msg of unreadMessages) {
        await ChatMessage.update(msg.id, { is_read: true });
      }

      // Marcar notificações relacionadas como lidas
      const otherUserId = selectedConversation?.other_user.id;
      if (otherUserId) {
        const unreadNotifications = await Notification.filter({
          user_id: currentUser.id,
          type: 'new_message',
          is_read: false,
          related_id: otherUserId
        });
        
        for (const notif of unreadNotifications) {
          await Notification.update(notif.id, { is_read: true });
        }
      }

      // Recarregar conversas para atualizar contadores
      await loadConversations(currentUser);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, [selectedConversation, loadConversations]);

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
        setMessages([]); // Clear messages when no conversation is selected
    }
  }, [selectedConversation, user, loadMessages]);

  const sendMessage = async (messageText, attachment = null) => {
    if (!messageText.trim() && !attachment) return;
    if (!user || !selectedConversation) return;

    try {
      const conversationId = selectedConversation.conversation_id;
      const receiverId = selectedConversation.other_user.id;

      const messageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        message: messageText || "",
      };

      if (attachment) {
        messageData.attachment_url = attachment.url;
        messageData.attachment_type = attachment.type;
      }

      await ChatMessage.create(messageData);

      await Notification.create({
          user_id: receiverId,
          type: "new_message",
          title: `Nova mensagem de ${user.full_name}`,
          message: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
          related_id: user.id,
          action_url: createPageUrl("Chat"),
      });

      await loadMessages(conversationId, user);
      await loadConversations(user);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-3 text-gray-400 animate-spin" />
          <p className="text-gray-500">A carregar conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
        </div>
        <ConversationList
          conversations={conversations}
          onSelect={setSelectedConversation}
          selectedId={selectedConversation?.conversation_id}
        />
      </div>

      <div className={`flex-1 ${!selectedConversation ? 'hidden md:flex' : 'flex'} flex-col`}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            currentUser={user}
            onSendMessage={sendMessage}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">
                Selecione uma conversa para começar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
