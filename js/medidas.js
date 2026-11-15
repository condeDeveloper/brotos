// As tabelas do README. Nenhum numero deste projeto e digitado a mao.

import { inicial, chave, problemas } from './nucleo.js';
import { jogadas } from './jogadas.js';
import { resultado, aberturas, comprimentos, ateOndeChega, partidaAoAcaso } from './busca.js';
import { limitesDoComprimento, partidasAoAcaso, padraoConhecido } from './juiz.js';

/** Ate onde a arvore inteira foi varrida. */
export const VARRIDOS = [1, 2, 3, 4];

/** Ate onde os comprimentos foram varridos (mais caro que o vencedor). */
export const COMPRIMENTOS_VARRIDOS = [1, 2, 3];

// O n = 4 leva mais de dois minutos e tres tabelas perguntam por ele.
const guardado = new Map();
const umaVez = (ch, f) => {
  if (!guardado.has(ch)) guardado.set(ch, f());
  return guardado.get(ch);
};

export function linhaN(n, opcoes) {
  const ch = 'n:' + n + ':' + (opcoes && opcoes.conferirInvariantes ? 'inv' : '');
  return umaVez(ch, () => {
    const r = resultado(n, opcoes);
    return { ...r, gabarito: padraoConhecido(n), bate: r.vencedor === padraoConhecido(n) };
  });
}

export function linhaAberturas(n) {
  return umaVez('ab:' + n, () => aberturas(n));
}

export function linhaComprimentos(n) {
  return umaVez('comp:' + n, () => comprimentos(n));
}

/** Quantas jogadas diferentes existem na posicao inicial de n pontos. */
export function primeirasJogadas(n) {
  return jogadas(inicial(n)).length;
}

/** As partidas sorteadas, que alcancam n muito alem da arvore inteira. */
export function linhaSorteadas(n, quantas = 200, semente = 1) {
  return umaVez('sort:' + n + ':' + quantas + ':' + semente, () => {
    // Um sorteio determinado, para a tabela nao mudar a cada rodada.
    let x = semente * 2654435761 >>> 0;
    const proximo = () => {
      x ^= x << 13; x >>>= 0;
      x ^= x >> 17;
      x ^= x << 5; x >>>= 0;
      return x / 4294967296;
    };
    return partidasAoAcaso(n, quantas, proximo);
  });
}

/** Ate onde a busca chega em n = 5 antes de bater no teto. */
export function linhaTeto(n, teto) {
  return umaVez('teto:' + n + ':' + teto, () => ateOndeChega(n, teto));
}

/** Uma partida inteira escrita posicao por posicao. */
export function partidaDemonstrada(n, semente = 7) {
  let x = semente * 2654435761 >>> 0;
  const proximo = () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
  return partidaAoAcaso(n, proximo);
}

export { limitesDoComprimento, padraoConhecido, problemas, chave };
