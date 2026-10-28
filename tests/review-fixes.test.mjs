// Testes das correções pedidas na revisão final.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateProfissionais, loadContent } from '../lib/content.mjs';
import { cookies } from '../lib/http.mjs';
import { blobSha } from '../lib/github.mjs';
import { validateSave } from '../lib/validate.mjs';

const content = loadContent();

test('links de perfil exigem http(s)', () => {
  const p = structuredClone(content.profissionais);
  p[0].links = [{ rotulo: 'X', url: 'javascript:alert(1)' }];
  assert.throws(() => validateProfissionais(p), /links/);
  p[0].links = [{ rotulo: 'LinkedIn', url: 'linkedin.com/in/x' }];
  assert.throws(() => validateProfissionais(p), /links/);
  p[0].links = [{ rotulo: 'LinkedIn', url: 'https://linkedin.com/in/x' }];
  assert.doesNotThrow(() => validateProfissionais(p));
});

test('cookie malformado não derruba a leitura de cookies', () => {
  const c = cookies({ headers: { cookie: 'a=%E0; fm_admin=123.abc' } });
  assert.equal(c.fm_admin, '123.abc');
  assert.equal(c.a, '%E0');
});

test('blobSha calcula o sha de blob do git', () => {
  const texto = 'olá\n';
  const buf = Buffer.from(texto);
  const esperado = createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
  assert.equal(blobSha(texto), esperado);
});

test('validateSave devolve as bases esperadas de cada JSON enviado', () => {
  const r = validateSave({ json: { publicacoes: content.publicacoes }, base: { publicacoes: 'abc' }, arquivos: [] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.bases, { 'content/publicacoes.json': 'abc' });
  const sem = validateSave({ json: { publicacoes: content.publicacoes }, arquivos: [] });
  assert.equal(sem.status, 400, 'JSON sem base é recusado');
});
