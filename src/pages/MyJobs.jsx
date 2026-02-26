import React, { useState, useEffect, useCallback } from "react";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Application } from "@/entities/Application";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, QrCode, Navigation, MessageCircle, Trophy, MapPin } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

function JobItem({ job, application, userType, navigate }) {
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    const fetchOtherUser = async () => {
      const id = userType === 'worker' ? job.employer_id : job.worker_id;
      if (id) {
        const users = await User.filter({ id });
        if (users.length > 0) setOtherUser(users[0]);
      }
    };
    fetchOtherUser();
  }, [job, userType]);

  const statusBadge = () => {
    const map = {
      open:                  <Badge className="bg-amber-500 text-white">Agendado</Badge>,
      in_progress:           <Badge className="bg-blue-500 text-white">Em Curso</Badge>,
      completed_by_employer: <Badge className="bg-purple-500 text-white">Aguarda Avaliação</Badge>,
      completed:             <Badge className="bg-green-500 text-white">Concluído</Badge>,
      cancelled:             <Badge className="bg-gray-400 text-white">Cancelado</Badge>,
    };
    return map[job.status] || <Badge variant="secondary">{job.status}</Badge>;
  };

  const actionButton = () => {
    if (userType === 'worker') {
      if (job.status === 'open') {
        return (
          <Button
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 rounded-xl h-10"
            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.location)}`, '_blank')}
          >
            <Navigation className="w-4 h-4 mr-2" /> Navegar ao Local
          </Button>
        );
      }
      if (job.status === 'in_progress') {
        return (
          <Button
            className="w-full mt-3 bg-[#F26522] hover:bg-orange-600 rounded-xl h-10"
            onClick={() => navigate(createPageUrl("Applications"))}
          >
            <QrCode className="w-4 h-4 mr-2" /> Finalizar Trabalho
          </Button>
        );
      }
    }

    if (userType === 'employer') {
      if (job.status === 'open' && job.worker_id) {
        return (
          <Button
            variant="outline"
            className="w-full mt-3 rounded-xl h-10 border-[#F26522] text-[#F26522] hover:bg-orange-50"
            onClick={() => navigate(createPageUrl("Chat"))}
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Falar com Profissional
          </Button>
        );
      }
      if (job.status === 'in_progress') {
        return (
          <Button
            className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl h-10"
            onClick={() => navigate(createPageUrl("Applications"))}
          >
            <Trophy className="w-4 h-4 mr-2" /> Finalizar e Avaliar
          </Button>
        );
      }
      if (job.status === 'completed_by_employer') {
        return (
          <Button
            className="w-full mt-3 bg-purple-600 hover:bg-purple-700 rounded-xl h-10"
            onClick={() => navigate(createPageUrl("Applications"))}
          >
            <Trophy className="w-4 h-4 mr-2" /> Avaliar Profissional
          </Button>
        );
      }
    }
    return null;
  };

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-gray-900 flex-1 text-sm leading-tight">{job.title}</h3>
          {statusBadge()}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-[#F26522]">
            €{job.price}
            {job.price_type === 'hourly' && <span className="text-sm font-normal text-gray-400">/h</span>}
          </p>
          {job.start_date && (
            <span className="text-xs text-gray-400">
              {format(new Date(job.start_date), "dd MMM yyyy", { locale: pt })}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <MapPin className="w-3 h-3" />{job.location}
        </p>
        {otherUser && (
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <UserIcon className="w-3 h-3" />
            <span>{userType === 'worker' ? 'Empregador' : 'Profissional'}: <strong>{otherUser.full_name}</strong></span>
          </div>
        )}
        {actionButton()}
      </CardContent>
    </Card>
  );
}

function EmptyState({ emoji, title, description, onCta, ctaLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="text-6xl mb-4">{emoji}</div>
      <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">{description}</p>
      {onCta && ctaLabel && (
        <Button className="mt-5 bg-[#F26522] hover:bg-orange-600 rounded-xl px-6" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}

export default function MyJobs() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      let jobList = [];
      let appList = [];

      if (currentUser.user_type === 'worker') {
        jobList = await Job.filter({ worker_id: currentUser.id });
        appList = await Application.filter({ worker_id: currentUser.id, status: 'accepted' });
      } else if (currentUser.user_type === 'employer') {
        jobList = await Job.filter({ employer_id: currentUser.id });
        const ids = jobList.map(j => j.id);
        if (ids.length > 0) appList = await Application.filter({ job_id: { $in: ids } });
      } else {
        jobList = await Job.list();
        appList = await Application.list();
      }

      setJobs(jobList);
      setApplications(appList);
    } catch (error) {
      console.error("Error loading jobs:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const scheduledJobs  = jobs.filter(j => {
    if (user?.user_type === 'employer') return j.status === 'open' && j.worker_id;
    return j.status === 'open' && j.worker_id === user?.id;
  });
  const inProgressJobs = jobs.filter(j => j.status === 'in_progress');
  const historyJobs    = jobs.filter(j => ['completed', 'completed_by_employer', 'cancelled'].includes(j.status));

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold text-[#F26522] animate-pulse">φ</div>
          <p className="text-gray-400 mt-2 text-sm">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="bg-white border-b px-4 pt-5 pb-3 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Meus Trabalhos</h1>
      </div>

      <div className="px-4 pt-4">
        <Tabs defaultValue="in_progress">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-gray-100 p-1 h-auto">
            <TabsTrigger value="scheduled" className="rounded-xl flex flex-col py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span>Agendados</span>
              <span className="font-bold text-[#F26522] text-base">{scheduledJobs.length}</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="rounded-xl flex flex-col py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span>Em Curso</span>
              <span className="font-bold text-[#F26522] text-base">{inProgressJobs.length}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl flex flex-col py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <span>Histórico</span>
              <span className="font-bold text-[#F26522] text-base">{historyJobs.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="mt-4 space-y-3">
            {scheduledJobs.length > 0 ? scheduledJobs.map(job => (
              <JobItem key={job.id} job={job} application={applications.find(a => a.job_id === job.id)} userType={user.user_type} navigate={navigate} />
            )) : (
              <EmptyState
                emoji="📅"
                title="Nenhum trabalho agendado"
                description={user?.user_type === 'worker' ? "Candidate-se a obras para começar." : "Publique uma obra e aceite candidaturas."}
                onCta={user?.user_type === 'employer' ? () => navigate(createPageUrl("NewJob")) : () => navigate(createPageUrl("Home"))}
                ctaLabel={user?.user_type === 'employer' ? '+ Publicar Nova Obra' : '🗺️ Explorar Obras'}
              />
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="mt-4 space-y-3">
            {inProgressJobs.length > 0 ? inProgressJobs.map(job => (
              <JobItem key={job.id} job={job} application={applications.find(a => a.job_id === job.id)} userType={user.user_type} navigate={navigate} />
            )) : (
              <EmptyState
                emoji="🔨"
                title="Nenhum trabalho em curso"
                description="Os trabalhos aceites e em andamento aparecem aqui."
                onCta={user?.user_type === 'employer' ? () => navigate(createPageUrl("NewJob")) : () => navigate(createPageUrl("Home"))}
                ctaLabel={user?.user_type === 'employer' ? '+ Publicar Obra' : '🗺️ Explorar Obras'}
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            {historyJobs.length > 0 ? historyJobs.map(job => (
              <JobItem key={job.id} job={job} application={applications.find(a => a.job_id === job.id)} userType={user.user_type} navigate={navigate} />
            )) : (
              <EmptyState
                emoji="🏆"
                title="Histórico vazio"
                description="Os trabalhos concluídos e o seu histórico aparecerão aqui."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}