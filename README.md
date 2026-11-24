# Bike Center Fartura — Links

Página estilo Linktree em **Next.js 14** (App Router), **Tailwind CSS** e **Framer Motion**, focada em conversão para **WhatsApp**, tráfego para a loja no **Mercado Livre**, **localização no Google Maps** e **avaliações no Google**.

## Stack

- Next.js 14, React 18, TypeScript
- Tailwind CSS
- Framer Motion
- **react-icons** (Google Maps, redes sociais, link externo, avaliação, endereço, horário e Pix) e SVGs inline em `src/components/BrandSymbols.tsx` (`WhatsAppSymbol` e `MercadoLivreIcon`)
- Vitest + Testing Library
- Deploy sugerido: **Netlify** (`netlify.toml` + `@netlify/plugin-nextjs`)

## Ícones

Os ícones de interface e redes sociais vêm de **react-icons** (`FaExternalLinkAlt`, `FaStar`, `FaQrcode`, `FaMapMarkerAlt`, `FaClock`, `FaChevronLeft`, `FaChevronRight`, `SiGooglemaps`, `SiInstagram`, `SiTiktok`, `SiFacebook`), enquanto as marcas do WhatsApp e do Mercado Livre usam SVGs inline definidos em **`src/components/BrandSymbols.tsx`** (`WhatsAppSymbol`, com `<symbol id="icon-whatsapp">` reutilizado via `<use href="#icon-whatsapp" />`, e `MercadoLivreIcon`).

A logo usa **`public/logo.png`** (fundo transparente) com **`next/image`**, dentro de um **badge circular** branco com anel **`#9a3412`**.

O botão da loja no Mercado Livre e o mock do carrossel usam o componente **`MercadoLivreIcon`** (`src/components/BrandSymbols.tsx`), que renderiza o logotipo oficial do Mercado Livre em SVG inline (`viewBox="0 0 163 113"`, cores `#2d3277`, `#ffd100` e `#fff`).

**Favicon:** `src/app/icon.svg` (marca “BC”) + redirecionamento de `/favicon.ico` → `/icon.svg` no `next.config.mjs` para navegadores que ainda pedem o `.ico`.

**Link da loja no ML:** URL padrão completa (inclui o trecho `#origin=...` que o site do ML usa no roteamento). Se algo mudar, defina **`NEXT_PUBLIC_MERCADO_LIVRE_URL`** com o link copiado do painel do vendedor.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e ajuste:

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SITE_URL` | URL canônica (Open Graph, sitemap, compartilhamento) |
| `NEXT_PUBLIC_MERCADO_LIVRE_URL` | Link completo da loja no Mercado Livre (opcional; se vazio, usa o padrão em `links.ts`) |
| `NEXT_PUBLIC_HIGHLIGHT_LABEL` | Texto do slot de oferta no topo (opcional; vazio = oculto) |
| `NEXT_PUBLIC_HIGHLIGHT_HREF` | URL do slot de oferta (obrigatório junto com o label para exibir) |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager (opcional) |
| `NEXT_PUBLIC_FB_PIXEL_ID` | Meta Pixel (opcional) |
| `VIP_ENABLED` | Flag do formulário VIP (padrão **desligada**; só liga com `"true"` e exige novo deploy) |
| `TURNSTILE_SITE_KEY` | Site key pública do Cloudflare Turnstile (repassada ao client no build apenas se `VIP_ENABLED=true`) |
| `TURNSTILE_SECRET` | Secret key do Cloudflare Turnstile (somente servidor, na função `/api/vip`) |
| `SUPABASE_URL` | URL do projeto Supabase (somente servidor, na função `/api/vip`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave `service_role` do Supabase — **somente servidor** (Netlify Function `/api/vip`); **nunca** `NEXT_PUBLIC_`, nunca no client. Necessária porque a RPC `vip_lead_signup` só é executável pela `service_role` (PR #16) |
| `VIP_RATE_SALT` | Salt para hash SHA-256 do IP no rate limit da função `/api/vip` (somente servidor) |
| `VIP_ALLOWED_HOSTS` | Lista opcional separada por vírgula de hostnames exatos permitidos no `Origin` e no `siteverify` do Turnstile (quando definida, substitui o padrão `contatobikecenter.netlify.app` + hosts de `URL` e `DEPLOY_PRIME_URL`). No domínio próprio, o DevOps configura o domínio aqui |

No Netlify: **Site settings → Environment variables**.

## Formulário VIP

O bloco de captação **Quero ofertas VIP no WhatsApp** fica logo abaixo do botão **Avalie no Google** na home padrão (`data-placa="hide"`, não aparece em `?utm_source=placa`) e carrega o formulário sob demanda apenas no clique (`next/dynamic` com `ssr: false`), injetando o script do Cloudflare Turnstile somente no primeiro foco ou visibilidade do formulário.

- **Flag padrão desligada (`VIP_ENABLED`)**: por padrão a flag vem desligada. Ela só ativa com o valor exato `VIP_ENABLED=true` (e `TURNSTILE_SITE_KEY` preenchida). Com a flag desligada, nada do bloco VIP entra no HTML da home e a função `/api/vip` responde `503` imediatamente sem ler o corpo.
- **Ligar ou desligar exige redeploy**: como `next.config.mjs` injeta `NEXT_PUBLIC_VIP_ENABLED` e `NEXT_PUBLIC_TURNSTILE_SITE_KEY` em tempo de build para eliminar o código morto quando desligado, alterar `VIP_ENABLED` ou `TURNSTILE_SITE_KEY` exige um **novo deploy** no Netlify.
- **Variáveis de ambiente (Alan / DevOps)**: as chaves reais do Cloudflare Turnstile (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`), as variáveis do Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) e o salt do rate limit (`VIP_RATE_SALT`) ficam com o **Alan / DevOps** e são configuradas apenas nas variáveis de ambiente do Netlify (o client não fala diretamente com o Supabase).

