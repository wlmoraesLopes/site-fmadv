// Leitura e gravação no repositório via API do GitHub (um commit por salvamento).
const API = 'https://api.github.com';

async function chama(fetch, token, url, { method = 'GET', body } = {}) {
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const erro = new Error(`GitHub ${method} ${url.replace(API, '')}: ${r.status} ${json.message || ''}`.trim());
    erro.status = r.status;
    throw erro;
  }
  return json;
}

export async function readFile({ repo, branch, path, token, fetch = globalThis.fetch }) {
  const j = await chama(fetch, token, `${API}/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`);
  return { text: Buffer.from(j.content, 'base64').toString('utf8'), sha: j.sha };
}

// Cria blobs → árvore sobre a árvore do HEAD → commit → avança o ramo.
// Partir sempre do HEAD atual garante que um save não apague o anterior; em 422
// (o ramo andou entre a leitura e a gravação) refaz uma vez a partir do novo HEAD.
export async function commitFiles({ repo, branch, token, message, files, fetch = globalThis.fetch }) {
  const base = `${API}/repos/${repo}`;
  const blobs = [];
  for (const f of files) {
    const b = await chama(fetch, token, `${base}/git/blobs`, { method: 'POST', body: { content: f.content, encoding: f.encoding } });
    blobs.push({ path: f.path, mode: '100644', type: 'blob', sha: b.sha });
  }
  for (let tentativa = 0; ; tentativa++) {
    const ref = await chama(fetch, token, `${base}/git/ref/heads/${branch}`);
    const head = ref.object.sha;
    const commitAtual = await chama(fetch, token, `${base}/git/commits/${head}`);
    const arvore = await chama(fetch, token, `${base}/git/trees`, { method: 'POST', body: { base_tree: commitAtual.tree.sha, tree: blobs } });
    const novo = await chama(fetch, token, `${base}/git/commits`, { method: 'POST', body: { message, tree: arvore.sha, parents: [head] } });
    try {
      await chama(fetch, token, `${base}/git/refs/heads/${branch}`, { method: 'PATCH', body: { sha: novo.sha, force: false } });
      return { commitSha: novo.sha };
    } catch (e) {
      if (e.status !== 422 || tentativa > 0) throw e;
    }
  }
}
