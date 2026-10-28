// Lista de publicações (com filtros por tipo e autor) e página de cada publicação.
import { esc, sanitizeRich } from '../html.mjs';
import { formatDate } from '../text.mjs';
import { page } from '../layout.mjs';
import { sortPublicacoes, TIPOS, ROTULO_TIPO } from '../content.mjs';
import { cartaoPublicacao, cabecalhoPagina } from './partes.mjs';

export function lista({ site, publicacoes, noindex }) {
  const ordenadas = sortPublicacoes(publicacoes);
  const presentes = TIPOS.filter((t) => ordenadas.some((p) => p.tipo === t));
  const autores = [...new Set(ordenadas.map((p) => p.autor))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const chips = [['', 'Todas'], ...presentes.map((t) => [t, ROTULO_TIPO[t]])]
    .map(([t, r]) => `<button type="button" data-filtro-tipo="${t}" aria-pressed="${t === ''}">${r}</button>`).join('');
  const body = `${cabecalhoPagina({ eyebrow: 'Publicações', titulo: 'Artigos, livros e eventos', lead: 'Artigos, obras, entrevistas, podcasts e eventos com participação dos profissionais do escritório.' })}
<section class="pubs"><div class="wrap">
  <div class="filtros">
    <div class="chips" role="group" aria-label="Filtrar por tipo">${chips}</div>
    <label><span class="eyebrow">Autor </span><select data-filtro-autor><option value="">Todos os autores</option>${autores.map((a) => `<option>${esc(a)}</option>`).join('')}</select></label>
  </div>
  <div class="pubs-grid" data-pubs>${ordenadas.map(cartaoPublicacao).join('')}</div>
  <p class="vazio" data-vazio hidden>Nenhuma publicação com esses filtros.</p>
</div></section>`;
  return {
    path: '/publicacoes',
    html: page({
      site, title: 'Publicações', path: '/publicacoes', body, noindex, active: '/publicacoes',
      description: 'Artigos, livros, entrevistas, podcasts e eventos dos profissionais do escritório sobre Direito da Concorrência e direito empresarial.',
    }),
  };
}

function descricao(p) {
  const base = p.resumo || p.titulo;
  const d = base.length > 160 ? `${base.slice(0, 157).replace(/\s+\S*$/, '')}…` : base;
  return d.length >= 50 ? d : `${d} — ${ROTULO_TIPO[p.tipo]} de ${p.autor}.`.slice(0, 160);
}

function item(site, p, noindex) {
  const path = `/publicacoes/${p.slug}`;
  const body = `<div class="page-head"><div class="wrap narrow">
  <a class="voltar" href="/publicacoes">← Todas as publicações</a>
  <h1>${esc(p.titulo)}</h1>
  <div class="pub-meta"><span class="tp">${ROTULO_TIPO[p.tipo]}</span><span>${esc(p.autor)}</span><time datetime="${p.data}">${formatDate(p.data)}</time></div>
</div></div>
<div class="section-pad"><article class="wrap narrow prose">${sanitizeRich(p.conteudo)}</article></div>`;
  const artigo = {
    '@type': 'Article', headline: p.titulo.slice(0, 110), datePublished: p.data,
    author: { '@type': 'Person', name: p.autor },
    publisher: { '@type': 'Organization', name: site.nome, logo: { '@type': 'ImageObject', url: `${site.dominio}/assets/img/logofm2.png` } },
    mainEntityOfPage: site.dominio + path,
  };
  if (p.capa) artigo.image = site.dominio + p.capa;
  return {
    path,
    lastmod: p.data,
    html: page({
      site, title: p.titulo, path, body, noindex, active: '/publicacoes', type: 'article',
      image: p.capa || undefined, description: descricao(p), ld: [artigo],
    }),
  };
}

export function itens({ site, publicacoes, noindex }) {
  return publicacoes.map((p) => item(site, p, noindex));
}
