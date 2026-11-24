-- Revoga EXECUTE de public.vip_lead_signup para PUBLIC, anon e authenticated.
-- O cadastro VIP permanece só pela rota server-side (Netlify Function /api/vip)
-- autenticada com service_role, para não burlar Turnstile, rate limit e honeypot.
-- REVOKE/GRANT pela assinatura explícita: no Supabase, ALTER DEFAULT PRIVILEGES
-- em public concede privilégios a anon em funções novas do schema public.

revoke all on function public.vip_lead_signup(text, text, text, text, text, text)
  from public, anon, authenticated;

grant execute on function public.vip_lead_signup(text, text, text, text, text, text)
  to service_role;
