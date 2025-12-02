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
  Image as ImageIcon, 
  FileText,
  Shield,
  User
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
      // Mensagem do usuário atual
      if (currentUser.user_type === 'employer') {
        return {
          container: 'justify-end',
          bubble: 'bg-gray-800 text-white rounded-l-lg rounded-tr-lg',
          time: 'text-gray-300'
        };
      } else {
        return {
          container: 'justify-end',
          bubble: 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg',
          time: 'text-blue-100'
        };
      }
    } else {
      // Mensagem do outro usuário
      if (conversation.other_user.user_type === 'employer') {
        return {
          container: 'justify-start',
          bubble: 'bg-gray-800 text-white rounded-r-lg rounded-tl-lg border',
          time: 'text-gray-300'
        };
      } else {
        return {
          container: 'justify-start',
          bubble: 'bg-blue-500 text-white rounded-r-lg rounded-tl-lg border',
          time: 'text-blue-100'
        };
      }
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        <Avatar>
          <AvatarFallback className={`font-semibold ${
            conversation.other_user.user_type === 'employer' 
              ? 'bg-gray-700 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            {conversation.other_user.full_name?.charAt(0) || <User className="w-5 h-5" />}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">
              {conversation.other_user.full_name || "Utilizador"}
            </h3>
            {conversation.other_user.verified && (
              <Shield className="w-4 h-4 text-green-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${
                conversation.other_user.user_type === 'employer' 
                  ? 'bg-gray-100 text-gray-700 border-gray-300'
                  : 'bg-blue-100 text-blue-700 border-blue-300'
              }`}
            >
              {conversation.other_user.user_type === 'worker' ? 'Profissional' : 'Empregador'}
            </Badge>
            {conversation.other_user.city && (
              <span className="text-xs text-gray-500">
                {conversation.other_user.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUser.id;
          const style = getMessageStyle(message, isOwn);
          
          return (
            <div key={message.id} className={`flex ${style.container}`}>
              <div className={`max-w-xs md:max-w-md ${style.bubble} p-3 shadow-sm`}>
                {/* Avatar para mensagens do outro usuário */}
                {!isOwn && (
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className={`text-xs font-semibold ${
                        conversation.other_user.user_type === 'employer' 
                          ? 'bg-gray-600 text-white'
                          : 'bg-blue-400 text-white'
                      }`}>
                        {conversation.other_user.full_name?.charAt(0) || <User className="w-3 h-3" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs opacity-80">
                      {conversation.other_user.full_name || "Utilizador"}
                    </span>
                  </div>
                )}
                
                {/* Anexo */}
                {message.attachment_url && (
                  <div className="mb-2">
                    {message.attachment_type === 'image' ? (
                      <img 
                        src={message.attachment_url} 
                        alt="Anexo" 
                        className="max-w-full rounded cursor-pointer"
                        onClick={() => window.open(message.attachment_url, '_blank')}
                      />
                    ) : (
                      <a 
                        href={message.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-2 rounded ${
                          isOwn ? (currentUser.user_type === 'employer' ? 'bg-gray-700' : 'bg-blue-600') : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Documento</span>
                      </a>
                    )}
                  </div>
                )}
                
                {/* Mensagem */}
                {message.message && (
                  <p className="text-sm">{message.message}</p>
                )}
                
                {/* Timestamp */}
                <p className={`text-xs mt-1 ${style.time}`}>
                  {formatMessageTime(message.created_date)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <Input
            placeholder="Escreva uma mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          
          <Button 
            onClick={handleSend}
            disabled={!newMessage.trim() || isUploading}
            size="icon"
            className={`${
              currentUser.user_type === 'employer' 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {isUploading && (
          <p className="text-sm text-gray-500 mt-2">Enviando arquivo...</p>
        )}
      </div>
    </>
  );
}