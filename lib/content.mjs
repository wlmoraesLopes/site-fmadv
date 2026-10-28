// Carga, validação e ordenação dos dados em content/*.json.
import { readFileSync } from 'node:fs';

export const CATEGORIAS = ['fundador', 'socio', 'parceiro'];
export const ROTULO_CATEGORIA = {
  fundador: 'Sócios Fundadores', socio: 'Sócios', parceiro: 'Parceiros / Correspondentes',
};
export const TIPOS = ['artigo', 'livro', 'podcast', 'entrevista', 'evento', 'reconhecimento'];
export const ROTULO_TIPO = {
  artigo: 'Artigo', livro: 'Livro', podcast: 'Podcast / Webinar',
  entrevista: 'Entrevista', evento: 'Evento', reconhecimento: 'Reconhecimento',
};

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function falha(onde, campo, valor) {
  throw new Error(`${onde}: campo "${campo}" inválido (${JSON.stringify(valor)})`);
}

function exigeTexto(onde, obj, campo) {
  if (typeof obj[campo] !== 'string' || !obj[campo].trim()) falha(onde, campo, obj[campo]);
}

function slugsUnicos(lista, tipo) {
  const vistos = new Set();
  for (const item of lista) {
    if (typeof item.slug !== 'string' || !SLUG.test(item.slug)) falha(tipo, 'slug', item.slug);
    if (vistos.has(item.slug)) falha(tipo, 'slug', `${item.slug} repetido`);
    vistos.add(item.slug);
  }
}

export function validateProfissionais(lista) {
  if (!Array.isArray(lista)) falha('profissionais', 'profissionais', typeof lista);
  slugsUnicos(lista, 'profissionais');
  for (const p of lista) {
    const onde = `profissional ${p.slug}`;
    for (const c of ['nome', 'foto', 'curriculo']) exigeTexto(onde, p, c);
    if (!CATEGORIAS.includes(p.categoria)) falha(onde, 'categoria', p.categoria);
    if (!Number.isInteger(p.ordem)) falha(onde, 'ordem', p.ordem);
    if (!Array.isArray(p.obras)) falha(onde, 'obras', p.obras);
    for (const o of p.obras) if (!o.titulo?.trim()) falha(onde, 'obras.titulo', o.titulo);
    if (!Array.isArray(p.links)) falha(onde, 'links', p.links);
    for (const l of p.links) if (!/^https?:\/\/\S+$/.test(l.url || '')) falha(onde, 'links.url', l.url);
  }
  return lista;
}

export function validatePublicacoes(lista) {
  if (!Array.isArray(lista)) falha('publicacoes', 'publicacoes', typeof lista);
  slugsUnicos(lista, 'publicações');
  for (const p of lista) {
    const onde = `publicação ${p.slug}`;
    for (const c of ['titulo', 'autor', 'conteudo']) exigeTexto(onde, p, c);
    if (!ISO.test(p.data ?? '') || Number.isNaN(Date.parse(p.data))) falha(onde, 'data', p.data);
    if (!TIPOS.includes(p.tipo)) falha(onde, 'tipo', p.tipo);
  }
  return lista;
}

export function loadContent(dir = new URL('../content/', import.meta.url)) {
  const ler = (nome) => JSON.parse(readFileSync(new URL(nome, dir), 'utf8'));
  const site = ler('site.json');
  const areas = ler('areas.json');
  const profissionais = validateProfissionais(ler('profissionais.json').profissionais);
  const publicacoes = validatePublicacoes(ler('publicacoes.json').publicacoes);
  return { site, areas, profissionais, publicacoes };
}

export function sortPublicacoes(lista) {
  return [...lista].sort((a, b) =>
    b.data.localeCompare(a.data) || a.titulo.localeCompare(b.titulo, 'pt-BR'));
}

export function porCategoria(profissionais) {
  const grupos = Object.fromEntries(CATEGORIAS.map((c) => [c, []]));
  for (const p of profissionais) grupos[p.categoria]?.push(p);
  for (const c of CATEGORIAS) {
    grupos[c].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));
  }
  return grupos;
}
