import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Job } from "@/entities/Job";
import { Application } from "@/entities/Application";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, QrCode, Play, Trophy } from "lucide-react";
import CompletionModal from "../components/applications/CompletionModal";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function ScanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [worker, setWorker] = useState(null);
  
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(location.search);
      const jobId = params.get("jobId");
      const applicationId = params.get("applicationId");

      if (!jobId || !applicationId) {
        throw new Error("Informações inválidas no QR Code.");
      }

      const user = await User.me();
      setCurrentUser(user);

      const [jobData] = await Job.filter({ id: jobId });
      if (!jobData) throw new Error("Obra não encontrada.");
      
      const [appData] = await Application.filter({ id: applicationId });
      if (!appData) throw new Error("Candidatura não encontrada.");

      if (jobData.employer_id !== user.id) {
        throw new Error("Apenas o empregador desta obra pode aceder a esta página.");
      }

      setJob(jobData);
      setApplication(appData);

      const [workerData] = await User.filter({ id: appData.worker_id });
      setWorker(workerData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartJob = async () => {
    try {
      await Job.update(job.id, { 
        actual_start_date: new Date().toISOString(),
        status: 'in_progress'
      });
      
      await Notification.create({
        user_id: worker.id,
        type: 'job_started',
        title: 'Trabalho iniciado!',
        message: `O trabalho "${job.title}" foi oficialmente iniciado.`,
        related_id: job.id
      });
      
      alert("Trabalho iniciado com sucesso!");
      await loadData();
    } catch (e) {
      console.error("Erro ao iniciar trabalho:", e);
      alert("Ocorreu um erro ao iniciar o trabalho.");
    }
  };

  const handleCompleteJob = () => {
    setShowCompletionModal(true);
  };

  if (loading) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-center"><Loader2 className="w-8 h-8 animate-spin mb-2" />A verificar QR Code...</div>;
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-center"><AlertCircle className="w-8 h-8 text-red-500 mb-2" />{error}</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode /> Confirmação da Obra
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-bold">{job.title}</h2>
          <p><span className="font-semibold">Profissional:</span> {worker?.full_name}</p>
          <p><span className="font-semibold">Localização:</span> {job.location}</p>
          <p><span className="font-semibold">Preço acordado:</span> €{application.proposed_price || job.price}</p>
          
          {job.actual_start_date && (
            <Badge className="bg-green-100 text-green-800">
              Iniciado em: {format(new Date(job.actual_start_date), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
            </Badge>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t">
            {!job.actual_start_date && job.status !== 'completed' && (
              <Button onClick={handleStartJob} className="bg-blue-600 hover:bg-blue-700">
                <Play className="w-4 h-4 mr-2" /> Iniciar Trabalho
              </Button>
            )}

            {job.actual_start_date && job.status !== 'completed' && (
              <Button onClick={handleCompleteJob} className="bg-yellow-600 hover:bg-yellow-700">
                <Trophy className="w-4 h-4 mr-2" /> Finalizar Trabalho
              </Button>
            )}

            {job.status === 'completed' && (
               <Badge className="bg-green-500 text-white p-3 text-center w-full">
                  Trabalho Concluído
               </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {showCompletionModal && (
        <CompletionModal
          job={job}
          application={application}
          otherUser={worker}
          currentUser={currentUser}
          onClose={() => setShowCompletionModal(false)}
          onComplete={() => {
            setShowCompletionModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}