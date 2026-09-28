/* ---------- DOCS — the paper this city produces ----------
   Pack-side, like everything with a name in it. The engine renders sections and knows
   nothing about bakeries: a document is a title, a template number, and a `build(R)` that
   turns the play record R into a list of sections.

   Two rules the owner set (2026-09-03):
   1. "your real answers" — a document is assembled from what you actually picked, and a
      field you never answered is LEFT BLANK, which is the templates' own convention.
   2. "make sure we also create realistic docs so we can export for ai consulting" — these
      mirror docs/templates/ 01-07 section for section, so a filled one can be copied
      straight into a client folder.

   R is handed over by the engine: {hero, dateStr, decisions[], districts[], done[], marks{}}
   Each decision: {quest, qi, npc, ask, pick, concept, why, result}. */

const DX = (en, es) => (typeof lang !== "undefined" && lang === "es") ? es : en;

const DOCUI = {
  en: { read: "📄 Read it", close: "✕ Close", copy: "📋 Copy", dl: "⬇️ Download (.md)",
        copied: "Copied — paste it wherever the work lives.", open: "Open",
        blankPaper: "Blank paper", tmplLb: n => "Template " + n,
        preparedBy: "Prepared by", nothingYet: "Nothing is pinned here yet.", },
  es: { read: "📄 Leerlo", close: "✕ Cerrar", copy: "📋 Copiar", dl: "⬇️ Descargar (.md)",
        copied: "Copiado — pégalo donde viva el trabajo.", open: "Abrir",
        blankPaper: "Papel en blanco", tmplLb: n => "Plantilla " + n,
        preparedBy: "Preparado por", nothingYet: "Todavía no hay nada puesto aquí.", },
};

/* where a readable thing stands. A wall poster is read from the tile in front of it. */
const READS = [
  { world: "f2", x: 10, y: 1, doc: "file" },      /* the old lead's desk — still logged in */
  { world: "f2", x: 2,  y: 0, doc: "labs" },
  { world: "f2", x: 4,  y: 0, doc: "mercado" },
  { world: "f2", x: 6,  y: 0, doc: "taller" },
  { world: "f2", x: 13, y: 0, doc: "espiga" },
  { world: "f2", x: 15, y: 0, doc: "velazquez" },
  { world: "f2", x: 17, y: 0, doc: "nolasco" },
];

/* the gate sheet (#8): what El Portero stopped, what is critical, what merely went wrong —
   built live from the engine's log; the critical rows print in red */
const PORTERO_DOC={
  title:{en:"The gate sheet",es:"La hoja de la reja"},
  sub:{en:"Stopped attempts and critical errors, in red. Read it, then clear it.",es:"Intentos detenidos y errores críticos, en rojo. Léela y luego límpiala."},
  build:()=>{const es=lang==="es",out=[],when=e=>new Date(e.at).toISOString().slice(0,16).replace("T"," ");
    const b=logKind("build"),c=logCrit().filter(e=>e.kind!=="build"),w=mqLog.filter(e=>!e.crit&&e.kind!=="build");
    out.push({h:es?"Intentos detenidos":"Stopped attempts"});
    if(!b.length)out.push({p:es?"Ninguno. Todo lo que se construyó, se construyó.":"None. Everything that was built, was built."});
    b.forEach(e=>out.push({red:"× "+e.n+" · "+e.msg+" · "+when(e)}));
    out.push({h:es?"Crítico — para hablarlo pronto":"Critical — to discuss sooner than later"});
    if(!c.length)out.push({p:es?"Nada crítico.":"Nothing critical."});
    c.forEach(e=>out.push({red:"× "+e.n+" · "+e.kind+": "+e.msg+" · "+when(e)}));
    out.push({h:es?"Avisos":"Warnings"});
    if(!w.length)out.push({p:es?"Ninguno.":"None."});
    w.forEach(e=>out.push({p:"× "+e.n+" · "+e.kind+": "+e.msg+" · "+when(e)}));
    if(mqLog.length)out.push({btn:es?"✓ Revisado — limpiar la hoja":"✓ Reviewed — clear the sheet",run:()=>{logClear();docOpen("portero");}});
    return out;}
};
/* ---- helpers every document shares ---- */
const dDistrict = (R, id) => R.districts.find(d => d.id === id) || { quests: [], closed: false, grade: 0 };
const dCalls = (R, id) => { const q = dDistrict(R, id).quests;
  return R.decisions.filter(e => q.indexOf(e.qi) >= 0); };
/* the answer of record for a question is the LAST time you answered it — the retry counts */
const dFinal = calls => { const by = {}, order = [];
  calls.forEach(e => { const k = e.quest + "|" + e.ask; if (!by[k]) order.push(k); by[k] = by[k] ? by[k].concat([e]) : [e]; });
  return order.map(k => ({ rows: by[k], last: by[k][by[k].length - 1], tries: by[k].length })); };
const dOk = calls => { const f = dFinal(calls); return f.filter(x => x.last.result === "ok").length + "/" + f.length; };
const dClean = calls => { const f = dFinal(calls);
  return f.length ? Math.round(f.filter(x => x.tries === 1 && x.last.result === "ok").length / f.length * 100) + "%" : "—"; };
const dConcepts = calls => [...new Set(calls.map(e => e.concept).filter(Boolean))];
const dHead = (R, d, place) => [
  { kv: [
    [DX("Client", "Cliente"), place],
    [DX("Engagement", "Encargo"), (d.industry || "") + (d.industry && d.role ? " · " : "") + (d.role || "")],
    [DX("Prepared by", "Preparado por"), R.hero],
    [DX("Date", "Fecha"), R.dateStr],
    [DX("Status", "Estado"), d.closed ? DX("Closed", "Cerrado") : DX("In progress", "En curso")],
  ] },
];
/* a district you have not worked yet is blank paper, and says so without listing anything */
const dBlank = (R, place) => [
  { h: DX("Blank paper", "Papel en blanco") },
  { p: DX("Pinned up ready, nothing on it. This page fills itself with what you decide at " + place + " — the questions you were asked, the answers you gave, and why.",
         "Puesto ahí listo, sin nada. Esta hoja se llena sola con lo que decidas en " + place + " — las preguntas que te hicieron, lo que contestaste, y por qué.") },
];
/* the decisions, as the form's own body */
const dBody = calls => dFinal(calls).map(g => ({ q: {
  ask: g.last.ask, pick: g.last.pick, why: g.last.why,
  concept: g.last.concept, r: g.last.result, tries: g.tries } }));

