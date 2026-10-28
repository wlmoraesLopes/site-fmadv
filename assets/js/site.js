// Comportamentos do site público: menu, cookies/consentimento, conversões, áreas e filtros.
(function () {
  var cfg = window.FM_ADS || { id: '', conversoes: {} };

  function guarda(chave, valor) { try { localStorage.setItem(chave, valor); } catch (e) { /* sem storage */ } }
  function le(chave) { try { return localStorage.getItem(chave); } catch (e) { return null; } }

  // Menu hambúrguer
  var botao = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  if (botao && menu) {
    botao.addEventListener('click', function () {
      var aberto = botao.getAttribute('aria-expanded') === 'true';
      botao.setAttribute('aria-expanded', String(!aberto));
      botao.setAttribute('aria-label', aberto ? 'Abrir menu' : 'Fechar menu');
      menu.classList.toggle('aberto', !aberto);
    });
  }

  // Aviso de cookies + Consent Mode v2
  var aviso = document.getElementById('cookies');
  if (aviso && !le('fm-cookies')) aviso.hidden = false;
  document.querySelectorAll('[data-cookies]').forEach(function (b) {
    b.addEventListener('click', function () {
      var aceitou = b.getAttribute('data-cookies') === 'aceitar';
      guarda('fm-cookies', aceitou ? 'aceito' : 'recusado');
      if (aceitou && window.gtag) {
        gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
      }
      aviso.hidden = true;
    });
  });

  // Conversões do Google Ads (só disparam se o rótulo estiver configurado)
  window.fmConversao = function (nome) {
    var rotulo = cfg.conversoes && cfg.conversoes[nome];
    if (rotulo && window.gtag) gtag('event', 'conversion', { send_to: cfg.id + '/' + rotulo });
  };
  document.querySelectorAll('[data-conversao]').forEach(function (el) {
    el.addEventListener('click', function () { window.fmConversao(el.getAttribute('data-conversao')); });
  });

  // Áreas de atuação: abre a área indicada no endereço (#societario)
  function abreArea() {
    var id = decodeURIComponent(location.hash.slice(1));
    var alvo = id && document.getElementById(id);
    if (alvo && alvo.tagName === 'DETAILS') { alvo.open = true; alvo.scrollIntoView(); }
  }
  if (document.querySelector('details.area')) { abreArea(); window.addEventListener('hashchange', abreArea); }

  // Publicações: filtros por tipo e autor, com estado no endereço (?tipo=livro&autor=...)
  var lista = document.querySelector('[data-pubs]');
  if (lista) {
    var cards = lista.querySelectorAll('.pubc');
    var chips = document.querySelectorAll('[data-filtro-tipo]');
    var seletor = document.querySelector('[data-filtro-autor]');
    var vazio = document.querySelector('[data-vazio]');
    var params = new URLSearchParams(location.search);
    var estado = { tipo: params.get('tipo') || '', autor: params.get('autor') || '' };

    function aplica() {
      var n = 0;
      cards.forEach(function (c) {
        var ok = (!estado.tipo || c.dataset.tipo === estado.tipo) && (!estado.autor || c.dataset.autor === estado.autor);
        c.hidden = !ok;
        if (ok) n++;
      });
      chips.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filtroTipo === estado.tipo)); });
      if (seletor) seletor.value = estado.autor;
      if (vazio) vazio.hidden = n > 0;
      var q = new URLSearchParams();
      if (estado.tipo) q.set('tipo', estado.tipo);
      if (estado.autor) q.set('autor', estado.autor);
      var s = q.toString();
      history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
    }
    chips.forEach(function (b) { b.addEventListener('click', function () { estado.tipo = b.dataset.filtroTipo; aplica(); }); });
    if (seletor) seletor.addEventListener('change', function () { estado.autor = seletor.value; aplica(); });
    aplica();
  }

  // Formulário de contato → Google Forms (mesmo destino do site anterior)
  var form = document.querySelector('form[data-google-form]');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var status = form.querySelector('.status');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var dados = new FormData();
      form.querySelectorAll('[data-entry]').forEach(function (campo) { dados.append(campo.dataset.entry, campo.value.trim()); });
      var botaoEnviar = form.querySelector('button[type=submit]');
      botaoEnviar.disabled = true;
      status.className = 'status';
      status.textContent = 'Enviando…';
      fetch(form.dataset.googleForm, { method: 'POST', mode: 'no-cors', body: dados })
        .then(function () {
          status.className = 'status ok';
          status.textContent = 'Mensagem enviada. Retornaremos em breve.';
          form.reset();
          window.fmConversao('contato');
        })
        .catch(function () {
          status.className = 'status erro';
          status.textContent = 'Não foi possível enviar agora. Tente novamente ou escreva para ' + form.dataset.email + '.';
        })
        .then(function () { botaoEnviar.disabled = false; });
    });
  }
})();
