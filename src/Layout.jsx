// v2
import React, { useState, useEffect, useCallback } from "react";
import { Notification, User as UserEntity } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { useTheme } from "@/lib/ThemeContext";
import ThemePicker, { ThemeGrid } from "@/components/ThemePicker";
import { Sun, Moon, Flame } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  MessageCircle,
  User,
  Calendar,
  FileText,
  Shield,
  Bell,
  LayoutDashboard
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { t } from "@/components/utils/translations";
import { useLanguage } from "@/lib/LanguageContext";
import "leaflet/dist/leaflet.css";
import { Toaster } from "@/components/ui/sonner";
import { useSessionTimeout } from "@/lib/useSessionTimeout";
import { sincronizarPush } from "@/lib/push";
import PushPrompt from "@/components/PushPrompt";
import { toast } from "sonner";

const workerNavigationItems = [
  { title: "home", icon: MapPin, url: createPageUrl("Home") },
  { title: "dashboard", icon: LayoutDashboard, url: createPageUrl("Dashboard") },
  { title: "myJobs", icon: FileText, url: createPageUrl("MyJobs") },
  { title: "applications", icon: FileText, url: createPageUrl("Applications") },
  { title: "calendar", icon: Calendar, url: createPageUrl("Calendar") },
  { title: "chat", icon: MessageCircle, url: createPageUrl("Chat") },
  { title: "notifications", icon: Bell, url: createPageUrl("Notifications") },
  { title: "profile", icon: User, url: createPageUrl("Profile") }
];

