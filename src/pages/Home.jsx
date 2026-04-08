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
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState({});
  const [loading, setLoading] = useState(true);

  const firstName = user?.full_name?.split(' ')[0] || 'João';

  useEffect(() => {
    const load = async () => {
      try {
        const userJobs = await Job.filter({ employer_id: user.id }, "-created_date");
        setJobs(userJobs);

        // Fetch applicants for each job
        const appMap = {};
        for (const job of userJobs) {
          const apps = await Application.filter({ job_id: job.id });
          appMap[job.id] = apps;
        }
        setApplicants(appMap);
      } catch (error) {
        console.error("Error loading employer jobs:", error);
      }
      setLoading(false);
    };
    load();
  }, [user.id]);

  const activeJobs = jobs.filter(j => j.status === 'open');

  if (loading) {
    return (
      <div style={{ background: '#1A1A1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#FF6600', fontSize: 40, fontWeight: 'bold' }}>φ</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#1A1A1A', minHeight: '100vh', position: 'relative', paddingBottom: 80 }}>
      {/* Hex SVG background */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }} viewBox="0 0 400 800">
        <defs>
          <pattern id="hexPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <polygon points="30,0 60,15 60,45 30,60 0,45 0,15" fill="none" stroke="#FF6600" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="800" fill="url(#hexPattern)" />
      </svg>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top bar */}
        <div style={{
          padding: '50px 20px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h1 style={{
              fontWeight: 800,
              fontSize: 20,
              color: '#FFF',
              margin: '0 0 4px 0'
            }}>
              O que precisas, {firstName}?
            </h1>
            <p style={{
              color: '#AAA',
              fontSize: 13,
              margin: 0
            }}>
              📍 Lisboa
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#FF6600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontWeight: 'bold'
            }}>
              {user?.full_name?.charAt(0) || '?'}
            </div>
          </div>
        </div>

        {/* Publish button */}
        <button
          onClick={() => navigate(createPageUrl("NewJob"))}
          style={{
            margin: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#FF6600',
            borderRadius: 50,
            padding: '14px 24px',
            border: 'none',
            cursor: 'pointer',
            width: 'fit-content'
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            border: '2px solid #FFF',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            fontWeight: 700,
            fontSize: 18
          }}>
            +
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#FFF' }}>Publicar Obra</span>
        </button>

        {/* Active jobs section */}
        <div style={{
          padding: '0 20px',
          marginBottom: 12,
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }}>
          <h2 style={{
            fontWeight: 700,
            fontSize: 16,
            color: '#FFF',
            margin: 0
          }}>
            Os teus anúncios activos
          </h2>
          <div style={{
            width: 22,
            height: 22,
            background: '#FF6600',
            borderRadius: '50%',
            color: '#FFF',
            fontWeight: 700,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {activeJobs.length}
          </div>
        </div>

        {/* Jobs list */}
        <div style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {activeJobs.length > 0 ? (
            activeJobs.map(job => {
              const jobApps = applicants[job.id] || [];
              return (
                <div
                  key={job.id}
                  style={{
                    background: '#2A2A2A',
                    borderRadius: 16,
                    padding: 16,
                    borderLeft: '6px solid #FF6600',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(createPageUrl("MyJobs"))}
                >
                  {/* Title + Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{
                      fontWeight: 'bold',
                      fontSize: 16,
                      color: '#FFF',
                      margin: 0
                    }}>
                      {job.title}
                    </h3>
                    <span style={{
                      background: '#FF6600',
                      color: '#FFF',
                      borderRadius: 20,
                      padding: '4px 12px',
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}>
                      Ativo
                    </span>
                  </div>

                  {/* Applicants count */}
                  <p style={{
                    color: '#AAA',
                    fontSize: 13,
                    margin: '4px 0 12px 0'
                  }}>
                    {jobApps.length} candidato{jobApps.length !== 1 ? 's' : ''}
                  </p>

                  {/* Applicant avatars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {jobApps.slice(0, 2).map((app, idx) => (
                      <div
                        key={app.id}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: '#FF6600',
                          border: '2px solid #2A2A2A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF',
                          fontWeight: 'bold',
                          fontSize: 10,
                          marginLeft: idx > 0 ? -8 : 0
                        }}
                      >
                        👤
                      </div>
                    ))}
                    {jobApps.length > 2 && (
                      <span style={{
                        color: '#AAA',
                        fontSize: 12,
                        marginLeft: 4
                      }}>
                        +{jobApps.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', color: '#AAA', paddingTop: 40 }}>
              <p>Nenhuma obra activa</p>
            </div>
          )}
        </div>
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
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sheetJob, setSheetJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

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
      () => {}
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

  const openSheet = (job) => {
    setSheetJob(job);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="text-6xl font-bold text-[#F26522] animate-pulse">φ</div>
          <p className="text-gray-400 mt-2 text-sm">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', position: 'relative', overflow: 'hidden', background: '#1A1A1A' }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, zIndex: 10, width: '100%', background: '#111', padding: '50px 16px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222'
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/06b6bd11a_Gemini_Generated_Image_4.png" alt="K" style={{ width: 32 }} />
          <span style={{ fontWeight: 600, color: '#FFF', fontSize: 14 }}>📍 Lisboa, PT</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: '#FF6600', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 'bold', fontSize: 14
          }}>
            {user?.full_name?.charAt(0) || '?'}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{
        position: 'absolute', top: 105, left: 16, right: 16, zIndex: 10,
        background: '#2A2A2A', borderRadius: 24, padding: '10px 16px', display: 'flex',
        gap: 8, alignItems: 'center'
      }}>
        <span style={{ color: '#FF6600' }}>🔍</span>
        <input
          type="text"
          placeholder="O que precisas?"
          style={{
            background: 'transparent', border: 'none', color: '#FFF', flex: 1,
            outline: 'none', fontSize: 14
          }}
        />
      </div>

      {/* Map SVG background */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 400 800">
        <defs>
          <pattern id="mapGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="40" y2="0" stroke="#2a3a2a" strokeWidth="0.5" />
            <line x1="0" y1="0" x2="0" y2="40" stroke="#2a3a2a" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="400" height="800" fill="#1a3a2a" />
        <rect width="400" height="800" fill="url(#mapGrid)" />
        {/* Street names */}
        <text x="50" y="200" fontSize="8" fill="#333" opacity="0.5">Av. da Liberdade</text>
        <text x="80" y="450" fontSize="8" fill="#333" opacity="0.5" transform="rotate(-30 80 450)">R. Augusta</text>
        <text x="250" y="350" fontSize="8" fill="#333" opacity="0.5">Av. Paulista</text>
      </svg>

      {/* Job pins on map */}
      {filteredJobs.slice(0, 8).map((job, idx) => {
        const angle = (idx / 8) * Math.PI * 2;
        const x = 50 + 35 * Math.cos(angle);
        const y = 50 + 35 * Math.sin(angle);
        return (
          <div
            key={job.id}
            onClick={() => openSheet(job)}
            style={{
              position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
              width: 28, height: 28, background: '#FF6600', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              zIndex: 5
            }}
          />
        );
      })}

      {/* Floating job card */}
      {sheetJob && (
        <div
          onClick={() => setShowJobModal(true)}
          style={{
            position: 'absolute', bottom: 72, left: 16, right: 16,
            background: '#2A2A2A', borderRadius: 20, padding: 16, borderLeft: '4px solid #FF6600',
            display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', zIndex: 20
          }}
        >
          <div style={{
            width: 48, height: 48, background: '#FF6600', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
          }}>🔧</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#FFF', fontWeight: 'bold', margin: 0, fontSize: 15 }}>{sheetJob.title}</p>
            <p style={{ color: '#AAA', fontSize: 13, margin: '4px 0 0 0' }}>📍 {sheetJob.location}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <p style={{ color: '#FF6600', fontWeight: 'bold', margin: 0 }}>€{sheetJob.price}</p>
            <span style={{ background: 'rgba(255, 102, 0, 0.15)', color: '#FF6600', padding: '4px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
              {sheetJob._dist ? `${sheetJob._dist.toFixed(1)}km` : '—'}
            </span>
          </div>
        </div>
      )}

      {/* Full job modal */}
      {showJobModal && sheetJob && (
        <JobModal
          job={sheetJob}
          user={user}
          onClose={() => setShowJobModal(false)}
          onApply={() => { setShowJobModal(false); setSheetJob(null); }}
        />
      )}

      {/* Bottom nav */}
      <nav style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, background: '#111', borderTop: '1px solid #222',
        padding: '12px 0 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', zIndex: 10
      }}>
        <button style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none',
          color: '#FF6600', cursor: 'pointer', fontSize: 20
        }}>
          📍
          <span style={{ fontSize: 10, color: '#FF6600' }}>Mapa</span>
        </button>
        <button onClick={() => navigate(createPageUrl("Home"))} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none',
          color: '#666', cursor: 'pointer', fontSize: 20
        }}>
          🔍
          <span style={{ fontSize: 10, color: '#666' }}>Pesquisa</span>
        </button>
        <button onClick={() => navigate(createPageUrl("Chat"))} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none',
          color: '#666', cursor: 'pointer', fontSize: 20
        }}>
          💬
          <span style={{ fontSize: 10, color: '#666' }}>Chat</span>
        </button>
        <button onClick={() => navigate(createPageUrl("Profile"))} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none',
          color: '#666', cursor: 'pointer', fontSize: 20
        }}>
          👤
          <span style={{ fontSize: 10, color: '#666' }}>Perfil</span>
        </button>
      </nav>
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