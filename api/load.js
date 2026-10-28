// GET /api/load → dados atuais do ramo (não do site publicado, que pode estar alguns minutos atrás).
import { readFile } from '../lib/github.mjs';
import { exige, config } from '../lib/http.mjs';

export default async function handler(req, res) {
  if (!exige(req, res, { metodo: 'GET' })) return;
  try {
    const cfg = config();
    const [pr, pu] = await Promise.all(['profissionais', 'publicacoes'].map((n) =>
      readFile({ ...cfg, path: `content/${n}.json` })));
    return res.status(200).json({
      ...JSON.parse(pr.text), ...JSON.parse(pu.text),
      shas: { profissionais: pr.sha, publicacoes: pu.sha },
    });
  } catch (e) {
    return res.status(502).json({ error: `Não foi possível carregar os dados: ${e.message}` });
  }
}
