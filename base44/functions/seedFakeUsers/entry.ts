import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { createClient } from 'npm:@supabase/supabase-js@2';

// ────────────────────────────────────────────────────────────────────────────
// SEED de perfis fictícios para testes (250 workers + 150 employers por defeito).
//
// CONTEXTO / PORQUÊ ESTA FUNÇÃO EXISTE:
//   Os utilizadores do KANDU são contas de autenticação — NÃO podem ser criados
//   em massa via a entidade `User` (a API de dados recusa: "Users are managed
//   through the app's authentication system"), nem via o MCP de dados, nem
//   (na prática) via o builder. A única via programática para criar contas
//   reais em bulk é o Admin API de auth do Supabase, que o KANDU já usa como
//   espelho (ver functions/supabase, syncUserToSupabase).
//
//   Esta função cria as contas no Supabase Auth + linha de perfil na tabela
//   `users`, todas marcadas fake_test:true e com email @kandu-fake.test e uma
//   password conhecida, para poderem fazer login manual durante os testes.
//
// PARA O FABLE INTEGRAR:
//   - Confirmar se o login do KANDU usa Supabase Auth. Se o app ainda autentica
//     via Base44 Auth, é preciso também provisionar a conta Base44 (convite/
//     signup) OU migrar a leitura de perfis para a tabela Supabase `users`.
//   - Ligar a um botão admin "Popular dados de demo" e a um campo de progresso.
//
// SEGURANÇA: só admin (user.role === 'admin', gerido pela plataforma).
// LIMPEZA:   usar a função wipeFakeData (apaga tudo com fake_test:true).
// ────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const FAKE_PASSWORD = 'KanduFake!2026'; // password partilhada para testes manuais
const FAKE_DOMAIN = 'kandu-fake.test';

const CATEGORIES = ['Mão de Obra','Pintura','Eletricidade','Canalização','Alvenaria','Ladrilhador','Carpintaria','Climatização','Isolamentos','Pavimentos','Telhados'];
const CITIES = ['Lisboa','Porto','Braga','Coimbra','Faro','Aveiro','Setúbal','Funchal','Évora','Leiria'];
const FIRST = ['João','Maria','Pedro','Ana','Rui','Sofia','Miguel','Inês','Tiago','Carla','Bruno','Beatriz','André','Marta','Hugo','Diana','Luís','Rita','Paulo','Sara'];
const LAST = ['Silva','Santos','Ferreira','Pereira','Costa','Oliveira','Rodrigues','Martins','Sousa','Gonçalves','Lopes','Marques','Almeida','Ribeiro','Carvalho'];
const pick = (a: string[]) => a[Math.floor(Math.random()*a.length)];
const ri = (lo: number, hi: number) => Math.floor(Math.random()*(hi-lo+1))+lo;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (admin.role !== 'admin') return Response.json({ error: 'Forbidden — admin only.' }, { status: 403 });
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados.' }, { status: 500 });
    }

    let workers = 250, employers = 150;
    try {
      const body = await req.json();
      if (Number.isInteger(body?.workers)) workers = body.workers;
      if (Number.isInteger(body?.employers)) employers = body.employers;
    } catch (_) { /* defaults */ }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const created: { email: string; id: string; user_type: string }[] = [];
    const errors: string[] = [];

    const makeOne = async (idx: number, user_type: 'worker' | 'employer') => {
      const prefix = user_type === 'worker' ? 'worker' : 'employer';
      const email = `${prefix}${String(idx).padStart(3,'0')}@${FAKE_DOMAIN}`;
      const full_name = `[FAKE] ${pick(FIRST)} ${pick(LAST)}`;
      const city = pick(CITIES);
      try {
        // 1) cria conta de auth (login real com FAKE_PASSWORD)
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
          email,
          password: FAKE_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name, user_type, fake_test: true },
        });
        if (authErr) throw authErr;
        const id = authData.user!.id;

        // 2) espelha o perfil na tabela `users` (lida pela app via functions/supabase)
        const profile: Record<string, unknown> = {
          id, email, full_name, user_type, role: 'user', status: 'active', city,
          bio: user_type === 'worker' ? 'Profissional de construção (perfil de teste).' : 'Empregador (perfil de teste).',
          skills: user_type === 'worker' ? [pick(CATEGORIES), pick(CATEGORIES)] : null,
          rating: ri(30,50)/10, verified: Math.random() < 0.5, fake_test: true,
          synced_at: new Date().toISOString(),
        };
        const { error: upErr } = await supabase.from('users').upsert(profile, { onConflict: 'id' });
        if (upErr) throw upErr;

        created.push({ email, id, user_type });
      } catch (e) {
        if (errors.length < 10) errors.push(`${email}: ${(e as Error).message}`);
      }
    };

    for (let i = 1; i <= workers; i++) await makeOne(i, 'worker');
    for (let i = 1; i <= employers; i++) await makeOne(i, 'employer');

    return Response.json({
      success: true,
      created: created.length,
      requested: workers + employers,
      password: FAKE_PASSWORD,
      sample: created.slice(0, 5),
      errors: errors.length ? errors : undefined,
      note: 'Perfis fictícios criados no Supabase Auth + tabela users (fake_test:true). Login manual com a password indicada. Apagar com wipeFakeData (includeUsers:true) ou via SQL: delete where fake_test.',
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
