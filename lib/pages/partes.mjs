// Peças reaproveitadas entre páginas: cartões de profissional e de publicação, grupos da equipe.
import { esc } from '../html.mjs';
import { formatDate } from '../text.mjs';
import { CATEGORIAS, ROTULO_CATEGORIA, ROTULO_TIPO, porCategoria } from '../content.mjs';

export function cartaoProfissional(p) {
  return `<a class="pro" href="/profissionais/${p.slug}"><span class="frame"><img src="${esc(p.foto)}" alt="${esc(p.nome)}" width="240" height="300" loading="lazy"></span><b>${esc(p.nome)}</b><span class="cargo">${esc(p.titulo)}</span></a>`;
}

export function equipe(profissionais) {
  const grupos = porCategoria(profissionais);
  return `<div class="tiers">${CATEGORIAS.filter((c) => grupos[c].length).map((c, i) =>
    `<div class="tier t${i}"><h3 class="tier-t"><span>${ROTULO_CATEGORIA[c]}</span></h3><div class="tier-row">${grupos[c].map(cartaoProfissional).join('')}</div></div>`).join('')}</div>`;
}

export function cartaoPublicacao(p) {
  return `<a class="pubc" href="/publicacoes/${p.slug}" data-tipo="${p.tipo}" data-autor="${esc(p.autor)}"><span class="tp">${ROTULO_TIPO[p.tipo]}</span><h3>${esc(p.titulo)}</h3><p>${esc(p.resumo)}</p><small><b>${esc(p.autor)}</b><time datetime="${p.data}">${formatDate(p.data)}</time></small></a>`;
}

export function cabecalhoPagina({ eyebrow, titulo, lead }) {
  return `<div class="page-head"><div class="wrap"><div class="eyebrow">${eyebrow}</div><h1>${titulo}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div></div>`;
}
