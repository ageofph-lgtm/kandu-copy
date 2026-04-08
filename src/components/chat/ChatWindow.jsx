import React, { useState, useRef, useEffect } from "react";
import { UploadFile } from "@/integrations/Core";
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

  return (
    <>
      {/* Header */}
      <div style={{
        padding: '50px 16px 12px', display: 'flex', alignItems: 'center', gap: 12,
        background: '#111', borderBottom: '1px solid #333'
      }}>
        <button
          onClick={onBack}
          style={{
            fontSize: 22, color: '#FF6600', cursor: 'pointer', background: 'none',
            border: 'none', display: 'none'
          }}
          className="md:hidden"
        >
          ←
        </button>
        
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: '#FF6600',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFF', fontWeight: 'bold', fontSize: 13, flexShrink: 0
        }}>
          {conversation.other_user.full_name?.charAt(0) || '?'}
        </div>
        
        <div style={{ flex: 1 }}>
          <p style={{ color: '#FFF', fontWeight: 'bold', margin: 0, fontSize: 14 }}>
            {conversation.other_user.full_name || 'Utilizador'}
            {conversation.other_user.user_type === 'employer' && (' (Empregador)')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 10, color: '#22C55E' }}>●</span>
            <span style={{ color: '#AAA', fontSize: 11 }}>online</span>
          </div>
        </div>
        
        <span style={{ fontSize: 18, color: '#FF6600', cursor: 'pointer' }}>ℹ️</span>
      </div>

      {/* Job context banner */}
      {conversation.job_context && (
        <div style={{
          background: '#FF6600', padding: '8px 16px', display: 'flex', gap: 8,
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 14, color: '#FFF' }}>💼</span>
          <p style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13, margin: 0, flex: 1 }}>
            Chat ligado a: <strong>{conversation.job_context.job.title}</strong> · Ativo
          </p>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column',
        gap: 12, background: '#1A1A1A'
      }}>
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUser.id;
          
          return (
            <div key={message.id} style={{
              display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                background: isOwn ? '#FF6600' : '#2A2A2A',
                borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '10px 14px', maxWidth: '75%', fontSize: 14,
                color: '#FFF'
              }}>
                {message.message && (
                  <p style={{ margin: 0, wordBreak: 'break-word' }}>{message.message}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px 28px', background: '#1A1A1A', display: 'flex', gap: 10,
        alignItems: 'center', borderTop: '1px solid #333'
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          type="text"
          placeholder="Escreve uma mensagem..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            flex: 1, background: '#2A2A2A', borderRadius: 50, padding: '12px 16px',
            border: 'none', color: '#FFF', outline: 'none', fontSize: 14
          }}
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || isUploading}
          style={{
            width: 44, height: 44, borderRadius: '50%', background: '#FF6600',
            border: 'none', color: '#FFF', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: (!newMessage.trim() || isUploading) ? 0.5 : 1
          }}
        >
          ➤
        </button>
      </div>
    </>
  );
}