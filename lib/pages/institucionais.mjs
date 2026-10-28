// Escritório, Áreas de atuação, Contato, Política de Privacidade e 404.
import { esc } from '../html.mjs';
import { page } from '../layout.mjs';
import { legalServiceLd } from '../seo.mjs';
import { cabecalhoPagina } from './partes.mjs';

export function escritorio({ site, areas, noindex }) {
  const body = `${cabecalhoPagina({ eyebrow: 'O escritório', titulo: 'Escritório' })}
<div class="section-pad"><div class="wrap narrow prose">
  ${site.escritorio.map((p) => `<p>${esc(p)}</p>`).join('\n  ')}
  <h3>Áreas de atuação</h3>
  <p>${areas.areas.map((a) => `<a href="/areas-de-atuacao#${a.slug}">${esc(a.nome)}</a>`).join(' · ')}</p>
  <p><a href="/areas-de-atuacao">Ver todas as áreas de atuação</a></p>
</div></div>`;
  return {
    path: '/escritorio',
    html: page({
      site, title: 'Escritório', path: '/escritorio', body, noindex, active: '/escritorio',
      description: 'Fundado em 1992 em São Paulo, o escritório atua em direito empresarial, consultivo e contencioso, com correspondentes nos EUA e na Europa.',
    }),
  };
}

export function areasDeAtuacao({ site, areas, noindex }) {
  const itens = areas.areas.map((a, i) => `<details class="area" id="${a.slug}">
  <summary><span class="n">${String(i + 1).padStart(2, '0')}</span><h2>${esc(a.nome)}</h2><i aria-hidden="true">+</i></summary>
  <div class="corpo"><p>${esc(a.abertura)}</p><ul>${a.itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
</details>`).join('\n');
  const body = `${cabecalhoPagina({ eyebrow: 'Serviços', titulo: 'Áreas de atuação', lead: 'Assessoria consultiva e contenciosa para empresas, perante o Poder Judiciário e os órgãos administrativos.' })}
<div class="section-pad"><div class="wrap"><div class="areas-list">
${itens}
</div><p class="nota">${esc(areas.nota)}</p></div></div>`;
  return {
    path: '/areas-de-atuacao',
    html: page({
      site, title: 'Áreas de atuação', path: '/areas-de-atuacao', body, noindex, active: '/areas-de-atuacao',
      description: 'Direito da Concorrência, Societário, Civil, Comercial e do Consumidor, Trabalhista, Penal Empresarial e Administrativo.',
    }),
  };
}

export function contato({ site, noindex }) {
  const f = site.googleForm;
  const e = site.endereco;
  const c = (nome, rotulo, tipo, extra = '') =>
    `<label>${rotulo}<input type="${tipo}" name="${nome}" data-entry="${f.campos[nome]}" ${extra}></label>`;
  const mapa = `https://maps.google.com/maps?q=${site.geo.lat},${site.geo.lng}&z=16&output=embed`;
  const body = `${cabecalhoPagina({ eyebrow: 'Contato', titulo: 'Fale com o escritório' })}
<div class="section-pad"><div class="wrap contato">
  <form class="form" data-google-form="${esc(f.url)}" data-email="${esc(site.email)}" novalidate>
    <div class="dupla">${c('nome', 'Nome*', 'text', 'required autocomplete="name"')}${c('email', 'E-mail*', 'email', 'required autocomplete="email"')}</div>
    <div class="dupla">${c('telefone', 'Telefone*', 'tel', 'required autocomplete="tel"')}${c('empresa', 'Empresa', 'text', 'autocomplete="organization"')}</div>
    <label>Assunto<select name="assunto" data-entry="${f.campos.assunto}"><option value="">Selecione o assunto…</option>${f.assuntos.map((a) => `<option>${esc(a)}</option>`).join('')}</select></label>
    <label>Mensagem*<textarea name="mensagem" data-entry="${f.campos.mensagem}" required></textarea></label>
    <div><button class="btn p" type="submit">Enviar mensagem</button></div>
    <p class="status" role="status"></p>
  </form>
  <div class="info-contato">
    <h2>São Paulo</h2>
    <p>${esc(e.rua)}<br>${esc(e.bairro)} · ${esc(e.cidade)} · ${esc(e.uf)}<br>CEP ${esc(e.cep)}</p>
    <p><a href="tel:${esc(site.telefoneLink)}">${esc(site.telefone)}</a><br><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
    <iframe class="mapa" src="${esc(mapa)}" title="Mapa: localização do escritório" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    <p><a href="https://maps.google.com/?q=${site.geo.lat},${site.geo.lng}" target="_blank" rel="noopener noreferrer">Abrir no Google Maps →</a></p>
  </div>
</div></div>`;
  return {
    path: '/contato',
    html: page({
      site, title: 'Contato', path: '/contato', body, noindex, active: '/contato',
      description: 'Endereço em Santo Amaro, São Paulo/SP, telefone, e-mail e formulário de contato do escritório Franceschini e Miranda Advogados.',
      ld: [legalServiceLd(site)],
    }),
  };
}

export function privacidade({ site, noindex }) {
  const body = `${cabecalhoPagina({ eyebrow: 'Privacidade', titulo: 'Política de Privacidade' })}
<!-- Texto padrão: revisar com os sócios. -->
<div class="section-pad"><div class="wrap narrow prose">
  <p>Esta política explica como ${esc(site.nome)} (CNPJ ${esc(site.cnpj)}) trata os dados pessoais de quem visita este site, em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).</p>
  <h3>Dados que coletamos</h3>
  <p>Quando você envia o formulário de contato, recebemos nome, e-mail, telefone, empresa, assunto e mensagem. Usamos esses dados apenas para responder ao seu contato e não os compartilhamos para fins comerciais.</p>
  <h3>Cookies</h3>
  <p>Usamos cookies essenciais ao funcionamento do site. Com o seu consentimento, usamos também cookies de medição e de publicidade do Google Ads, que nos ajudam a avaliar o resultado dos nossos anúncios. Você pode aceitar ou recusar esses cookies no aviso exibido na primeira visita; para rever a escolha, limpe os dados de navegação deste site no seu navegador.</p>
  <h3>Google Ads</h3>
  <p>O Google pode usar cookies para medir conversões (por exemplo, o envio do formulário) quando você consente. O tratamento feito pelo Google segue a política de privacidade do próprio Google.</p>
  <h3>Seus direitos</h3>
  <p>Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade ou eliminação dos seus dados, além de revogar o consentimento.</p>
  <h3>Contato</h3>
  <p>Para exercer seus direitos ou tirar dúvidas, escreva para <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>.</p>
</div></div>`;
  return {
    path: '/politica-de-privacidade',
    html: page({
      site, title: 'Política de Privacidade', path: '/politica-de-privacidade', body, noindex,
      description: 'Como o escritório trata dados pessoais e cookies no site, nos termos da LGPD, e como exercer seus direitos de titular.',
    }),
  };
}

export function naoEncontrada({ site }) {
  const body = `${cabecalhoPagina({ eyebrow: 'Erro 404', titulo: 'Página não encontrada', lead: 'O endereço pode ter mudado. Use o menu acima ou volte para a <a class="more" href="/">página inicial</a>.' })}`;
  return {
    arquivo: '404.html', sitemap: false,
    html: page({ site, title: 'Página não encontrada', path: '/404', body, noindex: true, description: 'Página não encontrada.' }),
  };
}
