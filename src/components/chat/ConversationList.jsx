import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, User } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function ConversationList({ conversations, onSelect, selectedId }) {
  const formatLastMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, "HH:mm", { locale: pt });
    } else {
      return format(date, "dd/MM", { locale: pt });
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Nenhuma conversa ainda</p>
          <p className="text-sm text-gray-400 mt-1">
            As conversas aparecerão aqui quando candidatar-se a obras
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {conversations.map((conversation) => (
        <div
          key={conversation.conversation_id}
          className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedId === conversation.conversation_id ? 'bg-blue-50 border-blue-200' : ''
          }`}
          onClick={() => onSelect(conversation)}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {conversation.other_user.full_name?.charAt(0) || <User className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>

            {/* Conteúdo da conversa */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 truncate">
                    {conversation.other_user.full_name || "Utilizador"}
                  </h3>
                  {conversation.other_user.verified && (
                    <Shield className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatLastMessageTime(conversation.last_message.created_date)}
                  </span>
                  {conversation.unread_count > 0 && (
                    <Badge className="bg-blue-500 text-white min-w-[20px] h-5 p-0 text-xs rounded-full flex items-center justify-center">
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Última mensagem */}
              <p className="text-sm text-gray-600 truncate">
                {conversation.last_message.attachment_url ? (
                  <span className="flex items-center gap-1">
                    📎 Anexo
                  </span>
                ) : (
                  truncateMessage(conversation.last_message.message)
                )}
              </p>

              {/* Info adicional */}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
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
        </div>
      ))}
    </div>
  );
}