const employerNavigationItems = [
  { title: "home", icon: MapPin, url: createPageUrl("Home") },
  { title: "dashboard", icon: LayoutDashboard, url: createPageUrl("Dashboard") },
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
  const { isDark, toggleTheme, isEmber } = useTheme();
  const ThemeNavIcon = isEmber ? Flame : (isDark ? Moon : Sun);
  const { lang } = useLanguage();
  const [user, setUser] = useState(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState({ chat: 0, applications: 0 });
  const prevAppCount = React.useRef(0);

  // Web Push — clicar numa notificação nativa abre o ecrã certo (mensagem do sw.js)
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event) => {
      if (event.data?.type !== "kandu_open_link" || !event.data?.link) return;
      navigate(event.data.link);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);

  // Troca de conta no mesmo browser: volta a ligar o aparelho à conta nova
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") sincronizarPush();
    });
    return () => subscription?.unsubscribe();
  }, []);

  // #85 — logout automático após inatividade
  useSessionTimeout(!!user, () => {
    toast.info("Sessão terminada por inatividade. Faz login novamente.");
    navigate(createPageUrl("Login"), { replace: true });
  });
  const bg = isDark ? "var(--base)" : "var(--base2)";
  const surface = isDark ? "var(--bg-2A2A2A, #2A2A2A)" : "var(--bg-F5F5F5, #F5F5F5)";
  const text = "var(--text)";
  const subtext = "var(--text2)";
  const border = "var(--hair)";
  const logoH = isDark
    ? "/brand/kandu-wordmark-dark.png"
    : "/brand/kandu-wordmark-light.png";
  const logoIcon = isDark
    ? "/brand/kandu-icon-dark.png"
    : "/brand/kandu-icon-light.png";
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
      // liga este aparelho à conta que está a ser usada (sem perguntar nada)
      sincronizarPush();

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

  // Marca como lidas as notificações da categoria correspondente ao ecrã aberto.
  // Antes usava-se `type: { $in: [...] }`, que o adaptador Supabase traduz para
  // um `.eq()` com um objecto — a query não devolvia nada e o badge nunca
  // desaparecia ao navegar entre tabs.
  const markCategoryAsRead = useCallback(async (types, key) => {
    if (!user) return;
    try {
      const unread = await Notification.filter({ user_id: user.id, read: false });
      const target = unread.filter(n => types.includes(n.type));
      if (!target.length) return;
      await Promise.all(target.map(n => Notification.update(n.id, { read: true })));
      setUnreadNotifications(prev => ({ ...prev, [key]: 0 }));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
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

  const APPLICATION_TYPES = React.useMemo(() => ([
    'new_application', 'new_proposal', 'application_withdrawn',
    'job_accepted', 'job_rejected', 'job_completed', 'job_ready_for_review',
  ]), []);

  useEffect(() => {
    if (location.pathname === createPageUrl("Applications") || location.pathname === createPageUrl("MyJobs")) {
      markCategoryAsRead(APPLICATION_TYPES, "applications");
    }
    if (location.pathname === createPageUrl("Chat")) {
      markCategoryAsRead(['new_message'], "chat");
    }
    if (location.pathname === createPageUrl("Notifications")) {
      markCategoryAsRead([...APPLICATION_TYPES, 'new_message'], "applications");
      setUnreadNotifications({ chat: 0, applications: 0 });
    }
  }, [location.pathname, markCategoryAsRead, APPLICATION_TYPES]);

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

  // Páginas sem layout
  if (
    location.pathname === createPageUrl("SetupProfile") ||
    location.pathname === createPageUrl("Welcome") ||
    location.pathname === createPageUrl("Login") ||
    location.pathname === createPageUrl("DevPicker")
  ) {
    return children;
  }

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
              <ThemePicker />
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
            <div style={{width:36, height:36, borderRadius:"50%", background:"var(--bg-FF6600, #FF6600)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--on-FFFFFF, #FFF)", fontWeight:700, fontSize:16, flexShrink:0}}>
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
          <PushPrompt />
          {children}
        </main>
      </div>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden k-nav" style={{paddingBottom:"env(safe-area-inset-bottom)"}}>        <Link to={createPageUrl("Home")} className={`k-nav-item${location.pathname===createPageUrl("Home")?" active":""}`} style={{textDecoration:"none"}}>
          <MapPin size={22} />
          <span style={{fontSize:10,marginTop:2,fontWeight:location.pathname===createPageUrl("Home")?700:400}}>{t(lang,"home")}</span>

        </Link>

        <Link to={createPageUrl("MyJobs")} className={`k-nav-item${location.pathname===createPageUrl("MyJobs")?" active":""}`} style={{textDecoration:"none", position:"relative"}}>
          <div style={{position:"relative"}}>
            <FileText size={22} />
            {unreadNotifications.applications > 0 && (
              <span style={{position:"absolute",top:-6,right:-8,background:"var(--bg-FF6600, #FF6600)",color:"var(--on-FFFFFF, #FFF)",borderRadius:"50%",minWidth:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
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
              <span style={{position:"absolute",top:-6,right:-8,background:"var(--bg-EF4444, #EF4444)",color:"var(--fg-FFFFFF, #FFF)",borderRadius:"50%",minWidth:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
                {(unreadNotifications.applications + unreadNotifications.chat) > 9 ? "9+" : (unreadNotifications.applications + unreadNotifications.chat)}
              </span>
            )}
          </div>
          <span style={{fontSize:10,marginTop:2}}>{t(lang,"notifications","Avisos")}</span>
        </Link>

        <Link to={createPageUrl("Chat")} className={location.pathname===createPageUrl("Chat")?"active":""} style={{display:"flex",flexDirection:"column",alignItems:"center",color:location.pathname===createPageUrl("Chat")?"var(--fg-FF6600, #FF6600)":"var(--fg-AAAAAA, #AAAAAA)",textDecoration:"none",flex:1,padding:"8px 0"}}>
          <div style={{position:"relative"}}>
            <MessageCircle size={22} />
            {unreadNotifications.chat > 0 && (
              <span style={{position:"absolute",top:-6,right:-8,background:"var(--bg-FF6600, #FF6600)",color:"var(--on-FFFFFF, #FFF)",borderRadius:"50%",minWidth:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
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
        <button type="button" onClick={() => setThemeOpen(o => !o)} aria-label="Tema" aria-expanded={themeOpen}
          className={`k-nav-item${themeOpen ? " active" : ""}`}
          style={{background:"none",border:"none",cursor:"pointer",font:"inherit"}}>
          <ThemeNavIcon size={22} />
          <span style={{fontSize:10,marginTop:2,fontWeight:themeOpen?700:400}}>Tema</span>
        </button>
      </nav>
      {themeOpen && (
        <div className="md:hidden" style={{position:"fixed",inset:0,zIndex:60}} onClick={() => setThemeOpen(false)}>
          <div className="k-sheet" onClick={e => e.stopPropagation()}
            style={{position:"absolute",left:12,right:12,bottom:"calc(84px + env(safe-area-inset-bottom))",borderRadius:20,padding:14,
                    background:"var(--bg-FFFFFF, var(--base))",border:"1px solid var(--hair)",boxShadow:"0 18px 50px -12px rgba(0,0,0,.45)"}}>
            <p style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:.6}}>Tema</p>
            <ThemeGrid onPick={() => setThemeOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}