## Banco VIP (Supabase)

A estrutura do banco para captação de leads VIP com consentimento LGPD fica versionada em `supabase/`:

- `supabase/config.toml` — configuração mínima com `enable_signup = false` e `enable_anonymous_sign_ins = false` em `[auth]`, além de `enable_signup = false` em `[auth.email]` (cadastro público e sessões anônimas desligados; apenas o administrador autenticado acessa os dados).
- `supabase/migrations/20261115000000_vip_leads.sql` — migration idempotente que cria `public.vip_leads` e a RPC `public.vip_lead_signup`:
  - Colunas: `id` (`uuid`, PK, `default gen_random_uuid()`), `nome` (1–80 caracteres), `whatsapp_e164` (`^\+55[1-9][0-9]{9,10}$`, índice único), `interesse` (`'moto' | 'bike' | 'ambos'`), `consent_at` (`timestamptz not null default now()`, forçado no servidor também via trigger `BEFORE INSERT` para impedir forjamento pelo cliente), `consent_text_version` (`text not null`, 1–64 caracteres), `utm_source` e `utm_campaign` (limitados a 120 caracteres), `opted_out_at` (`timestamptz null`, preenchido apenas pelo admin) e `created_at` (`timestamptz not null default now()`).
  - **RLS ativa e forçada** (`ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`).
  - **Cadastro via RPC (`public.vip_lead_signup`)**: o papel `anon` não possui nenhum privilégio na tabela `public.vip_leads` (nem `INSERT` direto). O cadastro público é feito exclusivamente pela RPC `public.vip_lead_signup(p_nome, p_whatsapp_e164, p_interesse, p_consent_text_version, p_utm_source, p_utm_campaign)` via `POST /rest/v1/rpc/vip_lead_signup` (`SECURITY DEFINER`, `SET search_path = public, pg_temp`, `REVOKE ALL FROM public` e `GRANT EXECUTE` apenas para `anon` e `authenticated`), que valida os campos com as mesmas regras dos `CHECK`s, executa `INSERT ... ON CONFLICT DO NOTHING` (com policy `vip_leads_definer_insert` restrita ao dono/definer da função para funcionar sob `FORCE ROW LEVEL SECURITY` mesmo sem `SUPERUSER`/`BYPASSRLS`) e retorna sempre `void` (mesma resposta para números novos ou duplicados, sem expor `id` e sem limpar `opted_out_at` em caso de recadastro).
  - **Proteção anti-abuso**: rate limit e captcha (Cloudflare Turnstile) ficam para o PR3.
  - **Policies de admin (`public.is_vip_admin()`)**: `SELECT`, `UPDATE` e `DELETE` restritos exclusivamente a `authenticated` com `USING`/`WITH CHECK` `((select public.is_vip_admin()))`, onde `public.is_vip_admin()` (`LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''`, executável apenas por `authenticated`) consulta diretamente `auth.users` verificando `id = auth.uid()`, `email = 'alandiogor@gmail.com'`, `email_confirmed_at is not null` e `not is_anonymous` (sem confiar em claims de e-mail/provider do JWT nem em `user_metadata`).

### Variáveis no Netlify

As variáveis abaixo ficam a cargo do **Alan / DevOps** no momento de aplicar em produção (**Site settings → Environment variables** — nada deve ser configurado no Netlify antes disso):

