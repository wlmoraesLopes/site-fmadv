// Painel do site: cadastro de profissionais e publicações, gravando via /api (commit no GitHub).
import { slugify, uniqueSlug } from './text.mjs';
import { checkFile, nomeArquivo, resizeImage, paraBase64, youtubeEmbedHtml } from './media.js';

const CATEGORIAS = [['fundador', 'Sócios Fundadores'], ['socio', 'Sócios'], ['parceiro', 'Parceiros / Correspondentes']];
const TIPOS = [['artigo', 'Artigo'], ['livro', 'Livro'], ['podcast', 'Podcast / Webinar'], ['entrevista', 'Entrevista'], ['evento', 'Evento'], ['reconhecimento', 'Reconhecimento']];
const IMAGENS = ['image/jpeg', 'image/png', 'image/webp'];

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// DOMParser não executa nada do HTML (ao contrário de innerHTML num elemento da página).
const textoDe = (html) => new DOMParser().parseFromString(html, 'text/html').body.textContent.replace(/\s+/g, ' ').trim();
const resumir = (t, max) => (t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);
const hoje = () => new Date().toISOString().slice(0, 10);

const estado = {
  dados: null,              // { profissionais, publicacoes } como estão no ramo
  aba: 'profissionais',
  atual: null,              // slug selecionado ou '__novo'
  rascunho: null,           // cópia em edição
  arquivos: new Map(),      // caminho → base64 ainda não enviado
  alterados: new Set(),     // 'profissionais' | 'publicacoes' já alterados na lista, a publicar
  rascunhoSujo: false,      // o rascunho aberto tem edições ainda não juntadas à lista
  sujo: false,
  busca: '',
};

// ---------- API ----------
class SessaoExpirada extends Error {}

async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const r = await fetch(`/api/${caminho}`, {
    method: metodo,
    headers: { 'X-FM-Admin': '1', ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
    credentials: 'same-origin',
  });
  const json = await r.json().catch(() => ({}));
  if (r.status === 401 && caminho !== 'login') throw new SessaoExpirada(json.error);
  if (!r.ok) throw new Error(json.error || `Erro ${r.status}`);
  return json;
}

function aviso(texto, tipo = '') {
  const el = $('#aviso');
  el.textContent = texto;
  el.className = `aviso ${tipo}`;
  el.hidden = !texto;
}

// ---------- Entrada ----------
async function entrar(form) {
  const msg = $('.msg', form);
  msg.textContent = '';
  try {
    await api('login', { metodo: 'POST', corpo: { senha: form.senha.value } });
    form.senha.value = '';
    return true;
  } catch (e) {
    msg.textContent = e.message;
    return false;
  }
}

async function iniciar() {
  try {
    estado.dados = await api('load');
    $('#tela-login').hidden = true;
    $('#tela-painel').hidden = false;
    desenha();
  } catch (e) {
    $('#tela-painel').hidden = true;
    $('#tela-login').hidden = false;
    if (!(e instanceof SessaoExpirada)) $('#form-login .msg').textContent = e.message;
  }
}

$('#form-login').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  if (await entrar(ev.target)) iniciar();
});

$('#sair').addEventListener('click', async () => {
  if (estado.sujo && !confirm('Há alterações não publicadas. Sair mesmo assim?')) return;
  await api('logout', { metodo: 'POST' }).catch(() => {});
  location.reload();
});

window.addEventListener('beforeunload', (ev) => { if (estado.sujo) { ev.preventDefault(); ev.returnValue = ''; } });

// ---------- Lista ----------
document.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => {
  if (estado.rascunhoSujo && !confirm('Descartar as alterações não publicadas deste item?')) return;
  descarta();
  estado.aba = b.dataset.aba;
  document.querySelectorAll('[data-aba]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  desenha();
}));

function descarta() {
  estado.atual = null;
  estado.rascunho = null;
  estado.rascunhoSujo = false;
  estado.sujo = estado.alterados.size > 0;
}

