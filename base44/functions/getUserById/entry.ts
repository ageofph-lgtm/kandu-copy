import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  }
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { userId } = await req.json();
    if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

    const { data: user } = await db.from("users").select("*").eq("id", userId).maybeSingle();
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json({
      id: user.id,
      full_name: user.full_name,
      user_type: user.user_type,
      rating: user.rating,
      xp: user.xp,
      avatar_url: user.avatar_url,
      city: user.city,
      skills: user.skills,
      bio: user.bio,
    }, { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
