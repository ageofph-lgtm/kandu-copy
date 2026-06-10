import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Esta função apaga todos os dados transacionais da aplicação.
// Apenas pode ser chamada por um administrador autenticado.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // SDK >= 0.8.x: auth.me() devolve o objecto do utilizador directamente (ou null).
    const user = await base44.auth.me();
    if (!user?.id) {
      return Response.json({ error: "Acesso não autorizado." }, { status: 401 });
    }
    if (user.user_type !== "admin" && user.role !== "admin") {
      return Response.json({ error: "Acesso negado. Apenas para administradores." }, { status: 403 });
    }

    console.log(`🧹 Limpeza de dados iniciada pelo admin: ${user.email}`);

    const db = base44.asServiceRole;

    const entitiesToWipe = ["Rating", "Application", "ChatMessage", "Notification", "Job"];
    const deletionLogs: Record<string, string> = {};

    for (const entityName of entitiesToWipe) {
      const records = await db.entities[entityName].list();
      for (const record of records) {
        await db.entities[entityName].delete(record.id);
      }
      deletionLogs[entityName] = `${records.length} registos apagados.`;
      console.log(`✅ ${entityName}: ${records.length} registos apagados.`);
    }

    // Resetar apenas métricas — nunca role/user_type.
    const allUsers = await db.entities.User.list();
    for (const u of allUsers) {
      await db.entities.User.update(u.id, {
        rating: 0,
        xp: 0,
        portfolio_images: [],
        documents: [],
      });
    }
    console.log(`✅ Reset de estatísticas para ${allUsers.length} utilizadores.`);

    return Response.json({ success: true, deletionLogs });

  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
