import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Application } from "@/entities/Application";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, QrCode, Navigation, MessageCircle, Trophy, MapPin } from "lucide-react";
import DailyPinDisplay from "@/components/jobs/DailyPinDisplay";
import PinVerificationModal from "@/components/jobs/PinVerificationModal";
import CompletionModal from "@/components/applications/CompletionModal";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

function JobItem({ job, application, userType, navigate, currentUser, isDark }) {
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#333" : "#E5E5E5";
  const [otherUser, setOtherUser] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

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
            onClick={() => setShowPinModal(true)}
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
          <>
            <DailyPinDisplay jobId={job.id} />
            <Button
              className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl h-10"
              onClick={() => setShowCompletionModal(true)}
            >
              <Trophy className="w-4 h-4 mr-2" /> Finalizar e Avaliar
            </Button>
          </>
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

  const statusColor = { open: {bg:"#FF660033",color:"#FF6600",label:"Agendado"}, in_progress: {bg:"#3B82F633",color:"#60A5FA",label:"Em Curso"}, completed_by_employer: {bg:"#A855F733",color:"#C084FC",label:"Aguarda Avaliação"}, completed: {bg:"#22C55E33",color:"#22C55E",label:"Concluído"}, cancelled: {bg:"#44444433",color:"#AAAAAA",label:"Cancelado"} };
  const s = statusColor[job.status] || {bg:"#33333333",color:"#AAA",label:job.status};

  return (
    <>
    {showPinModal && (
      <PinVerificationModal
        jobId={job.id}
        jobTitle={job.title}
        onVerified={() => { setShowPinModal(false); setShowCompletionModal(true); }}
        onCancel={() => setShowPinModal(false)}
      />
    )}
    {showCompletionModal && otherUser && currentUser && (
      <CompletionModal
        job={job}
        application={application}
        otherUser={otherUser}
        currentUser={currentUser}
        onClose={() => setShowCompletionModal(false)}
        onComplete={() => { setShowCompletionModal(false); window.location.reload(); }}
      />
    )}
    <div style={{background:surface,borderRadius:16,padding:16,borderLeft:"6px solid #FF6600"}}>
      {/* Row 1: title + status */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
        <h3 style={{fontWeight:700,color:text,fontSize:14,flex:1,margin:0,lineHeight:1.3}}>{job.title}</h3>
        <span style={{background:s.bg,color:s.color,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:20,flexShrink:0}}>{s.label}</span>
      </div>
      {/* Row 2: location + price */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <p style={{fontSize:12,color:"#AAAAAA",display:"flex",alignItems:"center",gap:4,margin:0}}>
          <MapPin style={{width:11,height:11}} />{job.location}
        </p>
        <p style={{fontSize:16,fontWeight:700,color:"#FF6600",margin:0}}>€{job.price}{job.price_type==='hourly'&&<span style={{fontSize:11,fontWeight:400,color:"#AAAAAA"}}>/h</span>}</p>
      </div>
      {/* Other user */}
      {otherUser && (
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,paddingTop:8,borderTop:`1px solid ${border}`}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:"#FF6600",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontSize:11,fontWeight:700,flexShrink:0}}>
            {otherUser.full_name?.charAt(0)||"?"}
          </div>
          <span style={{fontSize:12,color:subtext}}>{userType==='worker'?'Empregador':'Profissional'}: <strong style={{color:text}}>{otherUser.full_name}</strong></span>
        </div>
      )}
      {actionButton()}
    </div>
    </>  
  );
}

