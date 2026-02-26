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
      const { error } = await supabase.from('jobs').delete().eq('id', event.entity_id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ success: true, action: 'deleted' });
    }

    if (!data) return Response.json({ error: 'No data' }, { status: 400 });

    const payload = {
      id: data.id,
      title: data.title,
      category: data.category,
      description: data.description,
      location: data.location,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      price: data.price,
      price_type: data.price_type,
      status: data.status,
      urgency: data.urgency || 'medium',
      employer_id: data.employer_id || data.created_by || null,
      worker_id: data.worker_id || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      created_at: data.created_date || new Date().toISOString(),
    };

    const { error } = await supabase.from('jobs').upsert(payload, { onConflict: 'id' });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true, action: event?.type });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});