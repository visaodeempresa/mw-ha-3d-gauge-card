<!-- MW-BRAND:BEGIN — gerado por IA/tools/mw-brand.sh · não editar à mão -->
<p align="center">
  <a href="https://github.com/visaodeempresa">
    <img src="https://mayconsoftware.github.io/assets/ve/LOGO_VISAO_DE_EMPRESA_HEIGHT-64px.png" alt="Visão de Empresa — MAYCON WILLIAN OLIVEIRA" height="64">
  </a>
  <br>
  <sub><b>Visão de Empresa</b> · componente de Home Assistant por MAYCON WILLIAN OLIVEIRA</sub>
</p>
<!-- MW-BRAND:END -->

# MW 3D Gauge Card

Gauge **linear** para o Home Assistant, com corpo 3D de verdade: um **cilindro** de
vidro (tubo de ensaio) ou um **paralelepípedo** em projeção isométrica, **em pé ou
deitado**, com o líquido subindo por dentro, menisco, tampa, placa de base e sombra
de contato. As partes claras são **papel MW** — qualquer um dos 49 tons, claro ou de
noite. A cor do líquido vem das **escalas canônicas da casa**, pela grandeza.

Tudo em **SVG e CSS parados**: nenhum WebGL, nenhum canvas, nenhum `@keyframes`. O que
se move é um `transform`.

| | |
|---|---|
| tipo | `custom:mw-3d-gauge-card` |
| editor visual | sim — 8 abas, parede de 50 papéis e preview ao vivo |
| requisito | Home Assistant 2024.4.0 |

---

## Como funciona o desenho

O líquido **não muda de tamanho**: é um prisma (ou cilindro) do tamanho do curso
inteiro, com a sua própria face de topo, recortado pelo volume do tubo e **deslizado
por `transform`**. A face de topo — losango no paralelepípedo, elipse com menisco no
cilindro — acompanha sozinha. Por isso o movimento é de GPU, sem relayout, e o relevo
continua sendo sombra parada.

---

## Bancada — os exemplos

### 1. As quatro combinações

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.temperatura_do_escritorio
orientation: vertical      # vertical | horizontal
shape: cylinder            # cylinder | box
icon: mdi:thermometer
```

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.temperatura_do_escritorio
orientation: vertical
shape: box
icon: mdi:thermometer
```

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.umidade_da_suite
orientation: horizontal
shape: cylinder
length: 280
icon: mdi:water-percent
```

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.umidade_da_suite
orientation: horizontal
shape: box
length: 280
icon: mdi:water-percent
```

### 2. A coluna de infográfico (paralelepípedo, sem tampa, valor em %)

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.bateria_do_sensor_da_cozinha
shape: box
orientation: vertical
color_scale: single
color: "#5b3a9e"
icon: mdi:battery
label: BATERIA
value_mode: percent
show_name: false
ticks: none
cap: false
iso: 16
thickness: 44
length: 230
```

### 3. O tubo de ensaio (cilindro com tampa e menisco)

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.nivel_do_reservatorio
shape: cylinder
cap: true
iso: 18
thickness: 46
length: 240
value_mode: percent
show_name: false
ticks: none
color_scale: single
color: "#1f9aa0"
icon: mdi:water
```

### 4. Relevo

```yaml
# depth: 3d (relevo cheio) · soft (suave) · flat (chapado, sem sombra de contato)
type: custom:mw-3d-gauge-card
entity: sensor.co2_do_escritorio
depth: soft
shape: box
paper: orange-3
icon: mdi:molecule-co2
```

### 5. Papel — as partes claras

Qualquer um dos 49 tons (`<matiz>-<1..7>`, matizes `red orange yellow green blue indigo
violet`) ou `paper` (creme). `paper_dark: true` troca para a rampa de noite.

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.umidade_da_suite
paper: blue-3
icon: mdi:water
ticks: major
```

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.umidade_da_suite
paper_dark: true
paper: violet-5
icon: mdi:water
ticks: major
```

### 6. Escalas canônicas

`color_scale: auto` reconhece a grandeza pela unidade e pelo `device_class` e usa a
escala da casa. Dá para fixar a família na mão.

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.temperatura_do_escritorio   # clima  · °C
```

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.co2_do_escritorio           # ar     · CO₂ / TVOC / HCHO / PM2.5
```

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.consumo_da_casa             # elétrica · W / V / A / kWh
```

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.pressao_atmosferica         # pressão · hPa
```

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.bateria_do_cubo             # nível   · bateria / lux / sinal
```

### 7. Cor própria

```yaml
# paradas próprias: 5 faixas livres separadas por 4 valores
type: custom:mw-3d-gauge-card
entity: sensor.temperatura_do_escritorio
color_scale: custom
stop_1: 18
stop_2: 22
stop_3: 26
stop_4: 30
```

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.temperatura_do_escritorio
color_scale: single
color: "#8b5cf6"
```

### 8. Régua

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.umidade_da_suite
ticks: both          # none | major | minor | both
tick_count: 5
tick_labels: true
tick_side: start     # start = à esquerda no vertical, embaixo no horizontal
```

### 9. Zonas

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.umidade_da_suite
ticks: major
zone_labels: true
zones:
  - { from: 0,  to: 35,  color: "#e35d5d", label: seco }
  - { from: 35, to: 65,  color: "#3fb950", label: ok }
  - { from: 65, to: 100, color: "#4f8ef7", label: úmido }
```

