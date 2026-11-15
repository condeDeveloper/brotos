# Sprouts

Comece com `n` pontos no papel. Cada jogada liga dois pontos — ou um ponto a ele
mesmo — por uma curva que **não cruza** nada do que já está desenhado, e põe um ponto
novo no meio dessa curva. Nenhum ponto pode ter mais de três pontas de curva saindo
dele. Quem não consegue jogar, perde.

O problema inteiro é que a posição **não é um tabuleiro**: é um desenho no plano, e o
que importa é só como ele separa o plano. Aqui a posição é um conjunto de **regiões**,
cada uma com as **fronteiras** que a cercam e os **pontos soltos** que estão dentro
dela — e a árvore está varrida até 4 pontos.

**Página:** <https://condedeveloper.github.io/brotos/>

## Os quatro achados

1. **Toda partida dura entre 2n e 3n−1 jogadas, e todos os valores entre os dois
   limites acontecem.** Varrendo **todas** as partidas até 3 pontos: {2}, {4, 5} e
   {6, 7, 8}. Nenhum valor falta, nenhum sobra. E em **1.000** partidas sorteadas com
   4, 5, 6, 8 e 10 pontos, **nenhuma** saiu dos limites.
2. **Euler confere cada posição, e nunca reclamou:** regiões = arestas − vértices + 1 +
   componentes, em **120.493** posições de 1 a 4 pontos, com **zero**
   quebras. Essa conta é o que separa "a busca roda" de "a busca está certa": confundir
   uma jogada que **parte** a região com uma que não parte muda o número de regiões e
   mais nada.
3. **O número de aberturas sai de uma conta, e a conta fecha:** ⌊(n−1)/2⌋ + 2 jogadas
   diferentes a partir de n pontos soltos, conferido de n = 2 a n = 9. Com **quatro**
   pontos há **três** aberturas — exatamente as mesmas três de n = 3.
4. **O resultado conhecido concorda nos quatro tamanhos varridos**, mas é gabarito e
   não prova: segundo, segundo, primeiro, primeiro para n = 1, 2, 3 e 4. Com 5 pontos a
   busca **passa de 50.000 posições sem terminar** — e esse número está aqui porque é o
   que foi medido, não o que eu gostaria de ter medido.

## Quem ganha

| pontos | ganha | posições visitadas | resultado conhecido | bate |
|---:|---|---:|---|---|
| 1 | segundo | 3 | segundo | sim |
| 2 | segundo | 52 | segundo | sim |
| 3 | primeiro | 1.294 | primeiro | sim |
| 4 | **primeiro** | **119.144** | primeiro | sim |
| 5 | — | passa de 50.000 sem terminar | primeiro | — |

O resultado conhecido é: o primeiro ganha quando `n mod 6` está em {3, 4, 5}.

## As três contas que amarram cada posição

Um gerador de jogadas errado em Sprouts não trava nem reclama — ele devolve uma árvore
plausível e um vencedor plausível. Por isso cada posição visitada passa por:

| conta | o que ela pega |
|---|---|
| grau × aparições | um ponto de grau `d` aparece `d` vezes nas fronteiras |
| vidas × jogadas | cada jogada gasta duas vidas e cria uma: o total cai de um em um |
| **Euler** | regiões = arestas − vértices + 1 + componentes |

A de Euler é a que importa. E ela **não** é um juiz que concorda com qualquer coisa: o
teste estraga uma posição de propósito, acrescentando uma região, e confere que ela
reclama.

## Quanto dura uma partida

| pontos | comprimentos possíveis | limites 2n … 3n−1 | todos eles | posições |
|---:|---|---|---|---:|
| 1 | 2 | 2 … 2 | sim | 3 |
| 2 | 4, 5 | 4 … 5 | sim | 87 |
| 3 | 6, 7, 8 | 6 … 8 | sim | 11.556 |

Varrer **quanto dura** custa mais que varrer **quem ganha**: o vencedor pode cortar o
galho na primeira jogada que ganha, e o comprimento não pode cortar nada.

Nas partidas sorteadas, que alcançam tamanhos que a árvore inteira não alcança:

