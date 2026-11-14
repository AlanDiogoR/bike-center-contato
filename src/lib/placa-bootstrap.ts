/**
 * Script inline e bloqueante, no início do body, para a página estática.
 * É a única leitura de UTM no caminho crítico (não há componente cliente
 * extra no layout): define `data-utm-source` antes da primeira pintura, então
 * o CSS troca o CTA sem mismatch de hidratação e sem layout shift.
 *
 * Segurança: o texto do script é uma constante — nada da query string é
 * interpolado no HTML nem no script. A query é lida em runtime via
 * `URLSearchParams` e só valores da allowlist `UTM_SOURCE_ALLOWLIST` chegam
 * ao DOM; qualquer outro valor remove o atributo.
 *
 * Desempenho: o texto vai duas vezes no documento (HTML + payload RSC), por
 * isso é mantido já minificado. Cada byte conta para o HTML caber na janela
 * inicial de congestionamento do TCP (~14 KB comprimido), que é o que pesa
 * no LCP do Lighthouse mobile.
 *
 * Passos (equivalentes a `normalizeQueryKey` / `isPlacaUtmSource`; o teste
 * de paridade trava os dois):
 *  1. percorre a query com `URLSearchParams`, na ordem;
 *  2. normaliza a chave: `+` → espaço, `decodeURIComponent` (se falhar, usa
 *     a chave crua), remove `%20` e todo espaço em branco, minúsculas
 *     (mesmo resultado de `%20` → espaço, trim, minúsculas, sem espaços);
 *  3. a primeira chave `utm_source` decide: valor com trim + minúsculas;
 *  4. só aplica o valor se estiver na allowlist (`['placa']`); senão remove
 *     o atributo.
 * Aspas simples e uma única barra invertida de propósito: no payload RSC
 * aspas duplas e barras invertidas são escapadas de novo e custam bytes.
 */
export const UTM_SOURCE_ALLOWLIST = ["placa"] as const;

export const PLACA_BOOTSTRAP_SCRIPT = `{let r=document.documentElement,a='data-utm-source',s;try{new URLSearchParams(location.search).forEach((v,k)=>{if(s==null){k=k.replaceAll('+',' ');try{k=decodeURIComponent(k)}catch{}if(k.replace(/%20|\\s/gi,'').toLowerCase()=='utm_source')s=v.trim().toLowerCase()}})}catch{}['placa'].includes(s)?r.setAttribute(a,s):r.removeAttribute(a)}`;
