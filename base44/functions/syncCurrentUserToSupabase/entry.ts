import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': '*' }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type || null,
      bio: user.bio || null,
      avatar_url: user.avatar_url || null,
      skills: user.skills || [],
      rating: user.rating || 0,
      status: user.status || 'active',
      // Novas colunas adicionadas via SQL
      phone: user.phone || null,
      location: user.location || null,
      documents: user.documents || [],
      portfolio: user.portfolio || [],
      specialties: user.specialties || [],
      hourly_rate: user.hourly_rate || null,
      experience_years: user.experience_years || null,
      total_jobs: user.total_jobs || 0,
      completed_jobs: user.completed_jobs || 0,
      xp: user.xp || 0,
      level: user.level || 1,
      language: user.language || 'PT',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('users').upsert(userData, { onConflict: 'id' });

    if (error) {
      console.error('Supabase error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});