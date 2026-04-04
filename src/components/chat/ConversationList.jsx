import React, { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Briefcase, Archive, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

function ConversationItem({ conversation, onSelect, selectedId }) {
  const isSelected = selectedId === conversation.conversation_id;
  const hasJobContext = !!conversation.job_context;

  const formatLastMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    if (diffInHours < 24) return format(date, "HH:mm", { locale: pt });
    return format(date, "dd/MM", { locale: pt });
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message || message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  return (
    <div
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-orange-50 border-l-2 border-l-[#F26522]' : ''
      }`}
      onClick={() => onSelect(conversation)}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="w-12 h-12">
            <AvatarFallback className={`font-semibold ${
              hasJobContext ? 'bg-gradient-to-br from-[#F26522] to-orange-600 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
            }`}>
              {conversation.other_user.full_name?.charAt(0) || <User className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
          {hasJobContext && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F26522] rounded-full flex items-center justify-center">
              <Briefcase className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">
                {conversation.other_user.full_name || "Utilizador"}
              </h3>
              {conversation.other_user.verified && (
                <Shield className="w-4 h-4 text-green-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatLastMessageTime(conversation.last_message.created_date)}
              </span>
              {conversation.unread_count > 0 && (
                <Badge className="bg-[#F26522] text-white min-w-[20px] h-5 p-0 text-xs rounded-full flex items-center justify-center">
                  {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                </Badge>
              )}
            </div>
          </div>

          {hasJobContext && (
            <p className="text-xs text-[#F26522] font-medium truncate mb-0.5">
              📋 {conversation.job_context.job.title}
            </p>
          )}

          <p className="text-sm text-gray-600 truncate">
            {conversation.last_message.attachment_url ? (
              <span className="flex items-center gap-1">📎 Anexo</span>
            ) : (
              truncateMessage(conversation.last_message.message)
            )}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-xs ${
              hasJobContext ? 'border-orange-300 text-orange-700 bg-orange-50' : ''
            }`}>
              {hasJobContext ? 'Obra em curso' : (conversation.other_user.user_type === 'worker' ? 'Profissional' : 'Empregador')}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConversationList({ conversations, archivedConversations = [], onSelect, selectedId }) {
  const [showArchived, setShowArchived] = useState(false);
  if (conversations.length === 0 && archivedConversations.length === 0) {
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
    <div className="overflow-y-auto flex-1">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.conversation_id}
          conversation={conversation}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}

      {archivedConversations.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(s => !s)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 hover:bg-gray-50 border-t border-gray-100"
          >
            <span className="flex items-center gap-1">
              <Archive className="w-3 h-3" />
              Arquivadas ({archivedConversations.length})
            </span>
            {showArchived ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showArchived && archivedConversations.map((conversation) => (
            <div key={conversation.conversation_id} className="opacity-50">
              <ConversationItem
                conversation={conversation}
                onSelect={onSelect}
                selectedId={selectedId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}