import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Autorização: apenas automações agendadas (via secret partilhado) ou
    // administradores. Um erro em auth.me() NÃO pode ser interpretado como
    // automação — isso permitiria a qualquer um correr a função sem sessão.
    const automationSecret = Deno.env.get('AUTOMATION_SECRET');
    const providedSecret = req.headers.get('x-automation-secret');
    const isAutomation = !!automationSecret && providedSecret === automationSecret;

    if (!isAutomation) {
      let user;
      try {
        user = await base44.auth.me();
      } catch {
        user = null;
      }
      if (user?.role !== 'admin' && user?.user_type !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const db = base44.asServiceRole;

    // Get all non-archived messages
    const allMessages = await db.entities.ChatMessage.list('-created_date', 5000);

    // Group by conversation_id and find the latest message per conversation
    const conversationLatest = new Map();
    for (const msg of allMessages) {
      if (msg.is_archived) continue;
      const existing = conversationLatest.get(msg.conversation_id);
      if (!existing || new Date(msg.created_date) > new Date(existing.created_date)) {
        conversationLatest.set(msg.conversation_id, msg);
      }
    }

    const now = Date.now();
    const toArchive = [];

    for (const [convId, latestMsg] of conversationLatest.entries()) {
      const inactiveSince = now - new Date(latestMsg.created_date).getTime();
      if (inactiveSince >= TWO_WEEKS_MS) {
        toArchive.push(convId);
      }
    }

    // Archive all messages in inactive conversations
    let archivedCount = 0;
    for (const convId of toArchive) {
      const msgs = allMessages.filter(m => m.conversation_id === convId && !m.is_archived);
      for (const msg of msgs) {
        await db.entities.ChatMessage.update(msg.id, { is_archived: true });
        archivedCount++;
      }
    }

    return Response.json({
      success: true,
      conversations_archived: toArchive.length,
      messages_archived: archivedCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});