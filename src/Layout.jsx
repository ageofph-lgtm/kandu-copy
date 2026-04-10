// v2
import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User as UserEntity } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import {
  MapPin,
  MessageCircle,
  User,
  Calendar,
  FileText,
  Shield,
  QrCode,
  Bell
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
  { title: "notifications", icon: Bell, url: createPageUrl("Notifications") },
  { title: "profile", icon: User, url: createPageUrl("Profile") }
];

const employerNavigationItems = [
  { title: "home", icon: MapPin, url: createPageUrl("Home") },
  { title: "myJobs", icon: FileText, url: createPageUrl("MyJobs") },
  { title: "applications", icon: FileText, url: createPageUrl("Applications") },
  { title: "calendar", icon: Calendar, url: createPageUrl("Calendar") },
  { title: "chat", icon: MessageCircle, url: createPageUrl("Chat") },
  { title: "notifications", icon: Bell, url: createPageUrl("Notifications") },
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
  const { isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState({ chat: 0, applications: 0 });
  const prevAppCount = React.useRef(0);

  // Solicitar permissão de notificações push ao montar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
  const bg = isDark ? "#1A1A1A" : "#FFFFFF";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#222" : "#E5E5E5";
  const logoH = isDark
    ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
    : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png";
  const logoIcon = isDark
    ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/f0a8b458b_Gemini_Generated_Image_nn24elnn24elnn24-Photoroom.png"
    : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png";
  const sidebarBg = isDark ? "#111111" : "#F8F8F8";
  const bottomNavBg = isDark ? "#111111" : "#FFFFFF";

  const t = (key) => translations?.pt?.[key] || translations?.en?.[key] || key;

  const navItems = user?.user_type === 'admin'
    ? adminNavigationItems
    : user?.user_type === 'worker'
      ? workerNavigationItems
      : employerNavigationItems;

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

      const newAppCount = applicationNotifications.length;
      // Disparar notificação push se houver novas candidaturas
      if (newAppCount > prevAppCount.current && prevAppCount.current !== 0) {
        if ("Notification" in window && Notification.permission === "granted") {
          const diff = newAppCount - prevAppCount.current;
          const n = new window.Notification("KANDU — Nova candidatura! 📋", {
            body: diff === 1 ? "Tens uma nova candidatura à tua obra." : `Tens ${diff} novas candidaturas às tuas obras.`,
            icon: "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png",
            badge: "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png",
            tag: "kandu-application",
          });
          // Som de notificação via AudioContext
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(); osc.stop(ctx.currentTime + 0.4);
          } catch (_) {}
        }
      }
      prevAppCount.current = newAppCount;
      setUnreadNotifications({
        chat: chatNotifications.length,
        applications: newAppCount
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
    const intervalId = setInterval(loadUserAndNotifications, 30000);
    return () => clearInterval(intervalId);
  }, [location.pathname, loadUserAndNotifications]);

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

  return (
    <div style={{minHeight:"100vh", background:bg}}>
      <Toaster position="top-center" richColors />

      {/* Sidebar Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div style={{flex:1, display:"flex", flexDirection:"column", minHeight:0, background:sidebarBg, borderRight:`1px solid ${border}`}}>
          <div style={{flex:1, display:"flex", flexDirection:"column", paddingTop:20, paddingBottom:16, overflowY:"auto"}}>
            <div style={{display:"flex", alignItems:"center", padding:"0 16px", marginBottom:32}}>
              <img src={logoH} style={{height:36, maxWidth:160, objectFit:"contain"}} alt="KANDU" />
            </div>
            <div style={{padding:"8px",marginBottom:4}}>
              <button onClick={toggleTheme} title="Alternar tema" style={{background:"none",border:"1px solid #FF660055",borderRadius:20,padding:"4px 12px",cursor:"pointer",fontSize:13,color:"#FF6600",fontWeight:600,whiteSpace:"nowrap",width:"100%"}}>
                {isDark ? "☀️ Light" : "🌙 Dark"}
              </button>
            </div>
            <nav style={{flex:1, padding:"0 8px", display:"flex", flexDirection:"column", gap:4}}>
                {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link key={`desktop-${item.title}`} to={item.url}
                    style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:8, textDecoration:"none",
                      background: isActive ? "#FF660022" : "transparent",
                      color: isActive ? "#FF6600" : subtext,
                      borderLeft: isActive ? "3px solid #FF6600" : "3px solid transparent",
                      fontWeight: isActive ? 600 : 400, fontSize:14, transition:"all 0.15s"}}>
                    <div style={{display:"flex", alignItems:"center", gap:12}}>
                      <item.icon size={18} />
                      {item.title === 'admin' ? 'Administração' : t(item.title)}
                    </div>
                    {item.title === 'applications' && unreadNotifications.applications > 0 && (
                      <span style={{background:"#FF6600", color:"#FFF", borderRadius:"50%", minWidth:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700}}>
                        {unreadNotifications.applications}
                      </span>
                    )}
                    {item.title === 'chat' && unreadNotifications.chat > 0 && (
                      <span style={{background:"#FF6600", color:"#FFF", borderRadius:"50%", minWidth:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700}}>
                        {unreadNotifications.chat}
                      </span>
                    )}
                    {item.title === 'notifications' && (unreadNotifications.applications + unreadNotifications.chat) > 0 && (
                      <span style={{background:"#FF6600", color:"#FFF", borderRadius:"50%", minWidth:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700}}>
                        {unreadNotifications.applications + unreadNotifications.chat}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div style={{borderTop:`1px solid ${border}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:10}}>
            <div style={{width:36, height:36, borderRadius:"50%", background:"#FF6600", display:"flex", alignItems:"center", justifyContent:"center", color:"#FFF", fontWeight:700, fontSize:16, flexShrink:0}}>
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <p style={{fontSize:13, fontWeight:600, color:text, margin:0}}>{user?.full_name || user?.email}</p>
              <p style={{fontSize:11, color:subtext, margin:0}}>{user?.user_type}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64" style={{display:"flex", flexDirection:"column", flex:1}}>
        <main style={{flex:1, paddingBottom:80}}>
          {children}
        </main>
      </div>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden" style={{position:"fixed", bottom:0, left:0, right:0, background:bottomNavBg, borderTop:`1px solid ${border}`, zIndex:50, display:"flex", paddingBottom:"env(safe-area-inset-bottom)"}}>        <button onClick={toggleTheme} style={{position:"absolute",top:-36,right:12,background:isDark?"#2A2A2A":"#F0F0F0",border:"1px solid #FF660055",borderRadius:20,padding:"4px 12px",fontSize:12,color:"#FF6600",fontWeight:700,cursor:"pointer",zIndex:51}}>
          {isDark ? "☀️ Light" : "🌙 Dark"}
        </button>
        <Link to={createPageUrl("Home")} style={{display:"flex",flexDirection:"column",alignItems:"center",color:location.pathname===createPageUrl("Home")?"#FF6600":"#AAAAAA",textDecoration:"none",flex:1,padding:"8px 0"}}>
          <MapPin size={22} />
          <span style={{fontSize:10,marginTop:2,fontWeight:location.pathname===createPageUrl("Home")?700:400}}>Início</span>
          {location.pathname===createPageUrl("Home") && <div style={{width:4,height:4,borderRadius:"50%",background:"#FF6600",marginTop:2}} />}
        </Link>

        <Link to={createPageUrl("MyJobs")} style={{display:"flex",flexDirection:"column",alignItems:"center",color:location.pathname===createPageUrl("MyJobs")?"#FF6600":"#AAAAAA",textDecoration:"none",flex:1,padding:"8px 0",position:"relative"}}>
          <div style={{position:"relative"}}>
            <FileText size={22} />
            {unreadNotifications.applications > 0 && (
              <span style={{position:"absolute",top:-6,right:-8,background:"#FF6600",color:"#FFF",borderRadius:"50%",minWidth:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
                {unreadNotifications.applications > 9 ? '9+' : unreadNotifications.applications}
              </span>
            )}
          </div>
          <span style={{fontSize:10,marginTop:2,fontWeight:location.pathname===createPageUrl("MyJobs")?700:400}}>Trabalhos</span>
          {location.pathname===createPageUrl("MyJobs") && <div style={{width:4,height:4,borderRadius:"50%",background:"#FF6600",marginTop:2}} />}
        </Link>

        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",flex:1,paddingBottom:4}}>
          {user?.user_type === 'worker' ? (
            <Link to={createPageUrl("Scan")} style={{width:52,height:52,background:"#FF6600",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px #FF660066",textDecoration:"none",marginBottom:2}}>
              <QrCode size={24} color="#FFF" />
            </Link>
          ) : (
            <Link to={createPageUrl("NewJob")} style={{width:52,height:52,background:"#FF6600",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px #FF660066",textDecoration:"none",marginBottom:2}}>
              <span style={{color:"#FFF",fontSize:28,lineHeight:1,fontWeight:300}}>+</span>
            </Link>
          )}
        </div>

        <Link to={createPageUrl("Chat")} style={{display:"flex",flexDirection:"column",alignItems:"center",color:location.pathname===createPageUrl("Chat")?"#FF6600":"#AAAAAA",textDecoration:"none",flex:1,padding:"8px 0"}}>
          <div style={{position:"relative"}}>
            <MessageCircle size={22} />
            {unreadNotifications.chat > 0 && (
              <span style={{position:"absolute",top:-6,right:-8,background:"#FF6600",color:"#FFF",borderRadius:"50%",minWidth:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
                {unreadNotifications.chat > 9 ? '9+' : unreadNotifications.chat}
              </span>
            )}
          </div>
          <span style={{fontSize:10,marginTop:2,fontWeight:location.pathname===createPageUrl("Chat")?700:400}}>Chat</span>
          {location.pathname===createPageUrl("Chat") && <div style={{width:4,height:4,borderRadius:"50%",background:"#FF6600",marginTop:2}} />}
        </Link>

        <Link to={createPageUrl("Notifications")} style={{display:"flex",flexDirection:"column",alignItems:"center",color:location.pathname===createPageUrl("Notifications")?"#FF6600":"#AAAAAA",textDecoration:"none",flex:1,padding:"8px 0",position:"relative"}}>
          <div style={{position:"relative"}}>
            <Bell size={22} />
            {(unreadNotifications.applications + unreadNotifications.chat) > 0 && (
              <span style={{position:"absolute",top:-6,right:-8,background:"#FF6600",color:"#FFF",borderRadius:"50%",minWidth:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
                {(unreadNotifications.applications + unreadNotifications.chat) > 9 ? '9+' : (unreadNotifications.applications + unreadNotifications.chat)}
              </span>
            )}
          </div>
          <span style={{fontSize:10,marginTop:2,fontWeight:location.pathname===createPageUrl("Notifications")?700:400}}>Alertas</span>
          {location.pathname===createPageUrl("Notifications") && <div style={{width:4,height:4,borderRadius:"50%",background:"#FF6600",marginTop:2}} />}
        </Link>

        <Link to={createPageUrl("Profile")} style={{display:"flex",flexDirection:"column",alignItems:"center",color:location.pathname===createPageUrl("Profile")?"#FF6600":"#AAAAAA",textDecoration:"none",flex:1,padding:"8px 0"}}>
          <User size={22} />
          <span style={{fontSize:10,marginTop:2,fontWeight:location.pathname===createPageUrl("Profile")?700:400}}>Perfil</span>
          {location.pathname===createPageUrl("Profile") && <div style={{width:4,height:4,borderRadius:"50%",background:"#FF6600",marginTop:2}} />}
        </Link>
      </nav>
    </div>
  );
}