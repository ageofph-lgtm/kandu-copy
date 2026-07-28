-- Tabela de denúncias / reclamações (RGPD-safe: sem dados de contacto)
-- Aplicar no Supabase antes de usar a página Reports.

create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.users(id) on delete cascade,
  reported_id   uuid references public.users(id) on delete set null,
  job_id        uuid references public.jobs(id) on delete set null,
  type          text not null check (type in ('no_show','fake_job','payment','behaviour','other')),
  description   text not null,
  evidence_urls text[] default '{}',
  xp_penalty    integer not null default 0,
  status        text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at    timestamptz not null default now()
);

create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reports_reported_idx on public.reports (reported_id);
create index if not exists reports_job_idx      on public.reports (job_id);

alter table public.reports enable row level security;

-- Quem denuncia vê as suas denúncias; quem é denunciado vê as que lhe dizem respeito.
create policy "reports_select_own" on public.reports
  for select using (auth.uid() = reporter_id or auth.uid() = reported_id);

create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);
