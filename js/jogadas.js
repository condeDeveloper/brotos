// O gerador de jogadas. E aqui que o Sprouts e dificil.
//
// Uma jogada escolhe dois CANTOS de pontos com vida na MESMA regiao e liga
// os dois por uma curva com um ponto novo no meio. O que acontece com a
// regiao depende de onde os dois cantos estao:
//
//   os dois soltos ................ nasce uma fronteira nova, regiao fica
//   um solto, outro numa fronteira . a fronteira engole o solto
//   dois cantos da MESMA fronteira . a regiao SE PARTE em duas
//   um canto consigo mesmo (laco) .. a regiao SE PARTE em duas
//   fronteiras DIFERENTES .......... as duas viram uma, regiao fica
//
// Quando a regiao se parte, tudo o que estava dentro dela — as outras
// fronteiras e os outros pontos soltos — vai para um lado OU para o
// outro, e cada escolha e uma jogada diferente. E dai que vem a explosao:
// uma regiao com k coisas dentro multiplica a jogada por 2^k.

import { copia, chave, junta } from './nucleo.js';

function rotaciona(f, i) {
  return f.slice(i).concat(f.slice(0, i));
}

/** F[i..j] andando para a frente, ciclico, incluindo as duas pontas. */
function pedaco(f, i, j) {
  const fora = [];
  let k = i;
  for (;;) {
    fora.push(f[k]);
    if (k === j) break;
    k = (k + 1) % f.length;
  }
  return fora;
}

/** Todas as maneiras de repartir `itens` entre dois lados. */
function reparticoes(itens) {
  const fora = [];
  const total = 1 << itens.length;
  for (let m = 0; m < total; m++) {
    const a = [];
    const b = [];
    for (let k = 0; k < itens.length; k++) ((m >> k) & 1 ? b : a).push(itens[k]);
    fora.push([a, b]);
  }
  return fora;
}

/**
 * Monta a posicao nova depois de uma jogada que PARTE a regiao `ri` em
 * duas, com as fronteiras novas `b1` e `b2`, devolvendo uma posicao por
 * reparticao do que sobrou dentro.
 */
function parte(pos, ri, b1, b2, sobraFronteiras, sobraSoltos, gastos, novoId) {
  const fora = [];
  const itens = [
    ...sobraFronteiras.map((f) => ({ tipo: 'f', v: f })),
    ...sobraSoltos.map((s) => ({ tipo: 's', v: s })),
  ];
  for (const [ladoA, ladoB] of reparticoes(itens)) {
    const p = copia(pos);
    aplicaGastos(p, gastos, novoId);
    const regiaoA = {
      fronteiras: [b1, ...ladoA.filter((x) => x.tipo === 'f').map((x) => x.v)],
      soltos: ladoA.filter((x) => x.tipo === 's').map((x) => x.v),
    };
    const regiaoB = {
      fronteiras: [b2, ...ladoB.filter((x) => x.tipo === 'f').map((x) => x.v)],
      soltos: ladoB.filter((x) => x.tipo === 's').map((x) => x.v),
    };
    p.regioes.splice(ri, 1, regiaoA, regiaoB);
    fora.push(p);
  }
  return fora;
}

function aplicaGastos(p, gastos, novoId) {
  for (const [id, quanto] of gastos) p.vidas.set(id, p.vidas.get(id) - quanto);
  p.vidas.set(novoId, 1);
  p.pai.set(novoId, novoId);
  for (const [id] of gastos) junta(p, id, novoId);
  p.proximoId = Math.max(p.proximoId, novoId + 1);
  p.feitas++;
}

