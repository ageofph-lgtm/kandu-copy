import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Application } from "@/entities/Application";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Clock, User as UserIcon, CheckCircle, Trophy, Settings, RefreshCw, MapPin, Euro } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CompletionModal from "../components/applications/CompletionModal";

function getStatusBadge(status, jobStatus) {
  if (jobStatus === 'completed') return <Badge className="bg-blue-500 text-white">Finalizado</Badge>;
  if (jobStatus === 'completed_by_employer') return <Badge className="bg-orange-500 text-white">A aguardar avaliação</Badge>;
  switch (status) {
    case 'pending':  return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pendente</Badge>;
    case 'accepted': return <Badge className="bg-green-100 text-green-800">✅ Aceite</Badge>;
    case 'rejected': return <Badge className="bg-red-100 text-red-700">❌ Recusada</Badge>;
    default:         return <Badge variant="secondary">{status}</Badge>;
  }
}

function ApplicationCard({ application, job, applicant, employer, onAccept, onDecline, onComplete, userType }) {
  const finalPrice = application.proposed_price || job?.price;
  const displayUser = userType === 'worker' ? employer : applicant;

  if (!job) return null;

  return (
    <Card className="mb-3 shadow-sm border border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="flex-shrink-0">
              <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                {displayUser?.full_name?.charAt(0) || <UserIcon className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{displayUser?.full_name || (userType === 'worker' ? "Empregador" : "Candidato")}</p>
              <p className="text-xs text-gray-500 truncate">{job.title}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{job.location}
              </p>
            </div>
          </div>
          {getStatusBadge(application.status, job.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Price */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <div>
            <span className="text-xs text-gray-500">Valor</span>
            <p className="font-bold text-[#F26522] text-lg">€{finalPrice}
              {application.application_type === 'proposal' && (
                <span className="text-xs text-gray-500 font-normal ml-1">(proposta)</span>
              )}
            </p>
          </div>
          {job.price !== finalPrice && (
            <div className="text-right">
              <span className="text-xs text-gray-400">Original</span>
              <p className="text-sm line-through text-gray-400">€{job.price}</p>
            </div>
          )}
        </div>

        {/* Message */}
        {application.message && (
          <p className="text-sm text-gray-600 italic bg-white border border-gray-100 rounded-lg p-2.5">
            "{application.message.slice(0, 120)}{application.message.length > 120 ? '...' : ''}"
          </p>
        )}

        <div className="text-xs text-gray-400">
          {format(new Date(application.created_date), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
        </div>

        {/* Employer actions */}
        {userType === 'employer' && application.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="destructive" onClick={() => onDecline(application)} className="flex-1 text-sm py-2">
              <X className="w-4 h-4 mr-1" />Recusar
            </Button>
            <Button onClick={() => onAccept(application)} className="flex-1 bg-green-600 hover:bg-green-700 text-sm py-2">
              <Check className="w-4 h-4 mr-1" />Aceitar
            </Button>
          </div>
        )}
        {userType === 'employer' && application.status === 'accepted' && job.status === 'in_progress' && (
          <div className="pt-2 border-t">
            <Button onClick={() => onComplete(application, job, applicant)} className="w-full bg-yellow-600 hover:bg-yellow-700 text-sm">
              <Trophy className="w-4 h-4 mr-2" />Finalizar Obra e Avaliar
            </Button>
          </div>
        )}

        {/* Worker actions */}
        {userType === 'worker' && job.status === 'completed_by_employer' && application.status === 'accepted' && (
          <div className="pt-2 border-t">
            <Button onClick={() => onComplete(application, job, employer)} className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
              <CheckCircle className="w-4 h-4 mr-2" />Avaliar Empregador
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Applications() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState({});        // id -> job
  const [applicants, setApplicants] = useState({}); // worker_id -> user
  const [employers, setEmployers] = useState({}); // employer_id -> user
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Mark related notifications as read
      try {
        const unread = await Notification.filter({ user_id: currentUser.id, is_read: false });
        const appNotifs = unread.filter(n =>
          ['new_application', 'new_proposal', 'job_accepted', 'job_rejected', 'job_completed', 'job_ready_for_review'].includes(n.type)
        );
        for (const n of appNotifs) await Notification.update(n.id, { is_read: true });
      } catch (_) {}

      let applicationsData = [];

      if (currentUser.user_type === 'admin') {
        applicationsData = await Application.list("-created_date");
      } else if (currentUser.user_type === 'employer') {
        // Get employer's jobs first, then fetch their applications
        const allJobs = await Job.list("-created_date");
        const myJobIds = allJobs.filter(j => j.employer_id === currentUser.id).map(j => j.id);
        if (myJobIds.length > 0) {
          // Fetch all applications and filter client-side (avoids $in issues)
          const allApps = await Application.list("-created_date");
          applicationsData = allApps.filter(a => myJobIds.includes(a.job_id));
        }
      } else if (currentUser.user_type === 'worker') {
        applicationsData = await Application.filter({ worker_id: currentUser.id }, "-created_date");
      }

      setApplications(applicationsData);

      if (applicationsData.length === 0) { setLoading(false); return; }

      // Collect all job IDs and user IDs to fetch
      const jobIdSet = new Set(applicationsData.map(a => a.job_id).filter(Boolean));
      const workerIdSet = new Set(applicationsData.map(a => a.worker_id).filter(Boolean));

      // Fetch all jobs (needed to get employer IDs too)
      const allJobsList = await Job.list();
      const jobMap = {};
      allJobsList.forEach(j => { jobMap[j.id] = j; });
      setJobs(jobMap);

      // Collect employer IDs from those jobs
      const employerIdSet = new Set(
        Array.from(jobIdSet).map(id => jobMap[id]?.employer_id).filter(Boolean)
      );

      // Fetch users (workers + employers)
      const allUserIds = [...new Set([...workerIdSet, ...employerIdSet])];
      const allUsers = await User.list();
      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });

      const newApplicants = {}, newEmployers = {};
      workerIdSet.forEach(id => { if (userMap[id]) newApplicants[id] = userMap[id]; });
      employerIdSet.forEach(id => { if (userMap[id]) newEmployers[id] = userMap[id]; });

      setApplicants(newApplicants);
      setEmployers(newEmployers);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAcceptApplication = async (app) => {
    try {
      const job = jobs[app.job_id];
      if (!job) return;
      const finalPrice = app.proposed_price || job.price;
      await Application.update(app.id, { status: "accepted" });
      await Job.update(app.job_id, { status: 'in_progress', worker_id: app.worker_id, price: finalPrice });
      await Notification.create({
        user_id: app.worker_id,
        type: "job_accepted",
        title: "🎉 Candidatura Aceite!",
        message: `A sua candidatura para "${job.title}" foi aceite.`,
        related_id: app.job_id,
        action_url: createPageUrl("Applications"),
      });
      loadData();
    } catch (error) {
      console.error("Erro ao aceitar:", error);
      alert("Erro ao aceitar candidatura. Tenta novamente.");
    }
  };

  const handleDeclineApplication = async (app) => {
    if (!window.confirm("Tem a certeza que quer recusar esta candidatura?")) return;
    try {
      await Application.update(app.id, { status: "rejected" });
      const job = jobs[app.job_id];
      if (job) {
        await Notification.create({
          user_id: app.worker_id,
          type: "job_rejected",
          title: "Candidatura não aceite",
          message: `A sua candidatura para "${job.title}" não foi aceite desta vez.`,
          related_id: app.job_id,
          action_url: createPageUrl("Applications"),
        });
      }
      loadData();
    } catch (error) {
      console.error("Erro ao recusar:", error);
    }
  };

  const handleCompleteJob = (application, job, otherUser) => {
    setSelectedCompletion({ application, job, otherUser });
    setShowCompletionModal(true);
  };

  const pendingApps    = applications.filter(a => a.status === 'pending');
  const acceptedApps   = applications.filter(a => a.status === 'accepted');
  const rejectedApps   = applications.filter(a => a.status === 'rejected');

  if (loading) {
    return (
      <div className="p-4 h-screen flex flex-col items-center justify-center">
        <div style={{width:44,height:44,border:"4px solid #FF6600",borderTop:"4px solid transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}} />
        <p className="text-gray-500">A carregar candidaturas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {showCompletionModal && selectedCompletion && (
        <CompletionModal
          isOpen={showCompletionModal}
          application={selectedCompletion.application}
          job={selectedCompletion.job}
          otherUser={selectedCompletion.otherUser}
          userType={user?.user_type}
          currentUser={user}
          onClose={() => { setShowCompletionModal(false); setSelectedCompletion(null); }}
          onComplete={() => { setShowCompletionModal(false); setSelectedCompletion(null); loadData(); }}
        />
      )}

      {/* Header */}
      <div style={{ background: isDark ? "#1A1A1A" : "#FFFFFF", borderBottom: isDark ? "1px solid #333" : "1px solid #F0F0F0", padding: "14px 20px 12px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <img src={isDark ? "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/90321a683_Gemini_Generated_Image_k4rh2gk4rh2gk4rh.png" : "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/002158942_Gemini_Generated_Image_5.png"} alt="KANDU" style={{ height: 24, objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 20, color: isDark ? "#FFF" : "#1A1A1A" }}>Candidaturas</h1>
            <p style={{ margin: 0, fontSize: 11, color: isDark ? "#AAA" : "#888" }}>{applications.length} total</p>
          </div>
          <Button size="sm" variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {applications.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="mx-auto w-14 h-14 text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">
              {user?.user_type === 'worker' ? "Ainda não te candidataste a nenhuma obra" : "Nenhuma candidatura recebida"}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              {user?.user_type === 'worker'
                ? "Pesquisa obras disponíveis e candidata-te."
                : "Publica obras para começar a receber candidatos."}
            </p>
            <Button
              onClick={() => navigate(createPageUrl(user?.user_type === 'worker' ? "Dashboard" : "NewJob"))}
              className="bg-[#F26522] hover:bg-orange-600 text-white"
            >
              {user?.user_type === 'worker' ? "Ver obras" : "Nova obra"}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="pending">
                Pendentes {pendingApps.length > 0 && (
                  <span className="ml-1 text-xs bg-orange-500 text-white rounded-full px-1.5 py-0.5 font-bold">{pendingApps.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Aceites {acceptedApps.length > 0 && (
                  <span className="ml-1 text-xs bg-green-500 text-white rounded-full px-1.5 py-0.5 font-bold">{acceptedApps.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Recusadas {rejectedApps.length > 0 && (
                  <span className="ml-1 text-xs bg-gray-400 text-white rounded-full px-1.5 py-0.5">{rejectedApps.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            {[
              { key: "pending",  list: pendingApps,  emptyMsg: "Nenhuma candidatura pendente" },
              { key: "accepted", list: acceptedApps, emptyMsg: "Nenhuma candidatura aceite" },
              { key: "rejected", list: rejectedApps, emptyMsg: "Nenhuma candidatura recusada" },
            ].map(({ key, list, emptyMsg }) => (
              <TabsContent key={key} value={key}>
                {list.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">{emptyMsg}</div>
                ) : list.map(app => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    job={jobs[app.job_id]}
                    applicant={applicants[app.worker_id]}
                    employer={employers[jobs[app.job_id]?.employer_id]}
                    onAccept={handleAcceptApplication}
                    onDecline={handleDeclineApplication}
                    onComplete={handleCompleteJob}
                    userType={user?.user_type}
                    currentUser={user}
                  />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