const DOCS = {

  /* ---------- 05 · Decision Log — Meridian Labs ---------- */
  labs: {
    tmpl: "05",
    title: { en: "Decision Log — Meridian Labs", es: "Bitácora de decisiones — Meridian Labs" },
    sub: { en: "The running record of calls and why", es: "El registro corrido de las decisiones y su porqué" },
    build: R => { const d = dDistrict(R, "principal"), calls = dCalls(R, "principal");
      if (!calls.length) return dBlank(R, DX("Meridian Labs", "Meridian Labs"));
      return [].concat(dHead(R, d, "Meridian Labs"),
        [{ h: DX("Why this log exists", "Para qué es esta bitácora") },
         { p: DX("A decision nobody wrote down gets re-argued every quarter. This is what was asked, what was chosen, and the reasoning at the time — not the reasoning we would like to have had.",
                "Una decisión que nadie apuntó se vuelve a discutir cada trimestre. Aquí está lo que se preguntó, lo que se decidió, y el razonamiento de ese momento — no el que nos gustaría haber tenido.") },
         { h: DX("The calls", "Las decisiones") }],
        dBody(calls),
        [{ h: DX("What this engagement covered", "Qué cubrió este encargo") },
         { kv: [[DX("Calls of record", "Decisiones de registro"), String(dFinal(calls).length)],
                [DX("Right first time", "Bien a la primera"), dClean(calls)],
                [DX("Concepts exercised", "Conceptos ejercitados"), String(dConcepts(calls).length)]] },
         { t: { head: [DX("Concept", "Concepto")], rows: dConcepts(calls).map(c => [c]) } },
         { note: DX("Fill in before sending: who owns each call now, and the date it gets revisited.",
                   "Antes de enviarlo: quién es dueño de cada decisión ahora, y la fecha en que se revisa.") },
         { blank: DX("Owner of record", "Responsable") },
         { blank: DX("Next review", "Próxima revisión") }]);
    } },

  /* ---------- 02 · Recommendation Memo — El Mercado Robles ---------- */
  mercado: {
    tmpl: "02",
    title: { en: "Recommendation Memo — El Mercado Robles", es: "Memo de recomendación — El Mercado Robles" },
    sub: { en: "What to build first, and why not the rest", es: "Qué construir primero, y por qué no lo demás" },
    build: R => { const d = dDistrict(R, "mercado"), calls = dCalls(R, "mercado");
      if (!calls.length) return dBlank(R, DX("El Mercado", "El Mercado"));
      return [].concat(dHead(R, d, "El Mercado Robles"),
        [{ h: DX("What you asked for", "Lo que nos pidió") },
         { p: DX("Eleven wants on a list on the counter: an order app, a robot for the phone, something that knows when the tomatoes turn, Instagram, a machine that says what to buy on Monday, a website, and the printer.",
                "Once deseos en una lista sobre el mostrador: una app de pedidos, un robot para el teléfono, algo que sepa cuándo se pican los tomates, Instagram, una máquina que diga qué comprar el lunes, una página web, y la impresora.") },
         { h: DX("What we recommend, and the order", "Lo que recomendamos, y en qué orden") }],
        dBody(calls),
        [{ h: DX("What we are NOT doing yet, and why", "Lo que NO vamos a hacer todavía, y por qué") },
         { p: DX("Everything else on the list stays on the list. It is not refused — it is queued behind the one thing that costs the most hours in a normal week.",
                "Todo lo demás de la lista se queda en la lista. No se rechaza — se forma detrás de lo que cuesta más horas en una semana normal.") },
         { h: DX("How we will know it worked", "Cómo vamos a saber si sirvió") },
         { blank: DX("The number, in the client's own units", "El número, en las unidades del cliente") },
         { blank: DX("Measured by", "Medido por") },
         { blank: DX("Reviewed on", "Se revisa el") }]);
    } },

  /* ---------- 06 · Process & Exception Map — Taller Herrera ---------- */
  taller: {
    tmpl: "06",
    title: { en: "Process & Exception Map — Taller Herrera", es: "Mapa de proceso y excepciones — Taller Herrera" },
    sub: { en: "How work flows, who signs, which step cannot be taken back", es: "Cómo fluye el trabajo, quién firma, qué paso no se puede deshacer" },
    build: R => { const d = dDistrict(R, "taller"), calls = dCalls(R, "taller");
      if (!calls.length) return dBlank(R, DX("Taller Herrera", "Taller Herrera"));
      return [].concat(dHead(R, d, "Taller Herrera"),
        [{ h: DX("What moves through it", "Qué pasa por aquí") },
         { p: DX("A car: street → write-up → lift → parts → sign-off → the call that says it is ready. The shop is bottlenecked by paper, not by hands.",
                "Un carro: calle → hoja del trabajo → rampa → refacciones → firma → la llamada que avisa que ya está. Al taller lo frena el papel, no las manos.") },
         { h: DX("The calls that shaped the map", "Las decisiones que formaron el mapa") }],
        dBody(calls),
        [{ h: DX("The steps that cannot be taken back", "Los pasos que no se pueden deshacer") },
         { t: { head: [DX("Step", "Paso"), DX("Why", "Por qué"), DX("Who owns it", "Quién es dueño")],
                rows: [[DX("Money out / a part ordered", "Dinero que sale / pieza pedida"), DX("The deposit on the old part is paid twice if it is wrong", "El core se paga dos veces si va mal"), ""],
                       [DX("A number sent to a customer", "Un número que sale al cliente"), DX("An estimate is a promise with a price on it", "Un presupuesto es una promesa con precio"), ""],
                       [DX("The sign-off on the write-up", "La firma de la hoja"), DX("It is where the master mechanic reads the job before the customer does", "Ahí el maestro lee el trabajo antes que el cliente"), ""]] } },
         { note: DX("Circle these on the copy that hangs by the counter. Nothing on this list runs without a person hitting send.",
                   "Circula estos en la copia que va junto al mostrador. Nada de esta lista corre sin que una persona le dé enviar.") },
         { h: DX("The wall copy", "La copia de la pared") },
         { blank: DX("Where it hangs", "Dónde se cuelga") },
         { blank: DX("Who updates it when a step changes", "Quién la actualiza cuando cambia un paso") }]);
    } },

  /* ---------- 01 · Process Discovery Notes — Panadería La Espiga ---------- */
  espiga: {
    tmpl: "01",
    title: { en: "Process Discovery Notes — Panadería La Espiga", es: "Notas de descubrimiento — Panadería La Espiga" },
    sub: { en: "Map the work before you understand it", es: "Mapea el trabajo antes de entenderlo" },
    build: R => { const d = dDistrict(R, "espiga"), calls = dCalls(R, "espiga");
      if (!calls.length) return dBlank(R, DX("La Espiga", "La Espiga"));
      return [].concat(dHead(R, d, "Panadería La Espiga"),
        [{ h: DX("Where the number is born", "Dónde nace el número") },
         { p: DX("Not at the register. At 3:45 in the morning, in a decision one person makes about how much to bake, from a strip of paper somebody else wrote at close.",
                "No en la caja. A las 3:45 de la mañana, en una decisión que toma una persona sobre cuánto hornear, a partir de una tira de papel que otra escribió al cerrar.") },
         { h: DX("What we found, and what we decided", "Lo que encontramos, y lo que decidimos") }],
        dBody(calls),
        [{ h: DX("The count nobody was asked for", "La cuenta que nadie pidió") },
         { p: DX("The data you need is usually already being collected by the person nobody asked. Add the missing column; do not add a new system.",
                "Los datos que necesitas casi siempre ya los junta la persona a la que nadie le preguntó. Agrega la columna que falta; no agregues un sistema nuevo.") },
         { blank: DX("Who counts what, and when", "Quién cuenta qué, y cuándo") },
         { blank: DX("The column we added", "La columna que agregamos") },
         { blank: DX("Waste, before and after", "La merma, antes y después") }]);
    } },

  /* ---------- 04 · Pilot Review — Limpieza Velázquez ---------- */
  velazquez: {
    tmpl: "04",
    title: { en: "Pilot Review — Limpieza Velázquez", es: "Revisión de piloto — Limpieza Velázquez" },
    sub: { en: "Did it pay off — and should we stop?", es: "¿Valió la pena — y deberíamos parar?" },
    build: R => { const d = dDistrict(R, "velazquez"), calls = dCalls(R, "velazquez");
      if (!calls.length) return dBlank(R, DX("Limpieza Velázquez", "Limpieza Velázquez"));
      return [].concat(dHead(R, d, "Limpieza Velázquez"),
        [{ h: DX("Did it matter", "¿Sirvió?") },
         { p: DX("Report the business number, in their units, not yours. Model metrics answer “is it behaving”; the client asked “did it matter”.",
                "Reporta el número del negocio, en sus unidades, no en las tuyas. Las métricas del modelo contestan “¿se está portando bien?”; el cliente preguntó “¿sirvió?”.") },
         { blank: DX("What we said we would move / before / now", "Lo que dijimos que íbamos a mover / antes / ahora") },
         { h: DX("The calls behind it", "Las decisiones detrás") }],
        dBody(calls),
        [{ h: DX("What people actually did", "Lo que la gente de veras hizo") },
         { p: DX("Adoption is the deliverable — a tool nobody uses saved nothing. This crew does not sit at desks, and it was rolled out one crew at a time, in their language.",
                "La adopción es el entregable — una herramienta que nadie usa no ahorró nada. Esta cuadrilla no está en escritorios, y salió cuadrilla por cuadrilla, en su idioma.") },
         { blank: DX("Used as intended / worked around / stopped using", "La usaron como iba / le dieron la vuelta / la dejaron") },
         { h: DX("Recommendation", "Recomendación") },
         { p: DX("Keep it as is · keep it with changes · hand it over · turn it off. Say it plainly, and say what we keep from it either way.",
                "Dejarla igual · dejarla con cambios · entregarla · apagarla. Dilo claro, y di qué nos quedamos de ella de cualquier modo.") },
         { blank: DX("Our recommendation, and why", "Nuestra recomendación, y por qué") },
         { note: DX("This is the hardest deliverable to write honestly: a pilot that did not pay off is information, and killing it cheaply is a win you should be able to say out loud.",
                   "Este es el entregable más difícil de escribir con honestidad: un piloto que no pagó es información, y matarlo barato es una victoria que deberías poder decir en voz alta.") }]);
    } },

  /* ---------- 07 · Answers / Refuses / Hands to — Nolasco Tax & Notario ---------- */
  nolasco: {
    tmpl: "07",
    title: { en: "What It Answers, What It Refuses, Who It Hands To — Nolasco Tax & Notario",
             es: "Qué contesta, qué se niega a contestar, a quién lo pasa — Nolasco Tax & Notario" },
    sub: { en: "Scope as three lists, tested, in both languages", es: "El alcance en tres listas, probado, en los dos idiomas" },
    build: R => { const d = dDistrict(R, "nolasco"), calls = dCalls(R, "nolasco");
      if (!calls.length) return dBlank(R, DX("Nolasco Tax & Notario", "Nolasco Tax & Notario"));
      return [].concat(dHead(R, d, "Nolasco Tax & Notario"),
        [{ h: DX("Why this document exists", "Para qué es este documento") },
         { p: DX("An assistant is about to speak to customers in the client's name. Scope is a list, not a mood: an instruction nudges, a gate stops. A refusal that names nobody is a hang-up.",
                "Un asistente va a hablarle a los clientes en nombre del despacho. El alcance es una lista, no un estado de ánimo: una instrucción sugiere, una compuerta detiene. Una negativa que no nombra a nadie es colgar el teléfono.") },
         { h: DX("The calls that drew the three lists", "Las decisiones que trazaron las tres listas") }],
        dBody(calls),
        [{ h: DX("What it answers", "Qué contesta") },
         { blank: DX("Question type / where the true answer lives", "Tipo de pregunta / dónde vive la respuesta verdadera") },
         { h: DX("What it refuses", "Qué se niega a contestar") },
         { blank: DX("Question type / the refusal, in both languages", "Tipo de pregunta / la negativa, en los dos idiomas") },
         { h: DX("Who it hands to", "A quién lo pasa") },
         { blank: DX("Goes to / how / with what attached / by when", "Va con / cómo / con qué adjunto / para cuándo") },
         { note: DX("Test it with the questions people actually ask, including the ones that are almost on the list. Write down what it said, not what it should have said.",
                   "Pruébalo con las preguntas que la gente de veras hace, incluyendo las que casi están en la lista. Apunta lo que dijo, no lo que debió decir.") }]);
    } },

  /* ---------- 03 · Acceptance Criteria — lives on the machine ---------- */
  accept: {
    tmpl: "03",
    title: { en: "Acceptance Criteria & Error Budget", es: "Criterios de aceptación y presupuesto de error" },
    sub: { en: "What “working” means before you build it", es: "Qué quiere decir “que funcione” antes de construirlo" },
    build: R => {
      const all = R.decisions.filter(e => /label|etiqueta|abuela|say it|así de cierto|churro/i.test(e.quest || ""));
      return [].concat(
        [{ h: DX("Why it is written first", "Por qué se escribe primero") },
         { p: DX("A success metric written after launch is a story, not a measurement. Name what working means in a number somebody already tracks, and name what a miss costs, before a line is built.",
                "Una métrica de éxito escrita después del lanzamiento es un cuento, no una medición. Nombra qué quiere decir que funcione, en un número que alguien ya lleva, y qué cuesta fallar, antes de construir una sola línea.") },
         { h: DX("The bar", "La vara") },
         { blank: DX("It is working when ___ (their number, their units)", "Funciona cuando ___ (su número, sus unidades)") },
         { blank: DX("A miss costs ___ · caught by ___", "Fallar cuesta ___ · lo detecta ___") },
         { blank: DX("We turn it off if ___", "La apagamos si ___") }],
        all.length ? [{ h: DX("Where you argued this in the field", "Dónde discutiste esto en la calle") }].concat(dBody(all)) : []);
    } },


  /* ---------- paper a neighbour puts in your hands ----------
     Owner, 2026-09-04: "no she says it and shows a fake doc- the important ones are the ones
     for AI roles but lets help me see it and live it."

     A quest node names one of these with `doc:"<id>"` and the card holds it out. They are
     entries here, not blobs inside a node, for one reason that outranks the rest: the smoke
     test compares quest STRUCTURE and never prose, so a document written twice in two quest
     files could drift between languages and ship green. Written once, with DX(en,es) on every
     line, that drift is impossible rather than merely caught.

     The rule for whether a node gets paper at all: the answer has to BE in the paper. If the
     document would only illustrate what the character already said, it does not exist. */

  /* ---------- q16 · Doña Chelo's list. Six months under the register, never once read ---------- */
  "lista-chelo": {
    tmpl: "",
    hand: { en: "📄 Take the list", es: "📄 Toma la lista" },
    title: { en: "La lista — the list on the counter", es: "La lista — la lista del mostrador" },
    sub: { en: "Eleven wants, in her hand, in the order they occurred to her",
           es: "Once deseos, de su puño y letra, en el orden en que se le fueron ocurriendo" },
    build: R => [
      { kv: [
        [DX("Kept by", "La lleva"), "Doña Chelo Robles"],
        [DX("Where", "Dónde"), DX("Under the register, folded twice", "Debajo de la caja, doblada dos veces")],
        [DX("Started", "Empezada"), DX("March", "En marzo")],
        [DX("Items", "Renglones"), "11"],
        [DX("Times anyone has read it", "Veces que alguien la ha leído"), DX("This is the first", "Esta es la primera")],
      ] },
      { p: DX("“I write it down so I stop thinking about it. Then I think about it anyway. Mijo — I am not asking for eleven things. I am asking you to tell me which one.”",
              "«Lo apunto para dejar de pensarlo. Y de todos modos lo pienso. Mijo — no le estoy pidiendo once cosas. Le estoy pidiendo que me diga cuál.»") },
      { h: DX("The list", "La lista") },
      { t: { head: ["№", DX("In her hand", "De su puño y letra"), DX("Added", "Apuntada")], rows: [
        ["1",  DX("An app for the orders", "Una app pa' los pedidos"), DX("March", "marzo")],
        ["2",  DX("A robot for the phone. To answer it.", "Un robot pa'l teléfono. Que conteste."), DX("March", "marzo")],
        ["3",  DX("Something that knows when the tomatoes turn", "Algo que sepa cuándo se pican los tomates"), DX("April", "abril")],
        ["4",  DX("Instagram (Perla's idea)", "Instagram (idea de Perla)"), DX("April", "abril")],
        ["5",  DX("A machine that tells me what to buy Monday", "Una máquina que me diga qué comprar el lunes"), DX("May", "mayo")],
        ["6",  DX("A website (my nephew says)", "Una página web (dice mi sobrino)"), DX("May", "mayo")],
        ["7",  DX("The printer", "La impresora"), DX("June — and again in July", "junio — y otra vez en julio")],
        ["8",  DX("That in December we don't run out of hoja de maíz", "Que en diciembre no se acabe la hoja de maíz"), DX("August. Every August.", "agosto. Todos los agostos.")],
        ["9",  DX("That the mole recipe doesn't die with me", "Que la receta del mole no se muera conmigo"), DX("no date", "sin fecha")],
        ["10", DX("That Chava hits the button that he should", "Que Chava le pique al botón que es"), DX("last week", "la semana pasada")],
        ["11", DX("That Nando doesn't spend forty minutes with the truck", "Que Nando no se tarde cuarenta minutos con el camión"), DX("last week", "la semana pasada")],
      ] } },
      { note: DX("Read it before you answer her. Two of the eleven are one want written twice, months apart. One of them is not a software problem at all.",
                 "Léala antes de contestarle. Dos de los once son un mismo deseo escrito dos veces, con meses de diferencia. Uno de ellos no es un problema de software.") },
      { h: DX("What we do first", "Con qué empezamos") },
      { blank: DX("The one we start with, and why that one", "Con cuál empezamos, y por qué ese") },
      { blank: DX("What it costs her in a normal week, in hours", "Qué le cuesta en una semana normal, en horas") },
      { blank: DX("Everything else — queued, not refused", "Todo lo demás — formado, no rechazado") },
    ] },

  /* ---------- q20 · the evaluation run. Every one it got wrong, it had already flagged ---------- */
  "eval-facturas": {
    tmpl: "03",
    hand: { en: "📄 Read the run sheet", es: "📄 Lee la hoja de la corrida" },
    title: { en: "Invoice reader — evaluation run 3", es: "Lector de facturas — corrida de evaluación 3" },
    sub: { en: "One hundred real invoices from this store, read blind, scored against Nando's counts",
           es: "Cien facturas reales de esta tienda, leídas a ciegas, calificadas contra las cuentas de Nando" },
    build: R => [
      { kv: [
        [DX("What was measured", "Qué se midió"), DX("Line quantities, read from the page", "Las cantidades de cada renglón, leídas de la hoja")],
        [DX("Sample", "Muestra"), DX("100 invoices, six weeks, every vendor who delivers here", "100 facturas, seis semanas, todos los proveedores que surten aquí")],
        [DX("The right answer came from", "La respuesta correcta salió de"), DX("Nando's counts, written before the model ran", "Las cuentas de Nando, apuntadas antes de correr el modelo")],
        [DX("Read right", "Bien leídas"), "97 / 100"],
        [DX("Run by", "Corrida por"), R.hero],
        [DX("Date", "Fecha"), R.dateStr],
      ] },
      { p: DX("Blind means the model never saw Nando's numbers. He counted the delivery the way he counts every delivery, the sheet went in a folder, and the model read the same pages afterward. Any accuracy measured against numbers the model helped produce is not accuracy, it is an echo.",
              "A ciegas quiere decir que el modelo nunca vio los números de Nando. Él contó la entrega como cuenta todas, la hoja se fue a una carpeta, y el modelo leyó las mismas páginas después. Cualquier exactitud medida contra números que el modelo ayudó a producir no es exactitud, es un eco.") },
      { h: DX("By vendor", "Por proveedor") },
      { t: { head: [DX("Vendor", "Proveedor"), DX("How the invoice arrives", "Cómo llega la factura"),
                    DX("Invoices", "Facturas"), DX("Read right", "Bien"), DX("Missed", "Falladas")], rows: [
        ["Abarrotera del Valle", DX("printed", "impresa"), "34", "34", "—"],
        ["Lácteos Santa Fe", DX("printed", "impresa"), "22", "22", "—"],
        ["Tortillería Guzmán", DX("handwritten, Spanish, always the same pad", "a mano, en español, siempre el mismo talonario"), "18", "18", "—"],
        ["Carnes Beto", DX("handwritten, English, item names wrong", "a mano, en inglés, con los nombres mal"), "14", "14", "—"],
        ["Pescadería El Faro", DX("handwritten — the word PESCADO and a number", "a mano — la palabra PESCADO y un número"), "12", "9", "3"],
        [DX("Total", "Total"), "", "100", "97", "3"],
      ] } },
      { h: DX("The three", "Las tres") },
      { t: { head: [DX("Date", "Fecha"), DX("What the page said", "Lo que decía la hoja"),
                    DX("What it read", "Lo que leyó"), DX("What it would have cost", "Lo que hubiera costado")], rows: [
        [DX("Tue 12th", "mar 12"), "12", "112", DX("Chelo ordered against a number that was not real", "Chelo pidió contra un número que no existía")],
        [DX("Fri 15th", "vie 15"), DX("40 (kilos)", "40 (kilos)"), "400", DX("Ten times the fish. There is no shelf for that.", "Diez veces el pescado. No hay estante para eso.")],
        [DX("Tue 26th", "mar 26"), DX("6 (boxes)", "6 (cajas)"), "8", DX("Two boxes paid for and never delivered", "Dos cajas pagadas que nunca llegaron")],
      ] } },
      { h: DX("How sure it was", "Qué tan segura estaba") },
      { t: { head: [DX("How sure the model said it was", "Qué tan segura dijo estar"), DX("Invoices", "Facturas"), DX("Read right", "Bien")], rows: [
        ["90–100%", "88", "88"],
        ["70–89%", "9", "9"],
        [DX("Under 70%", "Menos de 70%"), "3", "0"],
      ] } },
      { note: DX("Every invoice it got wrong, it had already said it was unsure about. That is a fact about this run, not a promise about the next one — re-run it every quarter, and the week any vendor changes their pad.",
                 "Cada factura que falló, ya había dicho que no estaba segura. Eso es un hecho de esta corrida, no una promesa de la siguiente — vuélvala a correr cada trimestre, y la semana en que cualquier proveedor cambie de talonario.") },
      { h: DX("The bar", "La vara") },
      { blank: DX("It is working when ___ (Chelo's number, Chelo's units)", "Funciona cuando ___ (el número de Chelo, en sus unidades)") },
      { blank: DX("A miss costs ___ · caught by ___ · within ___", "Fallar cuesta ___ · lo detecta ___ · en un plazo de ___") },
      { blank: DX("We turn it off if ___", "La apagamos si ___") },
    ] },

  /* ---------- q29 · the incident. The root cause is printed on the page, in its own instructions ---------- */
  "incidente-garantia": {
    tmpl: "",
    hand: { en: "📄 Read what it said", es: "📄 Lee lo que contestó" },
    title: { en: "Incident — the intake assistant answered a warranty question",
             es: "Incidente — el asistente de recepción contestó una pregunta de garantía" },
    sub: { en: "What was asked, what it said, who found out, what is still open",
           es: "Qué se preguntó, qué contestó, quién se enteró, qué sigue abierto" },
    build: R => [
      { kv: [
        [DX("Incident", "Incidente"), "TH-0007"],
        [DX("Opened by", "Levantado por"), DX("Yesenia Herrera, service writer", "Yesenia Herrera, recepción de servicio")],
        [DX("System", "Sistema"), DX("Intake assistant — describes the problem, books a slot", "Asistente de recepción — describe la falla, aparta cita")],
        [DX("How bad", "Qué tan grave"), DX("A customer acted on a wrong answer. No money has moved yet.", "Una clienta actuó sobre una respuesta equivocada. Todavía no se mueve dinero.")],
        [DX("Who it reached", "Hasta dónde llegó"), DX("One customer, and whoever she has told since", "Una clienta, y a quien se lo haya contado desde entonces")],
        [DX("Status", "Estado"), DX("Open — the rule is not written yet", "Abierto — la regla todavía no se escribe")],
      ] },
      { p: DX("A customer asked whether a repair was covered under her warranty. The assistant told her it most likely was. It is not covered, it was never covered, and nobody at this shop said so until she called back. The assistant was not broken. It was told to be helpful and it was.",
              "Una clienta preguntó si una reparación entraba en su garantía. El asistente le dijo que lo más probable es que sí. No entra, nunca entró, y nadie del taller se lo dijo hasta que ella volvió a llamar. El asistente no estaba descompuesto. Le dijeron que fuera servicial y lo fue.") },
      { h: DX("What was said, word for word", "Lo que se dijo, palabra por palabra") },
      { t: { head: [DX("Time", "Hora"), DX("Who", "Quién"), DX("What was said", "Qué se dijo")], rows: [
        ["10:14", DX("Customer", "Clienta"), DX("“hi is this covered under my warranty? 2016 Silverado, the AC”", "«hola esto entra en mi garantía? Silverado 2016, el aire»")],
        ["10:14", DX("Assistant", "Asistente"), DX("“Yes, most likely. Warranty usually covers air conditioning components. Would you like to book a time?”", "«Sí, lo más probable es que sí. La garantía normalmente cubre los componentes del aire acondicionado. ¿Le aparto una cita?»")],
        ["10:15", DX("Customer", "Clienta"), DX("“yes thursday”", "«sí el jueves»")],
        ["10:15", DX("Assistant", "Asistente"), DX("“Booked, Thursday 8:00. See you then.”", "«Apartada, jueves 8:00. Ahí la esperamos.»")],
        ["16:40", DX("Her sister, by phone", "Su hermana, por teléfono"), DX("“so it's covered, right? she already told everybody”", "«entonces sí entra, ¿verdad? ya le dijo a todo mundo»")],
      ] } },
      { h: DX("What it was told to be", "Lo que le dijeron que fuera") },
      { p: DX("The whole instruction, as it stands today: “You are the service assistant for Taller Herrera. Be helpful and friendly. Help customers with their car problems.” There is no list in it of what it may do, and no list of what it may not.",
              "La instrucción completa, tal como está hoy: «Eres el asistente de servicio de Taller Herrera. Sé servicial y amable. Ayuda a los clientes con los problemas de su carro.» No trae lista de lo que puede hacer, ni lista de lo que no.") },
      { h: DX("The same week, three more", "La misma semana, otras tres") },
      { t: { head: [DX("Day", "Día"), DX("What was asked", "Qué preguntaron"), DX("What it did", "Qué hizo")], rows: [
        [DX("Mon", "lun"), DX("“do you take my insurance?”", "«¿aceptan mi aseguranza?»"), DX("Answered: “We work with most insurers.” Nobody has checked whether that is true.", "Contestó: «Trabajamos con la mayoría de las aseguradoras.» Nadie ha revisado si eso es cierto.")],
        [DX("Wed", "mié"), DX("“how much is a transmission?”", "«¿cuánto sale una transmisión?»"), DX("Gave a range. A number left the building without Tacho seeing the car.", "Dio un rango. Salió un número del taller sin que Tacho viera el carro.")],
        [DX("Thu", "jue"), DX("“is it still under the powertrain thing?”", "«¿todavía entra en lo del tren motriz?»"), DX("Handed it to Yesenia. It handed off because the word warranty was not in the sentence.", "Se lo pasó a Yesenia. Se lo pasó porque la palabra garantía no venía en la frase.")],
      ] } },
      { note: DX("An incident is not a scolding. It is the cheapest requirements document a shop will ever get. File one for every answer that should not have been given — including the ones that turned out to be right.",
                 "Un incidente no es un regaño. Es el documento de requerimientos más barato que va a tener un taller. Levanta uno por cada respuesta que no se debió dar — incluyendo las que resultaron correctas.") },
      { h: DX("What has to be written before this can happen again", "Lo que hay que escribir antes de que se repita") },
      { blank: DX("What it may do — the whole list, nothing implied", "Qué sí puede hacer — la lista completa, nada sobreentendido") },
      { blank: DX("What it hands off, and how the question travels with it", "Qué pasa a una persona, y cómo viaja la pregunta con ello") },
      { blank: DX("Who it hands to, by name", "A quién se lo pasa, por su nombre") },
      { blank: DX("Re-tested on ___ with ___ questions", "Se vuelve a probar el ___ con ___ preguntas") },
    ] },

  /* ---------- q36 · drift. The "off by" column steps at week five and never comes back ---------- */
  "deriva-espiga": {
    tmpl: "",
    hand: { en: "📄 Read the sheet", es: "📄 Lee la hoja" },
    title: { en: "The sheet against the trash — concha, ten weeks",
             es: "La hoja contra la basura — concha, diez semanas" },
    sub: { en: "What the sheet said, what sold, what went in the bin — by week",
           es: "Lo que dijo la hoja, lo que se vendió, lo que se fue al bote — por semana" },
    build: R => [
      { kv: [
        [DX("Item", "Producto"), DX("Concha — the only one with ten weeks behind it", "Concha — la única con diez semanas encima")],
        [DX("Where the numbers come from", "De dónde salen los números"), DX("Sol's strip at close, photographed nightly, plus the sold-out column", "La tira de Sol al cerrar, fotografiada cada noche, más la columna de la hora en que se acabó")],
        [DX("Kept by", "La lleva"), DX("Sol at close · Tito at 3:45 · Licha on Sundays", "Sol al cerrar · Tito a las 3:45 · Licha los domingos")],
        [DX("Averages are", "Los promedios son"), DX("per day, six days a week", "por día, seis días a la semana")],
        [DX("Printed", "Impresa"), R.dateStr],
      ] },
      { p: DX("One row per week. “Off by” is what the sheet said minus what actually sold — positive means the sheet asked for bread that nobody bought. Read that one column top to bottom before you read anything else on this page.",
              "Un renglón por semana. «Se pasó por» es lo que dijo la hoja menos lo que de veras se vendió — en positivo quiere decir que la hoja pidió pan que nadie compró. Lea esa columna de arriba abajo antes de leer cualquier otra cosa de esta hoja.") },
      { h: DX("Ten weeks", "Diez semanas") },
      { t: { head: [DX("Week", "Semana"), DX("Sheet said", "Dijo la hoja"), DX("Sold", "Se vendió"),
                    DX("Off by", "Se pasó por"), DX("In the bin", "Al bote")], rows: [
        ["1",  "28", "27", "+1", "2"],
        ["2",  "28", "28", "0",  "1"],
        ["3",  "27", "26", "+1", "2"],
        ["4",  "28", "27", "+1", "2"],
        ["5",  "28", "22", "+6", "7"],
        ["6",  "28", "21", "+7", "8"],
        ["7",  "28", "20", "+8", "9"],
        ["8",  "28", "21", "+7", "8"],
        ["9",  "27", "20", "+7", "8"],
        ["10", "28", "20", "+8", "9"],
      ] } },
      { kv: [
        [DX("Mornings sold out before noon — weeks 1 to 4", "Mañanas en que se acabó antes del mediodía — semanas 1 a 4"), "5"],
        [DX("Mornings sold out before noon — weeks 5 to 10", "Mañanas en que se acabó antes del mediodía — semanas 5 a 10"), "0"],
        [DX("Bread in the bin, first four weeks", "Pan al bote, primeras cuatro semanas"), DX("about 7 a week", "unas 7 por semana")],
        [DX("Bread in the bin, last six weeks", "Pan al bote, últimas seis semanas"), DX("about 49 a week", "unas 49 por semana")],
      ] },
      { h: DX("What happened on the street, by week", "Qué pasó en la calle, por semana") },
      { t: { head: [DX("Week", "Semana"), DX("On the street", "En la calle")], rows: [
        ["5", DX("Tuesday: the place with the drive-through put up its bakery sign at the north end", "Martes: el del autoservicio puso su letrero de panadería en la punta norte")],
        ["7", DX("The track crew starts buying forty bolillos at five. Different sheet; the only number that went up.", "La cuadrilla de la vía empieza a llevar cuarenta bolillos a las cinco. Otra hoja; el único número que subió.")],
        ["9", DX("School out Thursday and Friday", "No hubo escuela jueves y viernes")],
        ["10", DX("Rain Monday, all day", "Llovió el lunes, todo el día")],
      ] } },
      { note: DX("Noise wanders around zero. Something else steps and stays. Nothing on this page says which of the two you are looking at — that is your call, and it is the whole reason the page exists.",
                 "El ruido va y viene alrededor del cero. Otra cosa da un escalón y se queda. Esta hoja no dice cuál de las dos está viendo — esa es su decisión, y por eso existe la hoja.") },
      { blank: DX("What we think happened, and on what date", "Qué creemos que pasó, y en qué fecha") },
      { blank: DX("What we do about it", "Qué vamos a hacer") },
      { blank: DX("How we will know within two weeks whether it worked", "Cómo vamos a saber en dos semanas si sirvió") },
    ] },

  /* ---------- q41 · the old lead's rollout plan, taped in the glovebox. Page 1 of his 4 ---------- */
  "plan-viejo": {
    tmpl: "",
    hand: { en: "📄 Read the taped page", es: "📄 Lee la hoja pegada" },
    title: { en: "FIELD APP — ROLLOUT PLAN (v1)", es: "APP DE CAMPO — PLAN DE IMPLEMENTACIÓN (v1)" },
    sub: { en: "Taped inside the glovebox. Nobody ever took it down.",
           es: "Pegada por dentro de la guantera. Nadie la quitó nunca." },
    build: R => [
      { kv: [
        [DX("Prepared for", "Preparado para"), "Limpieza Velázquez"],
        [DX("Prepared by", "Preparado por"), DX("Meridian Labs — AI lead", "Meridian Labs — líder de IA")],
        [DX("Crew size", "Tamaño de la cuadrilla"), DX("9 cleaners · 3 vans · 12 sites", "9 personas de limpieza · 3 camionetas · 12 sitios")],
        [DX("Go-live", "Arranque"), DX("Week 3", "Semana 3")],
        [DX("Status", "Estado"), "—"],
      ] },
      { p: DX("Objective: replace paper shift sheets with the field app across all crews within four weeks, giving the office a single record of completed work and a defensible proof-of-service trail for client disputes.",
              "Objetivo: sustituir las hojas de turno en papel por la app de campo en todas las cuadrillas en cuatro semanas, para darle a la oficina un registro único del trabajo terminado y una prueba de servicio defendible ante reclamos de clientes.") },
      { h: DX("Schedule", "Calendario") },
      { t: { head: [DX("Week", "Semana"), DX("What happens", "Qué pasa"), DX("Owner", "Responsable")], rows: [
        ["1", DX("Accounts created for all nine cleaners", "Se crean cuentas para las nueve personas"), DX("Office", "Oficina")],
        ["2", DX("Thirty-minute training, Saturday morning", "Capacitación de treinta minutos, sábado por la mañana"), DX("Office", "Oficina")],
        ["3", DX("App becomes mandatory. Paper shift sheets no longer accepted.", "La app se vuelve obligatoria. Ya no se aceptan hojas de turno en papel."), DX("Office", "Oficina")],
        ["4", DX("Review adoption and report to ownership", "Se revisa la adopción y se reporta a la dueña"), DX("Office", "Oficina")],
      ] } },
      { h: DX("Required at clock-out", "Obligatorio al checar salida") },
      { t: { head: [DX("Requirement", "Requisito"), DX("Required", "Obligatorio"), DX("Reason given", "Razón que da el plan")], rows: [
        [DX("A photo of every room", "Foto de cada cuarto"), DX("yes", "sí"), DX("Proof of service for client disputes", "Prueba de servicio para reclamos de clientes")],
        [DX("Each photo location-stamped", "Cada foto con la ubicación marcada"), DX("yes", "sí"), DX("Confirms the crew was on site", "Confirma que la cuadrilla estuvo en el sitio")],
        [DX("Shift closed in the app before clock-out", "Turno cerrado en la app antes de checar salida"), DX("yes", "sí"), DX("Payroll accuracy", "Exactitud de la nómina")],
        [DX("Interface language", "Idioma de la interfaz"), DX("English", "inglés"), DX("One version to train and support", "Una sola versión para capacitar y dar soporte")],
      ] } },
      { h: DX("How we will know it worked", "Cómo vamos a saber que sirvió") },
      { kv: [
        [DX("Success measure", "Medida de éxito"), DX("9 of 9 accounts logged in by week 4", "9 de 9 cuentas con sesión iniciada para la semana 4")],
        [DX("Reviewed by", "Lo revisa"), DX("Ownership, monthly", "La dueña, cada mes")],
        [DX("Who was asked before this was written", "A quién se le preguntó antes de escribir esto"), "—"],
      ] },
      { blank: DX("Adoption at week 4", "Adopción en la semana 4") },
      { note: DX("Written in ballpoint across the bottom, in a hand that is not the typist's: «Semana 3 — nadie.»",
                 "Escrito con pluma a lo ancho del pie de página, con una letra que no es la de la máquina: «Semana 3 — nadie.»") },
    ] },

  /* ---------- q53 · Bere's fifty-two. The twelve it must REFUSE are the product ---------- */
  "prueba-52": {
    tmpl: "07",
    hand: { en: "📄 Read the fifty-two", es: "📄 Lee las cincuenta y dos" },
    title: { en: "The 52 — what it must answer, what it must refuse",
             es: "Las 52 — lo que debe contestar y lo que debe negarse a contestar" },
    sub: { en: "Bere's sheet. Every one of these was asked at this counter this year.",
           es: "La hoja de Bere. Todas y cada una se preguntaron en este mostrador este año." },
    build: R => [
      { kv: [
        [DX("Written by", "La escribió"), DX("Bere Alcántara, intake", "Bere Alcántara, recepción")],
        [DX("Office", "Despacho"), "Nolasco Tax & Notario"],
        [DX("Rows", "Renglones"), DX("52 — 40 it must answer, 12 it must not", "52 — 40 que debe contestar, 12 que no debe")],
        [DX("Both languages", "En los dos idiomas"), DX("Every row is run in the language it was asked in", "Cada renglón se corre en el idioma en que se preguntó")],
        [DX("Run by / date", "Corrida por / fecha"), "—"],
      ] },
      { p: DX("“I did not invent any of these. I went back through a year of the ones I wrote down and split them into the ones I could answer from a sheet on the licenciado's desk, and the ones where I had to go get him. Those twelve are the ones that matter. Anybody can make a machine talk.”",
              "«No me inventé ninguna. Me eché para atrás un año de las que fui apuntando y las partí en las que podía contestar con una hoja del escritorio del licenciado, y las que me obligaban a ir por él. Esas doce son las que importan. Hacer hablar a una máquina lo hace cualquiera.»") },
      { h: DX("The forty it must answer", "Las cuarenta que debe contestar") },
      { t: { head: [DX("What it is about", "De qué se trata"), DX("How many", "Cuántas"),
                    DX("Where the true answer lives", "Dónde vive la respuesta verdadera"),
                    DX("Example, in the words people use", "Ejemplo, como lo dice la gente")], rows: [
        [DX("Hours and when he is in", "Horarios y cuándo está él"), "9",  DX("Sheet A", "Hoja A"), "“¿A qué hora abren el sábado?”"],
        [DX("Parking and the stairs", "Estacionamiento y las escaleras"), "4", DX("Sheet A", "Hoja A"), "“is there parking”"],
        [DX("What to bring", "Qué papeles traer"), "11", DX("Sheet B — the intake list", "Hoja B — la lista de recepción"), "“qué papeles llevo para los taxes”"],
        [DX("What he does and does not do", "Qué hace y qué no hace"), "8", DX("Sheet C — the sign", "Hoja C — el letrero"), "“do you do divorces”"],
        [DX("Fees and how long it takes", "Costos y cuánto tarda"), "5", DX("Sheet D", "Hoja D"), "“how much for a notarización”"],
        [DX("Language and appointments", "Idioma y citas"), "3", DX("Sheet A", "Hoja A"), "“¿hay alguien que hable español?”"],
        [DX("Total", "Total"), "40", "", ""],
      ] } },
      { h: DX("The twelve it must not answer", "Las doce que no debe contestar") },
      { t: { head: ["№", DX("Asked exactly like this", "Preguntada exactamente así"), DX("What it must do", "Qué debe hacer")], rows: [
        ["1",  "“Can I claim my nephew who lives with me?”", DX("Hand off", "Pasarla")],
        ["2",  "“¿Puedo poner a mi mamá como dependiente? Vive en México.”", DX("Hand off", "Pasarla")],
        ["3",  DX("“Should I get an ITIN or wait for my papers?”", "«¿Saco el ITIN o espero mis papeles?»"), DX("Explain the ITIN from the sheet · hand off the rest", "Explicar el ITIN con la hoja · pasar lo demás")],
        ["4",  "“Mi ex y yo los dos reclamamos a la niña. ¿Qué hago?”", DX("Hand off", "Pasarla")],
        ["5",  DX("“Just tell me what to put on line 12” (photo of a return attached)", "«Nomás dígame qué pongo en la línea 12» (con foto de una declaración)"), DX("Hand off", "Pasarla")],
        ["6",  "“¿Es usted notario?”", DX("The sign, verbatim, both languages · then hand off by name", "El letrero, textual, en los dos idiomas · luego pasarla con nombre")],
        ["7",  "“Can you notarize this if I sign it at home later?”", DX("Hand off", "Pasarla")],
        ["8",  "“How do I get my kid a Social?”", DX("Hand off", "Pasarla")],
        ["9",  "“¿Me conviene poner el negocio a nombre de mi hijo?”", DX("Hand off", "Pasarla")],
        ["10", "“I got a letter from the IRS. Is it bad?”", DX("Hand off", "Pasarla")],
        ["11", "“¿Me hace una carta de que llevo cinco años viviendo aquí?”", DX("Hand off", "Pasarla")],
        ["12", "“My friend does taxes for cash — is that ok?”", DX("Hand off", "Pasarla")],
      ] } },
      { note: DX("Not one of the twelve is a trick question. Every one was asked by somebody standing at this counter, in these words, this year. That is the half of the test that matters.",
                 "Ninguna de las doce es una pregunta con trampa. Todas se las hizo alguien parado en este mostrador, con estas palabras, este año. Esa es la mitad de la prueba que importa.") },
      { h: DX("Before anything is run", "Antes de correr nada") },
      { blank: DX("It passes the forty when ___", "Pasa las cuarenta cuando ___") },
      { blank: DX("It passes the twelve when ___", "Pasa las doce cuando ___") },
      { blank: DX("We run all fifty-two again whenever ___", "Volvemos a correr las cincuenta y dos cada vez que ___") },
      { blank: DX("Who signs off that it may talk to a client", "Quién firma que ya puede hablarle a un cliente") },
    ] },

  /* ---------- the machine on the old lead's desk ---------- */
  file: {
    tmpl: "",
    title: { en: "The desk of the AI lead who left", es: "El escritorio del líder de IA que se fue" },
    sub: { en: "Still logged in. Nobody cleared it.", es: "Sigue con la sesión abierta. Nadie lo limpió." },
    build: R => {
      const words = [
        ["the assistant / el asistente", DX("The thing you build for a business. It is not smart. It is well-fed: it can only answer from what somebody put in front of it.",
                                           "La cosa que le construyes a un negocio. No es lista. Está bien alimentada: nada más contesta con lo que alguien le puso enfrente.")],
        ["the sheet / la hoja", DX("One page a business can read from the door. If it needs a login to read, it is not the sheet.",
                                  "Una hoja que el negocio puede leer desde la puerta. Si necesita contraseña para leerse, no es la hoja.")],
        ["the book / el libro", DX("The paper record somebody keeps by hand because the system never held it. Read it before you replace it — every column is an exception that once went wrong.",
                                  "El registro de papel que alguien lleva a mano porque el sistema nunca lo guardó. Léelo antes de reemplazarlo — cada columna es una excepción que alguna vez salió mal.")],
        ["the workaround / el atajo", DX("Somebody already solved this badly-but-correctly. It IS the requirements document.",
                                        "Alguien ya lo resolvió mal-pero-bien. ESE es el documento de requerimientos.")],
        ["par / el par", DX("The fixed number of a thing you make each day, so the blame stops landing on whoever guessed.",
                           "El número fijo de algo que haces cada día, para que la culpa deje de caerle al que adivinó.")],
        ["merma", DX("What you threw away. The bakery's own word, in both languages, and the only honest measure of a forecast.",
                    "Lo que tiraste. La palabra de la panadería, y la única medida honesta de un pronóstico.")],
        ["comeback / el regreso", DX("A car that comes back. The number a shop is really run on.",
                                    "Un carro que regresa. El número con el que de veras se maneja un taller.")],
        ["core charge / el core", DX("The deposit on the old part. Send the wrong one back and you pay it twice.",
                                    "El depósito de la pieza vieja. Manda la equivocada de regreso y lo pagas dos veces.")],
        ["punch list / la lista de faltantes", DX("What is still not done, written by the person who will be blamed for it.",
                                                 "Lo que todavía falta, escrito por quien va a cargar con la culpa.")],
        ["acknowledgment / el reconocimiento de firma", DX("A notary's stamp says you signed in front of them. It does not say the paper is true.",
                                                          "El sello del notario dice que firmaste frente a él. No dice que el papel sea cierto.")],
      ];
      const owned = R.districts.filter(d => d.closed || dCalls(R, d.id).length);
      /* only paper somebody actually held out to you — recorded when it was offered, not
         guessed from which quests you started. The order is the pack's, so the file reads
         the same way twice. */
      const HANDED = ["lista-chelo", "eval-facturas", "incidente-garantia",
                      "deriva-espiga", "plan-viejo", "prueba-52"];
      const handed = HANDED.filter(id => (R.handed || []).indexOf(id) >= 0);
      return [
        { h: DX("A note taped inside the lid", "Una nota pegada por dentro de la tapa") },
        { p: DX("“If you are reading this, they gave you my desk. Three things I got wrong, in order: I built the biggest thing on the list because it was the biggest thing on the list. I automated the step where the money leaves. And I never once wrote down what I meant by working. — the one before you”",
               "“Si estás leyendo esto, te dieron mi escritorio. Tres cosas en las que me equivoqué, en orden: construí lo más grande de la lista porque era lo más grande de la lista. Automaticé el paso donde sale el dinero. Y ni una sola vez apunté qué quería decir con que funcionara. — el de antes”") },
        { h: DX("The file", "El expediente") },
        { p: DX("Everything this office has produced. The ones on the wall are here too — the wall is the shortcut, this is the file.",
               "Todo lo que ha producido esta oficina. Las de la pared también están aquí — la pared es el atajo, esto es el expediente.") },
        { docs: ["labs", "mercado", "taller", "espiga", "velazquez", "nolasco", "accept"] },
      ].concat(handed.length ? [
        { h: DX("What people handed you", "Lo que la gente te dio") },
        { p: DX("Their paper, not yours — the eleven-item list, the run sheet, the page taped in a glovebox. It stays in the file. You do not get to give it back, and having read it first is the only reason the pages above are worth anything.",
               "Su papel, no el tuyo — la lista de once renglones, la hoja de la corrida, la página pegada en una guantera. Se queda en el expediente. No se devuelve, y haberlo leído primero es la única razón por la que valen algo las páginas de arriba.") },
        { docs: handed },
      ] : []).concat([
        { h: DX("The words, so you can look them up twice", "Las palabras, para poder buscarlas dos veces") },
        { p: DX("Every one of these was given to you by the person who needed it, in the middle of a job. They are the trade's own language, not ours.",
               "Cada una te la dio la persona que la necesitaba, a media chamba. Son el idioma del oficio, no el nuestro.") },
        { t: { head: [DX("Word", "Palabra"), DX("What it means", "Qué quiere decir")], rows: words } },
        { h: DX("Where you have worked", "Dónde has trabajado") },
        { t: { head: [DX("Business", "Negocio"), DX("Practising", "Practicando"), DX("Calls of record", "Decisiones"), DX("Right first time", "Bien a la primera")],
               rows: owned.length ? owned.map(d => [(d.industry || d.id), (d.role || ""), String(dFinal(dCalls(R, d.id)).length), dClean(dCalls(R, d.id))])
                                  : [[DX("— nothing yet —", "— nada todavía —"), "", "", ""]] } },
      ]);
    } },
};
DOCS.portero=PORTERO_DOC; /* the gate sheet, registered once DOCS exists (#8) */
