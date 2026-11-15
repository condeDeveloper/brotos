import test from 'node:test';
import assert from 'node:assert/strict';

import { VARRIDOS, linhaN, linhaAberturas, linhaTeto } from '../js/medidas.js';

// A arvore de 4 pontos tem 119.144 posicoes e leva uns quatro minutos com
// as contas de dentro ligadas. Fica aqui para nao pesar na rodada curta.
//
// TODOS os testes deste arquivo pedem a MESMA varredura, com as contas
// ligadas, para que ela seja feita uma vez so: `medidas.js` guarda a
// tabela por chave, e pedir ora com as contas ora sem elas eram duas
// chaves diferentes — a suite inteira rodava a arvore de 4 pontos duas
// vezes, oito minutos em cada um dos nove jobs do CI.

const MINUTOS = 30 * 60 * 1000;
const COM_CONTAS = { conferirInvariantes: true };

test('com 4 pontos ganha o primeiro, em 119.144 posicoes', { timeout: MINUTOS }, () => {
  const r = linhaN(4, COM_CONTAS);
  assert.equal(r.vencedor, 'primeiro');
  assert.equal(r.nos, 119144);
  assert.equal(r.gabarito, 'primeiro');
  assert.equal(r.bate, true);
});

test('as contas de dentro nao quebram em nenhuma das 119.144', { timeout: MINUTOS }, () => {
  const r = linhaN(4, COM_CONTAS);
  assert.equal(r.nos, 119144);
  assert.equal(r.quebras, 0);
});

test('somando os quatro tamanhos, 120.493 posicoes conferidas e zero quebras', { timeout: MINUTOS }, () => {
  let total = 0;
  let quebras = 0;
  for (const n of VARRIDOS) {
    const r = linhaN(n, COM_CONTAS);
    total += r.nos;
    quebras += r.quebras;
  }
  assert.equal(total, 120493);
  assert.equal(quebras, 0);
});

test('com 4 pontos ha tres aberturas, as mesmas tres de 3 pontos, e duas ganham', { timeout: MINUTOS }, () => {
  const tres = linhaAberturas(3);
  const quatro = linhaAberturas(4);
  assert.equal(tres.total, 3);
  assert.equal(quatro.total, 3);
  assert.equal(tres.ganham, 2);
  assert.equal(quatro.ganham, 2);
});

test('as aberturas de 1 e 2 pontos nao ganham nenhuma', { timeout: MINUTOS }, () => {
  assert.deepEqual([1, 2].map((n) => linhaAberturas(n).ganham), [0, 0]);
  assert.deepEqual([1, 2].map((n) => linhaAberturas(n).total), [1, 2]);
});

test('com 5 pontos a busca passa de 50.000 posicoes sem terminar', { timeout: MINUTOS }, () => {
  const t = linhaTeto(5, 50000);
  assert.equal(t.nos, 50000);
  assert.equal(t.estourou, true);
  assert.equal(t.vencedor, null, 'estourar nao pode devolver um vencedor');
});

test('com teto alto o bastante, a busca de 3 pontos termina e responde', { timeout: MINUTOS }, () => {
  // O mesmo mecanismo de teto, num tamanho em que ele nao estoura.
  const t = linhaTeto(3, 100000);
  assert.equal(t.estourou, false);
  assert.equal(t.vencedor, 'primeiro');
  assert.ok(t.nos < 100000);
});

test('a arvore cresce muito mais rapido que o numero de pontos', { timeout: MINUTOS }, () => {
  const nos = VARRIDOS.map((n) => linhaN(n, COM_CONTAS).nos);
  assert.deepEqual(nos, [3, 52, 1294, 119144]);
  // cada ponto a mais multiplica por mais do que o anterior
  const razoes = nos.slice(1).map((x, i) => x / nos[i]);
  for (let i = 1; i < razoes.length; i++) {
    assert.ok(razoes[i] > razoes[i - 1], 'a razao recuou: ' + razoes.join(', '));
  }
  assert.ok(razoes[razoes.length - 1] > 90, 'de 3 para 4 pontos: ' + razoes[razoes.length - 1]);
});
