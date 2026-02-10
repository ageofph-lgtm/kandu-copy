import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Job } from "@/entities/Job";
import { Application } from "@/entities/Application";
import { User } from "@/entities/User";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Play, Users, Briefcase, CheckCircle } from 'lucide-react';

export default function TestingPanel() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTestScenario = async () => {
    setIsGenerating(true);
    try {
      // Buscar usuários existentes para usar como empregador e trabalhadores
      const allUsers = await User.list();
      const employers = allUsers.filter(u => u.user_type === 'employer');
      const workers = allUsers.filter(u => u.user_type === 'worker');

      if (employers.length === 0 || workers.length === 0) {
        toast.error('É necessário ter pelo menos 1 empregador e 1 profissional cadastrados. Use o formulário de convite acima.');
        setIsGenerating(false);
        return;
      }

      const employer = employers[0];
      const worker1 = workers[0];
      const worker2 = workers.length > 1 ? workers[1] : workers[0];

      // 1. Criar 3 obras do empregador
      const jobsData = [
        {
          title: 'Renovação de Cozinha',
          category: 'Pintura',
          description: 'Pintura completa de cozinha moderna, incluindo preparação de paredes e teto. Área de aproximadamente 15m².',
          location: 'Lisboa, Centro',
          latitude: 38.7223,
          longitude: -9.1393,
          price_type: 'fixed',
          price: 800,
          status: 'open',
          urgency: 'medium',
          employer_id: employer.id
        },
        {
          title: 'Reparação Elétrica - Urgente',
          category: 'Eletricidade',
          description: 'Quadro elétrico com problema. Precisa de verificação urgente e possível troca de disjuntores.',
          location: 'Porto, Boavista',
          latitude: 41.1579,
          longitude: -8.6291,
          price_type: 'hourly',
          price: 35,
          status: 'open',
          urgency: 'high',
          employer_id: employer.id
        },
        {
          title: 'Instalação de Piso Laminado',
          category: 'Pavimentos',
          description: 'Instalação de piso laminado em sala e dois quartos. Total de 45m². Material já adquirido.',
          location: 'Braga, Centro',
          latitude: 41.5518,
          longitude: -8.4229,
          price_type: 'fixed',
          price: 1200,
          status: 'open',
          urgency: 'low',
          employer_id: employer.id
        }
      ];

      const createdJobs = [];
      for (const jobData of jobsData) {
        const job = await Job.create(jobData);
        createdJobs.push(job);
      }

      // 2. Criar candidaturas de profissionais
      // Job 1 - 2 candidaturas (1 pendente, 1 aceita)
      await Application.create({
        job_id: createdJobs[0].id,
        worker_id: worker1.id,
        message: 'Tenho 8 anos de experiência em pintura. Posso começar esta semana!',
        application_type: 'application',
        status: 'accepted'
      });

      await Application.create({
        job_id: createdJobs[0].id,
        worker_id: worker2.id,
        message: 'Especialista em pintura de cozinhas. Portfólio disponível.',
        proposed_price: 750,
        application_type: 'proposal',
        status: 'pending'
      });

      // Atualizar o job 1 para ter o worker aceito
      await Job.update(createdJobs[0].id, { worker_id: worker1.id });

      // Job 2 - 1 candidatura pendente
      await Application.create({
        job_id: createdJobs[1].id,
        worker_id: worker1.id,
        message: 'Eletricista certificado. Disponível para atendimento urgente hoje mesmo.',
        application_type: 'application',
        status: 'pending'
      });

      // Job 3 - 1 proposta com preço diferente
      await Application.create({
        job_id: createdJobs[2].id,
        worker_id: worker2.id,
        message: 'Experiência de 10 anos em instalação de pisos. Posso oferecer um preço melhor mantendo a qualidade.',
        proposed_price: 1000,
        application_type: 'proposal',
        status: 'pending'
      });

      toast.success('✅ Cenário de teste criado com sucesso!', {
        description: `3 obras criadas com candidaturas de ${workers.length} profissional(is)`
      });

    } catch (error) {
      console.error('Error generating test scenario:', error);
      toast.error('Erro ao criar cenário de teste: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5 text-blue-600" />
          Cenário de Teste Completo
        </CardTitle>
        <CardDescription>
          Gera automaticamente um cenário completo de interação entre empregadores e profissionais para testes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-sm">O que será criado:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Briefcase className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <strong>3 Obras:</strong> Uma para pintura, uma urgente de elétrica, e uma de piso laminado
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <strong>5 Candidaturas:</strong> Distribuídas entre os profissionais cadastrados
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
              <div>
                <strong>Diferentes Status:</strong> Candidaturas pendentes, aceitas e propostas com preços alternativos
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          <strong>⚠️ Pré-requisito:</strong> É necessário ter pelo menos 1 empregador e 1 profissional cadastrados. 
          Use o formulário de convite acima para criar usuários de teste.
        </div>

        <Button 
          onClick={generateTestScenario}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isGenerating ? (
            <><Loader2 className="animate-spin mr-2" /> Gerando cenário...</>
          ) : (
            <><Play className="mr-2" /> Gerar Cenário Completo</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}