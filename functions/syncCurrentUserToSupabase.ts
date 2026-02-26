import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': '*' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Descobrir quais colunas existem na tabela users do Supabase
    const { data: cols, error: colsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');

    let availableColumns = new Set();
    if (!colsError && cols) {
      cols.forEach(c => availableColumns.add(c.column_name));
    }

    // 2. Mapa completo de dados do utilizador
    const allData = {
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

    // 3. Construir objeto apenas com colunas que existem
    let userData;
    if (availableColumns.size > 0) {
      userData = {};
      for (const [key, val] of Object.entries(allData)) {
        if (availableColumns.has(key)) {
          userData[key] = val;
        }
      }
      // Garantir que id e email estão sempre presentes
      userData.id = user.id;
      userData.email = user.email;
    } else {
      // Fallback: tentar com campos mínimos
      userData = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type || null,
        phone: user.phone || null,
        bio: user.bio || null,
        location: user.location || null,
        avatar_url: user.avatar_url || null,
        documents: user.documents || [],
        updated_at: new Date().toISOString(),
      };
    }

    console.log('Upserting columns:', Object.keys(userData));

    // 4. Fazer upsert
    const { error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' });

    if (error) {
      console.error('Supabase upsert error:', error);

      // Tentar fallback com campos mínimos
      const minimalData = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type || null,
        avatar_url: user.avatar_url || null,
      };

      const { error: error2 } = await supabase
        .from('users')
        .upsert(minimalData, { onConflict: 'id' });

      if (error2) {
        return Response.json({ error: error2.message, original_error: error.message }, { status: 500 });
      }

      return Response.json({ success: true, warning: 'Used minimal fallback', skipped_error: error.message });
    }

    return Response.json({ success: true, synced_columns: Object.keys(userData) });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});