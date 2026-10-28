// Utilitários de texto usados no build, na migração e no admin (sem dependências: roda no navegador também).

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function slugify(s, max = 80) {
  const base = String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base.length <= max) return base;
  const cut = base.slice(0, max + 1);
  const i = cut.lastIndexOf('-');
  return (i > 0 ? cut.slice(0, i) : base.slice(0, max)).replace(/-+$/, '');
}

export function uniqueSlug(base, existentes) {
  const usados = new Set(existentes);
  if (!usados.has(base)) return base;
  let n = 2;
  while (usados.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// "12 de fevereiro de 2021" → "2021-02-12"
export function parseDataExtenso(s) {
  const m = String(s).toLowerCase().match(/(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/);
  if (!m) return null;
  const mes = MESES.indexOf(m[2]);
  if (mes < 0) return null;
  return `${m[3]}-${String(mes + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

// "2021-02-12" → "12 de fevereiro de 2021"
export function formatDate(iso) {
  const [a, m, d] = String(iso).split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}
