import React, { useState, useEffect, useCallback } from "react";
import { Notification } from "@/entities/Notification";
import { User } from "@/entities/User";
import { Bell, Briefcase, Star, MapPin, MessageCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

const TYPE_CONFIG = {
  new_application:  { icon: Briefcase, color: "text-[#F26522]", bg: "bg-[#F26522]/10" },
  new_proposal:     { icon: Briefcase, color: "text-[#F26522]", bg: "bg-[#F26522]/10" },
  job_accepted:     { icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10" },
  job_rejected:     { icon: CheckCircle, color: "text-red-400", bg: "bg-red-400/10" },
  new_message:      { icon: MessageCircle, color: "text-gray-400", bg: "bg-gray-400/10" },
  job_started:      { icon: MapPin, color: "text-[#F26522]", bg: "bg-[#F26522]/10" },
  job_completed:    { icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  job_ready_for_review: { icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10" },
};

function NotifCard({ notif, onMarkRead, onDelete }) {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[notif.type] || { icon: Bell, color: "text-[#F26522]", bg: "bg-[#F26522]/10" };
  const Icon = cfg.icon;

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notif.created_date), { addSuffix: false, locale: pt });
    } catch { return ""; }
  })();

  const handleClick = () => {
    if (!notif.is_read) onMarkRead(notif);
    if (notif.action_url) navigate(notif.action_url);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-4 bg-[#232323] rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-transform border-l-4 ${notif.is_read ? 'border-transparent opacity-60' : 'border-[#F26522]'}`}
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon className={`w-5 h-5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-bold text-sm leading-tight ${notif.is_read ? 'text-gray-300' : 'text-white'}`}>{notif.title}</p>
          <span className="text-xs text-gray-500 shrink-0">{timeAgo}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 leading-snug">{notif.message}</p>
        {!notif.is_read && (
          <span className="inline-block w-2 h-2 rounded-full bg-[#F26522] mt-2" />
        )}
      </div>
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const u = await User.me();
      setUser(u);
      const list = u.user_type === 'admin'
        ? await Notification.list("-created_date")
        : await Notification.filter({ user_id: u.id }, "-created_date");
      setNotifications(list);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (notif) => {
    await Notification.update(notif.id, { is_read: true });
    load();
  };

  const handleDelete = async (notif) => {
    await Notification.delete(notif.id);
    load();
  };

  const handleMarkAll = async () => {
    for (const n of notifications.filter(n => !n.is_read)) {
      await Notification.update(n.id, { is_read: true });
    }
    load();
  };

  const unread = notifications.filter(n => !n.is_read);

  return (
    <div className="min-h-screen bg-[#1a1a1a] pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-white">Notificações</h1>
          {unread.length > 0 && (
            <span className="w-8 h-8 bg-[#F26522] rounded-full flex items-center justify-center text-white text-sm font-bold">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <button onClick={handleMarkAll} className="text-xs text-[#F26522] font-semibold">
            Marcar todas
          </button>
        )}
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#F26522] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Sem notificações</p>
          </div>
        ) : (
          notifications.map(n => (
            <NotifCard key={n.id} notif={n} onMarkRead={handleMarkRead} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}