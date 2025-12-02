#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador de Notícias – Franceschini e Miranda
Zero HTML para o usuário: apenas cole e clique.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import os
import json

def gerar():
    titulo = entrada_titulo.get().strip()
    autor = entrada_autor.get().strip()
    cargo = entrada_cargo.get().strip()
    numero = combo_numero.get().strip()
    textoPuro = texto_noticia.get("1.0", tk.END).strip()

    if not titulo or not autor or not cargo or not textoPuro:
        messagebox.showwarning("Atenção", "Preencha todos os campos.")
        return

    # CORREÇÃO: Envolve cada parágrafo em <p> e trata destaques legais
    paragrafos = textoPuro.split('\n')
    paragrafos_html = []
    
    for p in paragrafos:
        p = p.strip()
        if p:
            # Se o parágrafo começa com [DESTAQUE], usa a classe especial
            if p.startswith('[DESTAQUE]'):
                p = p.replace('[DESTAQUE]', '').strip()
                paragrafos_html.append(f'<div class="destaque-legal">{p}</div>')
            else:
                paragrafos_html.append(f'<p>{p}</p>')
    
    conteudo_html = '\n    '.join(paragrafos_html)

    # JavaScript escapado (sem conflito com f-string)
    js_compartilhar = """
function compartilharNoticia(titulo, url) {
  if (navigator.share) { navigator.share({ title: titulo, url: url }); } 
  else { window.open('https://wa.me/?text=' + encodeURIComponent(titulo + ' - ' + url), '_blank'); }
}
""".strip()

    html_final = f"""<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>{titulo} | Franceschini e Miranda</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
:root {{ --vinho: #7b0606; --dourado: #f3a600; --creme: #fdf6ee; }}
body{{margin:0;font-family:'Inter',sans-serif;background:var(--creme);color:#232231;line-height:1.8}}
a{{color:var(--dourado);text-decoration:none}}a:hover{{text-decoration:underline}}

/* HEADER PADRONIZADO E CENTRALIZADO */
.header-fixed{{position:fixed;top:0;left:0;right:0;z-index:50;background:var(--vinho);box-shadow:0 2px 18px #4b060677}}
.topbar{{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:3px 5vw 1px 5vw;min-height:78px}}
.logo-center-projection{{text-align:center}}
.logo-img-fm{{max-width:350px;width:96%;min-width:180px;height:auto;display:block;margin:0 auto}}
.contact-top{{text-align:right;font-size:1.1em;color:var(--creme)}}
.social-links a{{color:#fff;background:#630303;border-radius:50%;padding:7px 0;margin-left:7px;width:38px;display:inline-block;text-align:center;transition:background .2s,color .2s;font-size:1.18em;vertical-align:middle}}
.social-links a:hover{{background:var(--dourado);color:var(--vinho)}}
nav{{display:flex;justify-content:center;gap:66px;padding:16px 0;font-size:1.22em;font-weight:600;letter-spacing:.12em}}
nav a{{color:var(--creme);text-decoration:none;padding-bottom:3px;transition:color .2s}}nav a:hover,nav a.active{{color:var(--dourado);border-bottom:2px solid #fdeede}}
.header-spacer{{height:190px}}

/* BARRA LATERAL DECORATIVA */
body::before {{
  content: "";
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background: linear-gradient(to bottom, var(--vinho), var(--dourado));
  opacity: 0.03;
  z-index: -1;
}}

/* CONTEÚDO DA NOTÍCIA */
.noticia-container{{max-width:860px;margin:0 auto;padding:90px 20px 80px;position:relative}}
.noticia-header{{text-align:center;margin-bottom:50px;position:relative}}
.noticia-header::before {{
  content: "❝";
  font-size: 4em;
  color: var(--dourado);
  opacity: 0.1;
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
}}
.noticia-header h1{{font-family:'Montserrat',sans-serif;font-size:2.4em;font-weight:900;color:var(--vinho);line-height:1.3;margin-bottom:20px;position:relative;z-index:2}}
.noticia-autor-destaque{{font-family:'Montserrat',sans-serif;font-size:1.3em;font-weight:700;color:var(--dourado);margin-bottom:6px}}
.noticia-cargo{{font-size:1em;color:#666;font-style:italic}}
.noticia-card{{background:#fff;border-left:5px solid var(--dourado);border-radius:12px;padding:40px 48px;box-shadow:0 8px 30px #00000011;margin-top:40px;position:relative}}
.noticia-card::before {{
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, transparent 50%, var(--vinho) 50%);
  opacity: 0.02;
  border-top-right-radius: 12px;
}}
.noticia-texto{{font-size:1.15em;text-align:justify;color:#333;position:relative}}

/* LETRA CAPITAL ELEGANTE */
.noticia-texto p:first-of-type::first-letter {{
  font-size: 4em;
  color: var(--vinho);
  float: left;
  margin: 0.1em 0.1em 0 0;
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  line-height: 0.8;
  background: linear-gradient(135deg, var(--vinho), var(--dourado));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  padding-right: 5px;
}}

/* DESTAQUE PARA CITAÇÕES LEGAIS */
.destaque-legal {{
  border-left: 4px solid var(--vinho);
  padding: 20px 25px;
  margin: 25px 0;
  background: linear-gradient(90deg, #fcf8f300 0%, #fcf8f3 100%);
  font-style: italic;
  position: relative;
  border-radius: 0 8px 8px 0;
}}
.destaque-legal::before {{
  content: "⚖️";
  position: absolute;
  left: -15px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--creme);
  padding: 5px;
  border-radius: 50%;
  font-size: 0.8em;
}}

/* MARCADORES ELEGANTES NOS PARÁGRAFOS */
.noticia-texto p {{
  position: relative;
  margin-bottom: 1.5em;
  padding-left: 15px;
}}
.noticia-texto p::before {{
  content: "•";
  color: var(--dourado);
  position: absolute;
  left: 0;
  top: 0;
  font-weight: bold;
}}

.noticia-barra-final{{height:8px;background:linear-gradient(90deg,#d1a634bb 10%,#ecd17b 65%,#fff0 100%);border-radius:4px;margin:50px 0 30px;position:relative}}
.noticia-barra-final::after {{
  content: "■";
  color: var(--vinho);
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8em;
}}
.noticia-share{{text-align:center;margin-top:30px}}.noticia-share-text{{font-size:1em;color:#666;margin-bottom:12px}}
.btn-share{{background:var(--dourado);color:#fff;border:none;padding:12px 24px;border-radius:30px;font-weight:700;font-size:1em;cursor:pointer;transition:background .3s;position:relative;overflow:hidden}}
.btn-share::before {{
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s;
}}
.btn-share:hover::before {{left: 100%;}}
.btn-share:hover{{background:#d99500;transform: translateY(-2px);}}

/* FOOTER PADRONIZADO - SEM SELO */
.footer{{background:var(--vinho);color:var(--creme);width:100%;padding:48px 0 32px;text-align:center;margin-top:60px}}
.footer-content{{display:flex;flex-wrap:wrap;justify-content:center;gap:86px;align-items:flex-start;margin-bottom:12px;max-width:1100px;margin-left:auto;margin-right:auto}}
.footer-block{{min-width:220px;text-align:left}}
.footer-block-title{{font-family:"Montserrat",sans-serif;color:var(--dourado);font-weight:bold;font-size:1.09em;margin-bottom:13px;letter-spacing:.16em}}
.footer-menu{{padding:0;margin:0 0 10px 0;list-style:none}}.footer-menu li{{margin-bottom:6px;display:inline-block;margin-right:11px}}
.footer-menu a{{color:var(--creme);text-decoration:none;font-size:1.05em;letter-spacing:.015em;border-bottom:1px dotted #f3a60033;padding:0 4px;transition:color .2s}}.footer-menu a:hover{{color:var(--dourado)}}
.footer-contact{{font-size:1em;margin-top:6px}}.footer-contact i{{margin-right:3px;color:var(--dourado);font-size:1.18em;vertical-align:middle}}

/* RESPONSIVIDADE */
@media (max-width: 1024px) {{
  nav{{gap:40px;font-size:1.1em}}
  .footer-content{{gap:60px}}
  body::before {{width: 40px;}}
}}

@media (max-width: 768px) {{
  .topbar{{grid-template-columns:1fr;text-align:center;gap:15px}}
  .contact-top{{text-align:center;margin-top:10px}}
  .social-links{{margin-top:10px}}
  nav{{flex-wrap:wrap;gap:20px;font-size:1em;padding:12px 0}}
  .header-spacer{{height:220px}}
  
  .noticia-container{{padding:70px 15px 60px}}
  .noticia-header h1{{font-size:1.8em;line-height:1.2}}
  .noticia-header::before {{font-size: 3em; top: -15px;}}
  .noticia-card{{padding:28px 24px;margin-top:30px}}
  .noticia-autor-destaque{{font-size:1.1em}}
  .noticia-texto{{font-size:1.05em;text-align:left}}
  .noticia-texto p:first-of-type::first-letter {{font-size: 3em;}}
  body::before {{display: none;}}
  
  .footer-content{{flex-direction:column;gap:30px;text-align:center}}
  .footer-block{{min-width:100%;text-align:center}}
  .footer-menu li{{display:block;margin-right:0;margin-bottom:8px}}
}}

@media (max-width: 480px) {{
  .topbar{{padding:3px 20px 1px 20px}}
  nav{{gap:15px;font-size:0.9em}}
  .header-spacer{{height:240px}}
  
  .noticia-container{{padding:50px 10px 40px}}
  .noticia-header h1{{font-size:1.5em}}
  .noticia-card{{padding:20px 18px}}
  .noticia-texto{{font-size:1em}}
  .noticia-texto p:first-of-type::first-letter {{font-size: 2.5em;}}
  
  .footer{{padding:36px 0 24px}}
  .footer-content{{gap:25px}}
  .footer-block-title{{font-size:1em}}
  .footer-menu a{{font-size:0.95em}}
}}
</style>
</head>
<body>
<div class="header-fixed">
  <div class="topbar">
    <div></div>
    <div class="logo-center-projection"><img src="logofm2.png" class="logo-img-fm" alt="Franceschini e Miranda Advogados Logo"/></div>
    <div class="contact-top">
      <div class="contact-title">CONTATO</div>
      <div class="contact-detail"><span>📞</span> +55 (011) 3095-2566</div>
      <div class="contact-detail"><span>✉️</span> adv-fm@fm-advogados.com.br</div>
      <div class="social-links">
        <a href="https://instagram.com/" target="_blank" title="Instagram"><i class="fab fa-instagram"></i></a>
        <a href="https://x.com/" target="_blank" title="X / Twitter"><i class="fab fa-x-twitter"></i></a>
        <a href="https://linkedin.com/" target="_blank" title="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
      </div>
    </div>
  </div>
 <nav>
    <a href="index.html">Home</a>
    <a href="escritorio.html">Escritório</a>
    <a href="profissionais.html">Profissionais</a>
    <a href="publicacoes.html" class="active">Publicações</a>
    <a href="#">Contato</a>
</nav>
</div>
<div class="header-spacer"></div>

<div class="noticia-container">
  <div class="noticia-header">
    <h1>{titulo}</h1>
    <div class="noticia-autor-destaque">{autor}</div>
    <div class="noticia-cargo">{cargo}</div>
  </div>
  <div class="noticia-card">
    <div class="noticia-texto">
    {conteudo_html}
    </div>
    <div class="noticia-barra-final"></div>
    <div class="noticia-share">
      <div class="noticia-share-text">Compartilhe o artigo</div>
      <button class="btn-share" onclick="compartilharNoticia('{titulo}', window.location.href)">
        <i class="fas fa-share-alt"></i> Compartilhar
      </button>
    </div>
  </div>
</div>

<footer class="footer">
  <div class="footer-content">
    <div class="footer-block">
      <div class="footer-block-title">ACESSO RÁPIDO</div>
      <ul class="footer-menu">
        <li><a href="index.html">Home</a></li>
        <li><a href="escritorio.html">Escritório</a></li>
        <li><a href="profissionais.html">Profissionais</a></li>
        <li><a href="publicacoes.html" class="active">Publicações</a></li>
        <li><a href="#">Contato</a></li>
      </ul>
    </div>
    <div class="footer-block">
      <div class="footer-block-title">SÃO PAULO</div>
      <div class="footer-contact"><i class="fas fa-phone-alt"></i> <a href="tel:+551130952566" style="color:#fff;text-decoration:underline;">+55 (011) 3095-2566</a></div>
      <div class="footer-contact"><i class="fas fa-envelope"></i> <a href="mailto:adv-fm@fm-advogados.com.br" style="color:#fff;text-decoration:underline;">adv-fm@fm-advogados.com.br</a></div>
    </div>
  </div>
  <p style="margin-top: 20px; font-size: 0.9em;">&copy; 2026 Franceschini e Miranda Advogados. Todos os direitos reservados.</p>
</footer>

<script>
{js_compartilhar}
</script>
</body>
</html>"""

    caminho = os.path.join(os.getcwd(), f'noticia{numero}.html')
    with open(caminho, 'w', encoding='utf-8') as f:
        f.write(html_final)

    # ✅ SALVA O JSON com título e autor
    json_path = os.path.join(os.getcwd(), 'noticias.json')
    noticias = []
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            noticias = json.load(f)

    noticias = [n for n in noticias if n['numero'] != numero]
    noticias.insert(0, {'titulo': titulo, 'autor': autor, 'numero': numero})
    noticias = noticias[:3]

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(noticias, f, ensure_ascii=False, indent=2)

    messagebox.showinfo('Pronto!', f'Arquivo salvo:\\n{caminho}\\nE card atualizado!')

