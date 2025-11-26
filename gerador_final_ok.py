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

    paragrafos = '\n    '.join(textoPuro.split('\n'))

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
.header-fixed{{position:fixed;top:0;left:0;right:0;z-index:50;background:var(--vinho);box-shadow:0 2px 18px #4b060677}}
.topbar{{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:3px 5vw 1px 5vw;min-height:78px}}
.logo-img-fm{{max-width:350px;width:96%;min-width:180px;height:auto;display:block;margin:0 auto}}
.contact-top{{text-align:right;font-size:1.1em;color:var(--creme)}}
.social-links a{{color:#fff;background:#630303;border-radius:50%;padding:7px 0;margin-left:7px;width:38px;display:inline-block;text-align:center;transition:background .2s,color .2s;font-size:1.18em;vertical-align:middle}}
.social-links a:hover{{background:var(--dourado);color:var(--vinho)}}
nav{{display:flex;justify-content:center;gap:66px;padding:16px 0;font-size:1.22em;font-weight:600;letter-spacing:.12em}}
nav a{{color:var(--creme);text-decoration:none;padding-bottom:3px;transition:color .2s}}nav a:hover,nav a.active{{color:var(--dourado);border-bottom:2px solid #fdeede}}
.header-spacer{{height:190px}}
.noticia-container{{max-width:860px;margin:0 auto;padding:90px 20px 80px}}
.noticia-header{{text-align:center;margin-bottom:50px}}
.noticia-header h1{{font-family:'Montserrat',sans-serif;font-size:2.4em;font-weight:900;color:var(--vinho);line-height:1.3;margin-bottom:20px}}
.noticia-autor-destaque{{font-family:'Montserrat',sans-serif;font-size:1.3em;font-weight:700;color:var(--dourado);margin-bottom:6px}}
.noticia-cargo{{font-size:1em;color:#666;font-style:italic}}
.noticia-card{{background:#fff;border-left:5px solid var(--dourado);border-radius:12px;padding:40px 48px;box-shadow:0 8px 30px #00000011;margin-top:40px}}
.noticia-texto{{font-size:1.15em;text-align:justify;color:#333}}
.noticia-barra-final{{height:8px;background:linear-gradient(90deg,#d1a634bb 10%,#ecd17b 65%,#fff0 100%);border-radius:4px;margin:50px 0 30px}}
.noticia-share{{text-align:center;margin-top:30px}}.noticia-share-text{{font-size:1em;color:#666;margin-bottom:12px}}
.btn-share{{background:var(--dourado);color:#fff;border:none;padding:12px 24px;border-radius:30px;font-weight:700;font-size:1em;cursor:pointer;transition:background .3s}}.btn-share:hover{{background:#d99500}}
.footer{{background:var(--vinho);color:var(--creme);width:100vw;margin-left:-50vw;left:50%;padding:48px 0 32px;text-align:center;position:relative}}
.footer-content{{display:flex;flex-wrap:wrap;justify-content:center;gap:86px;align-items:flex-start;margin-bottom:12px;max-width:1100px;margin-left:auto;margin-right:auto}}
.footer-block{{min-width:220px;text-align:left}}.footer-logo{{display:block;max-width:160px;margin-bottom:7px}}
.footer-block-title{{font-family:"Montserrat",sans-serif;color:var(--dourado);font-weight:bold;font-size:1.09em;margin-bottom:13px;letter-spacing:.16em}}
.footer-menu{{padding:0;margin:0 0 10px 0;list-style:none}}.footer-menu li{{margin-bottom:6px;display:inline-block;margin-right:11px}}
.footer-menu a{{color:var(--creme);text-decoration:none;font-size:1.05em;letter-spacing:.015em;border-bottom:1px dotted #f3a60033;padding:0 4px;transition:color .2s}}.footer-menu a:hover{{color:var(--dourado)}}
.footer-contact{{font-size:1em;margin-top:6px}}.footer-contact i{{margin-right:3px;color:var(--dourado);font-size:1.18em;vertical-align:middle}}
@media (max-width:768px){{.noticia-header h1{{font-size:1.8em}}.noticia-card{{padding:28px 24px}}}}
</style>
</head>
<body>
<div class="header-fixed">
  <div class="topbar">
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
    <a href="#">Áreas de Atuação</a>
    <a href="#" class="active">Publicações</a>
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
    {paragrafos}
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
    <div class="footer-block"><img src="imagens-fmadv/analise.png" alt="Selo Análise Advocacia" class="footer-logo"/></div>
    <div class="footer-block">
      <div class="footer-block-title">ACESSO RÁPIDO</div>
      <ul class="footer-menu">
        <li><a href="index.html">Home</a></li>
        <li><a href="escritorio.html">Escritório</a></li>
        <li><a href="profissionais.html">Profissionais</a></li>
        <li><a href="#">Áreas de Atuação</a></li>
        <li><a href="#">Publicações</a></li>
        <li><a href="#">Contato</a></li>
      </ul>
    </div>
    <div class="footer-block">
      <div class="footer-block-title">SÃO PAULO</div>
      <div class="footer-contact"><i class="fas fa-phone-alt"></i> <a href="tel:+551130952566" style="color:#fff;text-decoration:underline;">+55 (011) 3095-2566</a></div>
      <div class="footer-contact"><i class="fas fa-envelope"></i> <a href="mailto:adv-fm@fm-advogados.com.br" style="color:#fff;text-decoration:underline;">adv-fm@fm-advogados.com.br</a></div>
    </div>
  </div>
  <p style="margin-top: 20px; font-size: 0.9em;">&copy; 2024 Franceschini e Miranda Advogados. Todos os direitos reservados.</p>
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

    messagebox.showinfo('Pronto!', f'Arquivo salvo:\n{caminho}\nE card atualizado!')

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

btn_gerar = ttk.Button(janela, text='Gerar noticiaX.html', command=gerar)
btn_gerar.pack(pady=20)

janela.mainloop()