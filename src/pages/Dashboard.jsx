import React, { useState, useEffect, useCallback } from "react";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORIES = ["Todos", "Elétrica", "Canalização", "Pintura", "Mão de Obra", "Carpintaria"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [activeTab, setActiveTab] = useState("professionals");
  const [loading, setLoading] = useState(true);

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      const [jobList, userList] = await Promise.all([
        Job.filter({ status: 'open' }, "-created_date"),
        User.list()
      ]);

      setJobs(jobList);
      setWorkers(userList.filter(u => u.user_type === 'worker'));
      setFilteredJobs(jobList);
      setFilteredWorkers(userList.filter(u => u.user_type === 'worker'));
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterResults = useCallback(() => {
    let jobsFiltered = jobs;
    let workersFiltered = workers;

    // Category filter
    if (selectedCategory !== "Todos") {
      jobsFiltered = jobsFiltered.filter(j => j.category === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      jobsFiltered = jobsFiltered.filter(j =>
        j.title.toLowerCase().includes(term) ||
        j.location.toLowerCase().includes(term)
      );
      workersFiltered = workersFiltered.filter(w =>
        w.full_name?.toLowerCase().includes(term) ||
        w.skills?.some(s => s.toLowerCase().includes(term))
      );
    }

    setFilteredJobs(jobsFiltered);
    setFilteredWorkers(workersFiltered);
  }, [jobs, workers, searchTerm, selectedCategory]);

  useEffect(() => {
    filterResults();
  }, [filterResults]);

  if (loading) {
    return (
      <div style={{ background: '#1A1A1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#FF6600', fontSize: 40, fontWeight: 'bold' }}>φ</div>
      </div>
    );
  }

  if (!user) {
    return <div>Erro ao carregar dados</div>;
  }

  return (
    <div style={{
      background: '#1A1A1A',
      minHeight: '100vh',
      paddingBottom: 80
    }}>
      {/* Top bar */}
      <div style={{
        padding: '50px 20px 12px'
      }}>
        <h1 style={{
          fontWeight: 800,
          fontSize: 20,
          color: '#FFF',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          O que precisas, {firstName}?
          <span style={{ color: '#FF6600', fontSize: 18 }}>📍</span>
          <span style={{ color: '#FF6600', fontSize: 13 }}>Lisboa</span>
        </h1>
      </div>

      {/* Search bar */}
      <div style={{
        margin: '0 20px 12px',
        background: '#2A2A2A',
        borderRadius: 24,
        padding: '12px 16px',
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }}>
        <span style={{ color: '#FF6600', fontSize: 16 }}>🔍</span>
        <input
          type="text"
          placeholder="Pesquisar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FFF',
            flex: 1,
            outline: 'none',
            fontSize: 14,
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{
        margin: '0 20px 12px',
        display: 'flex',
        gap: 8
      }}>
        {['professionals', 'jobs'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              borderRadius: 20,
              padding: '10px 0',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 13,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab ? '#FF6600' : '#2A2A2A',
              color: activeTab === tab ? '#FFF' : '#AAA',
              transition: 'all 0.2s'
            }}
          >
            {tab === 'professionals' ? 'Por Profisionals' : 'Por Anúncios'}
          </button>
        ))}
      </div>

      {/* Category filters */}
      <div style={{
        padding: '0 20px',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        marginBottom: 12,
        scrollbarWidth: 'none'
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              background: selectedCategory === cat ? '#FF6600' : '#2A2A2A',
              color: selectedCategory === cat ? '#FFF' : '#AAA',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 13,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              fontWeight: selectedCategory === cat ? 700 : 400
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results list */}
      <div style={{
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        {activeTab === 'professionals' ? (
          filteredWorkers.length > 0 ? (
            filteredWorkers.map(worker => (
              <div
                key={worker.id}
                onClick={() => navigate(createPageUrl("Profile") + `?userId=${worker.id}`)}
                style={{
                  background: '#2A2A2A',
                  borderRadius: 14,
                  padding: 14,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#888',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0
                }}>
                  👤
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontWeight: 'bold',
                    fontSize: 15,
                    color: '#FFF',
                    margin: 0
                  }}>
                    {worker.full_name}
                  </p>
                  <p style={{
                    color: '#AAA',
                    fontSize: 13,
                    margin: '2px 0 4px 0'
                  }}>
                    {worker.skills?.[0] || 'Profissional'}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center'
                  }}>
                    <span style={{
                      color: '#FF6600',
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      ★ {(worker.rating || 4.5).toFixed(1)}
                    </span>
                    <span style={{
                      background: '#FF6600',
                      color: '#FFF',
                      borderRadius: 20,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      ✓ Verificado
                    </span>
                  </div>
                </div>

                {/* Distance badge */}
                <span style={{
                  background: '#FF6600',
                  color: '#FFF',
                  borderRadius: 20,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  5 km
                </span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#AAA', paddingTop: 40 }}>
              <p>Nenhum profissional encontrado</p>
            </div>
          )
        ) : (
          filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <div
                key={job.id}
                onClick={() => navigate(createPageUrl("Home"))}
                style={{
                  background: '#2A2A2A',
                  border: '2px solid #FF6600',
                  borderRadius: 14,
                  padding: 14,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#888',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0
                }}>
                  💼
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontWeight: 'bold',
                    fontSize: 15,
                    color: '#FFF',
                    margin: 0
                  }}>
                    {job.title}
                  </p>
                  <p style={{
                    color: '#AAA',
                    fontSize: 13,
                    margin: '2px 0 4px 0'
                  }}>
                    📍 {job.location}
                  </p>
                  <span style={{
                    color: '#FF6600',
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    ★ 4.9
                  </span>
                </div>

                {/* Price badge */}
                <span style={{
                  background: '#FF6600',
                  color: '#FFF',
                  borderRadius: 20,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  €{job.price}
                </span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#AAA', paddingTop: 40 }}>
              <p>Nenhum anúncio encontrado</p>
            </div>
          )
        )}
      </div>

      {/* Logo */}
      <div style={{
        textAlign: 'center',
        margin: '20px auto',
        fontSize: 40
      }}>
        φ
      </div>
    </div>
  );
}