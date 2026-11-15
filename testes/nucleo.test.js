import test from 'node:test';
import assert from 'node:assert/strict';

import {
  inicial, copia, pontos, vidasTotais, grau, aparicoes, problemas, chave,
  componentes, raiz, junta,
} from '../js/nucleo.js';
import { jogadas, acabou } from '../js/jogadas.js';
import { Motor, resultado, comprimentos, partidaAoAcaso } from '../js/busca.js';
import { limitesDoComprimento, partidasAoAcaso, padraoConhecido } from '../js/juiz.js';

/* ------------------------------------------------------------- a posicao */

test('a posicao inicial tem n pontos soltos, 3n vidas e uma regiao', () => {
  for (let n = 1; n <= 6; n++) {
    const p = inicial(n);
    assert.equal(pontos(p), n);
    assert.equal(vidasTotais(p), 3 * n);
    assert.equal(p.regioes.length, 1);
    assert.equal(p.regioes[0].soltos.length, n);
    assert.equal(p.regioes[0].fronteiras.length, 0);
    assert.deepEqual(problemas(p), []);
  }
});

test('copiar nao compartilha nada com o original', () => {
  const a = inicial(3);
  const b = copia(a);
  b.vidas.set(0, 0);
  b.regioes[0].soltos.push(99);
  assert.equal(a.vidas.get(0), 3);
  assert.equal(a.regioes[0].soltos.length, 3);
});

test('grau e vidas sao as duas faces da mesma moeda', () => {
  const p = inicial(2);
  assert.equal(grau(p, 0), 0);
  const q = jogadas(p)[0];
  for (const [id, v] of q.vidas) assert.equal(grau(q, id), 3 - v);
});

test('a uniao de conjuntos liga os pontos de uma jogada', () => {
  const p = inicial(3);
  assert.equal(componentes(p), 3);
  const q = jogadas(p).find((x) => componentes(x) === 2);
  assert.ok(q, 'alguma jogada tem que juntar dois pontos');
  junta(q, 0, 1);
  assert.equal(raiz(q, 0), raiz(q, 1));
});

/* ---------------------------------------------------------- as jogadas */

test('o numero de primeiras jogadas sai de uma conta, e a conta fecha', () => {
  // Com n pontos soltos numa regiao so: ou se liga dois deles (1 jeito),
  // ou se faz um laco num deles e os outros n-1 se repartem entre as duas
  // regioes novas, que sao simetricas: floor((n-1)/2) + 1 jeitos.
  assert.equal(jogadas(inicial(1)).length, 1, 'com um ponto so nao da para ligar dois');
  for (let n = 2; n <= 7; n++) {
    assert.equal(jogadas(inicial(n)).length, Math.floor((n - 1) / 2) + 2, 'n=' + n);
  }
});

test('toda jogada gasta duas vidas e cria um ponto com uma', () => {
  for (let n = 1; n <= 3; n++) {
    const p = inicial(n);
    for (const q of jogadas(p)) {
      assert.equal(pontos(q), pontos(p) + 1);
      assert.equal(vidasTotais(q), vidasTotais(p) - 1, 'gasta 2 e cria 1: cai de um');
      assert.equal(q.feitas, p.feitas + 1);
    }
  }
});

test('nenhuma jogada repete posicao', () => {
  for (let n = 1; n <= 4; n++) {
    const js = jogadas(inicial(n));
    assert.equal(new Set(js.map(chave)).size, js.length, 'n=' + n);
  }
});

test('as contas de dentro valem em toda posicao de profundidade 2', () => {
  for (let n = 1; n <= 3; n++) {
    for (const a of jogadas(inicial(n))) {
      assert.deepEqual(problemas(a), [], 'n=' + n);
      for (const b of jogadas(a)) assert.deepEqual(problemas(b), [], 'n=' + n);
    }
  }
});