/** Todas as posicoes que uma jogada alcanca, sem repetir. */
export function jogadas(pos) {
  const vistas = new Set();
  const fora = [];
  const poe = (p) => {
    const c = chave(p);
    if (vistas.has(c)) return;
    vistas.add(c);
    fora.push(p);
  };
  const c = pos.proximoId;
  const vida = (id) => pos.vidas.get(id);

  for (let ri = 0; ri < pos.regioes.length; ri++) {
    const R = pos.regioes[ri];

    // (1) dois pontos soltos
    for (let x = 0; x < R.soltos.length; x++) {
      for (let y = x + 1; y < R.soltos.length; y++) {
        const a = R.soltos[x];
        const b = R.soltos[y];
        const p = copia(pos);
        aplicaGastos(p, [[a, 1], [b, 1]], c);
        p.regioes[ri] = {
          fronteiras: [...R.fronteiras.map((f) => f.slice()), [a, c, b, c]],
          soltos: R.soltos.filter((s) => s !== a && s !== b),
        };
        poe(p);
      }
    }

    // (2) um solto e um canto de fronteira
    for (const a of R.soltos) {
      for (let fi = 0; fi < R.fronteiras.length; fi++) {
        const F = R.fronteiras[fi];
        for (let i = 0; i < F.length; i++) {
          const b = F[i];
          if (vida(b) < 1) continue;
          const nova = [...F.slice(0, i), b, c, a, c, b, ...F.slice(i + 1)];
          const p = copia(pos);
          aplicaGastos(p, [[a, 1], [b, 1]], c);
          p.regioes[ri] = {
            fronteiras: R.fronteiras.map((f, k) => (k === fi ? nova : f.slice())),
            soltos: R.soltos.filter((s) => s !== a),
          };
          poe(p);
        }
      }
    }

    // (3) laco num ponto solto: a regiao se parte
    for (const a of R.soltos) {
      if (vida(a) < 2) continue;
      const sobraF = R.fronteiras.map((f) => f.slice());
      const sobraS = R.soltos.filter((s) => s !== a);
      for (const p of parte(pos, ri, [a, c], [a, c], sobraF, sobraS, [[a, 2]], c)) poe(p);
    }

    // (4) laco num canto de fronteira: a regiao se parte
    for (let fi = 0; fi < R.fronteiras.length; fi++) {
      const F = R.fronteiras[fi];
      for (let i = 0; i < F.length; i++) {
        const a = F[i];
        if (vida(a) < 2) continue;
        const grande = [...F.slice(0, i), a, c, a, ...F.slice(i + 1)];
        const sobraF = R.fronteiras.filter((_, k) => k !== fi).map((f) => f.slice());
        const sobraS = R.soltos.slice();
        for (const p of parte(pos, ri, grande, [a, c], sobraF, sobraS, [[a, 2]], c)) poe(p);
      }
    }

    // (5) dois cantos da MESMA fronteira: a regiao se parte
    for (let fi = 0; fi < R.fronteiras.length; fi++) {
      const F = R.fronteiras[fi];
      for (let i = 0; i < F.length; i++) {
        for (let j = 0; j < F.length; j++) {
          if (i === j) continue;
          const a = F[i];
          const b = F[j];
          if (a === b) {
            if (vida(a) < 2) continue;
          } else if (vida(a) < 1 || vida(b) < 1) continue;
          const b1 = [...pedaco(F, i, j), c];
          const b2 = [...pedaco(F, j, i), c];
          const gastos = a === b ? [[a, 2]] : [[a, 1], [b, 1]];
          const sobraF = R.fronteiras.filter((_, k) => k !== fi).map((f) => f.slice());
          const sobraS = R.soltos.slice();
          for (const p of parte(pos, ri, b1, b2, sobraF, sobraS, gastos, c)) poe(p);
        }
      }
    }

    // (6) cantos de fronteiras DIFERENTES: as duas viram uma
    for (let fa = 0; fa < R.fronteiras.length; fa++) {
      for (let fb = fa + 1; fb < R.fronteiras.length; fb++) {
        const F = R.fronteiras[fa];
        const G = R.fronteiras[fb];
        for (let i = 0; i < F.length; i++) {
          for (let j = 0; j < G.length; j++) {
            const a = F[i];
            const b = G[j];
            if (vida(a) < 1 || vida(b) < 1) continue;
            if (a === b && vida(a) < 2) continue;
            const Fa = rotaciona(F, i);
            const Gb = rotaciona(G, j);
            const nova = [...Fa, a, c, ...Gb, b, c];
            const p = copia(pos);
            aplicaGastos(p, a === b ? [[a, 2]] : [[a, 1], [b, 1]], c);
            p.regioes[ri] = {
              fronteiras: [
                nova,
                ...R.fronteiras.filter((_, k) => k !== fa && k !== fb).map((f) => f.slice()),
              ],
              soltos: R.soltos.slice(),
            };
            poe(p);
          }
        }
      }
    }
  }
  return fora;
}

export function acabou(pos) {
  return jogadas(pos).length === 0;
}
