// Os juizes. Em Sprouts eles importam mais do que em qualquer outro
// projeto deste acervo, porque o gerador de jogadas e a parte dificil: um
// gerador errado nao trava nem reclama, ele so devolve uma arvore
// plausivel e um vencedor plausivel.
//
// 1. AS CONTAS DE DENTRO (nucleo.problemas), conferidas em TODA posicao
//    visitada: grau contra aparicoes, vidas contra jogadas feitas, e
//    EULER — regioes = arestas - vertices + 1 + componentes. A de Euler e
//    a que importa: confundir uma jogada que PARTE a regiao com uma que
//    nao parte muda o numero de regioes e mais nada, e e exatamente o
//    tipo de erro que passa despercebido.
//
// 2. O COMPRIMENTO DA PARTIDA. Toda partida de Sprouts com n pontos dura
//    entre 2n e 3n-1 jogadas, nao importa como se jogue. Isso da um juiz
//    de graca sobre CADA partida — inclusive as sorteadas, que alcancam n
//    muito alem do que a arvore inteira alcanca.
//
// 3. O PADRAO CONHECIDO. O primeiro jogador ganha quando n deixa resto 3,
//    4 ou 5 na divisao por 6. Este e um GABARITO, e esta marcado como
//    tal: ele nao prova nada sobre a busca, ele so concorda ou discorda.

import { problemas } from './nucleo.js';
import { jogadas } from './jogadas.js';
import { inicial } from './nucleo.js';

/* ------------------------------------------------- 2. o comprimento */

export function limitesDoComprimento(n) {
  return { minimo: 2 * n, maximo: 3 * n - 1 };
}

/**
 * Joga `quantas` partidas ao acaso e confere, em cada uma, o comprimento
 * e as contas de dentro de cada posicao pela qual passou.
 */
export function partidasAoAcaso(n, quantas, sorteio = Math.random) {
  const comprimentos = new Set();
  let foraDosLimites = 0;
  let posicoesQuebradas = 0;
  let posicoes = 0;
  const lim = limitesDoComprimento(n);
  for (let t = 0; t < quantas; t++) {
    let pos = inicial(n);
    let m = 0;
    for (;;) {
      posicoes++;
      if (problemas(pos).length) posicoesQuebradas++;
      const js = jogadas(pos);
      if (js.length === 0) break;
      pos = js[Math.floor(sorteio() * js.length)];
      m++;
    }
    comprimentos.add(m);
    if (m < lim.minimo || m > lim.maximo) foraDosLimites++;
  }
  return {
    n, quantas, posicoes, posicoesQuebradas, foraDosLimites,
    comprimentos: [...comprimentos].sort((a, b) => a - b),
    ...lim,
  };
}

/* ---------------------------------------------------- 3. o gabarito */

/**
 * O resultado conhecido do Sprouts: o primeiro ganha quando n mod 6 esta
 * em {3, 4, 5}. E gabarito, nao prova.
 */
export function padraoConhecido(n) {
  const r = n % 6;
  return r === 3 || r === 4 || r === 5 ? 'primeiro' : 'segundo';
}

export { problemas };
