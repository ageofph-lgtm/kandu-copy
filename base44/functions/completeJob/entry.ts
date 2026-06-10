import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const XP_LEVELS = [
  { name: "Novato", min: 0, max: 999 },
  { name: "Aprendiz", min: 1000, max: 4999 },
  { name: "Profissional", min: 5000, max: 14999 },
  { name: "Especialista", min: 15000, max: 39999 },
  { name: "Mestre", min: 40000, max: Infinity },
];

const xpLevelFor = (xp: number) =>
  (XP_LEVELS.find(l => xp >= l.min && xp <= l.max) || XP_LEVELS[0]).name;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ── 0. Autenticação obrigatória ──────────────────────────────────────────
    // A identidade do avaliador vem da sessão, NUNCA do body, para impedir
    // que um utilizador avalie/atribua XP em nome de outro.
    const authedUser = await base44.auth.me();
    if (!authedUser?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = base44.asServiceRole;

    const body = await req.json();
    const { jobId, applicationId, otherUserId, rating, comment, qualities } = body;
    // raterId é sempre o utilizador autenticado — ignora-se qualquer valor do body.
    const raterId = authedUser.id;

    if (!jobId || !otherUserId || !rating) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return Response.json({ error: 'Invalid rating' }, { status: 400 });
    }

    if (otherUserId === raterId) {
      return Response.json({ error: 'Cannot rate yourself' }, { status: 400 });
    }

    // ── 0.1 Autorização — o avaliador tem de ser participante da obra ─────────
    const jobForAuth = await db.entities.Job.get(jobId);
    if (!jobForAuth) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }
    const isEmployerOfJob = jobForAuth.employer_id === raterId;
    const isWorkerOfJob = jobForAuth.worker_id === raterId;
    if (!isEmployerOfJob && !isWorkerOfJob) {
      return Response.json({ error: 'Forbidden — not a participant of this job' }, { status: 403 });
    }
    // O avaliado tem de ser a outra parte da obra.
    const expectedOther = isEmployerOfJob ? jobForAuth.worker_id : jobForAuth.employer_id;
    if (expectedOther && otherUserId !== expectedOther) {
      return Response.json({ error: 'Forbidden — rated user is not the job counterparty' }, { status: 403 });
    }
    // A obra tem de estar num estado que permita avaliação.
    if (!['in_progress', 'completed_by_employer', 'completed'].includes(jobForAuth.status)) {
      return Response.json({ error: 'Job is not in a reviewable state' }, { status: 409 });
    }
    // Impedir avaliação duplicada do mesmo avaliador para a mesma obra.
    const existingByRater = await db.entities.Rating.filter({ job_id: jobId, rater_id: raterId });
    if (existingByRater.length > 0) {
      return Response.json({ error: 'You have already rated this job' }, { status: 409 });
    }

    // ── 1. Criar a avaliação ─────────────────────────────────────────────────
    const visibleAfter = new Date();
    visibleAfter.setDate(visibleAfter.getDate() + 7);

    const newRating = await db.entities.Rating.create({
      job_id: jobId,
      rater_id: raterId,
      rated_id: otherUserId,
      rating: ratingNum,
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
      const xpGained = Math.round(base * (ratingNum / 5));
      const newXP = (otherUser.xp || 0) + xpGained;

      // Calcular novo rating médio
      const allRatings = await db.entities.Rating.filter({ rated_id: otherUserId, is_visible: true });
      const totalRatings = allRatings.length;
      const ratingSum = allRatings.reduce((sum, r) => sum + (r.rating || 0), 0);
      const newAvgRating = totalRatings > 0 ? parseFloat((ratingSum / totalRatings).toFixed(1)) : ratingNum;

      await db.entities.User.update(otherUserId, {
        xp: newXP,
        xp_level: xpLevelFor(newXP),
        rating: newAvgRating
      });
    }

    // ── 4. Atualizar XP do utilizador que avaliou (raterId) ────────────────
    const raterUser = await db.entities.User.get(raterId);
    const selfXPGained = 30;
    const newSelfXP = (raterUser?.xp || 0) + selfXPGained;
    await db.entities.User.update(raterId, {
      xp: newSelfXP,
      xp_level: xpLevelFor(newSelfXP)
    });

    // ── 5. Atualizar status da obra e enviar notificações ────────────────────
    // O papel do avaliador é determinado pela sua posição na obra (validado
    // acima), nunca por um campo enviado pelo cliente.
    const raterType = isEmployerOfJob ? 'employer' : 'worker';
    let finalJobStatus = 'completed';
    let notifTitle = '';
    let notifMessage = '';
    let notifTarget = otherUserId;

    if (raterType === 'employer') {
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

    } else {
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
