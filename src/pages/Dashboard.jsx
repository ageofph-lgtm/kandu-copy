import React, { useState, useEffect } from "react";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Settings, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import JobCard from "../components/dashboard/JobCard";
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
      setSelectedJob(job); // Open modal even if view update fails
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
      }];

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
      <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#1A1A1A"}}>
        <Settings className="w-12 h-12 animate-spin" style={{color:"#FF6600",marginBottom:16}} />
        <p style={{color:"#AAAAAA"}}>A carregar...</p>
      </div>);
  }

  if (!user) {
    return (
      <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#1A1A1A"}}>
        <div style={{textAlign:"center"}}>
          <p style={{color:"#AAAAAA",marginBottom:16}}>Não autenticado</p>
          <Button onClick={() => navigate(createPageUrl("SetupProfile"))}>Ir para Login</Button>
        </div>
      </div>);
  }

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#1A1A1A"}}>
      <header style={{background:"#111111",borderBottom:"1px solid #222",padding:"50px 24px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{flex:1,maxWidth:400,position:"relative"}}>
          <Search style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#AAAAAA",width:18,height:18}} />
          <input placeholder={t('searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{width:"100%",background:"#2A2A2A",border:"2px solid #FF6600",borderRadius:12,padding:"10px 12px 10px 40px",color:"#FFF",fontSize:14,outline:"none",boxSizing:"border-box"}} />
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:12}}>
          {(user?.user_type === 'employer' || user?.user_type === 'admin') &&
          <button onClick={createSampleJobs} disabled={isCreatingSamples} style={{background:"#2A2A2A",border:"1px solid #444",borderRadius:10,padding:"8px 14px",color:"#AAAAAA",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              {isCreatingSamples ? <RefreshCcw style={{width:14,height:14,animation:"spin 1s linear infinite"}} /> : <Plus style={{width:14,height:14}} />}
              Exemplos
            </button>
          }
          {(user?.user_type === 'employer' || user?.user_type === 'admin') &&
          <button onClick={() => navigate(createPageUrl("NewJob"))} style={{background:"#FF6600",border:"none",borderRadius:14,padding:"10px 18px",color:"#FFF",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <Plus style={{width:14,height:14}} />{t('newJob')}
            </button>
          }
        </div>
      </header>
      <div style={{background:"#111111",borderBottom:"1px solid #222",padding:"8px 24px",display:"flex",gap:8,overflowX:"auto"}}>
        <div style={{display:"flex",gap:8}}>
          {categories.map((category) =>
          <button key={category} onClick={() => setSelectedCategory(category)} style={{background:selectedCategory===category?"#FF6600":"#2A2A2A",border:selectedCategory===category?"none":"1px solid #333",borderRadius:20,padding:"6px 14px",color:selectedCategory===category?"#FFF":"#AAAAAA",fontSize:12,fontWeight:selectedCategory===category?700:400,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
              {category === "all" ? t('allCategories') : t(category.toLowerCase()) || category}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <MapView jobs={filteredJobs} onJobClick={handleJobClick} center={getCenter()} radius={radius} />
      </div>
      {selectedJob &&
      <JobModal
        job={selectedJob}
        user={user}
        onClose={() => setSelectedJob(null)}
        onApply={() => {setSelectedJob(null);loadUserAndJobs();}}
        onDelete={handleDeleteJob} />

      }
    </div>);

}