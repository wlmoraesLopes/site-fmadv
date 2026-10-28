// POST /api/login {senha} → cookie de sessão. Tentativas erradas seguidas bloqueiam por 10 minutos.
import { verifyPassword, signSession, rateLimiter } from '../lib/auth.mjs';
import { exige, ipDe, cookieSessao, TTL } from '../lib/http.mjs';

const limite = rateLimiter({ max: 5, windowMs: 600_000 });

export default async function handler(req, res) {
  if (!exige(req, res, { metodo: 'POST', sessao: false })) return;
  const senha = req.body?.senha;
  if (typeof senha !== 'string' || !senha) return res.status(400).json({ error: 'Digite a senha.' });
  const ip = ipDe(req);
  if (limite.blocked(ip)) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  const { ADMIN_PASSWORD_HASH, SESSION_SECRET } = process.env;
  if (!ADMIN_PASSWORD_HASH || !SESSION_SECRET) return res.status(500).json({ error: 'Admin não configurado no servidor.' });
  if (!(await verifyPassword(senha, ADMIN_PASSWORD_HASH))) {
    limite.fail(ip);
    await new Promise((r) => setTimeout(r, 600));
    return res.status(401).json({ error: 'Senha incorreta.' });
  }
  limite.reset(ip);
  res.setHeader('Set-Cookie', cookieSessao(signSession(SESSION_SECRET, TTL), TTL));
  return res.status(200).json({ ok: true });
}
