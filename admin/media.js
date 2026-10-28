// Funções de mídia do painel: YouTube, verificação e nome de arquivos, redução de imagens.
import { slugify } from './text.mjs';

export const MAX_BYTES = 3 * 1024 * 1024;

export function youtubeId(url) {
  let u;
  try { u = new URL(String(url).trim()); } catch { return null; }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id = null;
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com') id = u.searchParams.get('v') || (u.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/) || [])[2];
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

export function youtubeEmbedHtml(url) {
  const id = youtubeId(url);
  if (!id) return null;
  return `<p><a href="https://www.youtube.com/watch?v=${id}" target="_blank"><img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" alt="Vídeo no YouTube"></a></p>`;
}

export function checkFile(file, { maxBytes = MAX_BYTES, tipos }) {
  if (!tipos.includes(file.type)) return 'Este formato não é aceito. Use JPG, PNG, WebP ou PDF.';
  if (file.size > maxBytes) return 'O arquivo passa de 3 MB. Reduza o tamanho ou publique como link externo.';
  return null;
}

export function nomeArquivo(original, ext, agora = Date.now()) {
  const base = slugify(String(original).replace(/\.[^.]+$/, ''), 50) || 'arquivo';
  return `${base}-${agora}.${ext}`;
}

// Reduz a imagem no navegador (largura máx. 1600 px) e converte para WebP (JPEG se o navegador não gerar WebP).
export async function resizeImage(file, { maxW = 1600, quality = 0.8 } = {}) {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxW / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const gera = (tipo) => new Promise((ok) => canvas.toBlob(ok, tipo, quality));
  let blob = await gera('image/webp');
  let ext = 'webp';
  if (!blob || blob.type !== 'image/webp') { blob = await gera('image/jpeg'); ext = 'jpg'; }
  return { blob, ext };
}

export function paraBase64(blob) {
  return new Promise((ok, erro) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1]);
    r.onerror = erro;
    r.readAsDataURL(blob);
  });
}
