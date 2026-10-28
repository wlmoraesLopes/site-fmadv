import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../scripts/build.mjs';

test('build copia assets, uploads e o arquivo de verificação do Google', async () => {
  const out = mkdtempSync(join(tmpdir(), 'fm-build-'));
  await build({ outDir: out, env: { SITE_ENV: 'teste' } });
  for (const f of ['assets/css/site.css', 'assets/js/site.js', 'uploads/profissionais/thays.jpg',
    'google2ad6f5776b26239e.html']) {
    assert.ok(existsSync(join(out, f)), f);
  }
  assert.match(readFileSync(join(out, 'assets/js/fm-config.js'), 'utf8'), /AW-17916394466/);
});

test('build publica o admin com a cópia real de lib/text.mjs', async () => {
  const out = mkdtempSync(join(tmpdir(), 'fm-build-'));
  await build({ outDir: out, env: { SITE_ENV: 'teste' } });
  assert.ok(existsSync(join(out, 'admin/index.html')));
  const t = readFileSync(join(out, 'admin/text.mjs'), 'utf8');
  assert.ok(!t.includes("export * from"), 'não pode reexportar ../lib no site publicado');
  assert.match(t, /export function slugify/);
  assert.match(readFileSync(join(out, 'admin/index.html'), 'utf8'), /noindex/);
});