function desenha() { desenhaLista(); desenhaEditor(); desenhaRodape(); }

function itemHtml(slug, titulo, sub, extra = '') {
  return `<div class="item${estado.atual === slug ? ' ativo' : ''}" data-slug="${esc(slug)}"><div class="txt"><b>${esc(titulo)}</b><small>${esc(sub)}</small></div>${extra}</div>`;
}

function desenhaLista() {
  const el = $('#lista');
  if (estado.aba === 'profissionais') {
    const grupos = CATEGORIAS.map(([cat, rotulo]) => {
      const membros = estado.dados.profissionais.filter((p) => p.categoria === cat).sort((a, b) => a.ordem - b.ordem);
      return `<h3>${rotulo}</h3>${membros.map((p, i) => itemHtml(p.slug, p.nome, p.titulo,
        `<span class="setas"><button type="button" data-mover="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir">▲</button><button type="button" data-mover="1" ${i === membros.length - 1 ? 'disabled' : ''} aria-label="Descer">▼</button></span>`)).join('') || '<p class="ajuda">Ninguém nesta categoria.</p>'}`;
    }).join('');
    el.innerHTML = `<button class="btn p novo" type="button" data-novo>+ Novo profissional</button>${grupos}`;
  } else {
    const termo = estado.busca.toLowerCase();
    const lista = [...estado.dados.publicacoes]
      .sort((a, b) => b.data.localeCompare(a.data) || a.titulo.localeCompare(b.titulo, 'pt-BR'))
      .filter((p) => !termo || `${p.titulo} ${p.autor}`.toLowerCase().includes(termo));
    el.innerHTML = `<button class="btn p novo" type="button" data-novo>+ Nova publicação</button>
      <input type="search" placeholder="Buscar por título ou autor" value="${esc(estado.busca)}" data-busca>
      ${lista.map((p) => itemHtml(p.slug, p.titulo, `${p.data.split('-').reverse().join('/')} · ${p.autor}`)).join('')}`;
    const busca = $('[data-busca]', el);
    busca.addEventListener('input', () => { estado.busca = busca.value; desenhaLista(); $('[data-busca]').focus(); });
  }
  $('[data-novo]', el).addEventListener('click', () => abre('__novo'));
  el.querySelectorAll('.item').forEach((it) => it.addEventListener('click', (ev) => {
    const mover = ev.target.closest('[data-mover]');
    if (mover) { ev.stopPropagation(); return move(it.dataset.slug, Number(mover.dataset.mover)); }
    abre(it.dataset.slug);
  }));
}

function move(slug, delta) {
  const p = estado.dados.profissionais.find((x) => x.slug === slug);
  const grupo = estado.dados.profissionais.filter((x) => x.categoria === p.categoria).sort((a, b) => a.ordem - b.ordem);
  const i = grupo.indexOf(p);
  const outro = grupo[i + delta];
  if (!outro) return;
  grupo.splice(i, 1);
  grupo.splice(i + delta, 0, p);
  grupo.forEach((x, n) => { x.ordem = n + 1; });
  estado.alterados.add('profissionais');
  estado.sujo = true;
  desenha();
}

function abre(slug) {
  if (estado.rascunhoSujo && !confirm('Descartar as alterações não publicadas deste item?')) return;
  estado.rascunhoSujo = false;
  estado.sujo = estado.alterados.size > 0;
  estado.atual = slug;
  const lista = estado.dados[estado.aba];
  if (slug === '__novo') {
    estado.rascunho = estado.aba === 'profissionais'
      ? { slug: '', nome: '', categoria: 'parceiro', ordem: 99, titulo: '', foto: '', email: '', links: [], curriculo: '', resumo: '', obras: [] }
      : { slug: '', titulo: '', data: hoje(), autor: '', tipo: 'artigo', resumo: '', conteudo: '', capa: null, legado: null };
  } else {
    estado.rascunho = structuredClone(lista.find((x) => x.slug === slug));
  }
  desenha();
  scrollTo({ top: 0 });
}

