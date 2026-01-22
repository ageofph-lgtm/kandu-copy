import React, { useState, useEffect, useCallback } from "react";
import { Application } from "@/entities/Application";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, ChevronRight, Loader2, Trophy, Edit, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CompletionModal from "../components/applications/CompletionModal";

function ApplicationCard({ application, job, applicant, employer, onAccept, onDecline, onComplete, userType, currentUser }) {
  const finalPrice = application.proposed_price || job.price;

  const getStatusConfig = (status, jobStatus) => {
    if (jobStatus === 'completed') return { label: 'Finalizado', color: 'bg-blue-500' };
    if (jobStatus === 'completed_by_employer') return { label: 'Aguarda Avaliação', color: 'bg-[var(--primary)]' };
    switch(status) {
      case 'pending': return { label: 'Pendente', color: 'bg-yellow-500' };
      case 'accepted': return { label: 'Aceite', color: 'bg-green-500' };
      case 'rejected': return { label: 'Recusada', color: 'bg-red-500' };
      default: return { label: 'Desconhecido', color: 'bg-gray-500' };
    }
  };

  const statusConfig = getStatusConfig(application.status, job.status);
  const displayUser = userType === 'worker' ? employer : applicant;

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden mb-4">
      {/* Header with image */}
      <div className="flex gap-4 p-4">
        {/* Hexagonal Image */}
        <div className="w-20 h-20 flex-shrink-0 relative">
          <div className="w-full h-full hexagon bg-[var(--surface-secondary)] overflow-hidden">
            {job.image_urls?.[0] ? (
              <img src={job.image_urls[0]} alt={job.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[var(--text-muted)]" />
              </div>
            )}
          </div>
          {/* Chat indicator */}
          {application.status === 'accepted' && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
              <span className="text-white text-xs">💬</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[var(--text-primary)] truncate">{job.title}</h3>
            <span className="text-[var(--primary)] font-bold whitespace-nowrap">
              €{finalPrice}{job.price_type === 'hourly' && <span className="text-sm">/hr</span>}
            </span>
          </div>
          
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {displayUser?.full_name || 'Utilizador'} • {job.location}
          </p>

          {/* Status Badge */}
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color} text-white`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
              {statusConfig.label}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Aplicado {format(new Date(application.created_date), "d MMM", { locale: pt })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-secondary)]">
        {job.start_date && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-3">
            <CalendarIcon className="w-4 h-4" />
            <span>Início: {format(new Date(job.start_date), "d MMM yyyy", { locale: pt })}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          {userType === 'employer' && application.status === 'pending' && (
            <div className="flex gap-2 w-full">
              <Button 
                onClick={() => onDecline(application)} 
                variant="outline"
                className="flex-1 border-[var(--border)] text-[var(--text-secondary)]"
              >
                <X className="w-4 h-4 mr-2" />
                Recusar
              </Button>
              <Button 
                onClick={() => onAccept(application)} 
                className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Aceitar
              </Button>
            </div>
          )}

          {userType === 'employer' && application.status === 'accepted' && job.status === 'in_progress' && (
            <Button 
              onClick={() => onComplete(application, job, applicant)} 
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Finalizar e Avaliar
            </Button>
          )}

          {userType === 'worker' && job.status === 'completed_by_employer' && application.status === 'accepted' && (
            <Button 
              onClick={() => onComplete(application, job, employer)} 
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Avaliar Empregador
            </Button>
          )}

          {(application.status !== 'pending' && !(userType === 'employer' && job.status === 'in_progress') && !(userType === 'worker' && job.status === 'completed_by_employer')) && (
            <button className="flex items-center gap-2 text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--primary)]">
              Ver Detalhes
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
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
  const [activeTab, setActiveTab] = useState('pending');

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
      loadData();
    } catch(error) { console.error("Erro ao recusar proposta: ", error); }
  };

  const handleCompleteJob = (application, job, otherUser) => {
    setSelectedCompletion({ application, job, otherUser });
    setShowCompletionModal(true);
  };

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const acceptedApplications = applications.filter(app => app.status === 'accepted');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');

  const tabs = [
    { id: 'pending', label: 'Pendentes', count: pendingApplications.length },
    { id: 'accepted', label: 'Aceites', count: acceptedApplications.length },
    { id: 'rejected', label: 'Recusadas', count: rejectedApplications.length }
  ];

  const currentApplications = activeTab === 'pending' ? pendingApplications 
    : activeTab === 'accepted' ? acceptedApplications 
    : rejectedApplications;

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Minhas Candidaturas</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Gerir propostas e estado</p>
      </div>

      {/* Hexagonal Tabs */}
      <div className="px-4 py-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative min-w-[100px] px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--primary)] text-white shadow-lg'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'
              }`}
              style={activeTab === tab.id ? { boxShadow: '0 0 15px rgba(236, 127, 19, 0.3)' } : {}}
            >
              <div className="text-xs uppercase tracking-wider opacity-80">{tab.label}</div>
              <div className="text-lg font-bold">{tab.count}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="px-4 pb-20">
        {currentApplications.length > 0 ? (
          currentApplications.map(app => {
            const job = jobs.find(j => j.id === app.job_id);
            if (!job) return null;
            const applicant = applicants[app.worker_id];
            const employer = employers[job.employer_id];
            return (
              <ApplicationCard 
                key={app.id} 
                application={app} 
                job={job} 
                applicant={applicant} 
                employer={employer} 
                onAccept={handleAcceptApplication} 
                onDecline={handleDeclineApplication} 
                onComplete={handleCompleteJob} 
                userType={user.user_type} 
                currentUser={user} 
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 hexagon bg-[var(--surface)] flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-secondary)]">Nenhuma candidatura nesta categoria.</p>
          </div>
        )}
      </div>

      {showCompletionModal && selectedCompletion && (
        <CompletionModal 
          job={selectedCompletion.job} 
          application={selectedCompletion.application} 
          otherUser={selectedCompletion.otherUser} 
          currentUser={user} 
          onClose={() => { setShowCompletionModal(false); setSelectedCompletion(null); }} 
          onComplete={() => loadData()} 
        />
      )}
    </div>
  );
}