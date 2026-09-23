/* Probe headless do mw-3d-gauge-card — monta card e editor fora do navegador
 * (shim de DOM à mão, sem dependência) e prova o que uma foto não prova:
 * as 4 combinações orientação × forma, a geometria, o curso encurtado pela
 * tampa, o líquido que anda por transform, régua/zonas no markup, a cor vinda
 * das escalas canônicas e a regra de default que não polui o YAML.
 *
 * Rodar: node tools/probe.js   (sai 1 se alguma verificação falhar)
 */
const fs = require("fs");
const path = require("path");

/* ------------------------------- shim DOM ------------------------------- */

const mkStyle = () => {
  const s = { _p: {} };
  s.setProperty = (k, v) => { s._p[k] = String(v); };
  s.removeProperty = (k) => { delete s._p[k]; };
  s.get = (k) => s._p[k];
  return s;
};

class Node {
  constructor(tag) {
    this.tagName = String(tag || "div").toUpperCase();
    this.style = mkStyle();
    this.children = [];
    this.dataset = {};
    this._attrs = {};
    this._listeners = {};
    this._q = new Map();
    this._classes = new Set();
    this.innerHTML = "";
    this.textContent = "";
    this.hidden = false;
    this.classList = {
      add: (c) => this._classes.add(c),
      remove: (c) => this._classes.delete(c),
      contains: (c) => this._classes.has(c),
      toggle: (c, on) => (on === undefined
        ? (this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c))
        : (on ? this._classes.add(c) : this._classes.delete(c))),
    };
  }
  appendChild(n) { this.children.push(n); n.parentNode = this; return n; }
  append(...n) { n.forEach((x) => this.appendChild(x)); }
  insertBefore(n, ref) {
    const i = ref ? this.children.indexOf(ref) : -1;
    if (i < 0) this.children.push(n); else this.children.splice(i, 0, n);
    n.parentNode = this;
    return n;
  }
  replaceChild(nw, old) {
    const i = this.children.indexOf(old);
    if (i >= 0) this.children[i] = nw;
    nw.parentNode = this;
  }
  removeChild(n) { this.children = this.children.filter((c) => c !== n); }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  setAttribute(k, v) { this._attrs[k] = String(v); }
  getAttribute(k) { return k in this._attrs ? this._attrs[k] : null; }
  addEventListener(t, f) { (this._listeners[t] = this._listeners[t] || []).push(f); }
  removeEventListener() {}
  dispatchEvent(ev) { (this._listeners[ev && ev.type] || []).forEach((f) => f(ev)); return true; }
  // memoiza por seletor: o código só consulta seletores fixos
  querySelector(sel) {
    if (!this._q.has(sel)) this._q.set(sel, new Node("div"));
    return this._q.get(sel);
  }
  querySelectorAll() { return []; }
  getElementById(id) { return this.querySelector("#" + id); }
  focus() {}
}

global.Node = Node;
global.HTMLElement = class extends Node {
  attachShadow() { this.shadowRoot = new Node("shadow-root"); return this.shadowRoot; }
};
global.CustomEvent = class {
  constructor(type, init) { this.type = type; Object.assign(this, init || {}); }
};
const reg = {};
global.customElements = {
  define: (n, c) => { reg[n] = c; },
  get: (n) => reg[n],
  whenDefined: () => Promise.resolve(),
};
global.document = { createElement: (t) => new Node(t), body: new Node("body") };
// no Node 24 `navigator` é getter-only: define por cima, não por atribuição
Object.defineProperty(global, "navigator", { value: { vibrate: () => {} }, configurable: true });

// helpers de bolso: os "cards de dentro" viram nós marcados
global.window = {
  customCards: [],
  localStorage: { _v: {}, getItem(k) { return k in this._v ? this._v[k] : null; }, setItem(k, v) { this._v[k] = v; } },
  dispatchEvent: () => {},
  loadCardHelpers: async () => ({
    createCardElement(cfg) {
      const el = new Node("div");
      el._cfg = cfg;
      el.getCardSize = () => 2;
      return el;
    },
  }),
};

// fragmento: o card monta tudo fora da árvore e injeta de uma vez
global.document.createDocumentFragment = () => { const f = new Node("fragment"); f._frag = true; return f; };
const _append = Node.prototype.appendChild;
Node.prototype.appendChild = function (n) {
  if (n && n._frag) { n.children.forEach((c) => _append.call(this, c)); n.children = []; return n; }
  return _append.call(this, n);
};

