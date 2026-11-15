-- Migration: cria a tabela public.vip_leads com RLS forçada, privilégios mínimos,
-- verificação de admin via public.is_vip_admin() em auth.users e RPC public.vip_lead_signup
-- (SECURITY DEFINER) compatível com dono sem superuser/BYPASSRLS e sem vazar duplicados.
-- Admin único autorizado para leitura/gestão: alandiogor@gmail.com
-- (validado em auth.users com id = auth.uid(), email_confirmed_at is not null e not is_anonymous).

create table if not exists public.vip_leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 80 and char_length(nome) <= 80),
  whatsapp_e164 text not null check (whatsapp_e164 ~ '^\+55[1-9][0-9]{9,10}$'),
  interesse text not null check (interesse in ('moto', 'bike', 'ambos')),
  consent_at timestamptz not null default now(),
  consent_text_version text not null check (
    char_length(btrim(consent_text_version)) between 1 and 64
    and char_length(consent_text_version) <= 64
  ),
  utm_source text check (utm_source is null or char_length(utm_source) <= 120),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 120),
  opted_out_at timestamptz null,
  created_at timestamptz not null default now()
);

-- Índice único no WhatsApp normalizado em E.164 (+55DD9XXXXXXXX ou +55DDXXXXXXXX).
create unique index if not exists vip_leads_whatsapp_e164_key on public.vip_leads (whatsapp_e164);

-- Trigger BEFORE INSERT: força consent_at = now() e created_at = now() no servidor,
-- tornando impossível forjar a data/hora de consentimento mesmo em INSERT direto.
create or replace function public.vip_leads_force_consent_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.consent_at := now();
  new.created_at := now();
  return new;
end;
$$;

revoke all on function public.vip_leads_force_consent_at() from public, anon, authenticated;

drop trigger if exists trg_vip_leads_force_consent_at on public.vip_leads;
create trigger trg_vip_leads_force_consent_at
  before insert on public.vip_leads
  for each row
  execute function public.vip_leads_force_consent_at();

-- Ativa e força Row Level Security (inclusive para o dono da tabela).
alter table public.vip_leads enable row level security;
alter table public.vip_leads force row level security;

-- Revoga todos os privilégios herdados de default privileges para aplicar menor privilégio.
-- O papel anon não recebe nenhum privilégio na tabela (cadastro ocorre exclusivamente via RPC).
revoke all on table public.vip_leads from public, anon, authenticated;

-- Papel authenticated possui apenas os comandos DML de gestão do painel admin
-- (filtrados pelas policies de RLS abaixo), sem INSERT direto, TRUNCATE, REFERENCES ou TRIGGER.
grant select, update, delete on table public.vip_leads to authenticated;

