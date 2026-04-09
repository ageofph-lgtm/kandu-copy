import React, { useState, useRef, useEffect } from "react";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Send, 
  Paperclip,
  FileText,
  Shield,
  User,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function ChatWindow({ 
  conversation, 
  messages, 
  currentUser, 
  onSendMessage, 
  onBack
}) {
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (newMessage.trim()) {
      await onSendMessage(newMessage);
      setNewMessage("");
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
      const attachmentType = file.type.startsWith('image/') ? 'image' : 'document';
      
      await onSendMessage(`Enviou um ${attachmentType === 'image' ? 'imagem' : 'documento'}`, {
        url: file_url,
        type: attachmentType
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Erro ao enviar arquivo");
    }
    setIsUploading(false);
  };

  const formatMessageTime = (dateString) => {
    return format(new Date(dateString), "HH:mm", { locale: pt });
  };

  const getMessageStyle = (message, isOwn) => {
    if (isOwn) {
      return {
        container: 'justify-end',
        bubble: 'bg-[#F26522] text-white rounded-l-2xl rounded-tr-2xl',
        time: 'text-orange-200'
      };
    }
    return {
      container: 'justify-start',
      bubble: 'bg-white text-gray-900 rounded-r-2xl rounded-tl-2xl shadow-sm border border-gray-100',
      time: 'text-gray-400'
    };
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#1A1A1A"}}>
      {/* Top Bar */}
      <div style={{padding:"50px 16px 12px",background:"#111",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#FF6600",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>←</button>
        <div style={{width:36,height:36,borderRadius:"50%",background:"#FF6600",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#FFF",flexShrink:0}}>
          {conversation.other_user.full_name?.charAt(0) || "?"}
        </div>
        <div style={{flex:1}}>
          <p style={{fontWeight:700,fontSize:14,color:"#FFF",margin:0}}>{conversation.other_user.full_name || "Utilizador"}</p>
          <p style={{fontSize:11,color:"#22C55E",margin:0}}>● online</p>
        </div>
        <span style={{color:"#FF6600",fontSize:18,marginLeft:"auto",cursor:"pointer"}}>ℹ️</span>
      </div>

      {/* Job context banner */}
      {conversation.job_context && (
        <div style={{background:"#FF6600",padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:16}}>💼</span>
          <span style={{fontWeight:700,color:"#FFF",fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{conversation.job_context.job.title}</span>
          <span style={{color:"#FFF",fontSize:12,opacity:0.8}}>· Ativo</span>
        </div>
      )}

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUser.id;
          return (
            <div key={message.id} style={{display:"flex",justifyContent:isOwn?"flex-end":"flex-start"}}>
              <div style={{alignSelf:isOwn?"flex-end":"flex-start",background:isOwn?"#FF6600":"#2A2A2A",borderRadius:isOwn?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",maxWidth:"75%",color:"#FFF",fontSize:14}}>
                {message.attachment_url && (
                  <div style={{marginBottom:6}}>
                    {message.attachment_type === 'image' ? (
                      <img src={message.attachment_url} alt="Anexo" style={{maxWidth:"100%",borderRadius:8,cursor:"pointer"}} onClick={() => window.open(message.attachment_url,'_blank')} />
                    ) : (
                      <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:6,color:"#FFF",fontSize:12}}>
                        <FileText style={{width:14,height:14}} /> Documento
                      </a>
                    )}
                  </div>
                )}
                {message.message && <p style={{margin:0}}>{message.message}</p>}
                <p style={{fontSize:10,margin:"4px 0 0",opacity:0.7,textAlign:isOwn?"right":"left"}}>{formatMessageTime(message.created_date)}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom bar */}
      <div style={{padding:"12px 16px 28px",background:"#1A1A1A",display:"flex",gap:10,alignItems:"center"}}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          style={{display:"none"}}
        />
        <input
          placeholder="Escreve uma mensagem..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{flex:1,background:"#2A2A2A",borderRadius:50,padding:"12px 16px",border:"none",color:"#FFF",outline:"none",fontSize:14}}
        />
        <button onClick={handleSend} disabled={!newMessage.trim()||isUploading}
          style={{width:44,height:44,background:newMessage.trim()&&!isUploading?"#FF6600":"#333",borderRadius:"50%",color:"#FFF",fontSize:18,border:"none",cursor:newMessage.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          ➤
        </button>
      </div>
    </div>
  );
}