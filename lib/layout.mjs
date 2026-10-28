// Estrutura comum das páginas públicas: <head>, cabeçalho, rodapé e aviso de cookies.
import { esc } from './html.mjs';
import { headTags, jsonLd } from './seo.mjs';

export const MENU = [
  ['/escritorio', 'Escritório'],
  ['/areas-de-atuacao', 'Áreas de atuação'],
  ['/profissionais', 'Profissionais'],
  ['/publicacoes', 'Publicações'],
];

const ICONE = {
  Instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.2.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 4 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z"/></svg>',
  LinkedIn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.5H3.5V9h3.6v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z"/></svg>',
};

function cabecalho(active) {
  const links = MENU.map(([href, rotulo]) =>
    `<a href="${href}"${active === href ? ' aria-current="page"' : ''}>${rotulo}</a>`).join('');
  return `<header class="site-header">
  <div class="wrap">
    <a class="logo" href="/" aria-label="Franceschini e Miranda Advogados — página inicial"></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" aria-label="Abrir menu"><span></span><span></span><span></span></button>
    <nav id="menu" aria-label="Principal">${links}<a href="/contato" class="cta"${active === '/contato' ? ' aria-current="page"' : ''}>Contato</a></nav>
  </div>
</header>`;
}

function rodape(site) {
  const e = site.endereco;
  const redes = site.redes.map((r) =>
    `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(r.rotulo)}">${ICONE[r.rotulo] || esc(r.rotulo)}</a>`).join('');
  const nav = [...MENU, ['/contato', 'Contato']].map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('');
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="top">
      <div><span class="logo" role="img" aria-label="${esc(site.nome)}"></span><p>Advocacia empresarial desde ${esc(site.fundacao)}.</p><a class="fbtn" href="/contato">Enviar mensagem →</a></div>
      <div><h2 class="fh">Navegação</h2><ul>${nav}</ul></div>
      <div><h2 class="fh">Endereço</h2><p>${esc(e.rua)}<br>${esc(e.bairro)} · ${esc(e.cidade)} · ${esc(e.uf)}<br>${esc(e.cep)}</p></div>
      <div><h2 class="fh">Contato</h2><p><a href="tel:${esc(site.telefoneLink)}">${esc(site.telefone)}</a><br><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p><div class="redes">${redes}</div></div>
    </div>
    <div class="bottom">
      <span>© ${new Date().getFullYear()} ${esc(site.nome)}. Todos os direitos reservados.</span>
      <a href="/politica-de-privacidade">Política de privacidade</a>
      <a class="credito" href="${esc(site.credito.url)}" target="_blank" rel="noopener noreferrer">Desenvolvido por <img src="${esc(site.credito.logo)}" alt="" width="24" height="24"> ${esc(site.credito.texto)}</a>
    </div>
  </div>
</footer>`;
}

const COOKIES = `<div class="cookies" id="cookies" role="dialog" aria-live="polite" aria-label="Privacidade e cookies" hidden>
  <p>Usamos cookies para medir o acesso e o desempenho de anúncios. Saiba mais na <a href="/politica-de-privacidade">Política de Privacidade</a>.</p>
  <div class="cookies-btns">
    <button type="button" data-cookies="rejeitar">Rejeitar</button>
    <button type="button" data-cookies="aceitar" class="p">Aceitar</button>
  </div>
</div>`;

function gtag(adsId) {
  return `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});
try{if(localStorage.getItem('fm-cookies')==='aceito')gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'})}catch(e){}
gtag('js',new Date());gtag('config','${adsId}');</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${adsId}"></script>`;
}

export function page({ site, title, description, path, body, active, image, type, ld = [], noindex = false, bodyClass = '' }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${headTags({ site, title, description, path, image, type, noindex })}
<link rel="icon" href="/assets/img/favicon.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
${gtag(site.adsId)}
${ld.map(jsonLd).join('\n')}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
${cabecalho(active)}
<main id="conteudo">
${body}
</main>
${rodape(site)}
${COOKIES}
<script src="/assets/js/fm-config.js"></script>
<script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
}
