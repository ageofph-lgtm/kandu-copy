import React, { useState, useEffect, useCallback } from "react";
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
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                {!notification.is_read && (
                  <Badge className="bg-blue-500 h-2 w-2 p-0 rounded-full"></Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(notification.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {!notification.is_read && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification);
              }}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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

  if (loading) {
    return (
      <div className="p-4 h-screen flex flex-col items-center justify-center">
        <Settings className="w-12 h-12 text-gray-400 animate-spin mb-4" />
        <p className="text-gray-500">A carregar notificações...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        {unreadNotifications.length > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unread">
            <Bell className="w-4 h-4 mr-2" />
            Não Lidas ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            <CheckCircle className="w-4 h-4 mr-2" />
            Todas ({notifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-4">
          <div className="space-y-4">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map(notification => (
                <NotificationCard 
                  key={notification.id} 
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <Card className="text-center p-8">
                <Bell className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-800">Nenhuma notificação não lida</h3>
                <p className="text-sm text-gray-500 mt-1">Está tudo em dia! 🎉</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <NotificationCard 
                  key={notification.id} 
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <Card className="text-center p-8">
                <Bell className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-800">Nenhuma notificação</h3>
                <p className="text-sm text-gray-500 mt-1">As notificações aparecerão aqui.</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}