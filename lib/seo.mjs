// Etiquetas de SEO (title, description, canonical, Open Graph) e dados estruturados JSON-LD.
import { esc } from './html.mjs';

export function headTags({ site, title, description, path, image, type = 'website', noindex = false }) {
  const titulo = title ? `${title} | ${site.nome}` : site.nome;
  const url = site.dominio + path;
  const img = site.dominio + (image || '/assets/img/og-default.jpg');
  return [
    `<title>${esc(titulo)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    noindex ? '<meta name="robots" content="noindex, nofollow">' : '',
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="${esc(site.nome)}">`,
    '<meta property="og:locale" content="pt_BR">',
    `<meta property="og:title" content="${esc(title || site.nome)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(img)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
  ].filter(Boolean).join('\n');
}

export function jsonLd(obj) {
  const json = JSON.stringify({ '@context': 'https://schema.org', ...obj }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

export function legalServiceLd(site) {
  const e = site.endereco;
  return {
    '@type': 'LegalService',
    name: site.nome,
    url: site.dominio,
    logo: `${site.dominio}/assets/img/logofm2.png`,
    image: `${site.dominio}/assets/img/og-default.jpg`,
    foundingDate: site.fundacao,
    taxID: site.cnpj,
    telephone: site.telefoneLink,
    email: site.email,
    address: {
      '@type': 'PostalAddress', streetAddress: e.rua, addressLocality: e.cidade,
      addressRegion: e.uf, postalCode: e.cep, addressCountry: 'BR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    areaServed: 'BR',
    sameAs: site.redes.map((r) => r.url),
  };
}
