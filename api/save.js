// POST /api/save {mensagem, json:{profissionais?, publicacoes?}, arquivos:[{path, base64}]} → um commit no ramo.
import { validateSave } from '../lib/validate.mjs';
import { commitFiles } from '../lib/github.mjs';
import { exige, config } from '../lib/http.mjs';

export default async function handler(req, res) {
  if (!exige(req, res, { metodo: 'POST' })) return;
  const v = validateSave(req.body);
  if (!v.ok) return res.status(v.status).json({ error: v.error });
  try {
    const mensagem = String(req.body.mensagem || 'Atualização pelo painel').slice(0, 120);
    const r = await commitFiles({ ...config(), message: `admin: ${mensagem}`, files: v.files });
    return res.status(200).json({ ok: true, commitSha: r.commitSha });
  } catch (e) {
    return res.status(502).json({ error: `Não foi possível publicar: ${e.message}` });
  }
}