function EmptyState({ emoji, title, description, onCta, ctaLabel, isDark }) {
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  return (
    <div style={{background:surface,borderRadius:16,padding:40,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>{emoji}</div>
      <h3 style={{color:subtext,fontWeight:600,fontSize:16,margin:"0 0 6px"}}>{title}</h3>
      {description && <p style={{color:subtext,fontSize:13,margin:"0 0 16px"}}>{description}</p>}
      {onCta && ctaLabel && (
        <button onClick={onCta} style={{background:"#FF6600",border:"none",borderRadius:12,padding:"12px 24px",color:"#FFF",fontWeight:700,fontSize:14,cursor:"pointer"}}>{ctaLabel}</button>
      )}
    </div>
  );
}

export default function MyJobs() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const bg = isDark ? "#1A1A1A" : "#FFFFFF";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
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
    return <LoadingScreen label="A carregar..." />;
  }

  return (
    <div style={{background:bg,minHeight:"100vh",paddingBottom:80}}>
      {/* Top Bar */}
      <div style={{padding:"50px 20px 12px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <h1 style={{fontWeight:800,fontSize:22,color:text,margin:0}}>As minhas obras</h1>
          <span style={{background:"#FF6600",color:"#FFF",borderRadius:"50%",minWidth:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>{jobs.length}</span>
        </div>
        {user?.user_type === 'employer' && (
          <button onClick={() => navigate(createPageUrl("NewJob"))}
            style={{background:"#FF6600",borderRadius:50,padding:"10px 16px",border:"none",color:"#FFF",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            + Publicar
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{padding:"0 20px"}}>
        <Tabs defaultValue="in_progress">
          <TabsList style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:surface,borderRadius:16,padding:4,height:"auto"}} className="w-full">
            <TabsTrigger value="scheduled" style={{borderRadius:12,display:"flex",flexDirection:"column",padding:"8px 0",fontSize:11}} className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-white text-[#AAAAAA]">
              <span>Agendados</span>
              <span style={{fontWeight:700,fontSize:15}}>{scheduledJobs.length}</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress" style={{borderRadius:12,display:"flex",flexDirection:"column",padding:"8px 0",fontSize:11}} className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-white text-[#AAAAAA]">
              <span>Em Curso</span>
              <span style={{fontWeight:700,fontSize:15}}>{inProgressJobs.length}</span>
            </TabsTrigger>
            <TabsTrigger value="history" style={{borderRadius:12,display:"flex",flexDirection:"column",padding:"8px 0",fontSize:11}} className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-white text-[#AAAAAA]">
              <span>Histórico</span>
              <span style={{fontWeight:700,fontSize:15}}>{historyJobs.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" style={{marginTop:16,display:"flex",flexDirection:"column",gap:12}}>
            {scheduledJobs.length > 0 ? scheduledJobs.map(job => (
              <JobItem key={job.id} job={job} application={applications.find(a => a.job_id === job.id)} userType={user.user_type} navigate={navigate} currentUser={user} isDark={isDark} />
            )) : (
              <EmptyState emoji="📅" isDark={isDark} title="Nenhum trabalho agendado"
                description={user?.user_type==='worker'?"Candidate-se a obras para começar.":"Publique uma obra e aceite candidaturas."}
                onCta={user?.user_type==='employer'?() => navigate(createPageUrl("NewJob")):() => navigate(createPageUrl("Home"))}
                ctaLabel={user?.user_type==='employer'?'+ Publicar Nova Obra':'🗺️ Explorar Obras'} />
            )}
          </TabsContent>

          <TabsContent value="in_progress" style={{marginTop:16,display:"flex",flexDirection:"column",gap:12}}>
            {inProgressJobs.length > 0 ? inProgressJobs.map(job => (
              <JobItem key={job.id} job={job} application={applications.find(a => a.job_id === job.id)} userType={user.user_type} navigate={navigate} currentUser={user} isDark={isDark} />
            )) : (
              <EmptyState emoji="🔨" isDark={isDark} title="Nenhum trabalho em curso"
                description="Os trabalhos aceites e em andamento aparecem aqui."
                onCta={user?.user_type==='employer'?() => navigate(createPageUrl("NewJob")):() => navigate(createPageUrl("Home"))}
                ctaLabel={user?.user_type==='employer'?'+ Publicar Obra':'🗺️ Explorar Obras'} />
            )}
          </TabsContent>

          <TabsContent value="history" style={{marginTop:16,display:"flex",flexDirection:"column",gap:12}}>
            {historyJobs.length > 0 ? historyJobs.map(job => (
              <JobItem key={job.id} job={job} application={applications.find(a => a.job_id === job.id)} userType={user.user_type} navigate={navigate} currentUser={user} isDark={isDark} />
            )) : (
              <EmptyState emoji="🏆" isDark={isDark} title="Histórico vazio"
                description="Os trabalhos concluídos e o seu histórico aparecerão aqui." />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}