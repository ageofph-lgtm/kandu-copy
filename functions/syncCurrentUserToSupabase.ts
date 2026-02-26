import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

// Cache das colunas para evitar queries repetidas
let cachedColumns = null;

async function getExistingColumns() {
  if (cachedColumns) return cachedColumns;
  try {
    const { data } = await supabase.from('users').select('*').limit(0);
    // Se chegou aqui sem erro, tenta uma query para ver as colunas
    const res = await supabase.rpc('get_table_columns', { tbl: 'users' }).maybeSingle();
    return null;
  } catch {
    return null;
  }
}

// Upsert que remove automaticamente colunas inválidas
async function smartUpsert(data, maxRetries = 15) {
  let current = { ...data };
  for (let i = 0; i < maxRetries; i++) {
    const { error } = await supabase.from('users').upsert(current, { onConflict: 'id' });
    if (!error) return { success: true, columns: Object.keys(current) };

    const match = error.message?.match(/Could not find the '(\w+)'/);
    if (match) {
      console.log(`Column '${match[1]}' not found in Supabase, skipping.`);
      delete current[match[1]];
    } else {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}

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

    const result = await smartUpsert({
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
      status: user.status || 'active',
      updated_at: new Date().toISOString(),
    });

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({ success: true, synced: result.columns });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});