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

A logo usa **`mix-blend-multiply`** no `next/image` (sem cartão branco): o branco do arquivo funde com o fundo da página, deixando só a arte visível.

O conjunto **Simple Icons** não inclui o logotipo oficial do Mercado Livre; o botão da loja usa **`SiMercadopago`** (mesmo ecossistema Mercado) com cor **#3483FA** sobre o fundo amarelo do card, alinhado à identidade visual do marketplace.

**Favicon:** `src/app/icon.svg` (marca “BC”) + redirecionamento de `/favicon.ico` → `/icon.svg` no `next.config.mjs` para navegadores que ainda pedem o `.ico`.

**Link da loja no ML:** a URL é montada com `URL` + `searchParams` (sem `#...` no final), o que evita links cortados em apps como WhatsApp e Instagram.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e ajuste:

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SITE_URL` | URL canônica (Open Graph, sitemap, compartilhamento) |
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
- `src/lib/links.ts` — URLs (WhatsApp vendas, [grupo de novidades](https://chat.whatsapp.com/CMpFIfBfx5UDumCB77Acdp), Mercado Livre, [Google Maps](https://maps.app.goo.gl/r3otm9rrYUj6jsMu7), redes) e mensagem padrão do WhatsApp (consultora Rita)
- `public/logo.jpeg` — logo da loja

## Licença

Projeto privado da Bike Center Fartura.
