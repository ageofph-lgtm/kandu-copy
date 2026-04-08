import React, { useState, useEffect, useCallback } from "react";
import { Application } from "@/entities/Application";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CompletionModal from "../components/applications/CompletionModal";
import { applyXP, XP_EVENTS } from "@/lib/xp";

export default function Applications() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState(null);

  // Get jobId from URL params
  const urlParams = new URLSearchParams(location.search);
  const jobId = urlParams.get('jobId');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (!jobId) {
        navigate(createPageUrl("Home"));
        return;
      }

      // Fetch job
      const jobData = await Job.filter({ id: jobId }).then(r => r[0]);
      if (!jobData) {
        navigate(createPageUrl("Home"));
        return;
      }
      setJob(jobData);

      // Fetch applications for this job
      const appsData = await Application.filter({ job_id: jobId }, "-created_date");
      setApplications(appsData);

      // Fetch applicant users
      const applicantIds = appsData.map(a => a.worker_id);
      const appMap = {};
      if (applicantIds.length > 0) {
        const users = await User.filter({ id: { $in: applicantIds } });
        users.forEach(u => appMap[u.id] = u);
      }
      setApplicants(appMap);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
    setLoading(false);
  }, [jobId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAcceptApplication = async (app) => {
    try {
      if (!job) return;
      const finalPrice = app.proposed_price || job.price;

      await Application.update(app.id, { status: "accepted" });
      await Job.update(job.id, { status: 'in_progress', worker_id: app.worker_id, price: finalPrice });

      const worker = applicants[app.worker_id];
      if (worker) {
        await User.update(worker.id, applyXP(worker.xp || 0, XP_EVENTS.application_accepted));
      }

      await Notification.create({
        user_id: app.worker_id,
        type: "job_accepted",
        title: "🎉 Proposta Aceite! +25 XP",
        message: `A sua candidatura para "${job.title}" foi aceite.`,
        related_id: job.id,
        action_url: createPageUrl("Applications"),
      });

      loadData();
    } catch (error) {
      console.error("Erro ao aceitar proposta:", error);
    }
  };

  const handleDeclineApplication = async (app) => {
    try {
      if (!job) return;
      await Application.update(app.id, { status: "rejected" });
      await Notification.create({
        user_id: app.worker_id,
        type: "job_rejected",
        title: "❌ Proposta Recusada",
        message: `A sua candidatura para "${job.title}" foi recusada.`,
        related_id: job.id,
        action_url: createPageUrl("Applications"),
      });
      loadData();
    } catch (error) {
      console.error("Erro ao recusar proposta:", error);
    }
  };

  const handleCompleteJob = (app) => {
    const applicant = applicants[app.worker_id];
    setSelectedCompletion({ application: app, job, otherUser: applicant });
    setShowCompletionModal(true);
  };

  if (loading) {
    return (
      <div style={{ background: '#1A1A1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#FF6600', fontSize: 40, fontWeight: 'bold' }}>φ</div>
      </div>
    );
  }

  if (!user || !job) {
    return <div>Erro ao carregar dados</div>;
  }

  const pendingApps = applications.filter(a => a.status === 'pending');

  return (
    <div style={{
      background: '#1A1A1A',
      minHeight: '100vh',
      paddingBottom: 80
    }}>
      {/* Top bar */}
      <div style={{
        padding: '50px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#FF6600',
            fontSize: 22,
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <h1 style={{
          fontWeight: 700,
          fontSize: 22,
          color: '#FFF',
          margin: 0
        }}>
          Candidatos
        </h1>
        <div style={{
          background: '#FF6600',
          borderRadius: 20,
          padding: '4px 12px',
          color: '#FFF',
          fontWeight: 700,
          fontSize: 14
        }}>
          {pendingApps.length}
        </div>
      </div>

      {/* Job context bar */}
      <div style={{
        margin: '0 20px 12px',
        background: '#222',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        gap: 10,
        alignItems: 'center'
      }}>
        <span style={{ fontSize: 18, color: '#FFF' }}>💼</span>
        <h2 style={{
          fontWeight: 600,
          color: '#FFF',
          fontSize: 14,
          margin: 0,
          flex: 1
        }}>
          {job.title}
        </h2>
        <span style={{
          color: '#AAA',
          fontSize: 12
        }}>
          Ativo
        </span>
      </div>

      {/* Candidates list */}
      <div style={{
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {applications.length > 0 ? (
          applications.map(app => {
            const applicant = applicants[app.worker_id];
            if (!applicant) return null;

            const isPending = app.status === 'pending';
            const icon = '⛑️';

            return (
              <div
                key={app.id}
                style={{
                  background: '#2A2A2A',
                  borderRadius: 14,
                  padding: 14,
                  borderLeft: '6px solid #FF6600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#888',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0
                }}>
                  {icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontWeight: 'bold',
                    fontSize: 15,
                    color: '#FFF',
                    margin: 0
                  }}>
                    {applicant.full_name}
                  </p>
                  <p style={{
                    color: '#AAA',
                    fontSize: 13,
                    margin: '2px 0 0 0'
                  }}>
                    {applicant.skills?.[0] || 'Especialista'}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 4,
                    alignItems: 'center'
                  }}>
                    <span style={{
                      color: '#FF6600',
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      ★ {(applicant.rating || 4.5).toFixed(1)}
                    </span>
                    <div style={{
                      background: '#22C55E22',
                      color: '#22C55E',
                      border: '1px solid #22C55E44',
                      borderRadius: 10,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      Ultra Verified
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: 8,
                  flexShrink: 0
                }}>
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleDeclineApplication(app)}
                        style={{
                          background: '#FF3333',
                          border: 'none',
                          borderRadius: 10,
                          padding: '8px 12px',
                          color: '#FFF',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Recusar
                      </button>
                      <button
                        onClick={() => handleAcceptApplication(app)}
                        style={{
                          background: '#FF6600',
                          border: 'none',
                          borderRadius: 10,
                          padding: '8px 14px',
                          color: '#FFF',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Ver Perfil
                      </button>
                    </>
                  )}
                  {!isPending && (
                    <button
                      onClick={() => navigate(createPageUrl("Profile") + `?userId=${app.worker_id}`)}
                      style={{
                        background: '#FF6600',
                        border: 'none',
                        borderRadius: 10,
                        padding: '8px 14px',
                        color: '#FFF',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Ver Perfil
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#AAA',
            paddingTop: 40
          }}>
            <p>Nenhum candidato</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        color: '#AAA',
        fontSize: 13,
        textAlign: 'center',
        padding: 16,
        marginTop: 20
      }}>
        Aceita um candidato para iniciar o chat
      </div>

      {/* Completion Modal */}
      {showCompletionModal && selectedCompletion && (
        <CompletionModal
          job={selectedCompletion.job}
          application={selectedCompletion.application}
          otherUser={selectedCompletion.otherUser}
          currentUser={user}
          onClose={() => {
            setShowCompletionModal(false);
            setSelectedCompletion(null);
          }}
          onComplete={() => loadData()}
        />
      )}
    </div>
  );
}