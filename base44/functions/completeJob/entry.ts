import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  }

  try {
    // 1. Autenticação — extrair JWT do header Authorization
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Cliente com JWT do utilizador (para verificar identidade)
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });

    // Verificar quem é o utilizador autenticado
    const { data: { user: authUser } } = await supabaseUser.auth.getUser(token);
    if (!authUser?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const raterId = authUser.id;

    // Cliente admin para operações de escrita
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const body = await req.json();
    const { jobId, applicationId, otherUserId, rating, comment, qualities, photoCount, raterUserType } = body;

    if (!jobId || !otherUserId || !rating) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return Response.json({ error: "Invalid rating (1-5)" }, { status: 400 });
    }

    if (otherUserId === raterId) {
      return Response.json({ error: "Cannot rate yourself" }, { status: 400 });
    }

    // 2. Verificar o job
    const { data: job } = await db.from("jobs").select("*").eq("id", jobId).maybeSingle();
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

    // 3. Criar avaliação (score — não rating)
    const ratingId = crypto.randomUUID();
    const { error: ratingErr } = await db.from("ratings").insert({
      id: ratingId,
      job_id: jobId,
      rater_id: raterId,
      rated_id: otherUserId,
      score: ratingNum,
      comment: comment || "",
      created_at: new Date().toISOString(),
    });
    if (ratingErr) {
      console.error("Rating insert error:", ratingErr);
      // Se for duplicado, ignorar
      if (!ratingErr.code?.includes("23505")) {
        return Response.json({ error: ratingErr.message }, { status: 500 });
      }
    }

    // 4. Calcular novo rating médio do avaliado
    const { data: allRatings } = await db.from("ratings").select("score").eq("rated_id", otherUserId);
    const totalRatings = allRatings?.length || 1;
    const ratingSum = (allRatings || []).reduce((s, r) => s + (r.score || 0), 0);
    const newAvgRating = parseFloat((ratingSum / totalRatings).toFixed(1));

    // 5. Calcular XP ganho
    const jobPrice = job.price || 0;
    const base = Math.min(Math.max(jobPrice * 0.1, 10), 100);
    const xpGained = Math.round(base * (ratingNum / 5));

    // 6. Atualizar o avaliado (rating + xp + jobs completados)
    const { data: otherUser } = await db.from("users").select("*").eq("id", otherUserId).maybeSingle();
    if (otherUser) {
      const newXP = (otherUser.xp || 0) + xpGained;
      await db.from("users").update({
        rating: newAvgRating,
        xp: newXP,
        completed_jobs: (otherUser.completed_jobs || 0) + 1,
        total_jobs: Math.max(otherUser.total_jobs || 0, (otherUser.completed_jobs || 0) + 1),
        updated_at: new Date().toISOString(),
      }).eq("id", otherUserId);
    }

    // 7. Actualizar XP do avaliador
    const { data: raterUser } = await db.from("users").select("*").eq("id", raterId).maybeSingle();
    const selfXPGained = Math.round(xpGained * 0.3);
    if (raterUser) {
      await db.from("users").update({
        xp: (raterUser.xp || 0) + selfXPGained,
        updated_at: new Date().toISOString(),
      }).eq("id", raterId);
    }

    // 8. Atualizar status do job para "completed"
    await db.from("jobs").update({
      status: "completed",
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    // 9. Atualizar application para "completed"
    if (applicationId) {
      await db.from("applications").update({
        status: "completed",
        updated_at: new Date().toISOString(),
      }).eq("id", applicationId);
    }

    // 10. Notificação para o avaliado
    await db.from("notifications").insert({
      user_id: otherUserId,
      type: "new_rating",
      title: `Nova avaliação ${"⭐".repeat(ratingNum)}`,
      message: `Recebeste uma avaliação de ${ratingNum}/5: "${(comment || "").substring(0, 60)}"`,
      related_id: jobId,
      read: false,
      created_at: new Date().toISOString(),
    });

    const newSelfXP = (raterUser?.xp || 0) + selfXPGained;

    return Response.json({
      success: true,
      selfXPGained,
      newSelfXP,
      xpGained,
      newAvgRating,
    }, { headers: { "Access-Control-Allow-Origin": "*" } });

  } catch (err) {
    console.error("completeJob error:", err);
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
});
