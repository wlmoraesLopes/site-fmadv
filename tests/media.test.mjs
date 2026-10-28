import { test } from 'node:test';
import assert from 'node:assert/strict';
import { youtubeId, youtubeEmbedHtml, checkFile, nomeArquivo } from '../admin/media.js';

test('youtubeId reconhece os formatos comuns', () => {
  assert.equal(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://youtu.be/dQw4w9WgXcQ?t=10'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://www.youtube.com/watch?feature=x&v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://vimeo.com/123'), null);
  assert.equal(youtubeId('qualquer coisa'), null);
});

test('youtubeEmbedHtml gera miniatura clicável', () => {
  const h = youtubeEmbedHtml('https://youtu.be/dQw4w9WgXcQ');
  assert.equal(h, '<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank"><img src="https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg" alt="Vídeo no YouTube"></a></p>');
  assert.equal(youtubeEmbedHtml('x'), null);
});

test('checkFile recusa arquivo grande ou de formato não aceito', () => {
  const tipos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  assert.match(checkFile({ size: 3.1 * 1024 * 1024, type: 'application/pdf' }, { tipos }), /3 MB/);
  assert.match(checkFile({ size: 1000, type: 'application/zip' }, { tipos }), /formato/);
  assert.equal(checkFile({ size: 1000, type: 'image/png' }, { tipos }), null);
});

test('nomeArquivo gera nome seguro e único', () => {
  assert.equal(nomeArquivo('Relatório Final (v2).PDF', 'pdf', 1700000000000), 'relatorio-final-v2-1700000000000.pdf');
  assert.equal(nomeArquivo('foto.jpeg', 'webp', 5), 'foto-5.webp');
  assert.equal(nomeArquivo('###.png', 'png', 5), 'arquivo-5.png');
});
