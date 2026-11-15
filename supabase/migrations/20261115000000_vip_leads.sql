-- Migration: cria a tabela public.vip_leads com RLS forçada e privilégios mínimos.
-- Admin único autorizado para leitura/gestão: alandiogor@gmail.com.

create table public.vip_leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 80 and char_length(nome) <= 80),
  whatsapp_e164 text not null check (whatsapp_e164 ~ '^\+55[1-9][0-9]{9,10}$'),
  interesse text not null check (interesse in ('moto', 'bike', 'ambos')),
  consent_at timestamptz not null,
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
create unique index vip_leads_whatsapp_e164_key on public.vip_leads (whatsapp_e164);

-- Ativa e força Row Level Security (inclusive para o dono da tabela).
alter table public.vip_leads enable row level security;
alter table public.vip_leads force row level security;

-- Revoga todos os privilégios herdados de default privileges para aplicar menor privilégio.
revoke all on table public.vip_leads from public, anon, authenticated;

-- Papel anon só pode inserir nas colunas permitidas do formulário público;
-- não pode ler nada nem definir id, created_at ou opted_out_at.
grant insert (
  nome,
  whatsapp_e164,
  interesse,
  consent_at,
  consent_text_version,
  utm_source,
  utm_campaign
) on table public.vip_leads to anon;

-- Papel authenticated possui apenas os comandos DML necessários para o painel admin
-- (filtrados pelas policies de RLS abaixo), sem TRUNCATE, REFERENCES ou TRIGGER.
grant select, insert, update, delete on table public.vip_leads to authenticated;

-- Policy de INSERT: permite que visitantes anônimos (anon) e sessões autenticadas
-- cadastrem um lead somente com consentimento LGPD registrado (consent_at e
-- consent_text_version preenchidos) e sem opt-out prévio (opted_out_at is null).
create policy vip_leads_insert_consent
  on public.vip_leads
  for insert
  to anon, authenticated
  with check (
    consent_at is not null
    and consent_text_version is not null
    and char_length(btrim(consent_text_version)) > 0
    and opted_out_at is null
  );

comment on policy vip_leads_insert_consent on public.vip_leads is
  'Permite INSERT por anon e authenticated apenas com consent_at e consent_text_version preenchidos e opted_out_at nulo.';

-- Policy de SELECT: somente o administrador autenticado (alandiogor@gmail.com)
-- pode ler os leads. Nenhum SELECT é concedido a anon ou a outros e-mails.
create policy vip_leads_admin_select
  on public.vip_leads
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'alandiogor@gmail.com');

comment on policy vip_leads_admin_select on public.vip_leads is
  'Restringe SELECT na tabela vip_leads exclusivamente ao usuário autenticado com e-mail alandiogor@gmail.com.';

-- Policy de UPDATE: somente o administrador autenticado (alandiogor@gmail.com)
-- pode atualizar registros (ex.: preencher opted_out_at em pedido de descadastro).
create policy vip_leads_admin_update
  on public.vip_leads
  for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'alandiogor@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'alandiogor@gmail.com');

comment on policy vip_leads_admin_update on public.vip_leads is
  'Restringe UPDATE na tabela vip_leads exclusivamente ao usuário autenticado com e-mail alandiogor@gmail.com.';

-- Policy de DELETE: somente o administrador autenticado (alandiogor@gmail.com)
-- pode remover registros da tabela.
create policy vip_leads_admin_delete
  on public.vip_leads
  for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'alandiogor@gmail.com');

comment on policy vip_leads_admin_delete on public.vip_leads is
  'Restringe DELETE na tabela vip_leads exclusivamente ao usuário autenticado com e-mail alandiogor@gmail.com.';