// ---------- Editor ----------
function marcaSujo() { estado.sujo = true; estado.rascunhoSujo = true; desenhaRodape(); }

function campo(rotulo, nome, valor, { tipo = 'text', ajuda = '', extra = '' } = {}) {
  return `<label>${rotulo}${ajuda ? ` <span class="ajuda">${ajuda}</span>` : ''}<input type="${tipo}" data-campo="${nome}" value="${esc(valor)}" ${extra}></label>`;
}

function select(rotulo, nome, valor, opcoes) {
  return `<label>${rotulo}<select data-campo="${nome}">${opcoes.map(([v, t]) => `<option value="${v}"${v === valor ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`;
}

function barraRich(opcoesExtras) {
  const botoes = [['bold', '<b>N</b>', 'Negrito'], ['italic', '<i>I</i>', 'Itálico'], ['insertUnorderedList', '• Lista', 'Lista'],
    ['h3', 'Título', 'Subtítulo'], ['blockquote', '❝ Citação', 'Citação'], ['link', '🔗 Link', 'Link'], ...opcoesExtras,
    ['removeFormat', 'Limpar', 'Limpar formatação']];
  return `<div class="barra">${botoes.map(([cmd, rot, titulo]) => `<button type="button" data-cmd="${cmd}" title="${titulo}">${rot}</button>`).join('')}</div>`;
}

function desenhaEditor() {
  const el = $('#editor');
  const r = estado.rascunho;
  if (!r) {
    el.innerHTML = `<p class="vazio">Escolha um item na lista ao lado ou clique em “${estado.aba === 'profissionais' ? 'Novo profissional' : 'Nova publicação'}”.</p>`;
    return;
  }
  el.innerHTML = estado.aba === 'profissionais' ? formProfissional(r) : formPublicacao(r);
  ligaCampos(el, r);
  ligaRich(el, r, estado.aba === 'profissionais' ? 'curriculo' : 'conteudo');
}

function formProfissional(r) {
  const novo = estado.atual === '__novo';
  const obras = r.obras.map((o, i) => `<div class="linha" data-i="${i}">
      <input placeholder="Título da obra" data-obra="titulo" value="${esc(o.titulo)}">
      <input placeholder="Editora / edição" data-obra="detalhe" value="${esc(o.detalhe)}">
      <input placeholder="Ano" data-obra="ano" value="${esc(o.ano)}">
      <input class="url" placeholder="Link da editora (opcional): https://..." data-obra="url" value="${esc(o.url || '')}">
      <span class="mini"><button type="button" data-obra-mover="-1" aria-label="Subir">▲</button><button type="button" data-obra-mover="1" aria-label="Descer">▼</button><button type="button" data-obra-remover aria-label="Remover">✕</button></span></div>`).join('');
  const links = r.links.map((l, i) => `<div class="linha link" data-i="${i}">
      <input placeholder="Rótulo (ex.: LinkedIn)" data-link="rotulo" value="${esc(l.rotulo)}">
      <input placeholder="https://..." data-link="url" value="${esc(l.url)}">
      <span class="mini"><button type="button" data-link-remover aria-label="Remover">✕</button></span></div>`).join('');
  return `<h2>${novo ? 'Novo profissional' : esc(r.nome)}</h2>
  <div class="campos">
    <div class="dupla">${campo('Nome completo*', 'nome', r.nome, { extra: 'required' })}${campo('Título exibido*', 'titulo', r.titulo, { ajuda: 'ex.: Sócia, Correspondente em Brasília' })}</div>
    <div class="dupla">${select('Categoria*', 'categoria', r.categoria, CATEGORIAS)}${campo('E-mail', 'email', r.email, { tipo: 'email' })}</div>
    <div class="foto"><img src="${esc(previa(r.foto))}" alt="" data-previa-foto><label>Foto* <span class="ajuda">JPG, PNG ou WebP; é reduzida automaticamente</span><input type="file" accept="image/jpeg,image/png,image/webp" data-foto></label></div>
    <div><label>Currículo*</label>${barraRich([])}<div class="rich" contenteditable="true" data-rich></div></div>
    <label>Resumo para o Google <span class="ajuda">até 160 caracteres; se ficar vazio, é gerado do currículo</span><textarea data-campo="resumo" maxlength="160" rows="2">${esc(r.resumo)}</textarea></label>
    <div class="linhas"><label>Links <span class="ajuda">opcional (LinkedIn, Lattes…)</span></label>${links}<button type="button" class="add" data-link-add>+ Adicionar link</button></div>
    <div class="linhas"><label>Obras publicadas <span class="ajuda">aparecem como capas no perfil; com link, a capa abre a página da editora</span></label>${obras}<button type="button" class="add" data-obra-add>+ Adicionar obra</button></div>
    ${novo ? '' : '<div><button type="button" class="btn perigo" data-remover>Remover profissional do site</button></div>'}
  </div>`;
}

function formPublicacao(r) {
  const novo = estado.atual === '__novo';
  const autores = [...new Set([...estado.dados.profissionais.map((p) => p.nome), ...estado.dados.publicacoes.map((p) => p.autor)])].sort();
  return `<h2>${novo ? 'Nova publicação' : 'Editar publicação'}</h2>
  <div class="campos">
    ${campo('Título*', 'titulo', r.titulo, { extra: 'required' })}
    <div class="dupla">${campo('Data*', 'data', r.data, { tipo: 'date', extra: 'required' })}${select('Tipo*', 'tipo', r.tipo, TIPOS)}</div>
    <label>Autor*<input data-campo="autor" list="autores" value="${esc(r.autor)}" required><datalist id="autores">${autores.map((a) => `<option value="${esc(a)}">`).join('')}</datalist></label>
    <label>Resumo <span class="ajuda">aparece no cartão da lista; se ficar vazio, é gerado do texto</span><textarea data-campo="resumo" rows="3" maxlength="220">${esc(r.resumo)}</textarea></label>
    <div class="foto"><img src="${esc(previa(r.capa || ''))}" alt="" data-previa-foto><label>Imagem de capa <span class="ajuda">opcional; usada na prévia do WhatsApp/LinkedIn</span><input type="file" accept="image/jpeg,image/png,image/webp" data-foto></label></div>
    <div><label>Conteúdo*</label>${barraRich([['imagem', '🖼 Imagem', 'Inserir imagem'], ['youtube', '▶ YouTube', 'Inserir vídeo do YouTube'], ['pdf', '📄 PDF', 'Anexar PDF']])}<div class="rich" contenteditable="true" data-rich></div></div>
    ${novo ? '' : '<div><button type="button" class="btn perigo" data-remover>Remover publicação do site</button></div>'}
  </div>`;
}

// Arquivos enviados nesta sessão ainda não existem no site: a prévia usa a cópia local.
const previasLocais = new Map();
function previa(caminho) { return previasLocais.get(caminho) || caminho || ''; }

function ligaCampos(el, r) {
  el.querySelectorAll('[data-campo]').forEach((c) => c.addEventListener('input', () => { r[c.dataset.campo] = c.value; marcaSujo(); }));

  const foto = $('[data-foto]', el);
  foto.addEventListener('change', async () => {
    const arq = foto.files[0];
    if (!arq) return;
    const erro = checkFile(arq, { tipos: IMAGENS, maxBytes: 20 * 1024 * 1024 });
    if (erro) { aviso(erro, 'erro'); foto.value = ''; return; }
    const { blob, ext } = await resizeImage(arq, estado.aba === 'profissionais' ? { maxW: 900 } : {});
    const grande = checkFile(blob, { tipos: IMAGENS });
    if (grande) { aviso(grande, 'erro'); foto.value = ''; return; }
    const pasta = estado.aba === 'profissionais' ? 'profissionais' : 'publicacoes';
    const caminho = `uploads/${pasta}/${nomeArquivo(r.nome || r.titulo || arq.name, ext)}`;
    estado.arquivos.set(caminho, await paraBase64(blob));
    previasLocais.set(`/${caminho}`, URL.createObjectURL(blob));
    if (estado.aba === 'profissionais') r.foto = `/${caminho}`; else r.capa = `/${caminho}`;
    estado.rascunhoSujo = true;
    $('[data-previa-foto]', el).src = previa(`/${caminho}`);
    marcaSujo();
  });

  const redesenha = () => { desenhaEditor(); marcaSujo(); };
  el.querySelector('[data-obra-add]')?.addEventListener('click', () => { r.obras.push({ titulo: '', detalhe: '', ano: '', url: '' }); redesenha(); });
  el.querySelector('[data-link-add]')?.addEventListener('click', () => { r.links.push({ rotulo: '', url: '' }); redesenha(); });
  el.querySelectorAll('[data-obra]').forEach((c) => c.addEventListener('input', () => {
    r.obras[c.closest('.linha').dataset.i][c.dataset.obra] = c.value; marcaSujo();
  }));
  el.querySelectorAll('[data-link]').forEach((c) => c.addEventListener('input', () => {
    r.links[c.closest('.linha').dataset.i][c.dataset.link] = c.value; marcaSujo();
  }));
  el.querySelectorAll('[data-obra-remover]').forEach((b) => b.addEventListener('click', () => {
    r.obras.splice(b.closest('.linha').dataset.i, 1); redesenha();
  }));
  el.querySelectorAll('[data-link-remover]').forEach((b) => b.addEventListener('click', () => {
    r.links.splice(b.closest('.linha').dataset.i, 1); redesenha();
  }));
  el.querySelectorAll('[data-obra-mover]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.closest('.linha').dataset.i);
    const j = i + Number(b.dataset.obraMover);
    if (j < 0 || j >= r.obras.length) return;
    [r.obras[i], r.obras[j]] = [r.obras[j], r.obras[i]];
    redesenha();
  }));
  el.querySelector('[data-remover]')?.addEventListener('click', remover);
}

// ---------- Texto formatado ----------
function ligaRich(el, r, chave) {
  const rich = $('[data-rich]', el);
  rich.innerHTML = paraEdicao(r[chave] || '');
  const salva = () => { r[chave] = deEdicao(rich); marcaSujo(); };
  rich.addEventListener('input', salva);
  rich.addEventListener('paste', (ev) => {
    const html = ev.clipboardData.getData('text/html');
    if (!html) return;
    ev.preventDefault();
    document.execCommand('insertHTML', false, limpaColagem(html));
  });
  el.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', async () => {
    rich.focus();
    const cmd = b.dataset.cmd;
    if (cmd === 'h3' || cmd === 'blockquote') document.execCommand('formatBlock', false, cmd);
    else if (cmd === 'link') {
      const url = prompt('Endereço do link (https://...)');
      if (url && /^https?:\/\//.test(url)) document.execCommand('createLink', false, url);
    } else if (cmd === 'youtube') {
      const html = youtubeEmbedHtml(prompt('Cole o endereço do vídeo do YouTube') || '');
      if (html) document.execCommand('insertHTML', false, html);
      else aviso('Endereço do YouTube não reconhecido.', 'erro');
    } else if (cmd === 'imagem' || cmd === 'pdf') {
      await anexa(cmd, rich);
    } else document.execCommand(cmd, false);
    salva();
  }));
}

// No editor, imagens recém-enviadas aparecem pela cópia local; ao salvar, voltam ao caminho definitivo.
function paraEdicao(html) {
  return html.replace(/src="(\/uploads\/[^"]+)"/g, (m, c) => (previasLocais.has(c) ? `src="${previasLocais.get(c)}" data-caminho="${c}"` : m));
}
function deEdicao(rich) {
  const copia = rich.cloneNode(true);
  copia.querySelectorAll('img[data-caminho]').forEach((img) => { img.setAttribute('src', img.dataset.caminho); img.removeAttribute('data-caminho'); });
  return copia.innerHTML;
}

function limpaColagem(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,meta,link,o\\:p').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((n) => { for (const a of [...n.attributes]) if (!['href', 'src', 'alt'].includes(a.name)) n.removeAttribute(a.name); });
  return doc.body.innerHTML;
}

function escolheArquivo(accept) {
  return new Promise((ok) => {
    const i = Object.assign(document.createElement('input'), { type: 'file', accept });
    i.onchange = () => ok(i.files[0] || null);
    i.click();
  });
}

async function anexa(tipo, rich) {
  const arq = await escolheArquivo(tipo === 'pdf' ? 'application/pdf' : IMAGENS.join(','));
  if (!arq) return;
  rich.focus();
  if (tipo === 'pdf') {
    const erro = checkFile(arq, { tipos: ['application/pdf'] });
    if (erro) return aviso(erro, 'erro');
    const caminho = `uploads/publicacoes/${nomeArquivo(arq.name, 'pdf')}`;
    estado.arquivos.set(caminho, await paraBase64(arq));
    document.execCommand('insertHTML', false, `<p><a href="/${caminho}" target="_blank">📄 Baixar PDF: ${esc(arq.name)}</a></p>`);
    return;
  }
  const erro = checkFile(arq, { tipos: IMAGENS, maxBytes: 20 * 1024 * 1024 });
  if (erro) return aviso(erro, 'erro');
  const { blob, ext } = await resizeImage(arq);
  const grande = checkFile(blob, { tipos: IMAGENS });
  if (grande) return aviso(grande, 'erro');
  const caminho = `uploads/publicacoes/${nomeArquivo(arq.name, ext)}`;
  estado.arquivos.set(caminho, await paraBase64(blob));
  const local = URL.createObjectURL(blob);
  previasLocais.set(`/${caminho}`, local);
  document.execCommand('insertHTML', false, `<p><img src="${local}" data-caminho="/${caminho}" alt="${esc(arq.name.replace(/\.[^.]+$/, ''))}"></p>`);
}

// ---------- Publicar ----------
function desenhaRodape() {
  let el = $('.rodape-editor');
  if (!el) {
    el = document.createElement('div');
    el.className = 'rodape-editor';
    el.innerHTML = '<span class="estado"></span><button type="button" class="btn" data-descartar>Descartar</button><button type="button" class="btn p" data-publicar>Publicar</button>';
    $('#tela-painel').append(el);
    $('[data-publicar]', el).addEventListener('click', publicar);
    $('[data-descartar]', el).addEventListener('click', () => {
      if (confirm('Descartar todas as alterações não publicadas?')) location.reload();
    });
  }
  el.hidden = !estado.sujo;
  $('.estado', el).textContent = estado.sujo ? 'Alterações não publicadas' : '';
}

function confere(r) {
  if (estado.aba === 'profissionais') {
    if (!r.nome.trim()) return 'Preencha o nome.';
    if (!r.titulo.trim()) return 'Preencha o título exibido.';
    if (!r.foto) return 'Envie uma foto.';
    if (!textoDe(r.curriculo)) return 'Preencha o currículo.';
    if (r.obras.some((o) => !o.titulo.trim())) return 'Há uma obra sem título.';
    if (r.obras.some((o) => o.url && !/^https?:\/\/\S+$/.test(o.url))) return 'Link de obra inválido: comece com https://';
  } else {
    if (!r.titulo.trim()) return 'Preencha o título.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.data)) return 'Escolha a data.';
    if (!r.autor.trim()) return 'Preencha o autor.';
    if (!textoDe(r.conteudo) && !/<img/.test(r.conteudo)) return 'Preencha o conteúdo.';
  }
  return null;
}

// Junta o rascunho à lista (idempotente: pode rodar de novo depois de um novo login).
function aplicaRascunho() {
  const r = estado.rascunho;
  if (!r || !estado.rascunhoSujo) return null;
  const erro = confere(r);
  if (erro) return erro;
  const lista = estado.dados[estado.aba];
  if (estado.atual === '__novo') {
    r.slug = uniqueSlug(slugify(estado.aba === 'profissionais' ? r.nome : r.titulo) || 'item', lista.map((x) => x.slug));
    if (estado.aba === 'profissionais') {
      r.ordem = Math.max(0, ...lista.filter((x) => x.categoria === r.categoria).map((x) => x.ordem)) + 1;
    }
    lista.push(r);
  } else {
    lista.splice(lista.findIndex((x) => x.slug === estado.atual), 1, r);
  }
  const texto = textoDe(estado.aba === 'profissionais' ? r.curriculo : r.conteudo);
  if (!r.resumo.trim()) r.resumo = resumir(texto, estado.aba === 'profissionais' ? 160 : 220);
  if (estado.aba === 'profissionais') {
    r.links = r.links.filter((l) => l.url.trim())
      .map((l) => ({ ...l, url: /^https?:\/\//i.test(l.url.trim()) ? l.url.trim() : `https://${l.url.trim()}` }));
  }
  estado.alterados.add(estado.aba);
  estado.rascunhoSujo = false;
  estado.atual = r.slug;
  return null;
}

