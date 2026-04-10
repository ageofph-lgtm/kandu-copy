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
      // Disparar notificação push se houver novas candidaturas ou PINs
      if (newAppCount > prevAppCount.current && prevAppCount.current !== 0) {
        const diff = newAppCount - prevAppCount.current;
        // Som via AudioContext (funciona mesmo sem permissão de notificação)
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          [880, 1100, 1320].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.2);
          });
        } catch(_) {}
        // Vibração (mobile)
        try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch(_) {}
        // Notificação nativa
        if ("Notification" in window) {
          const fire = () => {
            try {
              new window.Notification("KANDU — Nova candidatura! 📋", {
                body: diff === 1 ? "Tens uma nova candidatura à tua obra." : `Tens ${diff} novas candidaturas.`,
                icon: "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png",
                tag: "kandu-application",
                requireInteraction: false,
              });
            } catch(_) {}
          };
          if (window.Notification.permission === "granted") {
            fire();
          } else if (window.Notification.permission !== "denied") {
            window.Notification.requestPermission().then(p => { if (p === "granted") fire(); });
          }
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
          {/* PIN de localização estilizado — leva a Notifications */}
          <Link to={createPageUrl("Notifications")} style={{position:"relative",textDecoration:"none",marginBottom:2,marginTop:-20,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {/* Sombra / glow laranja */}
            <div style={{position:"absolute",width:64,height:64,borderRadius:"50%",background:"#FF6600",filter:"blur(14px)",opacity:0.4,top:4}} />
            {/* Corpo do PIN */}
            <svg width="56" height="68" viewBox="0 0 56 68" fill="none" xmlns="http://www.w3.org/2000/svg" style={{filter:"drop-shadow(0 4px 12px #FF660099)"}}>
              {/* Gota */}
              <path d="M28 2C16.4 2 7 11.4 7 23C7 38.5 28 66 28 66C28 66 49 38.5 49 23C49 11.4 39.6 2 28 2Z" fill="#FF6600"/>
              {/* Círculo interior */}
              <circle cx="28" cy="23" r="10" fill="#1A1A1A"/>
              {/* Sino minúsculo dentro */}
              <path d="M28 14C24.7 14 22 16.7 22 20V25L20 27V28H36V27L34 25V20C34 16.7 31.3 14 28 14Z" fill="#FF6600"/>
              <path d="M26 28C26 29.1 26.9 30 28 30C29.1 30 30 29.1 30 28H26Z" fill="#FF6600"/>
            </svg>
            {/* Badge de notificações */}
            {(unreadNotifications.applications + unreadNotifications.chat) > 0 && (
              <span style={{position:"absolute",top:-4,right:-4,background:"#EF4444",color:"#FFF",borderRadius:"50%",minWidth:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,border:"2px solid #111"}}>
                {(unreadNotifications.applications + unreadNotifications.chat) > 9 ? "9+" : (unreadNotifications.applications + unreadNotifications.chat)}
              </span>
            )}
          </Link>
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


        <Link to={createPageUrl("Profile")} style={{display:"flex",flexDirection:"column",alignItems:"center",color:location.pathname===createPageUrl("Profile")?"#FF6600":"#AAAAAA",textDecoration:"none",flex:1,padding:"8px 0"}}>
          <User size={22} />
          <span style={{fontSize:10,marginTop:2,fontWeight:location.pathname===createPageUrl("Profile")?700:400}}>Perfil</span>
          {location.pathname===createPageUrl("Profile") && <div style={{width:4,height:4,borderRadius:"50%",background:"#FF6600",marginTop:2}} />}
        </Link>
      </nav>
    </div>
  );
}