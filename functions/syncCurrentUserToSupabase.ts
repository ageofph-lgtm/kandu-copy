import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

// Detectar colunas da tabela tentando um select
async function getTableColumns() {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error || !data) return null;
    if (data.length > 0) return new Set(Object.keys(data[0]));
    // Tabela vazia - tentar com insert de teste
    return null;
  } catch {
    return null;
  }
}

// Tentar upsert e remover campos que causam erro
async function upsertWithFallback(data) {
  const { error } = await supabase.from('users').upsert(data, { onConflict: 'id' });
  if (!error) return { success: true };

  // Remover campo que causou erro e tentar de novo
  const msg = error.message || '';
  const match = msg.match(/column of '(\w+)' in the schema cache/);
  const colMatch = msg.match(/Could not find the '(\w+)'/);
  
  if (colMatch) {
    const badCol = colMatch[1];
    console.log('Removing bad column:', badCol);
    const newData = { ...data };
    delete newData[badCol];
    return upsertWithFallback(newData);
  }

  return { success: false, error: error.message };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Dados completos do utilizador
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
      status: user.status || 'active',
      updated_at: new Date().toISOString(),
    };

    // Tentar upsert removendo automaticamente colunas que não existem
    const result = await upsertWithFallback(userData);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});