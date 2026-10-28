# Painel do site e publicação

## Como usar o painel

1. Acesse `/admin` (no teste: `https://novo-fm.fluxon.ia.br/admin`; depois do lançamento: `https://www.fm-advogados.com.br/admin`).
2. Digite a senha. A sessão vale 8 horas. Cinco senhas erradas seguidas bloqueiam por 10 minutos.
3. **Profissionais**: "Novo profissional" ou clique num nome. Categoria define a linha da equipe
   (Sócios Fundadores › Sócios › Parceiros / Correspondentes). As setas ▲▼ mudam a ordem dentro da linha.
   "Obras publicadas" aparecem como capas no perfil.
4. **Publicações**: "Nova publicação" ou clique num item. A data define a ordem (mais recentes primeiro).
   No texto: 🖼 Imagem, ▶ YouTube (cole o endereço do vídeo), 📄 PDF (até 3 MB) e 🔗 Link.
5. Clique em **Publicar**. O site atualiza em cerca de 1 minuto.

Fotos e imagens são reduzidas automaticamente. Arquivos acima de 3 MB não são aceitos: publique como link externo.

## Onde ficam os dados

- `content/profissionais.json`, `content/publicacoes.json`: editados pelo painel.
- `content/site.json` (endereço, telefone, textos do Escritório, Google Ads) e `content/areas.json`
  (áreas de atuação): editados no código.
- `uploads/`: fotos, imagens e PDFs.
- Cada "Publicar" vira um commit no GitHub (`admin: ...`); dá para desfazer pelo histórico do git.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Valor |
|---|---|
| `SITE_ENV` | `teste` (ambiente de teste) ou `producao` (site oficial) |
| `GITHUB_REPO` | `wlmoraesLopes/site-fmadv` |
| `GITHUB_BRANCH` | `site-novo` (teste) ou `main` (oficial) |
| `GITHUB_TOKEN` | token *fine-grained* do GitHub, só deste repositório, permissão **Contents: Read and write** |
| `ADMIN_PASSWORD_HASH` | saída de `node scripts/hash-password.mjs` (digite a senha e Enter) |
| `SESSION_SECRET` | texto aleatório longo (ex.: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |

**Trocar a senha:** gere um novo hash, troque `ADMIN_PASSWORD_HASH` na Vercel e faça *Redeploy*.
Para derrubar todas as sessões abertas, troque também `SESSION_SECRET`.

## Conversões do Google Ads

`content/site.json` → `adsConversion.contato`: coloque o **rótulo de conversão** da conta Google Ads
(a parte depois da barra em `AW-17916394466/XXXXXXXX`). O envio do formulário de Contato passa a contar como conversão.

## Entrada no ar (somente com aprovação dos sócios)

1. Mesclar o ramo `site-novo` em `main`.
2. Em `vercel.json`, remover o cabeçalho `X-Robots-Tag: noindex, nofollow`.
3. No projeto Vercel `site-fmadv`: configurar as variáveis acima com `SITE_ENV=producao` e `GITHUB_BRANCH=main`;
   confirmar *Framework Preset: Other*, *Build Command* `npm run build`, *Output Directory* `public`.
4. Publicar e conferir: `/`, `/sitemap.xml`, `/robots.txt` (deve liberar o site), `/admin`.
5. No Google Search Console, enviar `https://www.fm-advogados.com.br/sitemap.xml`.
