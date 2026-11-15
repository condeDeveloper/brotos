// A varredura: a arvore de jogo inteira, a partir de n pontos.
//
// Sprouts e um jogo imparcial de jogo normal — quem nao joga, perde — e
// toda partida termina, porque cada jogada gasta duas vidas e cria so uma.
// Entao a arvore e finita e a resposta e exata: ou o primeiro ganha, ou o
// segundo ganha, sem empate e sem chute.

import { inicial, chave, pontos, vidasTotais, problemas } from './nucleo.js';
import { jogadas } from './jogadas.js';

export class Motor {
  constructor({ conferirInvariantes = false } = {}) {
    this.memoria = new Map();
    this.nos = 0;
    this.acertos = 0;
    this.conferirInvariantes = conferirInvariantes;
    this.quebras = [];
  }

  /** true se quem esta na vez GANHA. */
  ganha(pos) {
    const c = chave(pos);
    const pronto = this.memoria.get(c);
    if (pronto !== undefined) { this.acertos++; return pronto; }
    this.nos++;
    if (this.conferirInvariantes) {
      const p = problemas(pos);
      if (p.length) this.quebras.push(c + ': ' + p[0]);
    }
    let fora = false;
    for (const prox of jogadas(pos)) {
      if (!this.ganha(prox)) { fora = true; break; }
    }
    this.memoria.set(c, fora);
    return fora;
  }

  deN(n) {
    return this.ganha(inicial(n));
  }
}

/** Quem ganha o jogo de n pontos. */
export function vencedor(n, opcoes) {
  return new Motor(opcoes).deN(n) ? 'primeiro' : 'segundo';
}

/** Quem ganha, com o preco. */
export function resultado(n, opcoes) {
  const m = new Motor(opcoes);
  const g = m.deN(n);
  return {
    n,
    vencedor: g ? 'primeiro' : 'segundo',
    nos: m.nos,
    memoria: m.memoria.size,
    acertos: m.acertos,
    quebras: m.quebras.length,
  };
}

/** Quantas primeiras jogadas distintas existem, e quantas ganham. */
export function aberturas(n) {
  const motor = new Motor();
  const p0 = inicial(n);
  const todas = jogadas(p0);
  let ganham = 0;
  for (const p of todas) if (!motor.ganha(p)) ganham++;
  return { n, total: todas.length, ganham, nos: motor.nos };
}

/**
 * Uma partida inteira jogada ao acaso, para medir o comprimento. Todo
 * jogo de Sprouts com n pontos dura entre 2n e 3n-1 jogadas — e isso vale
 * seja qual for o jeito de jogar, o que faz dele um juiz de graca sobre
 * CADA partida.
 */
export function partidaAoAcaso(n, sorteio = Math.random) {
  let pos = inicial(n);
  let m = 0;
  const caminho = [chave(pos)];
  for (;;) {
    const js = jogadas(pos);
    if (js.length === 0) break;
    pos = js[Math.floor(sorteio() * js.length)];
    m++;
    caminho.push(chave(pos));
  }
  return { n, jogadas: m, pontosNoFim: pontos(pos), vidasNoFim: vidasTotais(pos), caminho };
}

/**
 * Os comprimentos de partida POSSIVEIS, varridos de verdade.
 *
 * Com memoria por posicao: o conjunto de "quantas jogadas ainda cabem a
 * partir daqui" so depende da posicao, nunca de como se chegou nela.
 * Descer a arvore inteira sem memoria, como a primeira versao fazia, so
 * terminava ate n = 3.
 */
export function comprimentos(n) {
  const memoria = new Map();
  let nos = 0;

  function restantes(pos) {
    const c = chave(pos);
    const pronto = memoria.get(c);
    if (pronto !== undefined) return pronto;
    nos++;
    const js = jogadas(pos);
    const fora = new Set();
    if (js.length === 0) fora.add(0);
    else for (const p of js) for (const r of restantes(p)) fora.add(r + 1);
    memoria.set(c, fora);
    return fora;
  }

  const todos = [...restantes(inicial(n))].sort((a, b) => a - b);
  return {
    n,
    comprimentos: todos,
    minimo: todos[0],
    maximo: todos[todos.length - 1],
    limiteDeBaixo: 2 * n,
    limiteDeCima: 3 * n - 1,
    // De 2n ate 3n-1 inclusive sao n valores, e nao n+1. Escrevi n+1 na
    // primeira versao e a coluna deu `false` ate no n = 3, onde os tres
    // comprimentos 6, 7 e 8 estavam todos la.
    quantosValoresCabem: n,
    todosOsValoresEntreOsLimites:
      todos.length === n && todos[0] === 2 * n && todos[todos.length - 1] === 3 * n - 1,
    nos,
  };
}

/** A busca com teto de nos, para dizer honestamente ate onde se chegou. */
export function ateOndeChega(n, teto) {
  const memoria = new Map();
  let nos = 0;
  let estourou = false;

  function ganha(pos) {
    if (nos >= teto) { estourou = true; return false; }
    const c = chave(pos);
    const pronto = memoria.get(c);
    if (pronto !== undefined) return pronto;
    nos++;
    let fora = false;
    for (const p of jogadas(pos)) {
      if (!ganha(p)) { fora = true; break; }
      if (estourou) break;
    }
    if (!estourou) memoria.set(c, fora);
    return fora;
  }

  const r = ganha(inicial(n));
  return { n, teto, nos, estourou, vencedor: estourou ? null : (r ? 'primeiro' : 'segundo') };
}