# ---------- INTERFACE GRÁFICA ----------
janela = tk.Tk()
janela.title('Gerador de Notícias | Franceschini e Miranda')
janela.geometry('600x700')
janela.configure(bg='#fdf6ee')

ttk.Label(janela, text='Título da notícia').pack(anchor='w', padx=20, pady=4)
entrada_titulo = ttk.Entry(janela, width=70)
entrada_titulo.pack(padx=20, pady=4)

ttk.Label(janela, text='Nome do autor(a)').pack(anchor='w', padx=20, pady=4)
entrada_autor = ttk.Entry(janela, width=70)
entrada_autor.pack(padx=20, pady=4)

ttk.Label(janela, text='Cargo / qualificação').pack(anchor='w', padx=20, pady=4)
entrada_cargo = ttk.Entry(janela, width=70)
entrada_cargo.pack(padx=20, pady=4)

ttk.Label(janela, text='Número do arquivo (1, 2 ou 3)').pack(anchor='w', padx=20, pady=4)
combo_numero = ttk.Combobox(janela, values=['1', '2', '3'], width=10, state='readonly')
combo_numero.current(0)
combo_numero.pack(padx=20, pady=4)

ttk.Label(janela, text='Texto da notícia (cole aqui)').pack(anchor='w', padx=20, pady=4)
texto_noticia = tk.Text(janela, width=70, height=18, wrap='word', font=('Inter', 11))
texto_noticia.pack(padx=20, pady=4)

# INSTRUÇÕES
instrucoes = tk.Label(janela, 
                     text="Dica: Para textos importantes, comece a linha com [DESTAQUE]",
                     font=('Inter', 9), 
                     fg='#666', 
                     bg='#fdf6ee')
instrucoes.pack(pady=5)

btn_gerar = ttk.Button(janela, text='Gerar noticiaX.html', command=gerar)
btn_gerar.pack(pady=20)

janela.mainloop()