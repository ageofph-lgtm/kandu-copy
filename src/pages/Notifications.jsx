import React, { useState, useEffect, useCallback } from "react";
import { Notification } from "@/entities/Notification";
import { User } from "@/entities/User";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  CheckCircle,
  MessageCircle,
  FileText,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

function NotificationItem({ notification, onMarkAsRead }) {
  const navigate = useNavigate();

  const getNotificationConfig = (type) => {
    switch(type) {
      case 'new_application':
      case 'new_proposal':
        return { icon: FileText, color: 'bg-[var(--primary)]', label: 'Proposta' };
      case 'job_accepted':
        return { icon: CheckCircle, color: 'bg-green-500', label: 'Aceite' };
      case 'job_rejected':
        return { icon: AlertCircle, color: 'bg-red-500', label: 'Recusada' };
      case 'new_message':
        return { icon: MessageCircle, color: 'bg-blue-500', label: 'Mensagem' };
      case 'job_started':
        return { icon: FileText, color: 'bg-yellow-500', label: 'Iniciada' };
      case 'job_completed':
        return { icon: CheckCircle, color: 'bg-green-500', label: 'Concluída' };
      case 'payment':
        return { icon: DollarSign, color: 'bg-emerald-500', label: 'Pagamento' };
      default:
        return { icon: Bell, color: 'bg-[var(--surface-secondary)]', label: 'Alerta' };
    }
  };

  const config = getNotificationConfig(notification.type);
  const IconComponent = config.icon;

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const timeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative flex items-start gap-4 p-4 cursor-pointer transition-colors border-b border-[var(--border)] ${
        notification.is_read 
          ? 'bg-[var(--background)]' 
          : 'bg-[var(--surface)]'
      } hover:bg-[var(--surface-secondary)]`}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--primary)]" style={{ boxShadow: '0 0 10px rgba(236, 127, 19, 0.5)' }} />
      )}

      {/* Hexagonal Icon */}
      <div className={`w-12 h-12 hexagon ${config.color} flex items-center justify-center flex-shrink-0`}>
        <IconComponent className="w-5 h-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`font-semibold text-[var(--text-primary)] ${!notification.is_read ? 'font-bold' : ''}`}>
            {notification.title}
          </h4>
          <span className={`text-xs whitespace-nowrap ${!notification.is_read ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
            {timeAgo(notification.created_date)}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
          {notification.message}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 self-center" />
    </div>
  );
}

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      let notificationList;
      if (userData.user_type === 'admin') {
        notificationList = await Notification.list("-created_date");
      } else {
        notificationList = await Notification.filter(
          { user_id: userData.id }, 
          "-created_date"
        );
      }

      setNotifications(notificationList);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkAsRead = async (notification) => {
    try {
      await Notification.update(notification.id, { is_read: true });
      loadData();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      for (const notification of unreadNotifications) {
        await Notification.update(notification.id, { is_read: true });
      }
      loadData();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'proposals') return ['new_application', 'new_proposal'].includes(n.type);
    if (filter === 'messages') return n.type === 'new_message';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Group by date
  const today = new Date();
  const todayNotifs = filteredNotifications.filter(n => {
    const date = new Date(n.created_date);
    return date.toDateString() === today.toDateString();
  });
  const yesterdayNotifs = filteredNotifications.filter(n => {
    const date = new Date(n.created_date);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  });
  const olderNotifs = filteredNotifications.filter(n => {
    const date = new Date(n.created_date);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return date < yesterday;
  });

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">A carregar notificações...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Notificações</h1>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-[var(--primary)] text-sm font-semibold hover:opacity-80"
            >
              Marcar todas lidas
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-4">
          <div className="flex h-10 items-center rounded-lg bg-[var(--surface-secondary)] p-1">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'proposals', label: 'Propostas' },
              { id: 'messages', label: 'Mensagens' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex-1 h-full rounded-md text-sm font-medium transition-all ${
                  filter === tab.id
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="pb-20">
        {todayNotifs.length > 0 && (
          <div>
            <div className="px-4 py-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Hoje</h3>
            </div>
            {todayNotifs.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}

        {yesterdayNotifs.length > 0 && (
          <div>
            <div className="px-4 py-2 mt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Ontem</h3>
            </div>
            {yesterdayNotifs.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}

        {olderNotifs.length > 0 && (
          <div>
            <div className="px-4 py-2 mt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Anteriores</h3>
            </div>
            {olderNotifs.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}

        {filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 hexagon bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h3 className="font-medium text-[var(--text-primary)]">Nenhuma notificação</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">As notificações aparecerão aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}