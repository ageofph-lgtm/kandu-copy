import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
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
import { applyXP, XP_EVENTS } from "@/lib/xp";

function ApplicationCard({ application, job, applicant, employer, onAccept, onDecline, onComplete, onStartJob, onDelete, userType, currentUser }) {
  const { isDark } = useTheme();
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#333333" : "#E5E5E5";
  const innerBg = isDark ? "#1E1E1E" : "#EBEBEB";
  const finalPrice = application.proposed_price || job.price;

  const getStatusBadge = (status, jobStatus) => {
    if (jobStatus === 'completed') return <span style={{background:"#22C55E22",color:"#22C55E",border:"1px solid #22C55E44",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600}}>Trabalho Finalizado</span>;
    if (jobStatus === 'completed_by_employer') return <span style={{background:"#FF660022",color:"#FF6600",border:"1px solid #FF660044",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600}}>Aguardando Sua Avaliação</span>;
    switch(status) {
      case 'pending': return <span style={{background:"#FF660022",color:"#FF6600",border:"1px solid #FF660044",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600}}>Pendente</span>;
      case 'accepted': return <span style={{background:"#22C55E22",color:"#22C55E",border:"1px solid #22C55E44",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600}}>Aceite</span>;
      case 'rejected': return <span style={{background:"#EF444422",color:"#EF4444",border:"1px solid #EF444444",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600}}>Recusada</span>;
      default: return <span style={{background:"#2A2A2A",color:"#AAAAAA",borderRadius:20,padding:"4px 12px",fontSize:12}}>Desconhecido</span>;
    }
  };

  const displayUser = userType === 'worker' ? employer : applicant;

  return (
    <div style={{background:surface,borderRadius:14,padding:14,borderLeft:"4px solid #FF6600"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:"#FF6600",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontWeight:700,fontSize:18,flexShrink:0}}>
            {displayUser?.full_name?.charAt(0) || "?"}
          </div>
          <div>
            <h3 style={{fontWeight:600,color:text,margin:0}}>{displayUser?.full_name || "Utilizador"}</h3>
            <p style={{fontSize:13,color:subtext,margin:0}}>{job.title}</p>
          </div>
        </div>
        <div>{getStatusBadge(application.status, job.status)}</div>
      </div>
      <div style={{marginBottom:10}}><p style={{fontSize:13,color:subtext,margin:0}}>{application.message}</p></div>
      <div style={{background:innerBg,borderRadius:10,padding:12,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <span style={{fontSize:12,color:subtext}}>Valor:</span>
          <p style={{fontWeight:700,fontSize:18,color:"#FF6600",margin:0}}>€{finalPrice}{application.application_type === 'proposal' && <span style={{fontSize:11,color:subtext,marginLeft:6}}>(Proposto)</span>}</p>
        </div>
        {job.price !== finalPrice && <div style={{textAlign:"right"}}><span style={{fontSize:11,color:subtext}}>Original:</span><p style={{fontSize:13,textDecoration:"line-through",color:subtext,margin:0}}>€{job.price}</p></div>}
      </div>
      <div style={{fontSize:11,color:subtext,marginBottom:10}}>Enviado em: {format(new Date(application.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}</div>
      {userType === 'employer' && application.status === 'pending' && (
        <div style={{display:"flex",gap:8,paddingTop:10,borderTop:`1px solid ${border}`}}>
          <button onClick={() => onDecline(application)} style={{flex:1,background:"#EF444422",color:"#EF4444",border:"1px solid #EF4444",borderRadius:10,padding:"8px 0",fontWeight:600,cursor:"pointer",fontSize:13}}>✕ Recusar</button>
          <button onClick={() => onAccept(application)} style={{flex:1,background:"#22C55E",color:"#FFF",border:"none",borderRadius:10,padding:"8px 0",fontWeight:600,cursor:"pointer",fontSize:13}}>✓ Aceitar</button>
        </div>
      )}
      {userType === 'employer' && application.status === 'accepted' && job.status === 'open' && (
        <div style={{paddingTop:10,borderTop:`1px solid ${border}`}}>
          <button onClick={() => onStartJob(application, job)} style={{width:"100%",background:"#FF6600",color:"#FFF",border:"none",borderRadius:10,padding:"10px 0",fontWeight:600,cursor:"pointer",fontSize:13}}>▶ Iniciar Trabalho</button>
        </div>
      )}
      {userType === 'employer' && application.status === 'accepted' && job.status === 'in_progress' && (
        <div style={{paddingTop:10,borderTop:`1px solid ${border}`}}>
          <button onClick={() => onComplete(application, job, applicant)} style={{width:"100%",background:"#FF6600",color:"#FFF",border:"none",borderRadius:10,padding:"10px 0",fontWeight:600,cursor:"pointer",fontSize:13}}>🏆 Finalizar Obra e Avaliar</button>
        </div>
      )}
      {userType === 'worker' && job.status === 'completed_by_employer' && application.status === 'accepted' && (
        <div style={{paddingTop:10,borderTop:`1px solid ${border}`}}>
          <button onClick={() => onComplete(application, job, employer)} style={{width:"100%",background:"#FF6600",color:"#FFF",border:"none",borderRadius:10,padding:"10px 0",fontWeight:600,cursor:"pointer",fontSize:13}}>✏️ Avaliar Empregador</button>
        </div>
      )}
    </div>
  );
}

export default function Applications() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const bg = isDark ? "#1A1A1A" : "#FFFFFF";
  const surface = isDark ? "#2A2A2A" : "#F5F5F5";
  const text = isDark ? "#FFFFFF" : "#1A1A1A";
  const subtext = isDark ? "#AAAAAA" : "#666666";
  const border = isDark ? "#333333" : "#E5E5E5";
  const tabBg = isDark ? "#222" : "#EEEEEE";
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
        const fetchedUsers = await Promise.all(
          usersToFetch.map(id => User.filter({ id }).then(r => r[0]).catch(() => null))
        );
        fetchedUsers.filter(Boolean).forEach(u => userMap.set(u.id, u));
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
      
      // Rejeitar automaticamente as outras candidaturas pendentes para esta obra
      try {
        const otherPending = await Application.filter({ job_id: app.job_id, status: "pending" });
        const toReject = otherPending.filter(a => a.id !== app.id);
        await Promise.all(toReject.map(a => Application.update(a.id, { status: "rejected" })));
        // Notificar os rejeitados
        await Promise.all(toReject.map(a => Notification.create({
          user_id: a.worker_id,
          type: "job_rejected",
          title: "❌ Candidatura Encerrada",
          message: `A obra "${job.title}" foi atribuída a outro profissional.`,
          related_id: app.job_id,
          action_url: createPageUrl("Applications"),
        })));
      } catch(e) { console.error("Erro ao rejeitar outras candidaturas:", e); }
      
      await Job.update(app.job_id, { status: 'in_progress', worker_id: app.worker_id, price: finalPrice });

      // XP ao worker por candidatura aceite
      const worker = await User.filter({ id: app.worker_id }).then(r => r[0]);
      if (worker) await User.update(worker.id, applyXP(worker.xp || 0, XP_EVENTS.application_accepted));

      await Notification.create({
        user_id: app.worker_id,
        type: "job_accepted",
        title: "🎉 Proposta Aceite! +25 XP",
        message: `A sua candidatura para "${job.title}" foi aceite. Ganhou 25 XP!`,
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

  if (loading) return <LoadingScreen label="A carregar..." />;
  if (!user) return null;

  return (
    <div style={{background:bg,minHeight:"100vh",paddingBottom:80}}>
      {/* Top Bar */}
      <div style={{padding:"50px 20px 12px",display:"flex",alignItems:"center",gap:12}}>
        <h1 style={{fontWeight:700,fontSize:22,color:text,margin:0,flex:1}}>Candidaturas</h1>
        <span style={{background:"#FF6600",color:"#FFF",borderRadius:20,padding:"3px 12px",fontSize:13,fontWeight:700}}>{applications.length}</span>
      </div>

      {/* Tabs */}
      <div style={{padding:"0 20px"}}>
        <Tabs defaultValue="pending">
          <TabsList style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:tabBg,borderRadius:16,padding:4,height:"auto"}} className="w-full">
            <TabsTrigger value="pending" style={{borderRadius:12,fontSize:11,padding:"8px 0",display:"flex",flexDirection:"column"}} className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-white text-[#AAAAAA]">
              <span>Pendentes</span><span style={{fontWeight:700,fontSize:15}}>{pendingApplications.length}</span>
            </TabsTrigger>
            <TabsTrigger value="accepted" style={{borderRadius:12,fontSize:11,padding:"8px 0",display:"flex",flexDirection:"column"}} className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-white text-[#AAAAAA]">
              <span>Aceites</span><span style={{fontWeight:700,fontSize:15}}>{acceptedApplications.length}</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" style={{borderRadius:12,fontSize:11,padding:"8px 0",display:"flex",flexDirection:"column"}} className="data-[state=active]:bg-[#FF6600] data-[state=active]:text-white text-[#AAAAAA]">
              <span>Recusadas</span><span style={{fontWeight:700,fontSize:15}}>{rejectedApplications.length}</span>
            </TabsTrigger>
          </TabsList>

          {[{value:"pending",data:pendingApplications},{value:"accepted",data:acceptedApplications},{value:"rejected",data:rejectedApplications}].map(tab => (
            <TabsContent key={tab.value} value={tab.value} style={{marginTop:16}}>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {tab.data.length > 0 ? tab.data.map(app => {
                  const job = jobs.find(j => j.id === app.job_id);
                  if (!job) return null;
                  const applicant = applicants[app.worker_id];
                  const employer = employers[job.employer_id];
                  const displayUser = user.user_type === 'worker' ? employer : applicant;
                  return (
                    <div key={app.id} style={{background:surface,borderRadius:14,padding:14,borderLeft:"6px solid #FF6600",display:"flex",alignItems:"center",gap:12}}>
                      {/* Avatar */}
                      <div style={{width:48,height:48,borderRadius:"50%",background:"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#FFF",flexShrink:0}}>
                        {displayUser?.full_name?.charAt(0) || "?"}
                      </div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontWeight:700,fontSize:15,color:text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayUser?.full_name || "Utilizador"}</p>
                        <p style={{color:subtext,fontSize:13,margin:"2px 0 0"}}>{job.title}</p>
                        <div style={{display:"flex",gap:6,marginTop:4,alignItems:"center",flexWrap:"wrap"}}>
                          {displayUser?.rating && <span style={{color:"#FF6600",fontSize:12,fontWeight:600}}>★ {displayUser.rating.toFixed(1)}</span>}
                          {app.proposed_price && <span style={{color:"#FF6600",fontSize:12,fontWeight:600}}>€{app.proposed_price}</span>}
                          {displayUser?.verified && <span style={{background:"#22C55E22",color:"#22C55E",border:"1px solid #22C55E44",borderRadius:10,padding:"2px 8px",fontSize:11}}>Verificado</span>}
                          <span style={{background:app.status==='accepted'?"#22C55E22":app.status==='rejected'?"#EF444422":"#FF660022",color:app.status==='accepted'?"#22C55E":app.status==='rejected'?"#EF4444":"#FF6600",border:`1px solid ${app.status==='accepted'?"#22C55E44":app.status==='rejected'?"#EF444444":"#FF660044"}`,borderRadius:10,padding:"2px 8px",fontSize:11}}>
                            {app.status==='accepted'?"Aceite":app.status==='rejected'?"Recusada":"Pendente"}
                          </span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                        <button onClick={() => navigate(createPageUrl("Profile")+`?userId=${displayUser?.id}`)} style={{background:"#FF6600",borderRadius:10,padding:"6px 12px",color:"#FFF",fontSize:12,fontWeight:700,border:"none",cursor:"pointer"}}>Ver Perfil</button>
                        {user.user_type==='employer' && app.status==='pending' && (
                          <>
                            <button onClick={() => handleAcceptApplication(app)} style={{background:"#22C55E22",color:"#22C55E",border:"1px solid #22C55E",borderRadius:10,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>Aceitar</button>
                            <button onClick={() => handleDeclineApplication(app)} style={{background:"#EF444422",color:"#EF4444",border:"1px solid #EF4444",borderRadius:10,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>Recusar</button>
                          </>
                        )}
                        {user.user_type==='employer' && app.status==='accepted' && job.status==='open' && (
                          <button onClick={() => handleStartJob(app,job)} style={{background:"#3B82F622",color:"#60A5FA",border:"1px solid #3B82F6",borderRadius:10,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>Iniciar</button>
                        )}
                        {user.user_type==='employer' && app.status==='accepted' && job.status==='in_progress' && (
                          <button onClick={() => handleCompleteJob(app,job,applicant)} style={{background:"#A855F722",color:"#C084FC",border:"1px solid #A855F7",borderRadius:10,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>Finalizar</button>
                        )}
                        {user.user_type==='worker' && job.status==='completed_by_employer' && app.status==='accepted' && (
                          <button onClick={() => handleCompleteJob(app,job,employer)} style={{background:"#3B82F622",color:"#60A5FA",border:"1px solid #3B82F6",borderRadius:10,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>Avaliar</button>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{background:surface,borderRadius:14,padding:40,textAlign:"center"}}>
                    <p style={{color:subtext,fontSize:14}}>Nenhuma candidatura nesta categoria.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <p style={{color:subtext,fontSize:13,textAlign:"center",padding:16}}>Aceita um candidato para iniciar o chat</p>

      {showCompletionModal && selectedCompletion && <CompletionModal job={selectedCompletion.job} application={selectedCompletion.application} otherUser={selectedCompletion.otherUser} currentUser={user} onClose={handleCompletionClose} onComplete={handleCompletionComplete} />}
    </div>
  );
}