const infoBanner = [];
const realInfo = console.info;
console.info = (...a) => infoBanner.push(a.join(" "));

/* --------------------------------- carga -------------------------------- */


const SRC = path.join(__dirname, "..", "dist", "mw-3d-gauge-card.js");
const CODE = fs.readFileSync(SRC, "utf8");
eval(CODE);
console.info = realInfo;
const API = module.exports;

/* ------------------------------- asserções ------------------------------ */

let pass = 0; const fails = [];
const ok = (cond, msg) => { if (cond) pass++; else fails.push(msg); };
const has = (hay, needle, msg) =>
  ok(String(hay).includes(needle), `${msg} — não achei ${JSON.stringify(needle)}`);
const hasnt = (hay, needle, msg) =>
  ok(!String(hay).includes(needle), `${msg} — não deveria ter ${JSON.stringify(needle)}`);

const Card = customElements.get("mw-3d-gauge-card");
const Editor = customElements.get("mw-3d-gauge-card-editor");
const HASS = {
  states: {
    "sensor.umidade": { state: "62", attributes: { unit_of_measurement: "%", device_class: "humidity", friendly_name: "Umidade da suíte" } },
    "sensor.temp": { state: "24.5", attributes: { unit_of_measurement: "°C", device_class: "temperature", friendly_name: "Temperatura" } },
    "sensor.temp_fora": { state: "31.2", attributes: { unit_of_measurement: "°C", device_class: "temperature", friendly_name: "Fora" } },
    "sensor.co2": { state: "980", attributes: { unit_of_measurement: "ppm", device_class: "carbon_dioxide", friendly_name: "CO2" } },
    "sensor.watts": { state: "1450", attributes: { unit_of_measurement: "W", device_class: "power", friendly_name: "Consumo" } },
    "sensor.hpa": { state: "1012", attributes: { unit_of_measurement: "hPa", device_class: "pressure", friendly_name: "Pressão" } },
    "sensor.mudo": { state: "unavailable", attributes: {} },
  },
  callService() {},
};
const mk = (cfg) => { const el = new Card(); el.setConfig(cfg); el.hass = HASS; return el; };
const html = (el) => String(el.shadowRoot.innerHTML || "");
const svg = (cfg) => {
  const c = Object.assign({}, API.DEFAULTS, cfg);
  if (!("quality" in (cfg || {}))) c.quality = "ultra";   // a bancada mede o teto
  return API.svgFor(c, API.geometry(c), "t", [0, 100]);
};
// nós DE DESENHO: os <defs> não pintam nada, são receita de gradiente.
const nodes = (m) => (String(m).replace(/<defs>[^]*?<\/defs>/g, "")
  .match(/<(rect|polygon|ellipse|path|line|text|circle|g|foreignObject)\b/g) || []).length;

/* 1. registro, banner e cartão de visita do HACS */
ok(!!Card, "mw-3d-gauge-card não foi registrado");
ok(!!Editor, "mw-3d-gauge-card-editor não foi registrado");
ok(/%c v?\d+\.\d+\.\d+ /.test(infoBanner.join(" ")),
  "banner de versão fora do formato que o release procura");
ok(window.customCards.some((c) => c.type === "mw-3d-gauge-card" && c.preview === true),
  "o card não se anuncia em window.customCards com preview");
ok(typeof Card.getConfigElement === "function" && typeof Card.getStubConfig === "function",
  "faltam getConfigElement/getStubConfig (o HA precisa dos dois para o editor visual)");
ok(Card.getStubConfig(HASS).entity === "sensor.umidade",
  "getStubConfig deveria escolher um sensor numérico da casa");

/* 2. config inválida grita */
const lanca = (cfg) => { try { new Card().setConfig(cfg); return false; } catch (_) { return true; } };
ok(lanca(null), "setConfig(null) deveria lançar");
ok(lanca({}), "card sem `entity` deveria lançar");
ok(lanca({ entity: "sensor.temp", zones: "alta" }), "`zones` que não é lista deveria lançar");

