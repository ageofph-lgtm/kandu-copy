import { createClient } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    // Usar asServiceRole diretamente — sem verificação de session cookie
    // (credentials:include não funciona no contexto Base44 iframe)
    const base44 = createClient({ appId: Deno.env.get('APP_ID') || '' });
    const db = base44.asServiceRole;

    const body = await req.json();
    const { jobId, applicationId, otherUserId, raterId, rating, comment, qualities } = body;

    if (!raterId) {
      return Response.json({ error: 'raterId required' }, { status: 400 });
    }

    if (!jobId || !otherUserId || !rating) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── 1. Criar a avaliação ─────────────────────────────────────────────────
    const visibleAfter = new Date();
    visibleAfter.setDate(visibleAfter.getDate() + 7);

    const newRating = await db.entities.Rating.create({
      job_id: jobId,
      rater_id: raterId,
      rated_id: otherUserId,
      rating: rating,
      comment: comment || '',
      qualities: qualities || [],
      is_visible: false,
      visible_after: visibleAfter.toISOString()
    });

    // ── 2. Verificar se a outra parte já avaliou (Blind Review) ──────────────
    const reciprocalRatings = await db.entities.Rating.filter({ job_id: jobId, rater_id: otherUserId });
    const reciprocalForThisJob = reciprocalRatings.filter(r => r.job_id === jobId);

    if (reciprocalForThisJob.length > 0) {
      await db.entities.Rating.update(newRating.id, { is_visible: true });
      await db.entities.Rating.update(reciprocalForThisJob[0].id, { is_visible: true });
    }

    // ── 3. Atualizar XP e rating do utilizador avaliado ──────────────────────
    const otherUser = await db.entities.User.get(otherUserId);
    if (otherUser) {
      const job = await db.entities.Job.get(jobId);
      const jobPrice = job?.price || 0;

      // Calcular XP ganho
      const base = Math.min(Math.max(jobPrice * 0.1, 10), 100);
      const xpGained = Math.round(base * (rating / 5));
      const newXP = (otherUser.xp || 0) + xpGained;

      // Calcular novo rating médio
      const allRatings = await db.entities.Rating.filter({ rated_id: otherUserId, is_visible: true });
      const totalRatings = allRatings.length;
      const ratingSum = allRatings.reduce((sum, r) => sum + (r.rating || 0), 0);
      const newAvgRating = totalRatings > 0 ? parseFloat((ratingSum / totalRatings).toFixed(1)) : rating;

      // Determinar nível XP
      const XP_LEVELS = [
        { name: "Novato", min: 0, max: 999 },
        { name: "Aprendiz", min: 1000, max: 4999 },
        { name: "Profissional", min: 5000, max: 14999 },
        { name: "Especialista", min: 15000, max: 39999 },
        { name: "Mestre", min: 40000, max: Infinity },
      ];
      const level = XP_LEVELS.find(l => newXP >= l.min && newXP <= l.max) || XP_LEVELS[0];

      await db.entities.User.update(otherUserId, {
        xp: newXP,
        xp_level: level.name,
        rating: newAvgRating
      });
    }

    // ── 4. Atualizar XP do utilizador atual ──────────────────────────────────
    const selfXPGained = 30; // XP_EVENTS.job_completed_self
    const newSelfXP = (currentUser.xp || 0) + selfXPGained;
    const XP_LEVELS = [
      { name: "Novato", min: 0, max: 999 },
      { name: "Aprendiz", min: 1000, max: 4999 },
      { name: "Profissional", min: 5000, max: 14999 },
      { name: "Especialista", min: 15000, max: 39999 },
      { name: "Mestre", min: 40000, max: Infinity },
    ];
    const selfLevel = XP_LEVELS.find(l => newSelfXP >= l.min && newSelfXP <= l.max) || XP_LEVELS[0];
    await db.entities.User.update(currentUser.id, {
      xp: newSelfXP,
      xp_level: selfLevel.name
    });

    // ── 5. Atualizar status da obra e enviar notificações ────────────────────
    let finalJobStatus = 'completed';
    let notifTitle = '';
    let notifMessage = '';
    let notifTarget = otherUserId;

    if (currentUser.user_type === 'employer') {
      // Se worker já avaliou este job → completed; senão → completed_by_employer
      const workerRatedThisJob = reciprocalForThisJob.length > 0;
      finalJobStatus = workerRatedThisJob ? 'completed' : 'completed_by_employer';

      await db.entities.Job.update(jobId, {
        status: finalJobStatus,
        actual_end_date: finalJobStatus === 'completed' ? new Date().toISOString() : undefined
      });

      if (finalJobStatus === 'completed_by_employer') {
        notifTitle = '✍️ Avalia o empregador!';
        notifMessage = `A obra foi concluída. Abre Trabalho → Em Curso para avaliar e fechar a obra.`;
      } else {
        notifTitle = '⭐ Obra concluída!';
        notifMessage = `A obra foi concluída e avaliada por ambas as partes.`;
      }

    } else if (currentUser.user_type === 'worker') {
      finalJobStatus = 'completed';
      await db.entities.Job.update(jobId, {
        status: 'completed',
        actual_end_date: new Date().toISOString()
      });
      notifTitle = '⭐ Obra concluída!';
      notifMessage = `O profissional avaliou o trabalho. Obra oficialmente encerrada.`;
    }

    // Criar notificação para a outra parte
    if (notifTarget) {
      await db.entities.Notification.create({
        user_id: notifTarget,
        type: finalJobStatus === 'completed_by_employer' ? 'job_ready_for_review' : 'job_completed',
        title: notifTitle,
        message: notifMessage,
        related_id: jobId,
        action_url: '/MyJobs',
        is_read: false
      });
    }

    return Response.json({
      success: true,
      jobStatus: finalJobStatus,
      selfXPGained,
      newSelfXP
    });

  } catch (error) {
    console.error('completeJob error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
