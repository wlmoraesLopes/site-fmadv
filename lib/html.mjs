// Escape de texto e limpeza do HTML rico vindo do admin (currículos e publicações).
import sanitizeHtml from 'sanitize-html';

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const LOCAL = /^\/uploads\/(profissionais|publicacoes)\/[\w.-]+$/;
const YOUTUBE = /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//;
const IMG_EXTERNA = /^https:\/\/img\.youtube\.com\/vi\/[\w-]{11}\/\w+\.jpg$/;

export function sanitizeRich(html) {
  return sanitizeHtml(String(html ?? ''), {
    allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'a', 'h3', 'h4',
      'blockquote', 'img', 'figure', 'figcaption'],
    allowedAttributes: { a: ['class', 'href', 'target', 'rel'], img: ['src', 'alt', 'width', 'height', 'loading'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => frame.tag === 'img'
      && !(LOCAL.test(frame.attribs.src || '') || IMG_EXTERNA.test(frame.attribs.src || '')),
    transformTags: {
      a: (tag, attribs) => {
        // Links do YouTube viram miniatura clicável (classe "video"); nenhuma outra classe é aceita.
        const href = attribs.href && /^(https?:|mailto:|\/)/i.test(attribs.href) ? attribs.href : undefined;
        const out = {};
        if (href && YOUTUBE.test(href)) out.class = 'video';
        if (href) out.href = href;
        if (attribs.target === '_blank') Object.assign(out, { target: '_blank', rel: 'noopener noreferrer' });
        return { tagName: 'a', attribs: out };
      },
      img: (tag, attribs) => ({ tagName: 'img', attribs: { ...attribs, loading: 'lazy' } }),
    },
  });
}
