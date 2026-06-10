import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { t } from '@/components/utils/translations';
import { useLanguage } from '@/lib/LanguageContext';

export default function InviteUserForm() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('worker');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error(t(lang, "adminEnterEmail", "Por favor, insira um email."));
      return;
    }
    setIsLoading(true);
    try {
      await base44.users.inviteUser(email, role);
      toast.success(`${t(lang, "adminInviteSentTo", "Convite enviado para")} ${email} ${t(lang, "adminInviteAs", "como")} ${role}.`);
      setEmail('');
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(error.message || t(lang, "adminInviteFailed", "Falha ao enviar convite."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(lang, "adminInviteTestUser", "Convidar Usuário de Teste")}</CardTitle>
        <CardDescription>
          {t(lang, "adminInviteTestUserDesc", "Crie contas de teste para simular a interação entre clientes e profissionais. Os convites serão enviados para o email fornecido.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t(lang, "adminUserEmail", "Email do Usuário")}</Label>
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
            <Label htmlFor="role">{t(lang, "adminProfileType", "Tipo de Perfil")}</Label>
            <Select value={role} onValueChange={setRole} disabled={isLoading}>
              <SelectTrigger id="role">
                <SelectValue placeholder={t(lang, "adminSelectProfile", "Selecione o perfil")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worker">{t(lang, "adminWorkerProfile", "Profissional (Worker)")}</SelectItem>
                <SelectItem value="employer">{t(lang, "adminClientProfile", "Cliente (Employer)")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full bg-[#F26522] hover:bg-orange-600">
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t(lang, "adminSendInvite", "Enviar Convite")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}