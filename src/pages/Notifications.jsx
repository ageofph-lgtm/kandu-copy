import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
import { Notification } from "@/entities/Notification";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  CheckCircle,
  X,
  Clock,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

function NotificationCard({ notification, onMarkAsRead, onDelete }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'new_application':
      case 'new_proposal':
        return '📝';
      case 'job_accepted':
        return '✅';
      case 'job_rejected':
        return '❌';
      case 'new_message':
        return '💬';
      case 'job_started':
        return '🚀';
      case 'job_completed':
        return '🎉';
      default:
        return '🔔';
    }
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
      style={{background:surface,borderRadius:14,cursor:"pointer",opacity:notification.is_read?0.6:1}}
      onClick={handleClick}
    >
      <div style={{padding:16}}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 style={{fontWeight:600,fontSize:14,color:text,margin:"0 0 2px"}}>{notification.title}</h4>
                {!notification.is_read && (
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#FF6600",display:"inline-block",marginLeft:6,flexShrink:0}}></span>
                )}
              </div>
              <p style={{fontSize:14,color:subtext,marginBottom:8}}>{notification.message}</p>
              <p style={{fontSize:12,color:subtext}}>
                {format(new Date(notification.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {!notification.is_read && (
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification); }} className="text-blue-600 hover:text-blue-800">
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(notification); }} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Notifications() {
  const { isDark } = useTheme();
  const bg = isDark ? "#1A1A1A" : "#FFFFFF";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
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
        // Admin pode ver todas as notificações
        notificationList = await Notification.list("-created_date");
      } else {
        // Usuários veem apenas suas notificações
        notificationList = await Notification.filter(
          { user_id: userData.id }, 
          "-created_date"
        );
      }

      setNotifications(notificationList);
      console.log("Loaded notifications:", notificationList);
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
      loadData(); // Recarregar para atualizar a visualização
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

  const handleDelete = async (notification) => {
    if (!window.confirm("Tem certeza que deseja apagar esta notificação?")) {
      return;
    }

    try {
      await Notification.delete(notification.id);
      loadData();
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Erro ao apagar notificação.");
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  const getIcon = (type) => {
    switch(type) {
      case 'new_application': case 'new_proposal': return {icon:'💼', bg:'#FF660022'};
      case 'new_message': return {icon:'💬', bg:'#33333355'};
      case 'job_accepted': return {icon:'✅', bg:'#22C55E22'};
      case 'job_rejected': return {icon:'❌', bg:'#EF444422'};
      default: return {icon:'📍', bg:'#FF660022'};
    }
  };

  const getRelativeTime = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff/60000);
    if (m < 1) return 'agora';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m/60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h/24)}d`;
  };

  if (loading) {
    return <LoadingScreen label="A carregar..." />;
  }

  return (
    <div style={{background:bg,minHeight:"100vh",paddingBottom:80}}>
      {/* Logo topo */}
      <div style={{paddingTop:50,display:"flex",justifyContent:"center"}}>
        <img src={isDark?"https://media.base44.com/images/public/69c166ad19149fb0c07883cb/f0a8b458b_Gemini_Generated_Image_nn24elnn24elnn24-Photoroom.png":"https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png"} style={{width:40, background:isDark?"white":"transparent", borderRadius:8, padding:isDark?2:0}} alt="" />
      </div>

      {/* Título + badge */}
      <div style={{padding:"12px 20px",display:"flex",alignItems:"center",gap:12}}>
        <h1 style={{fontWeight:800,fontSize:32,color:text,margin:0,flex:1}}>Notificações</h1>
        {unreadNotifications.length > 0 && (
          <div style={{width:28,height:28,borderRadius:"50%",background:"#FF6600",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontWeight:700,fontSize:14}}>
            {unreadNotifications.length}
          </div>
        )}
        {unreadNotifications.length > 0 && (
          <button onClick={handleMarkAllAsRead} style={{background:"none",border:"1px solid #FF660066",borderRadius:20,padding:"4px 12px",color:"#FF6600",fontSize:12,cursor:"pointer",fontWeight:600}}>Lidas</button>
        )}
      </div>

      {/* Lista */}
      <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:10,paddingBottom:80}}>
        {notifications.length === 0 ? (
          <div style={{textAlign:"center",padding:60}}>
            <div style={{fontSize:48,marginBottom:12}}>🔔</div>
            <p style={{color:"#AAAAAA",fontSize:15}}>Sem notificações</p>
          </div>
        ) : notifications.map(notif => {
          const {icon, bg} = getIcon(notif.type);
          return (
            <div key={notif.id}
              onClick={() => { handleMarkAsRead(notif); if(notif.action_url) window.location.href=notif.action_url; }}
              style={{background:surface,borderRadius:14,padding:"14px 16px",borderLeft:"4px solid #FF6600",display:"flex",gap:12,alignItems:"flex-start",cursor:"pointer",opacity:notif.is_read?0.6:1}}>
              <div style={{width:40,height:40,borderRadius:12,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                {icon}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:700,fontSize:14,color:text,margin:0}}>{notif.title}</p>
                <p style={{color:subtext,fontSize:13,marginTop:2,lineHeight:1.4}}>{notif.message}</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                <span style={{color:subtext,fontSize:11}}>{getRelativeTime(notif.created_date)}</span>
                <button onClick={e => {e.stopPropagation(); handleDelete(notif);}} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:14,padding:0}}>×</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}