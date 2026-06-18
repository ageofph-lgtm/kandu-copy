import { toast } from "sonner";
import { useState, useRef, useEffect, useCallback } from "react";
import { UploadFile } from "@/api/integrations";
import { FileText, Languages } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useLanguage, translateText } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";

export default function ChatWindow({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  onBack
}) {
  const { lang } = useLanguage();
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [translations, setTranslations] = useState({}); // { [msgId]: translatedText }
  const [translating, setTranslating] = useState({}); // { [msgId]: bool }
  const [autoTranslate, setAutoTranslate] = useState(
    () => localStorage.getItem("kandu_auto_translate") === "true"
  );
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-tradução: quando chega nova mensagem de outro utilizador
  useEffect(() => {
    if (!autoTranslate || lang === "PT") return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    if (lastMsg.sender_id === currentUser?.id) return; // é nossa — não traduzir
    if (translations[lastMsg.id]) return; // já traduzida
    translateSingle(lastMsg.id, lastMsg.message);
  }, [messages, autoTranslate, lang]); // eslint-disable-line

  const translateSingle = useCallback(async (msgId, text) => {
    if (!text || lang === "PT") return;
    setTranslating(prev => ({ ...prev, [msgId]: true }));
    const result = await translateText(text, lang, "PT");
    setTranslations(prev => ({ ...prev, [msgId]: result }));
    setTranslating(prev => ({ ...prev, [msgId]: false }));
  }, [lang]);

  const toggleAutoTranslate = () => {
    const next = !autoTranslate;
    setAutoTranslate(next);
    localStorage.setItem("kandu_auto_translate", String(next));
    toast.success(next ? t(lang, "autoTranslateChat") : t(lang, "originalMessage"));
  };

  const handleSend = async () => {
    const text = newMessage.trim();
    if (text) {
      setNewMessage("");
      await onSendMessage(text);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const attachmentType = file.type.startsWith("image/") ? "image" : "document";
      await onSendMessage(`Enviou um ${attachmentType === "image" ? "imagem" : "documento"}`, {
        url: file_url,
        type: attachmentType,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(t(lang, "fileSendError", "Erro ao enviar arquivo"));
    }
    setIsUploading(false);
  };

  const formatMessageTime = (dateString) => {
    return format(new Date(dateString), "HH:mm", { locale: pt });
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#1A1A1A"}}>
      {/* Top Bar */}
      <div style={{padding:"50px 16px 12px",background:"#111",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#F4621F",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>←</button>
        <div style={{width:36,height:36,borderRadius:"50%",background:"#F4621F",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#FFF",flexShrink:0}}>
          {conversation.other_user.full_name?.charAt(0) || "?"}
        </div>
        <div style={{flex:1}}>
          <p style={{fontWeight:700,fontSize:14,color:"#FFF",margin:0}}>{conversation.other_user.full_name || t(lang, "userLabel", "Utilizador")}</p>
          <p style={{fontSize:11,color:"#22C55E",margin:0}}>● online</p>
        </div>
        {/* Botão de auto-tradução */}
        <button
          onClick={toggleAutoTranslate}
          title={t(lang, "autoTranslateChat")}
          style={{
            background: autoTranslate ? "rgba(244,98,31,0.18)" : "transparent",
            border: autoTranslate ? "1px solid #F4621F" : "1px solid #333",
            borderRadius:8, padding:"5px 8px", cursor:"pointer",
            display:"flex", alignItems:"center", gap:4,
            color: autoTranslate ? "#F4621F" : "#666",
            transition:"all 0.18s",
          }}
        >
          <Languages size={14}/>
          <span style={{fontSize:10,fontWeight:700}}>{lang}</span>
        </button>
      </div>

      {/* Job context banner */}
      {conversation.job_context && (
        <div style={{background:"#F4621F",padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:16}}>💼</span>
          <span style={{fontWeight:700,color:"#FFF",fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{conversation.job_context.job.title}</span>
          <span style={{color:"#FFF",fontSize:12,opacity:0.8}}>{`· `}{t(lang, "active", "Ativo")}</span>
        </div>
      )}

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUser?.id;
          const translated = translations[message.id];
          const isTranslating = translating[message.id];
          const showTranslated = !isOwn && translated && autoTranslate;

          return (
            <div key={message.id} style={{display:"flex",justifyContent:isOwn?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"75%",display:"flex",flexDirection:"column",gap:3}}>
                {/* Bubble */}
                <div style={{
                  padding:"10px 14px",
                  background: isOwn ? "#F4621F" : "#fff",
                  color: isOwn ? "#fff" : "#111",
                  borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  fontSize:14, lineHeight:1.5,
                  boxShadow:"0 1px 4px rgba(0,0,0,0.12)",
                }}>
                  {message.attachment_url ? (
                    message.attachment_type === "image" ? (
                      <img src={message.attachment_url} alt="" style={{maxWidth:200,borderRadius:8,display:"block"}}/>
                    ) : (
                      <a href={message.attachment_url} target="_blank" rel="noopener noreferrer"
                        style={{color:isOwn?"#fff":"#F4621F",display:"flex",alignItems:"center",gap:6}}>
                        <FileText size={14}/> {t(lang, "documentLabel", "Documento")}
                      </a>
                    )
                  ) : (
                    <>
                      <div>{message.message}</div>
                      {/* Tradução */}
                      {!isOwn && (
                        <>
                          {isTranslating && (
                            <div style={{marginTop:6,fontSize:11,color:isOwn?"rgba(255,255,255,0.6)":"#aaa",fontStyle:"italic"}}>
                              {t(lang,"translating")}
                            </div>
                          )}
                          {showTranslated && !isTranslating && translated !== message.message && (
                            <div style={{
                              marginTop:6, paddingTop:6,
                              borderTop:`1px solid ${isOwn?"rgba(255,255,255,0.2)":"#eee"}`,
                              fontSize:12,
                              color: isOwn ? "rgba(255,255,255,0.85)" : "#555",
                              fontStyle:"italic",
                            }}>
                              <span style={{fontSize:10,color:"#F4621F",fontWeight:700,fontStyle:"normal",marginRight:4}}>
                                {lang} ·
                              </span>
                              {translated}
                            </div>
                          )}
                          {/* Botão traduzir manual (quando auto desligado) */}
                          {!autoTranslate && !translated && lang !== "PT" && (
                            <button
                              onClick={() => translateSingle(message.id, message.message)}
                              style={{
                                marginTop:5, background:"none", border:"none",
                                color:"#F4621F", fontSize:11, cursor:"pointer",
                                padding:0, fontFamily:"inherit", fontWeight:600,
                                display:"flex", alignItems:"center", gap:3,
                              }}
                            >
                              <Languages size={10}/> {t(lang,"translateMessage")}
                            </button>
                          )}
                          {/* Mostrar original quando tem tradução */}
                          {translated && !autoTranslate && (
                            <div style={{marginTop:5, fontSize:11, color:isOwn?"rgba(255,255,255,0.7)":"#555", fontStyle:"italic"}}>
                              {translated}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
                {/* Timestamp */}
                <div style={{fontSize:10,color:"#555",textAlign:isOwn?"right":"left",paddingInline:4}}>
                  {formatMessageTime(message.created_date)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"12px 16px",background:"#111",borderTop:"1px solid #222",display:"flex",alignItems:"center",gap:10}}>
        <input
          ref={fileInputRef} type="file" style={{display:"none"}}
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:20,padding:0,flexShrink:0,lineHeight:1}}
        >
          📎
        </button>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t(lang, "typeMessage")}
          style={{
            flex:1, background:"#1a1a1a", border:"1px solid #2a2a2a",
            borderRadius:20, padding:"10px 16px", color:"#fff",
            fontSize:14, outline:"none", fontFamily:"inherit",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          style={{
            background:newMessage.trim()?"#F4621F":"#222",
            border:"none", borderRadius:"50%",
            width:40, height:40, cursor:newMessage.trim()?"pointer":"default",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"background 0.18s", flexShrink:0,
          }}
        >
          <span style={{color:"#fff",fontSize:18,lineHeight:1}}>↑</span>
        </button>
      </div>
    </div>
  );
}