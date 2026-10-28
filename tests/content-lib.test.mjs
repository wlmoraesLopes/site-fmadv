import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent, sortPublicacoes, porCategoria, validateProfissionais, validatePublicacoes } from '../lib/content.mjs';

const content = loadContent(new URL('../content/', import.meta.url));

test('sortPublicacoes: data desc, desempate por título, estável', () => {
  const lista = [
    { titulo: 'Beta', data: '2025-11-26' },
    { titulo: 'Alfa', data: '2025-11-26' },
    { titulo: 'Novo', data: '2026-01-01' },
  ];
  const a = sortPublicacoes(lista).map((p) => p.titulo);
  assert.deepEqual(a, ['Novo', 'Alfa', 'Beta']);
  assert.deepEqual(sortPublicacoes([...lista].reverse()).map((p) => p.titulo), a);
  assert.equal(lista[0].titulo, 'Beta', 'não altera a lista original');
});

test('porCategoria respeita ordem e depois nome', () => {
  const g = porCategoria([
    { nome: 'B', categoria: 'socio', ordem: 2 },
    { nome: 'A', categoria: 'socio', ordem: 2 },
    { nome: 'C', categoria: 'socio', ordem: 1 },
    { nome: 'D', categoria: 'parceiro', ordem: 1 },
  ]);
  assert.deepEqual(g.socio.map((p) => p.nome), ['C', 'A', 'B']);
  assert.deepEqual(g.fundador, []);
  assert.deepEqual(g.parceiro.map((p) => p.nome), ['D']);
});

test('validação aponta o campo inválido', () => {
  const p = structuredClone(content.profissionais[0]);
  p.categoria = 'advogado';
  assert.throws(() => validateProfissionais([p]), /categoria/);
  const pub = structuredClone(content.publicacoes[0]);
  pub.data = '12/02/2021';
  assert.throws(() => validatePublicacoes([pub]), /data/);
  const dup = structuredClone(content.publicacoes.slice(0, 2));
  dup[1].slug = dup[0].slug;
  assert.throws(() => validatePublicacoes(dup), /slug/);
});

test('áreas: 6 na ordem fixa', () => {
  assert.deepEqual(content.areas.areas.map((a) => a.slug),
    ['concorrencia', 'societario', 'civil', 'trabalhista', 'penal', 'administrativo']);
  for (const a of content.areas.areas) assert.ok(a.abertura && a.itens.length >= 4, a.slug);
});

test('textos sem Índia e sem autopromoção', () => {
  const t = JSON.stringify({ site: content.site, areas: content.areas });
  for (const proibido of [/Índia/, /especialista/i, /vasta experiência/i, /complexa/i]) {
    assert.ok(!proibido.test(t), String(proibido));
  }
  assert.ok(content.site.escritorio.join(' ').includes('(EUA e Europa)'));
});

test('ajustes de conteúdo das áreas', () => {
  const area = (s) => content.areas.areas.find((a) => a.slug === s);
  const conc = area('concorrencia').itens.join(' | ');
  assert.match(conc, /antidumping/);
  assert.match(conc, /Avaliação de risco de práticas comerciais/);
  assert.ok(!area('civil').itens.join(' ').includes('Disputas societárias'));
  assert.match(content.areas.nota, /parcerias/);
});
