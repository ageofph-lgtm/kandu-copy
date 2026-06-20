import { useState, useEffect, useCallback, useRef } from "react";
import { Application, ChatMessage, Job, Notification, User } from "@/api/entities";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import LoadingScreen from "@/components/LoadingScreen";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";

// Gerar ID de conversa sintético a partir dos participantes + job
function makeConvId(uid1, uid2, jobId) {
  const pair = [uid1, uid2].sort().join("_");
  return jobId ? `${pair}__${jobId}` : pair;
}

export default function Chat() {
  const { isDark } = useTheme();
  const { lang } = useLanguage();
  const bg = isDark ? "#111016" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#111016";
  const headerBg = isDark ? "#111" : "#F0F0F0";
  const border = isDark ? "#222" : "#E5E5E5";
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const openedFromParam = useRef(false);
  const urlParamHandled = useRef(false);

  const loadUser = useCallback(async () => {
    try { const u = await User.me(); setUser(u); return u; }
    catch { return null; }
  }, []);

  const loadConversations = useCallback(async (currentUser) => {
    if (!currentUser) return;
    try {
      // Buscar todas as mensagens em que o utilizador participa
      const [asSender, asReceiver] = await Promise.all([
        ChatMessage.filter({ sender_id: currentUser.id }),
        ChatMessage.filter({ receiver_id: currentUser.id }),
      ]);
      const allMessages = [...asSender, ...asReceiver];

      // Agrupar por conversa sintética (pair + job_id)
      const convMap = new Map();
      const userCache = new Map();

      const getUser = async (userId) => {
        if (userCache.has(userId)) return userCache.get(userId);
        if (userId === currentUser.id) { userCache.set(userId, currentUser); return currentUser; }
        try {
          const res = await User.get(userId);
          if (res) { userCache.set(userId, res); return res; }
        } catch {}
        const fallback = { id: userId, full_name: "Utilizador" };
        userCache.set(userId, fallback);
        return fallback;
      };

      for (const msg of allMessages) {
        const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        const convId = makeConvId(currentUser.id, otherId, msg.job_id);

        if (!convMap.has(convId)) {
          convMap.set(convId, {
            conversation_id: convId,
            job_id: msg.job_id,
            other_user_id: otherId,
            other_user: null,
            last_message: msg,
            unread_count: 0,
          });
        }
        const conv = convMap.get(convId);
        if (new Date(msg.created_at) > new Date(conv.last_message.created_at)) {
          conv.last_message = msg;
        }
        if (!msg.read && msg.receiver_id === currentUser.id) {
          conv.unread_count = (conv.unread_count || 0) + 1;
        }
      }

      // Carregar otherUser para cada conversa
      const convs = Array.from(convMap.values());
      await Promise.all(convs.map(async (c) => {
        c.other_user = await getUser(c.other_user_id);
      }));

      convs.sort((a, b) =>
        new Date(b.last_message.created_at) - new Date(a.last_message.created_at)
      );

      setConversations(convs);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar conversas:", err);
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conv, currentUser) => {
    if (!conv || !currentUser) return;
    try {
      // Buscar mensagens por job_id ou por par de utilizadores
      let msgs = [];
      if (conv.job_id) {
        const all = await ChatMessage.filter({ job_id: conv.job_id });
        msgs = all.filter(m =>
          (m.sender_id === currentUser.id && m.receiver_id === conv.other_user_id) ||
          (m.receiver_id === currentUser.id && m.sender_id === conv.other_user_id)
        );
      } else {
        const [asSender, asReceiver] = await Promise.all([
          ChatMessage.filter({ sender_id: currentUser.id, receiver_id: conv.other_user_id }),
          ChatMessage.filter({ receiver_id: currentUser.id, sender_id: conv.other_user_id }),
        ]);
        msgs = [...asSender, ...asReceiver];
      }
      msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(msgs);

      // Marcar como lidas
      const unread = msgs.filter(m => !m.read && m.receiver_id === currentUser.id);
      await Promise.all(unread.map(m => ChatMessage.update(m.id, { read: true })));
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    }
  }, []);

  const handleSendMessage = async (text, attachment) => {
    if (!user || !selectedConversation || !text.trim()) return;
    try {
      const payload = {
        job_id: selectedConversation.job_id || null,
        sender_id: user.id,
        receiver_id: selectedConversation.other_user_id,
        content: text.trim(),
        read: false,
      };
      if (attachment?.url) {
        payload.content = attachment.type === "image"
          ? `📷 ${text.trim()}`
          : `📎 ${text.trim()}`;
      }
      const newMsg = await ChatMessage.create(payload);
      setMessages(prev => [...prev, newMsg]);

      // Notificação
      await Notification.create({
        user_id: selectedConversation.other_user_id,
        type: "new_message",
        title: "💬 Nova mensagem",
        message: `${user.full_name || user.email}: "${text.trim().substring(0, 60)}"`,
        related_id: selectedConversation.job_id || null,
        read: false,
      });
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      toast && toast.error("Erro ao enviar mensagem");
    }
  };

  useEffect(() => { loadUser().then(u => { if (u) loadConversations(u); }); }, [loadUser, loadConversations]);

  useEffect(() => {
    if (selectedConversation && user) loadMessages(selectedConversation, user);
  }, [selectedConversation, user, loadMessages]);

  // Abrir/iniciar conversa a partir de ?userId=... (ex.: botão "Contactar" no Perfil).
  useEffect(() => {
    if (!user || loading || openedFromParam.current) return;
    const targetId = new URLSearchParams(window.location.search).get("userId");
    if (!targetId || targetId === user.id) return;
    openedFromParam.current = true;

    (async () => {
      try {
        const existing = [...conversations, ...archivedConversations].find(
          (c) => c.other_user?.id === targetId
        );
        if (existing) {
          setSelectedConversation(existing);
        } else {
          const [otherUser] = await User.filter({ id: targetId });
          if (otherUser) {
            setSelectedConversation({
              conversation_id: [user.id, targetId].sort().join("_"),
              participants: [user, otherUser],
              other_user: otherUser,
              last_message: null,
              unread_count: 0,
              job_context: null,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao abrir conversa a partir do perfil:", error);
      } finally {
        // Remove o parâmetro para não reabrir
        const url = new URL(window.location.href);
        url.searchParams.delete("userId");
        window.history.replaceState({}, "", url.toString());
      }
    })();
  }, [user, loading, conversations, archivedConversations]);

  if (loading) return <LoadingScreen />;

  const unreadTotal = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: bg, color: text }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", background: headerBg, borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <MessageCircle size={22} color="#F4621F" />
        <span style={{ fontWeight: 700, fontSize: 18 }}>{t(lang, "messages", "Mensagens")}</span>
        {unreadTotal > 0 && (
          <span style={{ background: "#F4621F", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>
            {unreadTotal}
          </span>
        )}
      </div>

      {/* Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.conversation_id}
          onSelect={setSelectedConversation}
          isDark={isDark}
          lang={lang}
          currentUser={user}
        />
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            currentUser={user}
            onSend={handleSendMessage}
            isDark={isDark}
            lang={lang}
          />
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? "#555" : "#aaa", flexDirection: "column", gap: 12 }}>
            <MessageCircle size={48} />
            <p>{t(lang, "selectConversation", "Seleciona uma conversa")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
