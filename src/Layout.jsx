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
  FileText,
  Shield,
  QrCode
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { translations } from "@/components/utils/translations";
import "leaflet/dist/leaflet.css";
import { Toaster } from "@/components/ui/sonner";

const workerNavigationItems = [
  { title: "home", icon: MapPin, url: createPageUrl("Home") },
  { title: "myJobs", icon: FileText, url: createPageUrl("MyJobs") },
  { title: "applications", icon: FileText, url: createPageUrl("Applications") },
  { title: "calendar", icon: Calendar, url: createPageUrl("Calendar") },
  { title: "chat", icon: MessageCircle, url: createPageUrl("Chat") },
  { title: "profile", icon: User, url: createPageUrl("Profile") }
];

const employerNavigationItems = [
  { title: "home", icon: MapPin, url: createPageUrl("Home") },
  { title: "myJobs", icon: FileText, url: createPageUrl("MyJobs") },
  { title: "applications", icon: FileText, url: createPageUrl("Applications") },
  { title: "calendar", icon: Calendar, url: createPageUrl("Calendar") },
  { title: "chat", icon: MessageCircle, url: createPageUrl("Chat") },
  { title: "profile", icon: User, url: createPageUrl("Profile") }
];

const adminNavigationItems = [
  { title: "admin", icon: Shield, url: createPageUrl("AdminDashboard") },
  { title: "home", icon: MapPin, url: createPageUrl("Home") },
  { title: "dashboard", icon: MapPin, url: createPageUrl("Dashboard") },
  { title: "myJobs", icon: FileText, url: createPageUrl("MyJobs") },
  { title: "applications", icon: FileText, url: createPageUrl("Applications") },
  { title: "chat", icon: MessageCircle, url: createPageUrl("Chat") },
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
      const setupUrl = createPageUrl("SetupProfile");
      const welcomeUrl = createPageUrl("Welcome");
      if (location.pathname !== setupUrl && location.pathname !== welcomeUrl) {
        navigate(welcomeUrl);
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

  // Redirecionar admin para AdminDashboard se tentar acessar Home
  useEffect(() => {
    if (user?.user_type === 'admin' && location.pathname === createPageUrl("Home")) {
      navigate(createPageUrl("AdminDashboard"));
    }
  }, [user, location.pathname, navigate]);
  
  useEffect(() => {
    if (location.pathname === createPageUrl("Applications")) {
      markApplicationNotificationsAsRead();
    }
  }, [location.pathname, markApplicationNotificationsAsRead]);


  // Páginas sem layout
  if (
    location.pathname === createPageUrl("SetupProfile") ||
    location.pathname === createPageUrl("Welcome")
  ) {
    return children;
  }

  // Determinar itens de navegação baseado no tipo de usuário
  const navItems = user?.user_type === 'admin' 
    ? adminNavigationItems 
    : user?.user_type === 'worker' 
      ? workerNavigationItems 
      : employerNavigationItems;

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Toaster position="top-center" richColors />
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-[#1f1f1f] border-r border-[#2a2a2a]">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className="w-9 h-10 flex items-center justify-center" style={{clipPath:'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: '#2a2a2a', border: '2px solid #F26522'}}>
                <span className="text-white font-black text-sm">K</span>
              </div>
              <span className="ml-2 text-lg font-black text-white tracking-widest">KANDU</span>
            </div>
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link key={`desktop-${item.title}`} to={item.url}
                    className={`group flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                      isActive ? 'bg-[#F26522] text-white' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                    }`}>
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.title === 'admin' ? 'Administração' : t(item.title)}
                    </div>
                    {item.title === 'applications' && unreadNotifications.applications > 0 && (
                      <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-[#F26522]">{unreadNotifications.applications}</Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-[#2a2a2a] p-4">
            <div className="flex items-center">
              <Avatar>
                <AvatarFallback className="bg-[#F26522] text-white">
                  {user?.full_name?.charAt(0) || <User className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-200">{user?.full_name || user?.email}</p>
                <p className="text-xs text-gray-500">{user?.user_type}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1f1f1f] border-t border-[#2a2a2a] md:hidden z-50 px-2 pb-safe pt-2">
        <div className="flex justify-between items-end max-w-sm mx-auto pb-2">
          {/* Home */}
          <Link to={createPageUrl("Home")}
            className={`flex flex-col items-center justify-center w-14 transition-colors ${
              location.pathname === createPageUrl("Home") ? 'text-[#F26522]' : 'text-gray-600'
            }`}>
            <MapPin className="w-6 h-6" />
            {location.pathname === createPageUrl("Home") && <span className="w-1 h-1 bg-[#F26522] rounded-full mt-0.5" />}
          </Link>

          {/* Trabalhos */}
          <Link to={createPageUrl("MyJobs")}
            className={`flex flex-col items-center justify-center w-14 transition-colors relative ${
              location.pathname === createPageUrl("MyJobs") ? 'text-[#F26522]' : 'text-gray-600'
            }`}>
            <div className="relative">
              <FileText className="w-6 h-6" />
              {unreadNotifications.applications > 0 && (
                <Badge className="absolute -top-1 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-[#F26522]">
                  {unreadNotifications.applications > 9 ? '9+' : unreadNotifications.applications}
                </Badge>
              )}
            </div>
            {location.pathname === createPageUrl("MyJobs") && <span className="w-1 h-1 bg-[#F26522] rounded-full mt-0.5" />}
          </Link>

          {/* FAB hexagon */}
          <div className="relative -top-4 flex flex-col items-center w-16">
            {user?.user_type === 'worker' ? (
              <Link to={createPageUrl("Scan")}
                className="w-14 h-14 bg-[#F26522] text-white flex items-center justify-center shadow-xl shadow-[#F26522]/40"
                style={{clipPath:'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}>
                <QrCode className="w-6 h-6" />
              </Link>
            ) : (
              <Link to={createPageUrl("NewJob")}
                className="w-14 h-14 bg-[#F26522] text-white flex items-center justify-center shadow-xl shadow-[#F26522]/40"
                style={{clipPath:'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}>
                <span className="text-3xl font-light leading-none">+</span>
              </Link>
            )}
          </div>

          {/* Chat */}
          <Link to={createPageUrl("Chat")}
            className={`flex flex-col items-center justify-center w-14 transition-colors relative ${
              location.pathname === createPageUrl("Chat") ? 'text-[#F26522]' : 'text-gray-600'
            }`}>
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              {unreadNotifications.chat > 0 && (
                <Badge className="absolute -top-1 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-[#F26522]">
                  {unreadNotifications.chat > 9 ? '9+' : unreadNotifications.chat}
                </Badge>
              )}
            </div>
            {location.pathname === createPageUrl("Chat") && <span className="w-1 h-1 bg-[#F26522] rounded-full mt-0.5" />}
          </Link>

          {/* Perfil */}
          <Link to={createPageUrl("Profile")}
            className={`flex flex-col items-center justify-center w-14 transition-colors ${
              location.pathname === createPageUrl("Profile") ? 'text-[#F26522]' : 'text-gray-600'
            }`}>
            <User className="w-6 h-6" />
            {location.pathname === createPageUrl("Profile") && <span className="w-1 h-1 bg-[#F26522] rounded-full mt-0.5" />}
          </Link>
        </div>
      </nav>
    </div>
  );
}