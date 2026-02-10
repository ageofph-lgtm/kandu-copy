import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Job } from "@/entities/Job";
import { Rating } from "@/entities/Rating";
import { Application } from "@/entities/Application";
import { Blacklist } from "@/entities/Blacklist";
// Removed ChatMessage import as its cleanup logic is moved
// Removed Notification import as its cleanup logic is moved
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  AlertTriangle,
  Users,
  Star,
  Ban,
  Eye,
  Calendar,
  TrendingDown,
  Search,
  Settings,
  Loader2, // Added Loader2 import
  PlusCircle // Added PlusCircle import for new button
} from "lucide-react"; // Removed Trash2 import
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom"; // Added useNavigate import

// Placeholder for createPageUrl - replace with actual implementation if available in the project
// This function typically constructs URLs based on named routes or a specific pattern.
// For this context, we'll assume it maps a string name to a path.
const createPageUrl = (pageName) => {
  switch (pageName) {
    case "Dashboard":
      return "/dashboard";
    case "AdminCleanup":
      return "/admin/cleanup"; // Define the path for the new cleanup page
    default:
      return `/${pageName.toLowerCase()}`;
  }
};

function UserManagementCard({ user, onAction }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold">{user.full_name || user.email}</h4>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <Badge className={getStatusColor(user.status || 'active')}>
            {user.status || 'active'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <span><strong>Tipo:</strong> {user.user_type}</span>
          <span><strong>Cidade:</strong> {user.city || 'N/A'}</span>
          <span><strong>Rating:</strong> {user.rating || 0}/5 ⭐</span>
          <span><strong>XP:</strong> {user.xp || 0}</span>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onAction('view', user)}>
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onAction('blacklist', user)}>
            <Ban className="w-4 h-4 mr-1" />
            Blacklist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LowRatingAlert({ rating, onAction }) {
  const [ratedUser, setRatedUser] = useState(null);
  const [raterUser, setRaterUser] = useState(null);
  const [job, setJob] = useState(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const [rated] = await User.filter({ id: rating.rated_id });
        const [rater] = await User.filter({ id: rating.rater_id });
        const [jobData] = await Job.filter({ id: rating.job_id });

        setRatedUser(rated);
        setRaterUser(rater);
        setJob(jobData);
      } catch (error) {
        console.error("Error loading rating details:", error);
      }
    };
    loadDetails();
  }, [rating]);

  return (
    <Card className="border-red-200 bg-red-50 mb-3">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h4 className="font-semibold text-red-800">Avaliação Muito Baixa Detectada</h4>
        </div>

        <div className="space-y-1 text-sm mb-3">
          <p><strong>Avaliado:</strong> {ratedUser?.full_name || 'N/A'}</p>
          <p><strong>Avaliador:</strong> {raterUser?.full_name || 'N/A'}</p>
          <p><strong>Obra:</strong> {job?.title || 'N/A'}</p>
          <p><strong>Rating:</strong> {rating.rating}/5 ⭐</p>
          <p><strong>Comentário:</strong> {rating.comment}</p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => onAction('investigate', { rating, ratedUser, raterUser, job })}>
            Investigar
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAction('ignore', rating)}>
            Ignorar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BlacklistModal({ user, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState("warning");
  const [evidence, setEvidence] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleSubmit = () => {
    onSubmit({
      user_id: user.id,
      reason,
      severity,
      evidence,
      expires_at: expiresAt || null
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Adicionar à Blacklist: {user.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Severidade</label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="suspension">Suspensão</SelectItem>
                <SelectItem value="ban">Banimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Motivo *</label>
            <Textarea
              placeholder="Descreva o motivo da penalização..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Evidências</label>
            <Textarea
              placeholder="URLs de screenshots, IDs de conversas, etc..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={2}
            />
          </div>

          {severity !== "warning" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Data de Expiração {severity === "ban" ? "(opcional para banimento permanente)" : "*"}
              </label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!reason} className="flex-1 bg-red-600 hover:bg-red-700">
              Aplicar Penalização
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Example job data for testing purposes
const EXAMPLE_JOBS = [
  {
    title: "Remodelação de Cozinha Moderna",
    description: "Reforma completa de cozinha, incluindo instalação de novos armários, bancadas de quartzo, eletrodomésticos e revestimentos.",
    category: "Remodelação",
    location: "Lisboa",
    price: 4500,
    status: "open",
    image_urls: ["https://picsum.photos/id/1018/300/200"],
    required_skills: ["pedreiro", "eletricista", "canalizador"],
    estimated_time: "20 dias",
    contact_info: "email@example.com",
  },
  {
    title: "Pintura Exterior de Moradia",
    description: "Pintura de toda a fachada exterior de uma moradia T3. Inclui preparação da superfície e aplicação de tinta resistente às intempéries.",
    category: "Pintura",
    location: "Porto",
    price: 1800,
    status: "open",
    image_urls: ["https://picsum.photos/id/1043/300/200"],
    required_skills: ["pintor"],
    estimated_time: "7 dias",
    contact_info: "email@example.com",
  },
  {
    title: "Instalação de Chão Flutuante",
    description: "Instalação de 80m² de chão flutuante em apartamento, incluindo remoção do pavimento antigo e rodapés.",
    category: "Pavimentos",
    location: "Coimbra",
    price: 1200,
    status: "open",
    image_urls: ["https://picsum.photos/id/1025/300/200"],
    required_skills: ["aplicador de pavimentos"],
    estimated_time: "3 dias",
    contact_info: "email@example.com",
  },
  {
    title: "Reparação de Telhado - Urgente",
    description: "Reparação de infiltração no telhado de edifício, substituição de telhas partidas e vedação de calhas.",
    category: "Reparações",
    location: "Faro",
    price: 900,
    status: "open",
    image_urls: ["https://picsum.photos/id/1070/300/200"],
    required_skills: ["telhador"],
    estimated_time: "2 dias",
    contact_info: "email@example.com",
  },
  {
    title: "Montagem de Mobília IKEA",
    description: "Montagem de vários móveis IKEA para sala e quarto (guarda-roupa, cómoda, estante).",
    category: "Montagens",
    location: "Setúbal",
    price: 350,
    status: "open",
    image_urls: ["https://picsum.photos/id/1069/300/200"],
    required_skills: ["montador de móveis"],
    estimated_time: "1 dia",
    contact_info: "email@example.com",
  },
  {
    title: "Jardinagem e Manutenção de Espaços Verdes",
    description: "Corte de relva, poda de árvores e arbustos, limpeza de canteiros para jardim de 200m².",
    category: "Jardinagem",
    location: "Aveiro",
    price: 250,
    status: "open",
    image_urls: ["https://picsum.photos/id/1084/300/200"],
    required_skills: ["jardineiro"],
    estimated_time: "1 dia",
    contact_info: "email@example.com",
  }
];

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [lowRatings, setLowRatings] = useState([]);
  const [blacklistEntries, setBlacklistEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [loading, setLoading] = useState(true);
  // Removed cleanupMessage state variable
  const [isCreatingExamples, setIsCreatingExamples] = useState(false); // New state for example jobs loading

  const navigate = useNavigate(); // Initialize useNavigate

  // Removed runCleanup function, its logic is now entirely handled by the AdminCleanup page.

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setCurrentUser(userData);

      if (userData.user_type !== 'admin') {
        alert("Acesso negado. Apenas administradores podem aceder a esta página.");
        navigate(createPageUrl("Dashboard"));
        return;
      }
      
      // Admin vê TODOS os dados, independentemente de filtros
      const [allUsers, allJobs, allRatings, allBlacklist] = await Promise.all([
        User.list("-created_date"),
        Job.list("-created_date"),
        Rating.list("-created_date"),
        Blacklist.list("-created_date")
      ]);

      // Admin vê todos os usuários exceto outros admins
      setUsers(allUsers.filter(u => u.user_type !== 'admin'));
      setJobs(allJobs);
      setBlacklistEntries(allBlacklist);

      // Filtrar avaliações baixas (≤ 2 estrelas)
      setLowRatings(allRatings.filter(r => r.rating <= 2));

    } catch (error) {
      console.error("Error loading admin data:", error);
      // REMOVIDO: redirecionamento automático
    }
    setLoading(false);
  }, [navigate]);

  // New function to create example jobs
  const createExampleJobs = async () => {
    if (!currentUser || !currentUser.id) {
      alert("Erro: Utilizador administrador não identificado para criar obras.");
      return;
    }

    const confirmCreate = window.confirm("Tem certeza que deseja criar obras de exemplo? Isso adicionará múltiplos registos de obras à base de dados.");
    if (!confirmCreate) return;

    setIsCreatingExamples(true);
    try {
      let createdCount = 0;
      for (const jobData of EXAMPLE_JOBS) {
        await Job.create({ ...jobData, client_id: currentUser.id });
        createdCount++;
      }
      alert(`✅ ${createdCount} obras de exemplo criadas com sucesso!`);
      loadData(); // Refresh data to show new jobs
    } catch (error) {
      console.error("Erro ao criar obras de exemplo:", error);
      alert(`❌ Erro ao criar obras de exemplo: ${error.message}`);
    } finally {
      setIsCreatingExamples(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUserAction = (action, user) => {
    if (action === 'blacklist') {
      setSelectedUser(user);
      setShowBlacklistModal(true);
    }
    // Adicionar outras ações conforme necessário
  };

  const handleBlacklistSubmit = async (blacklistData) => {
    try {
      await Blacklist.create({
        ...blacklistData,
        admin_id: currentUser.id
      });

      // Atualizar status do usuário
      let newStatus = 'active';
      let bannedUntil = null;

      if (blacklistData.severity === 'suspension') {
        newStatus = 'suspended';
        bannedUntil = blacklistData.expires_at;
      } else if (blacklistData.severity === 'ban') {
        newStatus = 'banned';
        bannedUntil = blacklistData.expires_at;
      }

      await User.update(blacklistData.user_id, {
        status: newStatus,
        suspension_reason: blacklistData.reason,
        banned_until: bannedUntil
      });

      alert("Penalização aplicada com sucesso!");
      setShowBlacklistModal(false);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      console.error("Error applying blacklist:", error);
      alert("Erro ao aplicar penalização.");
    }
  };

  const handleRatingAction = (action, data) => {
    if (action === 'investigate') {
      // Implementar lógica de investigação
      console.log("Investigating:", data);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    activeJobs: jobs.filter(j => j.status === 'open').length,
    completedJobs: jobs.filter(j => j.status === 'completed').length,
    lowRatingsCount: lowRatings.length,
    blacklistCount: blacklistEntries.length
  };

  if (loading) { // Removed cleanupMessage from condition
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
        <p className="text-gray-500">A carregar painel administrativo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="p-4 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-6 gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 md:w-6 md:h-6" />
            Painel de Administração
          </h1>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={createExampleJobs}
              disabled={isCreatingExamples}
            >
              {isCreatingExamples ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4 mr-2" />
              )}
              Obras de Exemplo
            </Button>
            {/* Removed the "Limpar Dados" button from the AdminDashboard */}
          </div>
        </div>

        {/* Stats Cards - Responsivo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-4 md:mb-6">
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <Users className="w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-blue-600" />
              <div className="text-lg md:text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-xs md:text-sm text-gray-600">Utilizadores</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <Calendar className="w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-green-600" />
              <div className="text-lg md:text-2xl font-bold">{stats.activeJobs}</div>
              <div className="text-xs md:text-sm text-gray-600">Obras Ativas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <Star className="w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-yellow-600" />
              <div className="text-lg md:text-2xl font-bold">{stats.completedJobs}</div>
              <div className="text-xs md:text-sm text-gray-600">Concluídas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <TrendingDown className="w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-red-600" />
              <div className="text-lg md:text-2xl font-bold">{stats.lowRatingsCount}</div>
              <div className="text-xs md:text-sm text-gray-600">Avaliações Baixas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <Ban className="w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-gray-600" />
              <div className="text-lg md:text-2xl font-bold">{stats.blacklistCount}</div>
              <div className="text-xs md:text-sm text-gray-600">Blacklist</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="users" className="text-xs md:text-sm p-2 md:p-3">Utilizadores</TabsTrigger>
            <TabsTrigger value="ratings" className="text-xs md:text-sm p-2 md:p-3">Avaliações</TabsTrigger>
            <TabsTrigger value="blacklist" className="text-xs md:text-sm p-2 md:p-3">Blacklist</TabsTrigger>
            <TabsTrigger value="jobs" className="text-xs md:text-sm p-2 md:p-3">Obras</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <InviteUserForm />
              <TestingPanel />
            </div>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar utilizadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-3">
              {filteredUsers.map(user => (
                <UserManagementCard
                  key={user.id}
                  user={user}
                  onAction={handleUserAction}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ratings" className="mt-4">
            <div className="space-y-3">
              {lowRatings.length > 0 ? (
                lowRatings.map(rating => (
                  <LowRatingAlert
                    key={rating.id}
                    rating={rating}
                    onAction={handleRatingAction}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 md:p-8 text-center">
                    <Star className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Nenhuma avaliação baixa detectada</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="blacklist" className="mt-4">
            <div className="space-y-3">
              {blacklistEntries.map(entry => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-2">
                      <h4 className="font-semibold">Utilizador ID: {entry.user_id}</h4>
                      <Badge className={
                        entry.severity === 'ban' ? 'bg-red-500' :
                        entry.severity === 'suspension' ? 'bg-yellow-500' : 'bg-gray-500'
                      }>
                        {entry.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{entry.reason}</p>
                    <div className="text-xs text-gray-500">
                      {entry.expires_at && `Expira em: ${format(new Date(entry.expires_at), "dd/MM/yyyy HH:mm", { locale: pt })}`}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="mt-4">
            <div className="grid gap-3">
              {jobs.slice(0, 20).map(job => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-2">
                      <h4 className="font-semibold">{job.title}</h4>
                      <Badge>{job.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{job.location}</p>
                    <div className="text-sm flex flex-wrap gap-2">
                      <span className="font-medium">€{job.price}</span>
                      <span className="text-gray-500">
                        {format(new Date(job.created_date), "dd/MM/yyyy", { locale: pt })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {showBlacklistModal && selectedUser && (
          <BlacklistModal
            user={selectedUser}
            onClose={() => {
              setShowBlacklistModal(false);
              setSelectedUser(null);
            }}
            onSubmit={handleBlacklistSubmit}
          />
        )}
      </div>
    </div>
  );
}