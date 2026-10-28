// Verifica os dados migrados do site antigo (content/*.json e uploads/).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const ler = (p) => JSON.parse(readFileSync(new URL(`../content/${p}`, import.meta.url), 'utf8'));
const existe = (url) => existsSync(new URL(`..${url}`, import.meta.url));
const { profissionais } = ler('profissionais.json');
const { publicacoes } = ler('publicacoes.json');
const TIPOS = ['artigo', 'livro', 'podcast', 'entrevista', 'evento', 'reconhecimento'];

test('profissionais migrados sem a Flávia', () => {
  assert.deepEqual(profissionais.map((p) => p.slug).sort(),
    ['cmiranda', 'cristhiane', 'fernando', 'franceschini', 'sandra', 'thays']);
  assert.ok(profissionais.every((p) => !/fl[áa]via/i.test(p.nome)));
});

test('categorias seguem a hierarquia combinada', () => {
  const cat = Object.fromEntries(profissionais.map((p) => [p.slug, p.categoria]));
  assert.equal(cat.franceschini, 'fundador');
  assert.equal(cat.cmiranda, 'fundador');
  for (const s of ['thays', 'fernando', 'sandra']) assert.equal(cat[s], 'socio');
  assert.equal(cat.cristhiane, 'parceiro');
});

test('obras do Dr. Franceschini', () => {
  const f = profissionais.find((p) => p.slug === 'franceschini');
  assert.equal(f.obras.length, 10);
  assert.equal(f.obras[8].titulo, 'Competition Law in Brazil');
  assert.equal(f.obras[8].ano, '2025');
  assert.equal(f.obras[7].titulo, 'Direito Concorrencial');
});

test('fotos e currículos presentes', () => {
  for (const p of profissionais) {
    assert.ok(existe(p.foto), `foto ausente: ${p.foto}`);
    assert.ok(p.curriculo.trim().length > 50, `currículo vazio: ${p.slug}`);
    assert.ok(!/<script/i.test(p.curriculo));
    assert.ok(p.resumo.length > 0 && p.resumo.length <= 160, `resumo: ${p.slug}`);
  }
});

test('publicações: 17 artigos + 2 informes, datas ISO', () => {
  assert.equal(publicacoes.length, 19);
  for (const p of publicacoes) {
    assert.match(p.data, /^\d{4}-\d{2}-\d{2}$/, p.titulo);
    assert.ok(TIPOS.includes(p.tipo), `${p.titulo}: ${p.tipo}`);
  }
  const informes = publicacoes.filter((p) => p.legado?.noticia);
  assert.deepEqual(informes.map((p) => p.legado.noticia).sort(), [2, 3]);
  assert.ok(informes.every((p) => p.data === '2025-11-26'));
  assert.match(informes.find((p) => p.legado.noticia === 3).autor, /Flávia Maria Pelliciari/);
});

test('slugs de publicações únicos', () => {
  const slugs = publicacoes.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('imagens reescritas para /uploads/publicacoes e existentes', () => {
  for (const p of publicacoes) {
    assert.ok(!p.conteudo.includes('/static/uploads/'), p.titulo);
    for (const [, src] of p.conteudo.matchAll(/src="(\/uploads\/[^"]+)"/g)) assert.ok(existe(src), src);
  }
});

test('nenhuma menção a correspondentes na Índia', () => {
  // "Goa, Índia Portuguesa" (biografia do Dr. Custódio) é fato histórico e permanece.
  const tudo = JSON.stringify({ profissionais, publicacoes });
  assert.ok(!/Europa e Índia/.test(tudo));
  assert.match(profissionais.find((p) => p.slug === 'cmiranda').curriculo, /Goa, Índia Portuguesa/);
});
