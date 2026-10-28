// Página da equipe e páginas de perfil (com "Obras publicadas" quando houver).
import { esc, sanitizeRich } from '../html.mjs';
import { page } from '../layout.mjs';
import { equipe, cabecalhoPagina } from './partes.mjs';

export function lista({ site, profissionais, noindex }) {
  const body = `${cabecalhoPagina({ eyebrow: 'Profissionais', titulo: 'Nossa equipe' })}
<section class="team"><div class="wrap">${equipe(profissionais)}</div></section>`;
  return {
    path: '/profissionais',
    html: page({
      site, title: 'Profissionais', path: '/profissionais', body, noindex, active: '/profissionais',
      description: 'Sócios fundadores, sócios, parceiros e correspondentes do escritório Franceschini e Miranda Advogados, com currículos e publicações.',
    }),
  };
}

function obras(lista) {
  if (!lista.length) return '';
  const capas = lista.map((o) => `<li class="obra" tabindex="0"><span class="fundo" aria-hidden="true"></span><span class="mk">F&amp;M · ${esc(o.ano || 'Obra')}</span><span class="t">${esc(o.titulo)}</span><span class="ed">${esc(o.detalhe || '')}</span></li>`).join('');
  return `<div class="obras"><div class="eyebrow">Bibliografia</div><h2>Obras publicadas</h2><ul class="capas">${capas}</ul></div>`;
}

function perfil(site, p, noindex) {
  const path = `/profissionais/${p.slug}`;
  const links = [
    p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : '',
    ...p.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.rotulo)}</a>`),
  ].join('');
  const body = `<div class="section-pad"><div class="wrap">
  <a class="voltar" href="/profissionais">← Todos os profissionais</a>
  <div class="perfil">
    <aside><span class="frame"><img src="${esc(p.foto)}" alt="${esc(p.nome)}" width="320" height="400"></span><div class="dados">${links}</div></aside>
    <article>
      <div class="eyebrow">Profissionais</div>
      <h1>${esc(p.nome)}</h1>
      <p class="cargo">${esc(p.titulo)}</p>
      <div class="prose">${sanitizeRich(p.curriculo)}</div>
    </article>
  </div>
  ${obras(p.obras)}
</div></div>`;
  const pessoa = {
    '@type': 'Person', name: p.nome, jobTitle: p.titulo, image: site.dominio + p.foto,
    url: site.dominio + path, worksFor: { '@type': 'LegalService', name: site.nome, url: site.dominio },
  };
  if (p.email) pessoa.email = p.email;
  return {
    path,
    html: page({
      site, title: p.nome, path, body, noindex, active: '/profissionais', image: p.foto, type: 'profile',
      description: p.resumo, ld: [pessoa],
    }),
  };
}

export function perfis({ site, profissionais, noindex }) {
  return profissionais.map((p) => perfil(site, p, noindex));
}
