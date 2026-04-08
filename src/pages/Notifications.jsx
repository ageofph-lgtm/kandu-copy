import React, { useState, useEffect, useCallback } from "react";
import { Notification } from "@/entities/Notification";
import { User } from "@/entities/User";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

function NotificationCard({ notification, onMarkAsRead }) {
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'new_application':
      case 'new_proposal':
        return '💼';
      case 'job_ready_for_review':
        return '⭐';
      case 'new_message':
        return '💬';
      default:
        return '📍';
    }
  };

  const getIconBackground = (type) => {
    if (type === 'new_message') return '#33333322';
    return '#FF660022';
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <div
      style={{
        background: '#2A2A2A',
        borderRadius: 14,
        padding: '14px 16px',
        borderLeft: '4px solid #FF6600',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        cursor: 'pointer'
      }}
      onClick={handleClick}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          background: getIconBackground(notification.type),
          flexShrink: 0
        }}
      >
        {getNotificationIcon(notification.type)}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{
          fontWeight: 700,
          fontSize: 14,
          color: '#FFF',
          margin: '0 0 2px 0'
        }}>
          {notification.title}
        </h4>
        <p style={{
          color: '#AAA',
          fontSize: 13,
          margin: 0
        }}>
          {notification.message}
        </p>
      </div>
      <span style={{
        color: '#AAA',
        fontSize: 11,
        flexShrink: 0,
        whiteSpace: 'nowrap'
      }}>
        {formatDistanceToNow(new Date(notification.created_date), { locale: pt, addSuffix: false })}
      </span>
    </div>
  );
}

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (loading) {
    return (
      <div style={{
        background: '#1A1A1A',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#AAA',
        fontSize: 14
      }}>
        A carregar...
      </div>
    );
  }

  return (
    <div style={{
      background: '#1A1A1A',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo */}
      <div style={{
        paddingTop: 50,
        textAlign: 'center',
        marginBottom: 20
      }}>
        <span style={{
          fontSize: 40,
          fontWeight: 'bold',
          color: '#FF6600'
        }}>
          φ
        </span>
      </div>

      {/* Title + Badge */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <h1 style={{
          fontWeight: 800,
          fontSize: 32,
          color: '#FFF',
          margin: 0
        }}>
          Notificações
        </h1>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#FF6600',
          color: '#FFF',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12
        }}>
          {unreadNotifications.length}
        </div>
      </div>

      {/* Notifications List */}
      <div style={{
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        paddingBottom: 80,
        flex: 1
      }}>
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <NotificationCard 
              key={notification.id} 
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#AAA',
            paddingTop: 40
          }}>
            <p style={{ fontSize: 14, margin: 0 }}>Nenhuma notificação</p>
          </div>
        )}
      </div>
    </div>
  );
}