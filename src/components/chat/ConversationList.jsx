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
      onClick={() => onSelect(conversation)}
      style={{padding:"12px 16px",borderBottom:"1px solid #222",cursor:"pointer",background:isSelected?"#FF660022":"transparent",borderLeft:isSelected?"3px solid #FF6600":"3px solid transparent"}}
    >
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{position:"relative",flexShrink:0}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:hasJobContext?"#FF6600":"#444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#FFF"}}>
            {conversation.other_user.full_name?.charAt(0) || "?"}
          </div>
          {conversation.unread_count > 0 && (
            <span style={{position:"absolute",top:-4,right:-4,background:"#FF6600",color:"#FFF",borderRadius:"50%",minWidth:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </span>
          )}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
            <p style={{fontWeight:600,fontSize:14,color:"#FFF",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{conversation.other_user.full_name || "Utilizador"}</p>
            <span style={{fontSize:11,color:"#555",flexShrink:0,marginLeft:8}}>{formatLastMessageTime(conversation.last_message.created_date)}</span>
          </div>
          {hasJobContext && <p style={{fontSize:11,color:"#FF6600",margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📋 {conversation.job_context.job.title}</p>}
          <p style={{fontSize:13,color:"#666",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {conversation.last_message.attachment_url ? "📎 Anexo" : truncateMessage(conversation.last_message.message)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConversationList({ conversations, archivedConversations = [], onSelect, selectedId }) {
  const [showArchived, setShowArchived] = useState(false);
  if (conversations.length === 0 && archivedConversations.length === 0) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200}}>
        <div style={{textAlign:"center"}}>
          <p style={{color:"#555"}}>Nenhuma conversa ainda</p>
          <p style={{fontSize:12,color:"#444",marginTop:4}}>As conversas aparecem aqui quando te candidatares</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{overflowY:"auto",flex:1}}>
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