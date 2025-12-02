
import React, { useState, useEffect, useCallback } from "react";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { Application } from "@/entities/Application";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Check, Clock, QrCode, User as UserIcon, AlertCircle, CheckCircle, Settings } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

function JobItem({ job, application, userType }) {
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    const fetchOtherUser = async () => {
      const otherUserId = userType === 'worker' ? job.employer_id : job.worker_id;
      if (otherUserId) {
        const users = await User.filter({ id: otherUserId });
        if (users.length > 0) {
          setOtherUser(users[0]);
        }
      }
    };
    fetchOtherUser();
  }, [job, userType]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'in_progress':
        return <Badge className="bg-blue-500">Em Andamento</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-900">{job.title}</h3>
          {getStatusBadge(job.status)}
        </div>
        <p className="text-sm text-gray-600">{job.location}</p>
        <p className="text-sm text-gray-500">{job.description}</p>
        
        {otherUser && (
          <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
            <UserIcon className="w-4 h-4" />
            <span>{userType === 'worker' ? 'Empregador' : 'Profissional'}: {otherUser.full_name}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="font-bold text-blue-600 text-lg">€{job.price}</span>
          {application?.qr_code_url && (
            <a href={application.qr_code_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                    <QrCode className="w-4 h-4 mr-2" />
                    Ver QR Code
                </Button>
            </a>
          )}
        </div>
        
        {job.start_date && (
          <div className="text-xs text-gray-500">
            Início: {format(new Date(job.start_date), "dd/MM/yyyy", { locale: pt })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyJobs() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      let jobsQuery = {};
      let appsQuery = {};
      
      if (currentUser.user_type === 'worker') {
        jobsQuery = { worker_id: currentUser.id };
        appsQuery = { worker_id: currentUser.id };
      } else {
        jobsQuery = { employer_id: currentUser.id };
        appsQuery = { employer_id: currentUser.id };
      }

      const [jobList, appList] = await Promise.all([
        Job.filter(jobsQuery),
        Application.filter(appsQuery)
      ]);
      
      setJobs(jobList);
      setApplications(appList);

    } catch (error) {
      console.error("Error loading jobs:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const inProgressJobs = jobs.filter(j => j.status === 'in_progress');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const acceptedApplications = applications.filter(app => app.status === 'accepted');

  if (loading) {
    return (
      <div className="p-4 h-screen flex flex-col items-center justify-center">
        <Settings className="w-12 h-12 text-gray-400 animate-spin mb-4" />
        <p className="text-gray-500">A carregar os seus trabalhos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Trabalhos</h1>
      
      <Tabs defaultValue="in_progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="in_progress">
            <Clock className="w-4 h-4 mr-2" />
            Em Andamento ({inProgressJobs.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            <CheckCircle className="w-4 h-4 mr-2" />
            Trabalhos Aceitos ({acceptedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            <Check className="w-4 h-4 mr-2" />
            Concluídos ({completedJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in_progress" className="mt-4">
          <div className="space-y-4">
            {inProgressJobs.length > 0 ? (
              inProgressJobs.map(job => (
                <JobItem 
                  key={job.id} 
                  job={job} 
                  application={applications.find(a => a.job_id === job.id)}
                  userType={user.user_type}
                />
              ))
            ) : (
              <Card className="text-center p-8">
                <Briefcase className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-800">Nenhum trabalho em andamento</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {user?.user_type === 'worker' ? "Candidate-se a trabalhos para começar." : "Publique e aceite propostas de profissionais."}
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="accepted" className="mt-4">
          <div className="space-y-4">
            {acceptedApplications.length > 0 ? (
              acceptedApplications.map(application => {
                const job = jobs.find(j => j.id === application.job_id);
                if (!job) return null;
                return (
                  <JobItem 
                    key={application.id} 
                    job={job}
                    application={application}
                    userType={user.user_type}
                  />
                );
              })
            ) : (
              <Card className="text-center p-8">
                <CheckCircle className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-800">Nenhum trabalho aceito ainda</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {user?.user_type === 'worker' 
                    ? "Quando suas candidaturas forem aceites, aparecerão aqui." 
                    : "Quando aceitar candidaturas, elas aparecerão aqui."
                  }
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="space-y-4">
            {completedJobs.length > 0 ? (
              completedJobs.map(job => (
                <JobItem 
                  key={job.id} 
                  job={job}
                  application={applications.find(a => a.job_id === job.id)}
                  userType={user.user_type}
                />
              ))
            ) : (
              <Card className="text-center p-8">
                <AlertCircle className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-800">Nenhum trabalho concluído</h3>
                <p className="text-sm text-gray-500 mt-1">Os trabalhos que finalizar aparecerão aqui.</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
