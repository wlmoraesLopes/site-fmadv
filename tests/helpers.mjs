// Gera o site uma vez numa pasta temporária e oferece leitura dos arquivos para os testes de páginas.
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../scripts/build.mjs';
import { loadContent } from '../lib/content.mjs';

export const content = loadContent();

const cache = {};
export async function site(env = 'teste') {
  if (!cache[env]) {
    const out = mkdtempSync(join(tmpdir(), `fm-${env}-`));
    const r = await build({ outDir: out, env: { SITE_ENV: env } });
    cache[env] = {
      out,
      paginas: r.paginas,
      ler: (f) => readFileSync(join(out, f), 'utf8'),
      existe: (f) => existsSync(join(out, f)),
    };
  }
  return cache[env];
}

export const textoPuro = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
export const descricao = (html) => (html.match(/<meta name="description" content="([^"]*)">/) || [])[1]
  ?.replace(/&(amp|lt|gt|quot|#39);/g, (e) => ENT[e]);
