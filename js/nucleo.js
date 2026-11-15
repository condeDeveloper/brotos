// Sprouts: a posicao, e nada alem dela.
//
// As regras: comeca com n pontos. Uma jogada liga dois pontos (ou um ponto
// a ele mesmo) por uma curva que NAO cruza nada do que ja esta desenhado,
// e poe um ponto novo no meio da curva. Nenhum ponto pode ter mais de tres
// pontas de curva saindo dele. Quem nao consegue jogar, perde.
//
// O problema inteiro do Sprouts e que a posicao nao e um tabuleiro: e um
// desenho no plano, e o que importa e so a TOPOLOGIA dele. Duas figuras
// diferentes que separam o plano do mesmo jeito sao a mesma posicao.
//
// A representacao usada aqui e a classica: a posicao e um conjunto de
// REGIOES; cada regiao tem FRONTEIRAS (ciclos de pontos, na ordem em que
// se encontram andando pela borda) e PONTOS SOLTOS (os de grau zero, que
// nao estao em fronteira nenhuma).
//
// Dois numeros amarram tudo e sao conferidos a cada posicao:
//   - um ponto de grau d aparece exatamente d vezes nas fronteiras;
//   - vidas = 3 - d.
// Separar os pontos soltos numa lista propria e o que faz essas duas
// contas valerem SEM excecao — foi a primeira versao, que escrevia o ponto
// solto como uma fronteira de um elemento so, que quebrou as duas.

export const VIDAS_MAXIMAS = 3;

/** A posicao inicial: n pontos soltos, todos na mesma regiao. */
export function inicial(n) {
  const vidas = new Map();
  const soltos = [];
  const pai = new Map();
  for (let i = 0; i < n; i++) { vidas.set(i, 3); soltos.push(i); pai.set(i, i); }
  return {
    vidas, pai, proximoId: n, pontosIniciais: n, feitas: 0,
    regioes: [{ fronteiras: [], soltos }],
  };
}

export function copia(pos) {
  // A copia NAO leva a chave guardada: ela vai ser mexida.
  return {
    vidas: new Map(pos.vidas),
    pai: new Map(pos.pai),
    proximoId: pos.proximoId,
    pontosIniciais: pos.pontosIniciais,
    feitas: pos.feitas,
    regioes: pos.regioes.map((r) => ({
      fronteiras: r.fronteiras.map((f) => f.slice()),
      soltos: r.soltos.slice(),
    })),
  };
}

/* ----------------------------------------- quem esta ligado a quem */

export function raiz(pos, x) {
  let v = x;
  while (pos.pai.get(v) !== v) v = pos.pai.get(v);
  return v;
}

export function junta(pos, a, b) {
  const ra = raiz(pos, a);
  const rb = raiz(pos, b);
  if (ra !== rb) pos.pai.set(rb, ra);
}

export function componentes(pos) {
  const r = new Set();
  for (const id of pos.vidas.keys()) r.add(raiz(pos, id));
  return r.size;
}

export function pontos(pos) {
  return pos.vidas.size;
}

export function vidasTotais(pos) {
  let s = 0;
  for (const v of pos.vidas.values()) s += v;
  return s;
}

export function grau(pos, id) {
  return VIDAS_MAXIMAS - pos.vidas.get(id);
}

/** Quantas vezes cada ponto aparece nas fronteiras. */
export function aparicoes(pos) {
  const conta = new Map();
  for (const id of pos.vidas.keys()) conta.set(id, 0);
  for (const r of pos.regioes) {
    for (const f of r.fronteiras) {
      for (const id of f) conta.set(id, conta.get(id) + 1);
    }
  }
  return conta;
}

/**
 * As tres contas que amarram a posicao. Devolve a lista de problemas, que
 * tem que sair vazia em TODA posicao alcancavel. E este o juiz de dentro:
 * um gerador de jogadas errado quase sempre quebra uma delas.
 */
export function problemas(pos) {
  const fora = [];
  const ap = aparicoes(pos);
  for (const [id, v] of pos.vidas) {
    if (v < 0 || v > 3) fora.push('ponto ' + id + ' com ' + v + ' vidas');
    const d = VIDAS_MAXIMAS - v;
    if (ap.get(id) !== d) {
      fora.push('ponto ' + id + ' tem grau ' + d + ' e aparece ' + ap.get(id) + ' vezes');
    }
  }
  const soltos = new Set();
  for (const r of pos.regioes) for (const s of r.soltos) soltos.add(s);
  for (const [id, v] of pos.vidas) {
    if (v === 3 && !soltos.has(id)) fora.push('ponto ' + id + ' tem grau zero e nao esta solto');
    if (v !== 3 && soltos.has(id)) fora.push('ponto ' + id + ' esta solto com grau ' + (3 - v));
  }
  for (const r of pos.regioes) {
    for (const f of r.fronteiras) {
      if (f.length === 0) fora.push('fronteira vazia');
    }
  }
  // Euler. Cada jogada cria UM ponto e DUAS arestas (do ponto de partida
  // ao ponto novo, e do novo ao de chegada). Entao V = n + m e E = 2m, e
  // num desenho plano F = E - V + 1 + C. O numero de regioes tem que ser
  // exatamente esse F — e isto pega erro na analise de casos, porque
  // confundir uma jogada que PARTE a regiao com uma que nao parte muda o
  // numero de regioes e nao mexe em mais nada.
  const V = pos.vidas.size;
  const E = 2 * pos.feitas;
  const C = componentes(pos);
  const F = E - V + 1 + C;
  if (pos.regioes.length !== F) {
    fora.push('regioes=' + pos.regioes.length + ' mas Euler pede ' + F +
      ' (V=' + V + ', E=' + E + ', C=' + C + ')');
  }
  if (V !== pos.pontosIniciais + pos.feitas) {
    fora.push('pontos=' + V + ' mas sao ' + pos.pontosIniciais + ' + ' + pos.feitas);
  }
  // Cada jogada GASTA duas vidas e CRIA uma: o total cai de um em um, e
  // nao de dois em dois. Escrevi 3n - 2m aqui e o teste acusou 1.443 das
  // 1.444 posicoes de n = 3 — divergencia em toda parte de uma vez, que e
  // sempre sinal de gabarito torto, nunca da busca.
  if (vidasTotais(pos) !== 3 * pos.pontosIniciais - pos.feitas) {
    fora.push('vidas=' + vidasTotais(pos) + ' mas a conta pede ' +
      (3 * pos.pontosIniciais - pos.feitas));
  }
  return fora;
}