test('Euler aponta o erro quando o numero de regioes e mexido na mao', () => {
  // Um juiz que nunca discordou pode nao estar medindo nada. Este
  // discorda assim que a posicao e estragada de proposito.
  const p = jogadas(inicial(2)).find((x) => x.regioes.length === 2);
  assert.ok(p, 'alguma jogada de n=2 parte a regiao');
  assert.deepEqual(problemas(p), []);
  const estragada = copia(p);
  estragada.regioes.push({ fronteiras: [], soltos: [] });
  assert.ok(problemas(estragada).some((x) => x.includes('Euler')), 'Euler nao reclamou');
});

test('a posicao final e a que nao tem jogada', () => {
  let p = inicial(1);
  const js = jogadas(p);
  assert.equal(js.length, 1);
  p = js[0];
  assert.equal(jogadas(p).length, 1);
  p = jogadas(p)[0];
  assert.equal(acabou(p), true, 'n=1 acaba em duas jogadas');
});

/* ------------------------------------------------------------- a busca */

test('quem ganha com 1, 2 e 3 pontos', () => {
  assert.equal(resultado(1).vencedor, 'segundo');
  assert.equal(resultado(2).vencedor, 'segundo');
  assert.equal(resultado(3).vencedor, 'primeiro');
});

test('a memoria do motor nao muda a resposta', () => {
  for (let n = 1; n <= 3; n++) {
    const a = new Motor().deN(n);
    const b = new Motor().deN(n);
    assert.equal(a, b, 'n=' + n);
  }
});

/* ------------------------------------------------------- o comprimento */

test('os limites do comprimento sao 2n e 3n-1', () => {
  assert.deepEqual(limitesDoComprimento(3), { minimo: 6, maximo: 8 });
  assert.deepEqual(limitesDoComprimento(10), { minimo: 20, maximo: 29 });
});

test('toda partida de n ate 3 cai dentro dos limites, e todos os valores aparecem', () => {
  for (let n = 1; n <= 3; n++) {
    const c = comprimentos(n);
    assert.equal(c.minimo, 2 * n, 'n=' + n);
    assert.equal(c.maximo, 3 * n - 1, 'n=' + n);
    assert.equal(c.comprimentos.length, n, 'de 2n a 3n-1 sao n valores');
    assert.equal(c.todosOsValoresEntreOsLimites, true, 'n=' + n);
  }
});

test('partidas sorteadas de n maior tambem respeitam os limites', () => {
  for (const n of [4, 5, 6]) {
    const s = partidasAoAcaso(n, 40);
    assert.equal(s.foraDosLimites, 0, 'n=' + n);
    assert.equal(s.posicoesQuebradas, 0, 'n=' + n);
    for (const m of s.comprimentos) {
      assert.ok(m >= 2 * n && m <= 3 * n - 1, 'n=' + n + ' durou ' + m);
    }
  }
});

test('uma partida ao acaso termina com os pontos e as vidas certos', () => {
  for (const n of [2, 3, 4]) {
    const p = partidaAoAcaso(n);
    assert.equal(p.pontosNoFim, n + p.jogadas);
    assert.equal(p.vidasNoFim, 3 * n - p.jogadas);
    assert.equal(p.caminho.length, p.jogadas + 1);
  }
});

/* ------------------------------------------------------------ o gabarito */

test('o padrao conhecido e periodico de seis em seis', () => {
  for (let n = 1; n <= 30; n++) {
    assert.equal(padraoConhecido(n), padraoConhecido(n + 6), 'n=' + n);
  }
  assert.equal(padraoConhecido(3), 'primeiro');
  assert.equal(padraoConhecido(6), 'segundo');
  assert.equal(padraoConhecido(9), 'primeiro');
});

test('a chave nao depende dos nomes dos pontos', () => {
  const a = inicial(3);
  const b = inicial(3);
  // os ids sao os mesmos, mas a chave nao os usa: trocar as vidas de dois
  // pontos iguais nao muda a chave
  assert.equal(chave(a), chave(b));
  assert.equal(chave(a), '[]{3}');
});

test('aparicoes conta o grau de cada ponto', () => {
  let p = inicial(3);
  for (let k = 0; k < 3; k++) {
    const js = jogadas(p);
    if (js.length === 0) break;
    p = js[0];
    const ap = aparicoes(p);
    for (const [id, v] of p.vidas) assert.equal(ap.get(id), 3 - v, 'ponto ' + id);
  }
});
