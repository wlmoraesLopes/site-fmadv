import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, uniqueSlug, parseDataExtenso, formatDate } from '../lib/text.mjs';

test('slugify remove acentos e pontuação', () => {
  assert.equal(slugify('Direito Concorrencial: em que medida?'), 'direito-concorrencial-em-que-medida');
  assert.equal(slugify('ENTROPIA JURÍDICA – O ÓBVIO'), 'entropia-juridica-o-obvio');
});

test('slugify limita a 80 caracteres em fronteira de palavra', () => {
  const s = slugify('palavra '.repeat(30));
  assert.ok(s.length <= 80);
  assert.ok(!s.endsWith('-'));
  assert.match(s, /^(palavra-)*palavra$/);
});

test('uniqueSlug acrescenta sufixo numérico', () => {
  assert.equal(uniqueSlug('maria-joao', []), 'maria-joao');
  assert.equal(uniqueSlug('maria-joao', ['maria-joao']), 'maria-joao-2');
  assert.equal(uniqueSlug('maria-joao', ['maria-joao', 'maria-joao-2']), 'maria-joao-3');
});

test('parseDataExtenso aceita variações de caixa', () => {
  assert.equal(parseDataExtenso('12 de fevereiro de 2021'), '2021-02-12');
  assert.equal(parseDataExtenso('05 DE FEVEREIRO DE 2026'), '2026-02-05');
  assert.equal(parseDataExtenso('23 de Agosto de 2021'), '2021-08-23');
  assert.equal(parseDataExtenso('28 de março de 2021'), '2021-03-28');
  assert.equal(parseDataExtenso('sem data'), null);
});

test('formatDate escreve por extenso', () => {
  assert.equal(formatDate('2021-02-12'), '12 de fevereiro de 2021');
  assert.equal(formatDate('2026-03-06'), '6 de março de 2026');
});
