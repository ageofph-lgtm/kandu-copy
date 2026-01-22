import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User as UserEntity } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { createPageUrl } from "@/utils";
import { translations } from "@/components/utils/translations";
import "leaflet/dist/leaflet.css";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState({ chat: 0, applications: 0 });
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kandu-theme") || "light";
    }
    return "light";
  });

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("kandu-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

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
        'new_application', 'new_proposal',
        'job_accepted', 'job_rejected', 'job_ready_for_review'
      ];
      const applicationNotifications = allNotifications.filter(n =>
        applicationNotificationTypes.includes(n.type)
      );

      setUnreadNotifications({
        chat: chatNotifications.length,
        applications: applicationNotifications.length
      });

    } catch (error) {
      if (location.pathname !== createPageUrl("SetupProfile") && location.pathname !== createPageUrl("Welcome")) {
        if (error.response?.status === 401 || error.message?.includes('401') || error.message === "User not found") {
          navigate(createPageUrl("SetupProfile"));
        }
      }
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    loadUserAndNotifications();
    const intervalId = setInterval(loadUserAndNotifications, 30000);
    return () => clearInterval(intervalId);
  }, [location.pathname, loadUserAndNotifications]);

  // Páginas sem layout
  if (location.pathname === createPageUrl("SetupProfile") || location.pathname === createPageUrl("Welcome")) {
    return children;
  }

  const navigationItems = [
    { 
      id: 'home',
      title: "Home", 
      icon: "grid_view",
      url: createPageUrl("Dashboard"),
      color: "text-blue-500"
    },
    { 
      id: 'jobs',
      title: "Obras", 
      icon: "check_box",
      url: createPageUrl("Applications"),
      color: "text-green-500"
    },
    { 
      id: 'chat',
      title: "Chat", 
      icon: "chat_bubble",
      url: createPageUrl("Chat"),
      color: "text-purple-500"
    },
    { 
      id: 'profile',
      title: "Perfil", 
      icon: "person",
      url: createPageUrl("Profile"),
      color: "text-gray-500"
    }
  ];

  const isActive = (url) => location.pathname === url;

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-200">
      {/* Main Content */}
      <main className="pb-24 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Honeycomb Style */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50 safe-area-bottom">
        <div className="glass-panel border-t border-[var(--border)] px-4 py-2">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {navigationItems.map((item, index) => {
              const active = isActive(item.url);
              return (
                <Link
                  key={item.id}
                  to={item.url}
                  className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all relative ${
                    active 
                      ? 'text-[var(--primary)]' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
                    <span className="material-icons-round text-2xl">
                      {item.icon}
                    </span>
                    {/* Notification badges */}
                    {item.id === 'chat' && unreadNotifications.chat > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadNotifications.chat > 9 ? '9+' : unreadNotifications.chat}
                      </span>
                    )}
                    {item.id === 'jobs' && unreadNotifications.applications > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-gray-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadNotifications.applications > 9 ? '9+' : unreadNotifications.applications}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${active ? 'text-[var(--primary)]' : ''}`}>
                    {item.title}
                  </span>
                  {active && (
                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--primary)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Material Icons Font */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
    </div>
  );
}