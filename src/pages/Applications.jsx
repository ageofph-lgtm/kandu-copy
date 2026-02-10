import React, { useState, useEffect, useCallback } from "react";
import { Application } from "@/entities/Application";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Clock, User as UserIcon, CheckCircle, Trophy, Settings, Edit } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CompletionModal from "../components/applications/CompletionModal";

function ApplicationCard({ application, job, applicant, employer, onAccept, onDecline, onComplete, onStartJob, onDelete, userType, currentUser }) {
  const finalPrice = application.proposed_price || job.price;

  const getStatusBadge = (status, jobStatus) => {
    if (jobStatus === 'completed') return <Badge className="bg-blue-500">Trabalho Finalizado</Badge>;
    if (jobStatus === 'completed_by_employer') return <Badge className="bg-orange-500">Aguardando Sua Avaliação</Badge>;
    switch(status) {
      case 'pending': return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'accepted': return <Badge className="bg-green-500">Aceite</Badge>;
      case 'rejected': return <Badge className="bg-red-500">Recusada</Badge>;
      default: return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const displayUser = userType === 'worker' ? employer : applicant;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar><AvatarFallback className="bg-blue-500 text-white">{displayUser?.full_name?.charAt(0) || <UserIcon />}</AvatarFallback></Avatar>
            <div>
              <h3 className="font-semibold">{displayUser?.full_name || "Utilizador"}</h3>
              <p className="text-sm text-gray-600">{job.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">{getStatusBadge(application.status, job.status)}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div><p className="text-sm">{application.message}</p></div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div><span className="text-sm text-gray-600">Valor:</span><p className="font-bold text-lg text-blue-600">€{finalPrice}{application.application_type === 'proposal' && <span className="text-xs text-gray-600 ml-2">(Proposto)</span>}</p></div>
          {job.price !== finalPrice && <div className="text-right"><span className="text-xs text-gray-500">Preço original:</span><p className="text-sm line-through text-gray-400">€{job.price}</p></div>}
        </div>
        <div className="text-xs text-gray-500">Enviado em: {format(new Date(application.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}</div>
        {userType === 'employer' && application.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="destructive" onClick={() => onDecline(application)} className="flex-1"><X className="w-4 h-4 mr-2" />Recusar</Button>
            <Button onClick={() => onAccept(application)} className="flex-1 bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-2" />Aceitar</Button>
          </div>
        )}
        {userType === 'employer' && application.status === 'accepted' && job.status === 'open' && (
          <div className="pt-2 border-t">
            <Button onClick={() => onStartJob(application, job)} className="w-full bg-blue-600 hover:bg-blue-700"><CheckCircle className="w-4 h-4 mr-2" />Iniciar Trabalho</Button>
          </div>
        )}
        {userType === 'employer' && application.status === 'accepted' && job.status === 'in_progress' && (
          <div className="pt-2 border-t">
            <Button onClick={() => onComplete(application, job, applicant)} className="w-full bg-yellow-600 hover:bg-yellow-700"><Trophy className="w-4 h-4 mr-2" />Finalizar Obra e Avaliar</Button>
          </div>
        )}
        {userType === 'worker' && job.status === 'completed_by_employer' && application.status === 'accepted' && (
          <div className="pt-2 border-t">
            <Button onClick={() => onComplete(application, job, employer)} className="w-full bg-blue-600 hover:bg-blue-700"><Edit className="w-4 h-4 mr-2" />Avaliar Empregador</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Applications() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState({});
  const [employers, setEmployers] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState(null);

  const markNotificationsAsRead = useCallback(async (currentUser) => {
    if (!currentUser) return;
    try {
      const unreadNotifications = await Notification.filter({ user_id: currentUser.id, is_read: false });
      const appNotifs = unreadNotifications.filter(n => ['new_application', 'new_proposal', 'job_accepted', 'job_rejected', 'job_completed', 'job_ready_for_review'].includes(n.type));
      for (const notif of appNotifs) {
        await Notification.update(notif.id, { is_read: true });
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      await markNotificationsAsRead(currentUser);

      let applicationsData = [];
      const allJobs = await Job.list("-created_date");
      setJobs(allJobs);

      if (currentUser.user_type === 'admin') {
        applicationsData = await Application.list("-created_date");
      } else if (currentUser.user_type === 'employer') {
        const userJobIds = allJobs.filter(j => j.employer_id === currentUser.id).map(j => j.id);
        if (userJobIds.length > 0) applicationsData = await Application.filter({ job_id: { $in: userJobIds } }, "-created_date");
      } else if (currentUser.user_type === 'worker') {
        applicationsData = await Application.filter({ worker_id: currentUser.id }, "-created_date");
      }
      setApplications(applicationsData);

      const userIds = new Set();
      applicationsData.forEach(app => userIds.add(app.worker_id));
      allJobs.forEach(job => userIds.add(job.employer_id));
      
      const usersToFetch = Array.from(userIds).filter(Boolean);
      const userMap = new Map();
      if (usersToFetch.length > 0) {
        const fetchedUsers = await User.filter({ id: { $in: usersToFetch } });
        fetchedUsers.forEach(u => userMap.set(u.id, u));
      }

      const finalApplicants = {}, finalEmployers = {};
      applicationsData.forEach(app => { if (userMap.has(app.worker_id)) finalApplicants[app.worker_id] = userMap.get(app.worker_id); });
      allJobs.forEach(job => { if (userMap.has(job.employer_id)) finalEmployers[job.employer_id] = userMap.get(job.employer_id); });
      setApplicants(finalApplicants); setEmployers(finalEmployers);
    } catch (error) { console.error("Error loading applications:", error); } 
    finally { setLoading(false); }
  }, [markNotificationsAsRead]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAcceptApplication = async (app) => {
    try {
      const job = jobs.find(j => j.id === app.job_id);
      if (!job) return;
      const finalPrice = app.proposed_price || job.price;

      await Application.update(app.id, { status: "accepted" });
      await Job.update(app.job_id, { status: 'in_progress', worker_id: app.worker_id, price: finalPrice });

      await Notification.create({
        user_id: app.worker_id,
        type: "job_accepted",
        title: "🎉 Proposta Aceite!",
        message: `A sua candidatura para "${job.title}" foi aceite.`,
        related_id: app.job_id,
        action_url: createPageUrl("Applications"),
      });
      alert("Proposta aceite com sucesso!");
      loadData();
    } catch(error) { console.error("Erro ao aceitar proposta: ", error); }
  };
  
  const handleDeclineApplication = async (app) => {
    try {
      await Application.update(app.id, { status: "rejected" });
      const job = jobs.find(j => j.id === app.job_id);
      await Notification.create({
        user_id: app.worker_id,
        type: "job_rejected",
        title: "❌ Proposta Recusada",
        message: `A sua candidatura para "${job.title}" foi recusada.`,
        related_id: app.job_id,
        action_url: createPageUrl("Applications"),
      });
      alert("Proposta recusada.");
      loadData();
    } catch(error) { console.error("Erro ao recusar proposta: ", error); }
  };

  const handleStartJob = async (application, job) => {
    try {
      if (!window.confirm('Tem certeza que quer iniciar este trabalho?')) return;
      
      await Job.update(job.id, { 
        status: 'in_progress',
        actual_start_date: new Date().toISOString()
      });

      await Notification.create({
        user_id: application.worker_id,
        type: "job_started",
        title: "🚀 Trabalho Iniciado!",
        message: `O trabalho "${job.title}" foi iniciado pelo empregador.`,
        related_id: job.id,
        action_url: createPageUrl("MyJobs"),
      });

      alert("Trabalho iniciado com sucesso!");
      loadData();
    } catch(error) {
      console.error("Erro ao iniciar trabalho:", error);
      alert("Erro ao iniciar trabalho.");
    }
  };

  const handleCompleteJob = (application, job, otherUser) => {
    setSelectedCompletion({ application, job, otherUser });
    setShowCompletionModal(true);
  };
  const handleCompletionClose = () => { setShowCompletionModal(false); setSelectedCompletion(null); };
  const handleCompletionComplete = () => { loadData(); };
  const handleDeleteApplication = async (application) => {}; // Placeholder

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const acceptedApplications = applications.filter(app => app.status === 'accepted');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');

  if (loading) return <div className="p-4 h-screen flex flex-col items-center justify-center"><Settings className="w-12 h-12 text-gray-400 animate-spin mb-4" /><p>A carregar...</p></div>;
  if (!user) return <div className="p-4">Utilizador não encontrado</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Candidaturas</h1>
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-2" />Pendentes ({pendingApplications.length})</TabsTrigger>
          <TabsTrigger value="accepted"><CheckCircle className="w-4 h-4 mr-2" />Aceites ({acceptedApplications.length})</TabsTrigger>
          <TabsTrigger value="rejected"><X className="w-4 h-4 mr-2" />Recusadas ({rejectedApplications.length})</TabsTrigger>
        </TabsList>
        {[
          { value: "pending", data: pendingApplications },
          { value: "accepted", data: acceptedApplications },
          { value: "rejected", data: rejectedApplications }
        ].map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <div className="space-y-4">
              {tab.data.length > 0 ? tab.data.map(app => {
                const job = jobs.find(j => j.id === app.job_id);
                if (!job) return null;
                const applicant = applicants[app.worker_id];
                const employer = employers[job.employer_id];
                return <ApplicationCard key={app.id} application={app} job={job} applicant={applicant} employer={employer} onAccept={handleAcceptApplication} onDecline={handleDeclineApplication} onComplete={handleCompleteJob} onStartJob={handleStartJob} onDelete={handleDeleteApplication} userType={user.user_type} currentUser={user} />;
              }) : <Card className="text-center p-8"><p>Nenhuma candidatura nesta categoria.</p></Card>}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      {showCompletionModal && selectedCompletion && <CompletionModal job={selectedCompletion.job} application={selectedCompletion.application} otherUser={selectedCompletion.otherUser} currentUser={user} onClose={handleCompletionClose} onComplete={handleCompletionComplete} />}
    </div>
  );
}