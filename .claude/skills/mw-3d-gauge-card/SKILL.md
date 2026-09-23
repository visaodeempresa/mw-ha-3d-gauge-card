---
name: mw-3d-gauge-card
description: Mexer no MW 3D Gauge Card — o gauge linear com corpo 3D do Home Assistant (custom:mw-3d-gauge-card). Use quando o Maycon falar em "gauge 3D", "tubo de ensaio", "coluna de infográfico", "barra vertical/horizontal", "o líquido não sobe", "o papel do gauge saiu errado", "o valor vazou do tubo", "põe régua/zonas no gauge", "compara dentro e fora no mesmo tubo", ou quando pedir mais uma opção no editor deste card.
---

# MW 3D Gauge Card

Gauge linear em SVG: cilindro (tubo de ensaio) ou paralelepípedo isométrico, vertical
ou horizontal, corpo em papel MW, cor do líquido pelas escalas canônicas.

## Pré-condições

- `dist/mw-3d-gauge-card.js` é **fonte e artefato** — não há build.
- Os blocos entre `// >>> <bloco> v1` e `// <<< <bloco> v1` são cópias byte a byte de
  `IA/lib/` — não se editam aqui (`IA/tools/check-embeds.sh` reprova).

## Como o desenho funciona (leia antes de mexer na geometria)

O líquido é **um prisma dentro do outro**: desenhado com o tamanho do curso inteiro,
corpo **mais a sua face de topo**, recortado por `clipPath` com a silhueta do tubo e
deslocado por `transform`. Mudar o nível = mudar **um** `transform`.

- `boxParts(x0, yBase, w, h, dx, dy)` e `cylParts(x0, yBase, w, h, r, vertical)`
  servem em pé e deitado: quem decide é quem passa `w` e `h`.
- `geometry(c)` calcula viewBox, curso (`run`) e as calhas de régua e zonas.
- `svgFor()` monta a cena; `tubeMarkup()` monta um tubo (o modo `side` chama dois).
- `_build()` monta uma vez; `_paint()` só escreve variáveis CSS, `stop-color` e o
  `transform`. `setConfig` separa **forma** (remonta) de **estado** (repinta).

## Armadilhas com sintoma observável

| sintoma | causa | conserto |
|---|---|---|
| todo papel sai azul | `toRGB` recebendo `hsl()` e caindo no fallback | usar `hsl2rgb`; `paperColors` devolve `rgb()` |
| a escala abre em 0–1 | `Number(null) === 0`: "sem mínimo" virou mínimo zero | testar `== null` antes de `Number()` |
| o valor vaza para fora do tubo | fonte fixa pela espessura | a fonte cede pelo comprimento do texto (`room / (0.58 * len)`) |
| o valor some no papel | cor clara da escala escrita crua | `inkOf(base, darkPaper)` cede luminosidade |
| o líquido sobe por dentro da tampa | curso = tubo inteiro | `run = L - capH` quando `cap` |
| os segmentos andam junto com o líquido | máscara no grupo transformado | máscara no grupo do `clip-path`, não no `.g3d-fill` |
| `stop-color` não muda | variável CSS em `<stop>` não é confiável | `setAttribute("stop-color", …)` no `_paint()` |

## Verificação

```bash
node --check dist/mw-3d-gauge-card.js
node tools/probe.js          # esperado: ✓ 105 provas passaram
```

Bancada visual: `tools/preview.html` — **não abre por `file://`**. Sirva por HTTP
(`mw-3d-gauge-preview` no `.claude/launch.json` da raiz de PROJECTS).

Deploy de teste e conferência no destino (regra global 30):

```bash
R=mw-ha-3d-gauge-card; C=mw-3d-gauge-card
gzip -9 -c $R/dist/$C.js > /tmp/$C.js.gz
scp -F new_wakeword/ssh/ssh_config $R/dist/$C.js /tmp/$C.js.gz ha-leticia:/config/www/community/$R/
curl -s http://192.168.1.71:8123/hacsfiles/$R/$C.js | diff -q - $R/dist/$C.js
curl -s -H 'Accept-Encoding: gzip' http://192.168.1.71:8123/hacsfiles/$R/$C.js | gunzip -c | grep -c '<marcador novo>'
```

**Mandar só o `.js` não basta**: o servidor entrega o `.js.gz` quando ele existe —
sintoma é `curl` mostrar o novo e a tela continuar velha. Depois, ⌘⇧R.

A vitrine fica em `ha-dashboards/scripts/mw_components/gerar.py`, função `v_gauges()`.

## DevOps
`develop` (padrão) → PR → `main` → auto-release (bump pelo assunto do commit,
tag, Release com o asset) → `deploy-ha` (HACS baixa, `?v=` no recurso,
conferência no destino). Workflows são gerados por `IA/tools/mw-devops.sh
apply` — editar aqui é perder na próxima aplicação. Exige os segredos
`HA_URL`/`HA_TOKEN`. Conferir: `IA/tools/mw-devops.sh check <repo>`.
