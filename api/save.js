// POST /api/save {mensagem, json:{profissionais?, publicacoes?}, arquivos:[{path, base64}]} → um commit no ramo.
import { validateSave } from '../lib/validate.mjs';
import { commitFiles, readFile, blobSha } from '../lib/github.mjs';
import { exige, config } from '../lib/http.mjs';

export default async function handler(req, res) {
  if (!exige(req, res, { metodo: 'POST' })) return;
  const v = validateSave(req.body);
  if (!v.ok) return res.status(v.status).json({ error: v.error });
  try {
    const cfg = config();
    // Recusa se outra aba/pessoa publicou o mesmo arquivo depois que estes dados foram carregados.
    for (const [path, esperado] of Object.entries(v.bases)) {
      const atual = await readFile({ ...cfg, path });
      if (atual.sha !== esperado) {
        return res.status(409).json({ error: 'Os dados foram alterados em outra janela. Recarregue o painel e refaça a alteração.' });
      }
    }
    const mensagem = String(req.body.mensagem || 'Atualização pelo painel').slice(0, 120);
    const r = await commitFiles({ ...cfg, message: `admin: ${mensagem}`, files: v.files });
    const shas = Object.fromEntries(v.files.filter((f) => f.encoding === 'utf-8').map((f) => [f.path, blobSha(f.content)]));
    return res.status(200).json({ ok: true, commitSha: r.commitSha, shas });
  } catch (e) {
    return res.status(502).json({ error: `Não foi possível publicar: ${e.message}` });
  }
}
