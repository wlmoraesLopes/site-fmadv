// Gera o site estático em public/ a partir de content/*.json (roda no build da Vercel).
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadContent } from '../lib/content.mjs';
import { paginas } from '../lib/pages/index.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function grava(outDir, path, html) {
  // "/" → index.html; "/escritorio" → escritorio.html; "/publicacoes/x" → publicacoes/x.html
  const arquivo = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
  const destino = join(outDir, arquivo);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, html);
}

export async function build({ outDir = join(RAIZ, 'public'), env = process.env } = {}) {
  const content = loadContent(pathToFileURL(join(RAIZ, 'content') + '/'));
  const ctx = { ...content, noindex: env.SITE_ENV !== 'producao', env: env.SITE_ENV || 'teste' };

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  for (const pasta of ['assets', 'uploads', 'admin']) {
    if (existsSync(join(RAIZ, pasta))) cpSync(join(RAIZ, pasta), join(outDir, pasta), { recursive: true });
  }
  cpSync(join(RAIZ, 'google2ad6f5776b26239e.html'), join(outDir, 'google2ad6f5776b26239e.html'));

  const cfg = { id: content.site.adsId, conversoes: content.site.adsConversion };
  writeFileSync(join(outDir, 'assets/js/fm-config.js'), `window.FM_ADS=${JSON.stringify(cfg)};\n`);

  const geradas = [];
  for (const render of paginas) {
    for (const { path, html, arquivo, sitemap = true } of [].concat(render(ctx))) {
      if (arquivo) writeFileSync(join(outDir, arquivo), html);
      else grava(outDir, path, html);
      if (path && sitemap) geradas.push(path);
    }
  }
  return { paginas: geradas };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { paginas: p } = await build();
  console.log(`build ok: ${p.length} páginas`);
}
