# Bike Center Fartura — Links

Página estilo Linktree em **Next.js 14** (App Router), **Tailwind CSS** e **Framer Motion**, focada em conversão para **WhatsApp**, tráfego para a loja no **Mercado Livre** e **localização no Google Maps**.

## Stack

- Next.js 14, React 18, TypeScript
- Tailwind CSS
- Framer Motion
- **react-icons** (WhatsApp, Mercado Pago, Google Maps, redes sociais, link externo)
- Vitest + Testing Library
- Deploy sugerido: **Netlify** (`netlify.toml` + `@netlify/plugin-nextjs`)

## Ícones

Todos os ícones vêm de **react-icons**: `FaWhatsapp`, `FaUsers`, `FaExternalLinkAlt`, `SiGooglemaps`, `SiInstagram`, `SiTiktok`, `SiFacebook`, `SiMercadopago`.

A logo usa **`public/logo.png`** (fundo transparente) com **`next/image`**, dentro de um **badge circular** só com borda na cor da marca (**`#ec6e37`**), sem fundo branco.

O conjunto **Simple Icons** não inclui o logotipo oficial do Mercado Livre; o botão da loja usa **`SiMercadopago`** (mesmo ecossistema Mercado) com cor **#3483FA** sobre o fundo amarelo do card, alinhado à identidade visual do marketplace.

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

No Netlify: **Site settings → Environment variables**.

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

## Estrutura principal

- `src/app/page.tsx` — landing
- `src/app/layout.tsx` — metadata, SEO, JSON-LD
- `src/components/LinksSection.tsx` — botões e animações
- `src/components/Analytics.tsx` — GTM e Meta Pixel (quando configurados)
- `src/lib/links.ts` — URLs (WhatsApp Claro/Vivo, [grupo de novidades](https://chat.whatsapp.com/CMpFIfBfx5UDumCB77Acdp), Mercado Livre, [Google Maps](https://www.google.com/maps/dir/?api=1&destination=-23.3883268%2C-49.5062797) com destino nas coordenadas do pin oficial, redes), NAP da loja física (Rua Mário Stella, 355 · Fartura/SP · Seg–Sex 8h–18h · Sáb 8h–13h), slot opcional de oferta e mensagem padrão do WhatsApp (consultora Rita)
- `public/logo.png` — logo da loja (PNG com transparência)

## Licença

Projeto privado da Bike Center Fartura.