async function enviaTudo() {
  // Um arquivo por requisição (limite de tamanho da função); por último os dados.
  for (const [path, base64] of estado.arquivos) {
    await api('save', { metodo: 'POST', corpo: { mensagem: `envia ${path.split('/').pop()}`, arquivos: [{ path, base64 }] } });
    estado.arquivos.delete(path);
  }
  const json = {};
  for (const k of ['profissionais', 'publicacoes']) if (estado.alterados.has(k)) json[k] = estado.dados[k];
  if (Object.keys(json).length) {
    const mensagem = estado.mensagem
      || `atualiza ${estado.rascunho ? (estado.rascunho.nome || estado.rascunho.titulo) : 'ordem da equipe'}`;
    const base = Object.fromEntries(Object.keys(json).map((k) => [k, estado.dados.shas[k]]));
    const r = await api('save', { metodo: 'POST', corpo: { mensagem, json, base, arquivos: [] } });
    for (const k of Object.keys(json)) estado.dados.shas[k] = r.shas[`content/${k}.json`];
  }
}

async function publicar() {
  const erro = aplicaRascunho();
  if (erro) return aviso(erro, 'erro');
  const botao = $('[data-publicar]');
  botao.disabled = true;
  aviso('Publicando…');
  try {
    await enviaTudo();
    estado.alterados.clear();
    estado.sujo = false;
    aviso('Publicado. O site atualiza em cerca de 1 minuto.', 'ok');
    estado.rascunho = estado.atual ? structuredClone(estado.dados[estado.aba].find((x) => x.slug === estado.atual)) : null;
    desenha();
  } catch (e) {
    if (e instanceof SessaoExpirada) {
      aviso('');
      $('#relogin').showModal();
    } else aviso(e.message, 'erro');
  } finally {
    botao.disabled = false;
  }
}

$('#form-relogin').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  if (await entrar(ev.target)) { $('#relogin').close(); publicar(); }
});

async function remover() {
  const r = estado.rascunho;
  const nome = r.nome || r.titulo;
  if (!confirm(`Remover “${nome}” do site? Isso será publicado agora.`)) return;
  const lista = estado.dados[estado.aba];
  lista.splice(lista.findIndex((x) => x.slug === estado.atual), 1);
  estado.alterados.add(estado.aba);
  estado.atual = null;
  estado.rascunho = null;
  estado.rascunhoSujo = false;
  estado.sujo = true;
  estado.mensagem = `remove ${nome}`;
  try { await publicar(); } finally { estado.mensagem = null; }
}

iniciar();
