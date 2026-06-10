import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

// Secret partilhado com o sistema de automações Base44.
// Sem ele, a função recusa — impede injecção de dados forjados via HTTP.
const AUTOMATION_SECRET = Deno.env.get("AUTOMATION_SECRET");

Deno.serve(async (req) => {
  try {
    // Validar origem: apenas automações autorizadas podem chamar esta função.
    const providedSecret = req.headers.get("x-automation-secret");
    if (!AUTOMATION_SECRET || providedSecret !== AUTOMATION_SECRET) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { event, data } = body;

    if (event?.type === "delete") {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", event.entity_id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ success: true, action: "deleted" });
    }

    if (!data) return Response.json({ error: "No data" }, { status: 400 });

    // Allowlist explícita — nunca usar spread do body para impedir escalada de privilégios.
    const payload = {
      id: data.id,
      email: data.email || null,
      full_name: data.full_name || null,
      user_type: data.user_type || null,
      // role e user_type=admin NUNCA sincronizados — gerido apenas internamente.
      status: data.status === "active" || data.status === "inactive" ? data.status : "active",
      city: data.city || null,
      bio: data.bio || null,
      skills: data.skills || null,
      avatar_url: data.avatar_url || null,
      rating: typeof data.rating === "number" ? data.rating : null,
      verified: data.verified === true,
      synced_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("users")
      .upsert(payload, { onConflict: "id" });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true, action: event?.type });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
