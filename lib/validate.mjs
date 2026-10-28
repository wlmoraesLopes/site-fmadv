// Validação do que o admin envia para salvar: dados JSON e arquivos (fotos, imagens, PDFs).
import { validateProfissionais, validatePublicacoes } from './content.mjs';

export const MAX_BYTES = 3 * 1024 * 1024;
const CAMINHO = /^uploads\/(profissionais|publicacoes)\/[a-z0-9][a-z0-9._-]*$/;
const EXTENSOES = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

const erro = (status, error) => ({ ok: false, status, error });

export function validateSave(payload) {
  if (!payload || typeof payload !== 'object') return erro(400, 'Requisição inválida.');
  const { json = {}, arquivos = [], base = {} } = payload;
  const bases = {};
  if (!Array.isArray(arquivos)) return erro(400, 'Lista de arquivos inválida.');
  const files = [];
  try {
    if (json.profissionais !== undefined) {
      validateProfissionais(json.profissionais);
      if (!base.profissionais) return erro(400, 'Versão dos dados ausente. Recarregue o painel.');
      bases['content/profissionais.json'] = base.profissionais;
      files.push({ path: 'content/profissionais.json', content: `${JSON.stringify({ profissionais: json.profissionais }, null, 2)}\n`, encoding: 'utf-8' });
    }
    if (json.publicacoes !== undefined) {
      validatePublicacoes(json.publicacoes);
      if (!base.publicacoes) return erro(400, 'Versão dos dados ausente. Recarregue o painel.');
      bases['content/publicacoes.json'] = base.publicacoes;
      files.push({ path: 'content/publicacoes.json', content: `${JSON.stringify({ publicacoes: json.publicacoes }, null, 2)}\n`, encoding: 'utf-8' });
    }
  } catch (e) {
    return erro(400, e.message);
  }
  for (const a of arquivos) {
    const path = String(a?.path || '');
    if (!CAMINHO.test(path) || path.includes('..')) return erro(400, `Caminho não permitido: ${path}`);
    if (!EXTENSOES.some((ext) => path.endsWith(ext))) return erro(415, `Formato não aceito: ${path}. Use JPG, PNG, WebP ou PDF.`);
    const base64 = String(a.base64 || '');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) return erro(400, `Arquivo corrompido: ${path}`);
    if (Buffer.byteLength(base64, 'base64') > MAX_BYTES) return erro(413, `Arquivo maior que 3 MB: ${path}`);
    files.push({ path, content: base64, encoding: 'base64' });
  }
  if (!files.length) return erro(400, 'Nada para salvar.');
  return { ok: true, files, bases };
}
