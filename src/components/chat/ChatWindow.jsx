import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useState, useRef, useEffect, useCallback } from "react";
import { UploadFile } from "@/api/integrations";
import { FileText, Languages, Lock, Check, CheckCheck, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useLanguage, translateText } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";
import { validateFile, DOC_MIME_TYPES } from "@/lib/validation";

/** Limite de caracteres por mensagem (#72). */
export const MAX_MESSAGE_LENGTH = 1000;

export default function ChatWindow({
  conversation,
  job,
  messages,
  currentUser,
  onSend,
  onBack,
  locked = false,
  lockedReason = "",
}) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [translations, setTranslations] = useState({});
  const [translating, setTranslating] = useState({});
  const [autoTranslate, setAutoTranslate] = useState(
    () => localStorage.getItem("kandu_auto_translate") === "true"
  );
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const translateSingle = useCallback(async (msgId, text) => {
    if (!text || lang === "PT") return;
    setTranslating(prev => ({ ...prev, [msgId]: true }));
    const result = await translateText(text, lang, "PT");
    setTranslations(prev => ({ ...prev, [msgId]: result }));
    setTranslating(prev => ({ ...prev, [msgId]: false }));
  }, [lang]);

  // Auto-tradução: quando chega nova mensagem de outro utilizador
  useEffect(() => {
    if (!autoTranslate || lang === "PT") return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    if (lastMsg.sender_id === currentUser?.id) return;
    if (translations[lastMsg.id]) return;
    translateSingle(lastMsg.id, lastMsg.content);
  }, [messages, autoTranslate, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAutoTranslate = () => {
    const next = !autoTranslate;
    setAutoTranslate(next);
    localStorage.setItem("kandu_auto_translate", String(next));
    toast.success(next ? t(lang, "autoTranslateChat") : t(lang, "originalMessage"));
  };

  const handleSend = async () => {
    if (locked) { toast.error(lockedReason); return; }
    const text = newMessage.trim();
    if (!text || isSending) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      toast.error(`A mensagem excede o limite de ${MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }
    setIsSending(true);
    setNewMessage("");
    try { await onSend(text); }
    finally { setIsSending(false); }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (locked) { toast.error(lockedReason); return; }

    // #39 — validação de formato também nos anexos do chat
    const check = validateFile(file, { accept: DOC_MIME_TYPES });
    if (!check.ok) { toast.error(check.error); return; }

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const attachmentType = file.type.startsWith("image/") ? "image" : "document";
      await onSend(attachmentType === "image" ? "📷 Imagem" : `📎 ${file.name}`, {
        url: file_url,
        type: attachmentType,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(t(lang, "fileSendError", "Erro ao enviar arquivo"));
    }
    setIsUploading(false);
  };

  const formatMessageTime = (dateString) => format(new Date(dateString), "HH:mm", { locale: pt });

  const remaining = MAX_MESSAGE_LENGTH - newMessage.length;
  const overLimit = remaining < 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", flex: 1, background: "#1A1A1A" }}>
      {/* Top Bar */}
      <div style={{ padding: "50px 16px 12px", background: "#111", display: "flex", alignItems: "center", gap: 12 }}>
        {/* #1005 — o botão Back estava sem handler ligado */}
        <button onClick={() => (onBack ? onBack() : navigate(-1))} aria-label="Voltar"
          style={{ background: "none", border: "none", color: "#F4621F", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
          <ArrowLeft size={22} />
        </button>
        <div
          onClick={() => navigate(`${createPageUrl("Profile")}?userId=${conversation.other_user.id}`)}
          style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer", borderRadius: 8, padding: "4px 6px" }}
        >
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F4621F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#FFF", flexShrink: 0, overflow: "hidden" }}>
            {conversation.other_user.avatar_url
              ? <img src={conversation.other_user.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              : conversation.other_user.full_name?.charAt(0) || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#FFF", margin: 0 }}>
              {conversation.other_user.full_name || t(lang, "userLabel", "Utilizador")}
              <span style={{ fontSize: 10, color: "#F4621F", marginLeft: 6 }}>ver perfil →</span>
            </p>
            {job && <p style={{ fontSize: 11, color: "#8A909A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📋 {job.title}</p>}
          </div>
        </div>
        <button onClick={toggleAutoTranslate} title={t(lang, "autoTranslateChat")}
          style={{
            background: autoTranslate ? "rgba(244,98,31,0.18)" : "transparent",
            border: autoTranslate ? "1px solid #F4621F" : "1px solid #333",
            borderRadius: 8, padding: "5px 8px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
            color: autoTranslate ? "#F4621F" : "#666",
          }}>
          <Languages size={14} />
          <span style={{ fontSize: 10, fontWeight: 700 }}>{lang}</span>
        </button>
      </div>

      {/* Banner de contexto da obra */}
      {job && (
        <div style={{
          background: locked ? "#3a2a2a" : "#F4621F",
          padding: "8px 16px", display: "flex", gap: 8, alignItems: "center",
        }}>
          <span style={{ fontSize: 16 }}>💼</span>
          <span style={{ fontWeight: 700, color: "#FFF", fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {job.title}
          </span>
          <span style={{ color: "#FFF", fontSize: 12, opacity: 0.85 }}>
            · {job.status === "completed" ? "Concluída" : job.status === "cancelled" ? "Cancelada" : job.status === "in_progress" ? "Em curso" : "Ativa"}
          </span>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUser?.id;
          const translated = translations[message.id];
          const isTranslating = translating[message.id];
          const showTranslated = !isOwn && translated && autoTranslate;

          return (
            <div key={message.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{
                  padding: "10px 14px",
                  background: isOwn ? "#F4621F" : "#fff",
                  color: isOwn ? "#fff" : "#111",
                  borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  fontSize: 14, lineHeight: 1.5,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                  wordBreak: "break-word",
                }}>
                  {message.attachment_url ? (
                    message.attachment_type === "image" ? (
                      <img src={message.attachment_url} alt="" style={{ maxWidth: 200, borderRadius: 8, display: "block" }} />
                    ) : (
                      <a href={message.attachment_url} target="_blank" rel="noopener noreferrer"
                        style={{ color: isOwn ? "#fff" : "#F4621F", display: "flex", alignItems: "center", gap: 6 }}>
                        <FileText size={14} /> {message.content || t(lang, "documentLabel", "Documento")}
                      </a>
                    )
                  ) : (
                    <>
                      <div>{message.content}</div>
                      {!isOwn && (
                        <>
                          {isTranslating && (
                            <div style={{ marginTop: 6, fontSize: 11, color: "#aaa", fontStyle: "italic" }}>
                              {t(lang, "translating")}
                            </div>
                          )}
                          {showTranslated && !isTranslating && translated !== message.content && (
                            <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #eee", fontSize: 12, color: "#555", fontStyle: "italic" }}>
                              <span style={{ fontSize: 10, color: "#F4621F", fontWeight: 700, fontStyle: "normal", marginRight: 4 }}>{lang} ·</span>
                              {translated}
                            </div>
                          )}
                          {!autoTranslate && !translated && lang !== "PT" && (
                            <button onClick={() => translateSingle(message.id, message.content)}
                              style={{ marginTop: 5, background: "none", border: "none", color: "#F4621F", fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                              <Languages size={10} /> {t(lang, "translateMessage")}
                            </button>
                          )}
                          {translated && !autoTranslate && (
                            <div style={{ marginTop: 5, fontSize: 11, color: "#555", fontStyle: "italic" }}>{translated}</div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Timestamp + estado de entrega (#73) */}
                <div style={{ fontSize: 10, color: "#555", textAlign: isOwn ? "right" : "left", paddingInline: 4, display: "flex", gap: 4, justifyContent: isOwn ? "flex-end" : "flex-start", alignItems: "center" }}>
                  {formatMessageTime(message.created_at)}
                  {isOwn && (
                    message.seen_at || message.read
                      ? <span title="Vista" style={{ color: "#3B82F6", display: "inline-flex" }}><CheckCheck size={13} /></span>
                      : message.delivered_at
                        ? <span title="Entregue" style={{ display: "inline-flex" }}><CheckCheck size={13} /></span>
                        : <span title="Enviada" style={{ display: "inline-flex" }}><Check size={13} /></span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — bloqueado quando a obra fechou ou o limite foi atingido */}
      {locked ? (
        <div style={{ padding: "14px 16px", background: "#111", borderTop: "1px solid #222", display: "flex", alignItems: "center", gap: 10 }}>
          <Lock size={16} color="#8A909A" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, color: "#8A909A", fontSize: 13, lineHeight: 1.5 }}>{lockedReason}</p>
        </div>
      ) : (
        <div style={{ padding: "12px 16px", background: "#111", borderTop: "1px solid #222" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input ref={fileInputRef} type="file" style={{ display: "none" }}
              onChange={handleFileUpload} accept="application/pdf,image/jpeg,image/png" />
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} aria-label="Anexar ficheiro"
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20, padding: 0, flexShrink: 0, lineHeight: 1 }}>
              📎
            </button>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH + 1))}
              onKeyPress={handleKeyPress}
              maxLength={MAX_MESSAGE_LENGTH + 1}
              placeholder={t(lang, "typeMessage")}
              style={{
                flex: 1, background: "#1a1a1a",
                border: `1px solid ${overLimit ? "#ef4444" : "#2a2a2a"}`,
                borderRadius: 20, padding: "10px 16px", color: "#fff",
                fontSize: 14, outline: "none", fontFamily: "inherit",
              }}
            />
            <button onClick={handleSend} disabled={!newMessage.trim() || overLimit || isSending} aria-label="Enviar"
              style={{
                background: newMessage.trim() && !overLimit ? "#F4621F" : "#222",
                border: "none", borderRadius: "50%", width: 40, height: 40,
                cursor: newMessage.trim() && !overLimit ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
              <span style={{ color: "#fff", fontSize: 18, lineHeight: 1 }}>↑</span>
            </button>
          </div>
          {/* Contador de caracteres (#72) */}
          {newMessage.length > MAX_MESSAGE_LENGTH * 0.8 && (
            <p style={{ margin: "6px 4px 0", fontSize: 11, textAlign: "right", color: overLimit ? "#ef4444" : "#8A909A" }}>
              {remaining} caracteres restantes
            </p>
          )}
        </div>
      )}
    </div>
  );
}
