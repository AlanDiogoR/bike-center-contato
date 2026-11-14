# Bike Center Fartura — Links

Página estilo Linktree em **Next.js 14** (App Router), **Tailwind CSS** e **Framer Motion**, focada em conversão para **WhatsApp**, tráfego para a loja no **Mercado Livre**, **localização no Google Maps** e **avaliações no Google**.

## Stack

- Next.js 14, React 18, TypeScript
- Tailwind CSS
- Framer Motion
- **react-icons** (WhatsApp, Mercado Pago, Google Maps, redes sociais, link externo)
- Vitest + Testing Library
- Deploy sugerido: **Netlify** (`netlify.toml` + `@netlify/plugin-nextjs`)

## Ícones

Todos os ícones vêm de **react-icons**: `FaWhatsapp`, `FaExternalLinkAlt`, `SiGooglemaps`, `SiInstagram`, `SiTiktok`, `SiFacebook`, `SiMercadopago`.

A logo usa **`public/logo.png`** (fundo transparente) com **`next/image`**, dentro de um **badge circular** branco com anel **`#9a3412`**.

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

## Variante da placa (NFC)

Quem abre a página com `utm_source=placa` (também vale chave suja como `UTM_Source`, `utm _source` ou `utm%20_source`) vê um botão grande **Avaliar no Google** no topo dos links e não vê o carrossel “Como nos avaliar”. O endereço é o mesmo `googleReviewLink.href` de todo mundo: sem pré-filtro de estrelas, sem pergunta antes do link e sem texto de brinde, oferta, VIP ou prêmio. A animação de pulso e o `prefers-reduced-motion` continuam iguais.

Sem esse parâmetro, a página permanece a de hoje. A troca é feita no HTML estático: um script no início do body marca `<html data-utm-source="placa">` antes da pintura e o CSS mostra só um dos dois blocos, para não deslocar o layout nem divergir na hidratação.

## Estrutura principal

- `src/app/page.tsx` — landing
- `src/app/layout.tsx` — metadata, SEO, JSON-LD
- `src/components/LinksSection.tsx` — botões e animações (inclui **Nos avalie no Google** e o CTA da placa)
- `src/components/ReviewCarousel.tsx` — carrossel estático do passo a passo (site → Maps → escrever → publicar)
- `src/lib/query.ts` — normalização das chaves de UTM (`trim`, minúsculas, sem espaços ou `%20`)
- `src/components/Analytics.tsx` — GTM e Meta Pixel (quando configurados)
- `src/lib/links.ts` — URLs (WhatsApp Claro/Vivo, Mercado Livre, [Google Maps](https://www.google.com/maps/dir/?api=1&destination=-23.3883268%2C-49.5062797) com destino nas coordenadas do pin oficial, [avaliações no Google](https://www.google.com/maps/place/Bike+Center+Fartura/@-23.3883268,-49.5062797,17z/data=!4m8!3m7!1s0x94c1a51538905ff9:0x7771bcda03c58d75!8m2!3d-23.3883268!4d-49.5062797!9m1!1b1!16s%2Fg%2F11c5bhrp_y), redes), NAP da loja física (Rua Mário Stella, 355 · Fartura/SP · Seg–Sex 8h–18h · Sáb 8h–13h), slot opcional de oferta e mensagem padrão do WhatsApp (consultora Rita)
- `public/logo.png` — logo da loja (PNG com transparência)

## Licença

Projeto privado da Bike Center Fartura.
