import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Job } from "@/entities/Job";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, List, Map, Star, X, Send, Users, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MapView from "../components/dashboard/MapView";
import JobModal from "../components/dashboard/JobModal";

const LISBON_COORDS = [38.7223, -9.1393];
const CATEGORIES = ["Pintura", "Eletricidade", "Canalização", "Alvenaria", "Ladrilhador", "Carpintaria", "Climatização", "Isolamentos", "Pavimentos", "Telhados"];

// ============================================================
// EMPLOYER VIEW
// ============================================================
function WorkerCard({ worker, onContact, onProfile }) {
  const stars = Math.min(5, Math.max(1, Math.round(worker.rating || 4)));
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.99] transition-transform">
      <div className="flex items-start gap-3 mb-3">
        {/* Hexagonal avatar */}
        <div
          className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#F26522] to-orange-600 cursor-pointer"
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
          onClick={onProfile}
        >
          {worker.avatar_url ? (
            <img
              src={worker.avatar_url}
              alt={worker.full_name}
              className="w-full h-full object-cover"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            />
          ) : (
            <span className="text-white text-lg font-bold select-none">{worker.full_name?.charAt(0) || "?"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onProfile}>
          <div className="flex items-center gap-1 mb-0.5">
            <h3 className="font-bold text-gray-900 truncate">{worker.full_name || "Profissional"}</h3>
            {worker.verified && (
              <span className="text-[#F26522] font-bold text-sm shrink-0" title="Verificado">φ</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-3 h-3 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
            ))}
            <span className="text-xs text-gray-400 ml-1">{worker.rating ? worker.rating.toFixed(1) : "Novo"}</span>
          </div>
          {worker.city && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />{worker.city}
            </p>
          )}
        </div>
      </div>
      {worker.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {worker.skills.slice(0, 4).map((skill, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{skill}</span>
          ))}
          {worker.skills.length > 4 && (
            <span className="text-xs text-gray-400">+{worker.skills.length - 4}</span>
          )}
        </div>
      )}
      {worker.bio && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{worker.bio}</p>
      )}
      <Button
        className="w-full h-10 bg-[#F26522] hover:bg-orange-600 rounded-xl text-sm font-semibold"
        onClick={onContact}
      >
        <Send className="w-4 h-4 mr-2" /> Contactar
      </Button>
    </div>
  );
}

