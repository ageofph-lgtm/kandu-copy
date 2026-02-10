import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Job } from "@/entities/Job";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Filter, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MapView from "../components/dashboard/MapView";
import JobModal from "../components/dashboard/JobModal";
import { translations } from "../components/utils/translations";

const LISBON_COORDS = [38.7223, -9.1393];

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("workers"); // workers or jobs

  const t = (key) => {
    return translations[user?.language || 'PT']?.[key] || translations.PT[key] || key;
  };

  const categories = ["all", "Pintura", "Eletricidade", "Canalização", "Alvenaria", "Ladrilhador", "Carpintaria", "Climatização", "Isolamentos", "Pavimentos", "Telhados"];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      if (!userData.user_type) {
        navigate(createPageUrl("SetupProfile"));
        return;
      }

      // Clientes veem profissionais disponíveis
      if (userData.user_type === 'employer' || userData.user_type === 'admin') {
        const allUsers = await User.list();
        const workerList = allUsers.filter(u => 
          u.user_type === 'worker' && 
          u.status === 'active'
        );
        setWorkers(workerList);
        setFilteredWorkers(workerList);
      }
      
      // Carregar trabalhos abertos (para todos)
      const openJobs = await Job.filter({ status: 'open' });
      setJobs(openJobs);

    } catch (error) {
      console.error("Error loading data:", error);
      if (error.response?.status === 401 || error.message?.includes('401')) {
        navigate(createPageUrl("SetupProfile"));
      }
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Redirecionar admin para o dashboard administrativo
  useEffect(() => {
    if (user && user.user_type === 'admin') {
      navigate(createPageUrl("AdminDashboard"));
    }
  }, [user, navigate]);

  const filterWorkers = useCallback(() => {
    let filtered = workers;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(worker => 
        worker.skills?.includes(selectedCategory)
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(worker =>
        worker.full_name?.toLowerCase().includes(term) ||
        worker.city?.toLowerCase().includes(term) ||
        worker.skills?.some(skill => skill.toLowerCase().includes(term))
      );
    }

    setFilteredWorkers(filtered);
  }, [workers, searchTerm, selectedCategory]);

  useEffect(() => {
    filterWorkers();
  }, [filterWorkers]);

  const getCenter = () => {
    if (user && user.latitude && user.longitude) {
      return [user.latitude, user.longitude];
    }
    return LISBON_COORDS;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Settings className="w-12 h-12 text-gray-400 animate-spin mb-4" />
        <p className="text-gray-500">A carregar...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Não autenticado</p>
          <Button onClick={() => navigate(createPageUrl("SetupProfile"))}>Ir para Login</Button>
        </div>
      </div>
    );
  }

  // Admin não deve ver esta página
  if (user.user_type === 'admin') {
    return null;
  }

  // Para profissionais, mostrar trabalhos disponíveis
  if (user.user_type === 'worker') {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Trabalhos Disponíveis</h1>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder={t('searchPlaceholder')} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 h-11" 
              />
            </div>
          </div>
        </header>

        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button 
                key={category} 
                variant={selectedCategory === category ? "default" : "outline"} 
                size="sm" 
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category === "all" ? t('allCategories') : t(category.toLowerCase()) || category}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <MapView 
            jobs={jobs.filter(job => {
              if (selectedCategory !== "all" && job.category !== selectedCategory) return false;
              if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return job.title.toLowerCase().includes(term) ||
                       job.location.toLowerCase().includes(term) ||
                       job.description.toLowerCase().includes(term);
              }
              return true;
            })} 
            onJobClick={(job) => setSelectedWorker(job)} 
            center={getCenter()} 
            radius={10000} 
          />
        </div>

        {selectedWorker && (
          <JobModal
            job={selectedWorker}
            user={user}
            onClose={() => setSelectedWorker(null)}
            onApply={() => {
              setSelectedWorker(null);
              loadData();
            }}
          />
        )}
      </div>
    );
  }

  // Para clientes/empregadores, mostrar profissionais disponíveis
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Buscar Profissionais</h1>
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input 
              placeholder="Procurar por nome, cidade ou especialidade..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 h-11" 
            />
          </div>
          <Button 
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="bg-[#F26522] hover:bg-orange-600 whitespace-nowrap"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Ver Todas as Obras
          </Button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button 
              key={category} 
              variant={selectedCategory === category ? "default" : "outline"} 
              size="sm" 
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category === "all" ? "Todas Especialidades" : category}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.length > 0 ? (
              filteredWorkers.map(worker => (
                <div 
                  key={worker.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(createPageUrl("Profile") + `?userId=${worker.id}`)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative w-16 h-16">
                      <div 
                        className="w-full h-full bg-gradient-to-br from-[#F26522] to-orange-600"
                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      >
                        {worker.avatar_url ? (
                          <img 
                            src={worker.avatar_url} 
                            alt={worker.full_name}
                            className="w-full h-full object-cover"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                            {worker.full_name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{worker.full_name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {worker.city || "Localização não definida"}
                      </p>
                      {worker.rating > 0 && (
                        <p className="text-sm text-yellow-500 font-semibold">
                          ⭐ {worker.rating.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {worker.skills && worker.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {worker.skills.slice(0, 3).map((skill, idx) => (
                        <span 
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {worker.skills.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{worker.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {worker.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {worker.bio}
                    </p>
                  )}

                  <Button 
                    className="w-full bg-[#F26522] hover:bg-orange-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(createPageUrl("Chat") + `?userId=${worker.id}`);
                    }}
                  >
                    Contactar
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-800">Nenhum profissional encontrado</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Tente ajustar os filtros ou a pesquisa
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}