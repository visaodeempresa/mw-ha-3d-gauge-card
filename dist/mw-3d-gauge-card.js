/*! MW 3D Gauge Card — gauge linear com corpo 3D (paralelepípedo ou cilindro),
 *  vertical ou horizontal, em papel MW.
 *  MAYCON WILLIAN OLIVEIRA <visaodeempresa@gmail.com>
 */
(() => {
  "use strict";
  const VERSION = "0.2.0";

  // >>> paper-palette v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/paper-palette/paper-palette.js
  // 49 papéis encardidos: 7 matizes do arco-íris × 7 tons (1 = quase branco,
  // 7 = mais encardido). Saturação baixa de propósito — papel descansa a vista.
  const PAPER_HUES = [
    ["red", "Vermelho", 6], ["orange", "Laranja", 27], ["yellow", "Amarelo", 47],
    ["green", "Verde", 96], ["blue", "Azul", 203], ["indigo", "Anil", 236],
    ["violet", "Violeta", 283],
  ];
  const PAPER_TONES = [[97, 6], [96, 9], [94, 12], [92, 15], [90, 18], [88, 21], [85, 24]];
  const PAPER_DEFAULT = "linear-gradient(145deg, #fdfaf3, #e8e3d8)";
  const paperGradient = (key) => {
    const m = /^([a-z]+)-([1-7])$/.exec(String(key || "").trim());
    if (!m) return PAPER_DEFAULT;
    const hue = PAPER_HUES.find((h) => h[0] === m[1]);
    if (!hue) return PAPER_DEFAULT;
    const [l, s] = PAPER_TONES[+m[2] - 1];
    return `linear-gradient(145deg, hsl(${hue[2]}, ${s}%, ${l}%), hsl(${hue[2]}, ${s + 4}%, ${l - 7}%))`;
  };
  const paperOptions = () => [{ value: "paper", label: "Papel original (creme)" }].concat(
    ...PAPER_HUES.map((h) => PAPER_TONES.map((t, i) => ({
      value: `${h[0]}-${i + 1}`,
      label: `${h[1]} · tom ${i + 1}${i === 0 ? " (mais claro)" : i === 6 ? " (mais encardido)" : ""}`,
    }))));
  // <<< paper-palette v1
  // >>> paper-dark-palette v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/paper-dark-palette/paper-dark-palette.js
  // 49 papéis de noite: as mesmas 7 matizes do paper-palette v1 × 7 tons
  // (1 = papel escuro mais claro, 7 = mais encardido). A saturação sobe mais
  // rápido que na rampa clara porque matiz em luminosidade baixa desaparece.
  const PAPER_DARK_HUES = [
    ["red", "Vermelho", 6], ["orange", "Laranja", 27], ["yellow", "Amarelo", 47],
    ["green", "Verde", 96], ["blue", "Azul", 203], ["indigo", "Anil", 236],
    ["violet", "Violeta", 283],
  ];
  const PAPER_DARK_TONES = [[26, 10], [24, 13], [21, 16], [19, 19], [16, 22], [14, 25], [11, 28]];
  const PAPER_DARK_DEFAULT = "linear-gradient(145deg, #2b2825, #161411)";
  const paperDarkGradient = (key) => {
    const m = /^([a-z]+)-([1-7])$/.exec(String(key || "").trim());
    if (!m) return PAPER_DARK_DEFAULT;
    const hue = PAPER_DARK_HUES.find((h) => h[0] === m[1]);
    if (!hue) return PAPER_DARK_DEFAULT;
    const [l, s] = PAPER_DARK_TONES[+m[2] - 1];
    return `linear-gradient(145deg, hsl(${hue[2]}, ${s}%, ${l}%), hsl(${hue[2]}, ${s + 6}%, ${Math.max(4, l - 6)}%))`;
  };
  const paperDarkOptions = () => [{ value: "paper", label: "Papel de noite (grafite)" }].concat(
    ...PAPER_DARK_HUES.map((h) => PAPER_DARK_TONES.map((t, i) => ({
      value: `${h[0]}-${i + 1}`,
      label: `${h[1]} · tom ${i + 1}${i === 0 ? " (mais claro)" : i === 6 ? " (mais escuro)" : ""}`,
    }))));
  // Tinta que se lê sobre o papel do modo pedido. Não é contraste calculado:
  // é o par fixo que a casa usa, para dois cards lado a lado combinarem.
  const paperInk = (dark) => (dark
    ? { text: "rgba(247, 244, 236, 0.94)", dim: "rgba(247, 244, 236, 0.62)", line: "rgba(255, 255, 255, 0.14)" }
    : { text: "rgba(28, 25, 20, 0.92)", dim: "rgba(28, 25, 20, 0.58)", line: "rgba(0, 0, 0, 0.14)" });
  // <<< paper-dark-palette v1
  // >>> mw-climate-scale v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/mw-climate-scale/mw-climate-scale.js
  // Escala canônica de cor por temperatura (°C) e umidade relativa (%).
  // Regra: IA/rules/global/40-cores-de-temperatura-e-umidade.md.
  const MW_CLIMATE_SCALE_ALPHA = 0.5;

  // 19 limites superiores inclusivos → 20 cores (a última vale de 46 °C para cima).
  const MW_TEMP_STOPS = [
    3.99, 6.99, 8.99, 13.99, 15.99, 17.99, 18.99, 20.99, 21.99, 22.99,
    23.99, 24.99, 25.99, 26.99, 29.99, 32.99, 35.99, 39.99, 45.99,
  ];
  const MW_TEMP_RGB = (
    "0,0,0 0,0,139 0,0,255 70,130,180 0,206,209 64,224,208 0,255,255 144,238,144 0,255,0 50,205,50 " +
    "127,255,0 154,205,50 255,255,0 255,215,0 255,165,0 255,99,71 255,69,0 178,34,34 139,0,0 139,0,0"
  ).split(" ");

  // Uma faixa por ponto percentual: índice n cobre [n, n+1); 100 é faixa própria.
  // O template original fecha a faixa em n.99 e deixa (n.99, n+1) sem dono — o
  // laço cai no fallback, que é a cor de 100% (preto). Sensor que reporte
  // 58,995 % pisca preto. Aqui o vão é fechado de propósito.
  const MW_HUM_RGB = (
    "0,0,0 51,0,0 102,0,0 153,0,0 204,0,0 255,0,0 255,11,0 255,22,0 255,33,0 255,45,0 " +
    "255,56,0 255,67,0 255,78,0 255,89,0 255,100,0 255,111,0 255,122,0 255,133,0 255,144,0 255,155,0 " +
    "255,165,0 255,170,0 255,174,0 255,179,0 255,183,0 255,188,0 255,192,0 255,197,0 255,201,0 255,206,0 " +
    "255,210,0 255,215,0 255,219,0 255,224,0 255,228,0 255,233,0 255,237,0 255,242,0 255,246,0 255,251,0 " +
    "255,255,0 170,255,85 85,255,170 0,255,255 12,252,253 24,249,251 36,246,249 48,243,247 60,240,245 72,237,243 " +
    "84,234,241 96,231,239 108,228,237 120,225,235 132,222,234 144,219,231 156,216,229 173,216,230 115,144,238 58,72,246 " +
    "0,0,255 0,0,249 0,0,243 0,0,237 0,0,231 0,0,225 0,0,219 0,0,213 0,0,207 0,0,201 " +
    "0,0,195 0,0,189 0,0,183 0,0,177 0,0,171 0,0,165 0,0,159 0,0,153 0,0,147 0,0,141 " +
    "0,0,139 0,0,132 0,0,125 0,0,118 0,0,111 0,0,104 0,0,97 0,0,90 0,0,83 0,0,76 " +
    "0,0,69 0,0,62 0,0,55 0,0,48 0,0,41 0,0,34 0,0,27 0,0,20 0,0,13 0,0,6 " +
    "0,0,0"
  ).split(" ");
  const MW_HUM_STOPS = MW_HUM_RGB.slice(1).map((_, i) => i + 0.99);

  const mwClimateRgba = (triplet, alpha) => `rgba(${triplet.split(",").join(", ")}, ${alpha})`;

  // Faixas + cores no formato do algoritmo de faixa comum: a cor é a primeira
  // cujo limite superior não foi ultrapassado. `clamp` existe porque umidade
  // fora de 0..100 é ruído de sensor, não frio.
  const mwClimateScale = (kind, alpha) => {
    const a = Number.isFinite(Number(alpha)) ? Number(alpha) : MW_CLIMATE_SCALE_ALPHA;
    const hum = kind === "hum" || kind === "humidity" || kind === "umidade";
    return {
      stops: hum ? MW_HUM_STOPS : MW_TEMP_STOPS,
      colors: (hum ? MW_HUM_RGB : MW_TEMP_RGB).map((t) => mwClimateRgba(t, a)),
      clamp: hum ? [0, 100] : null,
    };
  };

  // Cor seca (sem degradê), do jeito que o button-card faz.
  const mwClimateColor = (kind, value, alpha) => {
    const s = mwClimateScale(kind, alpha);
    let v = Number(value);
    if (!Number.isFinite(v)) return null;
    if (s.clamp) v = Math.min(s.clamp[1], Math.max(s.clamp[0], v));
    const i = s.stops.findIndex((stop) => v <= stop);
    return s.colors[i === -1 ? s.stops.length : i];
  };
  // <<< mw-climate-scale v1
  // >>> mw-air-quality-scale v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/mw-air-quality-scale/mw-air-quality-scale.js
  // Escala canônica de cor para qualidade do ar (CO₂, TVOC, HCHO, PM).
  // Regra: IA/rules/global/90-cores-de-qualidade-do-ar.md.
  // As três cores são as do próprio HA, para que um gauge nativo e um
  // componente nosso na mesma tela não discordem.
  const MW_AQ_GREEN = "#43a047";   // --success-color  · bom
  const MW_AQ_AMBER = "#ffa600";   // --warning-color  · atenção
  const MW_AQ_RED = "#db4437";     // --error-color    · ruim

  // grandeza → { nome, unidade, min, max, degraus [valor de início, cor] }.
  // `min`/`max` existem para quem desenha mostrador (gauge, régua, barra);
  // quem só quer a cor usa os degraus.
  const MW_AQ_SCALE = {
    co2:  { name: "CO₂", unit: "ppm", min: 350, max: 2000,
            steps: [[350, MW_AQ_GREEN], [800, MW_AQ_AMBER], [1200, MW_AQ_RED]] },
    tvoc: { name: "TVOC", unit: "ppm", min: 0, max: 2,
            steps: [[0, MW_AQ_GREEN], [0.3, MW_AQ_AMBER], [0.6, MW_AQ_RED]] },
    hcho: { name: "Formaldeído", unit: "mg/m³", min: 0, max: 0.3,
            steps: [[0, MW_AQ_GREEN], [0.08, MW_AQ_AMBER], [0.1, MW_AQ_RED]] },
    pm25: { name: "PM2.5", unit: "µg/m³", min: 0, max: 150,
            steps: [[0, MW_AQ_GREEN], [12, MW_AQ_AMBER], [35, MW_AQ_RED]] },
  };
  // apelidos: o que o dono e as integrações chamam a mesma grandeza
  const MW_AQ_ALIAS = {
    carbon_dioxide: "co2", dioxido_de_carbono: "co2", co2: "co2",
    voc: "tvoc", vocs: "tvoc", tvoc: "tvoc", volatile_organic_compounds: "tvoc",
    formaldeido: "hcho", formaldehyde: "hcho", hcho: "hcho", ch2o: "hcho",
    pm25: "pm25", "pm2_5": "pm25", "pm2.5": "pm25", particulate_matter: "pm25",
  };

  const mwAirKind = (kind) => {
    const k = String(kind || "").toLowerCase().trim();
    return MW_AQ_ALIAS[k] || (MW_AQ_SCALE[k] ? k : null);
  };

  // Cor do degrau: o último degrau cujo valor de início já foi alcançado.
  // Abaixo do primeiro degrau ainda é "bom" (0 ppm de CO₂ não existe na
  // prática, mas sensor mudo reportando 0 não deve pintar de vermelho).
  const mwAirColor = (kind, value, alpha) => {
    const k = mwAirKind(kind);
    if (!k) return null;
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    const steps = MW_AQ_SCALE[k].steps;
    let hex = steps[0][1];
    for (const [from, color] of steps) { if (v >= from) hex = color; }
    return mwAirRgba(hex, alpha);
  };

  // "bom" | "atencao" | "ruim" — para quem precisa do nível, não da cor
  // (ícone, texto, ordenação, automação).
  const MW_AQ_LEVELS = ["bom", "atencao", "ruim"];
  const mwAirLevel = (kind, value) => {
    const k = mwAirKind(kind);
    if (!k) return null;
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    const steps = MW_AQ_SCALE[k].steps;
    let i = 0;
    steps.forEach(([from], idx) => { if (v >= from) i = idx; });
    return MW_AQ_LEVELS[i];
  };

  // #rrggbb → rgba(...) quando pedem alfa; sem alfa devolve o hex intacto,
  // que é o que os gauges nativos já usam.
  const mwAirRgba = (hex, alpha) => {
    const a = Number(alpha);
    if (!Number.isFinite(a)) return hex;
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex));
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  };

  // Degraus no formato do custom:modern-circular-gauge (e do type: gauge
  // nativo, que lê `severity`). Mesma saída do `segmentos()` do Python.
  const mwAirSegments = (kind) => {
    const k = mwAirKind(kind);
    if (!k) return null;
    return MW_AQ_SCALE[k].steps.map(([from, color]) => ({ from, color }));
  };
  // <<< mw-air-quality-scale v1
  // >>> mw-electrical-scale v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/mw-electrical-scale/mw-electrical-scale.js
  // Escala canônica de cor para potência, consumo, tensão e corrente.
  // Regra: IA/rules/global/180-cores-de-grandezas-eletricas.md.
  const MW_EL_ALPHA = 0.85;

  // --- unidades ----------------------------------------------------------
  // Normaliza para a unidade-base da grandeza: W, kWh, V, A. Devolve
  // {value, unit, kind}; `kind` é null quando a unidade não é elétrica.
  // Sem este passo, sensor em mV/mA/Wh cai na régua errada em silêncio.
  const MW_EL_UNITS = {
    w: ["power", 1, "W"], kw: ["power", 1e3, "W"],
    va: ["power", 1, "W"], kva: ["power", 1e3, "W"],
    wh: ["energy", 1e-3, "kWh"], kwh: ["energy", 1, "kWh"], mwh: ["energy", 1e3, "kWh"],
    v: ["voltage", 1, "V"], mv: ["voltage", 1e-3, "V"], kv: ["voltage", 1e3, "V"],
    a: ["current", 1, "A"], ma: ["current", 1e-3, "A"],
  };
  // Fora da tabela de propósito: "MW" e "mW" viram a mesma chave ao baixar a
  // caixa (megawatt × miliwatt, fator 1e9 de diferença) e nenhuma casa tem as
  // duas para desempatar. Unidade ambígua fica com kind null — o consumidor
  // pinta como "sem escala" em vez de errar por 9 ordens de grandeza.
  // Vazio/nulo NÃO é zero: Number("") e Number(null) devolvem 0, e um sensor
  // sem leitura acabaria pintado como "0 W, desligado" ou "0 V, crítica" em
  // vez de cair na cor de "sem leitura" do consumidor.
  const mwElNum = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const v = Number(value);
    return Number.isFinite(v) ? v : null;
  };
  const mwElectricalUnit = (unit, value) => {
    const u = String(unit || "").trim().toLowerCase();
    const hit = MW_EL_UNITS[u];
    const v = mwElNum(value);
    if (!hit || v === null) return { value: v, unit: unit || "", kind: null };
    return { value: v * hit[1], unit: hit[2], kind: hit[0] };
  };

  // --- TENSÃO: PRODIST módulo 8 (ANEEL) ----------------------------------
  // Pontos de conexão em tensão nominal igual ou inferior a 1 kV. São
  // QUATRO zonas, não cinco: acima da faixa adequada a norma vai direto para
  // crítica — não existe "precária alta" nesta faixa de tensão.
  //
  //   220 V  adequada 202..231 · precária 191..201 · crítica <191 ou >231
  //   127 V  adequada 117..133 · precária 110..116 · crítica <110 ou >133
  //
  // Limites SUPERIORES inclusivos (a forma que os consumidores já usam), com
  // o mesmo truque de .99 do mw-climate-scale para não deixar vão sem dono
  // entre 190,99 e 191.
  const MW_EL_BLUE = "41, 55, 140";    // crítica baixa — afundou
  const MW_EL_AMBER = "255, 166, 0";   // precária — atenção (cor de atenção da casa)
  const MW_EL_GREEN = "67, 160, 71";   // adequada — cor de "tudo bem" da casa
  const MW_EL_RED = "219, 68, 55";     // crítica alta — cor de problema da casa
  const MW_PRODIST = {
    220: { stops: [190.99, 201.99, 231], adequada: [202, 231] },
    127: { stops: [109.99, 116.99, 133], adequada: [117, 133] },
  };
  const MW_PRODIST_RGB = [MW_EL_BLUE, MW_EL_AMBER, MW_EL_GREEN, MW_EL_RED];

  // Célula de pilha (CR2032, AA, AAA num nó Zigbee): 3 V nominais. Não é
  // rede elétrica e não se mede pelo PRODIST — mas chega no mesmo
  // device_class `voltage`, então precisa de régua própria.
  const MW_CELL_STOPS = [2.4, 2.6, 2.8, 3.0];
  const MW_CELL_RGB = ["219, 68, 55", "255, 140, 0", "255, 166, 0", "154, 205, 50", "67, 160, 71"];

  // Escolhe a régua pelo próprio valor já normalizado em V. Abaixo de 60 V
  // não é rede de casa nenhuma: é pilha. Entre as duas nominais, ganha a
  // mais próxima.
  const mwVoltageNominal = (volts) => {
    const v = Number(volts);
    if (!Number.isFinite(v)) return null;
    if (v < 60) return "cell";
    return Math.abs(v - 127) <= Math.abs(v - 220) ? 127 : 220;
  };

  const mwElRgba = (triplet, alpha) =>
    `rgba(${triplet}, ${alpha === undefined || alpha === null ? MW_EL_ALPHA : alpha})`;

  const mwVoltageScale = (nominal, alpha) => {
    if (String(nominal) === "cell") {
      return { stops: MW_CELL_STOPS.slice(), colors: MW_CELL_RGB.map((c) => mwElRgba(c, alpha)), clamp: null };
    }
    const t = MW_PRODIST[Number(nominal)] || MW_PRODIST[220];
    return { stops: t.stops.slice(), colors: MW_PRODIST_RGB.map((c) => mwElRgba(c, alpha)), clamp: null };
  };

  // --- POTÊNCIA (W) ------------------------------------------------------
  // Degraus logarítmicos, pela mesma razão da iluminância: a casa vive
  // embaixo (medição de 2026-09-06 em 63 sensores: p50 = 0 W, p90 = 111 W,
  // max = 474 W) e uma régua linear até 5 kW pintaria tudo da mesma cor.
  // O degrau `<= 0` existe para desligado ter cor própria — com p50 = 0,
  // metade da casa cai nele, e distinguir "apagado" de "quase nada" é a
  // informação mais útil da faixa.
  const MW_POWER_STOPS = [0, 1, 10, 50, 200, 1000];
  const MW_POWER_RGB = [
    "55, 60, 78",     // 0 W — desligado
    "86, 66, 130",    // <=1 W — vampiro de tomada
    "128, 71, 158",   // <=10 W — LED, carregador
    "186, 78, 145",   // <=50 W — TV, notebook
    "226, 106, 96",   // <=200 W — geladeira, bomba pequena
    "243, 156, 53",   // <=1 kW — ferro, cafeteira
    "250, 205, 55",   // acima — chuveiro, forno
  ];
  const mwPowerScale = (alpha) => ({
    stops: MW_POWER_STOPS.slice(),
    colors: MW_POWER_RGB.map((c) => mwElRgba(c, alpha)),
    clamp: null,
  });

  // --- CORRENTE (A) ------------------------------------------------------
  // Sem faixa absoluta possível: 2 A é muito num circuito de iluminação e
  // pouco num de chuveiro. A régua é RELATIVA ao limite do circuito (`max`,
  // em A), nas mesmas frações da rampa de potência.
  const MW_CURRENT_FRACTIONS = [0, 0.02, 0.1, 0.3, 0.6, 0.85];
  const mwCurrentScale = (max, alpha) => {
    const m = Number(max) > 0 ? Number(max) : 20;
    return {
      stops: MW_CURRENT_FRACTIONS.map((f) => f * m),
      colors: MW_POWER_RGB.map((c) => mwElRgba(c, alpha)),
      clamp: null,
    };
  };

  // --- CONSUMO (kWh) -----------------------------------------------------
  // Acumulado não tem faixa natural: na casa há sensores de 0 a 120.590 kWh
  // no mesmo instante. A régua é RELATIVA a um máximo — por padrão o maior
  // valor entre as leituras da própria tela, o que transforma a faixa numa
  // comparação entre ambientes em vez de num julgamento absoluto.
  // Rampa sequencial de um tom só (claro -> escuro), que é o desenho certo
  // para grandeza acumulada e não colide com nenhuma das outras rampas.
  const MW_ENERGY_FRACTIONS = [0, 0.2, 0.4, 0.6, 0.8];
  const MW_ENERGY_RGB = [
    "255, 236, 179",
    "255, 213, 79",
    "255, 179, 0",
    "239, 124, 0",
    "191, 74, 0",
    "120, 40, 10",
  ];
  const mwEnergyScale = (max, alpha) => {
    const m = Number(max) > 0 ? Number(max) : 1;
    return {
      stops: MW_ENERGY_FRACTIONS.map((f) => f * m),
      colors: MW_ENERGY_RGB.map((c) => mwElRgba(c, alpha)),
      clamp: null,
    };
  };

  // Atalho: cor direta, para quem não quer a tabela. `opts` aceita
  // {nominal, max, alpha}. Sempre normaliza a unidade antes.
  const mwElectricalColor = (kind, value, unit, opts) => {
    const o = opts || {};
    const n = mwElectricalUnit(unit, value);
    const k = n.kind || String(kind || "").toLowerCase();
    if (n.value === null) return null;
    let s = null;
    if (k === "voltage") s = mwVoltageScale(o.nominal || mwVoltageNominal(n.value), o.alpha);
    else if (k === "power") s = mwPowerScale(o.alpha);
    else if (k === "current") s = mwCurrentScale(o.max, o.alpha);
    else if (k === "energy") s = mwEnergyScale(o.max, o.alpha);
    if (!s) return null;
    const i = s.stops.findIndex((stop) => n.value <= stop);
    return s.colors[i === -1 ? s.stops.length : i];
  };
  // <<< mw-electrical-scale v1
  // >>> mw-pressure-scale v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/mw-pressure-scale/mw-pressure-scale.js
  // Escala canônica de pressão atmosférica (hPa ao nível do mar) + tendência.
  // Doc: IA/knowledge/ha-pressao-msl-vs-estacao.md.
  const MW_PRESSURE_ALPHA = 0.5;

  // Limites SUPERIORES inclusivos, em hPa MSL. Seis faixas.
  // Os cortes são os do mostrador de barômetro aneroide clássico, que é o que
  // o morador já sabe ler: abaixo de 1000 chove, perto de 1013 (a atmosfera
  // padrão) é variável, acima de 1020 firma.
  const MW_PRESSURE_STOPS = [980, 1000, 1010, 1020, 1030];
  const MW_PRESSURE_RGB = [
    "106, 27, 154",   // <=980   — tempestade / ciclone
    "40, 90, 180",    // <=1000  — chuva
    "70, 140, 175",   // <=1010  — instável
    "120, 144, 156",  // <=1020  — variável (1013,25 = atmosfera padrão)
    "205, 173, 76",   // <=1030  — firme
    "230, 145, 40",   // >1030   — muito firme, ar seco
  ];
  const MW_PRESSURE_LABELS = [
    "tempestade",
    "chuva",
    "instável",
    "variável",
    "firme",
    "muito firme",
  ];

  // Janela de PLAUSIBILIDADE para pressão MSL: os extremos já observados no
  // planeta (870 hPa no olho do tufão Tip, 1084 hPa em Agata, Sibéria). Fora
  // dela é sensor com defeito ou unidade errada, e o consumidor TEM de tratar
  // `null` como "fora de escala" e avisar — nunca grudar o ponteiro no
  // batente, que é mentir com desenho.
  const MW_PRESSURE_PLAUSIVEL = [870, 1085];

  // ATENÇÃO: a janela acima NÃO pega o erro mais comum desta casa. Pressão de
  // ESTAÇÃO a 1200 m (887,2 hPa, medido em 2026-09-09) cabe dentro dela e
  // pintaria "tempestade" para sempre. Só a altitude denuncia. Fórmula
  // barométrica padrão (ISA), a mesma da conversão inversa.
  const mwPressureEsperadaNaAltitude = (alt) => {
    const h = Number(alt);
    if (!Number.isFinite(h)) return null;
    return 1013.25 * Math.pow(1 - 2.25577e-5 * h, 5.25588);
  };

  // Verdadeiro quando o número cheira a pressão de estação em vez de MSL: a
  // casa está alta o bastante para a diferença importar E o valor está na
  // vizinhança do que a altitude prevê. ±25 hPa cobre a variação real do
  // tempo (a medição de 2026-09-09 deu 887,2 contra 877,2 previstos pela ISA).
  const mwPressureParecePressaoDeEstacao = (hpa, alt, tolerancia) => {
    const v = Number(hpa);
    const h = Number(alt);
    if (!Number.isFinite(v) || !Number.isFinite(h) || h < 200) return false;
    const esperada = mwPressureEsperadaNaAltitude(h);
    return Math.abs(v - esperada) <= (Number.isFinite(Number(tolerancia)) ? Number(tolerancia) : 25);
  };

  // Conversão pela unidade DA ENTIDADE, nunca chutada. hPa e mbar são a mesma
  // coisa; kPa aparece em sensor chinês; inHg em fonte americana; mmHg no
  // mostrador interno do barômetro da foto.
  const MW_PRESSURE_PARA_HPA = {
    hpa: 1, hPa: 1, mbar: 1, mb: 1, millibar: 1,
    kpa: 10, kPa: 10,
    pa: 0.01, Pa: 0.01,
    psi: 68.9476,
    inhg: 33.8639, inHg: 33.8639, "in": 33.8639, '"hg': 33.8639,
    mmhg: 1.33322, mmHg: 1.33322, torr: 1.33322,
  };

  const mwPressureRgba = (triplet, alpha) =>
    `rgba(${triplet}, ${alpha === undefined || alpha === null ? MW_PRESSURE_ALPHA : alpha})`;

  // Vazio/nulo NÃO é zero (a mesma guarda de mw-level-scale, pelo mesmo motivo:
  // Number("") é 0, e 0 hPa pintaria roxo de furacão).
  const mwPressureNum = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const v = Number(value);
    return Number.isFinite(v) ? v : null;
  };

  // Normaliza qualquer unidade para hPa. `unit` vem de
  // attributes.unit_of_measurement — se vier vazia, assume hPa e o consumidor
  // deve dizer que assumiu.
  const mwPressureToHpa = (value, unit) => {
    const v = mwPressureNum(value);
    if (v === null) return null;
    const u = String(unit || "hPa").trim();
    const f = MW_PRESSURE_PARA_HPA[u] ?? MW_PRESSURE_PARA_HPA[u.toLowerCase()];
    return f === undefined ? null : v * f;
  };

  // Barometria: reduz a pressão da estação ao nível do mar. `alt` em metros,
  // `tempC` a temperatura do ar (se faltar, 15 °C da atmosfera padrão — o erro
  // por 10 °C de engano é ~0,4 % da altitude, aceitável e declarado).
  const mwPressureToMsl = (hpaEstacao, alt, tempC) => {
    const p = mwPressureNum(hpaEstacao);
    const h = mwPressureNum(alt);
    if (p === null || h === null) return null;
    const t = mwPressureNum(tempC);
    const tk = (t === null ? 15 : t) + 273.15;
    return p * Math.pow(1 - (0.0065 * h) / (tk + 0.0065 * h), -5.257);
  };

  // Mesma forma de mwClimateScale/mwLevelScale: um caminho de pintura só.
  const mwPressureScale = (alpha) => ({
    stops: MW_PRESSURE_STOPS.slice(),
    colors: MW_PRESSURE_RGB.map((c) => mwPressureRgba(c, alpha)),
    clamp: null,
  });

  // Devolve null fora da janela plausível — de propósito (ver acima).
  const mwPressureIndex = (hpa) => {
    const v = mwPressureNum(hpa);
    if (v === null) return null;
    if (v < MW_PRESSURE_PLAUSIVEL[0] || v > MW_PRESSURE_PLAUSIVEL[1]) return null;
    const i = MW_PRESSURE_STOPS.findIndex((stop) => v <= stop);
    return i === -1 ? MW_PRESSURE_STOPS.length : i;
  };

  const mwPressureColor = (hpa, alpha) => {
    const i = mwPressureIndex(hpa);
    return i === null ? null : mwPressureRgba(MW_PRESSURE_RGB[i], alpha);
  };

  const mwPressureLabel = (hpa) => {
    const i = mwPressureIndex(hpa);
    return i === null ? null : MW_PRESSURE_LABELS[i];
  };

  // --- TENDÊNCIA ---------------------------------------------------------
  // Variação em 3 h, em hPa. O corte de 1,6 hPa/3 h é o do próprio Zambretti
  // (é o que separa "subindo" de "estável"); os degraus mais finos existem
  // para o texto na tela, não para a previsão.
  const MW_PRESSURE_TREND_STOPS = [0.5, 1.6, 3.5];
  const MW_PRESSURE_TREND = {
    estavel:   { label: "estável",           seta: "→", zambretti: "steady" },
    lenta:     { label: "mudando devagar",   seta: null, zambretti: "steady" },
    moderada:  { label: "mudando",           seta: null, zambretti: null },
    rapida:    { label: "mudando rápido",    seta: null, zambretti: null },
  };

  // Devolve {classe, label, seta, delta, zambretti} — `zambretti` é
  // "rising" | "steady" | "falling", já com o corte de 1,6 hPa aplicado.
  const mwPressureTrend = (delta3h) => {
    const d = mwPressureNum(delta3h);
    if (d === null) return null;
    const a = Math.abs(d);
    const subindo = d > 0;
    const classe = a <= MW_PRESSURE_TREND_STOPS[0] ? "estavel"
      : a <= MW_PRESSURE_TREND_STOPS[1] ? "lenta"
      : a <= MW_PRESSURE_TREND_STOPS[2] ? "moderada" : "rapida";
    const base = MW_PRESSURE_TREND[classe];
    const seta = classe === "estavel" ? "→"
      : classe === "rapida" ? (subindo ? "⇈" : "⇊") : (subindo ? "↑" : "↓");
    const label = classe === "estavel" ? "estável"
      : `${base.label} ${subindo ? "para cima" : "para baixo"}`;
    return {
      classe,
      label,
      seta,
      delta: d,
      zambretti: a < 1.6 ? "steady" : (subindo ? "rising" : "falling"),
    };
  };
  // <<< mw-pressure-scale v1
  // >>> mw-level-scale v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/mw-level-scale/mw-level-scale.js
  // Escalas de nível: iluminância (lx) e bateria (%).
  // Doc: IA/knowledge/escala-de-iluminancia.md.
  const MW_LEVEL_ALPHA = 0.5;

  // --- ILUMINÂNCIA -------------------------------------------------------
  // Limites SUPERIORES inclusivos, do mais escuro para o mais claro. Os
  // degraus crescem em razão ~3-4x porque a percepção de luz é logarítmica:
  // a diferença entre 0 e 20 lx muda a vida do morador, a diferença entre
  // 800 e 1200 lx não muda nada. Os números saíram do que os sensores da
  // casa realmente reportam (medição de 2026-09-02: 0, 4, 6, 8, 10, 20, 31,
  // 35 lx; remedição de 2026-09-06 com 15 sensores: p50 = 10, p90 = 96,
  // max = 180) — a vida útil da escala está toda abaixo de 200 lx, e uma
  // escala linear até 1000 pintaria a casa inteira da mesma cor.
  // A cor é azul-noite -> âmbar de sol, e NÃO é a rampa de temperatura de
  // propósito: quem olha a planta térmica e a planta de luz lado a lado não
  // pode confundir as duas.
  const MW_LUX_STOPS = [0.9, 5, 20, 80, 250, 800];
  const MW_LUX_RGB = [
    "10, 14, 30",     // escuro — noite, olho adaptado
    "40, 48, 90",     // penumbra — dá para andar
    "70, 90, 150",    // luz fraca — TV, abajur
    "120, 160, 210",  // luz de ambiente
    "190, 215, 235",  // claro — leitura confortável
    "245, 235, 170",  // muito claro — luz de tarefa
    "255, 214, 90",   // sol entrando
  ];

  // --- BATERIA -----------------------------------------------------------
  // Limites SUPERIORES inclusivos, em %. Ruim -> bom, vermelho -> verde.
  // `canonica`: a régua documentada na página de iluminância, usada pelo
  // mw-ha-state-color-element. Quatro degraus.
  const MW_BAT_CANON_STOPS = [10, 20, 40, 60];
  const MW_BAT_CANON_RGB = [
    "219, 68, 55",   // <=10 % — troque hoje
    "255, 140, 0",   // <=20 % — troque esta semana
    "255, 166, 0",   // <=40 % — de olho
    "154, 205, 50",  // <=60 % — tranquilo
    "67, 160, 71",   // acima — cheia
  ];
  // `fina`: a régua do mw-ha-rainbow-card. Cinco degraus — separa "quase
  // morta" (<=5 %) de "morrendo" (<=20 %) e ainda enxerga o topo da carga
  // (<=80 %), que num arco-íris de 8 dispositivos lado a lado é o que deixa
  // ver qual pilha vai cair primeiro.
  const MW_BAT_FINA_STOPS = [5, 20, 40, 60, 80];
  const MW_BAT_FINA_RGB = [
    "139, 0, 0",     // <=5 %  — quase morta
    "229, 57, 53",   // <=20 % — morrendo
    "255, 152, 0",   // <=40 % — de olho
    "253, 216, 53",  // <=60 % — ainda dá
    "156, 204, 101", // <=80 % — tranquilo
    "67, 160, 71",   // acima  — cheia
  ];

  const MW_LEVEL_ALIAS = {
    lux: "lux", lx: "lux", illuminance: "lux", iluminancia: "lux", luz: "lux",
    battery: "battery", bateria: "battery", bat: "battery",
    battery_fina: "battery_fina", bateria_fina: "battery_fina", fina: "battery_fina",
    battery_canonica: "battery", bateria_canonica: "battery", canonica: "battery",
  };

  const mwLevelRgba = (triplet, alpha) =>
    `rgba(${triplet}, ${alpha === undefined || alpha === null ? MW_LEVEL_ALPHA : alpha})`;

  const MW_LEVEL_TABLES = {
    lux: { stops: MW_LUX_STOPS, rgb: MW_LUX_RGB, clamp: null, unit: "lx", decimals: 0 },
    battery: { stops: MW_BAT_CANON_STOPS, rgb: MW_BAT_CANON_RGB, clamp: [0, 100], unit: "%", decimals: 0 },
    battery_fina: { stops: MW_BAT_FINA_STOPS, rgb: MW_BAT_FINA_RGB, clamp: [0, 100], unit: "%", decimals: 0 },
  };

  const mwLevelKind = (kind) => {
    const k = String(kind || "").toLowerCase().trim();
    return MW_LEVEL_ALIAS[k] || (MW_LEVEL_TABLES[k] ? k : null);
  };

  // Devolve {stops, colors, clamp} — a mesma forma que mwClimateScale, para
  // que o consumidor tenha um caminho de pintura só. Limite SUPERIOR
  // inclusivo: a cor é a da primeira faixa cujo limite não foi ultrapassado.
  const mwLevelScale = (kind, alpha) => {
    const k = mwLevelKind(kind);
    if (!k) return null;
    const t = MW_LEVEL_TABLES[k];
    return {
      stops: t.stops.slice(),
      colors: t.rgb.map((c) => mwLevelRgba(c, alpha)),
      clamp: t.clamp ? t.clamp.slice() : null,
    };
  };

  // Vazio/nulo NÃO é zero. Number("") e Number(null) devolvem 0, e um sensor
  // sem leitura acabaria pintado como 0 lx (o degrau mais escuro) ou 0 % de
  // pilha (o mais vermelho) em vez de cair na cor de "sem leitura" do
  // consumidor. A guarda mora aqui para nenhum consumidor ter de lembrar.
  const mwLevelNum = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const v = Number(value);
    return Number.isFinite(v) ? v : null;
  };

  const mwLevelColor = (kind, value, alpha) => {
    const s = mwLevelScale(kind, alpha);
    if (!s) return null;
    let v = mwLevelNum(value);
    if (v === null) return null;
    if (s.clamp) v = Math.min(Math.max(v, s.clamp[0]), s.clamp[1]);
    const i = s.stops.findIndex((stop) => v <= stop);
    return s.colors[i === -1 ? s.stops.length : i];
  };
  // <<< mw-level-scale v1

  // ───────────────────────────────────────────────────────────── constantes

  const DEFAULTS = {
    entity: "",
    name: "",
    label: "",
    icon: "",
    unit: "",
    min: null,
    max: null,
    orientation: "vertical",
    shape: "cylinder",
    depth: "3d",
    thickness: 46,
    length: 220,
    iso: 18,
    glass: true,
    quality: "auto",
    specular: 0.55,
    fluid_opacity: null,
    fluid_depth: 0.30,
    cap: true,
    base_plate: true,
    ground_shadow: true,
    paper_dark: false,
    paper: "paper",
    fill_style: "liquid",
    segments: 12,
    color_scale: "auto",
    color: "#4f8ef7",
    stop_1: null,
    stop_2: null,
    stop_3: null,
    stop_4: null,
    ticks: "both",
    tick_count: 5,
    tick_labels: true,
    tick_side: "start",
    zones: null,
    zone_labels: false,
    secondary_entity: "",
    secondary_label: "",
    compare_mode: "ghost",
    show_name: true,
    show_value: true,
    value_mode: "value",
    value_position: "in_body",
    show_unit: true,
    show_min_max: false,
    icon_in_fill: true,
    tap_action: null,
    hold_action: null,
    double_tap_action: null,
  };

  const LABELS = {
    entity: "Entidade", name: "Nome", label: "Rótulo pequeno", icon: "Ícone",
    unit: "Unidade (vazio = da entidade)", min: "Mínimo (vazio = automático)",
    max: "Máximo (vazio = automático)",
    orientation: "Orientação", shape: "Forma do corpo", depth: "Relevo",
    thickness: "Espessura", length: "Comprimento", iso: "Profundidade 3D",
    glass: "Vidro (reflexo)", quality: "Nível de realismo",
    specular: "Brilho do vidro", fluid_opacity: "Opacidade do fluido",
    fluid_depth: "Profundidade do fluido", cap: "Tampa no topo", base_plate: "Placa de base",
    ground_shadow: "Sombra no chão",
    paper_dark: "Papel de noite", paper: "Tom de papel",
    fill_style: "Preenchimento", segments: "Nº de segmentos",
    color_scale: "Escala de cor", color: "Cor única",
    stop_1: "Parada 1", stop_2: "Parada 2", stop_3: "Parada 3", stop_4: "Parada 4",
    ticks: "Marcas da régua", tick_count: "Nº de marcas grandes",
    tick_labels: "Números na régua", tick_side: "Lado da régua",
    zones: "Zonas", zone_labels: "Rótulo das zonas",
    secondary_entity: "2ª entidade (comparar)", secondary_label: "Rótulo da 2ª",
    compare_mode: "Modo de comparação",
    show_name: "Mostrar nome", show_value: "Mostrar valor",
    value_mode: "O valor mostra", value_position: "Posição do valor",
    show_unit: "Mostrar unidade", show_min_max: "Mostrar mín/máx",
    icon_in_fill: "Ícone dentro do preenchimento",
    tap_action: "Toque", hold_action: "Toque longo", double_tap_action: "Toque duplo",
  };

  const OPT = {
    orientation: [{ value: "vertical", label: "Vertical" }, { value: "horizontal", label: "Horizontal" }],
    shape: [{ value: "cylinder", label: "Cilíndrico" }, { value: "box", label: "Paralelepípedo" }],
    quality: [
      { value: "auto", label: "Automático (ultra no desktop, alto no celular)" },
      { value: "ultra", label: "Ultra — todas as camadas" },
      { value: "high", label: "Alto — sombra na parede, aresta e fundo" },
      { value: "medium", label: "Médio — brilho, menisco e sombra de chão" },
      { value: "low", label: "Baixo — faces chapadas" },
    ],
    depth: [{ value: "3d", label: "Relevo cheio" }, { value: "soft", label: "Suave" }, { value: "flat", label: "Chapado" }],
    fill_style: [{ value: "liquid", label: "Líquido (contínuo)" }, { value: "segments", label: "Segmentos" }],
    color_scale: [
      { value: "auto", label: "Automática (pela grandeza)" },
      { value: "climate", label: "Clima (°C / UR)" },
      { value: "air", label: "Qualidade do ar (CO₂ / TVOC / HCHO / PM2.5)" },
      { value: "electrical", label: "Elétrica (W / V / A / kWh)" },
      { value: "pressure", label: "Pressão (hPa)" },
      { value: "level", label: "Nível (bateria / luz / sinal)" },
      { value: "custom", label: "Paradas próprias" },
      { value: "single", label: "Cor única" },
    ],
    ticks: [{ value: "none", label: "Sem marcas" }, { value: "major", label: "Só as grandes" },
      { value: "minor", label: "Só as pequenas" }, { value: "both", label: "Grandes e pequenas" }],
    tick_side: [{ value: "start", label: "Antes do tubo" }, { value: "end", label: "Depois do tubo" }],
    value_mode: [{ value: "value", label: "O valor da entidade" }, { value: "percent", label: "A porcentagem do curso" }],
    value_position: [{ value: "in_body", label: "Dentro do corpo" }, { value: "top", label: "Acima do gauge" },
      { value: "bottom", label: "Abaixo do gauge" }, { value: "none", label: "Em lugar nenhum" }],
    compare_mode: [{ value: "ghost", label: "Fantasma no mesmo tubo" }, { value: "marker", label: "Marca na régua" },
      { value: "side", label: "Tubo ao lado" }],
  };

  const TABS = [
    ["dado", "DADO", "mdi:database"],
    ["forma", "FORMA", "mdi:cube-outline"],
    ["papel", "PAPEL", "mdi:palette-swatch"],
    ["cor", "COR", "mdi:gradient-horizontal"],
    ["fluido", "FLUIDO", "mdi:water-opacity"],
    ["regua", "RÉGUA", "mdi:ruler"],
    ["zonas", "ZONAS", "mdi:format-color-fill"],
    ["comparar", "COMPARAR", "mdi:compare-horizontal"],
    ["acoes", "AÇÕES", "mdi:gesture-tap"],
  ];

  // Rampa livre de 5 cores para color_scale: custom — do frio ao quente, sem néon.
  const FREE_RAMP = ["#4f8ef7", "#3fb950", "#e3b341", "#e08c3b", "#e35d5d"];

  // ────────────────────────────────────────────────────────────────── cores

  const hsl2rgb = (h, s, l) => {
    const S = s / 100, L = l / 100;
    const k = (n) => (n + h / 30) % 12;
    const a = S * Math.min(L, 1 - L);
    const f = (n) => Math.round(255 * (L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
    return { r: f(0), g: f(8), b: f(4) };
  };

  // Aceita "#rrggbb", "rgb(...)", "rgba(...)" e "hsl(...)" e devolve {r,g,b,a}.
  const toRGB = (c) => {
    const s = String(c || "").trim();
    let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      const h = m[1].length === 3 ? m[1].replace(/./g, (x) => x + x) : m[1];
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
    }
    m = s.match(/^rgba?\(([^)]+)\)$/i);
    if (m) {
      const p = m[1].split(",").map((x) => parseFloat(x));
      return { r: p[0] | 0, g: p[1] | 0, b: p[2] | 0, a: p.length > 3 && Number.isFinite(p[3]) ? p[3] : 1 };
    }
    m = s.match(/^hsla?\(([^)]+)\)$/i);
    if (m) {
      const p = m[1].split(",").map((x) => parseFloat(x));
      return Object.assign(hsl2rgb(p[0], p[1], p[2]), { a: p.length > 3 && Number.isFinite(p[3]) ? p[3] : 1 });
    }
    return { r: 79, g: 142, b: 247, a: 1 };
  };

  // k > 0 clareia, k < 0 escurece. É o que dá volume ao líquido sem trocar de cor.
  const shade = (c, k, alpha) => {
    const o = toRGB(c);
    const mix = (v) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k));
    const a = alpha == null ? o.a : alpha;
    return "rgba(" + mix(o.r) + "," + mix(o.g) + "," + mix(o.b) + "," + a + ")";
  };

  // Luminância relativa — decide se a cor da escala aguenta ser lida sobre o papel.
  const lum = (c) => { const o = toRGB(c); return (0.2126 * o.r + 0.7152 * o.g + 0.0722 * o.b) / 255; };

  // O valor é escrito NO papel: amarelo de 24 °C sobre creme não se lê. A cor
  // continua sendo a da escala, só cede luminosidade até virar legível.
  const inkOf = (base, darkPaper) => {
    const L = lum(base);
    if (darkPaper) return L < 0.32 ? shade(base, 0.60) : base;
    return L > 0.58 ? shade(base, -0.48) : base;
  };

  // A grandeza, quando o dono não disse qual é.
  const guessKind = (unit, dc, id) => {
    const u = String(unit || "").toLowerCase();
    const d = String(dc || "").toLowerCase();
    const e = String(id || "").toLowerCase();
    if (d === "temperature" || u === "°c" || u === "°f") return ["climate", "temp"];
    if (d === "humidity" || (u === "%" && /umid|humid/.test(e))) return ["climate", "hum"];
    if (d === "carbon_dioxide" || u === "ppm") return ["air", "co2"];
    if (d === "volatile_organic_compounds" || /tvoc|voc/.test(e)) return ["air", "tvoc"];
    if (/hcho|formaldei/.test(e)) return ["air", "hcho"];
    if (d === "pm25" || /pm2/.test(e)) return ["air", "pm25"];
    if (d === "pressure" || d === "atmospheric_pressure" || /hpa|mbar|inhg/.test(u)) return ["pressure", "pressure"];
    if (d === "power" || u === "w" || u === "kw") return ["electrical", "power"];
    if (d === "voltage" || u === "v") return ["electrical", "voltage"];
    if (d === "current" || u === "a" || u === "ma") return ["electrical", "current"];
    if (d === "energy" || u === "kwh" || u === "wh") return ["electrical", "energy"];
    if (d === "battery") return ["level", "battery"];
    if (d === "illuminance" || u === "lx") return ["level", "illuminance"];
    if (d === "signal_strength" || u === "dbm") return ["level", "signal"];
    return [null, null];
  };

  // Curso natural da grandeza, para quem não declarou min/max.
  const AUTO_RANGE = {
    temp: [0, 45], hum: [0, 100], co2: [400, 2000], tvoc: [0, 1000], hcho: [0, 0.3],
    pm25: [0, 150], pressure: [980, 1040], power: [0, 3000], voltage: [100, 140],
    current: [0, 16], energy: [0, 10], battery: [0, 100], illuminance: [0, 1000], signal: [-90, -30],
  };

  // A cor do líquido. Sempre uma cor só — o volume vem do gradiente derivado dela.
  const fillColor = (c, value, kind, unit, frac) => {
    const scale = c.color_scale === "auto" ? (kind[0] || "custom") : c.color_scale;
    let out = null;
    if (scale === "single") return c.color;
    if (scale === "climate") out = mwClimateColor(kind[1] === "hum" ? "hum" : "temp", value, 1);
    else if (scale === "air") out = mwAirColor(kind[1] || "co2", value, 1);
    else if (scale === "electrical") out = mwElectricalColor(kind[1] || "power", value, unit, { alpha: 1 });
    else if (scale === "pressure") out = mwPressureColor(value, 1);
    else if (scale === "level") out = mwLevelColor(kind[1] || "battery", value, 1);
    else if (scale === "custom") {
      const st = [c.stop_1, c.stop_2, c.stop_3, c.stop_4].filter((x) => Number.isFinite(Number(x))).map(Number);
      if (st.length) {
        let i = st.findIndex((s) => Number(value) <= s);
        if (i === -1) i = st.length;
        out = FREE_RAMP[Math.min(i, FREE_RAMP.length - 1)];
      } else {
        out = FREE_RAMP[Math.min(FREE_RAMP.length - 1, Math.max(0, Math.round(frac * (FREE_RAMP.length - 1))))];
      }
    }
    return out || c.color;
  };

  // ──────────────────────────────────────────────────────────── geometria

  // As duas cores do papel, em HSL — o bloco canônico devolve gradiente CSS,
  // e dentro do SVG precisamos das paradas separadas.
  const paperColors = (key, dark) => {
    const HUES = dark ? PAPER_DARK_HUES : PAPER_HUES;
    const TONES = dark ? PAPER_DARK_TONES : PAPER_TONES;
    const fb = dark ? ["#2b2825", "#161411"] : ["#fdfaf3", "#e8e3d8"];
    if (!key || key === "paper" || key === "none") return fb;
    const m = String(key).split("-");
    const hue = HUES.find((h) => h[0] === m[0]);
    const t = TONES[(parseInt(m[1], 10) || 1) - 1];
    if (!hue || !t) return fb;
    const rgb = (h, sa, li) => { const o = hsl2rgb(h, sa, li); return "rgb(" + o.r + "," + o.g + "," + o.b + ")"; };
    return [rgb(hue[2], t[1], t[0]), rgb(hue[2], t[1] + 4, t[0] - 7)];
  };

  const pts = (a) => a.map((p) => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" ");

  // Prisma isométrico. Serve deitado e em pé: quem escolhe é quem passa w e h.
  const boxParts = (x0, yBase, w, h, dx, dy) => {
    const yTop = yBase - h, x1 = x0 + w;
    return {
      front: pts([[x0, yBase], [x0, yTop], [x1, yTop], [x1, yBase]]),
      top: pts([[x0, yTop], [x0 + dx, yTop - dy], [x1 + dx, yTop - dy], [x1, yTop]]),
      side: pts([[x1, yTop], [x1 + dx, yTop - dy], [x1 + dx, yBase - dy], [x1, yBase]]),
      sil: pts([[x0, yBase], [x0, yTop], [x0 + dx, yTop - dy], [x1 + dx, yTop - dy],
        [x1 + dx, yBase - dy], [x1, yBase]]),
    };
  };

  // Cilindro. A profundidade vira raio de elipse, não deslocamento isométrico:
  // é assim que um tubo de vidro se apresenta visto quase de frente.
  const cylParts = (x0, yBase, w, h, r, vertical) => {
    const n = (v) => v.toFixed(2);
    if (vertical) {
      const yTop = yBase - h, x1 = x0 + w, rx = w / 2;
      return {
        sil: "M" + n(x0) + " " + n(yBase) + "L" + n(x0) + " " + n(yTop) +
          "A" + n(rx) + " " + n(r) + " 0 0 1 " + n(x1) + " " + n(yTop) +
          "L" + n(x1) + " " + n(yBase) +
          "A" + n(rx) + " " + n(r) + " 0 0 1 " + n(x0) + " " + n(yBase) + "Z",
        body: { x: x0, y: yTop, w: w, h: h },
        capE: { cx: x0 + rx, cy: yTop, rx: rx, ry: r },
        footE: { cx: x0 + rx, cy: yBase, rx: rx, ry: r },
      };
    }
    const yTop = yBase - h, x1 = x0 + w, ry = h / 2, cy = yTop + ry;
    return {
      sil: "M" + n(x0) + " " + n(yTop) + "L" + n(x1) + " " + n(yTop) +
        "A" + n(r) + " " + n(ry) + " 0 0 1 " + n(x1) + " " + n(yBase) +
        "L" + n(x0) + " " + n(yBase) +
        "A" + n(r) + " " + n(ry) + " 0 0 1 " + n(x0) + " " + n(yTop) + "Z",
      body: { x: x0, y: yTop, w: w, h: h },
      capE: { cx: x1, cy: cy, rx: r, ry: ry },
      footE: { cx: x0, cy: cy, rx: r, ry: ry },
    };
  };

  // Tudo o que o desenho precisa saber, calculado uma vez por forma.
  const geometry = (c) => {
    const vert = c.orientation !== "horizontal";
    const box = c.shape === "box";
    const T = Math.max(18, Number(c.thickness) || 46);
    const L = Math.max(60, Number(c.length) || 220);
    const iso = Math.max(0, Number(c.iso) || 0);
    const dx = box ? iso * 0.72 : 0;
    const dy = box ? iso * 0.5 : iso * 0.42;
    const capH = c.cap ? Math.max(10, T * 0.26) : 0;
    const run = Math.max(10, L - capH);
    const hasTicks = c.ticks !== "none";
    const gutTick = hasTicks ? (c.tick_labels ? 40 : 15) : 0;
    const gutZone = (c.zones && c.zones.length) ? (c.zone_labels ? 44 : 13) : 0;
    // "start" = à esquerda no vertical, embaixo no horizontal (onde o olho procura).
    const side = vert ? (c.tick_side === "end") : (c.tick_side !== "end");
    const twin = c.secondary_entity && c.compare_mode === "side";
    const pad = 8;

    // Espaço transversal: régua de um lado, zonas do outro (ou trocados).
    const preT = (side ? gutZone : gutTick);
    const postT = (side ? gutTick : gutZone);
    const tubeSpan = T + dx + (twin ? T + 10 : 0);
    const plate = c.base_plate ? 11 : 0;
    const shadow = c.ground_shadow ? 9 : 0;

    let W, H, x0, yBase;
    if (vert) {
      W = pad + preT + tubeSpan + postT + pad;
      H = pad + dy + L + plate + shadow + pad;
      x0 = pad + preT;
      yBase = pad + dy + L;
    } else {
      W = pad + L + dx + pad + 4;
      H = pad + dy + preT + T + postT + plate + shadow + pad;
      x0 = pad;
      yBase = pad + dy + preT + T;
    }
    const w = vert ? T : L;
    const h = vert ? L : T;
    return { vert, box, T, L, iso, dx, dy, capH, run, W, H, x0, yBase, w, h,
      pad, preT, postT, gutTick, gutZone, side, twin, plate, shadow,
      parts: box ? boxParts(x0, yBase, w, h, dx, dy) : cylParts(x0, yBase, w, h, dy, vert) };
  };

  // ────────────────────────────────────────────────────────────── desenho

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const n2 = (v) => (Math.round(v * 100) / 100).toString();

  const fmtNum = (v, unit) => {
    if (!Number.isFinite(v)) return "—";
    const a = Math.abs(v);
    const d = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 1 : 2;
    return v.toFixed(d).replace(/\.0+$/, "").replace(".", ",") + (unit ? " " + unit : "");
  };

  // ── níveis de realismo ──────────────────────────────────────────────────
  // Nenhum tier usa <filter>: filtro rasteriza a subárvore a cada repaint e é o
  // que derruba a rolagem no celular. Todo o realismo sai de gradiente, que a
  // GPU compila uma vez. Por isso o preço de um tier é número de nós parados.
  const QLV = { low: 0, medium: 1, high: 2, ultra: 3 };

  const autoQuality = () => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "medium";
      if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 500) return "high";
    } catch (_) { /* fora do navegador */ }
    return "ultra";
  };

  const qOf = (c) => {
    const q = !c.quality || c.quality === "auto" ? autoQuality() : c.quality;
    return QLV[q] === undefined ? 2 : QLV[q];
  };

  // ── defs: um bloco só, compartilhado pelos dois tubos ───────────────────
  const defsFor = (c, g, uid, q) => {
    const vert = g.vert;
    // transversal ao eixo (dá volume ao corpo e ao fluido)
    const T1 = vert ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"';
    // ao longo do eixo, da superfície do fluido para a base
    const AX = vert ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="1" y1="0" x2="0" y2="0"';
    // da parede longe do fluido até encostar nele
    const WL = vert ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="1" y1="0" x2="0" y2="0"';
    const lin = (id, dir, stops) =>
      '<linearGradient id="' + uid + "-" + id + '" ' + dir + ">" + stops + "</linearGradient>";
    const st = (off, col, cls, i) => '<stop ' + (cls ? 'class="' + cls + '" data-i="' + i + '" ' : "") +
      'offset="' + off + '" stop-color="' + col + '"/>';

    let d = "";

    // corpo em papel: a luz entra pela esquerda/topo e morre na borda oposta
    d += lin("body", T1,
      st(0, "var(--g3d-b0)") + st("0.34", "var(--g3d-b1)") + st("0.72", "var(--g3d-b2)") +
      st(1, "var(--g3d-b3)"));
    d += lin("side", vert ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="1" y1="0" x2="0" y2="0"',
      st(0, "var(--g3d-s0c)") + st(1, "var(--g3d-s1c)"));

    // verniz de BORDAS: escuro nas margens, transparente no meio — é o que
    // dá vidro sem lavar a cor do fluido (o erro da v0.1).
    if (q >= 1) {
      d += lin("varnish", T1,
        st(0, "var(--g3d-v-edge)") + st("0.10", "var(--g3d-v-mid)") +
        st("0.24", "transparent") + st("0.76", "transparent") +
        st("0.90", "var(--g3d-v-mid)") + st(1, "var(--g3d-v-edge2)"));
      d += lin("spec", T1,
        st(0, "transparent") + st("0.45", "var(--g3d-spec)") + st(1, "transparent"));
    }

    // fluido: transversal (volume) × eixo (profundidade)
    for (let i = 0; i < (g.twin ? 2 : 1); i++) {
      d += lin("f" + i, T1,
        st(0, "#000", "g3d-s0", i) + st("0.34", "#000", "g3d-s1", i) + st(1, "#000", "g3d-s2", i));
      if (q >= 2) {
        d += '<radialGradient id="' + uid + "-men" + i + '" cx="0.40" cy="0.34" r="0.78">' +
          st(0, "#000", "g3d-m0", i) + st(1, "#000", "g3d-m1", i) + "</radialGradient>";
      }
    }
    if (q >= 2) {
      d += lin("ax", AX, st(0, "rgba(0,0,0,0)") + st("0.55", "var(--g3d-ax-mid)") +
        st(1, "var(--g3d-ax-end)"));
      d += lin("wall", WL, st(0, "rgba(0,0,0,0)") + st("0.62", "var(--g3d-wall-mid)") +
        st(1, "var(--g3d-wall-end)"));
    }

    // chão: difusa deslocada + contato duro sob a base
    if (q >= 1) {
      d += '<radialGradient id="' + uid + '-ground" cx="0.44" cy="0.5" r="0.5">' +
        st(0, "rgba(0,0,0,0.38)") + st("0.50", "rgba(0,0,0,0.16)") + st(1, "rgba(0,0,0,0)") +
        "</radialGradient>";
    }
    if (q >= 2) {
      d += '<radialGradient id="' + uid + '-contact" cx="0.5" cy="0.5" r="0.5">' +
        st(0, "rgba(0,0,0,0.36)") + st("0.6", "rgba(0,0,0,0.10)") + st(1, "rgba(0,0,0,0)") +
        "</radialGradient>";
    }
    if (q >= 3) {
      d += '<radialGradient id="' + uid + '-caustic" cx="0.5" cy="0.5" r="0.5">' +
        st(0, "var(--g3d-caustic)") + st(1, "transparent") + "</radialGradient>";
    }

    // recorte do tubo: um só, os dois tubos compartilham
    d += '<clipPath id="' + uid + '-clip">' +
      (g.box ? '<polygon points="' + g.parts.sil + '"/>' : '<path d="' + g.parts.sil + '"/>') +
      "</clipPath>";

    if (c.fill_style === "segments") {
      const nseg = Math.max(3, Math.min(40, Number(c.segments) || 12));
      const step = g.run / nseg;
      let bars = "";
      for (let i = 1; i < nseg; i++) {
        const u = i * step;
        bars += vert
          ? '<rect x="' + n2(g.x0 - 4) + '" y="' + n2(g.yBase - u - 1) + '" width="' +
            n2(g.T + g.dx + 8) + '" height="2.2" fill="#000"/>'
          : '<rect x="' + n2(g.x0 + u - 1) + '" y="' + n2(g.yBase - g.T - g.dy - 4) +
            '" width="2.2" height="' + n2(g.T + g.dy + 8) + '" fill="#000"/>';
      }
      d += '<mask id="' + uid + '-seg"><rect x="0" y="0" width="' + n2(g.W) + '" height="' +
        n2(g.H) + '" fill="#fff"/>' + bars + "</mask>";
    }
    return "<defs>" + d + "</defs>";
  };

  // ── um tubo: corpo, fluido e verniz, nesta ordem ────────────────────────
  const tubeMarkup = (c, g, uid, i, ox, oy, q) => {
    const p = g.parts;
    const fw = g.vert ? g.w : g.run;
    const fh = g.vert ? g.run : g.h;
    const fp = g.box ? boxParts(g.x0, g.yBase, fw, fh, g.dx, g.dy)
      : cylParts(g.x0, g.yBase, fw, fh, g.dy, g.vert);
    const poly = (pts2, f, extra) => '<polygon points="' + pts2 + '" fill="' + f + '"' +
      (extra || "") + "/>";
    const ell = (o, f, extra) => '<ellipse cx="' + n2(o.cx) + '" cy="' + n2(o.cy) + '" rx="' +
      n2(o.rx) + '" ry="' + n2(o.ry) + '" fill="' + f + '"' + (extra || "") + "/>";
    const rct = (o, f, extra) => '<rect x="' + n2(o.x) + '" y="' + n2(o.y) + '" width="' +
      n2(o.w) + '" height="' + n2(o.h) + '" fill="' + f + '"' + (extra || "") + "/>";

    // ── corpo (papel) ────────────────────────────────────────────────────
    let body;
    if (g.box) {
      body = poly(p.side, "url(#" + uid + "-side)") +
        poly(p.top, "var(--g3d-p-top)") +
        poly(p.front, "url(#" + uid + "-body)");
    } else {
      body = ell(p.footE, "var(--g3d-p-side)") + rct(p.body, "url(#" + uid + "-body)");
    }

    // ── fluido ───────────────────────────────────────────────────────────
    // A sombra que o fluido projeta na parede mora DENTRO do grupo que
    // translada: acompanha o nível sozinha, sem cálculo por quadro.
    const wallH = Math.max(22, g.T * 0.95);
    let wall = "";
    if (q >= 2) {
      wall = g.vert
        ? '<rect x="' + n2(g.x0 - g.dx - 2) + '" y="' + n2(g.yBase - fh - wallH) + '" width="' +
          n2(g.T + g.dx * 2 + 4) + '" height="' + n2(wallH) + '" fill="url(#' + uid + '-wall)"/>'
        : '<rect x="' + n2(g.x0 + fw) + '" y="' + n2(g.yBase - g.T - g.dy - 2) + '" width="' +
          n2(wallH) + '" height="' + n2(g.T + g.dy * 2 + 4) + '" fill="url(#' + uid + '-wall)"/>';
    }

    const axis = q >= 2 ? "url(#" + uid + "-ax)" : null;
    let fluid;
    if (g.box) {
      fluid = poly(fp.side, "var(--g3d-f-side" + i + ")") +
        poly(fp.top, "var(--g3d-f-top" + i + ")") +
        poly(fp.front, "url(#" + uid + "-f" + i + ")") +
        (axis ? poly(fp.front, axis) : "");
      // aresta de luz na quina frontal/topo — é o corte de vidro da referência
      if (q >= 2) {
        const yT = g.vert ? g.yBase - fh : g.yBase - g.h;
        const xR = g.vert ? g.x0 + fw : g.x0 + fw;
        fluid += g.vert
          ? '<line class="g3d-rim" data-i="' + i + '" x1="' + n2(g.x0) + '" y1="' + n2(yT) +
            '" x2="' + n2(xR) + '" y2="' + n2(yT) + '"/>'
          : '<line class="g3d-rim" data-i="' + i + '" x1="' + n2(xR) + '" y1="' + n2(yT) +
            '" x2="' + n2(xR) + '" y2="' + n2(g.yBase) + '"/>';
      }
    } else {
      fluid = ell(fp.footE, "var(--g3d-f-side" + i + ")") +
        rct(fp.body, "url(#" + uid + "-f" + i + ")") +
        (axis ? rct(fp.body, axis) : "") +
        ell(fp.capE, "var(--g3d-f-top" + i + ")");
      // menisco: anel de borda mais escuro, centro iluminado
      if (q >= 1) {
        fluid += ell({ cx: fp.capE.cx, cy: fp.capE.cy, rx: fp.capE.rx * 0.80, ry: fp.capE.ry * 0.80 },
          q >= 2 ? "url(#" + uid + "-men" + i + ")" : "var(--g3d-f-meniscus" + i + ")");
      }
    }

    const seg = c.fill_style === "segments" ? ' mask="url(#' + uid + '-seg)"' : "";
    // Number(null) é 0: sem este cuidado o fluido nasce invisível.
    const op = c.fluid_opacity == null || c.fluid_opacity === "" ? NaN : Number(c.fluid_opacity);
    const fop = Number.isFinite(op) ? op : (g.box ? 1 : 0.94);
    const ghost = c.secondary_entity && c.compare_mode === "ghost"
      ? '<g class="g3d-ghost" data-i="' + i + '">' +
        (g.box ? poly(fp.front, "var(--g3d-ghost)") + poly(fp.top, "var(--g3d-ghost)")
          : rct(fp.body, "var(--g3d-ghost)") + ell(fp.capE, "var(--g3d-ghost)")) + "</g>"
      : "";

    // o fundo do tubo visto através do fluido (cilindro, high+)
    const floor = (!g.box && q >= 2)
      ? ell(p.footE, "var(--g3d-f-floor" + i + ")", ' opacity="0.55"')
      : "";

    // ── verniz e brilho: passam POR CIMA do fluido, sem lavar o centro ────
    let varnish = "";
    if (q >= 1 && c.glass !== false) {
      varnish = g.box
        ? poly(p.front, "url(#" + uid + "-varnish)")
        : rct(p.body, "url(#" + uid + "-varnish)");
      const sw = Math.max(3, g.T * 0.12);
      varnish += g.vert
        ? '<rect x="' + n2(g.x0 + g.T * 0.17) + '" y="' + n2(g.yBase - g.L + 5) + '" width="' +
          n2(sw) + '" height="' + n2(g.L - 10) + '" rx="' + n2(sw / 2) + '" fill="url(#' +
          uid + '-spec)"/>'
        : '<rect x="' + n2(g.x0 + 5) + '" y="' + n2(g.yBase - g.T + g.T * 0.17) + '" width="' +
          n2(g.L - 10) + '" height="' + n2(sw) + '" rx="' + n2(sw / 2) + '" fill="url(#' +
          uid + '-spec)"/>';
      // segundo brilho, fino, do lado oposto — o vidro da referência tem dois
      if (q >= 3) {
        const sw2 = Math.max(1.6, g.T * 0.05);
        varnish += g.vert
          ? '<rect x="' + n2(g.x0 + g.T * 0.80) + '" y="' + n2(g.yBase - g.L + 10) + '" width="' +
            n2(sw2) + '" height="' + n2(g.L - 20) + '" rx="' + n2(sw2 / 2) +
            '" fill="var(--g3d-spec2)"/>'
          : '<rect x="' + n2(g.x0 + 10) + '" y="' + n2(g.yBase - g.T + g.T * 0.80) + '" width="' +
            n2(g.L - 20) + '" height="' + n2(sw2) + '" rx="' + n2(sw2 / 2) +
            '" fill="var(--g3d-spec2)"/>';
      }
    }
    const outline = g.box
      ? '<polygon points="' + p.sil + '" fill="none" stroke="var(--g3d-edge)" stroke-width="1"/>'
      : '<path d="' + p.sil + '" fill="none" stroke="var(--g3d-edge)" stroke-width="1"/>' +
        '<ellipse cx="' + n2(p.capE.cx) + '" cy="' + n2(p.capE.cy) + '" rx="' + n2(p.capE.rx) +
        '" ry="' + n2(p.capE.ry) + '" fill="var(--g3d-p-mouth)" stroke="var(--g3d-edge)" stroke-width="1"/>';

    // ── tampa ────────────────────────────────────────────────────────────
    let cap = "";
    if (c.cap && g.capH > 0) {
      const ch = g.capH + (g.box ? 0 : g.dy);
      if (g.box) {
        const cp = boxParts(g.x0 - 1.5, g.yBase - g.h + (g.vert ? ch : 0), g.vert ? g.w + 3 : ch,
          g.vert ? ch : g.h + 3, g.dx, g.dy);
        cap = poly(cp.side, "var(--g3d-cap-side)") + poly(cp.top, "var(--g3d-cap-top)") +
          poly(cp.front, "var(--g3d-cap)");
      } else {
        const cx0 = g.vert ? g.x0 - 1.5 : g.x0 + g.w - ch;
        const cyB = g.vert ? g.yBase - g.h + ch : g.yBase;
        const cp = cylParts(cx0, cyB, g.vert ? g.w + 3 : ch, g.vert ? ch : g.h + 3, g.dy, g.vert);
        cap = '<path d="' + cp.sil + '" fill="var(--g3d-cap)"/>' +
          ell(cp.capE, "var(--g3d-cap-top)");
      }
      // a tampa projeta sombra no tubo
      if (q >= 3) {
        cap += g.vert
          ? '<rect x="' + n2(g.x0) + '" y="' + n2(g.yBase - g.h + g.capH) + '" width="' + n2(g.T) +
            '" height="4" fill="url(#' + uid + '-wall)" opacity="0.62"/>'
          : '<rect x="' + n2(g.x0 + g.w - g.capH - 7) + '" y="' + n2(g.yBase - g.T) +
            '" width="4" height="' + n2(g.T) + '" fill="url(#' + uid + '-wall)" opacity="0.62"/>';
      }
    }

    return '<g class="g3d-tube" transform="translate(' + n2(ox) + "," + n2(oy) + ')">' +
      body +
      '<g clip-path="url(#' + uid + '-clip)"' + seg + ">" + floor + ghost +
      '<g class="g3d-fill" data-i="' + i + '" opacity="' + n2(fop) + '">' + wall + fluid +
      "</g></g>" +
      '<g class="g3d-glass">' + varnish + outline + "</g>" + cap + "</g>";
  };

  // A cena inteira: chão, pedestal, um ou dois tubos, régua, zonas e o valor.
  const svgFor = (c, g, uid, rng) => {
    const q = qOf(c);
    const parts = [];
    const cx = g.vert ? g.x0 + (g.T + g.dx) / 2 : g.x0 + (g.L + g.dx) / 2;
    const cyTube = g.yBase - g.T / 2;
    const twinOff = g.twin && g.vert ? g.T + 10 : 0;
    const twinOffY = g.twin && !g.vert ? g.T + 10 : 0;
    const spanW = g.vert ? g.T + g.dx + twinOff : g.L + g.dx;

    parts.push(defsFor(c, g, uid, q));

    // chão: difusa deslocada, mais o contato duro sob a base
    if (c.ground_shadow && q >= 1) {
      parts.push('<ellipse cx="' + n2(cx + spanW * 0.06) + '" cy="' + n2(g.yBase + g.plate + 4) +
        '" rx="' + n2(spanW * 0.66) + '" ry="5.8" fill="url(#' + uid + '-ground)"/>');
      if (q >= 2) {
        parts.push('<ellipse cx="' + n2(cx) + '" cy="' + n2(g.yBase + g.plate + 1.5) + '" rx="' +
          n2(spanW * 0.46) + '" ry="2.6" fill="url(#' + uid + '-contact)"/>');
      }
    }
    // cáustica: a luz que atravessa o fluido e pousa no chão
    if (c.ground_shadow && q >= 3) {
      parts.push('<ellipse class="g3d-caustic" cx="' + n2(cx) + '" cy="' +
        n2(g.yBase + g.plate + 3) + '" rx="' + n2(spanW * 0.34) + '" ry="3.4" fill="url(#' +
        uid + '-caustic)"/>');
    }

    // pedestal: prisma de 3 faces no high+, faixa chapada abaixo disso
    if (c.base_plate) {
      const pw = (g.vert ? g.T + 16 + twinOff : g.L + 8);
      const px = g.vert ? g.x0 - 8 : g.x0 - 4;
      if (q >= 2) {
        const pp = boxParts(px, g.yBase + g.plate - 1, pw, g.plate - 2, g.dx * 0.8, g.dy * 0.8);
        parts.push('<polygon points="' + pp.side + '" fill="var(--g3d-plate-side)"/>' +
          '<polygon points="' + pp.top + '" fill="var(--g3d-plate-top)"/>' +
          '<polygon points="' + pp.front + '" fill="var(--g3d-plate)"/>');
      } else {
        parts.push('<rect x="' + n2(px) + '" y="' + n2(g.yBase + 1) + '" width="' + n2(pw) +
          '" height="' + n2(g.plate - 2) + '" rx="2.5" fill="var(--g3d-plate)"/>');
      }
    }

    parts.push(tubeMarkup(c, g, uid, 0, 0, 0, q));
    if (g.twin) parts.push(tubeMarkup(c, g, uid, 1, twinOff, twinOffY, q));

    // zonas: uma fita fina colada ao tubo, do lado oposto à régua
    if (c.zones && c.zones.length && rng) {
      const zw = 9;
      const zPos = g.vert
        ? (g.side ? g.x0 - 4 - zw : g.x0 + g.T + g.dx + 4)
        : (g.side ? g.yBase - g.T - g.dy - 4 - zw : g.yBase + 4);
      let z = "";
      c.zones.forEach((zone) => {
        const a = Math.max(0, Math.min(1, (Number(zone.from) - rng[0]) / (rng[1] - rng[0])));
        const b = Math.max(0, Math.min(1, (Number(zone.to) - rng[0]) / (rng[1] - rng[0])));
        const u0 = Math.min(a, b) * g.run, u1 = Math.max(a, b) * g.run;
        if (u1 - u0 < 0.5) return;
        const col = zone.color || "var(--g3d-edge)";
        z += g.vert
          ? '<rect x="' + n2(zPos) + '" y="' + n2(g.yBase - u1) + '" width="' + zw + '" height="' +
            n2(u1 - u0) + '" rx="2" fill="' + esc(col) + '"/>'
          : '<rect x="' + n2(g.x0 + u0) + '" y="' + n2(zPos) + '" width="' + n2(u1 - u0) +
            '" height="' + zw + '" rx="2" fill="' + esc(col) + '"/>';
        if (c.zone_labels && zone.label) {
          const um = (u0 + u1) / 2;
          z += g.vert
            ? '<text class="g3d-zl" x="' + n2(zPos + (g.side ? -4 : zw + 4)) + '" y="' +
              n2(g.yBase - um + 3) + '" text-anchor="' + (g.side ? "end" : "start") + '">' +
              esc(zone.label) + "</text>"
            : '<text class="g3d-zl" x="' + n2(g.x0 + um) + '" y="' +
              n2(zPos + (g.side ? -4 : zw + 11)) + '" text-anchor="middle">' + esc(zone.label) + "</text>";
        }
      });
      parts.push(z);
    }

    // régua
    if (c.ticks !== "none" && rng) {
      const maj = Math.max(2, Math.min(12, Number(c.tick_count) || 5));
      const wantMaj = c.ticks === "major" || c.ticks === "both";
      const wantMin = c.ticks === "minor" || c.ticks === "both";
      const anchor = g.vert
        ? (g.side ? g.x0 + g.T + g.dx + 3 : g.x0 - 3)
        : (g.side ? g.yBase + 3 : g.yBase - g.T - g.dy - 3);
      const dir = g.side ? 1 : -1;
      let t = "";
      const tick = (u, len, cls) => {
        if (g.vert) {
          const y = g.yBase - u;
          t += '<line class="' + cls + '" x1="' + n2(anchor) + '" y1="' + n2(y) + '" x2="' +
            n2(anchor + dir * len) + '" y2="' + n2(y) + '"/>';
        } else {
          const x = g.x0 + u;
          t += '<line class="' + cls + '" x1="' + n2(x) + '" y1="' + n2(anchor) + '" x2="' + n2(x) +
            '" y2="' + n2(anchor + dir * len) + '"/>';
        }
      };
      const steps = maj - 1;
      for (let i = 0; i <= steps; i++) {
        const u = (i / steps) * g.run;
        if (wantMaj) tick(u, 9, "g3d-tk");
        if (wantMin && i < steps) {
          for (let k = 1; k < 4; k++) tick(u + (k / 4) * (g.run / steps), 4.5, "g3d-tkm");
        }
        if (c.tick_labels && wantMaj) {
          const val = rng[0] + (rng[1] - rng[0]) * (i / steps);
          const lx = g.vert ? anchor + dir * 13 : g.x0 + u;
          const ly = g.vert ? g.yBase - u + 3.4 : anchor + dir * 13 + (g.side ? 8 : 0);
          t += '<text class="g3d-tl" x="' + n2(lx) + '" y="' + n2(ly) + '" text-anchor="' +
            (g.vert ? (g.side ? "start" : "end") : "middle") + '">' + esc(fmtNum(val, "")) + "</text>";
        }
      }
      parts.push(t);
    }

    // marca do comparativo na régua
    if (c.secondary_entity && c.compare_mode === "marker") {
      const a = g.vert ? g.x0 - 2 : g.yBase + 2;
      parts.push('<g class="g3d-mark">' + (g.vert
        ? '<polygon points="' + pts([[a - 9, -5], [a - 9, 5], [a, 0]]) + '"/>'
        : '<polygon points="' + pts([[-5, a + 9], [5, a + 9], [0, a]]) + '"/>') + "</g>");
    }

    // o valor, escrito no corpo claro do tubo — como nas duas referências
    if (c.show_value && c.value_position === "in_body") {
      const fs = Math.max(11, g.T * (g.vert ? 0.40 : 0.36));
      if (g.vert) {
        const hasLabel = !!c.label;
        parts.push('<text class="g3d-val" x="' + n2(g.x0 + g.T / 2) + '" y="' +
          n2(g.yBase - (hasLabel ? 24 : 12)) + '" text-anchor="middle" style="font-size:' +
          n2(fs) + 'px"></text>');
        if (hasLabel) {
          parts.push('<text class="g3d-lbl" x="' + n2(g.x0 + g.T / 2) + '" y="' + n2(g.yBase - 10) +
            '" text-anchor="middle">' + esc(c.label) + "</text>");
        }
      } else {
        parts.push('<text class="g3d-val" x="' + n2(g.x0 + g.L - 8) + '" y="' +
          n2(cyTube + fs * 0.35) + '" text-anchor="end" style="font-size:' + n2(fs) + 'px"></text>');
      }
    }

    if (c.icon_in_fill && c.icon) {
      const s2 = Math.max(14, Math.round(g.T * 0.42));
      parts.push('<g class="g3d-ico"><foreignObject x="' + n2(-s2 / 2) + '" y="' + n2(-s2 / 2) +
        '" width="' + s2 + '" height="' + s2 + '" style="overflow:visible">' +
        '<ha-icon icon="' + esc(c.icon) + '"></ha-icon></foreignObject></g>');
    }

    return '<svg class="g3d-svg" data-q="' + (["low", "medium", "high", "ultra"][q]) +
      '" viewBox="0 0 ' + n2(g.W) + " " + n2(g.H) +
      '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img">' +
      parts.join("") + "</svg>";
  };

  // ───────────────────────────────────────────────────────────────── folha

  const CSS = `
:host{display:block}
.root{position:relative;box-sizing:border-box;border-radius:var(--g3d-radius,14px);
  padding:12px 12px 10px;background:var(--g3d-paper);color:var(--g3d-ink);
  box-shadow:var(--g3d-relief);container-type:inline-size;overflow:hidden}
.root.flat{box-shadow:none;border:1px solid var(--g3d-edge)}
.hdr{display:flex;align-items:center;gap:7px;margin:0 0 6px;min-height:20px}
.hdr ha-icon{--mdc-icon-size:19px;color:var(--g3d-accent);flex:0 0 auto}
.nm{font-size:13px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;
  color:var(--g3d-ink);opacity:.82;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stage{position:relative;width:100%;margin:0 auto}
.g3d-svg{display:block;width:100%;height:100%;overflow:visible}
.g3d-ico{transition:transform .55s cubic-bezier(.4,0,.2,1),opacity .3s;
  opacity:var(--fi-op,1);pointer-events:none}
.g3d-ico ha-icon{display:block;--mdc-icon-size:var(--fi-size,22px);
  color:var(--g3d-fico,rgba(255,255,255,.92));filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}
.g3d-fill{transition:transform .55s cubic-bezier(.4,0,.2,1)}
.g3d-ghost{transition:transform .55s cubic-bezier(.4,0,.2,1)}
.g3d-mark{transition:transform .55s cubic-bezier(.4,0,.2,1);fill:var(--g3d-accent)}
.g3d-rim{stroke-width:1.1;stroke-linecap:round;fill:none}
.g3d-caustic{transition:opacity .4s}
.g3d-tk{stroke:var(--g3d-rule);stroke-width:1.4;stroke-linecap:round}
.g3d-tkm{stroke:var(--g3d-rule);stroke-width:1;opacity:.6;stroke-linecap:round}
.g3d-tl{font-size:9.5px;fill:var(--g3d-ink);opacity:.72;font-weight:500}
.g3d-zl{font-size:9px;fill:var(--g3d-ink);opacity:.66}
.g3d-val{font-weight:800;fill:var(--g3d-valc);paint-order:stroke;
  stroke:var(--g3d-valhalo);stroke-width:3.4px;stroke-linejoin:round;letter-spacing:-.01em}
.g3d-lbl{font-size:7.5px;fill:var(--g3d-ink);opacity:.62;text-transform:uppercase;letter-spacing:.06em}
.ft{display:flex;align-items:baseline;justify-content:center;gap:8px;margin-top:6px;min-height:0}
.ft.hide{display:none}
.ft .v{font-size:26px;font-weight:800;color:var(--g3d-valc);line-height:1}
.ft .u{font-size:12px;font-weight:600;opacity:.7}
.ft .l{font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:.06em}
.mm{display:flex;justify-content:space-between;font-size:10px;opacity:.55;margin-top:2px}
.mm.hide{display:none}
.tap{cursor:pointer}
.err{padding:12px;font-size:13px;color:var(--error-color,#c33)}
@container (max-width:180px){.nm{font-size:11px}.ft .v{font-size:20px}}
@media (prefers-reduced-motion:reduce){.g3d-fill,.g3d-ghost,.g3d-mark,.g3d-ico{transition:none}}
`;

  // ─────────────────────────────────────────────────────────────────  card

  const fire = (node, type, detail) => {
    const ev = new Event(type, { bubbles: true, composed: true, cancelable: false });
    ev.detail = detail || {};
    node.dispatchEvent(ev);
    return ev;
  };

  const runAction = (node, hass, cfg, entity) => {
    const a = cfg || { action: "more-info" };
    switch (a.action) {
      case "none": return;
      case "toggle":
        if (hass && entity) hass.callService("homeassistant", "toggle", { entity_id: entity });
        return;
      case "navigate":
        if (a.navigation_path) {
          history.pushState(null, "", a.navigation_path);
          fire(window, "location-changed", {});
        }
        return;
      case "url":
        if (a.url_path) window.open(a.url_path, a.new_tab === false ? "_self" : "_blank");
        return;
      case "call-service":
      case "perform-action": {
        const svc = a.perform_action || a.service || "";
        const [d, s] = svc.split(".");
        if (hass && d && s) hass.callService(d, s, a.data || a.service_data || {}, a.target);
        return;
      }
      default:
        fire(node, "hass-more-info", { entityId: a.entity || entity });
    }
  };

  class Mw3dGaugeCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._uid = "g" + Math.random().toString(36).slice(2, 8);
    }

    setConfig(config) {
      if (!config) throw new Error("Configuração vazia.");
      const c = Object.assign({}, DEFAULTS, config);
      if (!c.entity) throw new Error("Escolha uma entidade em `entity`.");
      if (c.zones && !Array.isArray(c.zones)) throw new Error("`zones` precisa ser uma lista.");
      // A FORMA remonta o desenho; o ESTADO só escreve variáveis.
      const shape = ["orientation", "shape", "depth", "thickness", "length", "iso", "glass", "cap",
        "base_plate", "ground_shadow", "paper", "paper_dark", "fill_style", "segments", "ticks",
        "tick_count", "tick_labels", "tick_side", "zones", "zone_labels", "secondary_entity",
        "compare_mode", "show_name", "show_value", "value_position", "value_mode", "show_unit",
        "show_min_max", "icon_in_fill", "label", "min", "max", "entity"]
        .map((k) => JSON.stringify(c[k])).join("|");
      const remount = shape !== this._shape;
      this._shape = shape;
      this._config = c;
      if (!this._hass) return;
      if (remount) this._build(); else this._paint(true);
    }

    set hass(hass) {
      const first = !this._hass;
      this._hass = hass;
      if (!this._config) return;
      if (first) this._build(); else this._paint();
    }

    getCardSize() {
      const c = this._config || DEFAULTS;
      const px = (c.orientation === "horizontal" ? Number(c.thickness) || 46 : Number(c.length) || 220) + 60;
      return Math.max(2, Math.round(px / 50));
    }

    getLayoutOptions() {
      const c = this._config || DEFAULTS;
      return c.orientation === "horizontal" ? { grid_rows: 3, grid_columns: "full" } : { grid_rows: 6, grid_columns: 4 };
    }

    static getConfigElement() { return document.createElement("mw-3d-gauge-card-editor"); }

    static getStubConfig(hass) {
      const st = (hass && hass.states) || {};
      const pick = Object.keys(st).find((e) => e.startsWith("sensor.") &&
        (st[e].attributes || {}).device_class === "humidity") ||
        Object.keys(st).find((e) => e.startsWith("sensor.") && Number.isFinite(Number(st[e].state))) || "";
      return { type: "custom:mw-3d-gauge-card", entity: pick, orientation: "vertical", shape: "cylinder" };
    }

    // ── leitura
    _read(id) {
      const st = this._hass && this._hass.states && this._hass.states[id];
      if (!st) return null;
      const a = st.attributes || {};
      const v = Number(st.state);
      return { v: Number.isFinite(v) ? v : null, unit: a.unit_of_measurement || "",
        dc: a.device_class || "", name: a.friendly_name || id, raw: st.state };
    }

    _range(kind, unit) {
      const c = this._config;
      // Number(null) é 0 — sem este cuidado, "sem mínimo" viraria mínimo zero.
      let lo = c.min == null || c.min === "" ? NaN : Number(c.min);
      let hi = c.max == null || c.max === "" ? NaN : Number(c.max);
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
        const auto = AUTO_RANGE[kind[1]] || (unit === "%" ? [0, 100] : [0, 100]);
        if (!Number.isFinite(lo)) lo = auto[0];
        if (!Number.isFinite(hi)) hi = auto[1];
      }
      if (hi === lo) hi = lo + 1;
      return [lo, hi];
    }

    // ── montagem
    _build() {
      const c = this._config;
      const r = this._read(c.entity);
      const g = geometry(c);
      this._geo = g;
      const kind = guessKind(c.unit || (r && r.unit), r && r.dc, c.entity);
      this._kind = kind;
      this._rng = this._range(kind, c.unit || (r && r.unit) || "");

      const [pl, pd] = paperColors(c.paper, c.paper_dark);
      const dark = c.paper_dark === true;
      const ink = paperInk(dark);
      const flat = c.depth === "flat";
      const drop = flat ? "none" : c.depth === "soft"
        ? "0 4px 12px rgba(0,0,0,.12)"
        : "0 2px 6px rgba(0,0,0,.14),0 10px 26px rgba(0,0,0,.10)";
      const relief = flat ? "none" : drop +
        (dark ? ",inset 1px 1px 3px rgba(255,255,255,0.06),inset -1px -1px 3px rgba(0,0,0,0.30)"
          : ",inset 2px 2px 4px rgba(255,250,235,0.75),inset -2px -2px 4px rgba(0,0,0,0.07)");
      const glassOn = c.glass !== false;
      const numOr = (v, d) => (v == null || v === "" || !Number.isFinite(Number(v)) ? d : Number(v));
      const spec = Math.max(0, Math.min(1, numOr(c.specular, 0.55)));
      const fdepth = Math.max(0, Math.min(0.8, numOr(c.fluid_depth, 0.30)));

      const vars = {
        "--g3d-paper": dark ? paperDarkGradient(c.paper) : paperGradient(c.paper),
        "--g3d-ink": ink,
        "--g3d-accent": "var(--primary-color)",
        "--g3d-relief": relief,
        "--g3d-edge": dark ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.20)",
        "--g3d-rule": dark ? "rgba(255,255,255,.34)" : "rgba(0,0,0,.34)",
        // corpo em papel: a luz entra por uma borda e morre na oposta
        "--g3d-b0": shade(pl, dark ? 0.20 : 0.16, 1),
        "--g3d-b1": pl,
        "--g3d-b2": shade(pd, dark ? 0.02 : -0.03, 1),
        "--g3d-b3": shade(pd, dark ? -0.14 : -0.21, 1),
        "--g3d-s0c": shade(pd, dark ? -0.06 : -0.15, 1),
        "--g3d-s1c": shade(pd, dark ? -0.20 : -0.34, 1),
        "--g3d-p-in": shade(pd, dark ? 0.06 : -0.04, 1),
        "--g3d-p-side": shade(pd, dark ? -0.10 : -0.16, 1),
        "--g3d-p-top": shade(pl, dark ? 0.22 : 0.16, 1),
        "--g3d-p-mouth": shade(pd, dark ? -0.14 : -0.20, 1),
        "--g3d-plate": shade(pl, dark ? 0.04 : -0.02, 1),
        "--g3d-plate-top": shade(pl, dark ? 0.24 : 0.18, 1),
        "--g3d-plate-side": shade(pd, dark ? -0.12 : -0.20, 1),
        "--g3d-cap": shade(pl, dark ? 0.10 : 0.04, 1),
        "--g3d-cap-top": shade(pl, dark ? 0.28 : 0.20, 1),
        "--g3d-cap-side": shade(pd, dark ? -0.06 : -0.12, 1),
        // verniz de BORDAS: escuro nas margens, nada no meio — não lava a cor
        "--g3d-v-edge": glassOn ? shade(pd, -0.55, dark ? 0.46 : 0.36) : "transparent",
        "--g3d-v-mid": glassOn ? shade(pd, -0.42, dark ? 0.20 : 0.14) : "transparent",
        "--g3d-v-edge2": glassOn ? shade(pd, -0.62, dark ? 0.52 : 0.42) : "transparent",
        "--g3d-spec": glassOn ? "rgba(255,255,255," + n2(spec * (dark ? 0.34 : 1)) + ")" : "transparent",
        "--g3d-spec2": glassOn ? "rgba(255,255,255," + n2(spec * (dark ? 0.16 : 0.42)) + ")" : "transparent",
        "--g3d-ax-mid": "rgba(0,0,0," + n2(fdepth * 0.34) + ")",
        "--g3d-ax-end": "rgba(0,0,0," + n2(fdepth) + ")",
        "--g3d-wall-mid": dark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.12)",
        "--g3d-wall-end": dark ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.36)",
        "--g3d-ghost": dark ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.14)",
        "--g3d-valhalo": pl,
        "--g3d-valc": "var(--g3d-ink)",
        "--fi-size": Math.max(14, Math.round(g.T * 0.42)) + "px",
      };

      const icon = c.icon || (r && r.dc ? "" : "");
      const hdr = c.show_name
        ? '<div class="hdr">' + (c.icon ? '<ha-icon icon="' + esc(c.icon) + '"></ha-icon>' : "") +
          '<span class="nm">' + esc(c.name || (r && r.name) || c.entity) + "</span></div>"
        : "";
      const foot = (c.show_value && c.value_position !== "in_body" && c.value_position !== "none")
        ? '<div class="ft"><span class="v"></span><span class="u"></span>' +
          (c.label ? '<span class="l">' + esc(c.label) + "</span>" : "") + "</div>"
        : "";
      const mm = c.show_min_max
        ? '<div class="mm"><span>' + esc(fmtNum(this._rng[0], "")) + "</span><span>" +
          esc(fmtNum(this._rng[1], "")) + "</span></div>"
        : "";

      const style = Object.keys(vars).map((k) => k + ":" + vars[k]).join(";");
      const top = c.value_position === "top" ? foot : "";
      const bottom = c.value_position === "top" ? "" : foot;

      this.shadowRoot.innerHTML = "<style>" + CSS + "</style>" +
        '<ha-card class="root' + (flat ? " flat" : "") + '" style="' + style + '">' + hdr + top +
        '<div class="stage" style="aspect-ratio:' + n2(g.W) + "/" + n2(g.H) + '">' +
        svgFor(c, g, this._uid, this._rng) + "</div>" + bottom + mm + "</ha-card>";

      const root = this.shadowRoot.querySelector(".root");
      this._el = {
        root: root,
        fills: Array.from(this.shadowRoot.querySelectorAll(".g3d-fill")),
        ghosts: Array.from(this.shadowRoot.querySelectorAll(".g3d-ghost")),
        mark: this.shadowRoot.querySelector(".g3d-mark"),
        s0: Array.from(this.shadowRoot.querySelectorAll(".g3d-s0")),
        s1: Array.from(this.shadowRoot.querySelectorAll(".g3d-s1")),
        s2: Array.from(this.shadowRoot.querySelectorAll(".g3d-s2")),
        m0: Array.from(this.shadowRoot.querySelectorAll(".g3d-m0")),
        m1: Array.from(this.shadowRoot.querySelectorAll(".g3d-m1")),
        rims: Array.from(this.shadowRoot.querySelectorAll(".g3d-rim")),
        svgVal: this.shadowRoot.querySelector(".g3d-val"),
        v: this.shadowRoot.querySelector(".ft .v"),
        u: this.shadowRoot.querySelector(".ft .u"),
        ico: this.shadowRoot.querySelector(".g3d-ico"),
      };
      this._bindActions(root);
      this._sig = null;
      this._paint(true);
    }

    _bindActions(root) {
      const c = this._config;
      const has = (a) => a && a.action && a.action !== "none";
      if (!has(c.tap_action) && c.tap_action) { /* toque desligado de propósito */ } else root.classList.add("tap");
      let timer = null, held = false;
      const down = () => {
        held = false;
        if (!c.hold_action) return;
        timer = setTimeout(() => { held = true; runAction(this, this._hass, c.hold_action, c.entity); }, 480);
      };
      const up = () => { if (timer) { clearTimeout(timer); timer = null; } };
      root.addEventListener("pointerdown", down);
      root.addEventListener("pointerup", up);
      root.addEventListener("pointerleave", up);
      root.addEventListener("click", () => {
        if (held) { held = false; return; }
        runAction(this, this._hass, c.tap_action, c.entity);
      });
      if (c.double_tap_action) {
        root.addEventListener("dblclick", () => runAction(this, this._hass, c.double_tap_action, c.entity));
      }
    }

    // ── pintura: só variáveis CSS, stop-color e um transform
    _paint(force) {
      const c = this._config, g = this._geo, el = this._el;
      if (!el || !g) return;
      const r = this._read(c.entity);
      const r2 = c.secondary_entity ? this._read(c.secondary_entity) : null;
      const unit = c.unit || (r && r.unit) || "";
      const v = r ? r.v : null;
      const rng = this._rng;
      const frac = v == null ? 0 : Math.max(0, Math.min(1, (v - rng[0]) / (rng[1] - rng[0])));
      const v2 = r2 ? r2.v : null;
      const frac2 = v2 == null ? 0 : Math.max(0, Math.min(1, (v2 - rng[0]) / (rng[1] - rng[0])));

      const sig = [v, v2, unit].join("|");
      if (!force && sig === this._sig) return;
      this._sig = sig;

      const base = fillColor(c, v, this._kind, unit, frac);
      const set = (k, val) => el.root.style.setProperty(k, val);
      const n = el.fills.length;
      for (let i = 0; i < Math.max(1, n); i++) {
        const b = i === 1 && r2 ? fillColor(c, v2, this._kind, unit, frac2) : base;
        set("--g3d-f-side" + i, shade(b, -0.24, 1));
        set("--g3d-f-top" + i, shade(b, 0.28, 1));
        set("--g3d-f-meniscus" + i, shade(b, 0.48, 0.8));
        set("--g3d-f-floor" + i, shade(b, -0.58, 1));
      }
      const stop = (arr, k, a) => arr.forEach((s) => {
        const i = Number(s.dataset.i) || 0;
        const b = i === 1 && r2 ? fillColor(c, v2, this._kind, unit, frac2) : base;
        s.setAttribute("stop-color", shade(b, k, a));
      });
      stop(el.s0, -0.20, 1); stop(el.s1, 0.32, 1); stop(el.s2, -0.30, 1);
      // menisco: centro iluminado, anel de borda na cor cheia
      stop(el.m0, 0.64, 1); stop(el.m1, -0.04, 1);
      el.rims.forEach((r) => {
        const i = Number(r.dataset.i) || 0;
        const b = i === 1 && r2 ? fillColor(c, v2, this._kind, unit, frac2) : base;
        r.setAttribute("stroke", shade(b, 0.66, 0.9));
      });
      set("--g3d-caustic", shade(base, 0.30, 0.24));
      const valc = v == null ? "var(--g3d-ink)" : inkOf(base, c.paper_dark === true);
      set("--g3d-valc", valc);

      const off = (f) => g.vert
        ? "translate(0px," + n2((1 - f) * g.run) + "px)"
        : "translate(" + n2(-(1 - f) * g.run) + "px,0px)";
      el.fills.forEach((f, i) => { f.style.transform = off(i === 1 && r2 ? frac2 : frac); });
      el.ghosts.forEach((f) => { f.style.transform = off(frac2); });
      if (el.mark) {
        el.mark.style.transform = g.vert
          ? "translate(0px," + n2(g.yBase - frac2 * g.run) + "px)"
          : "translate(" + n2(g.x0 + frac2 * g.run) + "px,0px)";
      }

      const txt = v == null ? "—" : (c.value_mode === "percent"
        ? Math.round(frac * 100) + "%"
        : fmtNum(v, c.show_unit ? unit : ""));
      if (el.svgVal) {
        el.svgVal.textContent = txt;
        // "24,5 °C" não cabe onde "50%" cabia: a fonte cede, o tubo não.
        const fs0 = Math.max(11, g.T * (g.vert ? 0.40 : 0.36));
        const room = (g.vert ? g.T * 0.84 : g.L * 0.46);
        el.svgVal.style.fontSize = n2(Math.max(8, Math.min(fs0, room / (0.58 * Math.max(2, txt.length))))) + "px";
      }
      if (el.v) {
        el.v.textContent = v == null ? "—" : (c.value_mode === "percent" ? Math.round(frac * 100) : fmtNum(v, ""));
        if (el.u) el.u.textContent = c.value_mode === "percent" ? "%" : (c.show_unit ? unit : "");
      }

      if (el.ico) {
        const u = frac * g.run;
        const inset = Math.min(u * 0.45, g.T * 0.60);
        const pu = u - inset;
        const x = g.vert ? g.x0 + g.T / 2 : g.x0 + pu;
        const y = g.vert ? g.yBase - pu : g.yBase - g.T / 2;
        el.ico.style.transform = "translate(" + n2(x) + "px," + n2(y) + "px)";
        el.root.style.setProperty("--fi-op", u < g.T * 0.55 ? "0" : "1");
        // o mesmo cuidado para o ícone que viaja dentro do líquido
        el.root.style.setProperty("--g3d-fico",
          lum(base) > 0.62 ? shade(base, -0.55, 0.95) : shade(base, 0.86, 0.95));
      }

      this.setAttribute("aria-label",
        (c.name || (r && r.name) || c.entity) + ": " + txt);
    }
  }

  // ───────────────────────────────────────────────────────────────  editor
  // Sem shadow DOM de propósito: o `ha-form` do HA herda o tema pela árvore clara.

  class Mw3dGaugeCardEditor extends HTMLElement {
    setConfig(config) {
      this._config = Object.assign({}, DEFAULTS, config || {});
      if (this._hass && this._built) this._render();
    }

    set hass(hass) {
      const first = !this._hass;
      this._hass = hass;
      // O HA chama setConfig ANTES de entregar o hass — só monta com os dois.
      if (first && this._config) this._build(); else if (this._built) this._render();
    }

    get _cfg() { return this._config || DEFAULTS; }

    _build() {
      this._built = true;
      this._pane = this._pane || "dado";
      this.innerHTML =
        "<style>" + EDCSS + "</style>" +
        '<div class="g3e">' +
        '<div class="g3e-prev"><div class="g3e-prev-in"></div></div>' +
        '<div class="g3e-tabs">' + TABS.map((t) =>
          '<button type="button" class="g3e-tab" data-p="' + t[0] + '"><ha-icon icon="' + t[2] +
          '"></ha-icon><span>' + t[1] + "</span></button>").join("") + "</div>" +
        TABS.map((t) => '<div class="g3e-pane" data-p="' + t[0] + '">' +
          (t[0] === "papel" ? '<div class="g3e-swatches"></div>' : "") +
          '<ha-form class="g3e-form" data-p="' + t[0] + '"></ha-form>' +
          (t[0] === "zonas" ? '<div class="g3e-zones"></div>' +
            '<button type="button" class="g3e-add">+ zona</button>' : "") +
          "</div>").join("") +
        "</div>";

      this.querySelectorAll(".g3e-tab").forEach((b) => b.addEventListener("click", () => {
        this._pane = b.dataset.p; this._paintTabs();
      }));
      this.querySelectorAll(".g3e-form").forEach((f) =>
        f.addEventListener("value-changed", (e) => this._onForm(e)));
      const add = this.querySelector(".g3e-add");
      if (add) add.addEventListener("click", () => {
        const z = (this._cfg.zones || []).slice();
        const rng = [Number(this._cfg.min), Number(this._cfg.max)];
        const lo = Number.isFinite(rng[0]) ? rng[0] : 0, hi = Number.isFinite(rng[1]) ? rng[1] : 100;
        z.push({ from: lo, to: Math.round((lo + hi) / 2), color: "#3fb950", label: "" });
        this._config = Object.assign({}, this._cfg, { zones: z });
        this._emit(); this._render();
      });
      this._render();
    }

    _paintTabs() {
      this.querySelectorAll(".g3e-tab").forEach((b) =>
        b.classList.toggle("on", b.dataset.p === this._pane));
      this.querySelectorAll(".g3e-pane").forEach((p) =>
        p.classList.toggle("on", p.dataset.p === this._pane));
    }

    _schemaFor(pane) {
      const c = this._cfg;
      const sel = (options) => ({ selector: { select: { mode: "dropdown", options: options } } });
      const bool = { selector: { boolean: {} } };
      const num = (min, max, step) => ({ selector: { number: { min: min, max: max, step: step, mode: "box" } } });
      const txt = { selector: { text: {} } };
      const mk = (name, extra) => Object.assign({ name: name, label: LABELS[name] || name }, extra);
      switch (pane) {
        case "dado": return [
          mk("entity", { selector: { entity: {} } }), mk("name", txt), mk("label", txt),
          mk("icon", { selector: { icon: {} } }), mk("unit", txt),
          mk("min", num(-1000, 100000, 0.1)), mk("max", num(-1000, 100000, 0.1))];
        case "forma": return [
          mk("orientation", sel(OPT.orientation)), mk("shape", sel(OPT.shape)),
          mk("depth", sel(OPT.depth)), mk("thickness", num(18, 140, 1)),
          mk("length", num(60, 460, 2)), mk("iso", num(0, 40, 1)),
          mk("glass", bool), mk("cap", bool), mk("base_plate", bool), mk("ground_shadow", bool),
          mk("quality", sel(OPT.quality)), mk("specular", num(0, 1, 0.05))];
        case "fluido": {
          const f = [mk("fill_style", sel(OPT.fill_style))];
          if (c.fill_style === "segments") f.push(mk("segments", num(3, 40, 1)));
          f.push(mk("fluid_opacity", num(0.3, 1, 0.02)), mk("fluid_depth", num(0, 0.8, 0.02)),
            mk("icon_in_fill", bool));
          return f;
        }
        case "papel": return [
          mk("paper_dark", bool),
          mk("paper", sel(c.paper_dark === true ? paperDarkOptions() : paperOptions()))];
        case "cor": {
          const s = [mk("color_scale", sel(OPT.color_scale))];
          if (c.color_scale === "single") s.push(mk("color", txt));
          if (c.color_scale === "custom") {
            s.push(mk("stop_1", num(-1000, 100000, 0.1)), mk("stop_2", num(-1000, 100000, 0.1)),
              mk("stop_3", num(-1000, 100000, 0.1)), mk("stop_4", num(-1000, 100000, 0.1)));
          }
          return s;
        }
        case "regua": {
          const s = [mk("ticks", sel(OPT.ticks))];
          if (c.ticks !== "none") {
            s.push(mk("tick_count", num(2, 12, 1)), mk("tick_labels", bool), mk("tick_side", sel(OPT.tick_side)));
          }
          s.push(mk("show_min_max", bool), mk("show_name", bool), mk("show_value", bool),
            mk("value_position", sel(OPT.value_position)), mk("value_mode", sel(OPT.value_mode)),
            mk("show_unit", bool));
          return s;
        }
        case "zonas": return [mk("zone_labels", bool)];
        case "comparar": {
          const s = [mk("secondary_entity", { selector: { entity: {} } })];
          if (c.secondary_entity) s.push(mk("secondary_label", txt), mk("compare_mode", sel(OPT.compare_mode)));
          return s;
        }
        case "acoes": return [
          mk("tap_action", { selector: { ui_action: {} } }),
          mk("hold_action", { selector: { ui_action: {} } }),
          mk("double_tap_action", { selector: { ui_action: {} } })];
        default: return [];
      }
    }

    _render() {
      if (!this._built || !this._hass) return;
      this._paintTabs();
      this.querySelectorAll(".g3e-form").forEach((f) => {
        f.hass = this._hass;
        f.schema = this._schemaFor(f.dataset.p);
        f.data = this._cfg;
        f.computeLabel = (s) => s.label || LABELS[s.name] || s.name;
      });
      this._paintSwatches();
      this._paintZones();
      this._paintPreview();
    }

    // 50 amostras clicáveis: o papel se escolhe com o olho, não pelo nome.
    _paintSwatches() {
      const grid = this.querySelector(".g3e-swatches");
      if (!grid) return;
      const dark = this._cfg.paper_dark === true;
      const key = (dark ? "d" : "l") + "|" + this._cfg.paper;
      if (grid.dataset.key === key) return;   // sem isto, digitar no Nome redesenha 50 botões
      grid.dataset.key = key;
      const opts = dark ? paperDarkOptions() : paperOptions();
      grid.innerHTML = opts.map((o) => {
        const bg = o.value === "paper"
          ? (dark ? PAPER_DARK_DEFAULT : PAPER_DEFAULT)
          : (dark ? paperDarkGradient(o.value) : paperGradient(o.value));
        return '<button type="button" class="g3e-chip' + (o.value === this._cfg.paper ? " on" : "") +
          '" data-v="' + o.value + '" title="' + esc(o.label) + '" style="background:' + bg + '"></button>';
      }).join("");
      grid.querySelectorAll(".g3e-chip").forEach((b) => b.addEventListener("click", () => {
        this._config = Object.assign({}, this._cfg, { paper: b.dataset.v });
        this._emit(); this._render();
      }));
    }

    _paintZones() {
      const box = this.querySelector(".g3e-zones");
      if (!box) return;
      const z = this._cfg.zones || [];
      box.innerHTML = z.map((it, i) =>
        '<div class="g3e-z" data-i="' + i + '">' +
        '<input class="zf" type="number" step="any" value="' + esc(it.from) + '" placeholder="de">' +
        '<input class="zt" type="number" step="any" value="' + esc(it.to) + '" placeholder="até">' +
        '<input class="zc" type="color" value="' + esc(/^#[0-9a-f]{6}$/i.test(it.color || "") ? it.color : "#3fb950") + '">' +
        '<input class="zl" type="text" value="' + esc(it.label || "") + '" placeholder="rótulo">' +
        '<button type="button" class="zx">✕</button></div>').join("");
      box.querySelectorAll(".g3e-z").forEach((row) => {
        const i = Number(row.dataset.i);
        const upd = () => {
          const zz = (this._cfg.zones || []).slice();
          zz[i] = { from: Number(row.querySelector(".zf").value), to: Number(row.querySelector(".zt").value),
            color: row.querySelector(".zc").value, label: row.querySelector(".zl").value };
          this._config = Object.assign({}, this._cfg, { zones: zz });
          this._emit(); this._paintPreview();
        };
        row.querySelectorAll("input").forEach((el) => el.addEventListener("change", upd));
        row.querySelector(".zx").addEventListener("click", () => {
          const zz = (this._cfg.zones || []).slice();
          zz.splice(i, 1);
          this._config = Object.assign({}, this._cfg, { zones: zz.length ? zz : null });
          this._emit(); this._render();
        });
      });
    }

    _paintPreview() {
      const host = this.querySelector(".g3e-prev-in");
      if (!host) return;
      if (!this._prev) {
        this._prev = document.createElement("mw-3d-gauge-card");
        host.appendChild(this._prev);
      }
      try {
        this._prev.setConfig(this._outConfig());
        this._prev.hass = this._hass;
      } catch (e) {
        host.innerHTML = '<div class="g3e-warn">' + esc(e.message) + "</div>";
        this._prev = null;
      }
    }

    _onForm(e) {
      e.stopPropagation();
      const v = e.detail && e.detail.value;
      if (!v) return;
      this._config = Object.assign({}, this._cfg, v);
      this._emit();
      this._render();
    }

    // Só o que difere do padrão vai para o YAML.
    _outConfig() {
      const out = { type: "custom:mw-3d-gauge-card" };
      Object.keys(this._cfg).forEach((k) => {
        if (k === "type") return;
        const v = this._cfg[k];
        if (v === DEFAULTS[k]) return;
        if (v === "" || v == null) return;
        out[k] = v;
      });
      return out;
    }

    _emit() {
      this.dispatchEvent(new CustomEvent("config-changed", {
        detail: { config: this._outConfig() }, bubbles: true, composed: true,
      }));
    }
  }

  const EDCSS = `
.g3e{display:block}
.g3e-prev{display:flex;justify-content:center;padding:10px 0 14px;
  border-bottom:1px solid var(--divider-color);margin-bottom:10px}
.g3e-prev-in{max-width:260px;width:100%}
.g3e-warn{color:var(--error-color,#c33);font-size:13px;text-align:center}
.g3e-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.g3e-tab{display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:9px;cursor:pointer;
  border:1px solid var(--divider-color);background:var(--card-background-color);
  color:var(--secondary-text-color);font:inherit;font-size:11.5px;letter-spacing:.04em}
.g3e-tab ha-icon{--mdc-icon-size:16px}
.g3e-tab.on{background:var(--primary-color);border-color:var(--primary-color);color:var(--text-primary-color,#fff)}
.g3e-pane{display:none}
.g3e-pane.on{display:block}
.g3e-swatches{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;margin-bottom:14px}
.g3e-chip{height:26px;border-radius:6px;border:1px solid var(--divider-color);cursor:pointer;padding:0}
.g3e-chip.on{outline:2px solid var(--primary-color);outline-offset:1px}
.g3e-z{display:grid;grid-template-columns:1fr 1fr 44px 1.4fr 32px;gap:6px;margin:6px 0;align-items:center}
.g3e-z input{width:100%;box-sizing:border-box;padding:6px;border-radius:6px;font:inherit;
  border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color)}
.g3e-z .zx{border:none;background:none;cursor:pointer;color:var(--secondary-text-color);font-size:15px}
.g3e-add{margin-top:8px;padding:7px 12px;border-radius:8px;cursor:pointer;font:inherit;font-size:13px;
  border:1px dashed var(--divider-color);background:none;color:var(--primary-text-color)}
`;

  // ────────────────────────────────────────────────────────────── registro

  if (!customElements.get("mw-3d-gauge-card")) {
    customElements.define("mw-3d-gauge-card", Mw3dGaugeCard);
    customElements.define("mw-3d-gauge-card-editor", Mw3dGaugeCardEditor);
  }

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "mw-3d-gauge-card",
    name: "MW 3D Gauge Card",
    description: "Gauge linear com corpo 3D — cilindro ou paralelepípedo, em pé ou deitado, em papel MW.",
    preview: true,
    documentationURL: "https://github.com/visaodeempresa/mw-ha-3d-gauge-card",
  });

  console.info(
    "%c MW-3D-GAUGE-CARD %c " + VERSION + " ",
    "color:#fdfaf3;background:#2b2825;font-weight:700;border-radius:3px 0 0 3px",
    "color:#2b2825;background:#e3b341;font-weight:700;border-radius:0 3px 3px 0"
  );

  // Export só para o probe headless; no navegador não existe module.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { DEFAULTS, LABELS, OPT, TABS, VERSION, geometry, boxParts, cylParts,
      paperColors, shade, toRGB, lum, inkOf, guessKind, fillColor, fmtNum, svgFor,
      Mw3dGaugeCard, Mw3dGaugeCardEditor };
  }
})();
