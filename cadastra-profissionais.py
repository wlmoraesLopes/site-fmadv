#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GERADOR DE CONTEÚDO FRANCESCHINI E MIRANDA
1. Atualizador de Perfis de Profissionais
2. Adicionador de Publicações
VERSÃO CORRIGIDA - CAMINHOS E PUBLICAÇÕES FUNCIONAIS
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import os
import json
from datetime import datetime
import shutil
import re

# ============================================
# CONFIGURAÇÃO DOS CAMINHOS - AJUSTE AQUI!
# ============================================

# CAMINHO BASE DO SEU SITE
SITE_BASE = os.getcwd()  # Pasta onde está este programa
# OU especifique manualmente:
# SITE_BASE = r"C:\site-fmadv"

# CAMINHOS DAS PASTAS
PASTA_PROFISSIONAIS = os.path.join(SITE_BASE, "profissionais")
PASTA_PUBLICACOES = SITE_BASE  # publicacoes.html está na raiz
PASTA_IMAGENS = os.path.join(SITE_BASE, "imagens")  # Se tiver pasta de imagens separada

# Verifica/cria pastas necessárias
for pasta in [PASTA_PROFISSIONAIS]:
    if not os.path.exists(pasta):
        os.makedirs(pasta)
        print(f"Pasta criada: {pasta}")

# ============================================
# 1. GERADOR DE PERFIL DE PROFISSIONAIS
# ATUALIZADO COM OS 6 PROFISSIONAIS REAIS
# ============================================

