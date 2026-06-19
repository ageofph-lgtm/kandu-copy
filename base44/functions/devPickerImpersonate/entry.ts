import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const DEV_EMAILS = [
  "lucasfelipesantos@gmail.com",
  "urielramoss@gmail.com",
  "ageofph@gmail.com",
  "phtoledo9@gmail.com",
  "syntrophystudio@gmail.com",
  "renanvieira8523@gmail.com",
];

const FAKE_PASSWORD = "Kandu2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  }

  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

    // Verificar token do caller
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    let callerEmail = null;
    if (token) {
      const { data: { user } } = await db.auth.getUser(token);
      callerEmail = user?.email;
    }

    // Se não tem token válido ou não é credenciado, retornar lista vazia
    const isCredenciado = callerEmail && DEV_EMAILS.includes(callerEmail);

    const body = await req.json().catch(() => ({}));
    const { action, targetUserId, targetEmail } = body;

    // ── listUsers: retorna todos os users via service role ──
    if (action === "listUsers") {
      if (!isCredenciado) {
        return Response.json({ users: [], error: "Não autorizado" }, { headers });
      }
      const { data: users } = await db.from("users")
        .select("id,email,full_name,user_type,avatar_url,rating,city,xp")
        .order("user_type", { ascending: true })
        .order("full_name", { ascending: true });
      return Response.json({ users: users || [] }, { headers });
    }

    // ── impersonate: fazer sign-in como um utilizador fake ──
    if (action === "impersonate") {
      if (!isCredenciado) {
        return Response.json({ error: "Não autorizado" }, { headers, status: 401 });
      }
      if (!targetEmail) {
        return Response.json({ error: "targetEmail é obrigatório" }, { headers, status: 400 });
      }

      // Verificar que o target não é um credenciado (não impersonar outros admins)
      if (DEV_EMAILS.includes(targetEmail)) {
        return Response.json({ error: "Não podes impersonar outro credenciado" }, { headers, status: 403 });
      }

      // Fazer sign-in com a password seed do fake
      const supabasePublic = createClient(SUPABASE_URL, 
        Deno.env.get("SUPABASE_ANON_KEY") || SUPABASE_SERVICE_KEY);
      
      const { data: signInData, error: signInErr } = await supabasePublic.auth.signInWithPassword({
        email: targetEmail,
        password: FAKE_PASSWORD,
      });

      if (signInErr || !signInData?.session) {
        // Fallback: criar magic link via admin
        const { data: linkData, error: linkErr } = await db.auth.admin.generateLink({
          type: "magiclink",
          email: targetEmail,
        });
        if (linkErr) {
          return Response.json({ error: `Não foi possível fazer login como ${targetEmail}: ${signInErr?.message || linkErr.message}` }, { headers, status: 500 });
        }
        // Retornar o token do magic link para o frontend usar
        const hashed = linkData?.properties?.hashed_token;
        return Response.json({ 
          method: "magiclink",
          token: hashed,
          email: targetEmail,
        }, { headers });
      }

      return Response.json({
        method: "password",
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        email: targetEmail,
      }, { headers });
    }

    return Response.json({ error: "action inválida. Use listUsers ou impersonate" }, { headers, status: 400 });

  } catch (err) {
    console.error("devPickerImpersonate error:", err);
    return Response.json({ error: err.message }, { headers, status: 500 });
  }
});
