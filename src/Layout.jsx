// v2
import React, { useState, useEffect, useCallback } from "react";
import { Notification, User as UserEntity } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { useTheme } from "@/lib/ThemeContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  MessageCircle,
  User,
  Calendar,
  FileText,
  Shield,
  Bell
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { t } from "@/components/utils/translations";
import { useLanguage } from "@/lib/LanguageContext";
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
  { title: "myJobs", icon: FileText, url: createPageUrl("MyJobs") },
  { title: "applications", icon: FileText, url: createPageUrl("Applications") },
  { title: "chat", icon: MessageCircle, url: createPageUrl("Chat") },
  { title: "profile", icon: User, url: createPageUrl("Profile") }
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { lang } = useLanguage();
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState({ chat: 0, applications: 0 });
  const prevAppCount = React.useRef(0);

  // Solicitar permissão de notificações push ao montar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
  const bg = isDark ? "var(--base)" : "var(--base2)";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = "var(--text)";
  const subtext = "var(--text2)";
  const border = "var(--hair)";
  const logoH = isDark
    ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png"
    : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png";
  const logoIcon = isDark
    ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/f0a8b458b_Gemini_Generated_Image_nn24elnn24elnn24-Photoroom.png"
    : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png";
  const sidebarBg = isDark ? "var(--base)" : "var(--base2)";
  const bottomNavBg = "var(--base)";

  const navItems = user?.user_type === 'admin'
    ? adminNavigationItems
    : user?.user_type === 'worker'
      ? workerNavigationItems
      : employerNavigationItems;

  const loadUserAndNotifications = useCallback(async () => {
    try {
      // Verificar sessão Supabase antes de carregar perfil
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No session");
      const userData = await UserEntity.me();
      if (!userData) throw new Error("User not found");
      setUser(userData);

      const allNotifications = await Notification.filter({
        user_id: userData.id,
        read: false
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
      const loginUrl = createPageUrl("Login");
      const devPickerUrl = createPageUrl("DevPicker");
      const noAuthPages = [setupUrl, welcomeUrl, loginUrl, devPickerUrl];
      if (!noAuthPages.includes(location.pathname)) {
        // Só redireciona se realmente não há sessão Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) navigate(welcomeUrl);
        else if (!location.pathname.includes("DevPicker")) {
          navigate(setupUrl); // há sessão mas sem perfil → setup
        }
      }
    }
  }, [navigate, location.pathname]);

  const markApplicationNotificationsAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const unreadAppNotifications = await Notification.filter({
        user_id: user.id,
        read: false,
        type: { $in: ['new_application', 'new_proposal', 'job_accepted', 'job_rejected', 'job_completed', 'job_ready_for_review'] }
      });

      if (unreadAppNotifications.length > 0) {
        for (const notif of unreadAppNotifications) {
          await Notification.update(notif.id, { read: true });
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
    location.pathname === createPageUrl("Welcome") ||
    location.pathname === createPageUrl("Login") ||
    location.pathname === createPageUrl("DevPicker")
  ) {
    return children;
  }


  // Som de notificação quando chegam novas notificações
  const prevUnreadRef = React.useRef(0);
  useEffect(() => {
    const total = unreadNotifications.applications + unreadNotifications.chat;
    if (total > prevUnreadRef.current) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } catch {}
    }
    prevUnreadRef.current = total;
  }, [unreadNotifications]);

  return (
    <div className="k-bg" style={{minHeight:"100vh"}}>
      <Toaster position="top-center" richColors />

      {/* Sidebar Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="k-tile" style={{flex:1, display:"flex", flexDirection:"column", minHeight:0, borderRadius:0, borderTop:0, borderBottom:0, borderLeft:0}}>
          <div style={{flex:1, display:"flex", flexDirection:"column", paddingTop:20, paddingBottom:16, overflowY:"auto"}}>
            <div style={{display:"flex", alignItems:"center", padding:"0 16px", marginBottom:32}}>
              <img src={logoH} style={{height:36, maxWidth:160, objectFit:"contain"}} alt="KANDU" />
            </div>
            <div style={{padding:"8px",marginBottom:4}}>
              <button onClick={toggleTheme} title={t(lang,"toggleTheme")} style={{background:"none",border:"1px solid #FF660055",borderRadius:20,padding:"4px 12px",cursor:"pointer",fontSize:13,color:"#FF6600",fontWeight:600,whiteSpace:"nowrap",width:"100%"}}>
                {isDark ? "☀️ Light" : "🌙 Dark"}
              </button>
            </div>
            <nav style={{flex:1, padding:"0 8px", display:"flex", flexDirection:"column", gap:4}}>
                {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link key={`desktop-${item.title}`} to={item.url}
                    style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:8, textDecoration:"none",
                      background: isActive ? "rgba(255,106,0,.10)" : "transparent",
                      color: isActive ? "var(--or)" : "var(--text2)",
                      borderLeft: isActive ? "3px solid var(--or)" : "3px solid transparent",
                      fontWeight: isActive ? 600 : 400, fontSize:14, transition:"all 0.15s"}}>
                    <div style={{display:"flex", alignItems:"center", gap:12}}>
                      <item.icon size={18} />
                      {t(lang, item.title)}
                    </div>
                    {item.title === 'applications' && unreadNotifications.applications > 0 && (
                      <span className="k-badge" style={{borderRadius:"50%", minWidth:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, padding:"0 4px"}}>
                        {unreadNotifications.applications}
                      </span>
                    )}
                    {item.title === 'chat' && unreadNotifications.chat > 0 && (
                      <span className="k-badge" style={{borderRadius:"50%", minWidth:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, padding:"0 4px"}}>
                        {unreadNotifications.chat}
                      </span>
                    )}
                    {item.title === 'notifications' && (unreadNotifications.applications + unreadNotifications.chat) > 0 && (
                      <span className="k-badge" style={{borderRadius:"50%", minWidth:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, padding:"0 4px"}}>
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
      <nav className="md:hidden k-nav" style={{paddingBottom:"env(safe-area-inset-bottom)"}}>        <button onClick={toggleTheme} style={{position:"absolute",top:-36,right:12,background:isDark?"#2A2A2A":"#F0F0F0",border:"1px solid #FF660055",borderRadius:20,padding:"4px 12px",fontSize:12,color:"#FF6600",fontWeight:700,cursor:"pointer",zIndex:51}}>
          {isDark ? "☀️ Light" : "🌙 Dark"}
        </button>
        <Link to={createPageUrl("Home")} className={`k-nav-item${location.pathname===createPageUrl("Home")?" active":""}`} style={{textDecoration:"none"}}>
          <MapPin size={22} />
          <span style={{fontSize:10,marginTop:2,fontWeight:location.pathname===createPageUrl("Home")?700:400}}>{t(lang,"home")}</span>

        </Link>

        <Link to={createPageUrl("MyJobs")} className={`k-nav-item${location.pathname===createPageUrl("MyJobs")?" active":""}`} style={{textDecoration:"none", position:"relative"}}>
          <div style={{position:"relative"}}>
            <FileText size={22} />
            {unreadNotifications.applications > 0 && (
              <span style={{position:"absolute",top:-6,right:-8,background:"#FF6600",color:"#FFF",borderRadius:"50%",minWidth:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
                {unreadNotifications.applications > 9 ? '9+' : unreadNotifications.applications}
              </span>
            )}
          </div>
          <span style={{fontSize:10,marginTop:2,fontWeight:location.pathname===createPageUrl("MyJobs")?700:400}}>{t(lang,"myJobs")}</span>

        </Link>

        <Link to={createPageUrl("Notifications")} className={`k-nav-item${location.pathname===createPageUrl("Notifications")?" active":""}`} style={{textDecoration:"none",position:"relative"}}>
          <div style={{position:"relative"}}>
            <Bell size={22} />
            {(unreadNotifications.applications + unreadNotifications.chat) > 0 && (
              <span style={{position:"absolute",top:-6,right:-8,background:"#EF4444",color:"#FFF",borderRadius:"50%",minWidth:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
                {(unreadNotifications.applications + unreadNotifications.chat) > 9 ? "9+" : (unreadNotifications.applications + unreadNotifications.chat)}
              </span>
            )}
          </div>
          <span style={{fontSize:10,marginTop:2}}>{t(lang,"notifications","Avisos")}</span>
        </Link>

        <Link to={createPageUrl("Chat")} style={{display:"flex",flexDirection:"column",alignItems:"center",color:location.pathname===createPageUrl("Chat")?"#FF6600":"#AAAAAA",textDecoration:"none",flex:1,padding:"8px 0"}}>
          <div style={{position:"relative"}}>
            <MessageCircle size={22} />
            {unreadNotifications.chat > 0 && (
              <span style={{position:"absolute",top:-6,right:-8,background:"#FF6600",color:"#FFF",borderRadius:"50%",minWidth:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
                {unreadNotifications.chat > 9 ? '9+' : unreadNotifications.chat}
              </span>
            )}
          </div>
          <span style={{fontSize:10,marginTop:2,fontWeight:location.pathname===createPageUrl("Chat")?700:400}}>{t(lang,"chat")}</span>

        </Link>


        <Link to={createPageUrl("Profile")} className={`k-nav-item${location.pathname===createPageUrl("Profile")?" active":""}`} style={{textDecoration:"none"}}>
          <User size={22} />
          <span style={{fontSize:10,marginTop:2,fontWeight:location.pathname===createPageUrl("Profile")?700:400}}>{t(lang,"profile")}</span>

        </Link>
      </nav>
    </div>
  );
}