PROFISSIONAIS = {
    "1": {
        "nome": "Thays Regina Martins Fontes Moreira",
        "cargo": "Sócia",
        "email": "thays@fm-advogados.com.br",
        "area": "Direito Societário",
        "foto": "thays.jpg",  # Foto NA MESMA PASTA que o HTML
        "arquivo": "thays.html",
        "banner": "https://images.pexels.com/photos/31376643/pexels-photo-31376643.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    "2": {
        "nome": "Fernando Eduardo Faleiros Ferreira",
        "cargo": "Sócio",
        "email": "ffaleiros@fm-advogados.com.br",
        "area": "Direito Trabalhista",
        "foto": "fernando.jpg",
        "arquivo": "fernando.html",
        "banner": "https://images.pexels.com/photos/11077631/pexels-photo-11077631.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    "3": {
        "nome": "Sandra Gomes Esteves",
        "cargo": "Sócia",
        "email": "sandra@fm-advogados.com.br",
        "area": "Direitos Civil, Administrativo, Contencioso Concorrencial e Consumidor; Direito Penal Empresarial",
        "foto": "sandra.jpg",
        "arquivo": "sandra.html",
        "banner": "https://images.pexels.com/photos/31376643/pexels-photo-31376643.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    "4": {
        "nome": "Flávia Maria Pelliciari Salum",
        "cargo": "Sócia",
        "email": "fpelliciari@fm-advogados.com.br",
        "area": "Direitos Civil, Administrativo, Comercial, Contencioso Concorrencial e Consumidor",
        "foto": "flavia.jpg",
        "arquivo": "flavia.html",
        "banner": "https://images.pexels.com/photos/31376643/pexels-photo-31376643.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    "5": {
        "nome": "Cristhiane Helena Lopes Ferrero Taliberti",
        "cargo": "Advogada",
        "email": "cristhiane@fm-advogados.com.br",
        "area": "Direito da Concorrência",
        "foto": "cristhiane.jpg",
        "arquivo": "cristhiane.html",
        "banner": "https://images.pexels.com/photos/31376643/pexels-photo-31376643.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    "6": {
        "nome": "Fernanda Dalla Valle Martino",
        "cargo": "Advogada",
        "email": "fernanda.martino@fm-advogados.com.br",
        "area": "Direito da Concorrência",
        "foto": "fernanda.jpg",
        "arquivo": "fernanda.html",
        "banner": "https://images.pexels.com/photos/31376643/pexels-photo-31376643.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    }
}

def criar_perfil_profissional():
    """Gera HTML para perfil de profissional com caminhos corretos"""
    num = combo_profissional.get()
    if num not in PROFISSIONAIS:
        messagebox.showerror("Erro", "Selecione um profissional válido!")
        return
    
    prof = PROFISSIONAIS[num]
    
    # Campos personalizados (se preenchidos)
    nome = entrada_nome.get().strip() or prof["nome"]
    cargo = entrada_cargo.get().strip() or prof["cargo"]
    email = entrada_email.get().strip() or prof["email"]
    area = entrada_area.get().strip() or prof["area"]
    banner_url = prof["banner"]
    
    # Texto do currículo
    texto_curriculo = texto_curriculo_widget.get("1.0", tk.END).strip()
    if not texto_curriculo:
        messagebox.showwarning("Atenção", "Digite o texto do currículo!")
        return
    
    # Processar parágrafos
    paragrafos = texto_curriculo.split('\n')
    paragrafos_html = []
    for p in paragrafos:
        p = p.strip()
        if p:
            # Se começa com [DESTAQUE], formata como destaque
            if p.startswith('[DESTAQUE]'):
                p = p.replace('[DESTAQUE]', '').strip()
                paragrafos_html.append(f'<p><span class="highlight-text">{p}</span></p>')
            else:
                paragrafos_html.append(f'<p>{p}</p>')
    
    conteudo_html = '\n    '.join(paragrafos_html)
    
    # ====================================================
    # CORREÇÃO 1: CAMINHOS RELATIVOS PARA FOTOS
    # ====================================================
    # Caminhos relativos CORRETOS para sua estrutura
    # HTML está na pasta "profissionais", logo está no MESMO nível das fotos
    caminho_raiz = "../"  # Volta uma pasta (de "profissionais" para "site-fmadv")
    caminho_logo = f"{caminho_raiz}logofm2.png"
    
    # A FOTO está na MESMA pasta que o HTML (profissionais/)
    # Portanto o caminho é apenas o nome do arquivo!
    caminho_imagem = prof['foto']  # Correto: thays.jpg, fernando.jpg, etc.
    
    # Template HTML ajustado para C:\site-fmadv\profissionais\
    html_template = f'''<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8" />
<title>{nome} - {cargo} | Franceschini e Miranda</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap');
:root {{ 
  --vinho: #7b0606; 
  --creme: #fcf8f3; 
  --ouro: #f3a600; 
  --cinza-claro: #efecea;
  --cinza-texto: #555;
  --branco: #ffffff;
  --sombra-leve: 0 4px 20px rgba(0,0,0,0.08);
  --sombra-media: 0 8px 40px rgba(0,0,0,0.12);
}}

* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ 
  font-family: 'Inter', sans-serif; 
  background: var(--creme); 
  color: var(--cinza-texto); 
  line-height: 1.6;
  overflow-x: hidden;
}}

/* ---------- CABEÇALHO ---------- */
.header-fixed {{ 
  position: fixed; top: 0; left: 0; right: 0; width: 100vw; z-index: 50; 
  background: var(--vinho); box-shadow: 0 2px 18px #4b060677;
}}
.topbar {{ 
  width: 100%; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; 
  background: var(--vinho); padding: 3px 5vw 1px 5vw; min-height: 78px; box-sizing: border-box;
}}
.topbar-filler {{ min-width: 280px; visibility: hidden; }}
.logo-center-projection {{ 
  width: 100%; display: flex; justify-content: center; align-items: center; min-height: 76px;
}}
.logo-img-fm {{ max-width: 96%; width: 350px; min-width: 180px; height: auto; display: block; margin: 0 auto;}}
.contact-top {{ text-align: right; min-width: 280px; font-size: 1.1em; align-self: center; justify-self: end;}}
.contact-top span {{ vertical-align: middle; margin-right: 3px; font-size: 1.13em; color: #ffe0e0;}}
.contact-title, .contact-detail {{ color: var(--creme); font-family: 'Montserrat', Arial, sans-serif;}}
.social-links {{ margin: 9px 0 2px; text-align: right;}}
.social-links a {{ 
  color: #fff; background: #630303; border-radius: 50%; padding: 7px 0; margin-left: 7px; 
  width: 38px; display: inline-block; text-align: center; transition: all 0.2s; 
  font-size: 1.18em; box-shadow: 0 2px 10px #20020222; vertical-align: middle;
}}
.social-links a:hover {{ background: #f3a600; color: #7b0606; transform: translateY(-2px); }}
.header-spacer {{ height: 190px;}}
nav {{ 
  background: var(--vinho); display: flex; justify-content: center; align-items: center; 
  gap: 70px; padding: 16px 0; font-size: 1.22em; font-weight: 600; letter-spacing: 0.12em; 
  box-shadow: 0 7px 16px #551a1a23; width: 100%; margin: 0 auto; position: relative; z-index: 4;
}}
nav a {{ 
  text-decoration: none; color: var(--creme); transition: 0.2s; padding-bottom: 3px; 
  font-size: 1em; font-family: 'Inter', Arial, sans-serif; font-weight: 600; 
  letter-spacing: 0.05em; display: inline-block;
}}
nav a:hover, nav a.active {{ color: #f3a600; border-bottom: 2px solid #fdeede; }}

/* ---------- BANNER PERFIL ---------- */
.profile-banner {{
  margin-top: 190px;
  height: 220px;
  width: 100%;
  background: linear-gradient(rgba(80, 80, 80, 0.7), rgba(100, 100, 100, 0.8)), 
              url('{banner_url}') center/cover;
  filter: grayscale(100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}}
.profile-photo-wrapper {{
  position: absolute;
  bottom: -70px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}}
.profile-photo-large {{
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 6px solid var(--branco);
  box-shadow: var(--sombra-media);
  object-fit: cover;
  transition: transform 0.3s ease;
}}
.profile-photo-large:hover {{
  transform: scale(1.05);
}}

/* ---------- INFO COMPACTA ---------- */
.compact-info {{
  background: var(--branco);
  margin: 90px auto 40px;
  max-width: 900px;
  border-radius: 20px;
  padding: 40px;
  box-shadow: var(--sombra-leve);
  position: relative;
  text-align: center;
}}
.name-header {{
  position: relative;
  padding-bottom: 15px;
  margin-bottom: 20px;
}}
.name-header::before {{
  content: '';
  position: absolute;
  top: -15px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--ouro), transparent);
}}
.name-header::after {{
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--ouro), transparent);
}}
.profile-name {{
  font-family: 'Montserrat', sans-serif;
  font-size: 2.2em;
  font-weight: 800;
  color: var(--vinho);
  margin-bottom: 5px;
  position: relative;
  z-index: 2;
}}
.profile-role {{
  font-size: 1.1em;
  color: var(--ouro);
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-align: center;
  margin-top: 10px;
}}
.contact-info {{
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}}
.info-chip {{
  background: var(--creme);
  padding: 12px 24px;
  border-radius: 25px;
  color: var(--cinza-texto);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  font-style: italic;
}}
.info-chip::before {{
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(243, 166, 0, 0.3), transparent);
  transition: left 0.5s ease;
}}
.info-chip:hover::before {{ left: 100%; }}
.info-chip:hover {{
  background: var(--ouro);
  color: var(--vinho);
  transform: translateY(-2px);
}}
.email-label::before {{
  content: 'E-MAIL';
  background: var(--vinho);
  color: var(--branco);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7em;
  font-weight: 700;
  margin-right: 10px;
  letter-spacing: 1px;
}}
.area-label::before {{
  content: 'ATUAÇÃO';
  background: var(--vinho);
  color: var(--branco);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7em;
  font-weight: 700;
  margin-right: 10px;
  letter-spacing: 1px;
}}
.gold-separator-extra {{
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--ouro), transparent);
  width: 80%;
  margin: 30px auto;
}}

/* ---------- CARD ELEGANTE ---------- */
.elegant-card {{
  max-width: 900px;
  margin: 0 auto 60px;
  background: var(--branco);
  border-radius: 25px;
  padding: 50px;
  box-shadow: var(--sombra-media);
  position: relative;
  overflow: hidden;
}}
.elegant-card::before {{
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, var(--vinho), var(--ouro), var(--vinho));
}}
.elegant-card::after {{
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--ouro), transparent);
}}
.card-content-elegant {{
  font-size: 1.1em;
  line-height: 1.9;
  color: var(--cinza-texto);
  font-style: italic;
  text-align: justify;
  position: relative;
  z-index: 2;
}}
.card-content-elegant p {{
  margin-bottom: 20px;
}}
.highlight-text {{
  color: var(--vinho);
  font-weight: 600;
  font-style: normal;
}}

/* ---------- RODAPÉ ---------- */
.footer {{ 
  background: var(--vinho); 
  color: var(--creme); 
  width: 100%; 
  padding: 48px 0 32px 0; 
  text-align: center; 
  position: relative;
  margin-top: 60px;
}}
.footer-content {{
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 86px;
  align-items: flex-start;
  margin-bottom: 12px;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}}
.footer-block {{ min-width: 220px; text-align: left; }}
.footer-logo {{ display: none; }}
.footer-block-title {{ 
  font-family: 'Montserrat', sans-serif; color: #f3a600; 
  font-weight: bold; font-size: 1.09em; margin-bottom: 13px; letter-spacing: .16em; 
}}
.footer-menu {{ padding: 0; margin: 0 0 10px 0; list-style: none; }}
.footer-menu li {{ margin-bottom: 6px; display: inline-block; margin-right: 11px; }}
.footer-menu a {{ 
  color: var(--creme); text-decoration: none; font-size: 1.05em; 
  letter-spacing: .015em; border-bottom: 1px dotted #f3a60033; 
  padding: 0 4px; transition: color .2s; 
}}
.footer-menu a:hover {{ color: #f3a600; }}
.footer-contact {{ font-size: 1em; margin-top: 6px; }}
.footer-contact i {{ margin-right: 3px; color: #f3a600; font-size: 1.18em; vertical-align: middle; }}

/* ---------- BOTÃO VOLTAR ---------- */
.back-button {{
  position: fixed;
  top: 200px;
  left: 30px;
  background: var(--vinho);
  color: var(--branco);
  padding: 12px 20px;
  border-radius: 25px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  z-index: 100;
  box-shadow: var(--sombra-leve);
}}
.back-button:hover {{
  background: var(--ouro);
  color: var(--vinho);
  transform: translateX(-5px);
}}

/* ---------- MOBILE ---------- */
@media (max-width: 768px) {{
  .topbar {{
    grid-template-columns: 1fr auto;
    padding: 8px 4vw;
    min-height: 64px;
  }}
  .topbar-filler {{
    display: none;
  }}
  .logo-center-projection {{
    justify-content: flex-start;
    padding-left: 10px;
  }}
  .logo-img-fm {{
    width: 140px;
  }}
  .contact-top {{
    display: none;
  }}
  nav {{
    font-size: 0.9em;
    gap: 12px;
    padding: 10px 0;
    overflow-x: auto;
    white-space: nowrap;
    justify-content: flex-start;
  }}
  .back-button {{
    position: relative;
    top: auto;
    left: auto;
    margin: 10px auto 20px;
    width: fit-content;
  }}
  .profile-banner {{
    height: 200px;
  }}
  .profile-photo-large {{
    width: 150px;
    height: 150px;
  }}
  .profile-name {{
    font-size: 1.8em;
  }}
  .elegant-card {{
    padding: 30px;
    margin: 0 20px 40px;
  }}
}}
</style>
</head>
<body>

<!-- Botão Voltar -->
<a href="{caminho_raiz}profissionais.html" class="back-button">
  <i class="fas fa-arrow-left"></i> Voltar aos Profissionais
</a>

<!-- Cabeçalho fixo -->
<div class="header-fixed">
  <div class="topbar">
    <div class="topbar-filler"></div>
    <div class="logo-center-projection">
      <img src="{caminho_logo}" class="logo-img-fm" alt="Franceschini e Miranda Advogados Logo"/>
    </div>
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
    <a href="{caminho_raiz}index.html">Home</a>
    <a href="{caminho_raiz}escritorio.html">Escritório</a>
    <a href="{caminho_raiz}profissionais.html">Profissionais</a>
    <a href="{caminho_raiz}publicacoes.html">Publicações</a>
    <a href="#">Contato</a>
</nav></div>

<!-- BANNER PERFIL -->
<section class="profile-banner">
  <div class="profile-photo-wrapper">
    <img src="{caminho_imagem}" alt="{nome}" class="profile-photo-large">
  </div>
</section>

<!-- INFO COMPACTA -->
<div class="compact-info">
  <div class="name-header">
    <h1 class="profile-name">{nome}</h1>
    <p class="profile-role">{cargo}</p>
  </div>

  <div class="contact-info">
    <div class="info-chip email-label">{email}</div>
    <div class="info-chip area-label">{area}</div>
  </div>
</div>

<!-- SEPARADOR DOURADO -->
<div class="gold-separator-extra"></div>

<!-- CARD ELEGANTE -->
<div class="elegant-card">
  <div class="card-content-elegant">
    {conteudo_html}
  </div>
</div>

<!-- RODAPÉ -->
<footer class="footer">
  <div class="footer-content">
    <div class="footer-block">
      <div class="footer-block-title">ACESSO RÁPIDO</div>
      <ul class="footer-menu">
    <li><a href="{caminho_raiz}index.html">Home</a></li>
    <li><a href="{caminho_raiz}escritorio.html">Escritório</a></li>
    <li><a href="{caminho_raiz}profissionais.html">Profissionais</a></li>
    <li><a href="{caminho_raiz}publicacoes.html">Publicações</a></li>
    <li><a href="#">Contato</a></li>
</ul>
    </div>
    <div class="footer-block">
      <div class="footer-block-title">SÃO PAULO</div>
      <div class="footer-contact">
        <i class="fas fa-phone-alt"></i>
        <a href="tel:+551130952566" style="color:#fff;text-decoration:underline;">+55 (011) 3095-2566</a>
      </div>
      <div class="footer-contact">
        <i class="fas fa-envelope"></i>
        <a href="mailto:adv-fm@fm-advogados.com.br" style="color:#fff;text-decoration:underline;">adv-fm@fm-advogados.com.br</a>
      </div>
    </div>
  </div>
  <p style="margin-top: 20px; font-size: 0.9em;">&copy; 2026 Franceschini e Miranda Advogados. Todos os direitos reservados.</p>
</footer>

</body>
</html>'''
    
    # Salvar arquivo na pasta correta
    caminho_completo = os.path.join(PASTA_PROFISSIONAIS, prof["arquivo"])
    with open(caminho_completo, 'w', encoding='utf-8') as f:
        f.write(html_template)
    
    messagebox.showinfo("Sucesso!", f"Perfil atualizado:\n{caminho_completo}")

def carregar_profissional(event=None):
    """Carrega os dados do profissional selecionado"""
    num = combo_profissional.get()
    if num in PROFISSIONAIS:
        prof = PROFISSIONAIS[num]
        entrada_nome.delete(0, tk.END)
        entrada_nome.insert(0, prof["nome"])
        entrada_cargo.delete(0, tk.END)
        entrada_cargo.insert(0, prof["cargo"])
        entrada_email.delete(0, tk.END)
        entrada_email.insert(0, prof["email"])
        entrada_area.delete(0, tk.END)
        entrada_area.insert(0, prof["area"])
        texto_curriculo_widget.delete("1.0", tk.END)

# ============================================
# 2. GERADOR DE PUBLICAÇÕES - VERSÃO CORRIGIDA
# ============================================

def adicionar_publicacao():
    """Adiciona uma nova publicação ao arquivo publicacoes.html - VERSÃO CORRIGIDA"""
    titulo = entrada_pub_titulo.get().strip()
    autor = entrada_pub_autor.get().strip()
    categoria = combo_pub_categoria.get()
    texto = texto_pub_conteudo.get("1.0", tk.END).strip()
    
    if not titulo or not autor or not texto:
        messagebox.showwarning("Atenção", "Preencha todos os campos!")
        return
    
    # Gerar ID único baseado na data/hora
    pub_id = int(datetime.now().timestamp())
    
    # Formatar data atual
    data_atual = datetime.now().strftime("%d de %B de %Y")
    # Converter mês para português
    meses_pt = {
        "January": "Janeiro", "February": "Fevereiro", "March": "Março",
        "April": "Abril", "May": "Maio", "June": "Junho",
        "July": "Julho", "August": "Agosto", "September": "Setembro",
        "October": "Outubro", "November": "Novembro", "December": "Dezembro"
    }
    for eng, pt in meses_pt.items():
        data_atual = data_atual.replace(eng, pt)
    
    # Processar conteúdo (parágrafos) - ESCAPAR CARACTERES CORRETAMENTE
    paragrafos = texto.split('\n')
    conteudo_limpo = ""
    for p in paragrafos:
        p = p.strip()
        if p:
            # Escapar aspas e quebras de linha
            p_escaped = p.replace('"', '\\"').replace("'", "\\'")
            conteudo_limpo += f'<p>{p_escaped}</p>\\n'
    
    # Criar objeto da nova publicação - FORMATO CORRETO
    nova_pub_js = f"""{{
        id: {pub_id},
        titulo: "{titulo.replace('"', '\\"')}",
        data: "{data_atual}",
        autor: "{autor.replace('"', '\\"')}",
        categoria: "{categoria}",
        resumo: "{texto[:150].replace('"', '\\"') + ('...' if len(texto) > 150 else '')}",
        conteudo: `{conteudo_limpo}`
    }}"""
    
    # Caminho do arquivo publicacoes.html (na raiz do site)
    arquivo_publicacoes = os.path.join(PASTA_PUBLICACOES, "publicacoes.html")
    
    # Verificar se o arquivo existe
    if not os.path.exists(arquivo_publicacoes):
        messagebox.showerror("Erro", f"Arquivo não encontrado:\n{arquivo_publicacoes}")
        return
    
    try:
        # Ler o arquivo completo
        with open(arquivo_publicacoes, "r", encoding="utf-8") as f:
            conteudo = f.read()
        
        # ====================================================
        # CORREÇÃO 2: MANIPULAÇÃO SEGURA DO ARRAY
        # ====================================================
        # Encontrar o array de publicações com regex mais robusto
        padrao = r'const\s+publicacoes\s*=\s*\[(.*?)\]\s*;'
        match = re.search(padrao, conteudo, re.DOTALL)
        
        if not match:
            # Tentar encontrar de outra forma
            padrao_alt = r'publicacoes\s*=\s*\[(.*?)\]\s*;'
            match = re.search(padrao_alt, conteudo, re.DOTALL)
            
        if not match:
            messagebox.showerror("Erro", "Não encontrei o array de publicações no arquivo!")
            return
        
        # Extrair o conteúdo do array
        array_conteudo = match.group(1).strip()
        
        # Determinar onde inserir a nova publicação
        if array_conteudo:  # Se já tem publicações
            # Inserir no início do array
            novo_array_conteudo = nova_pub_js + ",\n" + array_conteudo
        else:  # Array vazio
            novo_array_conteudo = nova_pub_js
        
        # Substituir o array antigo pelo novo
        inicio = match.start(1)
        fim = match.end(1)
        
        novo_conteudo = conteudo[:inicio] + novo_array_conteudo + conteudo[fim:]
        
        # Fazer backup do arquivo original
        backup_path = os.path.join(PASTA_PUBLICACOES, f"publicacoes_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html")
        shutil.copy2(arquivo_publicacoes, backup_path)
        
        # Salvar novo arquivo
        with open(arquivo_publicacoes, "w", encoding="utf-8") as f:
            f.write(novo_conteudo)
        
        messagebox.showinfo("Sucesso!", 
                          f"Publicação adicionada com sucesso!\n\n"
                          f"Backup salvo como:\n{backup_path}\n\n"
                          f"ID da publicação: {pub_id}")
        
        # Limpar campos
        entrada_pub_titulo.delete(0, tk.END)
        entrada_pub_autor.delete(0, tk.END)
        texto_pub_conteudo.delete("1.0", tk.END)
        
    except Exception as e:
        messagebox.showerror("Erro", f"Ocorreu um erro:\n{str(e)}\n\n"
                                   f"Certifique-se que o arquivo publicacoes.html tem o formato correto.")

# ============================================
# INTERFACE GRÁFICA
# ============================================

def criar_interface():
    """Cria a interface principal com abas"""
    janela = tk.Tk()
    janela.title(f"Gestor de Conteúdo | Franceschini e Miranda - [{SITE_BASE}]")
    janela.geometry("850x800")  # Um pouco maior para melhor visualização
    janela.configure(bg='#fdf6ee')
    
    # Criar abas
    notebook = ttk.Notebook(janela)
    
    # Aba 1: Profissionais
    frame_profissionais = ttk.Frame(notebook)
    notebook.add(frame_profissionais, text="📄 Atualizar Profissionais")
    
    # Aba 2: Publicações
    frame_publicacoes = ttk.Frame(notebook)
    notebook.add(frame_publicacoes, text="📰 Adicionar Publicações")
    
    notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
    
    # ========== ABA PROFISSIONAIS ==========
    # Título
    ttk.Label(frame_profissionais, text="ATUALIZAR PERFIL DE PROFISSIONAL", 
             font=('Inter', 14, 'bold'), foreground='#7b0606').pack(pady=10)
    
    # Info do caminho
    caminho_info = tk.Label(frame_profissionais,
                           text=f"Pasta: {PASTA_PROFISSIONAIS}\n"
                                f"Fotos: Na MESMA pasta dos HTMLs (ex: thays.jpg)",
                           font=('Inter', 9),
                           fg='#666',
                           bg='#fdf6ee',
                           justify='left')
    caminho_info.pack(pady=5)
    
    # Seletor de profissional
    ttk.Label(frame_profissionais, text="Selecione o profissional:").pack(anchor='w', padx=20, pady=5)
    
    global combo_profissional, entrada_nome, entrada_cargo, entrada_email, entrada_area, texto_curriculo_widget
    
    combo_profissional = ttk.Combobox(frame_profissionais, 
                                     values=list(PROFISSIONAIS.keys()),
                                     width=10,
                                     state='readonly')
    combo_profissional.current(0)
    combo_profissional.pack(anchor='w', padx=20, pady=5)
    combo_profissional.bind('<<ComboboxSelected>>', carregar_profissional)
    
    # Campos editáveis
    ttk.Label(frame_profissionais, text="Nome completo:").pack(anchor='w', padx=20, pady=5)
    entrada_nome = ttk.Entry(frame_profissionais, width=70)
    entrada_nome.pack(anchor='w', padx=20, pady=5)
    
    ttk.Label(frame_profissionais, text="Cargo:").pack(anchor='w', padx=20, pady=5)
    entrada_cargo = ttk.Entry(frame_profissionais, width=70)
    entrada_cargo.pack(anchor='w', padx=20, pady=5)
    
    ttk.Label(frame_profissionais, text="E-mail:").pack(anchor='w', padx=20, pady=5)
    entrada_email = ttk.Entry(frame_profissionais, width=70)
    entrada_email.pack(anchor='w', padx=20, pady=5)
    
    ttk.Label(frame_profissionais, text="Área de atuação:").pack(anchor='w', padx=20, pady=5)
    entrada_area = ttk.Entry(frame_profissionais, width=70)
    entrada_area.pack(anchor='w', padx=20, pady=5)
    
    # Texto do currículo
    ttk.Label(frame_profissionais, text="Texto do currículo:").pack(anchor='w', padx=20, pady=5)
    texto_curriculo_widget = tk.Text(frame_profissionais, width=90, height=15, wrap='word', font=('Inter', 10))
    texto_curriculo_widget.pack(padx=20, pady=5)
    
    # Instruções
    instrucoes = tk.Label(frame_profissionais, 
                         text="Dica: Use [DESTAQUE] no início da linha para destacar textos importantes\n"
                              "Exemplo: [DESTAQUE]Graduada pela Faculdade de Direito...",
                         font=('Inter', 9), 
                         fg='#666', 
                         bg='#fdf6ee')
    instrucoes.pack(pady=5)
    
    # Botão gerar
    btn_gerar_prof = ttk.Button(frame_profissionais, 
                               text="Atualizar Perfil", 
                               command=criar_perfil_profissional,
                               style='Accent.TButton')
    btn_gerar_prof.pack(pady=20)
    
    # Carregar primeiro profissional
    carregar_profissional()
    
    # ========== ABA PUBLICAÇÕES ==========
    # Título
    ttk.Label(frame_publicacoes, text="ADICIONAR NOVA PUBLICAÇÃO", 
             font=('Inter', 14, 'bold'), foreground='#7b0606').pack(pady=10)
    
    # Info do caminho
    caminho_info_pub = tk.Label(frame_publicacoes,
                               text=f"Arquivo: {os.path.join(PASTA_PUBLICACOES, 'publicacoes.html')}",
                               font=('Inter', 9),
                               fg='#666',
                               bg='#fdf6ee')
    caminho_info_pub.pack(pady=5)
    
    # Campos da publicação
    ttk.Label(frame_publicacoes, text="Título da publicação:").pack(anchor='w', padx=20, pady=5)
    global entrada_pub_titulo
    entrada_pub_titulo = ttk.Entry(frame_publicacoes, width=80)
    entrada_pub_titulo.pack(anchor='w', padx=20, pady=5)
    
    ttk.Label(frame_publicacoes, text="Autor:").pack(anchor='w', padx=20, pady=5)
    global entrada_pub_autor
    entrada_pub_autor = ttk.Entry(frame_publicacoes, width=80)
    entrada_pub_autor.pack(anchor='w', padx=20, pady=5)
    
    ttk.Label(frame_publicacoes, text="Categoria:").pack(anchor='w', padx=20, pady=5)
    global combo_pub_categoria
    combo_pub_categoria = ttk.Combobox(frame_publicacoes, 
                                      values=['concorrencia', 'trabalhista', 'penal', 'administrativo', 'societario', 'civil'],
                                      width=20,
                                      state='readonly')
    combo_pub_categoria.current(0)
    combo_pub_categoria.pack(anchor='w', padx=20, pady=5)
    
    ttk.Label(frame_publicacoes, text="Conteúdo da publicação:").pack(anchor='w', padx=20, pady=5)
    global texto_pub_conteudo
    texto_pub_conteudo = tk.Text(frame_publicacoes, width=90, height=18, wrap='word', font=('Inter', 10))
    texto_pub_conteudo.pack(padx=20, pady=5)
    
    # Botão adicionar
    btn_adicionar_pub = ttk.Button(frame_publicacoes, 
                                  text="Adicionar Publicação", 
                                  command=adicionar_publicacao,
                                  style='Accent.TButton')
    btn_adicionar_pub.pack(pady=20)
    
    # Instruções
    instrucoes_pub = tk.Label(frame_publicacoes, 
                             text="IMPORTANTE:\n"
                                  "1. O arquivo publicacoes.html DEVE existir na raiz do site\n"
                                  "2. Será criado um backup automaticamente\n"
                                  "3. A publicação será adicionada no TOPO da lista",
                             font=('Inter', 9), 
                             fg='#666', 
                             bg='#fdf6ee',
                             justify='left')
    instrucoes_pub.pack(pady=5)
    
    # Criar estilo para botões destacados
    style = ttk.Style()
    style.configure('Accent.TButton', foreground='white', background='#7b0606', font=('Inter', 10, 'bold'))
    
    return janela

# ============================================
# EXECUÇÃO PRINCIPAL
# ============================================

if __name__ == "__main__":
    print(f"""
    ╔══════════════════════════════════════════╗
    ║  GESTOR DE CONTEÚDO FRANCESCHINI E MIRANDA ║
    ║  Versão 2.1 - CAMINHOS CORRIGIDOS        ║
    ║  PUBLICAÇÕES FUNCIONAIS                 ║
    ╚══════════════════════════════════════════╝
    
    Caminho base: {SITE_BASE}
    Pasta profissionais: {PASTA_PROFISSIONAIS}
    
    CORREÇÕES IMPLEMENTADAS:
    1. ✅ Fotos: Agora usam caminho relativo simples (thays.jpg)
    2. ✅ Publicações: Manipulação segura do array JavaScript
    3. ✅ Backup: Nome único com timestamp
    
    Profissionais configurados:
    1. Thays Regina Martins Fontes Moreira
    2. Fernando Eduardo Faleiros Ferreira
    3. Sandra Gomes Esteves
    4. Flávia Maria Pelliciari Salum
    5. Cristhiane Helena Lopes Ferrero Taliberti
    6. Fernanda Dalla Valle Martino
    
    Iniciando interface...
    """)
    
    janela = criar_interface()
    janela.mainloop()
