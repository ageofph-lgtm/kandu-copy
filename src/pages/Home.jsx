import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
import { User } from "@/entities/User";
import { Job } from "@/entities/Job";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, List, Map, Star, X, Send, Users, Megaphone, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MapView from "../components/dashboard/MapView";
import JobModal from "../components/dashboard/JobModal";

const LISBON_COORDS = [38.7223, -9.1393];
const CATEGORIES = ["Pintura", "Eletricidade", "Canalização", "Alvenaria", "Ladrilhador", "Carpintaria", "Climatização", "Isolamentos", "Pavimentos", "Telhados"];

// ============================================================
// EMPLOYER VIEW
// ============================================================
function WorkerCard({ worker, onContact, onProfile, isDark }) {
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const stars = Math.min(5, Math.max(1, Math.round(worker.rating || 4)));
  return (
    <div style={{background:surface,borderRadius:16,padding:16,borderLeft:"4px solid #FF6600"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div
          style={{width:52,height:52,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#FF6600",clipPath:'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',cursor:"pointer"}}
          onClick={onProfile}
        >
          {worker.avatar_url ? (
            <img src={worker.avatar_url} alt={worker.full_name} style={{width:"100%",height:"100%",objectFit:"cover",clipPath:'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}} />
          ) : (
            <span style={{color:"#FFF",fontSize:18,fontWeight:700}}>{worker.full_name?.charAt(0) || "?"}</span>
          )}
        </div>
        <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={onProfile}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
            <h3 style={{fontWeight:700,color:text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{worker.full_name || "Profissional"}</h3>
            {worker.verified && <span style={{color:"#FF6600",fontWeight:700,fontSize:13}}>✓</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:2}}>
            {[1,2,3,4,5].map(i => (
              <Star key={i} style={{width:12,height:12,color:i<=stars?"#FF6600":"#444",fill:i<=stars?"#FF6600":"none"}} />
            ))}
            <span style={{fontSize:11,color:"#AAAAAA",marginLeft:4}}>{worker.rating ? worker.rating.toFixed(1) : "Novo"}</span>
          </div>
          {worker.city && (
            <p style={{fontSize:11,color:subtext,display:"flex",alignItems:"center",gap:4,marginTop:2}}>
              <MapPin style={{width:11,height:11}} />{worker.city}
            </p>
          )}
        </div>
      </div>
      {worker.skills?.length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
          {worker.skills.slice(0,4).map((skill,i) => (
            <span key={i} style={{fontSize:11,background:isDark?"#333":"#E5E5E5",color:subtext,padding:"2px 8px",borderRadius:20}}>{skill}</span>
          ))}
          {worker.skills.length > 4 && <span style={{fontSize:11,color:"#666"}}>+{worker.skills.length-4}</span>}
        </div>
      )}
      {worker.bio && (
        <p style={{fontSize:12,color:subtext,marginBottom:10,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{worker.bio}</p>
      )}
      <button style={{width:"100%",padding:"10px 0",background:"#FF6600",border:"none",borderRadius:12,color:"#FFF",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}} onClick={onContact}>
        <Send style={{width:14,height:14}} /> Contactar
      </button>
    </div>
  );
}

function EmployerHome({ user, isDark, logoIcon }) {
  const navigate = useNavigate();
  const bg = isDark ? "#1A1A1A" : "#FFFFFF";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const headerBg = isDark ? "#111" : "#F0F0F0";
  const tabBg = isDark ? "#222" : "#EEEEEE";
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("professionals");
  const [loading, setLoading] = useState(true);

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    const load = async () => {
      const [allUsers, openJobs] = await Promise.all([
        User.list(),
        Job.filter({ status: 'open' })
      ]);
      setWorkers(allUsers.filter(u => u.user_type === 'worker'));
      setJobs(openJobs);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = workers.filter(w => {
    if (selectedCategory !== "all" && !w.skills?.includes(selectedCategory)) return false;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      return w.full_name?.toLowerCase().includes(t) ||
             w.city?.toLowerCase().includes(t) ||
             w.skills?.some(s => s.toLowerCase().includes(t));
    }
    return true;
  });

  const filteredJobs = jobs.filter(j => {
    if (selectedCategory !== "all" && j.category !== selectedCategory) return false;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      return j.title?.toLowerCase().includes(t) ||
             j.location?.toLowerCase().includes(t) ||
             j.description?.toLowerCase().includes(t);
    }
    return true;
  });

  return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column"}}>
      {/* Top Bar */}
      <div style={{background:headerBg,padding:"50px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <img src={logoIcon} style={{width:32,height:32,objectFit:"contain"}} alt="KANDU" />
          <MapPin style={{width:18,height:18, color:text}} />
          <span style={{color:text,fontWeight:700,fontSize:15}}>Lisboa, PT</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Link to={createPageUrl("Notifications")} style={{color:text, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", width:36, height:36, borderRadius:"50%", transition:"background 0.2s", "&:hover":{background:isDark?"#333":"#E0E0E0"}}}>
            <Bell size={20} />
          </Link>
          <Link to={createPageUrl("Profile")} style={{width:36,height:36,clipPath:"polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",background:"#FF6600",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontWeight:700,fontSize:16,overflow:"hidden",flexShrink:0}}>
            {user?.profile_picture_url ? (
              <img src={user.profile_picture_url} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover"}} />
            ) : (
              user?.full_name?.charAt(0) || "U"
            )}
          </Link>
        </div>
      </div>

      {/* Tab Toggle */}
      <div style={{display:"flex",background:tabBg,margin:"12px 16px 0",borderRadius:16,padding:4}}>
        <button onClick={() => { setActiveTab('professionals'); setSearchTerm(''); }}
          style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 0",borderRadius:12,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:activeTab==='professionals'?"#FF6600":"transparent",color:activeTab==='professionals'?"#FFF":subtext}}>
          <Users style={{width:15,height:15}} /> Profissionais
        </button>
        <button onClick={() => { setActiveTab('ads'); setSearchTerm(''); }}
          style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 0",borderRadius:12,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:activeTab==='ads'?"#FF6600":"transparent",color:activeTab==='ads'?"#FFF":subtext}}>
          <Megaphone style={{width:15,height:15}} /> Anúncios
        </button>
      </div>

      {/* Search Bar */}
      <div style={{background:surface,borderRadius:24,padding:"10px 16px",display:"flex",gap:8,alignItems:"center",margin:"10px 16px 0",border:`1px solid ${isDark?"#333":"#E5E5E5"}`}}>
        <span style={{color:"#FF6600",fontSize:18}}>🔍</span>
        <input placeholder={activeTab==='professionals'?"Procurar profissional, cidade ou especialidade...":"Procurar obra, localização..."}
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{flex:1,background:"transparent",border:"none",outline:"none",color:text,fontSize:14}} />
        {searchTerm && <button onClick={() => setSearchTerm("")} style={{background:"none",border:"none",color:"#AAAAAA",cursor:"pointer",fontSize:18}}>×</button>}
      </div>

      {/* Filter Chips */}
      <div style={{display:"flex",gap:8,overflowX:"auto",padding:"8px 16px",scrollbarWidth:"none"}}>
        <button onClick={() => setSelectedCategory("all")}
          style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:selectedCategory==="all"?"#FF6600":surface,color:selectedCategory==="all"?"#FFF":subtext}}>
          Todos
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:selectedCategory===cat?"#FF6600":surface,color:selectedCategory===cat?"#FFF":subtext}}>
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 16px 100px"}}>
        {loading ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:160}}>
            <img src={logoIcon} style={{width:60,animation:"spin 2s linear infinite"}} alt="KANDU" />
            <p style={{color:subtext,fontSize:13,marginTop:8}}>A carregar...</p>
          </div>
        ) : activeTab === 'professionals' ? (
          filtered.length === 0 ? (
            <div style={{textAlign:"center",paddingTop:60}}>
              <div style={{fontSize:48,marginBottom:12}}>🔍</div>
              <h3 style={{color:text,fontWeight:700}}>Nenhum profissional encontrado</h3>
              <p style={{color:subtext,fontSize:13,marginTop:4}}>Tente outra especialidade ou localidade</p>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <p style={{fontSize:11,color:subtext,fontWeight:600}}>{filtered.length} profissiona{filtered.length===1?'l':'is'} disponíve{filtered.length===1?'l':'is'}</p>
              {filtered.map(worker => (
                <WorkerCard key={worker.id} worker={worker} isDark={isDark}
                  onContact={() => navigate(createPageUrl("Chat") + `?userId=${worker.id}`)}
                  onProfile={() => navigate(createPageUrl("Profile") + `?userId=${worker.id}`)} />
              ))}
            </div>
          )
        ) : (
          filteredJobs.length === 0 ? (
            <div style={{textAlign:"center",paddingTop:60}}>
              <div style={{fontSize:48,marginBottom:12}}>📋</div>
              <h3 style={{color:text,fontWeight:700}}>Nenhum anúncio encontrado</h3>
              <p style={{color:subtext,fontSize:13,marginTop:4}}>Tente outro filtro de categoria</p>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <p style={{fontSize:11,color:subtext,fontWeight:600}}>{filteredJobs.length} anúncio{filteredJobs.length===1?'':'s'} disponíve{filteredJobs.length===1?'l':'is'}</p>
              {filteredJobs.map(job => (
                <div key={job.id} style={{background:surface,borderRadius:16,padding:16,borderLeft:"4px solid #FF6600"}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                    <h3 style={{fontWeight:700,color:text,flex:1,marginRight:8,fontSize:14,margin:0}}>{job.title}</h3>
                    <p style={{fontSize:18,fontWeight:700,color:"#FF6600",flexShrink:0,margin:0}}>€{job.price}{job.price_type==='hourly'?'/h':''}</p>
                  </div>
                  <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,background:isDark?"#333":"#E5E5E5",color:subtext,padding:"2px 8px",borderRadius:20}}>{job.category}</span>
                    {job.urgency==='high' && <span style={{fontSize:11,background:"#2D1A1A",color:"#EF4444",padding:"2px 8px",borderRadius:20}}>🔴 Urgente</span>}
                  </div>
                  <p style={{fontSize:11,color:subtext,display:"flex",alignItems:"center",gap:4,margin:0}}>
                    <MapPin style={{width:11,height:11}} />{job.location}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================
// WORKER VIEW
// ============================================================
// Haversine distance in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function WorkerHome({ user, isDark, logoIcon }) {
  const bg = isDark ? "#1A1A1A" : "#FFFFFF";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const [jobs, setJobs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("map");
  const [sheetJob, setSheetJob] = useState(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const openJobs = await Job.filter({ status: 'open' });
      setJobs(openJobs);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setLocationError(true)
    );
  }, []);

  const filteredJobs = jobs
    .filter(j => selectedCategory === "all" || j.category === selectedCategory)
    .map(j => {
      if (userLocation && j.latitude && j.longitude) {
        return { ...j, _dist: getDistance(userLocation[0], userLocation[1], j.latitude, j.longitude) };
      }
      return j;
    })
    .sort((a, b) => (a._dist ?? 9999) - (b._dist ?? 9999));

  const mapCenter = userLocation || (user?.latitude && user?.longitude ? [user.latitude, user.longitude] : LISBON_COORDS);

  const openSheet = (job) => {
    setSheetJob(job);
    setSheetExpanded(false);
  };

  return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column"}}>
      {/* Top Bar */}
      <div style={{background:headerBg,padding:"50px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <img src={logoIcon} style={{width:32,height:32,objectFit:"contain"}} alt="KANDU" />
          <MapPin style={{width:18,height:18, color:text}} />
          <span style={{color:text,fontWeight:700,fontSize:15}}>Lisboa, PT</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Link to={createPageUrl("Notifications")} style={{color:text, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", width:36, height:36, borderRadius:"50%", transition:"background 0.2s", "&:hover":{background:isDark?"#333":"#E0E0E0"}}}>
            <Bell size={20} />
          </Link>
          <Link to={createPageUrl("Profile")} style={{width:36,height:36,clipPath:"polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",background:"#FF6600",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontWeight:700,fontSize:16,overflow:"hidden",flexShrink:0}}>
            {user?.profile_picture_url ? (
              <img src={user.profile_picture_url} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover"}} />
            ) : (
              user?.full_name?.charAt(0) || "U"
            )}
          </Link>
        </div>
      </div>

      {/* Floating category pills */}
      <div style={{position:"absolute",top:8,left:0,right:0,zIndex:10,padding:"0 16px"}}>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>
          <button onClick={() => setSelectedCategory("all")}
            style={{flexShrink:0,padding:"8px 16px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,boxShadow:"0 2px 8px #0008",background:selectedCategory==="all"?"#FF6600":isDark?"#111":"#EEEEEE",color:selectedCategory==="all"?"#FFF":isDark?"#CCC":"#444"}}>
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              style={{flexShrink:0,padding:"8px 16px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,boxShadow:"0 2px 8px #0008",background:selectedCategory===cat?"#FF6600":isDark?"#111":"#EEEEEE",color:selectedCategory===cat?"#FFF":isDark?"#CCC":"#444"}}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List/Map toggle */}
      <div style={{position:"absolute",top:56,right:16,zIndex:10}}>
        <button onClick={() => setViewMode(v => v==='map'?'list':'map')}
          style={{background:isDark?"#111":"#EEEEEE",borderRadius:20,boxShadow:"0 2px 8px #0008",padding:"8px 16px",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:isDark?"#FFF":"#333",border:"none",cursor:"pointer"}}>
          {viewMode==='map' ? <List style={{width:15,height:15}} /> : <Map style={{width:15,height:15}} />}
          {viewMode==='map' ? 'Lista' : 'Mapa'}
        </button>
      </div>

      {/* Main content */}
      <div style={{flex:1,overflow:"hidden"}}>
        {loading ? (
          <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:bg}}>
            <div style={{textAlign:"center"}}>
              <img src={logoIcon} style={{width:60,animation:"spin 2s linear infinite"}} alt="KANDU" />
              <p style={{color:subtext,marginTop:8,fontSize:13}}>A carregar obras...</p>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <MapView jobs={filteredJobs} onJobClick={openSheet} center={mapCenter} radius={userLocation?10000:null} userLocation={userLocation} />
        ) : (
          <div style={{height:"100%",overflowY:"auto",paddingTop:112,paddingLeft:16,paddingRight:16,paddingBottom:100,background:bg,display:"flex",flexDirection:"column",gap:12}}>
            {filteredJobs.length === 0 ? (
              <div style={{textAlign:"center",paddingTop:60}}>
                <div style={{fontSize:48,marginBottom:12}}>🔍</div>
                <h3 style={{color:text,fontWeight:700}}>Nenhum trabalho disponível</h3>
                <p style={{color:subtext,fontSize:13,marginTop:4}}>Tente outro filtro de categoria</p>
              </div>
            ) : filteredJobs.map(job => (
              <div key={job.id} style={{background:surface,borderRadius:16,padding:16,borderLeft:"4px solid #FF6600",cursor:"pointer"}} onClick={() => openSheet(job)}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
                  <h3 style={{fontWeight:700,color:text,flex:1,marginRight:8,fontSize:14,margin:0}}>{job.title}</h3>
                  <p style={{fontSize:18,fontWeight:700,color:"#FF6600",flexShrink:0,margin:0}}>€{job.price}{job.price_type==='hourly'?'/h':''}</p>
                </div>
                <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,background:isDark?"#333":"#E5E5E5",color:subtext,padding:"2px 8px",borderRadius:20}}>{job.category}</span>
                  {job.urgency==='high' && <span style={{fontSize:11,background:"#2D1A1A",color:"#EF4444",padding:"2px 8px",borderRadius:20}}>🔴 Urgente</span>}
                </div>
                <p style={{fontSize:11,color:subtext,display:"flex",alignItems:"center",gap:4,margin:0}}>
                  <MapPin style={{width:11,height:11}} />{job.location}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      {sheetJob && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:55}} onClick={() => setSheetJob(null)} />
          <div style={{position:"fixed",left:0,right:0,zIndex:60,background:surface,borderRadius:"20px 20px 0 0",boxShadow:"0 -4px 30px #0008",transition:"height 0.3s",bottom:80,height:sheetExpanded?"72vh":"32vh",overflow:"hidden"}}>
            <div style={{display:"flex",justifyContent:"center",paddingTop:12,paddingBottom:8,cursor:"pointer"}} onClick={() => setSheetExpanded(e => !e)}>
              <div style={{width:40,height:4,background:"#444",borderRadius:4}} />
            </div>
            <button onClick={() => setSheetJob(null)} style={{position:"absolute",top:12,right:16,background:"none",border:"none",color:"#AAAAAA",cursor:"pointer",fontSize:20}}>×</button>
            <div style={{padding:"0 20px",overflowY:"auto",height:"100%",paddingBottom:32}}>
              <span style={{fontSize:11,background:isDark?"#333":"#E5E5E5",color:subtext,padding:"2px 8px",borderRadius:20,display:"inline-block",marginBottom:6}}>{sheetJob.category}</span>
              <p style={{fontWeight:700,color:text,fontSize:18,margin:"0 0 4px"}}>{sheetJob.title}</p>
              <p style={{fontSize:36,fontWeight:700,color:"#FF6600",margin:"0 0 8px"}}>€{sheetJob.price}{sheetJob.price_type==='hourly'&&<span style={{fontSize:14,fontWeight:400,color:subtext}}>/h</span>}</p>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                {sheetJob.urgency==='high' && <span style={{fontSize:11,background:"#2D1A1A",color:"#EF4444",padding:"2px 8px",borderRadius:20}}>🔴 Urgente</span>}
                <span style={{fontSize:11,color:subtext,display:"flex",alignItems:"center",gap:4}}><MapPin style={{width:11,height:11}} />{sheetJob.location}</span>
              </div>
              {sheetExpanded && (
                <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:16}}>
                  <div>
                    <p style={{fontSize:13,fontWeight:600,color:text,marginBottom:4}}>Descrição</p>
                    <p style={{fontSize:13,color:subtext}}>{sheetJob.description}</p>
                  </div>
                  {sheetJob.start_date && <p style={{fontSize:13,color:"#AAAAAA"}}>📅 Início previsto: {sheetJob.start_date}</p>}
                  <button style={{width:"100%",padding:"14px 0",background:"#FF6600",border:"none",borderRadius:16,color:"#FFF",fontWeight:700,fontSize:15,cursor:"pointer"}} onClick={() => setShowJobModal(true)}>
                    Candidatar-me
                  </button>
                </div>
              )}
              {!sheetExpanded && <p style={{fontSize:11,color:subtext,marginTop:16,textAlign:"center"}}>↑ Deslize para ver detalhes e candidatar-se</p>}
            </div>
          </div>
        </>
      )}

      {showJobModal && sheetJob && (
        <JobModal job={sheetJob} user={user} onClose={() => setShowJobModal(false)} onApply={() => { setShowJobModal(false); setSheetJob(null); }} />
      )}
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function Home() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        if (!userData.user_type) {
          navigate(createPageUrl("SetupProfile"));
          return;
        }
        if (userData.user_type === 'admin') {
          navigate(createPageUrl("AdminDashboard"));
          return;
        }
      } catch {
        navigate(createPageUrl("SetupProfile"));
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading) {
    return <LoadingScreen label="A carregar..." />;
  }

  if (!user || user.user_type === 'admin') return null;
  const logoIcon = isDark
    ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/f0a8b458b_Gemini_Generated_Image_nn24elnn24elnn24-Photoroom.png"
    : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png";

  if (user.user_type === 'worker') return <WorkerHome user={user} isDark={isDark} logoIcon={logoIcon} />;
  return <EmployerHome user={user} isDark={isDark} logoIcon={logoIcon} />;
}