// Registro das páginas geradas no build. Cada item: (ctx) => {path, html} | [{path, html}].
import { render as home } from './home.mjs';
import { escritorio, areasDeAtuacao, contato, privacidade, naoEncontrada } from './institucionais.mjs';
import { lista as profissionais, perfis } from './profissionais.mjs';
import { lista as publicacoes, itens as publicacaoItens } from './publicacoes.mjs';

export const paginas = [home, escritorio, areasDeAtuacao, profissionais, perfis, publicacoes, publicacaoItens,
  contato, privacidade, naoEncontrada];
