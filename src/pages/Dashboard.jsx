import React, { useState, useEffect } from "react";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2, RefreshCcw, MapPin, Briefcase, Calendar, MessageCircle, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MapView from "../components/dashboard/MapView";
import JobModal from "../components/dashboard/JobModal";
import { translations } from "../components/utils/translations";

const LISBON_COORDS = [38.7223, -9.1393];

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(10000);
  const [isCreatingSamples, setIsCreatingSamples] = useState(false);

  const t = (key) => {
    return translations[user?.language || 'PT']?.[key] || translations.PT[key] || key;
  };

  const categories = ["all", "Pintura", "Eletricidade", "Canalização", "Alvenaria", "Ladrilhador", "Carpintaria", "Climatização", "Isolamentos", "Pavimentos", "Telhados"];

  const loadUserAndJobs = React.useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      if (!userData.user_type) {
        navigate(createPageUrl("SetupProfile"));
        return;
      }

      const jobList = await Job.list("-created_date");
      setJobs(jobList);
      setFilteredJobs(jobList);
    } catch (error) {
      console.error("Error loading data:", error);
      if (error.response?.status === 401 || error.message?.includes('401')) {
        navigate(createPageUrl("SetupProfile"));
      }
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadUserAndJobs();
  }, [loadUserAndJobs]);

  const filterJobs = React.useCallback(() => {
    let filtered = jobs.filter((job) => {
      if (selectedCategory !== "all" && job.category !== selectedCategory) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return job.title.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term);
      }
      return true;
    });
    setFilteredJobs(filtered);
  }, [jobs, searchTerm, selectedCategory]);

  useEffect(() => {
    filterJobs();
  }, [filterJobs]);

  const handleJobClick = async (job) => {
    if (!user) return;
    try {
      await Job.update(job.id, { views: (job.views || 0) + 1 });
      const updatedJob = { ...job, views: (job.views || 0) + 1 };
      setSelectedJob(updatedJob);
    } catch (error) {
      console.error("Error updating job views:", error);
      setSelectedJob(job);
    }
  };

  const getCenter = () => {
    if (user && user.latitude && user.longitude) {
      return [user.latitude, user.longitude];
    }
    return LISBON_COORDS;
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Tem a certeza que quer apagar esta obra? Esta ação é irreversível.")) {
      return;
    }
    try {
      await Job.delete(jobId);
      alert("Obra apagada com sucesso.");
      setSelectedJob(null);
      loadUserAndJobs();
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Ocorreu um erro ao apagar a obra.");
    }
  };

  const createSampleJobs = async () => {
    if (!user || user.user_type !== 'employer' && user.user_type !== 'admin') {
      alert("Apenas empregadores ou administradores podem criar obras de exemplo.");
      return;
    }
    setIsCreatingSamples(true);
    try {
      const sampleJobs = [
        {
          title: "Pintar fachada de prédio - Avenidas Novas",
          category: "Pintura",
          description: "Pintura completa da fachada de um prédio de 4 andares. Necessário andaimes. Cor a manter.",
          location: "Lisboa - Avenidas Novas", latitude: 38.736, longitude: -9.153,
          price_type: "fixed", price: 5500, status: "open", employer_id: user.id, views: 0, urgency: "low"
        },
        {
          title: "Instalar quadro elétrico novo - Baixa",
          category: "Eletricidade",
          description: "Substituição de quadro elétrico antigo por um novo, com disjuntores modernos, em apartamento T2.",
          location: "Lisboa - Baixa", latitude: 38.71, longitude: -9.138,
          price_type: "fixed", price: 750, status: "open", employer_id: user.id, views: 0, urgency: "high"
        },
        {
          title: "Remodelação completa de WC - Estrela",
          category: "Canalização",
          description: "Remodelação total de casa de banho com 5m². Inclui nova canalização, colocação de sanita, base de duche, e lavatório.",
          location: "Lisboa - Estrela", latitude: 38.712, longitude: -9.16,
          price_type: "fixed", price: 2800, status: "open", employer_id: user.id, views: 0, urgency: "medium"
        },
        {
          title: "Montar cozinha de IKEA",
          category: "Carpintaria",
          description: "Montagem completa de móveis de cozinha da IKEA. Todos os módulos já estão no local.",
          location: "Lisboa - Campo de Ourique", latitude: 38.7191, longitude: -9.1674,
          price_type: "fixed", price: 400, status: "open", employer_id: user.id, views: 0, urgency: "medium"
        }
      ];

      await Job.bulkCreate(sampleJobs);
      alert("Obras de exemplo criadas com sucesso!");
      await loadUserAndJobs();
    } catch (error) {
      console.error("Erro a criar obras de exemplo:", error);
      alert("Ocorreu um erro ao criar as obras de exemplo.");
    } finally {
      setIsCreatingSamples(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">A carregar...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">Não autenticado</p>
          <Button onClick={() => navigate(createPageUrl("SetupProfile"))} className="btn-primary">
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  const stats = {
    activeJobs: jobs.filter(j => j.status === 'open').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    totalValue: jobs.reduce((sum, j) => sum + (j.price || 0), 0)
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Search Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
            <Input 
              placeholder={t('searchPlaceholder')} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 h-11 bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl"
            />
          </div>
          <Button 
            size="icon" 
            variant="outline" 
            className="h-11 w-11 border-[var(--border)] bg-[var(--surface)] rounded-xl"
          >
            <SlidersHorizontal className="w-5 h-5 text-[var(--text-secondary)]" />
          </Button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto mt-3 pb-1 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? "bg-[var(--primary)] text-white shadow-lg"
                  : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
              }`}
            >
              {category === "all" ? t('allCategories') : t(category.toLowerCase()) || category}
            </button>
          ))}
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 relative overflow-hidden">
        <MapView jobs={filteredJobs} onJobClick={handleJobClick} center={getCenter()} radius={radius} />
        
        {/* Floating Action Button */}
        {(user?.user_type === 'employer' || user?.user_type === 'admin') && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
            <Button 
              onClick={createSampleJobs} 
              disabled={isCreatingSamples}
              className="h-12 px-4 bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-full shadow-lg hover:bg-[var(--surface-secondary)]"
            >
              {isCreatingSamples ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
              Exemplos
            </Button>
            <Button 
              onClick={() => navigate(createPageUrl("NewJob"))} 
              className="h-14 w-14 rounded-full bg-[var(--primary)] text-white shadow-lg hover:bg-[var(--primary-dark)] flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(236, 127, 19, 0.4)' }}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>

      {/* Job Modal */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          user={user}
          onClose={() => setSelectedJob(null)}
          onApply={() => { setSelectedJob(null); loadUserAndJobs(); }}
          onDelete={handleDeleteJob}
        />
      )}
    </div>
  );
}