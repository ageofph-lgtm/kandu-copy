import { createClient } from 'npm:@supabase/supabase-js@2';

// ─────────────────────────────────────────────────────────────────────────────
// completeJob — mantido por compatibilidade com clientes antigos.
//
// A lógica de avaliação + XP passou para a função Postgres `submit_job_rating`
// (migração `submit_job_rating_atomic`), que corre numa única transação. Esta
// função era a origem da race condition reportada em #26: atribuía XP ao
// employer sem verificar se o profissional já tinha avaliado. Agora apenas
// delega no RPC, que só liquida o XP quando existem as duas avaliações.
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

    const { data: { user: authUser } } = await db.auth.getUser(token);
    if (!authUser?.id) return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });

    const { jobId, otherUserId, rating, comment, qualities, photos } = await req.json();
    if (!jobId || !otherUserId || !rating) {
      return Response.json({ error: "Missing required fields" }, { status: 400, headers: CORS });
    }

    const { data, error } = await db.rpc("submit_job_rating", {
      p_job_id: jobId,
      p_rater_id: authUser.id,
      p_rated_id: otherUserId,
      p_score: Number(rating),
      p_comment: comment || "",
      p_qualities: qualities || [],
      p_photos: photos || [],
    });
    if (error) return Response.json({ error: error.message }, { status: 400, headers: CORS });

    return Response.json({ success: true, ...data }, { headers: CORS });
  } catch (err) {
    console.error("completeJob error:", err);
    return Response.json({ error: err.message || "Internal error" }, { status: 500, headers: CORS });
  }
});
