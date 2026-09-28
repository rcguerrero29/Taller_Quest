/* ============================================================================
   EL CUARTO DE ARRIBA — the room interview (Meridian pack)

   Two neighbours stand in the bare office upstairs and ask the player what the
   room should be. There is no right answer, no score, no XP; nothing here lands
   in the career report. What the player says becomes a plain sheet with a Copy
   button — that sheet is the whole back-and-forth (owner, 2026-09-02: "lets make
   it so that [partner] can interact through the characters with you if possible ... i
   dont want an api setup"). The owner hands the sheet to whoever builds the room.

   Everything with a name lives HERE. The engine reads only shapes — hosts, steps,
   opts, ui — and a pack that declares no INTERVIEW gets no people, no tab, no
   storage key (the off-switch law: a feature that cannot be switched off is built wrong).

   Dialogue: Nacho (story director) wrote the words, 2026-09-02; trimmed for a
   phone by three reviewers: a host speaks two sentences, an answer fits one line,
   the office has stairs and no door, nobody is addressed as "jefe". The window
   is real since 2026-09-02 (art.js) — Güero's line states a fact, and the three
   views are all north-true. Lines a [partner] pack should rewrite:
   Xochi and Rosa are Meridian people; "somebody's mom" is deliberately nobody's.
   ============================================================================ */
