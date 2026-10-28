# Site novo F&M (Layout 4) + painel de admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir fm-advogados.com.br no visual do Layout 4 a partir de dados JSON, com painel `/admin` (senha própria) que publica via GitHub, num ramo/ambiente de teste.

**Architecture:** Site estático gerado no build da Vercel: `scripts/build.mjs` lê `content/*.json` e grava HTML pronto em `public/`. Funções serverless em `api/` (login, carregar, salvar) — salvar faz um commit único via API Git Data do GitHub no ramo configurado, o que dispara novo deploy. O admin é uma página estática (`admin/`) que conversa com `api/`.

**Tech Stack:** Node 24 (ESM), `node:test`, `sanitize-html` (build), `node:crypto` (scrypt + HMAC), Quill 2.0.3 via cdn.jsdelivr.net (só no admin), Vercel (static + Node functions), GitHub REST API.

**Spec:** `docs/superpowers/specs/2026-10-28-site-novo-fm-design.md` — ler inteiro antes de qualquer tarefa.

## Global Constraints

- Ramo de trabalho: `site-novo`. Nunca commitar/mesclar em `main` nem fazer deploy do projeto Vercel `site-fmadv` sem confirmação explícita do usuário. Push só com a conta GitHub `wlmoraesLopes`.
- Site somente em português (`lang="pt-BR"`); sem indicador "PT | EN".
- Tokens visuais (copiar de `C:\ANTIGRAVITY-PROJETOS\modelos-fm\layout-4.html`): `--brand:#4a3426; --brand-2:#2f2119; --accent:#a27b4f; --bg:#f6f1ea; --bg-2:#ede4d8; --surface:#fffdf9; --ink:#2a211b; --muted:#6e6259; --line:#e2d7c8; --on-brand:#f6efe5`; fontes Cormorant Garamond (títulos) + Inter (texto), `display=swap`.
- Hierarquia fixa da equipe: `fundador` > `socio` > `parceiro` (rótulos: "Sócios Fundadores", "Sócios", "Parceiros / Correspondentes").
- Nunca exibir nomes/fotos de profissionais junto às áreas de atuação; perfis **não** mostram o chip de área que existe hoje.
- Nenhuma imagem de IA/banco de imagens (`imagens-fmadv/*`, `imagens/Gemini_*`). Só fotos reais da equipe.
- Sem "Índia" em nenhum texto. Sem "especialistas", "vasta experiência", "os melhores", "complexas" em textos e descrições.
- Domínio canônico: `https://www.fm-advogados.com.br`. Tag Google Ads `AW-17916394466` em todas as páginas públicas, com Consent Mode v2 (default `denied`).
- Segredos só em variáveis de ambiente: `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `GITHUB_TOKEN`, `GITHUB_REPO` (`wlmoraesLopes/site-fmadv`), `GITHUB_BRANCH` (`site-novo` no teste), `SITE_ENV` (`teste` | `producao`).
- Limite de anexo: **3 MB** por arquivo bruto (base64 → ~4 MB, abaixo do limite de 4,5 MB da função). Imagens redimensionadas no navegador para no máx. 1600 px de largura, WebP qualidade 0.8 (fallback JPEG).
- Ordem de publicações: data decrescente, sempre.
- URLs atuais preservadas: `/`, `/escritorio`, `/profissionais`, `/profissionais/{franceschini,cmiranda,thays,fernando,sandra,cristhiane}`, `/publicacoes`, `/contato`.

## Review Focus

1. Publicação com data no mesmo dia de outra, ou sem resumo — a lista não pode quebrar nem mudar de ordem entre builds (desempate por título). Teste na Task 4.
2. Sessão expirada no meio de uma edição no admin — salvar deve avisar "sessão expirou, entre de novo" sem perder o que foi digitado (o formulário fica em memória e é reenviado após login). Teste na Task 8.
3. Dois salvamentos seguidos antes do deploy terminar — o segundo não pode apagar o primeiro (o `api/save` sempre parte do HEAD atual do ramo e grava só os arquivos enviados). Teste na Task 7.
4. Slug repetido ou com acento/espaço ao cadastrar profissional ou publicação — gerar slug único em ASCII (`maria-joao`, `maria-joao-2`). Teste na Task 3.
5. Arquivo acima de 3 MB ou de tipo não suportado — recusado no navegador com mensagem clara e de novo no servidor (HTTP 413/415). Teste na Task 7.

---

## Estrutura de arquivos (ramo `site-novo`)

```
package.json            scripts: build, test; dep: sanitize-html
vercel.json             buildCommand, outputDirectory "public", cleanUrls, redirects, headers
content/site.json       dados do escritório (endereço, contatos, redes, textos do Escritório, adsConversion)
content/areas.json      6 áreas (slug, nome, abertura, itens) + nota geral
content/profissionais.json
content/publicacoes.json
uploads/profissionais/  fotos
uploads/publicacoes/    imagens e PDFs das publicações
assets/css/site.css     estilos públicos (Layout 4)
assets/js/site.js       menu hambúrguer, acordeão, filtros, cookies + consent, conversões
assets/img/             logo (logo-mask.png de modelos-fm)
lib/text.mjs            slugify, uniqueSlug, parseDataExtenso, formatDate
lib/content.mjs         loadContent, sortPublicacoes, validação de schema
lib/html.mjs            esc, sanitizeRich
lib/seo.mjs             headTags, jsonLd
lib/layout.mjs          page(): shell com head, header, footer, cookie banner
lib/pages/*.mjs         home, escritorio, areas, profissionais, perfil, publicacoes, publicacao, contato, privacidade, notfound
lib/auth.mjs            hashPassword, verifyPassword, signSession, verifySession, rateLimiter
lib/github.mjs          readFile, commitFiles
lib/validate.mjs        validateSave(payload)
api/login.mjs, api/logout.mjs, api/load.mjs, api/save.mjs
admin/index.html, admin/admin.css, admin/admin.js, admin/media.js
scripts/build.mjs       gera public/
scripts/migrate.mjs     migração única do site atual → content/ (executada uma vez, saída commitada)
scripts/hash-password.mjs
tests/*.test.mjs
google2ad6f5776b26239e.html   (copiado para public/ no build)
```

### Schemas (Produces — usados por todas as tarefas)

```js
// content/profissionais.json
{ "profissionais": [ {
  "slug": "thays", "nome": "Thays Regina Martins Fontes Moreira",
  "categoria": "fundador" | "socio" | "parceiro", "ordem": 1,
  "titulo": "Sócia",                 // texto livre abaixo do nome
  "foto": "/uploads/profissionais/thays.jpg",
  "email": "thays@fm-advogados.com.br",
  "links": [ { "rotulo": "LinkedIn", "url": "https://..." } ],
  "curriculo": "<p>…</p>",          // HTML restrito (sanitizeRich)
  "resumo": "texto puro ≤160 chars para meta description",
  "obras": [ { "titulo": "…", "detalhe": "…", "ano": "2022" } ]
} ] }

// content/publicacoes.json
{ "publicacoes": [ {
  "slug": "direito-concorrencial-e-a-protecao-de-dados", "titulo": "…",
  "data": "2021-02-12",              // ISO yyyy-mm-dd
  "autor": "José Inácio Gonzaga Franceschini",
  "tipo": "artigo" | "livro" | "podcast" | "entrevista" | "evento" | "reconhecimento",
  "resumo": "texto puro", "conteudo": "<p>…</p>",
  "capa": "/uploads/publicacoes/x.webp" | null,
  "legado": { "id": "4" } | { "noticia": 2 } | null
} ] }

// content/areas.json
{ "areas": [ { "slug": "concorrencia", "nome": "Direito da Concorrência", "abertura": "…", "itens": ["…"] } ],
  "nota": "…" }
```

Slugs de área (ordem fixa, igual ao índice do Layout 4): `concorrencia`, `societario`, `civil`, `trabalhista`, `penal`, `administrativo`.
Rótulos de tipo: `{artigo:"Artigo", livro:"Livro", podcast:"Podcast / Webinar", entrevista:"Entrevista", evento:"Evento", reconhecimento:"Reconhecimento"}`.

---

### Task 1: Ramo, esqueleto e utilitários de texto

**Files:**
- Create: `package.json`, `vercel.json`, `lib/text.mjs`, `tests/text.test.mjs`, `.vercelignore`
- Modify: `.gitignore` (adicionar `public/`)
- Delete (no ramo): todos os arquivos rastreados do site antigo **depois** da Task 2 (ver Task 2, passo final)

**Interfaces:**
- Produces: `slugify(s: string): string`, `uniqueSlug(base: string, existentes: string[]): string`, `parseDataExtenso(s: string): string|null` (→ `yyyy-mm-dd`), `formatDate(iso: string): string` (→ `12 de fevereiro de 2021`)

- [ ] **Step 1:** `git switch -c site-novo` a partir de `main` (o working tree tem mudanças locais em `.gitignore` e `.claude/settings.local.json`; não as incluir nos commits deste ramo, exceto a linha `public/` no `.gitignore`).
- [ ] **Step 2: Testes que falham** em `tests/text.test.mjs`:

```js
assert.equal(slugify('Direito Concorrencial: em que medida?'), 'direito-concorrencial-em-que-medida');
assert.equal(slugify('ENTROPIA JURÍDICA – O ÓBVIO'), 'entropia-juridica-o-obvio');
assert.equal(uniqueSlug('maria-joao', ['maria-joao']), 'maria-joao-2');
assert.equal(uniqueSlug('maria-joao', ['maria-joao','maria-joao-2']), 'maria-joao-3');
assert.equal(parseDataExtenso('12 de fevereiro de 2021'), '2021-02-12');
assert.equal(parseDataExtenso('05 DE FEVEREIRO DE 2026'), '2026-02-05');
assert.equal(parseDataExtenso('23 de Agosto de 2021'), '2021-08-23');
assert.equal(parseDataExtenso('28 de março de 2021'), '2021-03-28');
assert.equal(parseDataExtenso('sem data'), null);
assert.equal(formatDate('2021-02-12'), '12 de fevereiro de 2021');
```
- [ ] **Step 3:** `npm test` (= `node --test tests/`) → FAIL (módulo inexistente).
- [ ] **Step 4:** Implementar `lib/text.mjs` (slugify: NFD, remove diacríticos, minúsculas, não-alfanumérico → `-`, apara; limite 80 chars em fronteira de palavra). `package.json`: `"type":"module"`, scripts `build: node scripts/build.mjs`, `test: node --test tests/`, dependência `sanitize-html` (versão estável atual, exata). `vercel.json`: `buildCommand: "npm run build"`, `outputDirectory: "public"`, `cleanUrls: true`, `trailingSlash: false`, redirects 301 (`/profissionais/fernanda` e `/profissionais/flavia` → `/profissionais`; `/noticia1` → publicação "NOVA OBRA – Competition Law in Brazil, Fourth Edition" de 2026-02-05 (id legado 17) — ver Task 2; `/noticia2`, `/noticia3` → suas publicações; `/index` → `/`), header `X-Robots-Tag: noindex, nofollow` em `/(.*)` (removido só na entrada no ar), `Cache-Control: public, max-age=3600` exceto `/admin` e `/api` (`no-store`). `.vercelignore`: `scripts/migrate.mjs`, `tests`, `docs`, `.superpowers`.
- [ ] **Step 5:** `npm install && npm test` → PASS.
- [ ] **Step 6:** Commit `chore: inicia ramo site-novo com esqueleto e utilitários de texto`.

### Task 2: Migração do conteúdo atual → `content/`

**Files:**
- Create: `scripts/migrate.mjs`, `content/profissionais.json`, `content/publicacoes.json`, `uploads/**`, `tests/content.test.mjs`
- Fonte (leitura): `profissionais/*.html`, `profissionais/*.jpg`, `artigos.json`, `noticia2.html`, `noticia3.html`, `noticias.json`, `static/uploads/*`

**Interfaces:**
- Consumes: `lib/text.mjs`
- Produces: os dois JSON no schema acima; arquivos em `uploads/profissionais/<slug>.jpg` e `uploads/publicacoes/<nome>`

- [ ] **Step 1: Testes que falham** em `tests/content.test.mjs` (lendo os JSON gerados):
  - profissionais: exatamente os slugs `franceschini, cmiranda, thays, fernando, sandra, cristhiane`; nenhum `nome` contém "Flávia"/"Flavia"; `franceschini`,`cmiranda` → `fundador`; `thays`,`fernando`,`sandra` → `socio`; `cristhiane` → `parceiro`; `franceschini.obras.length === 10` e `obras[8].titulo === 'Competition Law in Brazil'`; todo `foto` existe em disco; todo `curriculo` não vazio e sem `<script`.
  - publicações: `length === 19` (17 de `artigos.json` + 2 informes); todas com `data` ISO válida; os dois informes têm `data === '2025-11-26'` e `legado.noticia` 2 e 3; a de `legado.noticia === 3` tem `autor` contendo "Flávia Maria Pelliciari"; `tipo` ∈ os 6 valores; slugs únicos; nenhum `src="/static/uploads/` restante (reescrito para `/uploads/publicacoes/`); todo arquivo referenciado existe.
  - global: nenhum texto em ambos os JSON contém `Índia`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar `scripts/migrate.mjs`: extrai de cada `profissionais/<slug>.html` nome (`h1.profile-name`), título (`p.profile-role`; para `cristhiane` manter "Advogada e Economista"), e-mail (`.email-label`), parágrafos do currículo (bloco de texto do perfil, preservando `<span class="highlight-text">` como `<strong>`), obras de `.book-item-elegant` (separar título/detalhe/ano: "Direito Concorrencial (Tratado de Direito Empresarial, vol. VII) - 3ª ed., 2022" → `{titulo:"Direito Concorrencial", detalhe:"Tratado de Direito Empresarial, vol. VII · 3ª ed.", ano:"2022"}`; idem Wolters Kluwer 2025 e Thomson Reuters "publicação pendente" 2026). Ignora o chip de área. Copia fotos. Publicações: mapeia `artigos.json` (data via `parseDataExtenso`, `legado.id`), converte informes 2 e 3 a partir do HTML de `noticia2.html`/`noticia3.html` (título de `noticias.json`); **não** migra `noticia1`. `tipo` por regra de título: contém "PODCAST" ou "WEBINAR" → `podcast`; "EDIÇÃO DA OBRA"/"NOVA OBRA" → `livro`; "ENTREVISTA" → `entrevista`; "RANKING"/"MAIS ADMIRADAS" → `reconhecimento`; "ASSOCIAÇÃO"/"APRESENTAÇÃO" → `evento`; senão `artigo`. `resumo`: texto puro, ≤ 220 chars. Uso de regex/parse simples é suficiente (arquivos fixos, migração única).
- [ ] **Step 4:** `node scripts/migrate.mjs && npm test` → PASS. Revisar à mão os tipos atribuídos e o redirect de `/noticia1` no `vercel.json` (aponta para o slug da publicação de id legado 17).
- [ ] **Step 5:** Remover do ramo todos os arquivos antigos rastreados (`git rm` de tudo que não está na estrutura acima, mantendo `google2ad6f5776b26239e.html`, `CLAUDE.md`, `docs/`, `.gitignore`). Commit `feat: migra conteúdo do site atual para content/ e remove arquivos antigos do ramo`.

### Task 3: Conteúdo editorial (Escritório, Áreas, site) e carga/ordenação

**Files:**
- Create: `content/site.json`, `content/areas.json`, `lib/content.mjs`, `tests/content-lib.test.mjs`

**Interfaces:**
- Produces: `loadContent(dir='content'): {site, areas, profissionais, publicacoes}` (já validado; lança `Error` com o campo inválido), `sortPublicacoes(list): list` (data desc, desempate título asc pt-BR), `porCategoria(profissionais): {fundador:[], socio:[], parceiro:[]}` (cada uma ordenada por `ordem`, depois `nome`)

- [ ] **Step 1: Testes que falham:** `sortPublicacoes` com duas datas iguais ordena por título e é estável entre chamadas; `porCategoria` respeita `ordem`; `loadContent` lança erro citando `categoria` quando vale `"advogado"`; `areas.length === 6` com os slugs fixos na ordem; nenhum texto de `site.json`/`areas.json` contém `Índia`, `especialista`, `vasta experiência`, `complexa`; `site.escritorio` contém `(EUA e Europa)`; área `concorrencia` contém itens com "antidumping" e "Avaliação de risco de práticas comerciais"; área `civil` não contém "Disputas societárias"; `areas.nota` contém "parcerias".
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Escrever `content/site.json` — `nome`, `telefone` "+55 (11) 3095-2566", `email` "adv-fm@fm-advogados.com.br", endereço (Rua Henri Dunant, nº 792, 8º andar, Conjunto 805 — Santo Amaro, São Paulo/SP — CEP 04709-110), `geo` (-23.6274191, -46.6975563), `cnpj` "68.314.343/0001-64", `fundacao` "1992", redes (Instagram `https://www.instagram.com/franceschinimiranda/`, LinkedIn `https://www.linkedin.com/company/franceschini-miranda-advogados/`), `googleForm` (URL e `entry.*` copiados de `contato.html:759-767` no `main`), `adsId` "AW-17916394466", `adsConversion: {contato:null, whatsapp:null}`, `credito` (texto/link do rodapé atual), `posicionamento` (frase do topo do Layout 4), `escritorio` (parágrafos da Apresentação de `escritorio.html`, com "(EUA e Europa)"). `content/areas.json` com o texto revisado conforme a seção "Áreas de atuação" da spec. Implementar `lib/content.mjs`.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: conteúdo editorial revisado e carga de conteúdo`.

### Task 4: Shell, SEO, CSS e build base

**Files:**
- Create: `lib/html.mjs`, `lib/seo.mjs`, `lib/layout.mjs`, `assets/css/site.css`, `assets/js/site.js`, `assets/img/*`, `scripts/build.mjs`, `tests/seo.test.mjs`, `tests/build.test.mjs`

**Interfaces:**
- Consumes: `loadContent`, `formatDate`
- Produces: `esc(s): string`; `sanitizeRich(html): string` (permite `p br strong em b i u ul ol li a[href,target,rel] h3 h4 blockquote img[src,alt,width,height] figure figcaption`; força `rel="noopener"` em `target=_blank`; só `http(s):`, `mailto:` e caminhos `/uploads/`); `headTags({title, description, path, image?, type?, noindex}): string`; `jsonLd(obj): string`; `page({site, title, description, path, body, active, image?, type?, ld?: object[]}): string`; `build({contentDir, outDir, env}): Promise<{paginas: string[]}>` (lista de paths públicos, usada pelo sitemap)

- [ ] **Step 1: Testes que falham:**
  - `headTags` contém `<title>T | Franceschini e Miranda Advogados</title>` (exceto Home: só o nome), `meta name="description"`, `link rel="canonical" href="https://www.fm-advogados.com.br/escritorio"`, `og:title`, `og:description`, `og:url`, `og:image` (padrão `/assets/img/og-default.jpg`), `twitter:card`; com `noindex:true` contém `<meta name="robots" content="noindex, nofollow">`.
  - `page()` contém `lang="pt-BR"`, exatamente um `<h1`, gtag `AW-17916394466` precedido de `gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'})`, link do menu ativo com `aria-current="page"`, botão hambúrguer com `aria-expanded`, link para `/politica-de-privacidade` no banner de cookies, e **não** contém `PT | EN`.
  - `sanitizeRich('<p onclick="x">a<script>b</script></p>')` → `<p>a</p>`; `<a href="javascript:x">` perde o href.
  - `build()` num diretório temporário gera `index.html` e copia `assets/` e `uploads/`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar. CSS: portar as regras de `layout-4.html` (header, hero, índice de áreas, facts, about, team/frame com cantoneiras e grayscale→cor, pubs, rodapé escuro) para `site.css`, mais menu hambúrguer ≤ 860 px. `site.js`: hambúrguer; banner de cookies (Aceitar/Rejeitar/Configurar, guarda escolha em `localStorage` com try/catch; ao aceitar chama `gtag('consent','update',{…:'granted'})`); `window.fmConversao(nome)` que dispara `gtag('event','conversion',{send_to: adsId+'/'+label})` só se o label em `site.adsConversion[nome]` existir (o build injeta `window.FM_ADS` com id e labels). `build.mjs` passa `noindex = env.SITE_ENV !== 'producao'`. Remover a dependência de Font Awesome do site atual: ícones em SVG inline.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: shell das páginas, SEO, consentimento e build`.

### Task 5: Páginas institucionais (Home, Escritório, Áreas, Contato, Privacidade, 404)

**Files:**
- Create: `lib/pages/home.mjs`, `escritorio.mjs`, `areas.mjs`, `contato.mjs`, `privacidade.mjs`, `notfound.mjs`; `tests/pages-inst.test.mjs`
- Modify: `scripts/build.mjs` (registrar páginas)

**Interfaces:**
- Consumes: `page`, `esc`, `jsonLd`, `porCategoria`, `sortPublicacoes`
- Produces: cada módulo exporta `render(content): {path, html}`; `notfound` grava `404.html`

- [ ] **Step 1: Testes que falham** (build em pasta temporária, ler HTML):
  - `index.html`: índice com 6 links `href="/areas-de-atuacao#<slug>"` na ordem fixa e `Ver as áreas` → `/areas-de-atuacao`; equipe em 3 grupos na ordem Sócios Fundadores / Sócios / Parceiros / Correspondentes; 3 publicações mais recentes (a mais recente primeiro); JSON-LD `LegalService` com `telephone`, `address.postalCode "04709-110"`, `sameAs` com Instagram e LinkedIn; nenhuma `<img` de `imagens-fmadv`.
  - `areas-de-atuacao.html`: 6 `<details id="<slug>">`; nenhum nome de profissional (checar todos os `nome` de `profissionais.json`); `site.js` abre o `<details>` cujo id está no hash.
  - `escritorio.html`: contém "(EUA e Europa)", não contém "Índia".
  - `contato.html`: `<form` com campos `nome, email, telefone, empresa, assunto, mensagem` e envio para a URL do Google Forms de `site.json`; link `wa.me` dispara `fmConversao('whatsapp')`; envio do formulário dispara `fmConversao('contato')`; iframe do mapa com `loading="lazy"`.
  - `politica-de-privacidade.html`: menciona "LGPD", "cookies" e "Google Ads", e o e-mail do escritório.
  - Todas as páginas: `description` com 50–160 caracteres.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar seguindo o Layout 4 e a spec (Home sem foto dos sócios no topo; "Fale com o escritório" no rodapé). Política de Privacidade: texto padrão simples (controlador, dados do formulário, cookies essenciais/analíticos/marketing, Google Ads, direitos LGPD, contato), com comentário HTML `<!-- revisar com os sócios -->`.
- [ ] **Step 4:** `npm test` → PASS. Verificação visual: `npx serve public` (ou `vercel dev`) e conferir em 1280 px e 390 px. Commit `feat: páginas institucionais`.

### Task 6: Profissionais, perfis (Obras Publicadas), Publicações, sitemap e robots

**Files:**
- Create: `lib/pages/profissionais.mjs`, `perfil.mjs`, `publicacoes.mjs`, `publicacao.mjs`; `tests/pages-dyn.test.mjs`
- Modify: `scripts/build.mjs` (perfis, publicações, `sitemap.xml`, `robots.txt`), `assets/css/site.css`, `assets/js/site.js` (filtros)

**Interfaces:**
- Consumes: Tasks 3–5
- Produces: `/profissionais/<slug>.html`, `/publicacoes/<slug>.html`, `/sitemap.xml`, `/robots.txt`

- [ ] **Step 1: Testes que falham:**
  - `profissionais.html`: 3 seções com títulos exatos, `cristhiane` na terceira; nenhum "Flávia"; nenhum texto "Advogados" como título de grupo.
  - `profissionais/franceschini.html`: seção "Obras publicadas" com 10 `.obra` na ordem do JSON, cada uma com título, detalhe e ano quando houver; JSON-LD `Person` com `name`, `jobTitle`, `worksFor`; sem chip de área. `profissionais/thays.html`: **sem** seção de obras.
  - `publicacoes.html`: 19 itens na ordem de `sortPublicacoes`; botões de filtro por tipo (só tipos presentes) e seletor de autor; cada item linka `/publicacoes/<slug>`; nenhum chip "Informes".
  - `publicacoes/<slug>.html`: `h1` = título, data formatada, autor, conteúdo sanitizado, JSON-LD `Article` (`headline`, `datePublished`, `author`); link de YouTube no conteúdo aparece como miniatura clicável.
  - `sitemap.xml`: contém `/`, `/escritorio`, `/areas-de-atuacao`, `/profissionais`, os 6 perfis, `/publicacoes`, as 19 publicações, `/contato`, `/politica-de-privacidade`, todos com o domínio canônico; `<lastmod>` nas publicações = `data`.
  - `robots.txt`: em `producao` → `Allow: /`, `Disallow: /admin`, `Disallow: /api`, `Sitemap: https://www.fm-advogados.com.br/sitemap.xml`; em `teste` → `Disallow: /`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar. Obras: o estilo escolhido é a variação 3 de `.superpowers/brainstorm/1816-1793212377/content/obras-capas-v2.html` — copiar as regras `.cover`, `.v3` (capa clara 2:3, cantoneiras douradas, no hover `.bgfill` vai de opacidade 0→1 com gradiente `160deg,#4a3426,#2f2119`, título fica `#f3e7d3`, detalhes `#c9a46a`, cantoneiras crescem, linha sob o título 28→60 px); no toque (celular) o estado escuro aparece em `:focus-within`/`:active`. Filtros em `site.js` sem recarregar a página (atributos `data-tipo`, `data-autor`), com estado na URL (`?tipo=livro`).
- [ ] **Step 4:** `npm test` → PASS. Verificação visual como na Task 5. Commit `feat: profissionais, perfis com obras, publicações, sitemap e robots`.

### Task 7: Backend do admin (auth, leitura e gravação no GitHub)

**Files:**
- Create: `lib/auth.mjs`, `lib/github.mjs`, `lib/validate.mjs`, `api/login.mjs`, `api/logout.mjs`, `api/load.mjs`, `api/save.mjs`, `scripts/hash-password.mjs`; `tests/auth.test.mjs`, `tests/save.test.mjs`

**Interfaces:**
- Produces:
  - `hashPassword(pw): Promise<string>` → `scrypt$<saltB64>$<hashB64>`; `verifyPassword(pw, stored): Promise<boolean>` (timing-safe)
  - `signSession(secret, ttlSec=28800): string`; `verifySession(secret, token): boolean`
  - `rateLimiter({max:5, windowMs:600000})` com `.blocked(ip)`, `.fail(ip)`, `.reset(ip)`
  - `readFile({repo, branch, path, token, fetch}): Promise<{text, sha}>`
  - `commitFiles({repo, branch, token, message, files:[{path, content, encoding:'utf-8'|'base64'}], fetch}): Promise<{commitSha}>` — Git Data API: GET ref → GET commit → POST blobs → POST tree com `base_tree` = tree do HEAD → POST commit → PATCH ref (`force:false`); em 422 por ref desatualizada, refaz uma vez a partir do novo HEAD.
  - `validateSave(payload): {ok:true, files}|{ok:false, status, error}`
  - HTTP: `POST /api/login {senha}` → 200 + cookie `fm_admin` (`HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`) | 401 | 429; `POST /api/logout`; `GET /api/load` → `{profissionais, publicacoes}` do ramo (401 sem sessão); `POST /api/save {mensagem, json:{profissionais?, publicacoes?}, arquivos:[{path, base64}]}` → `{ok, commitSha}` | 401 | 413 | 415 | 400

- [ ] **Step 1: Testes que falham** (com `fetch` falso injetado):
  - `verifyPassword` certo/errado; sessão adulterada ou expirada → `false`.
  - limiter: 5 falhas → `blocked` true; `reset` libera.
  - `validateSave`: caminho fora de `uploads/profissionais/` ou `uploads/publicacoes/` → 400; `../` → 400; extensão fora de `.jpg .jpeg .png .webp .pdf` → 415; arquivo > 3 MB decodificado → 413; `json.profissionais` que falha na validação de `lib/content.mjs` → 400 com o campo.
  - `commitFiles`: usa `base_tree` do HEAD e envia só os arquivos recebidos (simulando dois saves seguidos, o segundo parte do commit do primeiro e o arquivo do primeiro continua na árvore); em 422 tenta de novo uma vez.
  - `api/save` sem cookie → 401; `api/login` com corpo vazio → 400.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar (funções Node padrão da Vercel: `export default async function handler(req, res)`). `api/save` grava `content/profissionais.json` / `content/publicacoes.json` com `JSON.stringify(x, null, 2) + '\n'`. `scripts/hash-password.mjs` lê a senha do stdin e imprime o hash. CSRF: exigir header `X-FM-Admin: 1` além do cookie `SameSite=Strict`.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: API do admin com sessão e commit no GitHub`.

### Task 8: Interface do admin

**Files:**
- Create: `admin/index.html`, `admin/admin.css`, `admin/admin.js`, `admin/media.js`; `tests/media.test.mjs`
- Modify: `scripts/build.mjs` (copiar `admin/` para `public/admin/`, com `noindex`)

**Interfaces:**
- Consumes: HTTP da Task 7; schemas; `slugify`/`uniqueSlug` (copiar `lib/text.mjs` para `public/admin/text.mjs` no build e importar como módulo)
- Produces: `media.js` exporta `youtubeId(url): string|null`, `youtubeEmbedHtml(url): string` (miniatura `https://img.youtube.com/vi/<id>/mqdefault.jpg` com link), `checkFile(file, {maxBytes:3*1024*1024, tipos}): string|null` (mensagem de erro em PT), `resizeImage(file, {maxW:1600, quality:0.8}): Promise<Blob>`

- [ ] **Step 1: Testes que falham** (`media.test.mjs`, funções puras): `youtubeId` para `youtube.com/watch?v=dQw4w9WgXcQ`, `youtu.be/dQw4w9WgXcQ`, `youtube.com/shorts/dQw4w9WgXcQ` e URL inválida (`null`); `checkFile` com 3,1 MB → mensagem contendo "3 MB"; tipo `application/zip` → mensagem contendo "formato".
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar. Telas: Login → abas **Profissionais** e **Publicações**.
  - Profissionais: lista agrupada pelas 3 categorias (setas para reordenar dentro da categoria), botão "Novo profissional", formulário: nome, título, categoria (select com os 3 rótulos), e-mail, links, foto (prévia com moldura do site; redimensiona antes de enviar), currículo (Quill: parágrafo, negrito, itálico, lista, link), Obras (linhas título/detalhe/ano, adicionar/remover/reordenar), botão Remover com confirmação.
  - Publicações: lista por data desc com busca; formulário: título, data (`<input type="date">`), autor (datalist com os nomes dos profissionais + autores já usados), tipo, resumo, capa opcional, conteúdo (Quill com botões: imagem → upload redimensionado; YouTube → cola URL e insere miniatura; PDF → upload e insere link "Baixar PDF"; link).
  - Salvar: monta o payload só com o JSON alterado e os arquivos novos, mostra "Publicando… o site atualiza em cerca de 1 minuto". Em 401, abre o login num modal mantendo o formulário em memória e reenvia após entrar. Em 413/415/400 mostra a mensagem do servidor.
  - Aviso de navegação (`beforeunload`) com alterações não salvas.
- [ ] **Step 4:** `npm test` → PASS. Teste manual com `vercel dev` e um ramo de rascunho (`GITHUB_BRANCH=admin-teste-local`): login, criar profissional "Teste Correspondente" com foto, criar publicação com imagem + YouTube + PDF, conferir o commit no GitHub, depois apagar o ramo de rascunho. Commit `feat: interface do painel de admin`.

### Task 9: Ambiente de teste no ar (novo-fm.fluxon.ia.br)

**Files:**
- Create: `docs/admin-e-publicacao.md` (como entrar no admin, trocar a senha, onde ficam os dados; como colocar no ar — passo a passo da entrada no ar, **não executado**)

- [ ] **Step 1:** `npm test && npm run build` → PASS; `public/` sem `imagens-fmadv`, sem `Índia` (`grep -ri india public` vazio).
- [ ] **Step 2:** Push do ramo: `git push -u origin site-novo` (conta `wlmoraesLopes`).
- [ ] **Step 3:** Vercel do teste — projeto novo `site-fm-novo` na conta fluxonart (team `waldemirs-projects-57034936`), conectado ao repo `wlmoraesLopes/site-fmadv` com **Production Branch = `site-novo`**, domínio `novo-fm.fluxon.ia.br` (CNAME `cname.vercel-dns.com` no Registro.br, ou A 76.76.21.21 como em modelos). Variáveis: `SITE_ENV=teste`, `GITHUB_REPO=wlmoraesLopes/site-fmadv`, `GITHUB_BRANCH=site-novo`, `GITHUB_TOKEN` (fine-grained, só este repo, Contents: read/write), `ADMIN_PASSWORD_HASH` (de `node scripts/hash-password.mjs`), `SESSION_SECRET` (32 bytes aleatórios). Passos que exigem login do usuário (conectar GitHub à conta Vercel, criar o token, DNS, escolher a senha) são entregues como instruções para ele executar; deploy de produção fica com o usuário (`!` no prompt), como já é o hábito no modo auto.
- [ ] **Step 4:** Verificar no ar: todas as rotas do sitemap respondem 200; `/noticia2` e `/profissionais/flavia` → 301; header `X-Robots-Tag: noindex`; login no `/admin` funciona; um salvamento de teste gera commit em `site-novo` e novo deploy (depois desfazer o item de teste pelo próprio admin).
- [ ] **Step 5:** Commit `docs: guia do admin e da entrada no ar` e push.

### (Fora deste plano, só com confirmação do usuário) Entrada no ar

Mesclar `site-novo` em `main`, remover o header `X-Robots-Tag` do `vercel.json`, configurar no projeto Vercel `site-fmadv` as variáveis com `SITE_ENV=producao` e `GITHUB_BRANCH=main`. Descrito em `docs/admin-e-publicacao.md`.
