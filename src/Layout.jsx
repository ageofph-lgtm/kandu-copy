
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User as UserEntity } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MapPin,
  MessageCircle,
  User,
  Calendar,
  LogOut,
  Settings,
  MoreVertical,
  FileText,
  Shield,
  RefreshCw,
  Languages
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { translations } from "@/components/utils/translations";
import "leaflet/dist/leaflet.css";

const navigationItems = [
  { title: "dashboard", icon: MapPin, url: createPageUrl("Dashboard") },
  { title: "applications", icon: FileText, url: createPageUrl("Applications") },
  { title: "chat", icon: MessageCircle, url: createPageUrl("Chat") },
  { title: "calendar", icon: Calendar, url: createPageUrl("Calendar") },
  { title: "profile", icon: User, url: createPageUrl("Profile") }
];

const adminNavigationItems = [
  { title: "admin", icon: Shield, url: createPageUrl("AdminDashboard") },
  { title: "dashboard", icon: MapPin, url: createPageUrl("Dashboard") },
  { title: "applications", icon: FileText, url: createPageUrl("Applications") },
  { title: "chat", icon: MessageCircle, url: createPageUrl("Chat") },
  { title: "calendar", icon: Calendar, url: createPageUrl("Calendar") },
  { title: "profile", icon: User, url: createPageUrl("Profile") }
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState({ chat: 0, applications: 0 });

  const t = (key) => {
    return translations[user?.language || 'PT']?.[key] || translations.PT[key] || key;
  };

  const loadUserAndNotifications = useCallback(async () => {
    try {
      const userData = await UserEntity.me();
      if (!userData) throw new Error("User not found");
      setUser(userData);

      const allNotifications = await Notification.filter({
        user_id: userData.id,
        is_read: false
      });

      const chatNotifications = allNotifications.filter(n => n.type === 'new_message');
      
      const applicationNotificationTypes = [
        'new_application', 'new_proposal', // For employers
        'job_accepted', 'job_rejected', 'job_ready_for_review' // For workers
      ];
      const applicationNotifications = allNotifications.filter(n =>
        applicationNotificationTypes.includes(n.type)
      );

      setUnreadNotifications({
        chat: chatNotifications.length,
        applications: applicationNotifications.length
      });

    } catch (error) {
      if (location.pathname !== createPageUrl("SetupProfile")) {
        if (error.response?.status === 401 || error.message?.includes('401') || error.message === "User not found") {
          navigate(createPageUrl("SetupProfile"));
        }
      }
    }
  }, [navigate, location.pathname]);

  const markApplicationNotificationsAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const unreadAppNotifications = await Notification.filter({
        user_id: user.id,
        is_read: false,
        type: { $in: ['new_application', 'new_proposal', 'job_accepted', 'job_rejected', 'job_completed', 'job_ready_for_review'] }
      });

      if (unreadAppNotifications.length > 0) {
        for (const notif of unreadAppNotifications) {
          await Notification.update(notif.id, { is_read: true });
        }
        setUnreadNotifications(prev => ({ ...prev, applications: 0 }));
      }
    } catch (error) {
      console.error("Error marking application notifications as read:", error);
    }
  }, [user]);

  useEffect(() => {
    loadUserAndNotifications();
    
    // Configura um intervalo para recarregar notificações periodicamente
    const intervalId = setInterval(loadUserAndNotifications, 30000); // A cada 30 segundos
    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar

  }, [location.pathname, loadUserAndNotifications]);
  
  useEffect(() => {
    if (location.pathname === createPageUrl("Applications")) {
      markApplicationNotificationsAsRead();
    }
  }, [location.pathname, markApplicationNotificationsAsRead]);


  // Se é página de setup, não mostrar layout
  if (location.pathname === createPageUrl("SetupProfile")) {
    return children;
  }

  // Determinar itens de navegação baseado no tipo de usuário
  const navItems = user?.user_type === 'admin' ? adminNavigationItems : navigationItems;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <h1 className="text-xl font-bold text-blue-600">Eos</h1>
            </div>
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={`desktop-${item.title}`}
                    to={item.url}
                    className={`group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-6 w-6 text-gray-400" />
                      {item.title === 'admin' ? 'Administração' : t(item.title)}
                    </div>
                    {item.title === 'applications' && unreadNotifications.applications > 0 && (
                      <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-500">
                        {unreadNotifications.applications}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <Avatar>
                <AvatarFallback className="bg-blue-500 text-white">
                  {user?.full_name?.charAt(0) || <User className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-xs font-medium text-gray-500">{user?.user_type}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* --- Barra de Navegação Inferior (Mobile) --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 md:hidden grid grid-cols-6 gap-1 z-50 shadow-t">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link
              key={`mobile-${item.title}`}
              to={item.url}
              className={`flex flex-col items-center justify-center w-full h-14 rounded-lg transition-colors ${
                isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.title === 'chat' && unreadNotifications.chat > 0 && (
                  <Badge className="absolute -top-1 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs bg-red-500">
                    {unreadNotifications.chat > 9 ? '9+' : unreadNotifications.chat}
                  </Badge>
                )}
                {item.title === 'applications' && unreadNotifications.applications > 0 && (
                  <Badge className="absolute -top-1 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs bg-blue-500">
                    {unreadNotifications.applications > 9 ? '9+' : unreadNotifications.applications}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1">{item.title === 'admin' ? 'Admin' : t(item.title)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
