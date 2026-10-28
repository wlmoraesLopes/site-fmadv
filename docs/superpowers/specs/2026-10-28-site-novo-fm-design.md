# Site novo da Franceschini e Miranda (Layout 4 "Mesclado") + painel de admin

Data: 2026-10-28 · Repo: `wlmoraesLopes/site-fmadv` (pasta local `C:\ANTIGRAVITY-PROJETOS\PROJETO-12`)

## Intenção e porquê

O site atual (fm-advogados.com.br) tem imagens de IA, visual datado e conteúdo duplicado entre páginas.
O cliente (os sócios) escolheu, entre 4 modelos, o **Layout 4 "Mesclado"**
(`C:\ANTIGRAVITY-PROJETOS\modelos-fm\layout-4.html`, publicado em https://modelos.fluxon.ia.br/layout-4).
Agora é construir o site completo nesse visual, aproveitando todo o conteúdo do site atual.

O site é mantido por uma única pessoa (o desenvolvedor, usuário deste projeto), que hoje usa formulários
Python locais em `_ferramentas/` para cadastrar profissionais e artigos e depois publica com git.
Cadastros são raros. Ele quer trocar isso por um **painel de admin no próprio site**, com senha própria.
Logo que o painel existir, ele vai cadastrar um correspondente novo (foto + currículo que vai receber).

Público do site: majoritariamente empresas. Objetivo: o visitante entender rápido os serviços.
Visual sóbrio, dentro do Provimento 205/2021 da OAB (publicidade informativa, sem autopromoção).

## Objetivos

1. Site completo em português no visual do Layout 4, com todas as páginas internas.
2. Painel `/admin` com senha para cadastrar/editar profissionais (com obras publicadas) e publicações.
3. Ambiente de teste em subdomínio de fluxon.ia.br para aprovação dos sócios antes de substituir o site oficial.
4. Manter as URLs atuais funcionando (SEO e links já compartilhados).

## Não objetivos

- Versão em inglês. **O site é só em português.** Remover o indicador "PT | EN" do Layout 4.
- Painel/card "Informes F&M" e o gerador de informes (`_ferramentas/gerador-noticias`): deixam de existir.
- Bot do Instagram (`_ferramentas/instagram-bot`): fica de fora.
- Vários usuários no admin: só uma pessoa usa.

## Anti-objetivos (o que tornaria isto um fracasso mesmo funcionando)

- Imagens de IA ou fotos de banco de imagens (prédio com logo do CADE, salas "OFFICE", skyline). Só fotos reais da equipe.
- Associar profissionais a áreas de atuação (nomes ou fotos junto às áreas). Todos atuam em várias áreas.
- Quebrar a hierarquia da equipe: sempre Sócios Fundadores (linha 1) > Sócios (linha 2) > Parceiros / Correspondentes (linha 3).
- Tocar no site oficial (ramo `main` / fm-advogados.com.br) antes da aprovação explícita do usuário.
- Expor a senha do admin ou o token do GitHub no código ou no repositório.
- Texto autopromocional que conflite com o Provimento 205/2021 ("especialistas", "vasta experiência", "os melhores").

## Restrições

- Hospedagem continua na Vercel; repositório continua `wlmoraesLopes/site-fmadv`. Push só com a conta `wlmoraesLopes`.
- Site em HTML/CSS/JS puros, sem framework de front-end (decidido por mim, mantendo o que o site já usa).
- Páginas públicas precisam chegar prontas ao navegador (conteúdo no HTML) para o Google indexar.
- Visual e tokens do Layout 4: paleta marrom e bege
  (`--brand:#4a3426; --brand-2:#2f2119; --accent:#a27b4f; --bg:#f6f1ea; --bg-2:#ede4d8; --surface:#fffdf9; --ink:#2a211b; --muted:#6e6259; --line:#e2d7c8; --on-brand:#f6efe5`),
  fontes Cormorant Garamond (títulos) + Inter (texto).
- Responsivo, com menu hambúrguer no celular.

## Conteúdo e páginas

Fonte do conteúdo: arquivos atuais do repo (`index.html`, `escritorio.html`, `profissionais.html`,
`profissionais/*.html`, `publicacoes.html`, `artigos.json`, `noticia1-3.html`, `noticias.json`, `contato.html`).

### Home
Exatamente a estrutura do Layout 4: topo do Clássico (frase de posicionamento) com índice das 6 áreas ao lado;
seções do Editorial; equipe com molduras de cantoneiras douradas e fotos em cinza que ganham cor no hover;
"Fale com o escritório" incorporado ao rodapé escuro (logo, navegação, endereço, contato).
Cada área do índice leva à página Áreas de atuação, já rolada e aberta naquela área. "Ver as áreas →" leva à página com tudo fechado.
A Home mostra as publicações mais recentes (do mesmo conjunto de dados de Publicações).

### Escritório (`/escritorio`)
Texto de apresentação atual, com duas correções:
- **Remover a Índia**: "correspondentes em diversos Estados e no exterior (EUA, Europa e Índia)" → "(EUA e Europa)".
- Os blocos de áreas que hoje estão nesta página passam para a página Áreas de atuação (sem repetir aqui).

### Áreas de atuação (`/areas-de-atuacao`, página nova)
Uma página com lista que abre e fecha (acordeão), uma área por item, com âncora por área (ex.: `#societario`).
Conteúdo de cada área: frase de abertura + 4 a 7 itens. Base: a versão de `escritorio.html`, com os ajustes:
- Concorrência: recolocar "Defesa em processos antidumping" e "Avaliação de risco de práticas comerciais" (existem só no `index.html`).
- Civil: mover a ação "oriunda de Atos de Concentração" para Concorrência; tirar "Disputas societárias" (já coberto em Societário).
- Corrigir "práticas comerciai".
- Neutralizar frases autopromocionais ("Especialistas em…", "vasta experiência", "complexas") para tom informativo.
- "Dispomos de parcerias, sob nossa direta supervisão…" vira nota geral ao pé da página, não item do Trabalhista.
- Manter "Defesa em processos administrativos sancionadores" (Administrativo).
Todos esses ajustes ficam **marcados para os sócios confirmarem** (lista no fim deste documento).
Sem nomes ou fotos de profissionais nesta página.

### Profissionais (`/profissionais`)
Três linhas fixas, nesta ordem:
1. **Sócios Fundadores**: José Inácio Gonzaga Franceschini, Custódio da Piedade Ubaldino Miranda.
2. **Sócios**: Thays, Fernando, Sandra.
3. **Parceiros / Correspondentes** (substitui "Advogados"): Cristhiane (passa de advogada a parceira) + o correspondente novo, cadastrado depois pelo admin.

**Flávia Maria Pelliciari sai**: sem card, sem página. `/profissionais/flavia` redireciona (301) para `/profissionais`,
como já é feito para `fernanda` no `vercel.json`.
Parceiros/correspondentes aparecem igual aos demais: foto com moldura, página de perfil com currículo.

### Perfil (`/profissionais/<slug>`)
Uma página por profissional, gerada a partir dos dados. Mantém os slugs atuais
(`franceschini`, `cmiranda`, `thays`, `fernando`, `sandra`, `cristhiane`).
Conteúdo: foto, nome, categoria, currículo (texto atual), contatos/links que existirem hoje.

**Obras Publicadas** (só aparece se a pessoa tiver obras cadastradas; hoje só o Dr. Franceschini tem lista):
grade de "capas tipográficas". Cada obra é um cartão com proporção de livro (2:3), cantoneiras douradas
iguais às das fotos da equipe, título em Cormorant Garamond, detalhe (editora/edição) e ano.
**Estilo escolhido: a capa começa clara (bege) e, no hover, escurece suavemente para marrom com título claro
e detalhes dourados; as cantoneiras se estendem e a linha sob o título cresce.**
Referência visual exata: `.superpowers/brainstorm/1816-1793212377/content/obras-capas-v2.html`, variação 3.
Obras do Dr. Franceschini: as 10 hoje em `profissionais/franceschini.html` (bloco "LIVROS ATUALIZADOS").

### Publicações (`/publicacoes`)
Lista única com os 17 itens de `artigos.json` **mais os informes**, que passam a ser artigos comuns:
- "Consolidação de Entendimento no TRF 1ª Região" (Sandra Gomes Esteves) — `noticia2.html`
- "TRF-1 Anula Sentença e Reabre Instrução em Caso Contra o CADE" (Flávia Maria Pelliciari) — `noticia3.html`. **Fica no site com o nome dela.**
- O informe de "Competition Law in Brazil, Fourth Edition" (`noticia1.html`) **não entra**: repete o artigo 17. (Minha decisão.)
Os informes não têm data; usar 26/11/2025 (data em que entraram no site), corrigível pelo admin.
Ordem: sempre da mais recente para a mais antiga. Filtros como no Layout 4.
O conteúdo das publicações deve continuar com o texto e imagens atuais. Cada publicação ganha página própria (`/publicacoes/<slug>`), em vez do modal atual (minha decisão: melhor para Google e para compartilhar).
URLs `noticia1`, `noticia2`, `noticia3` redirecionam (301) para a publicação correspondente (noticia1 → artigo 17).

### Contato (`/contato`)
Mantém o que existe: formulário enviando para o Google Forms atual (mesmos `entry.*` de `contato.html`),
mapa do Google, telefone, WhatsApp, e-mail, endereço.

### Rodapé, privacidade, cookies
- Rodapé escuro do Layout 4; redes atuais: Instagram (`franceschinimiranda`) e LinkedIn (sem X/Twitter). Crédito do desenvolvedor como hoje.
- Aviso de cookies continua. O link atual aponta para `politica-privacidade.html`, **que não existe**:
  criar `/politica-de-privacidade` com texto padrão simples (LGPD), marcado para revisão dos sócios.

## Painel de admin (`/admin`)

### Acesso
- Senha própria do site (não GitHub). O hash da senha fica numa variável de ambiente da Vercel, nunca no repo.
- Login emite cookie de sessão assinado, `HttpOnly`, `Secure`, válido por algumas horas.
- Erros seguidos bloqueiam o login por alguns minutos.
- `/admin` com `noindex`.

### O que edita
- **Profissionais**: criar, editar, remover; nome, slug, categoria (Sócio Fundador / Sócio / Parceiro-Correspondente),
  ordem dentro da categoria, foto (envio do computador, reduzida automaticamente), currículo (texto com formatação básica:
  parágrafos, negrito/destaque, listas), contatos/links, e **Obras Publicadas** (lista com título, detalhe, ano; reordenável).
- **Publicações**: criar, editar, remover; título, data (seletor de calendário), autor, resumo, conteúdo.
  O conteúdo aceita texto formatado, várias imagens enviadas do computador, link do YouTube (vira miniatura clicável),
  links externos e PDF anexado.

### Como publica
Ao salvar, uma função serverless da Vercel confere a sessão e grava os arquivos de dados (e imagens) no GitHub,
via API, com um token de acesso restrito a este repositório (token em variável de ambiente).
O commit dispara o deploy da Vercel; o build gera as páginas estáticas a partir dos dados. Leva por volta de 1 minuto.
O painel mostra que a publicação está a caminho.
No ambiente de teste, o painel grava no ramo de teste; em produção, no `main`.

### Dados
Profissionais, currículos, obras e publicações saem do HTML e passam a ficar em arquivos JSON no repo.
Um script de build gera as páginas (Home, Profissionais, perfis, Publicações e páginas de cada publicação).
Formato dos arquivos e do script: escolha do construtor.

### Tipos e filtros de Publicações (minha decisão)
`artigos.json` hoje só tem `categoria` (área, quase tudo "concorrencia"), sem tipo. Criar o campo **tipo**:
Artigo, Livro, Podcast/Webinar, Entrevista, Evento, Reconhecimento. Os filtros de Publicações são por tipo (e por autor, como hoje).
Na migração, o construtor classifica os 19 itens pelo título/conteúdo; o usuário corrige pelo admin se precisar.
O chip "Informes F&M" do Layout 4 sai.

### Anexos (minha decisão)
Limite de envio: 3 MB por arquivo (ajustado no plano: 4 MB em base64 passaria do limite) (abaixo do limite de ~4,5 MB das funções da Vercel, já contando o base64 da API do GitHub —
o construtor confirma a conta e ajusta o limite se preciso). Imagens são reduzidas no navegador antes do envio
(ex.: largura máx. ~1600 px, JPEG/WebP ~80%), ficando tipicamente em 150–300 KB. PDFs só são baixados quando o visitante clica,
então não pesam a página. PDF maior que o limite entra como link externo.

## Google Ads, SEO e desempenho

- **Manter a tag do Google Ads `AW-17916394466`** em todas as páginas públicas (hoje falta nos perfis). Usar o
  modo de consentimento do Google (Consent Mode v2): a tag carrega com consentimento negado e passa a medir quando o
  visitante aceita os cookies de marketing/analíticos no aviso. A Política de Privacidade menciona o Google Ads.
- Hoje não há nenhum evento de conversão configurado (só a tag base). Deixar pronto o disparo de conversão no envio do
  formulário de Contato e no clique do WhatsApp; ativa quando o usuário fornecer o rótulo de conversão da conta Google Ads.
- **Revisão de SEO**, deixando tudo pronto:
  - `<title>` e `meta description` próprios em toda página (perfis e publicações geradas incluídas), sem termos
    autopromocionais ("especialistas", "vasta experiência" estão nas descrições atuais) e **sem "Índia"** (está na description de `escritorio.html`).
  - `rel="canonical"` com o domínio oficial `https://www.fm-advogados.com.br` (no teste, `noindex`).
  - Open Graph/Twitter Card (título, descrição, imagem) para compartilhamento em WhatsApp/LinkedIn.
  - Dados estruturados JSON-LD: `LegalService` (endereço, telefone, redes) na Home/Contato, `Person` nos perfis, `Article` nas publicações.
  - `sitemap.xml` gerado no build com todas as páginas (hoje só lista 5); `robots.txt` (não existe hoje) apontando para o sitemap.
  - `lang="pt-BR"`, um `h1` por página, `alt` em todas as imagens, URLs limpas (`cleanUrls` já existe).
  - Manter `google2ad6f5776b26239e.html` (verificação do Search Console).
- Desempenho: imagens otimizadas e com dimensões declaradas, fontes com `display=swap`, sem bibliotecas pesadas nas páginas públicas.

## Ambiente de teste e entrada no ar

- **O site atual continua no ar exatamente como está e não recebe mais cadastros.** Tudo o que for novo é feito
  no painel do site novo (ambiente de teste). Por isso a migração de conteúdo é feita uma vez, a partir do `main` atual.

- O site novo é feito no ramo **`site-novo`** do repo. O `main` (site oficial) não é tocado.
- Ambiente de teste publicado em subdomínio de fluxon.ia.br (sugestão: `novo-fm.fluxon.ia.br`), com `noindex`
  (cabeçalho `X-Robots-Tag` + meta), como já é feito em modelos.fluxon.ia.br.
- O correspondente cadastrado no ambiente de teste já fica no ramo e vai junto para o ar.
- Entrada no ar: mesclar `site-novo` em `main` **somente com confirmação explícita do usuário**, depois da aprovação dos sócios.
  Nessa hora, retirar o `noindex`.
- O site atual tem muitos arquivos antigos no repo (backups, `old`, testes, imagens de IA). No ramo novo, ficam só os
  arquivos do site novo; o histórico do git guarda o resto. `google2ad6f5776b26239e.html` (verificação do Google) fica.

## Deixado para o construtor

- Estrutura de pastas, formato dos JSON, script de build, biblioteca de edição de texto do admin.
- Como a Vercel do ambiente de teste se conecta ao repo (projeto novo na conta fluxonart com Git, ou outro arranjo),
  desde que o painel do teste grave em `site-novo` e o site oficial não mude.
- Detalhes visuais das páginas internas, seguindo o Layout 4.

## A confirmar com os sócios (não bloqueia a construção)

- Ajustes de texto em Áreas de atuação (lista acima).
- "há mais de quinze anos" (texto antigo) e fundação 1992 vs "1993" no resumo do podcast.
- Política de Privacidade (texto padrão novo).
- Data real dos dois informes (usado 26/11/2025).

## Decisões tomadas por mim (para o usuário conferir)

- Filtros de Publicações por tipo (lista acima) e classificação inicial dos itens.
- Informe "Fourth Edition" (noticia1) não migra; data 26/11/2025 nos outros dois.
- Página própria para cada publicação (no lugar do modal).
- Limite de 4 MB por anexo, com redução automática de imagens.
- Ramo `site-novo` e subdomínio `novo-fm.fluxon.ia.br` para o teste.
- Política de Privacidade padrão, para revisão dos sócios.
