import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Application, ChatMessage, Job, Notification, User } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import LoadingScreen from "@/components/LoadingScreen";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";

// Gerar ID de conversa sintético a partir dos participantes + job
function makeConvId(uid1, uid2, jobId) {
  const pair = [uid1, uid2].sort().join("_");
  return jobId ? `${pair}__${jobId}` : pair;
}

/** Estados de obra que fecham o chat (#24). */
const CLOSED_JOB_STATUS = ["completed", "cancelled", "closed"];

/** Inatividade que arquiva a conversa (#76, #92). */
export const CHAT_ARCHIVE_DAYS = 14;
const ARCHIVE_MS = CHAT_ARCHIVE_DAYS * 24 * 60 * 60 * 1000;

/** Máximo de mensagens antes de a candidatura ser aceite (#23, #88, #90). */
const PRE_ACCEPT_MESSAGE_LIMIT = 1;

export default function Chat() {
  const { isDark } = useTheme();
  const { lang } = useLanguage();
  const bg = "var(--base)";
  const text = "var(--text)";
  const headerBg = "var(--base2)";
  const border = "var(--hair)";

  const [conversations, setConversations] = useState([]);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobsById, setJobsById] = useState({});
  const [applications, setApplications] = useState([]);
  const openedFromParam = useRef(false);

  // Refs para os handlers de realtime lerem sempre o estado actual
  const userRef = useRef(null);
  const selectedRef = useRef(null);
  userRef.current = user;
  selectedRef.current = selectedConversation;

  const loadUser = useCallback(async () => {
    try { const u = await User.me(); setUser(u); return u; }
    catch { return null; }
  }, []);

  const loadConversations = useCallback(async (currentUser) => {
    if (!currentUser) return;
    try {
      const [asSender, asReceiver] = await Promise.all([
        ChatMessage.filter({ sender_id: currentUser.id }),
        ChatMessage.filter({ receiver_id: currentUser.id }),
      ]);
      const allMessages = [...asSender, ...asReceiver];

      const convMap = new Map();
      const userCache = new Map();

      const getUser = async (userId) => {
        if (userCache.has(userId)) return userCache.get(userId);
        if (userId === currentUser.id) { userCache.set(userId, currentUser); return currentUser; }
        try {
          const res = await User.get(userId);
          if (res) { userCache.set(userId, res); return res; }
        } catch { /* perfil inacessível */ }
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

      const convs = Array.from(convMap.values());
      await Promise.all(convs.map(async (c) => { c.other_user = await getUser(c.other_user_id); }));
      convs.sort((a, b) => new Date(b.last_message.created_at) - new Date(a.last_message.created_at));

      // #76/#92 — conversas sem atividade há mais de 2 semanas são arquivadas
      const now = Date.now();
      const isStale = (c) => now - new Date(c.last_message.created_at).getTime() > ARCHIVE_MS;
      setConversations(convs.filter(c => !isStale(c)));
      setArchivedConversations(convs.filter(isStale));

      // Contexto das obras (título + estado, para bloquear o chat)
      const jobIds = [...new Set(convs.map(c => c.job_id).filter(Boolean))];
      if (jobIds.length) {
        const jobs = await Promise.all(jobIds.map(id => Job.get(id).catch(() => null)));
        const map = {};
        jobs.filter(Boolean).forEach(j => { map[j.id] = j; });
        setJobsById(map);
      }

      // Candidaturas — determinam se a conversa já foi "aceite"
      try {
        const [mine, toMe] = await Promise.all([
          Application.filter({ worker_id: currentUser.id }),
          Application.filter({ employer_id: currentUser.id }),
        ]);
        setApplications([...mine, ...toMe]);
      } catch { setApplications([]); }

      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar conversas:", err);
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conv, currentUser) => {
    if (!conv || !currentUser) return;
    try {
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
        msgs = [...asSender, ...asReceiver].filter(m => !m.job_id);
      }
      msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(msgs);

      // #73 — marcar entregues + vistas ao abrir a conversa
      const now = new Date().toISOString();
      const inbound = msgs.filter(m => m.receiver_id === currentUser.id && (!m.read || !m.seen_at));
      if (inbound.length) {
        await Promise.all(inbound.map(m =>
          ChatMessage.update(m.id, { read: true, seen_at: now, delivered_at: m.delivered_at || now })
            .catch(() => {})
        ));
        setConversations(prev => prev.map(c =>
          c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    }
  }, []);

  // ── Estado do chat da conversa seleccionada (#24, #23/#88/#90, #76/#92) ──
  const chatState = useMemo(() => {
    if (!selectedConversation || !user) return { locked: false };

    const conv = selectedConversation;
    const job = conv.job_id ? jobsById[conv.job_id] : null;

    // Obra terminada → chat desativado
    if (job && (CLOSED_JOB_STATUS.includes(job.status) || job.chat_locked)) {
      return {
        locked: true,
        reason: `Esta obra já terminou (${job.status === "cancelled" ? "cancelada" : "concluída"}). O chat foi desativado.`,
      };
    }

    // Conversa arquivada por inatividade
    if (archivedConversations.some(c => c.conversation_id === conv.conversation_id)) {
      return {
        locked: true,
        reason: `Conversa arquivada — sem atividade há mais de ${CHAT_ARCHIVE_DAYS} dias.`,
      };
    }

    // Limite de mensagens antes da aceitação formal
    const accepted = applications.some(a =>
      (a.job_id === conv.job_id || !conv.job_id) &&
      (a.worker_id === conv.other_user_id || a.worker_id === user.id) &&
      (a.employer_id === conv.other_user_id || a.employer_id === user.id) &&
      ["accepted", "completed"].includes(a.status)
    );
    if (!accepted) {
      const mine = messages.filter(m => m.sender_id === user.id).length;
      const theirs = messages.filter(m => m.sender_id !== user.id).length;
      // Só bloqueia enquanto o outro lado não responder — evita spam sem
      // impedir uma conversa genuína.
      if (mine >= PRE_ACCEPT_MESSAGE_LIMIT && theirs === 0) {
        return {
          locked: true,
          reason: "Só podes enviar 1 mensagem antes de a candidatura ser aceite. Aguarda a resposta.",
          softLimit: true,
        };
      }
    }

    return { locked: false };
  }, [selectedConversation, user, jobsById, applications, messages, archivedConversations]);

  const handleSendMessage = async (body, attachment) => {
    if (!user || !selectedConversation) return;
    const trimmed = (body || "").trim();
    if (!trimmed && !attachment?.url) return;

    if (chatState.locked) { toast.error(chatState.reason); return; }

    try {
      const payload = {
        job_id: selectedConversation.job_id || null,
        sender_id: user.id,
        receiver_id: selectedConversation.other_user_id,
        content: trimmed,
        read: false,
        delivered_at: null,
        ...(attachment?.url ? { attachment_url: attachment.url, attachment_type: attachment.type } : {}),
      };
      const newMsg = await ChatMessage.create(payload);
      setMessages(prev => [...prev, newMsg]);

      await Notification.create({
        user_id: selectedConversation.other_user_id,
        type: "new_message",
        title: "💬 Nova mensagem",
        message: `${user.full_name || user.email}: "${trimmed.substring(0, 60)}"`,
        related_id: selectedConversation.job_id || null,
        read: false,
      }).catch(() => {});
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      toast.error("Erro ao enviar mensagem: " + (err.message || ""));
    }
  };

  useEffect(() => { loadUser().then(u => { if (u) loadConversations(u); }); }, [loadUser, loadConversations]);

  useEffect(() => {
    if (selectedConversation && user) loadMessages(selectedConversation, user);
  }, [selectedConversation?.conversation_id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── #2000 · SINCRONIZAÇÃO EM TEMPO REAL ────────────────────────────────────
  // Realtime via Postgres changes; se o websocket não estiver disponível o
  // polling de 4s garante que as mensagens aparecem sem refresh manual.
  useEffect(() => {
    if (!user?.id) return;

    const belongsToOpenConversation = (msg) => {
      const conv = selectedRef.current;
      if (!conv) return false;
      const samePair =
        (msg.sender_id === conv.other_user_id && msg.receiver_id === user.id) ||
        (msg.sender_id === user.id && msg.receiver_id === conv.other_user_id);
      return samePair && (msg.job_id || null) === (conv.job_id || null);
    };

    const channel = supabase
      .channel(`chat-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const msg = payload.new;
          // Confirmação de entrega (#73)
          ChatMessage.update(msg.id, { delivered_at: new Date().toISOString() }).catch(() => {});

          if (belongsToOpenConversation(msg)) {
            setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
            ChatMessage.update(msg.id, { read: true, seen_at: new Date().toISOString() }).catch(() => {});
          } else {
            loadConversations(userRef.current);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new;
          setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, ...msg } : m)));
        }
      )
      .subscribe();

    // Fallback: polling da conversa aberta
    const poll = setInterval(() => {
      const conv = selectedRef.current;
      if (conv && userRef.current) loadMessages(conv, userRef.current);
    }, 4000);

    // Fallback: refrescar a lista de conversas
    const pollList = setInterval(() => {
      if (userRef.current && !document.hidden) loadConversations(userRef.current);
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      clearInterval(pollList);
    };
  }, [user?.id, loadMessages, loadConversations]);

  // Abrir/iniciar conversa a partir de ?userId=... (ex.: botão "Contactar")
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
              job_id: null,
              other_user_id: targetId,
              other_user: otherUser,
              last_message: null,
              unread_count: 0,
            });
            setMessages([]);
          }
        }
      } catch (error) {
        console.error("Erro ao abrir conversa a partir do perfil:", error);
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete("userId");
        window.history.replaceState({}, "", url.toString());
      }
    })();
  }, [user, loading, conversations, archivedConversations]);

  if (loading) return <LoadingScreen />;

  const unreadTotal = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);
  const selectedJob = selectedConversation?.job_id ? jobsById[selectedConversation.job_id] : null;

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

      {/* Layout — em mobile mostra uma coluna de cada vez (#1005: back funcional) */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{
          width: "100%", maxWidth: 360, borderRight: `1px solid ${border}`,
          display: selectedConversation ? "none" : "flex", flexDirection: "column",
        }} className="md:!flex">
          <ConversationList
            conversations={conversations}
            archivedConversations={archivedConversations}
            selectedId={selectedConversation?.conversation_id}
            onSelect={setSelectedConversation}
            isDark={isDark}
            lang={lang}
            currentUser={user}
          />
        </div>

        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            job={selectedJob}
            messages={messages}
            currentUser={user}
            onSend={handleSendMessage}
            onBack={() => { setSelectedConversation(null); setMessages([]); }}
            locked={chatState.locked}
            lockedReason={chatState.reason}
            isDark={isDark}
            lang={lang}
          />
        ) : (
          <div className="hidden md:flex" style={{ flex: 1, alignItems: "center", justifyContent: "center", color: "var(--text2)", flexDirection: "column", gap: 12 }}>
            <MessageCircle size={48} />
            <p>{t(lang, "selectConversation", "Seleciona uma conversa")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
