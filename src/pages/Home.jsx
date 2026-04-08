import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Job } from "@/entities/Job";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, List, Map, Star, X, Send, Users, Megaphone, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MapView from "../components/dashboard/MapView";
import JobModal from "../components/dashboard/JobModal";

const CATEGORIES = ["Pintura", "Eletricidade", "Canalização", "Alvenaria", "Ladrilhador", "Carpintaria", "Climatização", "Isolamentos", "Pavimentos", "Telhados"];
const LISBON_COORDS = [38.7223, -9.1393];

// Hex pattern bg
const HexBg = () => (
  <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
    <svg width="100%" height="100%">
      <defs>
        <pattern id="hexbg" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
          <polygon points="28,2 54,16 54,44 28,58 2,44 2,16" fill="none" stroke="#F26522" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexbg)"/>
    </svg>
  </div>
);

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── EMPLOYER HOME ─────────────────────────────────────────────
function EmployerHome({ user }) {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("professionals");
  const [loading, setLoading] = useState(true);

  const firstName = user?.full_name?.split(' ')[0] || 'João';

  useEffect(() => {
    const load = async () => {
      const [allUsers, openJobs, myJobs] = await Promise.all([
        User.list(),
        Job.filter({ status: 'open' }),
        Job.filter({ employer_id: user.id })
      ]);
      setWorkers(allUsers.filter(u => u.user_type === 'worker'));
      setJobs(openJobs.filter(j => j.employer_id !== user.id));
      setEmployerJobs(myJobs.filter(j => j.status === 'open'));
      setLoading(false);
    };
    load();
  }, [user.id]);

  const filteredWorkers = workers.filter(w => {
    if (selectedCategory !== "all" && !w.skills?.includes(selectedCategory)) return false;
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return w.full_name?.toLowerCase().includes(t) || w.city?.toLowerCase().includes(t) || w.skills?.some(s => s.toLowerCase().includes(t));
  });

  const activeJobs = employerJobs;

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative">
      <HexBg />
      {/* Header */}
      <div className="px-5 pt-6 pb-4 relative">
        <p className="text-gray-500 text-sm mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-[#F26522]"/> Lisboa, PT</p>
        <h1 className="text-2xl font-black text-white">O que precisas, <span className="text-[#F26522]">{firstName}</span>?</h1>

        {/* Publish CTA */}
        <button
          onClick={() => navigate(createPageUrl("NewJob"))}
          className="mt-4 w-full h-12 bg-[#F26522] hover:bg-orange-600 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-900/30"
        >
          <span className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white font-black text-sm">+</span>
          + Publicar Obra
        </button>

        {/* Active jobs */}
        {activeJobs.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-white font-bold">Os teus anúncios activos</p>
              <span className="w-6 h-6 bg-[#F26522] rounded-full flex items-center justify-center text-white text-xs font-bold">{activeJobs.length}</span>
            </div>
            <div className="space-y-3">
              {activeJobs.map(job => (
                <div key={job.id} className="bg-[#2a2a2a] rounded-2xl p-4 border-l-4 border-[#F26522] flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-white font-bold">{job.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">candidatos</p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="flex -space-x-2">
                        {[1,2].map(i => <div key={i} className="w-6 h-6 rounded-full bg-[#F26522]/30 border-2 border-[#2a2a2a]"/>)}
                      </div>
                      <span className="text-gray-400 text-xs ml-1">+</span>
                    </div>
                  </div>
                  <span className="bg-[#F26522] text-white text-xs font-bold px-3 py-1 rounded-full">Ativo</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="px-5 mb-4">
        <div className="flex bg-[#2a2a2a] rounded-2xl p-1">
          {[['professionals', Users, 'Por Profissionais'], ['ads', Megaphone, 'Por Anúncios']].map(([key, Icon, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === key ? 'bg-[#F26522] text-white' : 'text-gray-400'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F26522] w-5 h-5" />
          <input
            placeholder="O que precisas?"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-10 bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder:text-gray-500 rounded-2xl outline-none focus:border-[#F26522] text-sm"
          />
          {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-500"/></button>}
        </div>
      </div>

      {/* Category pills */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto" style={{scrollbarWidth:'none'}}>
        {['all', ...CATEGORIES.slice(0,4)].map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${selectedCategory === cat ? 'bg-[#F26522] text-white' : 'bg-[#2a2a2a] text-gray-400'}`}>
            {cat === 'all' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-5 pb-28 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-[#F26522] border-t-transparent rounded-full animate-spin"/></div>
        ) : activeTab === 'professionals' ? filteredWorkers.map(w => (
          <div key={w.id} className="bg-[#2a2a2a] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F26522]/20 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {w.avatar_url ? <img src={w.avatar_url} className="w-full h-full object-cover rounded-full" /> : w.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-white font-bold text-sm">{w.full_name}</p>
                {w.verified_level === 'ultra_verified' && <span className="text-[#F26522] font-black text-xs">φ</span>}
              </div>
              <p className="text-gray-500 text-xs">{w.skills?.[0] || 'Profissional'}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= Math.round(w.rating||4) ? 'text-[#F26522] fill-[#F26522]' : 'text-[#3a3a3a]'}`}/>)}
                </div>
                <span className="text-xs text-gray-500">{w.rating?.toFixed(1) || '4.9'}</span>
                {w.city && <span className="text-xs text-gray-600 flex items-center gap-0.5"><MapPin className="w-2 h-2"/> {w.city}</span>}
                {w.verified_level && <span className="text-xs bg-[#F26522]/20 text-[#F26522] px-1.5 rounded-full font-semibold">Verificado</span>}
              </div>
            </div>
            <button onClick={() => navigate(createPageUrl("Chat") + `?userId=${w.id}`)}
              className="w-9 h-9 bg-[#F26522] rounded-full flex items-center justify-center shrink-0">
              <Send className="w-4 h-4 text-white"/>
            </button>
          </div>
        )) : jobs.filter(j => selectedCategory === 'all' || j.category === selectedCategory).map(job => (
          <div key={job.id} className={`bg-[#2a2a2a] rounded-2xl p-4 border-2 ${selectedCategory !== 'all' ? 'border-[#F26522]' : 'border-transparent'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#F26522]/20 flex items-center justify-center shrink-0">
                <span className="text-lg">🔧</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{job.title}</p>
                <p className="text-gray-400 text-xs">{job.location}</p>
              </div>
              {job.price && <span className="bg-[#F26522] text-white text-xs font-bold px-2 py-1 rounded-full">€{job.price}</span>}
            </div>
            <div className="flex items-center gap-2">
              {[1,2,3].map(s => <Star key={s} className="w-3 h-3 text-[#F26522] fill-[#F26522]"/>)}
              <Star className="w-3 h-3 text-[#3a3a3a]"/>
              <span className="text-gray-500 text-xs">4.9</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WORKER HOME ───────────────────────────────────────────────
function WorkerHome({ user }) {
  const [jobs, setJobs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("map");
  const [sheetJob, setSheetJob] = useState(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    Job.filter({ status: 'open' }).then(r => { setJobs(r); setLoading(false); });
    navigator.geolocation?.getCurrentPosition(
      p => setUserLocation([p.coords.latitude, p.coords.longitude]),
      () => {}
    );
  }, []);

  const filteredJobs = jobs
    .filter(j => selectedCategory === "all" || j.category === selectedCategory)
    .map(j => {
      if (userLocation && j.latitude && j.longitude) return { ...j, _dist: getDistance(userLocation[0], userLocation[1], j.latitude, j.longitude) };
      return j;
    }).sort((a, b) => (a._dist ?? 9999) - (b._dist ?? 9999));

  const mapCenter = userLocation || LISBON_COORDS;

  return (
    <div className="h-screen flex flex-col relative bg-[#1a1a1a]">
      {/* Category pills */}
      <div className="absolute top-4 left-0 right-0 z-10 px-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
          {['all', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-colors ${selectedCategory === cat ? 'bg-[#F26522] text-white' : 'bg-[#2a2a2a]/90 text-gray-200'}`}>
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* List/Map toggle */}
      <div className="absolute top-16 right-4 z-10">
        <button onClick={() => setViewMode(v => v === 'map' ? 'list' : 'map')}
          className="bg-[#2a2a2a] rounded-full shadow-lg px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-200">
          {viewMode === 'map' ? <List className="w-4 h-4"/> : <Map className="w-4 h-4"/>}
          {viewMode === 'map' ? 'Lista' : 'Mapa'}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-[#1a1a1a]">
            <div className="w-8 h-8 border-2 border-[#F26522] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : viewMode === 'map' ? (
          <MapView jobs={filteredJobs} onJobClick={j => { setSheetJob(j); setSheetExpanded(false); }} center={mapCenter} userLocation={userLocation}/>
        ) : (
          <div className="h-full overflow-auto pt-28 px-4 pb-28 space-y-3">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-16 text-gray-500">Nenhum trabalho disponível</div>
            ) : filteredJobs.map(job => (
              <div key={job.id} className="bg-[#2a2a2a] rounded-2xl p-4 cursor-pointer" onClick={() => { setSheetJob(job); setSheetExpanded(true); }}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-white flex-1 mr-2 text-sm">{job.title}</h3>
                  <p className="text-xl font-bold text-[#F26522] shrink-0">€{job.price}{job.price_type === 'hourly' ? '/h' : ''}</p>
                </div>
                <Badge variant="secondary" className="bg-[#3a3a3a] text-gray-300 border-0 text-xs mb-2">{job.category}</Badge>
                <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3"/>{job.location}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      {sheetJob && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setSheetJob(null)}/>
          <div className="fixed inset-x-0 z-[60] bg-[#1a1a1a] rounded-t-3xl shadow-2xl transition-all duration-300 overflow-hidden"
            style={{ bottom: '72px', height: sheetExpanded ? '72vh' : '30vh' }}>
            <div className="flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setSheetExpanded(e => !e)}>
              <div className="w-10 h-1 bg-[#3a3a3a] rounded-full"/>
            </div>
            <button onClick={() => setSheetJob(null)} className="absolute top-3 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-[#2a2a2a] text-gray-400">✕</button>
            <div className="px-5 overflow-auto h-full pb-8">
              <Badge variant="secondary" className="bg-[#2a2a2a] text-gray-300 border-0 text-xs mb-2">{sheetJob.category}</Badge>
              <p className="font-black text-white text-lg leading-tight">{sheetJob.title}</p>
              <p className="text-4xl font-black text-[#F26522] mt-1">
                €{sheetJob.price}{sheetJob.price_type === 'hourly' && <span className="text-base font-normal text-gray-400">/h</span>}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-2"><MapPin className="w-3 h-3"/>{sheetJob.location}</p>
              {sheetExpanded && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-400">{sheetJob.description}</p>
                  <button className="w-full h-12 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-2xl text-base" onClick={() => setShowJobModal(true)}>
                    Candidatar-me
                  </button>
                </div>
              )}
              {!sheetExpanded && <p className="text-xs text-gray-600 mt-4 text-center">↑ Deslize para ver detalhes</p>}
            </div>
          </div>
        </>
      )}

      {showJobModal && sheetJob && (
        <JobModal job={sheetJob} user={user} onClose={() => setShowJobModal(false)} onApply={() => { setShowJobModal(false); setSheetJob(null); }}/>
      )}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    User.me().then(u => {
      setUser(u);
      if (!u.user_type) navigate(createPageUrl("SetupProfile"));
      else if (u.user_type === 'admin') navigate(createPageUrl("AdminDashboard"));
      setLoading(false);
    }).catch(() => { navigate(createPageUrl("SetupProfile")); });
  }, [navigate]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="w-8 h-8 border-2 border-[#F26522] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (!user || user.user_type === 'admin') return null;
  if (user.user_type === 'worker') return <WorkerHome user={user}/>;
  return <EmployerHome user={user}/>;
}