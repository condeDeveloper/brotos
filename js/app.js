// A pagina. Sprouts nao cabe num tabuleiro, entao aqui ele e mostrado
// como aquilo que de fato e: um punhado de REGIOES, cada uma com as
// fronteiras que a cercam e os pontos soltos que estao dentro dela.
//
// O motor so joga otimo ate 3 pontos. Com 4 a arvore tem mais de cem mil
// posicoes e levaria minutos no navegador — entao, dai para cima, ele
// joga ao acaso e diz que esta jogando ao acaso.

import { inicial, chave, pontos, vidasTotais, problemas } from './nucleo.js';
import { jogadas } from './jogadas.js';
import { Motor } from './busca.js';
import { limitesDoComprimento, padraoConhecido } from './juiz.js';

const palco = document.getElementById('palco');
const listaJogadas = document.getElementById('jogadas');
const recado = document.getElementById('recado');
const placar = document.getElementById('placar');
const campo = document.getElementById('quantos');
const btNovo = document.getElementById('novo');

const OTIMO_ATE = 3;

let n = 3;
let pos = inicial(n);
let feitas = 0;
let suaVez = true;
let fim = false;

function desenhaRegioes() {
  palco.replaceChildren();
  pos.regioes.forEach((r, i) => {
    const cartao = document.createElement('div');
    cartao.className = 'regiao';
    const titulo = document.createElement('h3');
    titulo.textContent = 'região ' + (i + 1);
    cartao.append(titulo);
    if (r.fronteiras.length === 0 && r.soltos.length === 0) {
      const vazio = document.createElement('p');
      vazio.className = 'nada';
      vazio.textContent = 'vazia';
      cartao.append(vazio);
    }
    for (const f of r.fronteiras) {
      const linha = document.createElement('div');
      linha.className = 'fronteira';
      for (const id of f) {
        const ponto = document.createElement('span');
        ponto.className = 'ponto vidas' + pos.vidas.get(id);
        ponto.textContent = id;
        ponto.title = 'ponto ' + id + ', ' + pos.vidas.get(id) + ' vida(s)';
        linha.append(ponto);
      }
      cartao.append(linha);
    }
    if (r.soltos.length) {
      const linha = document.createElement('div');
      linha.className = 'soltos';
      for (const id of r.soltos) {
        const ponto = document.createElement('span');
        ponto.className = 'ponto vidas' + pos.vidas.get(id);
        ponto.textContent = id;
        ponto.title = 'ponto solto ' + id;
        linha.append(ponto);
      }
      cartao.append(linha);
    }
    palco.append(cartao);
  });
}

function desenhaJogadas() {
  listaJogadas.replaceChildren();
  if (!suaVez || fim) return;
  const js = jogadas(pos);
  for (const p of js) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'jogada';
    b.textContent = chave(p);
    b.addEventListener('click', () => {
      pos = p;
      feitas++;
      suaVez = false;
      atualiza();
      setTimeout(responde, 260);
    });
    listaJogadas.append(b);
  }
}

function responde() {
  const js = jogadas(pos);
  if (js.length === 0) {
    fim = true;
    recado.innerHTML = '<span class="ok">Você ganhou.</span> O computador não tem jogada.';
    suaVez = true;
    atualiza();
    return;
  }
  let escolhida = null;
  if (n <= OTIMO_ATE) {
    const motor = new Motor();
    for (const p of js) if (!motor.ganha(p)) { escolhida = p; break; }
  }
  if (escolhida === null) escolhida = js[Math.floor(Math.random() * js.length)];
  pos = escolhida;
  feitas++;
  suaVez = true;
  atualiza();
}

function atualiza() {
  desenhaRegioes();
  desenhaJogadas();
  const js = jogadas(pos);
  if (suaVez && js.length === 0 && !fim) {
    fim = true;
    recado.innerHTML = '<span class="aviso">Você perdeu.</span> Não há jogada possível.';
  } else if (!fim) {
    recado.textContent = suaVez
      ? (n <= OTIMO_ATE
        ? 'Sua vez: escolha uma das jogadas. O computador joga ótimo neste tamanho.'
        : 'Sua vez. Acima de ' + OTIMO_ATE + ' pontos o computador joga ao acaso: a árvore é grande demais para o navegador.')
      : 'Pensando...';
  }
  const lim = limitesDoComprimento(n);
  placar.innerHTML =
    '<strong>' + feitas + '</strong> jogadas (entre ' + lim.minimo + ' e ' + lim.maximo + ') · ' +
    '<strong>' + pontos(pos) + '</strong> pontos · ' +
    '<strong>' + vidasTotais(pos) + '</strong> vidas · ' +
    '<strong>' + pos.regioes.length + '</strong> ' + (pos.regioes.length === 1 ? 'região' : 'regiões') +
    ' · contas de dentro: ' +
    (problemas(pos).length === 0 ? '<span class="ok">ok</span>' : '<span class="aviso">quebradas</span>');
}

btNovo.addEventListener('click', () => {
  n = Math.max(1, Math.min(7, Number(campo.value) || 3));
  pos = inicial(n);
  feitas = 0;
  suaVez = true;
  fim = false;
  recado.textContent = 'Com ' + n + ' pontos, o resultado conhecido diz que ganha o ' +
    padraoConhecido(n) + '.';
  desenhaRegioes();
  desenhaJogadas();
  atualiza();
});

campo.addEventListener('change', () => btNovo.click());

atualiza();
