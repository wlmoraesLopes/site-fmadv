import { esc } from '../html.mjs';
import { page } from '../layout.mjs';
import { legalServiceLd } from '../seo.mjs';
import { sortPublicacoes } from '../../lib/content.mjs';
import { equipe, cartaoPublicacao } from './partes.mjs';

export function render({ site, areas, profissionais, publicacoes, noindex }) {
  const pos = site.posicionamento;
  const indice = areas.areas.map((a) =>
    `<li><a href="/areas-de-atuacao#${a.slug}"><span>${esc(a.nome)}</span><i aria-hidden="true">→</i></a></li>`).join('');
  const fatos = site.fatos.map((f) => `<div><b>${esc(f.titulo)}</b><span>${esc(f.texto)}</span></div>`).join('');
  const recentes = sortPublicacoes(publicacoes).slice(0, 3).map(cartaoPublicacao).join('');

  const body = `
<div class="hero">
  <div class="wrap">
    <div>
      <div class="eyebrow">${esc(pos.selo)}</div>
      <h1>${esc(pos.titulo)}</h1>
      <p>${esc(pos.texto)}</p>
      <div class="btns"><a class="btn p" href="/escritorio">Conheça o escritório</a><a class="btn s" href="/contato">Fale com o escritório</a></div>
    </div>
    <nav class="index" aria-label="Áreas de atuação">
      <span class="eyebrow">Áreas de atuação</span>
      <ol>${indice}</ol>
      <small><span>Consultivo e contencioso, em todas as áreas.</span><a class="more" href="/areas-de-atuacao">Ver as áreas →</a></small>
    </nav>
  </div>
</div>
<div class="facts"><div class="wrap">${fatos}</div></div>
<section class="about">
  <div class="wrap">
    <div class="eyebrow">O escritório</div>
    <blockquote>“${site.citacao}”</blockquote>
    <a class="more" href="/escritorio">Conheça o escritório →</a>
  </div>
</section>
<section class="team">
  <div class="wrap">
    <div class="head"><div><div class="eyebrow">Profissionais</div><h2>Nossa equipe</h2></div><a class="more" href="/profissionais">Ver todos os perfis →</a></div>
    ${equipe(profissionais)}
  </div>
</section>
<section class="pubs">
  <div class="wrap">
    <div class="head"><div><div class="eyebrow">Publicações</div><h2>Artigos, livros e eventos</h2></div><a class="more" href="/publicacoes">Ver todas as publicações →</a></div>
    <div class="pubs-grid tres">${recentes}</div>
  </div>
</section>`;

  return {
    path: '/',
    html: page({
      site, title: null, path: '/', body, noindex, active: '/',
      description: 'Advocacia empresarial em São Paulo desde 1992: Concorrência, Societário, Civil, Trabalhista, Penal Empresarial e Administrativo.',
      ld: [legalServiceLd(site)],
    }),
  };
}
