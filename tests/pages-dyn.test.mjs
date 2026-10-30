import { test } from 'node:test';
import assert from 'node:assert/strict';
import { site, content, textoPuro, descricao } from './helpers.mjs';
import { sortPublicacoes, validateProfissionais } from '../lib/content.mjs';
import { perfis } from '../lib/pages/profissionais.mjs';

const D = 'https://www.fm-advogados.com.br';
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

test('Profissionais: 3 grupos, Cristhiane em Parceiros, sem Flávia nem "Advogados"', async () => {
  const html = (await site()).ler('profissionais.html');
  const pos = ['Sócios Fundadores', 'Sócios', 'Parceiros / Correspondentes'].map((t) => html.indexOf(`<span>${t}</span>`));
  assert.ok(pos[0] > 0 && pos[0] < pos[1] && pos[1] < pos[2]);
  assert.ok(html.indexOf('/profissionais/cristhiane"') > pos[2]);
  assert.ok(!/Fl[áa]via/.test(html));
  assert.ok(!html.includes('<span>Advogados</span>'));
});

test('Perfil com obras: 10 capas na ordem, Person no JSON-LD, sem chip de área', async () => {
  const html = (await site()).ler('profissionais/franceschini.html');
  const f = content.profissionais.find((p) => p.slug === 'franceschini');
  const obras = [...html.matchAll(/<li class="obra"[^>]*>[\s\S]*?<span class="t">([^<]+)<\/span>/g)].map((m) => m[1]);
  assert.equal(obras.length, 10);
  assert.equal(obras[8], 'Competition Law in Brazil');
  assert.match(html, /Wolters Kluwer · 4ª ed\./);
  assert.match(html, /tabindex="0"/);
  const pessoa = ld(html).find((x) => x['@type'] === 'Person');
  assert.equal(pessoa.name, f.nome);
  assert.equal(pessoa.jobTitle, f.titulo);
  assert.equal(pessoa.worksFor.name, content.site.nome);
  assert.ok(!html.includes('area-label'));
  assert.ok(!html.includes('Direito Internacional, da Concorrência e Administrativo'));
});

test('Perfil sem obras não mostra a seção', async () => {
  const html = (await site()).ler('profissionais/thays.html');
  assert.ok(!html.includes('class="obras"'));
  assert.match(html, /<h1[^>]*>Thays Regina Martins Fontes Moreira<\/h1>/);
});

