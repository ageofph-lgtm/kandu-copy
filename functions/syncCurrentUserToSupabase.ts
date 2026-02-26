import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = {
      id: user.id,
      email: user.email || null,
      full_name: user.full_name || null,
      user_type: user.user_type || null,
      role: user.role || null,
      city: user.city || null,
      bio: user.bio || null,
      skills: user.skills ? JSON.stringify(user.skills) : null,
      avatar_url: user.avatar_url || null,
      documents: user.documents ? JSON.stringify(user.documents) : null,
      rating: user.rating || null,
      verified: user.verified || false,
      phone: user.phone || null,
      synced_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});