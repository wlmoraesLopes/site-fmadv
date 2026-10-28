// Utilitários comuns às funções da API do admin.
import { verifySession } from './auth.mjs';

export const COOKIE = 'fm_admin';
export const TTL = 28800; // 8 horas

export function cookies(req) {
  return Object.fromEntries(String(req.headers?.cookie || '').split(';')
    .map((c) => c.trim().split('=')).filter(([k]) => k).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
}

export function ipDe(req) {
  return String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '?').split(',')[0].trim();
}

export function cookieSessao(valor, maxAge) {
  return `${COOKIE}=${valor}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

// Responde e devolve false se a requisição não puder seguir (método, CSRF ou sessão).
export function exige(req, res, { metodo, sessao = true }) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== metodo) { res.status(405).json({ error: 'Método não permitido.' }); return false; }
  if (sessao && !verifySession(process.env.SESSION_SECRET, cookies(req)[COOKIE])) {
    res.status(401).json({ error: 'Sessão expirada. Entre de novo.' });
    return false;
  }
  if (metodo !== 'GET' && req.headers?.['x-fm-admin'] !== '1') {
    res.status(403).json({ error: 'Requisição recusada.' });
    return false;
  }
  return true;
}

export function config() {
  const { GITHUB_TOKEN: token, GITHUB_REPO: repo, GITHUB_BRANCH: branch } = process.env;
  if (!token || !repo || !branch) throw new Error('Configuração do servidor incompleta (GitHub).');
  return { token, repo, branch };
}
