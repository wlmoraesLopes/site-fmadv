// POST /api/logout → apaga o cookie de sessão.
import { exige, cookieSessao } from '../lib/http.mjs';

export default function handler(req, res) {
  if (!exige(req, res, { metodo: 'POST', sessao: false })) return;
  res.setHeader('Set-Cookie', cookieSessao('', 0));
  return res.status(200).json({ ok: true });
}
