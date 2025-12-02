import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Esta função apaga todos os dados transacionais da aplicação.
// Apenas pode ser chamada por um administrador.
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // 1. Autenticar e verificar se o utilizador é admin
        const { data: user, error: userError } = await base44.auth.me();
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), { status: 401 });
        }
        if (user.user_type !== 'admin') {
            return new Response(JSON.stringify({ error: 'Acesso negado. Apenas para administradores.' }), { status: 403 });
        }

        console.log(`🧹 Limpeza de dados iniciada pelo admin: ${user.email}`);

        // Usar o service role para ter permissões de apagar tudo
        const serviceRoleClient = base44.asServiceRole;

        // 2. Obter e apagar dados de todas as entidades
        const entitiesToWipe = ['Rating', 'Application', 'ChatMessage', 'Notification', 'Job'];
        const deletionLogs = {};

        for (const entityName of entitiesToWipe) {
            const records = await serviceRoleClient.entities[entityName].list();
            for (const record of records) {
                await serviceRoleClient.entities[entityName].delete(record.id);
            }
            deletionLogs[entityName] = `${records.length} registos apagados.`;
            console.log(`✅ ${entityName}: ${records.length} registos apagados.`);
        }

        // 3. Resetar estatísticas dos utilizadores
        const allUsers = await serviceRoleClient.entities.User.list();
        for (const u of allUsers) {
            await serviceRoleClient.entities.User.update(u.id, {
                rating: 0,
                xp: 0,
                portfolio_images: [],
                documents: []
            });
        }
        console.log(`✅ Reset de estatísticas para ${allUsers.length} utilizadores.`);

        return new Response(JSON.stringify({ success: true, logs: deletionLogs }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("❌ Erro crítico durante a limpeza de dados:", error);
        return new Response(JSON.stringify({ error: 'Erro no servidor durante a limpeza.', details: error.message }), { status: 500 });
    }
});