test('Publicações: 19 itens em ordem, filtros só dos tipos presentes, sem "Informes"', async () => {
  const html = (await site()).ler('publicacoes.html');
  const slugs = [...html.matchAll(/class="pubc" href="\/publicacoes\/([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(slugs, sortPublicacoes(content.publicacoes).map((p) => p.slug));
  const tipos = [...new Set(content.publicacoes.map((p) => p.tipo))];
  const chips = [...html.matchAll(/data-filtro-tipo="([a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(chips.sort(), tipos.sort());
  assert.match(html, /data-filtro-tipo=""/, 'chip "Todos"');
  assert.match(html, /<select[^>]*data-filtro-autor/);
  assert.ok(!/Informes/.test(textoPuro(html)));
});

test('Página da publicação: título, data, autor, Article e YouTube como miniatura', async () => {
  const { ler } = await site();
  const p = content.publicacoes.find((x) => x.legado?.id === '5');
  const html = ler(`publicacoes/${p.slug}.html`);
  assert.match(html, /<h1>BANCO DE JURISPRUDÊNCIA/);
  assert.match(html, /<time datetime="2022-04-28">28 de abril de 2022<\/time>/);
  const art = ld(html).find((x) => x['@type'] === 'Article');
  assert.equal(art.datePublished, '2022-04-28');
  assert.equal(art.author.name, p.autor);
  assert.match(html, /<a class="video" href="https:\/\/youtu\.be\/jg6-gU4eLuI"[^>]*><img src="https:\/\/img\.youtube\.com\/vi\/jg6-gU4eLuI\/mqdefault\.jpg"/);
  assert.ok(!/<script>(?!window)/.test(html.split('<main')[1].split('</main>')[0]), 'sem scripts no conteúdo');
  const d = descricao(html);
  assert.ok(d.length >= 50 && d.length <= 160, String(d.length));
});

test('sitemap.xml com todas as páginas públicas', async () => {
  const xml = (await site()).ler('sitemap.xml');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const p of ['/', '/escritorio', '/areas-de-atuacao', '/profissionais', '/publicacoes', '/contato', '/politica-de-privacidade']) {
    assert.ok(locs.includes(D + (p === '/' ? '/' : p)), p);
  }
  for (const pr of content.profissionais) assert.ok(locs.includes(`${D}/profissionais/${pr.slug}`), pr.slug);
  for (const pu of content.publicacoes) {
    assert.ok(xml.includes(`<loc>${D}/publicacoes/${pu.slug}</loc><lastmod>${pu.data}</lastmod>`), pu.slug);
  }
  assert.equal(locs.length, 7 + content.profissionais.length + content.publicacoes.length);
});

test('robots.txt: teste bloqueia tudo, produção libera e aponta o sitemap', async () => {
  assert.match((await site('teste')).ler('robots.txt'), /Disallow: \/\s*$/m);
  const prod = (await site('producao')).ler('robots.txt');
  assert.match(prod, /Allow: \//);
  assert.match(prod, /Disallow: \/admin/);
  assert.match(prod, /Disallow: \/api/);
  assert.match(prod, new RegExp(`Sitemap: ${D}/sitemap.xml`));
  assert.ok(!(await site('producao')).ler('index.html').includes('name="robots"'));
});

test('toda página gerada tem título, descrição de 50–160 caracteres, canonical e um único h1', async () => {
  const { ler, paginas } = await site();
  for (const p of paginas) {
    const html = ler(p === '/' ? 'index.html' : `${p.slice(1)}.html`);
    const d = descricao(html);
    assert.ok(d && d.length >= 50 && d.length <= 160, `${p}: descrição com ${d?.length}`);
    assert.match(html, /<title>[^<]+<\/title>/, p);
    assert.match(html, new RegExp(`<link rel="canonical" href="${D}${p === '/' ? '/' : p}">`), p);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, p);
  }
});

test('Trilha "Início › Seção › Página" nas páginas internas, com BreadcrumbList', async () => {
  const { ler } = await site();
  const f = content.profissionais.find((p) => p.slug === 'franceschini');
  const html = ler('profissionais/franceschini.html');
  const trilha = html.match(/<nav class="trilha"[^>]*>([\s\S]*?)<\/nav>/)[1];
  assert.match(trilha, /<a class="inicio" href="\/"><svg[\s\S]*?<span>Início<\/span><\/a>.*<a href="\/profissionais"><span>Profissionais<\/span><\/a>.*<li aria-current="page">/);
  const bc = ld(html).find((x) => x['@type'] === 'BreadcrumbList');
  assert.deepEqual(bc.itemListElement.map((i) => i.name), ['Início', 'Profissionais', f.nome]);
  assert.equal(bc.itemListElement[2].item, `${D}/profissionais/franceschini`);
  for (const p of ['escritorio', 'areas-de-atuacao', 'profissionais', 'publicacoes', 'contato']) {
    assert.match(ler(`${p}.html`), /<nav class="trilha"/, p);
  }
  assert.ok(!ler('index.html').includes('class="trilha"'), 'Home sem trilha');
  assert.ok(!html.includes('class="voltar"'));
});

test('Obra com link: capa inteira leva à editora em nova aba; link inválido é recusado', () => {
  const base = content.profissionais.find((p) => p.slug === 'franceschini');
  const p = { ...base, obras: [{ titulo: 'Com link', detalhe: '', ano: '2025', url: 'https://editora.example/livro' }, { titulo: 'Sem link', detalhe: '', ano: '' }] };
  const html = perfis({ site: content.site, profissionais: [p], noindex: true })[0].html;
  assert.match(html, /<li class="obra"><a class="cobre" href="https:\/\/editora\.example\/livro" target="_blank" rel="noopener noreferrer">[\s\S]*?Com link/);
  assert.match(html, /<li class="obra" tabindex="0">[\s\S]*?Sem link/);
  assert.throws(() => validateProfissionais([{ ...p, obras: [{ titulo: 'X', url: 'javascript:alert(1)' }] }]), /obras\.url/);
});

test('Redes sociais: nome visível no rodapé de todas as páginas e chamada em Publicações', async () => {
  const s = await site();
  const li = 'https://www.linkedin.com/company/franceschini-miranda-advogados/';
  const ig = 'https://www.instagram.com/franceschinimiranda/';
  for (const pag of ['index.html', 'escritorio.html', 'contato.html', 'profissionais/franceschini.html']) {
    const rod = s.ler(pag).split('<footer')[1];
    assert.match(rod, /<h2 class="fh">Acompanhe<\/h2>/, pag);
    assert.ok(rod.includes(`href="${li}"`) && rod.includes('<span>LinkedIn</span>'), pag);
    assert.ok(rod.includes(`href="${ig}"`) && rod.includes('<span>Instagram</span>'), pag);
  }
  const pub = s.ler('publicacoes.html').split('<footer')[0];
  assert.match(pub, /<aside class="siga"[\s\S]*?LinkedIn[\s\S]*?Instagram[\s\S]*?<\/aside>/);
  assert.ok(pub.includes(`href="${li}"`));
});