/* ------------------------------------------------- a chave da posicao */

/** Todas as ordens possiveis de uma lista, com teto. */
function permutacoes(lista, teto) {
  if (lista.length <= 1) return [lista.slice()];
  const fora = [];
  const anda = (resto, atual) => {
    if (fora.length >= teto) return;
    if (resto.length === 0) { fora.push(atual.slice()); return; }
    for (let i = 0; i < resto.length; i++) {
      atual.push(resto[i]);
      anda(resto.slice(0, i).concat(resto.slice(i + 1)), atual);
      atual.pop();
      if (fora.length >= teto) return;
    }
  };
  anda(lista, []);
  return fora;
}

// O teto das ordens tentadas. Com 720 a chave ficou CARA: o n = 3 passou
// de 0,4 s para minutos, porque `jogadas` chama a chave uma vez por
// posicao gerada so para nao repetir. Com 24 as simetrias que aparecem de
// verdade (duas ou tres regioes iguais) ainda colapsam, e o preco volta.
const TETO_DE_ORDENS = 24;

/**
 * A chave da posicao: a MENOR descricao dela entre todas as ordens
 * possiveis, com os pontos renomeados na ordem em que aparecem. Nao usa
 * os ids originais, entao duas posicoes iguais desenhadas com nomes
 * diferentes dao a mesma chave.
 *
 * A primeira versao ordenava regioes e fronteiras por uma marca e
 * desempatava pela ordem em que elas estavam guardadas. Isso NAO fecha: o
 * jogo de 1 ponto, depois do laco, fica com duas regioes identicas, e
 * jogar numa ou na outra dava duas chaves para a MESMA posicao. A busca
 * respondia certo e contava posicoes demais. Agora as ordens empatadas na
 * marca sao todas tentadas, e fica a menor descricao.
 */
export function chave(pos) {
  // A chave de uma posicao nao muda, e ela e pedida duas vezes: uma por
  // `jogadas`, para nao repetir, e outra pela busca, para a memoria.
  if (pos.chaveGuardada !== undefined) return pos.chaveGuardada;
  const marcaFronteira = (f) => {
    let melhor = null;
    for (let r = 0; r < f.length; r++) {
      const s = f.map((_, i) => pos.vidas.get(f[(r + i) % f.length])).join('.');
      if (melhor === null || s < melhor) melhor = s;
    }
    return f.length + ':' + melhor;
  };
  const marcaRegiao = (reg) => {
    const fs = reg.fronteiras.map(marcaFronteira).sort();
    return '[' + fs.join('|') + ']{' + reg.soltos.length + '}';
  };

  // As regioes em grupos de marca igual; so dentro do grupo a ordem e
  // ambigua, e so ai vale a pena tentar todas.
  const comMarca = pos.regioes.map((r) => ({ r, m: marcaRegiao(r) }));
  comMarca.sort((a, b) => (a.m < b.m ? -1 : a.m > b.m ? 1 : 0));
  const grupos = [];
  for (const x of comMarca) {
    if (grupos.length && grupos[grupos.length - 1].m === x.m) grupos[grupos.length - 1].itens.push(x.r);
    else grupos.push({ m: x.m, itens: [x.r] });
  }

  let ordens = [[]];
  for (const g of grupos) {
    const proximas = [];
    for (const base of ordens) {
      for (const perm of permutacoes(g.itens, TETO_DE_ORDENS)) {
        proximas.push(base.concat(perm));
        if (proximas.length >= TETO_DE_ORDENS) break;
      }
      if (proximas.length >= TETO_DE_ORDENS) break;
    }
    ordens = proximas;
  }

  let melhorChave = null;
  for (const ordem of ordens) {
    const novo = new Map();
    let proximo = 0;
    const nome = (id) => {
      if (!novo.has(id)) novo.set(id, proximo++);
      return novo.get(id);
    };
    const pedacos = [];
    for (const reg of ordem) {
      const fs = reg.fronteiras
        .map((f) => ({ f, m: marcaFronteira(f) }))
        .sort((a, b) => (a.m < b.m ? -1 : a.m > b.m ? 1 : 0));
      const desenhadas = [];
      for (const { f } of fs) {
        let melhorR = 0;
        let melhorS = null;
        for (let r = 0; r < f.length; r++) {
          const s = f.map((_, k) => pos.vidas.get(f[(r + k) % f.length])).join('.');
          if (melhorS === null || s < melhorS) { melhorS = s; melhorR = r; }
        }
        const rot = [];
        for (let k = 0; k < f.length; k++) rot.push(nome(f[(melhorR + k) % f.length]));
        desenhadas.push(rot.join('.'));
      }
      pedacos.push('[' + desenhadas.join('|') + ']{' + reg.soltos.length + '}');
    }
    const c = pedacos.join('/');
    if (melhorChave === null || c < melhorChave) melhorChave = c;
  }
  pos.chaveGuardada = melhorChave;
  return melhorChave;
}
