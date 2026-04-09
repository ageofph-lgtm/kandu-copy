import React, { useState, useEffect, useCallback } from "react";
import { ChatMessage } from "@/entities/ChatMessage";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Application } from "@/entities/Application";
import { Job } from "@/entities/Job";
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
  const [archivedConversations, setArchivedConversations] = useState([]);
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

  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

  const loadConversations = useCallback(async (currentUser) => {
    if (!currentUser) return;
    try {
      const allMessages = await ChatMessage.list("-created_date");
      const userCache = new Map();
      const conversationMap = new Map();

      const getUser = async (userId) => {
        if (userCache.has(userId)) return userCache.get(userId);
        const [userData] = await User.filter({ id: userId });
        if (userData) userCache.set(userId, userData);
        return userData;
      };

      // Load accepted applications to determine job context
      const acceptedApps = await Application.filter({ status: 'accepted' });
      const jobCache = new Map();
      const getJob = async (jobId) => {
        if (jobCache.has(jobId)) return jobCache.get(jobId);
        const [job] = await Job.filter({ id: jobId });
        if (job) jobCache.set(jobId, job);
        return job;
      };

      for (const message of allMessages) {
        const isParticipant = message.sender_id === currentUser.id || message.receiver_id === currentUser.id;
        if (currentUser.user_type === 'admin' || isParticipant) {
          const conversationId = message.conversation_id;
          if (!conversationMap.has(conversationId)) {
            const user1 = await getUser(message.sender_id);
            const user2 = await getUser(message.receiver_id);
            if (user1 && user2) {
              const otherUser = user1.id === currentUser.id ? user2 : user1;
              // Find job context: accepted application between these two users
              const relatedApp = acceptedApps.find(app =>
                (app.worker_id === user1.id || app.worker_id === user2.id) &&
                (app.worker_id !== app.worker_id || true) // check both participants
              );
              const jobLinkedApp = acceptedApps.find(app => {
                const ids = [user1.id, user2.id];
                return ids.includes(app.worker_id);
              });
              let jobContext = null;
              if (jobLinkedApp) {
                const job = await getJob(jobLinkedApp.job_id);
                if (job && (job.employer_id === user1.id || job.employer_id === user2.id)) {
                  jobContext = { job, application: jobLinkedApp };
                }
              }
              conversationMap.set(conversationId, {
                conversation_id: conversationId,
                participants: [user1, user2],
                other_user: otherUser,
                last_message: message,
                unread_count: 0,
                job_context: jobContext
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

      const allConvs = Array.from(conversationMap.values());
      allConvs.sort((a, b) =>
        new Date(b.last_message.created_date) - new Date(a.last_message.created_date)
      );

      // Split by archived flag (persisted in DB by backend automation)
      const active = allConvs.filter(c => !c.last_message.is_archived);
      const archived = allConvs.filter(c => c.last_message.is_archived);

      setConversations(active);
      setArchivedConversations(archived);
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
      <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#1A1A1A"}}>
        <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png" style={{width:60,animation:"pulse 1.5s infinite"}} alt="" />
      </div>
    );
  }

  return (
    <div style={{background:"#1A1A1A",height:"100vh",display:"flex",flexDirection:"column"}}>
      {/* Conversation list panel */}
      <div style={{display: selectedConversation ? "none" : "flex", flexDirection:"column", flex:1, overflow:"hidden"}} className="md:flex md:w-1/3 md:border-r md:border-[#222]">
        <div style={{padding:"50px 20px 12px",background:"#111",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:"#FFF",margin:0}}>Mensagens</h2>
          <span style={{background:"#FF6600",color:"#FFF",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:700}}>{conversations.length}</span>
        </div>
        <ConversationList
          conversations={conversations}
          archivedConversations={archivedConversations}
          onSelect={setSelectedConversation}
          selectedId={selectedConversation?.conversation_id}
        />
      </div>

      {/* Chat window panel */}
      <div style={{display: selectedConversation ? "flex" : "none", flexDirection:"column", flex:1, overflow:"hidden"}} className="md:flex">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            currentUser={user}
            onSendMessage={sendMessage}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}>
            <div style={{textAlign:"center"}}>
              <MessageCircle style={{width:48,height:48,color:"#444",margin:"0 auto 12px"}} />
              <p style={{color:"#555"}}>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}