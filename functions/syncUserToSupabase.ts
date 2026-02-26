import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { event, data } = body;

    if (event?.type === 'delete') {
      const { error } = await supabase.from('users').delete().eq('id', event.entity_id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ success: true, action: 'deleted' });
    }

    if (!data) return Response.json({ error: 'No data' }, { status: 400 });

    const payload = {
      id: data.id,
      email: data.email || null,
      full_name: data.full_name || null,
      user_type: data.user_type || null,
      role: data.role || null,
      status: data.status || 'active',
      city: data.city || null,
      bio: data.bio || null,
      skills: data.skills || null,
      avatar_url: data.avatar_url || null,
      rating: data.rating || null,
      verified: data.verified || false,
      synced_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true, action: event?.type });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});