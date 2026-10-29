import { test } from 'node:test';
import assert from 'node:assert/strict';
import { site, content, textoPuro, descricao } from './helpers.mjs';
import { sortPublicacoes } from '../lib/content.mjs';

const SLUGS = ['concorrencia', 'societario', 'civil', 'trabalhista', 'penal', 'administrativo'];

test('Home: índice de áreas, equipe em hierarquia e publicações recentes', async () => {
  const { ler } = await site();
  const html = ler('index.html');
  const links = [...html.matchAll(/href="\/areas-de-atuacao#([a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(links, SLUGS);
  assert.match(html, /href="\/areas-de-atuacao"[^>]*>Ver as áreas/);
  const g = ['Sócios Fundadores', 'Sócios', 'Parceiros / Correspondentes'].map((t) => html.indexOf(`<span>${t}</span>`));
  assert.ok(g[0] > 0 && g[0] < g[1] && g[1] < g[2], 'ordem dos grupos');
  const recentes = sortPublicacoes(content.publicacoes).slice(0, 3);
  const pos = recentes.map((p) => html.indexOf(`/publicacoes/${p.slug}"`));
  assert.ok(pos.every((p) => p > 0) && pos[0] < pos[1] && pos[1] < pos[2], 'três mais recentes em ordem');
  assert.ok(!html.includes('imagens-fmadv'));
  assert.ok(!/Índia/.test(html));
});

test('Home: JSON-LD LegalService', async () => {
  const html = (await site()).ler('index.html');
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
  assert.equal(ld['@type'], 'LegalService');
  assert.equal(ld.address.postalCode, '04709-110');
  assert.equal(ld.telephone, '+551130952566');
  assert.ok(ld.sameAs.some((u) => u.includes('instagram')) && ld.sameAs.some((u) => u.includes('linkedin')));
});

test('Áreas de atuação: índice das 6 áreas + 6 seções abertas, sem nomes de profissionais', async () => {
  const html = (await site()).ler('areas-de-atuacao.html');
  assert.deepEqual([...html.matchAll(/<section class="area" id="([a-z]+)"/g)].map((m) => m[1]), SLUGS);
  const indice = html.split('class="index areas-nav"')[1].split('</nav>')[0];
  assert.deepEqual([...indice.matchAll(/href="#([a-z]+)"/g)].map((m) => m[1]), SLUGS);
  assert.ok(!html.includes('<details'));
  const texto = textoPuro(html);
  for (const p of content.profissionais) assert.ok(!texto.includes(p.nome), p.nome);
  assert.match(texto, /parcerias/);
});

test('Escritório: correspondentes nos EUA e Europa, sem Índia', async () => {
  const html = (await site()).ler('escritorio.html');
  assert.match(html, /\(EUA e Europa\)/);
  assert.ok(!/Índia/.test(html));
  assert.match(html, /href="\/areas-de-atuacao"/);
});

test('Contato: formulário para o Google Forms e mapa', async () => {
  const html = (await site()).ler('contato.html');
  assert.match(html, new RegExp(`data-google-form="${content.site.googleForm.url.replace(/[.?]/g, '\\$&')}"`));
  for (const [campo, entry] of Object.entries(content.site.googleForm.campos)) {
    assert.match(html, new RegExp(`name="${campo}"[^>]*data-entry="${entry.replace('.', '\\.')}"`), campo);
  }
  assert.ok(!/name="assunto"/.test(html), 'sem campo Assunto (o Google Form tem lista fechada)');
  assert.match(html, /<iframe[^>]*loading="lazy"/);
  assert.match(html, /tel:\+551130952566/);
});

test('Política de Privacidade', async () => {
  const texto = textoPuro((await site()).ler('politica-de-privacidade.html'));
  for (const t of ['LGPD', 'cookies', 'Google Ads', content.site.email]) assert.ok(texto.includes(t), t);
});

test('404 existe', async () => {
  assert.ok((await site()).existe('404.html'));
});

test('descrições entre 50 e 160 caracteres e sem autopromoção', async () => {
  const { ler } = await site();
  for (const f of ['index.html', 'escritorio.html', 'areas-de-atuacao.html', 'contato.html', 'politica-de-privacidade.html']) {
    const d = descricao(ler(f));
    assert.ok(d && d.length >= 50 && d.length <= 160, `${f}: ${d?.length}`);
    assert.ok(!/especialista|vasta experiência/i.test(d), f);
  }
});