/* 3. as quatro combinações orientação × forma montam e fecham conta */
[["vertical", "cylinder"], ["vertical", "box"], ["horizontal", "cylinder"], ["horizontal", "box"]]
  .forEach(([orientation, shape]) => {
    const g = API.geometry(Object.assign({}, API.DEFAULTS, { orientation, shape }));
    ok(g.W > 0 && g.H > 0 && g.run > 0, `geometria inválida em ${orientation}/${shape}`);
    const m = svg({ orientation, shape });
    has(m, 'class="g3d-fill"', `${orientation}/${shape}: sem grupo de preenchimento`);
    has(m, "clipPath", `${orientation}/${shape}: sem recorte do tubo`);
    has(m, 'class="g3d-glass"', `${orientation}/${shape}: sem a camada de vidro`);
  });
const gv = API.geometry(Object.assign({}, API.DEFAULTS, { orientation: "vertical" }));
const gh = API.geometry(Object.assign({}, API.DEFAULTS, { orientation: "horizontal" }));
ok(gv.H > gv.W, "o gauge vertical deveria ser mais alto que largo");
ok(gh.W > gh.H, "o gauge horizontal deveria ser mais largo que alto");

/* 4. a tampa encurta o curso do líquido — senão o líquido sobe por dentro dela */
const comCap = API.geometry(Object.assign({}, API.DEFAULTS, { cap: true }));
const semCap = API.geometry(Object.assign({}, API.DEFAULTS, { cap: false }));
ok(comCap.run < comCap.L, "com tampa, o curso precisa ser menor que o tubo");
ok(semCap.run === semCap.L, "sem tampa, o curso é o tubo inteiro");

/* 5. cada forma desenha o que promete */
has(svg({ shape: "box" }), "<polygon", "paralelepípedo sem polígonos de face");
has(svg({ shape: "cylinder" }), "<ellipse", "cilindro sem elipse de tampa/fundo");
has(svg({ shape: "cylinder" }), "<path", "cilindro sem contorno em path");

/* 6. régua */
has(svg({ ticks: "both", tick_labels: true }), 'class="g3d-tk"', "régua sem marcas grandes");
has(svg({ ticks: "both", tick_labels: true }), 'class="g3d-tkm"', "régua sem marcas pequenas");
has(svg({ ticks: "both", tick_labels: true }), 'class="g3d-tl"', "régua sem números");
hasnt(svg({ ticks: "major" }), 'class="g3d-tkm"', "ticks:major não deveria trazer marcas pequenas");
hasnt(svg({ ticks: "none" }), 'class="g3d-tk"', "ticks:none deveria apagar a régua");
ok(API.geometry(Object.assign({}, API.DEFAULTS, { ticks: "none" })).W <
   API.geometry(Object.assign({}, API.DEFAULTS, { ticks: "both", tick_labels: true })).W,
  "sem régua o card deveria ocupar menos largura");

/* 7. zonas */
const zcfg = { zones: [{ from: 0, to: 30, color: "#4f8ef7", label: "seco" },
  { from: 30, to: 60, color: "#3fb950", label: "ok" }] };
