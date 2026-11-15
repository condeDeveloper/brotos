#!/usr/bin/env node
// O medidor: roda as tabelas e cospe os numeros que vao para o README.
//
//   node ferramentas/medidor.js             todas (o n=4 leva uns 2 min)
//   node ferramentas/medidor.js comprimento so uma

import {
  VARRIDOS, COMPRIMENTOS_VARRIDOS, linhaN, linhaAberturas, linhaComprimentos,
  primeirasJogadas, linhaSorteadas, linhaTeto, partidaDemonstrada,
  limitesDoComprimento, padraoConhecido,
} from '../js/medidas.js';

const n = (x) => x.toLocaleString('pt-BR');

function titulo(t) {
  console.log('');
  console.log(t);
  console.log('-'.repeat(t.length));
}

function vencedores() {
  titulo('Quem ganha, varrendo a arvore inteira');
  console.log('  n   ganha       posicoes   gabarito    bate');
  for (const i of VARRIDOS) {
    const r = linhaN(i);
    console.log(
      String(r.n).padStart(3) +
      r.vencedor.padStart(10) +
      n(r.nos).padStart(15) +
      r.gabarito.padStart(11) +
      (r.bate ? '   sim' : '   NAO'));
  }
  console.log('');
  console.log('o gabarito e o resultado conhecido: o primeiro ganha quando n mod 6');
  console.log('esta em {3, 4, 5}. Ele CONCORDA com a busca nos quatro varridos —');
  console.log('mas e gabarito, e nao prova.');
  const t = linhaTeto(5, 50000);
  console.log('');
  console.log('n = 5: a busca passa de ' + n(t.nos) + ' posicoes sem terminar.');
}

function invariantes() {
  titulo('As contas de dentro, conferidas em TODA posicao visitada');
  console.log('  n   posicoes   quebras');
  for (const i of [1, 2, 3]) {
    const r = linhaN(i, { conferirInvariantes: true });
    console.log(String(r.n).padStart(3) + n(r.nos).padStart(11) + String(r.quebras).padStart(10));
  }
  console.log('');
  console.log('as contas sao tres: grau contra aparicoes, vidas contra jogadas feitas,');
  console.log('e Euler (regioes = arestas - vertices + 1 + componentes).');
}

function comprimento() {
  titulo('Quanto dura uma partida');
  console.log('  n   comprimentos possiveis   limites do teorema   todos eles   posicoes');
  for (const i of COMPRIMENTOS_VARRIDOS) {
    const c = linhaComprimentos(i);
    console.log(
      String(c.n).padStart(3) +
      ('[' + c.comprimentos.join(', ') + ']').padStart(25) +
      ('[' + c.limiteDeBaixo + ', ' + c.limiteDeCima + ']').padStart(21) +
      (c.todosOsValoresEntreOsLimites ? 'sim' : 'NAO').padStart(13) +
      n(c.nos).padStart(11));
  }
  console.log('');
  console.log('e nas partidas sorteadas, que alcancam n que a arvore nao alcanca:');
  console.log('  n   partidas   posicoes   fora dos limites   quebras   comprimentos vistos');
  for (const i of [4, 5, 6, 8, 10]) {
    const s = linhaSorteadas(i);
    console.log(
      String(s.n).padStart(3) +
      String(s.quantas).padStart(11) +
      n(s.posicoes).padStart(11) +
      String(s.foraDosLimites).padStart(19) +
      String(s.posicoesQuebradas).padStart(10) +
      ('[' + s.comprimentos.join(', ') + ']').padStart(22));
  }
}

function aberturas() {
  titulo('Quantas primeiras jogadas existem, e quantas ganham');
  console.log('  n   primeiras jogadas   delas ganham');
  for (const i of VARRIDOS) {
    const a = linhaAberturas(i);
    console.log(
      String(a.n).padStart(3) +
      String(a.total).padStart(20) +
      String(a.ganham).padStart(15));
  }
  console.log('');
  console.log('e so as primeiras jogadas, sem resolver nada:');
  for (const i of [1, 2, 3, 4, 5, 6]) {
    console.log('   n = ' + i + ': ' + primeirasJogadas(i) + ' jogadas diferentes');
  }
}

function partida() {
  titulo('Uma partida de n = 3, posicao por posicao');
  const p = partidaDemonstrada(3);
  const lim = limitesDoComprimento(3);
  console.log('durou ' + p.jogadas + ' jogadas (os limites sao ' + lim.minimo + ' e ' + lim.maximo + ')');
  console.log('terminou com ' + p.pontosNoFim + ' pontos e ' + p.vidasNoFim + ' vidas sobrando');
  console.log('');
  p.caminho.forEach((c, i) => console.log('  ' + String(i).padStart(2) + '  ' + c));
  console.log('');
  console.log('a chave mostra as regioes separadas por /, as fronteiras entre [ ]');
  console.log('e quantos pontos soltos a regiao tem entre { }.');
  console.log('');
  console.log('o gabarito para n = 3 diz: ' + padraoConhecido(3));
}

const NOMES = { vencedores, invariantes, comprimento, aberturas, partida };

const pedido = process.argv[2];
if (pedido) {
  if (!NOMES[pedido]) {
    console.error('nao conheco a tabela "' + pedido + '". tenho: ' + Object.keys(NOMES).join(', '));
    process.exit(1);
  }
  NOMES[pedido]();
} else {
  for (const f of Object.values(NOMES)) f();
}
console.log('');