function EmployerHome({ user }) {
  const navigate = useNavigate();
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-3 shadow-sm">
        <p className="text-xs text-gray-400 mb-0.5">KANDU</p>
        <h1 className="text-xl font-bold text-gray-900 mb-3">
          What do you need, <span className="text-[#F26522]">{firstName}</span>?
        </h1>
        {/* Tab Toggle */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-3">
          <button
            onClick={() => { setActiveTab('professionals'); setSearchTerm(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'professionals' ? 'bg-white text-[#F26522] shadow-sm' : 'text-gray-500'
            }`}
          >
            <Users className="w-4 h-4" />
            By Professionals
          </button>
          <button
            onClick={() => { setActiveTab('ads'); setSearchTerm(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'ads' ? 'bg-white text-[#F26522] shadow-sm' : 'text-gray-500'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            By Ads
          </button>
        </div>
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder={activeTab === 'professionals' ? 'Procurar profissional, cidade ou especialidade...' : 'Procurar obra, localização...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-full bg-gray-100 border-0 shadow-sm text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === "all" ? 'bg-[#F26522] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat ? 'bg-[#F26522] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 pt-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <div className="text-5xl font-bold text-[#F26522] animate-pulse select-none">φ</div>
            <p className="text-gray-400 text-sm mt-2">A carregar...</p>
          </div>
        ) : activeTab === 'professionals' ? (
          filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-bold text-gray-900">Nenhum profissional encontrado</h3>
              <p className="text-sm text-gray-500 mt-1">Tente outra especialidade ou localidade</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-medium">{filtered.length} profissiona{filtered.length === 1 ? 'l' : 'is'} disponíve{filtered.length === 1 ? 'l' : 'is'}</p>
              {filtered.map(worker => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onContact={() => navigate(createPageUrl("Chat") + `?userId=${worker.id}`)}
                  onProfile={() => navigate(createPageUrl("Profile") + `?userId=${worker.id}`)}
                />
              ))}
            </div>
          )
        ) : (
          filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="font-bold text-gray-900">Nenhum anúncio encontrado</h3>
              <p className="text-sm text-gray-500 mt-1">Tente outro filtro de categoria</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-medium">{filteredJobs.length} anúncio{filteredJobs.length === 1 ? '' : 's'} disponíve{filteredJobs.length === 1 ? 'l' : 'is'}</p>
              {filteredJobs.map(job => (
                <div key={job.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 flex-1 mr-2 text-sm">{job.title}</h3>
                    <p className="text-xl font-bold text-[#F26522] shrink-0">
                      €{job.price}{job.price_type === 'hourly' ? '/h' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{job.category}</Badge>
                    {job.urgency === 'high' && <Badge className="bg-red-100 text-red-700 text-xs border-0">🔴 Urgente</Badge>}
                    {job.price_type === 'negotiable' && <Badge className="bg-green-100 text-green-700 text-xs border-0">🤝 Negociável</Badge>}
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{job.location}
                  </p>
                  {job.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{job.description}</p>
                  )}
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

function WorkerHome({ user }) {
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
    <div className="h-screen flex flex-col relative bg-gray-900">
      {/* Floating category pills */}
      <div className="absolute top-4 left-0 right-0 z-10 px-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-colors ${
              selectedCategory === "all" ? 'bg-[#F26522] text-white' : 'bg-white/95 text-gray-700'
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-colors ${
                selectedCategory === cat ? 'bg-[#F26522] text-white' : 'bg-white/95 text-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List/Map toggle */}
      <div className="absolute top-16 right-4 z-10">
        <button
          onClick={() => setViewMode(v => v === 'map' ? 'list' : 'map')}
          className="bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
        >
          {viewMode === 'map' ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
          {viewMode === 'map' ? 'Lista' : 'Mapa'}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl font-bold text-[#F26522] animate-pulse">φ</div>
              <p className="text-gray-500 mt-2">A carregar obras...</p>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <MapView
            jobs={filteredJobs}
            onJobClick={openSheet}
            center={mapCenter}
            radius={userLocation ? 10000 : null}
            userLocation={userLocation}
          />
        ) : (
          <div className="h-full overflow-auto pt-28 px-4 pb-28 bg-gray-50 space-y-3">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="font-bold text-gray-900">Nenhum trabalho disponível</h3>
                <p className="text-sm text-gray-500 mt-1">Tente outro filtro de categoria</p>
              </div>
            ) : filteredJobs.map(job => (
              <div
                key={job.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer active:scale-[0.99] transition-transform"
                onClick={() => openSheet(job)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 flex-1 mr-2 text-sm">{job.title}</h3>
                  <p className="text-xl font-bold text-[#F26522] shrink-0">
                    €{job.price}{job.price_type === 'hourly' ? '/h' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">{job.category}</Badge>
                  {job.urgency === 'high' && <Badge className="bg-red-100 text-red-700 text-xs border-0">🔴 Urgente</Badge>}
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{job.location}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      {sheetJob && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setSheetJob(null)} />
          <div
            className="fixed inset-x-0 z-[60] bg-white rounded-t-3xl shadow-2xl transition-all duration-300 overflow-hidden"
            style={{ bottom: '80px', height: sheetExpanded ? '72vh' : '32vh' }}
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-pointer"
              onClick={() => setSheetExpanded(e => !e)}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <button
              onClick={() => setSheetJob(null)}
              className="absolute top-3 right-4 p-1.5 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            <div className="px-5 overflow-auto h-full pb-8">
              <Badge variant="secondary" className="mb-2">{sheetJob.category}</Badge>
              <p className="font-bold text-gray-900 text-lg leading-tight">{sheetJob.title}</p>
              <p className="text-4xl font-bold text-[#F26522] mt-1">
                €{sheetJob.price}
                {sheetJob.price_type === 'hourly' && <span className="text-base font-normal text-gray-400">/h</span>}
              </p>
              <div className="flex items-center gap-3 mt-2">
                {sheetJob.urgency === 'high' && <Badge className="bg-red-100 text-red-700 border-0 text-xs">🔴 Urgente</Badge>}
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{sheetJob.location}
                </span>
              </div>

              {sheetExpanded && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Descrição</p>
                    <p className="text-sm text-gray-600">{sheetJob.description}</p>
                  </div>
                  {sheetJob.start_date && (
                    <p className="text-sm text-gray-500">📅 Início previsto: {sheetJob.start_date}</p>
                  )}
                  <Button
                    className="w-full h-12 bg-[#F26522] hover:bg-orange-600 rounded-2xl text-base font-bold shadow-lg shadow-[#F26522]/20"
                    onClick={() => setShowJobModal(true)}
                  >
                    Candidatar-me
                  </Button>
                </div>
              )}

              {!sheetExpanded && (
                <p className="text-xs text-gray-400 mt-4 text-center">↑ Deslize para ver detalhes e candidatar-se</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Full job modal for apply form */}
      {showJobModal && sheetJob && (
        <JobModal
          job={sheetJob}
          user={user}
          onClose={() => setShowJobModal(false)}
          onApply={() => { setShowJobModal(false); setSheetJob(null); }}
        />
      )}
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function Home() {
  const navigate = useNavigate();
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
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-7xl font-bold text-[#F26522] animate-pulse select-none">φ</div>
          <p className="text-gray-400 mt-3 text-sm">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user || user.user_type === 'admin') return null;
  if (user.user_type === 'worker') return <WorkerHome user={user} />;
  return <EmployerHome user={user} />;
}