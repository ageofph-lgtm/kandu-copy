import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Preparar dados do utilizador para o Supabase
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type || null,
      phone: user.phone || null,
      bio: user.bio || null,
      location: user.location || null,
      avatar_url: user.avatar_url || null,
      specialties: user.specialties || [],
      skills: user.skills || [],
      hourly_rate: user.hourly_rate || null,
      experience_years: user.experience_years || null,
      rating: user.rating || 0,
      total_jobs: user.total_jobs || 0,
      completed_jobs: user.completed_jobs || 0,
      xp: user.xp || 0,
      level: user.level || 1,
      language: user.language || 'PT',
      documents: user.documents || [],
      portfolio: user.portfolio || [],
      updated_at: new Date().toISOString()
    };

    // Fazer upsert na tabela users do Supabase
    const { error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' });

    if (error) {
      console.error('Supabase upsert error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error syncing user to Supabase:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});