- `VIP_ENABLED` (`true` para ativar; exige redeploy)
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (Chave `service_role` do Supabase — **somente servidor** (Netlify Function `/api/vip`); **nunca** `NEXT_PUBLIC_`, nunca no client. Necessária porque a RPC `vip_lead_signup` só é executável pela `service_role` (PR #16))
- `VIP_RATE_SALT`
- `VIP_ALLOWED_HOSTS` (opcional; no domínio próprio, o DevOps põe o domínio aqui. A secret de **teste** da Cloudflare devolve `hostname: "example.com"`, então um teste manual com chaves de teste num preview exige incluir `example.com` **temporariamente** em `VIP_ALLOWED_HOSTS` — **nunca** em produção)

> **Segurança:** o client não conversa diretamente com o Supabase; a chamada à RPC `public.vip_lead_signup` ocorre exclusivamente no servidor via Netlify Function `/api/vip` usando `SUPABASE_SERVICE_ROLE_KEY` (necessária porque a RPC `vip_lead_signup` só é executável pela `service_role` — PR #16). Somente a `TURNSTILE_SITE_KEY` (pública) vai para o bundle do client quando `VIP_ENABLED=true`. **Nunca** prefixe segredos com `NEXT_PUBLIC_` nem exponha `TURNSTILE_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` ou `VIP_RATE_SALT` no client.

### Validação e aplicação da migration

Não há projeto Supabase de desenvolvimento separado (existe apenas um único projeto Supabase, de produção). Por isso, toda a validação de banco e RLS durante o desenvolvimento e no CI é feita **exclusivamente em PostgreSQL local** (sem tocar no projeto Supabase real).

> **Aviso importante (Produção):** a migration será aplicada em produção **somente após aprovação de QA, Segurança e OK explícito do Alan**, momento em que o DevOps executará o `supabase db push` e configurará as variáveis no Netlify:

```bash
supabase db push --db-url "postgresql://postgres:<SENHA_DB>@db.<PROJECT_REF>.supabase.co:5432/postgres"
```

### Teste local e no CI de RLS (PostgreSQL)

O teste `src/lib/vip-leads.pg.test.ts` localiza automaticamente qualquer versão disponível em `/usr/lib/postgresql/*/bin` (ou `PG_BIN`), sobe um cluster temporário com `initdb`, aplica `tests/sql/supabase-stub.sql` e `supabase/migrations/20261115000000_vip_leads.sql`, e valida RLS, privilégios e constraints localmente e no GitHub Actions (`.github/workflows/ci.yml`). O `describe.skipIf` é mantido apenas como fallback caso nenhum binário local do PostgreSQL exista.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

## CI

O workflow em `.github/workflows/ci.yml` executa lint, testes e build em cada push/PR para `main` ou `master`.

## Variante da placa (NFC)

Quem abre a página com `utm_source=placa` (também vale chave suja como `UTM_Source`, `utm _source` ou `utm%20_source`) vê um botão grande **Avaliar no Google** no topo dos links e não vê o carrossel “Como nos avaliar”. O endereço é o mesmo `googleReviewLink.href` de todo mundo: sem pré-filtro de estrelas, sem pergunta antes do link e sem texto de brinde, oferta, VIP ou prêmio. A animação de pulso e o `prefers-reduced-motion` continuam iguais.

Sem esse parâmetro, a página permanece a de hoje. A troca é feita no HTML estático: um script no início do body marca `<html data-utm-source="placa">` antes da pintura e o CSS mostra só um dos dois blocos, para não deslocar o layout nem divergir na hidratação. Esse script (`src/lib/placa-bootstrap.ts`) é a única leitura de UTM no caminho crítico: é texto fixo, lê a query em runtime com `URLSearchParams` e só escreve no DOM valores de uma allowlist (`placa`); nada da query é interpolado no HTML.

## Estrutura principal

- `src/app/page.tsx` — landing
- `src/app/layout.tsx` — metadata, SEO, JSON-LD
- `src/components/LinksSection.tsx` — botões e animações (inclui **Avalie no Google** e o CTA da placa)
- `src/components/BrandSymbols.tsx` — SVGs inline de marca (`WhatsAppSymbol` e `MercadoLivreIcon`)
- `src/components/ReviewCarousel.tsx` — carrossel estático do passo a passo (site → Maps → escrever → publicar)
- `src/lib/query.ts` — normalização das chaves de UTM (`trim`, minúsculas, sem espaços ou `%20`)
- `src/components/Analytics.tsx` — GTM e Meta Pixel (quando configurados)
- `src/lib/links.ts` — URLs (WhatsApp Claro/Vivo, Mercado Livre, [Google Maps](https://www.google.com/maps/dir/?api=1&destination=-23.3883268%2C-49.5062797) com destino nas coordenadas do pin oficial, [avaliações no Google](https://www.google.com/maps/place/Bike+Center+Fartura/@-23.3883268,-49.5062797,17z/data=!4m8!3m7!1s0x94c1a51538905ff9:0x7771bcda03c58d75!8m2!3d-23.3883268!4d-49.5062797!9m1!1b1!16s%2Fg%2F11c5bhrp_y), redes), NAP da loja física (Rua Mário Stella, 355 · Fartura/SP · Seg–Sex 8h–18h · Sáb 8h–13h), slot opcional de oferta e mensagem padrão do WhatsApp (consultora Rita)
- `public/logo.png` — logo da loja (PNG com transparência)

## Licença

Projeto privado da Bike Center Fartura.
