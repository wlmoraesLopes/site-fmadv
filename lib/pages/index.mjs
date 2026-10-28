// Registro das páginas geradas no build. Cada item: (ctx) => {path, html} | [{path, html}].
import { render as home } from './home.mjs';
import { escritorio, areasDeAtuacao, contato, privacidade, naoEncontrada } from './institucionais.mjs';

export const paginas = [home, escritorio, areasDeAtuacao, contato, privacidade, naoEncontrada];
