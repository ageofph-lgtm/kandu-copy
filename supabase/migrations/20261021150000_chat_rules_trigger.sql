-- ============================================================================
-- KANDU · Regras do chat impostas no servidor (#88, #89, #90, #91, #92, #93)
-- O cliente usa a anon key directamente e a tabela não tem RLS, por isso as
-- regras que viviam só na UI eram contornáveis. Este trigger aplica-as a
-- qualquer INSERT em chat_messages, venha de onde vier.
--   1. Obra fechada (completed/cancelled/closed/expired) ou chat_locked → bloqueia.
--   2. Conversa inactiva há 14+ dias → arquivada, não aceita mais mensagens.
--   3. Antes da aceitação:
--      · chat de obra: no máximo 1 mensagem por pessoa até a candidatura
--        estar accepted/in_progress/completed (ou o worker estar contratado);
--      · chat directo (sem obra): no máximo 1 mensagem até o outro responder.
-- ============================================================================
create or replace function public.enforce_chat_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job        jobs%rowtype;
  v_last       timestamptz;
  v_mine       int;
  v_theirs     int;
  v_accepted   boolean := false;
begin
  if new.sender_id is null or new.receiver_id is null or new.sender_id = new.receiver_id then
    raise exception 'CHAT_INVALID_PARTICIPANTS' using errcode = 'P0001';
  end if;

  -- 1) Estado da obra
  if new.job_id is not null then
    select * into v_job from jobs where id = new.job_id;
    if found then
      if v_job.status in ('completed','cancelled','closed','expired') or coalesce(v_job.chat_locked,false) then
        raise exception 'CHAT_CLOSED: esta obra já terminou, o chat foi desativado' using errcode = 'P0001';
      end if;
    end if;
  end if;

  -- 2) Inactividade ≥ 14 dias → conversa arquivada
  select max(created_at) into v_last
    from chat_messages
   where ((sender_id = new.sender_id and receiver_id = new.receiver_id)
       or (sender_id = new.receiver_id and receiver_id = new.sender_id))
     and coalesce(job_id,'') = coalesce(new.job_id,'');
  if v_last is not null and v_last < now() - interval '14 days' then
    raise exception 'CHAT_ARCHIVED: conversa arquivada por inatividade (14 dias)' using errcode = 'P0001';
  end if;

  -- 3) Limite antes da aceitação
  select count(*) filter (where sender_id = new.sender_id),
         count(*) filter (where sender_id = new.receiver_id)
    into v_mine, v_theirs
    from chat_messages
   where ((sender_id = new.sender_id and receiver_id = new.receiver_id)
       or (sender_id = new.receiver_id and receiver_id = new.sender_id))
     and coalesce(job_id,'') = coalesce(new.job_id,'');

  if new.job_id is not null then
    v_accepted := (v_job.worker_id is not null and v_job.worker_id in (new.sender_id, new.receiver_id))
      or exists (
        select 1 from applications a
         where a.job_id = new.job_id
           and a.worker_id   in (new.sender_id, new.receiver_id)
           and a.employer_id in (new.sender_id, new.receiver_id)
           and a.status in ('accepted','in_progress','completed')
      );
    if not v_accepted and v_mine >= 1 then
      raise exception 'CHAT_LIMIT: só 1 mensagem por pessoa até a candidatura ser aceite' using errcode = 'P0001';
    end if;
  else
    if v_mine >= 1 and v_theirs = 0 then
      raise exception 'CHAT_LIMIT: só 1 mensagem até a outra pessoa responder' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_chat_rules on public.chat_messages;
create trigger trg_enforce_chat_rules
  before insert on public.chat_messages
  for each row execute function public.enforce_chat_rules();

-- Índice para as contagens por conversa
create index if not exists chat_messages_pair_job_idx
  on public.chat_messages (sender_id, receiver_id, job_id, created_at);