-- RPC de cadastro público: valida os campos com as mesmas regras dos CHECKs,
-- registra consent_at = now(), faz INSERT ... ON CONFLICT (whatsapp_e164) DO NOTHING
-- e devolve sempre void (sem expor id nem revelar se o número já existia ou se havia opt-out).
create or replace function public.vip_lead_signup(
  p_nome text,
  p_whatsapp_e164 text,
  p_interesse text,
  p_consent_text_version text,
  p_utm_source text default null,
  p_utm_campaign text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_nome is null
     or char_length(btrim(p_nome)) not between 1 and 80
     or char_length(p_nome) > 80
  then
    raise exception 'Dados de cadastro inválidos.' using errcode = '22023';
  end if;

  if p_whatsapp_e164 is null
     or p_whatsapp_e164 !~ '^\+55[1-9][0-9]{9,10}$'
  then
    raise exception 'Dados de cadastro inválidos.' using errcode = '22023';
  end if;

  if p_interesse is null
     or p_interesse not in ('moto', 'bike', 'ambos')
  then
    raise exception 'Dados de cadastro inválidos.' using errcode = '22023';
  end if;

  if p_consent_text_version is null
     or char_length(btrim(p_consent_text_version)) not between 1 and 64
     or char_length(p_consent_text_version) > 64
  then
    raise exception 'Dados de cadastro inválidos.' using errcode = '22023';
  end if;

  if p_utm_source is not null and char_length(p_utm_source) > 120 then
    raise exception 'Dados de cadastro inválidos.' using errcode = '22023';
  end if;

  if p_utm_campaign is not null and char_length(p_utm_campaign) > 120 then
    raise exception 'Dados de cadastro inválidos.' using errcode = '22023';
  end if;

  insert into public.vip_leads (
    nome,
    whatsapp_e164,
    interesse,
    consent_at,
    consent_text_version,
    utm_source,
    utm_campaign
  ) values (
    p_nome,
    p_whatsapp_e164,
    p_interesse,
    now(),
    p_consent_text_version,
    p_utm_source,
    p_utm_campaign
  )
  on conflict do nothing;
end;
$$;

revoke all on function public.vip_lead_signup(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.vip_lead_signup(text, text, text, text, text, text) to anon, authenticated;

comment on function public.vip_lead_signup(text, text, text, text, text, text) is
  'Cadastra lead VIP validando os campos, forçando consent_at = now() e ignorando duplicados sem vazar existência prévia nem expor id.';

-- Função de verificação do administrador único diretamente em auth.users (sem depender de claims do JWT).
create or replace function public.is_vip_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from auth.users
    where id = auth.uid()
      and email = 'alandiogor@gmail.com'
      and email_confirmed_at is not null
      and not is_anonymous
  );
$$;

revoke all on function public.is_vip_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_vip_admin() to authenticated;

comment on function public.is_vip_admin() is
  'Verifica em auth.users se auth.uid() pertence ao admin alandiogor@gmail.com com email_confirmed_at preenchido e not is_anonymous.';

-- Remove policy de insert legada caso exista.
drop policy if exists vip_leads_insert_consent on public.vip_leads;

-- Policy de INSERT restrita exclusivamente ao dono (definer) da tabela/RPC para que
-- public.vip_lead_signup funcione com FORCE ROW LEVEL SECURITY mesmo quando o dono
-- não é superuser e não possui BYPASSRLS (nunca permite INSERT direto de anon/authenticated).
drop policy if exists vip_leads_definer_insert on public.vip_leads;
create policy vip_leads_definer_insert
  on public.vip_leads
  for insert
  with check (
    current_user not in ('anon', 'authenticated')
    and current_user in (
      (
        select pg_catalog.pg_get_userbyid(c.relowner)
        from pg_catalog.pg_class c
        where c.oid = 'public.vip_leads'::pg_catalog.regclass
      ),
      (
        select pg_catalog.pg_get_userbyid(p.proowner)
        from pg_catalog.pg_proc p
        where p.oid = 'public.vip_lead_signup(text,text,text,text,text,text)'::pg_catalog.regprocedure
      )
    )
    and opted_out_at is null
  );

comment on policy vip_leads_definer_insert on public.vip_leads is
  'Permite INSERT sob FORCE RLS exclusivamente ao role definer/dono da tabela e da RPC vip_lead_signup (nunca para anon ou authenticated).';

-- Policy de SELECT: somente o administrador confirmado em auth.users via public.is_vip_admin().
drop policy if exists vip_leads_admin_select on public.vip_leads;
create policy vip_leads_admin_select
  on public.vip_leads
  for select
  to authenticated
  using ((select public.is_vip_admin()));

comment on policy vip_leads_admin_select on public.vip_leads is
  'Restringe SELECT na tabela vip_leads exclusivamente ao administrador confirmado em auth.users via public.is_vip_admin().';

-- Policy de UPDATE: somente o administrador confirmado em auth.users via public.is_vip_admin().
drop policy if exists vip_leads_admin_update on public.vip_leads;
create policy vip_leads_admin_update
  on public.vip_leads
  for update
  to authenticated
  using ((select public.is_vip_admin()))
  with check ((select public.is_vip_admin()));

comment on policy vip_leads_admin_update on public.vip_leads is
  'Restringe UPDATE na tabela vip_leads exclusivamente ao administrador confirmado em auth.users via public.is_vip_admin().';

-- Policy de DELETE: somente o administrador confirmado em auth.users via public.is_vip_admin().
drop policy if exists vip_leads_admin_delete on public.vip_leads;
create policy vip_leads_admin_delete
  on public.vip_leads
  for delete
  to authenticated
  using ((select public.is_vip_admin()));

comment on policy vip_leads_admin_delete on public.vip_leads is
  'Restringe DELETE na tabela vip_leads exclusivamente ao administrador confirmado em auth.users via public.is_vip_admin().';
