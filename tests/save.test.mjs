import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSave, MAX_BYTES } from '../lib/validate.mjs';
import { commitFiles, readFile } from '../lib/github.mjs';
import { loadContent } from '../lib/content.mjs';
import { signSession } from '../lib/auth.mjs';
import saveHandler from '../api/save.js';
import loginHandler from '../api/login.js';

const content = loadContent();
const b64 = (n) => Buffer.alloc(n, 1).toString('base64');

test('validateSave aceita profissional e foto válidos', () => {
  const r = validateSave({ mensagem: 'x', json: { profissionais: content.profissionais },
    arquivos: [{ path: 'uploads/profissionais/novo.webp', base64: b64(100) }] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.files.map((f) => f.path), ['content/profissionais.json', 'uploads/profissionais/novo.webp']);
  assert.equal(r.files[0].encoding, 'utf-8');
  assert.ok(r.files[0].content.endsWith('}\n'));
});

test('validateSave recusa caminhos, tipos e tamanhos inválidos', () => {
  const caso = (arq) => validateSave({ mensagem: 'x', json: {}, arquivos: [arq] });
  assert.equal(caso({ path: 'content/site.json', base64: b64(10) }).status, 400);
  assert.equal(caso({ path: 'uploads/publicacoes/../../api/x.png', base64: b64(10) }).status, 400);
  assert.equal(caso({ path: 'uploads/publicacoes/a b.png', base64: b64(10) }).status, 400);
  assert.equal(caso({ path: 'uploads/publicacoes/x.zip', base64: b64(10) }).status, 415);
  assert.equal(caso({ path: 'uploads/publicacoes/x.pdf', base64: b64(MAX_BYTES + 1) }).status, 413);
  assert.equal(MAX_BYTES, 3 * 1024 * 1024);
});

test('validateSave recusa dados inválidos citando o campo', () => {
  const p = structuredClone(content.profissionais);
  p[0].categoria = 'advogado';
  const r = validateSave({ mensagem: 'x', json: { profissionais: p }, arquivos: [] });
  assert.equal(r.status, 400);
  assert.match(r.error, /categoria/);
  assert.equal(validateSave({ mensagem: 'x', json: {}, arquivos: [] }).status, 400, 'nada para salvar');
  assert.equal(validateSave(null).status, 400);
});

// GitHub falso: guarda árvores e commits em memória para simular saves seguidos.
function githubFalso({ conflitoUmaVez = false } = {}) {
  const estado = { head: 'c0', arvores: { t0: { 'content/a.json': 'A' } }, commits: { c0: 't0' }, blobs: {}, n: 0, chamadas: [] };
  let conflito = conflitoUmaVez;
  const fetch = async (url, opt = {}) => {
    const metodo = opt.method || 'GET';
    const corpo = opt.body ? JSON.parse(opt.body) : null;
    estado.chamadas.push(`${metodo} ${url.replace('https://api.github.com/repos/o/r', '')}`);
    const ok = (json, status = 200) => ({ ok: status < 300, status, json: async () => json });
    if (url.endsWith('/git/ref/heads/b')) return ok({ object: { sha: estado.head } });
    if (/\/git\/commits\/c\d+$/.test(url) && metodo === 'GET') return ok({ tree: { sha: estado.commits[url.split('/').pop()] } });
    if (url.endsWith('/git/blobs')) { const sha = `b${++estado.n}`; estado.blobs[sha] = corpo; return ok({ sha }, 201); }
    if (url.endsWith('/git/trees')) {
      const sha = `t${++estado.n}`;
      const base = { ...estado.arvores[corpo.base_tree] };
      for (const item of corpo.tree) base[item.path] = estado.blobs[item.sha].content;
      estado.arvores[sha] = base;
      return ok({ sha }, 201);
    }
    if (url.endsWith('/git/commits')) { const sha = `c${++estado.n}`; estado.commits[sha] = corpo.tree; return ok({ sha }, 201); }
    if (url.endsWith('/git/refs/heads/b')) {
      if (conflito) { conflito = false; estado.head = 'c0'; return ok({ message: 'Update is not a fast forward' }, 422); }
      estado.head = corpo.sha; return ok({ object: { sha: corpo.sha } });
    }
    if (url.includes('/contents/')) return ok({ content: Buffer.from('{"x":1}').toString('base64'), sha: 's1' });
    return ok({ message: 'não previsto' }, 404);
  };
  return { estado, fetch };
}

test('commitFiles parte do HEAD atual: dois saves seguidos preservam os dois arquivos', async () => {
  const gh = githubFalso();
  const base = { repo: 'o/r', branch: 'b', token: 't', fetch: gh.fetch };
  await commitFiles({ ...base, message: '1', files: [{ path: 'uploads/publicacoes/1.png', content: 'MQ==', encoding: 'base64' }] });
  await commitFiles({ ...base, message: '2', files: [{ path: 'content/publicacoes.json', content: '{}', encoding: 'utf-8' }] });
  const arvore = gh.estado.arvores[gh.estado.commits[gh.estado.head]];
  assert.deepEqual(Object.keys(arvore).sort(), ['content/a.json', 'content/publicacoes.json', 'uploads/publicacoes/1.png']);
  assert.ok(gh.estado.chamadas.includes('PATCH /git/refs/heads/b'));
});

test('commitFiles tenta de novo uma vez quando o ramo mudou (422)', async () => {
  const gh = githubFalso({ conflitoUmaVez: true });
  const r = await commitFiles({ repo: 'o/r', branch: 'b', token: 't', fetch: gh.fetch, message: 'm',
    files: [{ path: 'content/x.json', content: '{}', encoding: 'utf-8' }] });
  assert.equal(gh.estado.head, r.commitSha);
  assert.equal(gh.estado.chamadas.filter((c) => c.startsWith('PATCH')).length, 2);
});

test('readFile decodifica o conteúdo', async () => {
  const gh = githubFalso();
  const r = await readFile({ repo: 'o/r', branch: 'b', token: 't', path: 'content/x.json', fetch: gh.fetch });
  assert.equal(r.text, '{"x":1}');
});

function resFalso() {
  const r = { statusCode: 200, headers: {}, body: null };
  r.status = (s) => { r.statusCode = s; return r; };
  r.setHeader = (k, v) => { r.headers[k.toLowerCase()] = v; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
}

test('api/save exige sessão e o cabeçalho X-FM-Admin', async () => {
  process.env.SESSION_SECRET = 's3gredo';
  const req = { method: 'POST', headers: {}, body: { json: {}, arquivos: [] } };
  const res = resFalso();
  await saveHandler(req, res);
  assert.equal(res.statusCode, 401);
  const comCookie = { ...req, headers: { cookie: `fm_admin=${signSession('s3gredo')}` } };
  const res2 = resFalso();
  await saveHandler(comCookie, res2);
  assert.equal(res2.statusCode, 403, 'sem X-FM-Admin');
});

test('api/login com corpo vazio responde 400', async () => {
  const res = resFalso();
  await loginHandler({ method: 'POST', headers: { 'x-fm-admin': '1' }, body: {} }, res);
  assert.equal(res.statusCode, 400);
});
