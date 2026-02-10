import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function InviteUserForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('worker');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor, insira um email.');
      return;
    }
    setIsLoading(true);
    try {
      await base44.users.inviteUser(email, role);
      toast.success(`Convite enviado para ${email} como ${role}.`);
      setEmail('');
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(error.message || 'Falha ao enviar convite.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convidar Usuário de Teste</CardTitle>
        <CardDescription>
          Crie contas de teste para simular a interação entre clientes e profissionais.
          Os convites serão enviados para o email fornecido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Usuário</Label>
            <Input
              id="email"
              type="email"
              placeholder="worker@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Perfil</Label>
            <Select value={role} onValueChange={setRole} disabled={isLoading}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worker">Profissional (Worker)</SelectItem>
                <SelectItem value="employer">Cliente (Employer)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full bg-[#F26522] hover:bg-orange-600">
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Convite
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}