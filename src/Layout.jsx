import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User as UserEntity } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  MessageCircle,
  User,
  Calendar,
  FileText,
  Shield,
  Bell,
  Sun,
  Moon
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
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kandu-theme") || "dark";
    }
    return "dark";
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
    const intervalId = setInterval(loadUserAndNotifications, 30000);
    return () => clearInterval(intervalId);
  }, [location.pathname, loadUserAndNotifications]);
  
  useEffect(() => {
    if (location.pathname === createPageUrl("Applications")) {
      markApplicationNotificationsAsRead();
    }
  }, [location.pathname, markApplicationNotificationsAsRead]);

  // Páginas sem layout
  if (location.pathname === createPageUrl("SetupProfile") || location.pathname === createPageUrl("Welcome")) {
    return children;
  }

  const navItems = user?.user_type === 'admin' ? adminNavigationItems : navigationItems;

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-200">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--surface)] border-r border-[var(--border)]">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--primary)]">KANDU</h1>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Marketplace</p>
              </div>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={`desktop-${item.title}`}
                  to={item.url}
                  className={`group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${isActive ? "text-[var(--primary)]" : ""}`} />
                    {item.title === 'admin' ? 'Administração' : t(item.title)}
                  </div>
                  {item.title === 'applications' && unreadNotifications.applications > 0 && (
                    <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold bg-[var(--primary)] text-white rounded-full">
                      {unreadNotifications.applications}
                    </span>
                  )}
                  {item.title === 'chat' && unreadNotifications.chat > 0 && (
                    <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full">
                      {unreadNotifications.chat}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="flex-shrink-0 border-t border-[var(--border)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                {user?.full_name?.charAt(0) || <User className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-xs text-[var(--text-muted)] capitalize">{user?.user_type}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-50 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-lg font-bold text-[var(--primary)]">KANDU</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-secondary)]"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <button className="relative w-9 h-9 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-secondary)]">
                <Bell className="w-4 h-4" />
                {(unreadNotifications.chat + unreadNotifications.applications) > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--primary)] rounded-full" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] md:hidden z-50 safe-area-bottom">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={`mobile-${item.title}`}
                to={item.url}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                  isActive 
                    ? 'text-[var(--primary)] bg-[var(--primary)]/10' 
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.title === 'chat' && unreadNotifications.chat > 0 && (
                    <span className="absolute -top-1 -right-2 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                      {unreadNotifications.chat > 9 ? '9+' : unreadNotifications.chat}
                    </span>
                  )}
                  {item.title === 'applications' && unreadNotifications.applications > 0 && (
                    <span className="absolute -top-1 -right-2 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-[var(--primary)] text-white rounded-full">
                      {unreadNotifications.applications > 9 ? '9+' : unreadNotifications.applications}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-medium">
                  {item.title === 'admin' ? 'Admin' : t(item.title)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}