const INTERVIEW={
  title:{en:"The room upstairs",es:"El cuarto de arriba"},
  place:{en:"Floor 2, Meridian Labs",es:"Piso 2, Meridian Labs"},
  /* toasted on arrival in the hosts' room while a question is still unanswered */
  invite:{en:"Nacho and Don Güero are waiting — they have questions for you.",
          es:"Nacho y Don Güero te esperan — tienen preguntas para ti."},
  /* the words on the card and the sheet, in both languages, in lockstep */
  ui:{
    en:{tag:"Design talk",why:"Why I'm asking",
        free:"None of those — let me say it my way",later:"That's enough for now",
        freeTitle:"Say it your way",freeLb:"One sentence is plenty.",ok:"Write it down",cancel:"Never mind",
        noted:"Written down.",again:"Ask me again",copy:"Copy the sheet",
        copied:"Copied — hand it to whoever is building.",copyFail:"Long-press the sheet to copy it.",
        back:"Back to the office",tab:"The room",
        hint:"What you told Nacho and Don Güero, in your words. Copy it and hand it to whoever builds the room.",
        by:"asked by",saidOut:"— wants to tell you this one out loud. Go ask.",earlier:"earlier",
        unanswered:"Not answered yet",none:"nothing — every question answered.",
        foot:"Answers live on the phone they were given on."},
    es:{tag:"Plática de diseño",why:"Por qué te pregunto",
        free:"Ninguna — te lo digo con mis palabras",later:"Ya, por ahora",
        freeTitle:"Dilo a tu manera",freeLb:"Con una frase basta.",ok:"Anótalo",cancel:"Mejor no",
        noted:"Anotado.",again:"Pregúntame otra vez",copy:"Copiar la hoja",
        copied:"Copiado — dásela a quien vaya a construir.",copyFail:"Deja el dedo sobre la hoja para copiarla.",
        back:"Volver a la oficina",tab:"El cuarto",
        hint:"Lo que le dijiste a Nacho y a Don Güero, con tus palabras. Cópialo y dáselo a quien construya el cuarto.",
        by:"preguntaron",saidOut:"— esta te la quiere decir de viva voz. Ve y pregúntale.",earlier:"antes",
        unanswered:"Todavía sin contestar",none:"nada — contestó todas.",
        foot:"Las respuestas viven en el teléfono donde se dieron."}
  },
  hosts:[
    /* Nacho came up from Calle Principal to sketch the wall; he asks how the room
       should FEEL. His street body is gone on purpose — one Nacho, not two. Both hosts
       stand where the stairs let you out can SEE them in 3D (arrival is (14,14), the top of the flight). */
    {id:"nacho",emoji:"🖌️",name:{en:"Nacho · Mural Painter",es:"Nacho · Muralista"},
     world:"f2",x:15,y:8,look:{shirt:"#4B7FB3",skin:"#C08356",hair:"#26202B",style:"afro"},
     talk:{en:"Before you unpack",es:"Antes de desempacar"}, /* was "An empty room" — it is not, since the boxes (Don Güero's proposal; Nacho may rename) */
     steps:[
      {id:"desk",
       say:{en:"Look at it before it's yours. That desk was his — the one before you — and nobody's moved it.",
            es:"Míralo antes de que sea tuyo. Ese escritorio era de él — el de antes de ti — y nadie lo ha movido."},
       why:{en:"A room you inherit is already telling a story. The first decision is never what to add — it's what stays.",
            es:"Un cuarto heredado ya está contando una historia. La primera decisión nunca es qué agregar — es qué se queda."},
       q:{en:"The desk that isn't yours. What do we do with it?",es:"El escritorio que no es tuyo. ¿Qué hacemos con él?"},
       opts:[{en:"It stays. I'll sit at it.",es:"Que se quede. Ahí me siento."},
             {en:"Push it to the wall, leave his folder on top.",es:"Pégalo a la pared y déjale su carpeta encima."},
             {en:"Take it out. I want my own.",es:"Sácalo. Yo quiero el mío."}]},
      {id:"verb",
       say:{en:"Now the easy ones — there's no wrong answer here. I'm not testing you, I'm writing you down.",
            es:"Ahora las fáciles — aquí no hay respuesta mala. No te estoy calificando, te estoy anotando."},
       why:{en:"Every room is really a verb. Name the verb and the furniture picks itself.",
            es:"Todo cuarto en realidad es un verbo. Nombra el verbo y los muebles se escogen solos."},
       q:{en:"What do you come up here to do?",es:"¿A qué subes tú aquí?"},
       opts:[{en:"Work. Real work, nobody bothering me.",es:"A trabajar. En serio, sin que nadie moleste."},
             {en:"Make things. Spread it all out, get messy.",es:"A hacer cosas. A regar todo y ensuciarme."},
             {en:"Nothing. I come up here to be quiet.",es:"A nada. Subo a estar en paz."}]},
      {id:"look",
       say:{en:"Somebody's going to come up those stairs for the first time. They get one look before they decide what this place is.",
            es:"Alguien va a subir esas escaleras por primera vez. Tiene una sola mirada antes de decidir qué es este lugar."},
       why:{en:"One look, no sign on the wall. If a stranger can't name it, it isn't finished — same rule as a mural.",
            es:"Una mirada, sin letrero. Si un desconocido no sabe nombrarlo, no está terminado — la misma regla que un mural."},
       q:{en:"First look from the stairs — what do they see?",es:"Primera mirada desde las escaleras — ¿qué ven?"},
       opts:[{en:"Plants. So many it's basically outside.",es:"Plantas. Tantas que ya casi es la calle."},
             {en:"A wall covered in paper — everything I'm working on.",es:"Una pared llena de papeles — todo lo que estoy haciendo."},
             {en:"The window. Straight down the room, and nothing in the way.",es:"La ventana. Derechito al fondo, y nada estorbando."}]},
      {id:"sound",
       say:{en:"Close your eyes a second. I do this before every wall, don't laugh.",
            es:"Cierra los ojos tantito. Yo hago esto antes de cada pared, no te rías."},
       why:{en:"You can't paint a sound. But tell me what a room sounds like and I know what's in it.",
            es:"Un sonido no se puede pintar. Pero dime a qué suena un cuarto y ya sé qué tiene adentro."},
       q:{en:"What does it sound like up here?",es:"¿A qué suena aquí arriba?"},
       opts:[{en:"Music. There's always something playing.",es:"A música. Siempre hay algo sonando."},
             {en:"The street. Traffic, the trolley, somebody's dog.",es:"A la calle. Coches, el tranvía, el perro de alguien."},
             {en:"Almost nothing. That's the point.",es:"A casi nada. Ese es el chiste."}]},
      {id:"never",
       say:{en:"Last one from me. It's the one that tells me the most, so take your time.",
            es:"La última mía. Es la que más me dice, así que tómate tu tiempo."},
       why:{en:"What a person keeps out is sharper than what they let in. It tells me what the room is protecting.",
            es:"Lo que una persona deja afuera dice más que lo que deja entrar. Me dice qué está cuidando el cuarto."},
       q:{en:"One thing that never comes up here. Ever.",es:"Una cosa que nunca sube aquí. Nunca."},
       opts:[{en:"Nothing that beeps at me.",es:"Nada que me haga bip."},
             {en:"No clock. I don't want to know.",es:"Reloj no. No quiero saber la hora."},
             {en:"No mess. Everything has a place.",es:"Desorden no. Todo tiene su lugar."}]}
     ],
     done:{en:"Nacho pins the sheet to the frame of the new window, where the north light hits it. “My wall downstairs faces the street — everything you already did. This one faces what's coming.”",
           es:"Nacho clava la hoja en el marco de la ventana nueva, donde le pega la luz del norte. «Mi pared de allá abajo ve a la calle — todo lo que ya hiciste. Ésta ve lo que viene.»"}},
    /* Don Güero also keeps his post on the street (WNPC.st "f", quest 12) — two rooms
       in the data, never two on screen. His colours are the street's, from NPCLOOK. */
    {id:"guero",emoji:"👷",name:{en:"Don Güero · Foreman, La Obra",es:"Don Güero · Maestro de Obra"},
     world:"f2",x:12,y:8,look:(typeof NPCLOOK!=="undefined"&&NPCLOOK.f)||{shirt:"#E0A430",skin:"#C08356",hair:"#8E8E96",style:"short"},
     talk:{en:"The work order",es:"La orden de trabajo"},
     steps:[
      /* line one of any work order — owner, 2026-09-02: "that should be a question in the
         creation - who is the room for". A count, not a feeling: it changes what every
         other line on Güero's form means. (Nacho + Don Güero.) */
      {id:"forwho",
       say:{en:"Nacho does feelings, I do corners. Before I write anything down, I need to know how many people this room is for.",
            es:"Nacho ve los sentimientos, yo veo las esquinas. Antes de anotar nada, necesito saber para cuánta gente es este cuarto."},
       why:{en:"It's line one of any work order. A must-have for one person and a must-have for four are not the same object.",
            es:"Es el primer renglón de cualquier orden de trabajo. Lo que necesita uno y lo que necesitan cuatro no es el mismo mueble."},
       q:{en:"Who is this room for?",es:"¿Para quién es este cuarto?"},
       opts:[{en:"Mine. One desk, one chair, and nobody follows me up.",es:"Mío. Un escritorio, una silla, y que nadie me siga."},
             {en:"Ours. My people work up here too; I get here first.",es:"Nuestro. Aquí también trabaja mi gente; yo nomás llego primero."},
             {en:"Whoever's around. If you climbed the stairs, you're in.",es:"El que caiga. Si subiste las escaleras, ya estás dentro."}]},
      {id:"must",
       say:{en:"Good — now I know the size of it. A feeling I can't build, so give me the one thing I can order.",
            es:"Bueno — ya sé de qué tamaño es. Un sentimiento no se construye, así que dame lo único que sí puedo pedir."},
       why:{en:"A work order is a wish written down so somebody else can do it. “Cozy” can't be built; “a couch under the window” gets delivered.",
            es:"Una orden de trabajo es un deseo escrito para que otro lo haga. «Acogedor» no se construye; «un sillón bajo la ventana» sí llega."},
       q:{en:"One thing that HAS to be in here. Next line on the form.",es:"Una cosa que SÍ o SÍ va aquí. Siguiente renglón del formato."},
       opts:[{en:"A couch. A real one you can lie down on.",es:"Un sillón. De los buenos, para acostarse."},
             {en:"A big table in the middle for spreading things out.",es:"Una mesa grande en medio, para regar todo."},
             {en:"A bed in the corner for the dog.",es:"Una cama en la esquina para el perro."}]},
      {id:"window",
       say:{en:"The window's in — three panes, north wall, right over that desk. Nothing's built between it and the horizon yet, so you tell me what it looks at.",
            es:"La ventana ya quedó — tres hojas, pared norte, justo arriba de ese escritorio. Entre ella y el horizonte no hay nada construido todavía, así que tú dime qué se ve."},
       why:{en:"A window is the cheapest way to put a room inside a world. Whatever's out there becomes part of the room for free.",
            es:"Una ventana es la manera más barata de meter un cuarto en un mundo. Lo que esté allá afuera se vuelve parte del cuarto gratis."},
       q:{en:"Your window, your view. What do you want out there?",es:"Tu ventana, tu vista. ¿Qué quieres que haya allá?"},
       opts:[{en:"The old road out, and whoever's coming down it.",es:"El camino viejo que sale, y quien venga bajando por él."},
             {en:"The stakes up north. I want to watch it get closer.",es:"Las estacas del norte. Quiero ver cómo se acerca la línea."},
             {en:"Nothing built yet. Sky, rooftops, and one bird if I'm lucky.",es:"Nada construido. Cielo, azoteas, y un pájaro si bien me va."}]},
      {id:"seat",
       say:{en:"Boring half now — the boring half saves me a demolition in March. You come up the stairs, four steps, and you sit… where?",
            es:"Ahora la parte aburrida — es la que me ahorra una demolición en marzo. Subes las escaleras, cuatro pasos, y te sientas… ¿dónde?"},
       why:{en:"Where you sit decides the room. Facing the stairs you see everyone coming; facing the window you see nothing coming — and for some people that's the point.",
            es:"Dónde te sientas decide el cuarto. Viendo a las escaleras ves quién viene; viendo a la ventana no ves venir a nadie — y para cierta gente ese es el chiste."},
       q:{en:"Your desk goes…",es:"Tu escritorio va…"},
       opts:[{en:"Facing the stairs. I want to see who's coming.",es:"Viendo a las escaleras. Quiero ver quién sube."},
             {en:"Facing the window. Let them surprise me.",es:"Viendo a la ventana. Que me sorprendan."},
             {en:"In the middle, sideways. I'm not hiding.",es:"En medio, de lado. Yo no me escondo."}]},
      {id:"who",
       say:{en:"Last line on the form, and then I stop bothering you and start ordering.",
            es:"Último renglón del formato, y ya te dejo en paz y me pongo a pedir cosas."},
       why:{en:"Rooms are for people. A plan that forgets who else stands in it builds a beautiful place nobody fits in.",
            es:"Los cuartos son para gente. Un plano que se olvida de quién más se para adentro construye un lugar precioso donde no cabe nadie."},
       q:{en:"Anybody else who needs a seat up here?",es:"¿Alguien más que necesite dónde sentarse aquí arriba?"},
       opts:[{en:"Nobody. If they're comfortable, they stay.",es:"Nadie. Si están cómodos, se quedan."},
             {en:"One chair, for whoever needs to sit and talk.",es:"Una silla, para el que necesite sentarse a platicar."},
             {en:"Animals. The dog, the cats, whoever wanders up.",es:"Animales. El perro, los gatos, el que se suba."}]}
     ],
     done:{en:"Güero signs the bottom, tears off the carbon copy and hands it to you. “Copy for you, copy for the barrio. Everybody brings one piece — that's how it works here.”",
           es:"Güero firma abajo, arranca la copia al carbón y te la da. «Copia para ti, copia para el barrio. Cada quien trae una pieza — así se hace aquí.»"}}
  ]
};
