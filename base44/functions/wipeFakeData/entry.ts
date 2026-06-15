import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Apaga APENAS os dados de teste fictícios marcados com fake_test:true.
// Criado para o povoamento de testes (jobs/applications/chat/ratings/notifications)
// e, opcionalmente, os utilizadores fictícios (@kandu-fake.test).
//
// Só pode ser chamada por um administrador (valida user.role === 'admin',
// gerido pela plataforma — nunca user_type, que é auto-editável no onboarding).
//
// Uso (cliente, autenticado como admin):
//   await base44.functions.wipeFakeData({ includeUsers: false });
//   includeUsers:true também tenta apagar os User com email @kandu-fake.test
//   (só funciona se a plataforma permitir delete de User via service role).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.id) {
      return Response.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas para administradores.' }, { status: 403 });
    }

    let includeUsers = false;
    try {
      const body = await req.json();
      includeUsers = body?.includeUsers === true;
    } catch (_) { /* sem corpo — ok */ }

    const db = base44.asServiceRole;
    const logs: Record<string, string> = {};

    // Ordem: apagar dependentes antes (não é obrigatório, mas mais limpo).
    const entitiesToWipe = ['Rating', 'Application', 'ChatMessage', 'Notification', 'Job'];
    for (const entityName of entitiesToWipe) {
      const records = await db.entities[entityName].filter({ fake_test: true });
      for (const record of records) {
        await db.entities[entityName].delete(record.id);
      }
      logs[entityName] = `${records.length} registos fictícios apagados.`;
      console.log(`🧹 ${entityName}: ${records.length} apagados.`);
    }

    if (includeUsers) {
      // Tenta apagar utilizadores fictícios. NOTA: a plataforma Base44 pode
      // não permitir delete de User via service role — neste caso reporta o erro
      // por utilizador mas não falha a operação inteira.
      const fakeUsers = (await db.entities.User.filter({ fake_test: true }))
        .filter((u: any) => typeof u.email === 'string' && u.email.endsWith('@kandu-fake.test'));
      let deleted = 0;
      const errors: string[] = [];
      for (const u of fakeUsers) {
        try { await db.entities.User.delete(u.id); deleted++; }
        catch (e) { errors.push(`${u.email}: ${(e as Error).message}`); }
      }
      logs['User'] = `${deleted}/${fakeUsers.length} utilizadores fictícios apagados.`;
      if (errors.length) logs['User_errors'] = errors.slice(0, 5).join(' | ');
    }

    return Response.json({ success: true, logs });
  } catch (error) {
    console.error('❌ Erro durante wipeFakeData:', error);
    return Response.json({ error: 'Erro no servidor.', details: (error as Error).message }, { status: 500 });
  }
});
