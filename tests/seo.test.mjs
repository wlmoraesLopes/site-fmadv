import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headTags, jsonLd } from '../lib/seo.mjs';
import { page } from '../lib/layout.mjs';
import { esc, sanitizeRich } from '../lib/html.mjs';
import { loadContent } from '../lib/content.mjs';

const { site } = loadContent();
const D = 'https://www.fm-advogados.com.br';

test('headTags: título, descrição, canonical e Open Graph', () => {
  const h = headTags({ site, title: 'Escritório', description: 'Descrição do escritório.', path: '/escritorio' });
  assert.match(h, /<title>Escritório \| Franceschini e Miranda Advogados<\/title>/);
  assert.match(h, /<meta name="description" content="Descrição do escritório.">/);
  assert.match(h, new RegExp(`<link rel="canonical" href="${D}/escritorio">`));
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image']) assert.match(h, new RegExp(`property="${p}"`));
  assert.match(h, new RegExp(`property="og:image" content="${D}/assets/img/og-default.jpg"`));
  assert.match(h, /name="twitter:card" content="summary_large_image"/);
  assert.ok(!h.includes('name="robots"'));
});

test('headTags: Home usa só o nome e noindex funciona', () => {
  const h = headTags({ site, title: null, description: 'x', path: '/', noindex: true });
  assert.match(h, /<title>Franceschini e Miranda Advogados<\/title>/);
  assert.match(h, new RegExp(`<link rel="canonical" href="${D}/">`));
  assert.match(h, /<meta name="robots" content="noindex, nofollow">/);
});

test('jsonLd escapa </script>', () => {
  const s = jsonLd({ '@type': 'Thing', name: '</script><b>' });
  assert.match(s, /^<script type="application\/ld\+json">/);
  assert.ok(!s.slice(0, -9).includes('</script>'));
});

test('page(): shell completo', () => {
  const html = page({ site, title: 'Contato', description: 'd', path: '/contato', active: '/contato',
    body: '<h1>Contato</h1>', noindex: false });
  assert.match(html, /<html lang="pt-BR">/);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  const consent = html.indexOf("gtag('consent','default'");
  const config = html.indexOf("gtag('config','AW-17916394466')");
  assert.ok(consent > 0 && config > consent, 'consentimento antes da configuração');
  assert.match(html, /ad_storage:'denied'/);
  assert.match(html, /googletagmanager\.com\/gtag\/js\?id=AW-17916394466/);
  assert.match(html, /<a href="\/contato"[^>]*aria-current="page"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /href="\/politica-de-privacidade"/);
  assert.ok(!/PT \| EN/.test(html));
  assert.ok(!html.includes('font-awesome'));
});

test('esc e sanitizeRich', () => {
  assert.equal(esc('<a & "b">'), '&lt;a &amp; &quot;b&quot;&gt;');
  assert.equal(sanitizeRich('<p onclick="x">a<script>b</script></p>'), '<p>a</p>');
  assert.equal(sanitizeRich('<a href="javascript:alert(1)">x</a>'), '<a>x</a>');
  assert.match(sanitizeRich('<a href="https://x.com" target="_blank">x</a>'), /rel="noopener noreferrer"/);
  assert.equal(sanitizeRich('<img src="/uploads/publicacoes/a.jpg" alt="a">'), '<img src="/uploads/publicacoes/a.jpg" alt="a" loading="lazy" />');
  assert.equal(sanitizeRich('<img src="/etc/passwd">'), '');
});
