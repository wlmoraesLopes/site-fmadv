#!/bin/bash

# Navega para o diretório raiz do projeto (para garantir que estamos no lugar certo)
cd "$(dirname "$0")"

# Define a mensagem de commit
COMMIT_MSG="Atualização rápida do site"

# Verifica se o usuário forneceu uma mensagem como argumento
if [ -n "$1" ]; then
    COMMIT_MSG="$1"
fi

# 1. Prepara todos os arquivos modificados/novos
git add .
echo ""
echo "✅ Arquivos preparados (git add .)"
echo ""

# 2. Registra as alterações com a mensagem
git commit -m "$COMMIT_MSG"
echo ""
echo "✅ Alterações registradas com a mensagem: $COMMIT_MSG"
echo ""

# 3. Envia as alterações para o GitHub e aciona o Vercel
echo "🚀 Enviando para o GitHub e publicando no Vercel..."
git push

echo ""
echo "🎉 Publicação completa! O Vercel já está atualizando o site."