| pontos | partidas | posições | fora dos limites | comprimentos vistos |
|---:|---:|---:|---:|---|
| 4 | 200 | 2.092 | 0 | 8, 9, 10, 11 |
| 5 | 200 | 2.572 | 0 | 11, 12, 13 |
| 6 | 200 | 3.069 | 0 | 13, 14, 15, 16 |
| 8 | 200 | 4.014 | 0 | 17, 18, 19, 20, 21 |
| 10 | 200 | 4.955 | 0 | 22, 23, 24, 25, 26 |

## As primeiras jogadas

| pontos | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---:|---:|---:|---:|---:|---:|---:|
| jogadas diferentes | 1 | 2 | 3 | 3 | 4 | 4 | 5 |
| delas ganham | 0 | 0 | 2 | 2 | — | — | — |

Com `n` pontos soltos numa região só: ou se ligam dois deles — **um** jeito, porque os
pontos são todos iguais — ou se faz um laço num deles, e os outros `n−1` se repartem
entre as duas regiões novas, que são simétricas: ⌊(n−1)/2⌋ + 1 jeitos. Total
**⌊(n−1)/2⌋ + 2**, conferido de n = 2 a n = 9.

## Como a posição é escrita

A chave de uma posição é a menor descrição dela entre todas as ordens possíveis, com os
pontos renomeados na ordem em que aparecem:

```
[]{3}                             tres pontos soltos, uma regiao
[0.1]{1}/[0.1]{1}                 depois de um laco: duas regioes iguais
[0.1|2.3]{0}/[2.3]{0}/[1.0.4]{0}  tres regioes, uma delas com duas fronteiras
```

Regiões separadas por `/`, fronteiras entre `[ ]` e separadas por `|`, e entre `{ }`
quantos pontos soltos a região tem.

## O que as medidas me corrigiram

- **Escrevi a conta das vidas como 3n − 2m.** Cada jogada gasta duas vidas e **cria
  uma**, então o total cai de um em um: é 3n − m. O teste acusou 1.443 das 1.444
  posições de n = 3 — divergência em toda parte de uma vez, que é sempre sinal de
  gabarito torto, nunca da busca. Essa é a terceira vez que esta armadilha me pega no
  acervo, e a primeira em que eu a reconheci no mesmo minuto.
- **A primeira chave de posição não fechava as simetrias.** Ela ordenava as regiões por
  uma marca e desempatava pela ordem em que elas estavam guardadas — então, no jogo de
  1 ponto, jogar numa das duas regiões idênticas ou na outra dava **duas** chaves para a
  **mesma** posição. A resposta saía certa e a contagem de posições saía inflada: 61 em
  vez de 52 no n = 2, 1.444 em vez de 1.294 no n = 3.
- **A chave nova, do jeito que nasceu, custou o projeto inteiro.** Tentar todas as 720
  ordens possíveis fez o n = 3 sair de 0,4 s para minutos, porque o gerador pede a chave
  uma vez por posição criada. Baixar o teto para 24 e guardar a chave na posição
  devolveu o preço **sem mudar um número** — as simetrias que aparecem de verdade são de
  duas ou três regiões.
- **Escrevi que de 2n a 3n−1 cabem n+1 valores.** Cabem **n**. A coluna "todos eles"
  deu `false` até no n = 3, onde os três comprimentos estavam todos lá.

## Rodando

```bash
node --test testes/*.test.js                               # 36 testes
node --test testes/nucleo.test.js testes/medidas.test.js   # os 28 curtos
node --test testes/pesados.test.js                         # os 8 da arvore de 4 pontos
node ferramentas/medidor.js comprimento
```

A página é JavaScript puro: sem framework, sem build, sem dependência.

## Arquivos

| arquivo | o que faz |
|---|---|
| `js/nucleo.js` | a posição, as contas que a amarram e a chave canônica |
| `js/jogadas.js` | o gerador de jogadas, caso a caso |
| `js/busca.js` | a árvore de jogo, os comprimentos e a busca com teto |
| `js/juiz.js` | os limites do comprimento, as partidas sorteadas e o gabarito |
| `testes/pesados.test.js` | a árvore inteira de 4 pontos |

## Licença

MIT.
