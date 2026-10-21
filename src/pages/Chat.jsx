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
const CLOSED_JOB_STATUS = ["completed", "cancelled", "closed", "expired"];

/** Estados de candidatura que contam como "aceite" (abre o chat sem limite). */
const ACCEPTED_APP_STATUS = ["accepted", "in_progress", "completed"];

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

    // ── Limite de mensagens antes da aceitação (#88, #90, #91, #93) ──
    // Obra: cada lado envia NO MÁXIMO 1 mensagem até a candidatura ser aceite
    //   ("Aceitar e Contratar"). Antes bastava o outro lado responder para
    //   abrir o chat, o que deixava enviar várias mensagens antes da aceitação.
    // Direto (sem obra): a 1.ª mensagem é um convite; o chat abre quando o
    //   outro lado responde (a resposta é a aceitação).
    const mine = messages.filter(m => m.sender_id === user.id).length;
    const theirs = messages.filter(m => m.sender_id !== user.id).length;

    if (conv.job_id) {
      const hired = job && job.worker_id && (job.worker_id === user.id || job.worker_id === conv.other_user_id);
      const accepted = hired || applications.some(a =>
        a.job_id === conv.job_id &&
        [a.worker_id, a.employer_id].includes(user.id) &&
        [a.worker_id, a.employer_id].includes(conv.other_user_id) &&
        ACCEPTED_APP_STATUS.includes(a.status)
      );
      if (!accepted && mine >= PRE_ACCEPT_MESSAGE_LIMIT) {
        return {
          locked: true,
          reason: theirs === 0
            ? "Já enviaste a tua mensagem. Só podes enviar 1 mensagem até a candidatura ser aceite — aguarda a resposta."
            : "Limite atingido: 1 mensagem por pessoa até a candidatura ser aceite. Depois de \"Aceitar e Contratar\" o chat abre sem limites.",
          softLimit: true,
        };
      }
    } else if (mine >= PRE_ACCEPT_MESSAGE_LIMIT && theirs === 0) {
      return {
        locked: true,
        reason: "Só podes enviar 1 mensagem até a outra pessoa responder. Aguarda a resposta.",
        softLimit: true,
      };
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
      // Regras impostas pelo servidor (trigger enforce_chat_rules) → mensagem clara
      const raw = String(err?.message || err?.details || "");
      const friendly =
        raw.includes("CHAT_LIMIT") ? raw.replace(/^.*CHAT_LIMIT:\s*/, "") :
        raw.includes("CHAT_CLOSED") ? "Esta obra já terminou. O chat foi desativado." :
        raw.includes("CHAT_ARCHIVED") ? `Conversa arquivada — sem atividade há mais de ${CHAT_ARCHIVE_DAYS} dias.` :
        null;
      toast.error(friendly || "Erro ao enviar mensagem: " + raw);
      // Ressincronizar — o estado local pode estar desfasado do servidor
      loadMessages(selectedConversation, user);
    }
  };

  useEffect(() => { loadUser().then(u => { if (u) loadConversations(u); }); }, [loadUser, loadConversations]);

  useEffect(() => {
    if (selectedConversation && user) loadMessages(selectedConversation, user);
    // Conversa aberta a partir de ?jobId= ainda sem mensagens → carregar a obra
    const jid = selectedConversation?.job_id;
    if (jid && !jobsById[jid]) {
      Job.get(jid).then(j => { if (j) setJobsById(prev => ({ ...prev, [j.id]: j })); }).catch(() => {});
    }
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
      // #F7 — filtrar por mensagens ENVIADAS por mim (confirmações de leitura/entrega
      // que o outro lado escreve). Sem filtro, o cliente recebia UPDATEs de toda a gente.
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `sender_id=eq.${user.id}` },
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
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("userId");
    const targetJobId = params.get("jobId") || null;
    if (!targetId || targetId === user.id) return;
    openedFromParam.current = true;

    (async () => {
      try {
        const existing = [...conversations, ...archivedConversations].find(
          (c) => c.other_user?.id === targetId && (c.job_id || null) === targetJobId
        );
        if (existing) {
          setSelectedConversation(existing);
        } else {
          const [otherUser] = await User.filter({ id: targetId });
          if (otherUser) {
            setSelectedConversation({
              conversation_id: makeConvId(user.id, targetId, targetJobId),
              job_id: targetJobId,
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
        url.searchParams.delete("jobId");
        window.history.replaceState({}, "", url.toString());
      }
    })();
  }, [user, loading, conversations, archivedConversations]);

  // #1005 — em mobile, o botão "voltar" (hardware/browser) deve fechar a
  // conversa e mostrar a lista, não sair do Chat. Empilhamos um estado de
  // histórico ao abrir e consumimo-lo no popstate.
  const closeConversation = useCallback(() => { setSelectedConversation(null); setMessages([]); }, []);
  const openConversation = useCallback((conv) => {
    if (!conv) return;
    if (!selectedRef.current) window.history.pushState({ kanduChat: true }, "");
    setSelectedConversation(conv);
  }, []);
  useEffect(() => {
    const onPop = () => { if (selectedRef.current) closeConversation(); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [closeConversation]);
  const handleBack = () => {
    if (window.history.state?.kanduChat) window.history.back();
    else closeConversation();
  };

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
            onSelect={openConversation}
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
            onBack={handleBack}
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
