import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, signSession, verifySession, rateLimiter } from '../lib/auth.mjs';

test('senha: hash confere só com a senha certa', async () => {
  const h = await hashPassword('Senha forte 123');
  assert.match(h, /^scrypt\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  assert.equal(await verifyPassword('Senha forte 123', h), true);
  assert.equal(await verifyPassword('senha forte 123', h), false);
  assert.equal(await verifyPassword('x', 'lixo'), false);
});

test('sessão: válida, adulterada, expirada, outro segredo', () => {
  const agora = 1_700_000_000_000;
  const t = signSession('segredo', 3600, agora);
  assert.equal(verifySession('segredo', t, agora + 1000), true);
  assert.equal(verifySession('segredo', t, agora + 3601 * 1000), false);
  assert.equal(verifySession('outro', t, agora), false);
  const [exp, mac] = t.split('.');
  assert.equal(verifySession('segredo', `${Number(exp) + 9999}.${mac}`, agora), false);
  assert.equal(verifySession('segredo', undefined, agora), false);
  assert.equal(verifySession('segredo', 'abc', agora), false);
});

test('limitador: bloqueia após 5 falhas e libera com reset ou fim da janela', () => {
  let agora = 0;
  const l = rateLimiter({ max: 5, windowMs: 600_000, now: () => agora });
  for (let i = 0; i < 4; i++) l.fail('1.2.3.4');
  assert.equal(l.blocked('1.2.3.4'), false);
  l.fail('1.2.3.4');
  assert.equal(l.blocked('1.2.3.4'), true);
  assert.equal(l.blocked('5.6.7.8'), false);
  agora = 600_001;
  assert.equal(l.blocked('1.2.3.4'), false);
  for (let i = 0; i < 5; i++) l.fail('1.2.3.4');
  l.reset('1.2.3.4');
  assert.equal(l.blocked('1.2.3.4'), false);
});