### 10. Segmentos

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.bateria_do_cubo
fill_style: segments
segments: 10
icon: mdi:battery
```

### 11. Comparar duas entidades

```yaml
# ghost = fantasma no mesmo tubo · marker = marca na régua · side = tubo ao lado
type: custom:mw-3d-gauge-card
entity: sensor.temperatura_do_escritorio
secondary_entity: sensor.temperatura_externa
compare_mode: ghost
icon: mdi:home-thermometer
```

### 12. Vidro, tampa, chão

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.umidade_da_suite
glass: false          # papel opaco em vez de vidro
cap: false            # sem tampa (o curso vira o tubo inteiro)
base_plate: false
ground_shadow: false
iso: 0                # sem profundidade: vira desenho chapado
```

### 13. Onde o valor aparece

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.temperatura_do_escritorio
value_position: in_body   # in_body | top | bottom | none
value_mode: value         # value | percent
show_unit: true
show_min_max: true
label: ESCRITÓRIO
```

### 14. Ações

```yaml
type: custom:mw-3d-gauge-card
entity: sensor.consumo_da_casa
tap_action:
  action: more-info
hold_action:
  action: navigate
  navigation_path: /energia
```

---

## Todas as opções

| chave | padrão | o que faz |
|---|---|---|
| `entity` | — | **obrigatória**. A entidade numérica |
| `name` | nome da entidade | título no cabeçalho |
| `label` | — | rótulo pequeno, abaixo do valor |
| `icon` | — | ícone do cabeçalho e, se `icon_in_fill`, dentro do líquido |
| `unit` | da entidade | unidade mostrada |
| `min` / `max` | automático pela grandeza | curso da escala |
| `orientation` | `vertical` | `vertical` \| `horizontal` |
| `shape` | `cylinder` | `cylinder` \| `box` |
| `depth` | `3d` | `3d` \| `soft` \| `flat` |
| `thickness` | `46` | espessura do tubo |
| `length` | `220` | comprimento do tubo |
| `iso` | `18` | profundidade 3D (raio da elipse ou deslocamento isométrico) |
| `glass` | `true` | corpo translúcido com reflexo |
| `cap` | `true` | tampa na ponta — encurta o curso do líquido |
| `base_plate` | `true` | placa de base |
| `ground_shadow` | `true` | sombra de contato no chão |
| `paper_dark` | `false` | rampa de papel de noite |
| `paper` | `paper` | tom de papel das partes claras |
| `fill_style` | `liquid` | `liquid` \| `segments` |
| `segments` | `12` | nº de segmentos |
| `color_scale` | `auto` | `auto` \| `climate` \| `air` \| `electrical` \| `pressure` \| `level` \| `custom` \| `single` |
| `color` | `#4f8ef7` | cor única |
| `stop_1..4` | — | paradas do modo `custom` |
| `ticks` | `both` | `none` \| `major` \| `minor` \| `both` |
| `tick_count` | `5` | nº de marcas grandes |
| `tick_labels` | `true` | números na régua |
| `tick_side` | `start` | lado da régua |
| `zones` | — | lista de `{from, to, color, label}` |
| `zone_labels` | `false` | escreve o rótulo das zonas |
| `secondary_entity` | — | segunda entidade |
| `secondary_label` | — | rótulo dela |
| `compare_mode` | `ghost` | `ghost` \| `marker` \| `side` |
| `show_name` | `true` | cabeçalho |
| `show_value` | `true` | mostra o valor |
| `value_mode` | `value` | `value` \| `percent` |
| `value_position` | `in_body` | `in_body` \| `top` \| `bottom` \| `none` |
| `show_unit` | `true` | unidade junto do valor |
| `show_min_max` | `false` | mín e máx no rodapé |
| `icon_in_fill` | `true` | ícone viaja dentro do líquido |
| `tap_action` / `hold_action` / `double_tap_action` | `more-info` | ações padrão do HA |

O editor visual grava no YAML **só o que difere do padrão**.

---

## Instalação

HACS → ⋮ → *Custom repositories* → `https://github.com/visaodeempresa/mw-ha-3d-gauge-card`,
categoria **Dashboard**. Depois instale e recarregue a página com ⌘⇧R.

---

## Desenvolvimento

```bash
node --check dist/mw-3d-gauge-card.js    # sintaxe
node tools/probe.js                      # 102 provas headless
```

A bancada visual é `tools/preview.html` — **não abre por `file://`**, precisa de HTTP
(entrada `mw-3d-gauge-preview` no `.claude/launch.json` da raiz de PROJECTS).

Os blocos entre `// >>> <bloco> v1` e `// <<< <bloco> v1` são cópias byte a byte das
fontes canônicas em `IA/lib/` — conferidas por `IA/tools/check-embeds.sh`. Não se
editam aqui.

### Regras que o probe protege

- Relevo de papel é **sombra parada**: nenhum `@keyframes`, nenhuma transição em
  `box-shadow`, `filter`, `width`, `height`, `left`, `top`.
- `min`/`max` ausentes **não** podem virar zero (`Number(null)` é `0`).
- `toRGB` precisa entender `hsl()` — o papel canônico é declarado assim.
- A tampa encurta o curso: sem isso o líquido sobe por dentro dela.
- O editor não grava default nenhum no YAML.

---

© MAYCON WILLIAN OLIVEIRA — MIT
