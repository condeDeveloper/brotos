import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VARRIDOS, COMPRIMENTOS_VARRIDOS, linhaN, linhaComprimentos, primeirasJogadas,
  linhaSorteadas, padraoConhecido, limitesDoComprimento,
} from '../js/medidas.js';

// Os numeros do README, presos. O n = 4 esta em `pesados.test.js`: a
// arvore dele sozinha leva minutos.

const MINUTOS = 20 * 60 * 1000;

/* ------------------------------------------------------- quem ganha */

test('quem ganha com 1, 2 e 3 pontos, e a quantas posicoes', { timeout: MINUTOS }, () => {
  const esperado = { 1: ['segundo', 3], 2: ['segundo', 52], 3: ['primeiro', 1294] };
  for (const n of Object.keys(esperado)) {
    const r = linhaN(Number(n));
    assert.equal(r.vencedor, esperado[n][0], 'n=' + n);
    assert.equal(r.nos, esperado[n][1], 'n=' + n + ' posicoes');
  }
});

test('a busca concorda com o resultado conhecido ate onde ela alcanca', { timeout: MINUTOS }, () => {
  for (const n of [1, 2, 3]) {
    const r = linhaN(n);
    assert.equal(r.gabarito, padraoConhecido(n));
    assert.equal(r.bate, true, 'n=' + n);
  }
});

test('as contas de dentro nao quebram em nenhuma das posicoes de n ate 3', { timeout: MINUTOS }, () => {
  for (const n of [1, 2, 3]) {
    const r = linhaN(n, { conferirInvariantes: true });
    assert.equal(r.quebras, 0, 'n=' + n);
    assert.ok(r.nos > 0);
  }
});

/* --------------------------------------------------- o comprimento */

test('os comprimentos possiveis cobrem todos os valores entre 2n e 3n-1', { timeout: MINUTOS }, () => {
  const esperado = { 1: [2], 2: [4, 5], 3: [6, 7, 8] };
  assert.deepEqual(COMPRIMENTOS_VARRIDOS, [1, 2, 3]);
  for (const n of COMPRIMENTOS_VARRIDOS) {
    const c = linhaComprimentos(n);
    assert.deepEqual(c.comprimentos, esperado[n], 'n=' + n);
    assert.equal(c.todosOsValoresEntreOsLimites, true, 'n=' + n);
    assert.equal(c.quantosValoresCabem, n, 'de 2n a 3n-1 sao n valores, nao n+1');
    const lim = limitesDoComprimento(n);
    assert.equal(c.minimo, lim.minimo, 'n=' + n);
    assert.equal(c.maximo, lim.maximo, 'n=' + n);
  }
});

test('as partidas sorteadas ficam dentro dos limites ate n = 10', { timeout: MINUTOS }, () => {
  for (const n of [4, 5, 6, 8, 10]) {
    const s = linhaSorteadas(n);
    assert.equal(s.quantas, 200, 'n=' + n);
    assert.equal(s.foraDosLimites, 0, 'n=' + n);
    assert.equal(s.posicoesQuebradas, 0, 'n=' + n);
    assert.ok(s.posicoes > 1000, 'n=' + n + ' visitou so ' + s.posicoes);
    for (const m of s.comprimentos) {
      assert.ok(m >= 2 * n && m <= 3 * n - 1, 'n=' + n + ' durou ' + m);
    }
  }
});

test('as partidas sorteadas sao reproduziveis: a mesma semente da a mesma tabela', { timeout: MINUTOS }, () => {
  const a = linhaSorteadas(6, 50, 3);
  const b = linhaSorteadas(6, 50, 3);
  assert.deepEqual(a.comprimentos, b.comprimentos);
  assert.equal(a.posicoes, b.posicoes);
});

/* ---------------------------------------------------- as aberturas */

test('o numero de primeiras jogadas segue a conta, de n=1 a n=9', { timeout: MINUTOS }, () => {
  // Com n pontos soltos: ligar dois deles (1 jeito, so se n >= 2), ou um
  // laco num deles com os outros n-1 repartidos entre as duas regioes
  // novas, que sao simetricas: floor((n-1)/2) + 1 jeitos.
  assert.equal(primeirasJogadas(1), 1);
  for (let n = 2; n <= 9; n++) {
    assert.equal(primeirasJogadas(n), Math.floor((n - 1) / 2) + 2, 'n=' + n);
  }
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(primeirasJogadas), [1, 2, 3, 3, 4, 4, 5]);
});

/* ------------------------------------------------------- o gabarito */

test('o padrao conhecido se repete de seis em seis e nao e simetrico', { timeout: MINUTOS }, () => {
  const ate12 = [];
  for (let n = 1; n <= 12; n++) ate12.push(padraoConhecido(n) === 'primeiro' ? 1 : 0);
  assert.deepEqual(ate12, [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0]);
});

test('a lista de varridos e a lista de comprimentos nao sao a mesma', { timeout: MINUTOS }, () => {
  // Varrer QUEM GANHA ate n=4 custa menos que varrer QUANTO DURA ate n=4:
  // o vencedor pode cortar o galho na primeira jogada que ganha, e o
  // comprimento nao pode cortar nada.
  assert.deepEqual(VARRIDOS, [1, 2, 3, 4]);
  assert.deepEqual(COMPRIMENTOS_VARRIDOS, [1, 2, 3]);
  assert.ok(linhaComprimentos(3).nos > linhaN(3).nos,
    'a varredura de comprimento tem que visitar mais que a de vencedor');
});
