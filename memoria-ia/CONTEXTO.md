# MW 3D Gauge Card — contexto

## O que é
Gauge linear com corpo 3D para o Home Assistant. Nasceu de duas referências que o
dono trouxe: uma fileira de **colunas de paralelepípedo em isometria** (infográfico,
líquido colorido subindo dentro de um corpo branco translúcido, ícone dentro da cor,
% grande na área clara) e uma fileira de **tubos de ensaio cilíndricos** (vidro,
tampa branca, menisco, ícone flutuando no líquido). O card faz as duas, em pé ou
deitado.

## Decisão de desenho que sustenta tudo
O preenchimento é **um prisma dentro do outro**: o líquido é desenhado com o tamanho
do curso inteiro — corpo **mais a sua própria face de topo** (losango no box, elipse
com menisco no cilindro) — recortado por um `clipPath` com a silhueta do tubo e
deslocado por `transform`. Assim:

- a face de topo acompanha o nível sozinha, sem recalcular `points`;
- o estado muda **um** `transform` — GPU, sem relayout;
- o relevo continua sendo sombra parada, como manda a família MW.

`boxParts()` e `cylParts()` servem vertical e horizontal: quem decide é quem passa
`w` e `h`. Por isso as quatro combinações saem do mesmo código.

## Armadilhas já pagas (todas com prova no probe)
| sintoma | causa | conserto |
|---|---|---|
| todo papel saía azul | `toRGB` não entendia `hsl()` e caía no fallback azul | `hsl2rgb` + `paperColors` devolvendo `rgb()` |
| CO₂ abria em 0–1 em vez de 400–2000 | `Number(null) === 0`, então "sem mínimo" virava mínimo zero | testar `== null` antes de `Number()` |
| "1012 hPa" vazava para fora do tubo | fonte fixa calculada só pela espessura | fonte cede conforme o comprimento do texto |
| ícone animado por `top`/`left` | HTML absoluto sobre o stage | `<foreignObject>` dentro do SVG, movido por `transform` |

## O que NÃO foi feito (de propósito)
- `mw-paper-control` não foi embutido: o card não tem botão, e o relevo da folha sai
  do mesmo CSS que os irmãos usam para `depth`.
- Não há elemento de picture-elements ainda — o desenho já está parametrizado para
  virar um (`mw-ha-3d-gauge-element`), é só trocar o hospedeiro.

## Estado
- v0.1.0, 102 provas verdes em `tools/probe.js`.
- DevOps (CI, auto-release, marca, GitHub) ainda **não** aplicado: fase B.