const zm = svg(zcfg);
ok((zm.match(/#4f8ef7|#3fb950/g) || []).length >= 2, "as duas zonas deveriam aparecer na fita");
hasnt(zm, 'class="g3d-zl"', "sem zone_labels não deveria haver rótulo de zona");
has(svg(Object.assign({ zone_labels: true }, zcfg)), 'class="g3d-zl"', "zone_labels não desenhou o rótulo");

/* 8. segmentos */
has(svg({ fill_style: "segments", segments: 8 }), "<mask", "fill_style:segments sem máscara de listras");
hasnt(svg({ fill_style: "liquid" }), "<mask", "líquido contínuo não deveria ter máscara");

/* 9. comparativo nos três modos */
has(svg({ secondary_entity: "sensor.temp_fora", compare_mode: "ghost" }), 'class="g3d-ghost"',
  "modo fantasma sem o segundo preenchimento");
has(svg({ secondary_entity: "sensor.temp_fora", compare_mode: "marker" }), 'class="g3d-mark"',
  "modo marca sem o ponteiro na régua");
ok((svg({ secondary_entity: "sensor.temp_fora", compare_mode: "side" })
  .match(/class="g3d-tube"/g) || []).length === 2, "modo lado a lado deveria desenhar dois tubos");

/* 10. papel: tom escolhido vira cor, tom inválido cai no creme */
const azul = API.paperColors("blue-3", false);
ok(azul.length === 2 && azul[0].startsWith("rgb("), "tom de papel não virou RGB");
ok(API.toRGB("hsl(203,12%,94%)").b > API.toRGB("hsl(203,12%,94%)").r,
  "toRGB precisa entender hsl() — o papel canônico é declarado assim");
ok(API.shade("hsl(27,12%,94%)", -0.04) !== API.shade("#4f8ef7", -0.04),
  "hsl() caindo no fallback azul: o papel inteiro sairia errado");
ok(API.paperColors("paper", false)[0] === "#fdfaf3", "papel padrão deveria ser o creme da casa");
ok(API.paperColors("xpto-9", false)[0] === "#fdfaf3", "tom inválido deveria cair no creme");
ok(API.paperColors("blue-3", true)[0] !== azul[0], "o papel de noite tem rampa própria");

/* 11. a grandeza é reconhecida pela unidade / device_class */
const kinds = [["°C", "temperature", "sensor.x", "climate", "temp"],
  ["%", "humidity", "sensor.x", "climate", "hum"],
  ["ppm", "carbon_dioxide", "sensor.x", "air", "co2"],
  ["W", "power", "sensor.x", "electrical", "power"],
  ["hPa", "pressure", "sensor.x", "pressure", "pressure"],
  ["%", "battery", "sensor.x", "level", "battery"]];
kinds.forEach(([u, d, e, fam, sub]) => {
  const k = API.guessKind(u, d, e);
  ok(k[0] === fam && k[1] === sub, `${u}/${d} deveria ser ${fam}/${sub}, veio ${k.join("/")}`);
});

/* 12. a cor vem da escala canônica e muda com o valor */
const frio = API.fillColor(API.DEFAULTS, 16, ["climate", "temp"], "°C", 0.3);
const quente = API.fillColor(API.DEFAULTS, 34, ["climate", "temp"], "°C", 0.9);
ok(frio && quente && frio !== quente, "a escala de clima deveria dar cores diferentes para 16 °C e 34 °C");
ok(API.fillColor(Object.assign({}, API.DEFAULTS, { color_scale: "single", color: "#abcdef" }),
  50, ["climate", "temp"], "°C", 0.5) === "#abcdef", "cor única deveria valer sobre a escala");
const custom = Object.assign({}, API.DEFAULTS, { color_scale: "custom", stop_1: 20, stop_2: 40 });
ok(API.fillColor(custom, 10, [null, null], "", 0.1) !== API.fillColor(custom, 50, [null, null], "", 0.9),
  "paradas próprias deveriam separar as faixas");
ok(API.fillColor(API.DEFAULTS, 1200, ["air", "co2"], "ppm", 0.5), "escala do ar não devolveu cor");
ok(API.fillColor(API.DEFAULTS, 1450, ["electrical", "power"], "W", 0.5), "escala elétrica não devolveu cor");
ok(API.fillColor(API.DEFAULTS, 1012, ["pressure", "pressure"], "hPa", 0.5), "escala de pressão não devolveu cor");

/* 13. shade clareia e escurece sem trocar de matiz */
ok(API.shade("#3fb950", 0.5) !== API.shade("#3fb950", -0.5), "shade não está variando");
has(API.shade("#3fb950", 0.2, 0.5), "rgba(", "shade deveria devolver rgba");

/* 14. números com vírgula e sem zero à toa */
ok(API.fmtNum(24.5, "°C") === "24,5 °C", "24.5 °C saiu como " + API.fmtNum(24.5, "°C"));
ok(API.fmtNum(1450, "W") === "1450 W", "inteiro grande não deveria ganhar casa decimal");
ok(API.fmtNum(null, "W") === "—", "valor ausente deveria virar travessão");

/* 15. o card monta, lê a entidade e se anuncia para o leitor de tela */
const card = mk({ entity: "sensor.umidade", icon: "mdi:water-percent", label: "SUÍTE" });
has(html(card), "<svg", "o card não desenhou o SVG");
has(html(card), "Umidade da suíte", "o nome da entidade não apareceu no cabeçalho");
has(card.getAttribute("aria-label"), "62", "aria-label sem o valor lido");
ok(card.getCardSize() >= 2, "getCardSize deveria ser pelo menos 2");
ok(card.getLayoutOptions().grid_rows > 0, "getLayoutOptions sem altura de grade");
const mudo = mk({ entity: "sensor.mudo" });
has(mudo.getAttribute("aria-label"), "—", "entidade indisponível deveria mostrar travessão");

/* 16. curso automático por grandeza, e o declarado vence */
const auto = mk({ entity: "sensor.co2" });
ok(auto._rng[0] === 400 && auto._rng[1] === 2000, "CO₂ deveria abrir em 400–2000 ppm");
const manual = mk({ entity: "sensor.co2", min: 0, max: 5000 });
ok(manual._rng[0] === 0 && manual._rng[1] === 5000, "min/max declarados deveriam vencer o automático");

/* 17. o ícone viaja dentro do SVG (transform), não por top/left */
has(svg({ icon_in_fill: true, icon: "mdi:water" }), 'class="g3d-ico"', "ícone não entrou no SVG");
hasnt(svg({ icon_in_fill: false, icon: "mdi:water" }), 'class="g3d-ico"', "ícone desligado ainda apareceu");

/* 17b. o valor encolhe a fonte para caber no tubo, em vez de vazar */
const curto = mk({ entity: "sensor.p50", value_mode: "percent" });
const longo = mk({ entity: "sensor.hpa" });
const fsOf = (el) => parseFloat((el._el.svgVal.style._p || {})["font-size"] ||
  el._el.svgVal.style.fontSize || "0");
ok(fsOf(longo) <= fsOf(curto), "texto longo deveria encolher a fonte (curto=" +
  fsOf(curto) + ", longo=" + fsOf(longo) + ")");
ok(fsOf(longo) >= 8, "a fonte do valor não pode sumir");

/* 17c. o valor cede luminosidade até se ler sobre o papel */
const claro = "#f2e14a";   // amarelo de 24 °C: ilegível em creme se for escrito cru
ok(API.lum(API.inkOf(claro, false)) < API.lum(claro),
  "cor clara deveria escurecer para ser lida no papel claro");
ok(API.lum(API.inkOf("#2b3a8f", true)) > API.lum("#2b3a8f"),
  "cor escura deveria clarear para ser lida no papel de noite");
ok(API.inkOf("#e35d5d", false) === "#e35d5d",
  "cor que já contrasta não deveria ser mexida");

/* 17d. Number(null) é 0: as chaves numéricas opcionais não podem nascer zeradas */
ok(/opacity="(0\.9[0-9]|1)"/.test(svg({ shape: "cylinder" })),
  "fluido do cilindro nasceu invisível (fluid_opacity null virou 0)");
ok(/opacity="1"/.test(svg({ shape: "box" })), "fluido do box deveria ser opaco");
const semSpec = mk({ entity: "sensor.temp" });
ok((semSpec._el.root.style._p["--g3d-spec"] || "").indexOf("0)") === -1,
  "specular null virou 0 e apagou o brilho");

/* 17e. os quatro níveis de realismo: cada um liga camadas e custa nós */
const corpo = (q) => svg({ quality: q, ticks: "none", show_value: false, icon_in_fill: false });
const TETO = { low: 24, medium: 30, high: 36, ultra: 42 };
let ant = 0;
["low", "medium", "high", "ultra"].forEach((q) => {
  const n = nodes(corpo(q));
  ok(n <= TETO[q], `${q} passou do teto de nós: ${n} > ${TETO[q]}`);
  ok(n >= ant, `${q} deveria ter pelo menos tantos nós quanto o tier abaixo (${n} < ${ant})`);
  ant = n;
});
ok(nodes(corpo("ultra")) > nodes(corpo("low")) + 6,
  "ultra e low estão desenhando quase a mesma coisa — os tiers não estão ligando camada");

// as camadas que cada tier promete
hasnt(corpo("low"), "-spec)", "low não deveria ter brilho especular");
hasnt(corpo("low"), "-ground)", "low não deveria ter sombra de chão");
has(corpo("medium"), "-spec)", "medium precisa do brilho");
has(corpo("medium"), "-ground)", "medium precisa da sombra de chão");
hasnt(corpo("medium"), "-wall)", "a sombra na parede é do high para cima");
has(corpo("high"), "-wall)", "high precisa da sombra do fluido na parede");
has(corpo("high"), "-ax)", "high precisa do fluido em dois eixos");
has(corpo("high"), "-contact)", "high precisa da sombra de contato");
hasnt(corpo("high"), "-caustic)", "a cáustica é do ultra");
has(corpo("ultra"), "-caustic)", "ultra precisa da cáustica no chão");
has(corpo("ultra"), "--g3d-spec2", "ultra precisa do segundo brilho");

/* 17f. o verniz é de BORDAS: sem isto ele lava a cor do fluido (o erro da v0.1) */
const vern = corpo("ultra");
has(vern, "-varnish", "faltou o verniz");
const stops = (API.svgFor(Object.assign({}, API.DEFAULTS, { quality: "ultra" }),
  API.geometry(Object.assign({}, API.DEFAULTS, { quality: "ultra" })), "t", [0, 100])
  .match(/id="t-varnish"[^]*?<\/linearGradient>/) || [""])[0];
ok((stops.match(/transparent/g) || []).length >= 2,
  "o verniz precisa ser transparente no miolo, senão desbota o fluido");

/* 17g. nenhum tier usa <filter>: filtro rasteriza a subárvore a cada repaint */
["low", "medium", "high", "ultra"].forEach((q) =>
  hasnt(corpo(q), "<filter", `${q} está usando filtro SVG — proibido, mata a rolagem no celular`));
hasnt(CODE, "feGaussianBlur", "o card não deveria ter blur de SVG em lugar nenhum");

/* 17h. auto resolve para um tier válido mesmo sem matchMedia */
const autoCfg = Object.assign({}, API.DEFAULTS, { quality: "auto" });
ok(["low", "medium", "high", "ultra"].indexOf(
  (API.svgFor(autoCfg, API.geometry(autoCfg), "t", [0, 100]).match(/data-q="(\w+)"/) || [])[1]) > -1,
  "quality:auto não resolveu para um tier válido");

/* 18. relevo de papel é sombra parada: nada de animar propriedade cara */
const css = CODE.slice(CODE.indexOf("const CSS = `"), CODE.indexOf("`;", CODE.indexOf("const CSS = `")));
hasnt(css, "@keyframes", "o card não deveria ter @keyframes");
(css.match(/transition:[^;}]+/g) || []).forEach((t) => {
  ok(!/\b(box-shadow|filter|width|height|left|top|margin|padding|background)\b/.test(t),
    "transição em propriedade cara: " + t.trim());
});

/* 19. o editor existe, tem as abas e não polui o YAML com o que já é padrão */
const ed = new Editor();
ed.setConfig({ type: "custom:mw-3d-gauge-card", entity: "sensor.temp" });
ed.hass = HASS;
const out = ed._outConfig();
ok(out.entity === "sensor.temp", "o editor perdeu a entidade");
ok(!("thickness" in out) && !("ticks" in out) && !("orientation" in out),
  "o editor está gravando defaults no YAML: " + JSON.stringify(out));
ed._config = Object.assign({}, ed._config, { orientation: "horizontal" });
ok(ed._outConfig().orientation === "horizontal", "o que difere do padrão precisa ir para o YAML");
ok(API.TABS.length === 9, "o editor deveria ter 9 abas");
["dado", "forma", "papel", "cor", "fluido", "regua", "zonas", "comparar", "acoes"].forEach((p) =>
  ok(ed._schemaFor(p).length > 0 || p === "zonas", "aba sem campos: " + p));
ok(ed._schemaFor("cor").some((s) => s.name === "stop_1") === false,
  "as paradas só aparecem no modo 'paradas próprias'");
ed._config = Object.assign({}, ed._config, { color_scale: "custom" });
ok(ed._schemaFor("cor").some((s) => s.name === "stop_1"),
  "no modo 'paradas próprias' os campos deveriam aparecer");

/* 20. o papel de noite troca a lista de tons oferecida */
ed._config = Object.assign({}, ed._config, { paper_dark: true });
const opDark = ed._schemaFor("papel").find((s) => s.name === "paper").selector.select.options;
ok(opDark[0].label.indexOf("noite") > -1, "com papel de noite o editor deveria oferecer a rampa escura");

/* -------------------------------- relatório ------------------------------ */

if (fails.length) {
  console.error(`\n✗ ${fails.length} falha(s) de ${pass + fails.length} provas:\n`);
  fails.forEach((f) => console.error("  · " + f));
  process.exit(1);
}
console.log(`✓ ${pass} provas passaram — mw-3d-gauge-card ${API.VERSION}`);
