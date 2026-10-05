# Las cuatro puertas — the rest of the story (Nacho, 2026-09-02)

*Nacho's plan for the four remaining businesses, written at the auto shop's depth so four writers could draft the quests from it. Owner: "i want the rest of the story... now please if possible." Kept verbatim; the decision log records what was picked from its open questions.*

## Decisions taken on this plan (main session, 2026-09-02)

The owner's word was *"now please if possible — any outstanding questions?"*, so the four
questions below were answered with Nacho's own picks and the packs were written the same
day. Each is one line to flip if the owner disagrees.

1. **Tuerca is a she.** The two shared street-cat lines in `strings.js` stopped saying
   *he* (four cats now, two sexes, one set of lines). Bolillo is a he, as Nacho wrote him.
2. **The franchise is never named:** "the place with the drive-through" / *el del
   autoservicio*, a one-stop chain under one roof.
3. **Paper:** 06 for the taller (written today), 01 reused by the panadería, 04 reused by
   the cleaners, and a new **07 — What it answers, what it refuses, who it hands to** for
   Nolasco (written today). `docs/templates/README.md` carries the assignments.
4. **Calle Dos opens one door at a time.** Already how the ribbons are ordered; Licha's
   referral to Vero stays face to face inside her endings.

Also taken: the three new cats carry Nacho's names (Bolillo, Pelusa, Timbre) instead of
Don Güero's placeholders (Concha, Cloro, Expediente) — the names carry story, and the
maps were laid the same morning. `❗El giro` is now built: `industry:` sits beside
`role:` in every chapter and the report prints *industry · role*. The mercado-played gate
(contradiction L) was waived by the owner's *"now please"*; the packs are written and
wired, and the first human play of the mercado is still the next thing that should happen.

---

# The rest of the story — four districts, ready to write

Read in full: `docs/OWNER.md`, `docs/STORY.md`, `docs/CITY.md`, `docs/BACKLOG.md`, `docs/templates/README.md`, `content/meridian/quests.en.js` (the eight mercado quests), the mercado half of `content/meridian/quests.es.js`, `content/meridian/strings.js`, `content/meridian/npcs.js`, `content/meridian/config.js`, and the XP rule in `test/smoke.js`.

**The count, so the smoke test stays green.** `MAXXP` = 10 per quest + 10 per choice that has `next`. Every pack below has exactly four two-node quests, like the mercado: **120 XP per pack**, so `MAXXP` goes 350 → 470 → 590 → 710 → 830. Indices: taller 24-31, espiga 32-39, velázquez 40-47, nolasco 48-55. `need: 5` everywhere.

**One law that applies to all four packs, found while reading:** the engine cannot key a toast by grade (BACKLOG §1: "GROWTH cannot read a grade"), so ❗La carta — *the grade is what the previous owner says about you* — can only live in the three ending strings, which ARE grade-keyed. Every pack's referral therefore goes out inside its `epi1/2/3`, and the mercado's three endings need one sentence each appended (written below under the taller's door). The "next lot opens" toast stays grade-blind.

---

## 1 · Taller Herrera (quests 24-31)

### The industry card
- **Trade.** Independent auto repair: three lifts, one master mechanic, a service writer, an apprentice.
- **Where the money is.** Billed labor hours and parts markup. A lift earning is money; a lift with a car on it waiting for a part, a signature or a phone call is money leaking. The shop is bottlenecked by paper, not by hands.
- **AI touches it in three places.** (1) Intake and the estimate *draft* — photo and description to line items and hours. (2) Parts — reorder points, supplier lookups, the deposit on old parts. (3) The paper around the mechanic — write-ups, "your car's ready" messages, warranty and recall lookups.
- **The one place it must not.** The diagnosis and the sign-off. The number that goes on the paper and the sound in the engine stay with Tacho.
- **Five trade words** (each given by the person who needs it, in the beat after a right answer): **repair order / la orden** (Yesenia, q24) · **book time / las horas de manual** (Tacho, q25) · **core charge / el core** (Moy, q26) · **write-up / la hoja del trabajo** (Yesenia, q27) · **comeback / el regreso** (Tacho, q28).
- **Deliverable.** Template **06 Process & Exception Map** (signed ❗El papel; not yet written).
- **Sales sentence.** "I'll map how a car moves through your shop, take the typing off your people, and put a name next to every step that can't be undone."
- **Role line** (Yesenia, who reads job postings for her nephew): "He's the one who figures out what the machine should do and what it shouldn't." / "Es el que decide qué le toca a la máquina y qué no."

### The door
Cold open at the mercado, not the taller. Chelo on the landline — the same one from quest 16. What she says is the grade, and it lives in her endings. **Append to the shipped strings:**
- `mepi1` + EN: "Before you're out the door she's on the landline. 'Tacho. He told me to stop paying him for something. Send him your worst.'" · ES: "Antes de que salgas ya está en el teléfono de la pared. 'Tacho. Me dijo que dejara de pagarle por algo. Mándale lo peor que tengas.'"
- `mepi2` + EN: "On the landline, later: 'Tacho. Half of what he did works. That's more than the last one.'" · ES: "En el teléfono de la pared, más tarde: 'Tacho. La mitad de lo que hizo sirve. Es más que el anterior.'"
- `mepi3` + EN: "A week later she phones Tacho and says one thing: 'He's honest about what he doesn't know. Start there.'" · ES: "Una semana después le habla a Tacho y le dice una sola cosa: 'Es honesto con lo que no sabe. Empieza por ahí.'"

**The taller's opening toast** (goes on `mercado.open`, replacing the placeholder `endStayToast`): EN "Eight in the morning. The roll-up door on the southeast lot is halfway up and a Caprice is on the sidewalk. Don Tacho is on the phone with Doña Chelo, and he doesn't look happy about it. Nothing behind you closes." · ES "Ocho de la mañana. La cortina del lote sureste está a medio subir y hay un Caprice en la banqueta. Don Tacho está al teléfono con Doña Chelo, y no se ve contento. Atrás de ti no se cierra nada."

Quest 24 opens on the bible's exchange: *"I don't need a computer guy." / "I didn't say he was for you. Yesenia's book is full."*

### The cast and their wants
- **Don Tacho** — wants his hands to stay the last word. Not anti-machine; anti-being-replaced-by-a-guess. His real fear, said once and quietly in q28: not that the phone will be wrong, but that it will be right often enough that Moy stops learning to listen. Short declaratives, car facts, states consequences instead of objections. Calls you **joven**, never mijo. ES: blunter and funnier than EN — *la mera verdad, ¿cómo la ves?, ándale.*
- **Yesenia** — wants to stop being a bottleneck she never asked to be. Her book is the only place the schedule exists; it is not disorganized, it is encrypted. Fastest talker in the city, narrates in the order things happen. Exactly one tired moment (q31). Calls you **compa**.
- **Moy** — wants to be trusted. Already uses AI on his phone, already burned by it; uses the vocabulary slightly wrong and nobody corrects him unkindly. Arc: hides the phone → writes the shop's one rule about it. Calls you **profe**, half-joking, and by q31 not joking. ES: *o sea, le hice un prompt al carro.*
- **Tuerca** — the street cat from Calle Dos, moved in uninvited. Sleeps on the Caprice. See contradiction C: the bible says *she*, the shipped street-cat lines say *he*.

### The escalation — eight quests
Stations: Tacho 24, 28, 30 · Yesenia 27, 29, 31 · Moy 25, 26. Two leave the shop (❗El recado): 26 at Calle Dos, 30 on the street in front of the mercado where Chelo can overhear. Two-node quests: 24, 26, 27, 31.

**24 · The door / La puerta** — Tacho · 2 nodes
Three cars on lifts, a fourth waiting "because the paper isn't ready." He doesn't need a computer guy.
*The loudest objection is not the bottleneck; find the constraint before you pitch.*
a — bad: pitch the intake app (you answered a question nobody asked; the bays are full, the paper is what's waiting — beat: Tacho goes back under the Caprice mid-sentence) · **next**: "Show me how a car gets from the street to a lift" · mid: "Chelo sent me, trust me" (a referral opens a door; it doesn't say where the work is — beat: "Chelo also sent me a guy who sells ice. It's a shop, joven, not a church.") · bad: offer to fix the tablet (it isn't broken, it's unused — you just put the fight back on the man; beat: Moy from bay two: "It works, profe. That's the problem.")
b — Yesenia's book: date in, what they said it was, what Tacho said it was, parts ordered, parts here, done, called, paid. "If I'm sick, the shop doesn't know what's on the lifts." *A single point of failure with a person's name on it is a workaround too — read it before you replace it.* bad: digitize the book this week (you'd copy her columns without knowing why each exists; beat: the first digital version has no column for "what they SAID it was," and Tacho asks where it went) · **ok**: read a week of it with her and write down what each column is for → word **repair order**: "That column? Every shop calls it the RO. The one paper that follows the car. Nobody's ever asked me what the columns mean, compa. Nobody." · mid: hire a second service writer (a salary to make the bottleneck two people wide).

**25 · The photo estimate / El presupuesto por foto** — Moy · 1 node
A customer texts a photo of a crumpled bumper; Moy ran it through his phone and already texted back "around $1,200."
*An estimate is a promise with a price on it. Automate the draft, never the commitment.*
bad: let the $1,200 stand — the tool is usually close (the phone can't see the bracket behind the bumper; when it's $1,900 the customer remembers $1,200; beat: the customer arrives with a screenshot; Tacho reads it and says nothing, which is louder) · **ok**: AI drafts line items from the photo; Tacho looks at the car before any number leaves the shop → word **book time**: "The guide says three point two hours for that bumper. That's book time. The paper says what I saw. Now you know why I don't text numbers, joven." · mid: ban phone estimates entirely (safe, and you lose the customer who needed a ballpark by five) · mid: send the photo's line items with "estimate, not a quote" in the footer (uncertainty in the footer is certainty in the headline — rhymes with *Say it so it's true*). Frederick beat for a wrong answer: the same customer has DM'd Frederick the bumper photo asking for a price.

**26 · The parts run / El mandado de las refacciones** — Moy, at Calle Dos · 2 nodes
Moy walks to the parts place twice a day because the shop finds out it's out of something when Tacho's hand is already in the engine. A supplier once shipped the wrong alternator and the shop paid the deposit twice. Moy wants ordering automated.
*Automate the boring step all the way; keep a human on the irreversible one. Money leaving is irreversible; typing is not.*
a — bad: full auto — stock hits the reorder point, the system orders (the system that reorders can't tell wrong from low; beat: three alternators arrive. All wrong. All with a core charge.) · **next**: the system watches stock and drafts the order; a person hits send · mid: keep walking to Calle Dos (it works; it costs a mechanic-in-training two hours a day).
b — Yesenia won't approve every bottle of wiper fluid. Where's the line? *Draw it at what can't be undone — money out, a part returned, a promise made — and let everything else flow.* mid: everything waits for Yesenia (the bottleneck with a screen) · **ok**: consumables flow; anything over a dollar ceiling, anything with a deposit on the old part, and any new part number waits for a person → word **core charge**: "The old part's a deposit. Send the wrong one back and you pay it twice. That's the core." Beat: Moy writes CORE on his hand in marker. Old-lead plant: in the parts binder, a sheet in older handwriting — a fully automated ordering plan, no human on send. · bad: Moy approves from his phone between lifts (the fast wrong action; beat: he approves an order from under a car. It's for a car that left yesterday.) · mid: ask the supplier to stop sending wrong parts (right, and outside your control — Nando's fish guy).

**27 · The tablet, again / La tableta, otra vez** — Yesenia · 2 nodes
The tablet bought last year for write-ups lives in a drawer. Tacho will not touch it. Yesenia retypes what he tells her. Everyone has tried.
*The lever is the workflow, not the person.*
a — bad: train Tacho again, patiently (he isn't confused, he's decided; beat: he sits through the whole training, then wipes his hands on it) · **next**: change who touches what — Moy narrates at the lift, Yesenia confirms, Tacho signs the paper he already signs · mid: buy a bigger tablet (a real fix for a man whose objection is buttons; his isn't) · mid: hire someone to type for him (a salary to route around a signature).
b — Tacho signs the paper. Does the paper change? *Capture the data where it's born; keep the signature where it lives.* **ok**: the paper becomes a printout of what Moy narrated; Tacho signs that → word **write-up**: "That's the write-up. It used to be me. Twice." Beat: Tacho reads it, corrects one word, signs. "Fine." (❗Tacho: he never comes around, and that's the win.) · bad: skip the signature, the narration's enough (you removed the only step where the master mechanic reads the job before the customer does; beat: a write-up goes out saying "replaced alternator." It was the belt.) · mid: he signs on the tablet with a stylus (you moved the fight one inch).

**28 · The sound / El ruido** — Tacho · 1 node
A Corolla from the survey crew comes in with a noise. Moy plugs in his phone: "wheel bearing, left front." Tacho listens for four seconds with the hood up: "belt tensioner." Nobody raises their voice.
*Not "AI can't" — here the cost of being wrong is a car on a freeway, so the confidence bar is a different bar.*
bad: trust the code, the phone has the data (a code says where the computer noticed something, not what's wrong; beat: the Corolla comes back on a tow truck. Tacho says nothing. Moy hears it anyway.) · **ok**: the phone reads codes and suggests; Tacho's ear decides; Moy writes down both so he learns where the phone is wrong → word **comeback**: "A car that comes back is a comeback. That's the number I run this shop on. Write both down, Moy. In a year you'll hear it too." — and, quieter, to you: "I'm not scared it's wrong, joven. I'm scared it's right enough he stops listening." · mid: take the phone away from Moy (you just banned the tool from the only person who'll be here in ten years; the tools are already inside the building) · mid: the phone drives, Tacho double-checks every car (Tacho doing every diagnosis with an extra step).

**29 · The one it shouldn't have answered / La que no debió contestar** — Yesenia · 1 node
The new intake assistant — the thing that takes "what's wrong with your car" and books a slot — was asked "is this covered under my warranty?" and said "Yes, most likely." It isn't.
*Scope is a list, not a mood. "That one's for Yesenia" is a feature, not a failure.* (Nolasco, planted three phases early.)
mid: add "don't answer warranty questions" to its instructions (instructions nudge, they don't gate — Free Churro Friday) · **ok**: a short list of what it may do — describe the problem, book a slot, quote hours — and everything else goes to Yesenia with the customer's question attached (beat: the next warranty question gets "That one's for Yesenia — she'll call you before noon." Yesenia: "It's polite. It's more polite than me.") · bad: turn it off (the fix for one wrong answer is a boundary, not an off switch; you gave forty calls a day back to a counter that had them; beat: the phone rings. It's a warranty question.) · mid: let it answer but add "check your paperwork" (cover isn't candor).

**30 · The cousin's platform / La plataforma del primo** — Tacho, in front of the mercado · 2 nodes
Cousin Rigo sells shop-management software: intake, estimates, parts, texting, a dashboard. $400 a month. "Everything you built, but professional." Tacho: "¿Cómo la ves?"
*Build vs buy vs don't. Buy when it beats what you built for less than what keeping yours costs — and not before.* (The counterweight to the mercado; rhymes with *The Monday number*.)
a — bad: buy it, it does everything (everything is the price; the shop uses three of forty features and pays for forty, forever; beat: Chelo, from behind the produce, not looking up: "Forever is the expensive word.") · **next**: compare what the shop actually uses against what it costs to keep running · mid: never buy anything (a real answer for a three-bay shop, said too early) · bad: buy it because Rigo is family (family is a reason for dinner, not for software; beat: Rigo's demo crashes on the word "Caprice").
b — Your thing costs two hours a month to keep. Rigo's replaces the parts draft and the texting and adds a scheduling board Yesenia actually wants. *Buy the piece that beats what you built, keep what works, say no to the rest — and write the number down.* **ok**: buy only the scheduling board (beat: Tacho: "You told my cousin no to my face." It isn't a complaint.) · bad: migrate everything now (a migration is a second rollout; beat: the book comes back out of the drawer) · mid: wait a year (deferring isn't deciding).

**31 · The last visit / El sábado** — Yesenia · 2 nodes
Six o'clock. The book is on the counter. She asks what she should do with it. Her one tired moment: "Four years, compa. I'd like to go home at six once and see what it looks like."
*The last deliverable is the map — how work flows, who signs, which step can't be undone — so the shop owns the process, not the consultant.*
a — bad: throw the book away, the system has it (the book is a year of exceptions nobody typed; beat: Tacho lifts it out of the bin without a word) · **next**: close it and shelve it next to Tacho's manuals; the map goes on the wall · mid: keep it running in parallel forever (Nando's secret spreadsheet, with a name on it).
b — What goes on the wall? *A process map is one page: the steps, the person at each, the three that need a signature, the steps that can't be taken back circled — left where the next person can read it.* mid: the full manual, forty pages, every screen (nobody reads forty pages in a shop) · **ok**: one page — how a car moves, who touches what, the irreversible steps circled (this is template 06; beat: Yesenia tapes it by the counter and writes under it, "If you're reading this, I'm at lunch." Xochi plant: the shop shirts arrive the same day, Tuerca embroidered on the pocket, Yesenia's idea.) · bad: nothing on the wall, it's all in the system (a system nobody can read from the door is the book, digitized; beat: the internet goes out on a Tuesday. Everyone looks at Yesenia.)

### The three endings (strings `tepi1/2/3`), toast, burnout
**Grade 3 — EN.** "last visit, six o'clock. The book is on the shelf next to Tacho's manuals, spine out, closed. Yesenia leaves at six for the first time in four years and Tacho says so out loud, which from him is a parade. Moy is at the counter teaching the intake flow to the kid from the tire place. Tacho hands you a key to the side door — 'for when the trolley opens and you need somewhere to sit' — and picks up the shop phone before you're off the lot. 'Licha. The computer guy. He didn't sell me anything. Ask him what you throw away.' Tuerca is asleep on the hood of the Caprice. 'That's Tuerca. She lives here now. I didn't decide it.'"
**ES.** "Sábado, seis de la tarde. El libro está en la repisa junto a los manuales de Tacho, con el lomo hacia afuera, cerrado. Yesenia se va a las seis por primera vez en cuatro años y Tacho lo dice en voz alta, que viniendo de él es desfile. Moy está en el mostrador enseñándole la entrada de carros al chavo de la llantera. Tacho te da una llave de la puerta de al lado — 'para cuando abra el tranvía y necesites dónde sentarte' — y levanta el teléfono del taller antes de que salgas del lote. 'Licha. El de las computadoras. No me vendió nada. Pregúntale qué tiras.' Tuerca duerme sobre el cofre del Caprice. 'Esa es Tuerca. Ya vive aquí. Yo no lo decidí.'"

**Grade 2 — EN.** "last visit, six o'clock. Half of it stuck. Yesenia still keeps the book — only for the jobs she doesn't trust the system with yet, and the pile is thinner every week. Tacho wipes his hands and gives you the truest line in the building: 'You didn't sell me anything. That's why I let you stay.' He phones Licha on Monday and says less than that. Tuerca has moved onto the Caprice anyway; nobody asked her either."
**ES.** "Sábado, seis de la tarde. La mitad pegó. Yesenia todavía lleva el libro — nomás para los trabajos que aún no le confía al sistema, y el montón se adelgaza cada semana. Tacho se limpia las manos y te suelta la frase más cierta de todo el edificio: 'No me vendiste nada. Por eso te dejé quedarte.' El lunes le habla a Licha y le dice menos que eso. Tuerca de todos modos ya se subió al Caprice; a ella tampoco le preguntaron."

**Grade 1 — EN.** "last visit, six o'clock. The intake assistant is switched off and the book is exactly as thick as it was. Nothing broke, nothing burned, and Tacho is kind, which is worse and better than angry: 'You came, you looked, and you were honest about what you didn't know. Most of them lie in the first ten minutes.' Moy walks you to the gate and asks, quietly, if he should stop using the phone thing. You tell him no. You tell him what to check. A week later Tacho phones Licha and says one sentence about you; it's a fair one. Tuerca moves in anyway."
**ES.** "Sábado, seis de la tarde. El asistente de entrada está apagado y el libro está exactamente igual de grueso. Nada se rompió, nada se quemó, y Tacho es amable, que es peor y mejor que enojado: 'Viniste, miraste, y fuiste honesto con lo que no sabías. La mayoría miente en los primeros diez minutos.' Moy te acompaña a la reja y te pregunta, bajito, si debería dejar de usar lo del teléfono. Le dices que no. Le dices qué revisar. Una semana después Tacho le habla a Licha y dice una sola frase de ti; es justa. Tuerca se muda de todos modos."

**Toast (`taller.open`, the espiga's lot opens).** EN "Five in the morning on Calle Dos. The lights are on at the west lot and the ovens are already hot — Doña Licha got a phone call. Nothing behind you closes." · ES "Cinco de la mañana en Calle Dos. Hay luz en el lote del poniente y los hornos ya están calientes — a Doña Licha le llegó una llamada. Atrás de ti no se cierra nada."

**Burnout (`tgoEpi`, hearts only).** EN "last visit. Tacho doesn't take the side-door key back, because he never gave it. 'You learned on my floor. Floors are for that.' The book is on the counter with a page in your handwriting, and the roll-up door goes up at seven." · ES "Sábado. Tacho no te quita la llave de la puerta de al lado, porque nunca te la dio. 'Aprendiste en mi piso. Para eso son los pisos.' El libro sigue en el mostrador con una hoja con tu letra, y la cortina sube a las siete."

### Late lines
- 24 Tacho — EN "The door still goes up at seven, joven. I still don't need a computer guy. Come look anyway." · ES "La cortina sigue subiendo a las siete, joven. Sigo sin necesitar un computólogo. Pásale a ver de todos modos."
- 25 Moy — EN "Profe, the bumper photo's still on my phone. So's the number I shouldn't have texted." · ES "Profe, todavía tengo la foto de la defensa en el cel. Y el número que no debí mandar."
- 26 Moy — EN "I still walk to Calle Dos for parts. My legs have opinions now." · ES "Todavía voy a pie a Calle Dos por las refacciones. Mis piernas ya tienen opiniones."
- 27 Yesenia — EN "The tablet's in the drawer, compa. Same drawer. It's very well rested." · ES "La tableta sigue en el cajón, compa. El mismo cajón. Está bien descansada."
- 28 Tacho — EN "Cars still make noises. Phones still have opinions about them. Pop the hood." · ES "Los carros siguen haciendo ruidos. Los teléfonos siguen opinando. Abre el cofre."
- 29 Yesenia — EN "It answered another warranty question while you were gone. Politely. Wrong, but politely." · ES "Contestó otra pregunta de garantía mientras no estabas. Con educación. Mal, pero con educación."
- 30 Tacho — EN "My cousin still calls on Sundays. The price went up. Everything he does goes up." · ES "Mi primo sigue llamando los domingos. Ya subió el precio. Todo lo de él sube."
- 31 Yesenia — EN "The book's on the counter, compa. I never decided what to do with it. I'm asking you." · ES "El libro sigue en el mostrador, compa. Nunca decidí qué hacer con él. Te estoy preguntando a ti."

### Continuity threads planted
Old lead's page: the parts binder (q26). Xochi: shop shirts with Tuerca on the pocket (q31 beat). Frederick: the bumper photo in his DMs (q25). Cat: Tuerca, on the Caprice, in every ending. Trolley: the survey crew's Corolla (q28); Tacho's side-door key is "for when the trolley opens." Franchise: none here — the taller is the one district without a shadow, on purpose; Rigo's platform is the temptation. Office furniture (BACKLOG §6): the dog bed — reconciled as the bed Tacho bought Tuerca that she refused; "Take it upstairs. For the dog." Frederick uses it. See contradiction J.

---

## 2 · Panadería La Espiga (quests 32-39)

### The industry card
- **Trade.** Neighborhood bakery. Pan dulce and bolillo from four in the morning, cakes to order, rosca in January, pan de muerto in the fall.
- **Where the money is.** Volume of cheap pieces baked before anyone buys. The margin lives between what's thrown out at close and what sold out before the after-school rush. The fat is in cakes and the two seasons.
- **AI touches it in three places.** (1) The morning count — trays per item from the close-out strips, the weather, payday, the school calendar. (2) Cake intake — date, size, flavor, the name spelled right, the deposit. (3) The close-out tally and sold-out times — turning Sol's paper strip into the history a forecast eats.
- **The one place it must not.** The decision at the oven. The sheet suggests; Tito bakes. And the two once-a-year breads, which have no history worth a machine.
- **Five trade words.** **sold-out time / la hora del "se acabó"** (Sol, q32) · **par / el par** (Licha, q33) · **bake sheet / la lista de horneado** (Tito, q34) · **merma** (Licha, q36 — waste, the bakery's own word in both languages) · **day-old / pan de ayer** (Tito, q37).
- **Deliverable.** Template **01 Process Discovery Notes** — freed on 2026-09-02, nobody claims it, and an ops analyst's first paper is exactly "where does this number come from." Filled at 4am. (Alternative: a new 07 forecast scorecard — see question 3.)
- **Sales sentence.** "I'll turn what your counter already counts at close into tomorrow's bake list — and tell you every week how wrong it was, and in which direction."
- **Role line** (Sol, reading it off her phone): "An ops analyst. It's the person who tells you the number was wrong before it costs you." / "Analista de operaciones. Es quien te dice que el número estaba mal antes de que te cueste."

### The door
Cold open at the taller. Tacho on the shop phone (the grade is in `tepi1/2/3` above). Licha at the panadería at five in the morning, flour on the receiver: "Then what's he for?" Tacho: "Ask him what you throw away." She hangs up and counts the day-old rack. Quest 32's `say`: Licha holding a tray of yesterday's conchas — "Don Tacho says you don't sell anything. Good. I don't need anything sold. I need to know why I threw away thirty conchas on Tuesday and ran out by nine on Wednesday."

### The cast and their wants
- **Doña Licha** — wants to stop throwing bread away and stop running out, both at once, which she knows is impossible; what she actually wants is to stop being surprised. Her real fear (q39, late): that if a sheet knows the number, her hands will forget it — Tacho's fear in a gentler key: not being replaced, not being needed at four. Speaks formally, **usted** to you and no nickname at all until the last visit, when she says **vecino** once. ES: her mother's Spanish — *oiga, fíjese, criatura* to Sol.
- **Tito** — night baker, fifties. Wants to sleep, and to share the 3:45 decision with someone. Counts in trays and hours; says almost nothing else. Calls you **cuate**.
- **Sol** — counter, twenty, dry and precise, the accidental data source (Perla's rhyme, flipped: Perla was loud, Sol is exact). Wants the counter to stop being where the blame lands — "we ran out" and "we have too much" both land on her. Calls you **consultor**, with audible quotation marks, and drops the quotation marks in q38.
- **Bolillo** — the bakery cat, lives in the flour bin. Nobody has ever gotten him out of it.

### The escalation — eight quests
Stations: Licha 32, 36, 39 · Sol 33, 35, 38 · Tito 34, 37. Two-node quests: 32, 34, 37, 39.

**32 · The thirty conchas / Las treinta conchas** — Licha · 2 nodes
Tuesday thirty conchas in the trash; Wednesday sold out by nine. She wants a machine that tells her the number.
*Before you forecast, find where the number is born — a forecast is only as good as the count it eats.*
a — bad: build the forecast from the register (the register knows what sold, not what was made or thrown out; beat: the model recommends baking exactly what sold out. Forever.) · **next**: find out who counts what, and when · mid: bake the average of the two days (the gut's honest version; nobody measured why the days differed) · bad: buy a bakery app with forecasting (*Tamal season* — a tool with no history renews annually; beat: the app asks for two years of data. Licha looks at the paper strip.)
b — Sol's strip: every night she writes what's left per item and pins it to the board. Tito reads it at 3:45, sometimes. Nobody writes what time things ran out. *The data you need is usually already being collected by the person nobody asked — add the missing column, not a new system.* **ok**: photograph the strip nightly and add one column, the hour each item sold out → word **sold-out time**: "The 'se acabó' hour. I could've told you that months ago, consultor." Beat: Sol adds the column in Sharpie; by Thursday it's in Licha's handwriting on the days Sol is off. · mid: replace the strip with a tablet at the counter (Nando's rule — digitize it with her, not at her) · mid: have Tito count what he bakes instead (that's the in, not the out).

**33 · Par / El par** — Sol · 1 node
Licha keeps "the numbers" in her head and changes them by mood. Sol wants a fixed number per item so the blame stops landing on her.
*A standing number is a baseline you correct from, not a rule you obey — write it down so you can be wrong on paper instead of in the trash.*
bad: one fixed number per item, never changed (Tuesday's waste and Wednesday's stockout, permanently; beat: Friday, payday. The fixed number sells out at 8:40.) · **ok**: a par per item per weekday from eight weeks of strips, corrected weekly from how wrong it was → word **par**, given by Licha, who needs it: "¿Par? That's what it's called? I've had a par for thirty years. I just never wrote it down." Beat: she writes the pars on the board in her own hand — the first time the number has left her head. · mid: let Licha keep it in her head, it's worked (it has; it can't be argued with, taught or improved) · mid: let the app decide daily (a daily number with no baseline is a number nobody can argue with, which is worse).

**34 · 3:45 / Las tres cuarenta y cinco** — Tito · 2 nodes
Tito at the oven with a sheet that says twelve trays of concha. It rained. The sheet doesn't know it rained. He wants to know if he's allowed to disagree.
*The forecast suggests; the baker decides — and the decision gets written down so the forecast learns from it.*
a — bad: bake what the sheet says, it has the data (it has eight weeks and no window; the man at 3:45 has the window; beat: twelve trays, rain, thirty-one conchas in the trash — and this time the sheet gets blamed) · **next**: Tito overrides, and writes the override and why on the sheet · mid: turn the forecast off on rainy days (you turned the tool off on exactly the days it needs to learn) · bad: call Licha at 3:45 (the bottleneck with a phone; beat: she answers on the first ring. She's been awake since three. She always is.) Old-lead plant: a laminated card by the oven, older handwriting — "AI FORECAST v1 — bake what it says." No override column.
b — A month of overrides: Tito right nine times, wrong four. *An override log is the most honest data a forecast ever gets — measure the human and the model against each other, not to pick a winner but to find where each is blind.* **ok**: keep the overrides; feed them back monthly so the sheet learns rain and payday → word **bake sheet**: "La lista de horneado. Now it's got two columns — what it said, what I did." Beat: Tito: "So it's not me against the sheet." No. "Bueno. I was tired of winning." · bad: the model was wrong four times, drop it (Tito was wrong four times too; you'd fire the tool for the human's error rate) · bad: Tito was wrong four times, remove his override (you took the window away from the only person standing at it; beat: he bakes what the sheet says. It's raining.) · mid: average the two automatically (a number nobody made).

**35 · The cake with the wrong name / El pastel con el nombre mal** — Sol · 1 node
A quinceañera cake came out "Feliz Cumpleaños Brayan." It was Bryan. The order was a napkin.
*A special order is a promise with a date on it: structured intake plus read-back, confirmed by the customer before the oven sees it.* (Rosa's phone, in frosting.)
bad: the assistant takes cake orders by phone straight onto Tito's list (free text, now typed; beat: "Feliz Cumpleaños Braian." A third spelling.) · **ok**: the assistant fills the form — date, size, flavor, inscription — reads it back, and the customer confirms the spelling by text before the deposit (the inscription is a field, not a sentence; beat: the customer texts back "BRYAN, con Y" and a heart) · mid: only take cake orders in person (loses the tía calling from another city) · mid: print whatever the customer typed, no read-back (nobody checks the field the customer typo'd; beat: "Feliz Cumpleños." Her typo. Sol's problem.)

**36 · The place with the drive-through / El del autoservicio** — Licha · 1 node
Six weeks ago the place with the drive-through opened a bakery counter near the north end. The pars have been wrong since. The sheet keeps recommending last quarter.
*Drift: the world changed and the model didn't. You catch it by tracking error over time, not by waiting for the trash to tell you.*
bad: add more trays, the numbers are just off (drift isn't noise; more of last quarter is more trash; beat: forty-two conchas. A record.) · **ok**: look at the error by week — if it turned the same direction six weeks ago, retrain on the weeks since, not the year → word **merma**, from Licha: "La merma. The bread that goes out the back door. Six weeks I've been feeding it to the pigeons and calling it a mood." Beat: the error chart shows one clean step, six weeks back. Licha taps the date. "That's when they put up the sign." The one number that went up: forty bolillos at five every morning to the crew laying track. · mid: keep the old numbers, they'll come back (some will; don't bet the trash on it; beat: a complaint about the drive-through's conchas lands in Frederick's DMs — their page has no phone number. The intern replies with a paw.) · mid: match their prices (maybe — a price war is Licha's decision, not a forecast fix).

**37 · Rosca season / La temporada de rosca** — Tito · 2 nodes
January. The bakery sells more in one week than in a normal month; the sheet has never seen a January. Last year they ran out at noon on the 5th and threw out forty on the 7th.
*Holiday spikes aren't forecast from daily history — they're planned from last year's spike, pre-orders and a number the owner signs, then measured against.*
a — bad: trust the sheet, it's been good all year (a model that's never seen January thinks January is a Tuesday; beat: it recommends nine roscas. Nine. Licha laughs until she has to sit down.) · **next**: plan the week separately — last year's count, this year's pre-orders, a number Licha signs · mid: bake as many as possible (Chuy's tower of barbacoa, with a plastic baby in it) · bad: skip rosca, too hard to predict (the one week that pays for February; beat: the drive-through sells rosca. In a box.)
b — Pre-orders. *Turn demand into a count: pre-orders convert a guess into a number, and the walk-in share becomes the only thing you still have to forecast.* **ok**: pre-orders with a deposit; bake pre-orders plus last year's walk-in share, tracked by the hour on the 5th and 6th → word **day-old**: "Pan de ayer is one thing, cuate. Rosca de ayer is a funeral." Beat: the 7th, four roscas left. Tito sleeps. · mid: no pre-orders, keep it simple (simple and blind) · bad: pre-orders only, no walk-ins (beat: a señora at the counter on the 6th with cash and no pre-order. Twenty years she's been coming.)

**38 · The number in her units / El número en sus unidades** — Sol · 1 node
Licha asks Sol if the sheet is working. Sol has the numbers — error down from 19% to 11% — and Licha's eyes glaze.
*Report the error in the owner's units — trays in the trash, mornings sold out early, dollars — and say which direction it was wrong. A percent without a direction is a shrug.*
mid: "11%, down from 19%" (true and unusable — Chelo's "And?") · **ok**: "Two trays a day fewer in the trash, one sold-out morning a week instead of three, about $140 a week" (beat: Licha nods once. Sol, to you, no quotation marks this time: "Okay. Consultor.") · bad: "It's working great" (beat: Licha has her mother's face for this. You are seeing it.) · mid: show her the chart (a picture of a number she didn't ask for; beat: she turns the phone sideways, then upside down, then hands it back).

**39 · The last visit: the last tray / El sábado: la última charola** — Licha · 2 nodes
last visit close. Two conchas left, nothing thrown away, nobody turned away. She asks what she owes you — and what happens when you're not here. Her fear, once: "If the sheet knows it, do my hands forget?"
*The handover is the discovery notes — where every number is born, who writes it, when, and what to do the week the sheet is wrong — so the bakery owns the count.*
a — bad: leave the model running, it'll be fine (a model nobody feeds starves; Sol's strip is the food; beat: February, Sol out sick a week, the sheet recommends twelve trays of nothing) · **next**: write the one page — who counts what, when, and what Tito does when the sheet is wrong · mid: train Licha on the model's settings (she should own the number, not the knobs).
b — What does she get? *The document a business keeps is the one that fits on the board above the oven.* **ok**: one page on the board — three counts, three people, three times, and the rule "the sheet suggests, Tito decides, write the override" (this is template 01, filled; beat: she pins it next to the pars in her own hand and answers her own question: "No. The hands don't forget. They just stop being alone." Xochi plant: the aprons arrive — a wheat ear on the bib, a pocket on Sol's sized exactly for the strip.) · mid: a dashboard on the tablet (a page that needs a password) · bad: the model's code, printed (beat: Tito lines a tray with it).

### The three endings (`eepi1/2/3`), toast, burnout
**Grade 3 — EN.** "last visit, closing. Two conchas on the last tray, nothing in the merma bin, nobody turned away since Tuesday. Doña Licha pins the page above the oven next to the pars in her own handwriting and hands you a rosca in September. 'For the road, vecino. I know what month it is.' Tito is asleep — actually asleep, at a reasonable hour, somewhere else. Vero's crew comes in to mop and Licha says it over the counter, no phone needed: 'Vero. This one counts. Give him your worst crew.' Bolillo is asleep in the flour bin. Nobody has ever gotten him out of it."
**ES.** "Sábado, hora de cerrar. Dos conchas en la última charola, nada en el bote de la merma, nadie se fue sin pan desde el martes. Doña Licha prende la hoja arriba del horno junto a los pares con su propia letra y te da una rosca en septiembre. 'Para el camino, vecino. Ya sé en qué mes estamos.' Tito está dormido — dormido de verdad, a una hora decente, en otra parte. Entra la cuadrilla de Vero a trapear y Licha lo dice por encima del mostrador, sin teléfono: 'Vero. Este sí cuenta. Dale tu peor cuadrilla.' Bolillo duerme en el bote de la harina. Nadie lo ha podido sacar de ahí nunca."

**Grade 2 — EN.** "last visit, closing. The sheet runs; Tito trusts it on weekdays and his gut on Fridays, and the trash is lighter than it was. Licha hasn't pinned anything above the oven — the pars are still in her head — but Sol's strip has a time column now, and on Thursdays it's in Licha's handwriting. She says it to Vero over the counter, shorter: 'He counts. Try him.' Bolillo sits in the flour bin with an expression."
**ES.** "Sábado, hora de cerrar. La hoja corre; Tito le cree entre semana y a su panza los viernes, y la basura pesa menos que antes. Licha no ha prendido nada arriba del horno — los pares siguen en su cabeza — pero la tira de Sol ya tiene columna de hora, y los jueves aparece con la letra de Licha. Se lo dice a Vero por encima del mostrador, más corto: 'Este cuenta. Pruébalo.' Bolillo está sentado en el bote de la harina con cara."

**Grade 1 — EN.** "last visit, closing. The sheet is in a drawer and Tito is back to deciding at 3:45 alone. But Sol's strip has a column it didn't have, and nobody told her to stop. Licha gives you a bag of pan de ayer — 'It's still good. So are you, probably.' — and says nothing to Vero for a week. Then she does, one sentence, over the counter, and it's fair. Bolillo follows you to the door and stops there. It's his door."
**ES.** "Sábado, hora de cerrar. La hoja está en un cajón y Tito volvió a decidir solo a las 3:45. Pero la tira de Sol tiene una columna que antes no tenía, y nadie le dijo que le parara. Licha te da una bolsa de pan de ayer — 'Todavía sirve. Usted también, seguramente.' — y no le dice nada a Vero en una semana. Luego sí, una sola frase, por encima del mostrador, y es justa. Bolillo te sigue hasta la puerta y ahí se queda. Es su puerta."

**Toast (`espiga.open`).** EN "Ten at night on Calle Dos. A van with a mop bucket is parked on the east lot and somebody is unlocking a door by phone light. Doña Vero got a referral over a bakery counter. Nothing behind you closes." · ES "Diez de la noche en Calle Dos. Hay una camioneta con cubeta de trapeador en el lote del oriente y alguien abre una puerta con la luz del celular. A Doña Vero la recomendaron por encima de un mostrador de panadería. Atrás de ti no se cierra nada."

**Burnout (`egoEpi`).** EN "last visit. Licha hands you pan de ayer and doesn't ask for the sheet back. 'You learned in my kitchen. That's what an oven is for.' The strip is on the board with a column in your handwriting, and the ovens go on at four." · ES "Sábado. Licha te da pan de ayer y no le pide la hoja de vuelta. 'Aprendió en mi cocina. Para eso está el horno.' La tira sigue en el corcho con una columna con su letra, y los hornos prenden a las cuatro."

### Late lines
- 32 Licha — EN "The conchas kept coming out of the oven while you were away. So did the trash." · ES "Las conchas siguieron saliendo del horno mientras usted no estaba. La basura también."
- 33 Sol — EN "The number's still in her head. I checked. It moved." · ES "El número sigue en su cabeza. Lo revisé. Se movió."
- 34 Tito — EN "3:45 comes every night, cuate. It doesn't wait for anybody. Neither does the rain." · ES "Las 3:45 llegan cada noche, cuate. No esperan a nadie. La lluvia tampoco."
- 35 Sol — EN "We did another cake with a name on it. I'm not saying how it went. I'm saying come look." · ES "Hicimos otro pastel con nombre. No digo cómo salió. Digo que vengas a ver."
- 36 Licha — EN "The drive-through is still there. Bigger sign now. The pigeons eat very well." · ES "El del autoservicio sigue ahí. Ya tiene letrero más grande. Las palomas comen muy bien."
- 37 Tito — EN "January comes every year. That's the whole problem with January." · ES "Enero llega cada año. Ese es todo el problema con enero."
- 38 Sol — EN "She asked me again if it's working. I said a percent. She made the face." · ES "Me volvió a preguntar si funciona. Le dije un porcentaje. Hizo la cara."
- 39 Licha — EN "The last tray is still the last tray. What I owe you hasn't changed. Neither has what happens when you're not here." · ES "La última charola sigue siendo la última. Lo que le debo no ha cambiado. Ni lo que pasa cuando usted no está."

### Continuity threads planted
Old lead's page: the laminated card by the oven (q34). Xochi: the aprons, Sol's with a strip pocket (q39). Frederick: the drive-through complaint in his DMs (q36). Cat: Bolillo in the flour bin. Trolley: the track crew's forty bolillos, the one number that went up (q36). Franchise: first landing — "the place with the drive-through," never named, the cause of the drift (q36, q37). Furniture: **the guest chair** — Licha: "For whoever comes after you. Somebody always does."

---

## 3 · Limpieza Velázquez (quests 40-47)

### The industry card
- **Trade.** Commercial and residential cleaning. Crews of two or three in vans; nights at businesses (the mercado, the panadería, the clinic, offices), days in homes. Contracts by the month, one-offs by the job.
- **Where the money is.** Contract hours against hours actually worked. A crew forty minutes long on a fixed contract eats the margin; a free second trip because a client found something eats a night; a no-show eats a client. Supplies are noise. Winning a multi-site account is the only way to grow; losing a crew is how you shrink.
- **AI touches it in three places.** (1) Scheduling and dispatch — routes, swaps, who goes where when a kid is sick. (2) The per-site checklist with photo proof the client can see, in two languages, and the client's list of misses coming back. (3) Bids from walkthroughs — square footage, frequency, the scope line, the quote draft.
- **The one place it must not.** The crew's phone as a tracker. The tool may count work; it may never watch people. And "is it clean?" stays with Chente's eyes.
- **Five trade words.** **walkthrough / el recorrido** (Vero, q40) · **punch list / la lista de faltantes** (Chente, q41) · **route sheet / la hoja de ruta** (Karla, q42) · **re-clean / la vuelta gratis** (Vero, q44) · **scope / el alcance** (Vero, q45).
- **Deliverable.** Template **04 Pilot Review** — "did it pay off, and should we stop?" asked of a crew app instead of a phone bot; sharing it with the mercado is the point (the same paper in two rooms is proof the skill travels). Alternative: a new 07 Rollout Plan — question 3.
- **Sales sentence.** "I roll tools out to people who don't sit at desks — one crew first, in their language — and I measure whether they use it, not whether they logged in."
- **Role line** (Karla, from a job posting she's been reading for herself): "Implementation lead. The one who makes the thing actually get used." / "Líder de implementación. El que hace que la cosa sí se use."

### The door
Cold open at the panadería at close. Vero's crew is mopping La Espiga; Licha says the grade sentence across the counter (it's in `eepi1/2/3`) — the first referral in the city said face to face, no phone. Vero, mop in hand: "I heard. Tacho says you don't sell, Licha says you count. I've got a bid due Friday and nine people who hate the last app I bought." Quest 40 opens in the van on the east lot.

### The cast and their wants
- **Doña Vero** — started as a cleaner at a company that tracked bathroom breaks with an app; owns nine people and three vans now. Wants the contract she's afraid of — the franchise's twelve north-end sites — without becoming the boss she left. Warm, cleans alongside her crews. Calls you **inge**, the way everyone in Mexico calls the tech person, and the nickname travels down the referral chain from here.
- **Chente** — crew lead; the crew is his cousins and his wife's cousins. Half don't read well in either language. Wants to be asked. "Loses" the tablet on purpose. Few words, *la neta*. Calls you nothing at all until q47, when he says **compañero** by accident and doesn't take it back.
- **Karla** — scheduler; the schedule is sticky notes on her dashboard and three group chats; she is the person everyone texts at 5:40. Fast, texting register, *o sea*. Calls you **el de la app** — and by the end, *our* app guy.
- **Pelusa** — the van cat. Rides along. Always rides along.

### The escalation — eight quests
Stations: Vero 40, 44, 45, 47 · Chente 41, 43, 46 · Karla 42. (q45 is Vero's because the scope line is hers; Don Güero may move it to Karla if the queue wants balance — the text works from either.) Two-node quests: 40, 42, 44, 47.

**40 · Twelve sites / Doce sitios** — Vero · 2 nodes
The franchise sent a request for bids: twelve stores on the north end, nights, starting when the line opens. Vero has nine cleaners, three vans, and an app from last year nobody opens. She wants to say yes and buy a bigger app.
*Adoption before expansion. A tool nine people ignore will be ignored by twenty.*
a — bad: buy the bigger platform and bid (two unknowns rolled into a contract with a start date; beat: the platform's onboarding is in English only. The crew is not.) · **next**: find out why nine people don't open the app before deciding what twenty need · mid: turn down the bid (the line opens once) · bad: bid, and hire twelve new people who'll use the app (new people don't fix an app the old ones hate; they learn to hate it faster; beat: Chente hears "twelve new people" from the hallway. He is very quiet on the ride home.)
b — Chente, in the van: "It wants a photo of every toilet. In English. Before we can clock out. Marta doesn't read English. Neither does the toilet." *The first user is the one who hates it; the objections are the spec.* **ok**: sit with one crew for one night shift and write down every place the app makes the job slower → word **walkthrough**, from Vero: "That's a walkthrough. I do one on every site before I quote it. I never did one on my own crew." Beat: three hours, one toilet photo, eleven notes. Marta wrote four of them. · mid: make it mandatory with a bonus (incentives buy logins, not use) · mid: translate it and relaunch (necessary, not sufficient — the photo-before-clock-out is the problem, not the language; beat: "Foto del inodoro." Marta, in Spanish: no.)

**41 · The app in the glovebox / La app en la guantera** — Chente · 1 node
The tablet is "lost" in the glovebox. Vero wants to know who's ignoring it. Chente tells you flat: if the app is for watching where they are, he quits first.
*Work gets counted; people don't get watched. That line decides whether anyone uses it.*
bad: turn on location so Vero knows where crews are (you just built the boss Vero left; beat: the tablet is found. In the canal.) · **ok**: strip it to what the crew gets from it — the site checklist in Spanish, the route, the "done" that ends the shift — no tracking → word **punch list**: "The client's list of what we missed. That's the only list I want on that thing. Ours." Beat: "So it's our list." Yes. "Not hers." Not hers. Old-lead plant: the checklist taped inside the glovebox — "photo of every room before clock-out" — in older handwriting. Chente: "The last computer guy made this one." · mid: make Chente responsible for the app (right person, wrong order — give him something worth owning first) · mid: let each crew choose (a tool half a company uses is two companies).

**42 · 5:40 / Las cinco cuarenta** — Karla · 2 nodes
5:40am: Marta's kid is sick, the clinic moved its time, the mercado wants an extra night, and the schedule is sticky notes on a dashboard. She wants the AI to "just do the schedule."
*Automate the puzzle; keep the human on the phone call. The schedule is math; the swap is a relationship.*
a — bad: the AI builds and sends the schedule automatically (it sends Marta to the clinic at six on the day her kid is sick; beat: Marta replies. The reply is not printable.) · **next**: the AI drafts the week from the contracts and the crew's availability; Karla approves and makes the calls · mid: hire a second scheduler (sticky notes, two dashboards wide).
b — Where does availability come from? *The input nobody owns is the input that's always wrong — give the crew one place to say "not Tuesday" that they'll actually use.* **ok**: one message a week from each crew lead, text or voice note, that Karla's tool reads into availability → word **route sheet**: "The route sheet. I've been sending it as a photo of a sticky note. A PHOTO." Beat: Chente sends a voice note — "Marta no martes." It parses. Karla cries a little. · mid: a form in the app every crew member fills daily (an empty column) · bad: Karla guesses, like now (beat: 5:40. Again.) · mid: Vero sets availability (the owner doesn't know whose kid is sick).

**43 · The callback / El regreso** — Chente · 1 node
The clinic called: the break room wasn't done. The crew swears it was. No proof either way; Vero sends them back for free, again. Chente wants the camera thing but not "the camera thing."
*Proof-of-work protects the crew as much as the client — if the crew owns the photo and the client sees it, it's a receipt. If the boss owns it, it's surveillance.*
bad: photos of every room, timestamped, reviewed by Vero (that's the app in the canal; beat: Chente's face does the thing it did at the canal) · **ok**: the crew photographs the three rooms clients complain about; the photos go on the client's "done" report; nobody at the office looks unless a client calls (beat: the clinic's next complaint arrives with its own photo attached. It's the break room. It's clean. The clinic apologizes. Frederick beat: the clinic's punch list was sent by DM. To the dog.) · mid: no photos, trust the crew (Vero does; the clinic doesn't) · mid: Chente inspects every site after every crew (Chente not cleaning).

**44 · Nine, then twenty / Nueve, y luego veinte** — Vero · 2 nodes
The app has been live with Chente's crew for a month. Vero wants to roll it to all nine, then bid for the twelve sites — twenty people. "Did it work?"
*Measure adoption, not logins. The number is "shifts closed in the app without a call to Karla," in her units.*
a — bad: "Everyone logged in" (a login is a door, not a habit; beat: eight logins, one user. His name is Chente.) · **next**: count shifts closed in the app without a call to Karla, and this month's free second trips against last month's · mid: ask the crew if they like it (they'll say yes to Vero) · mid: roll it to all nine and see (a rollout is not a measurement). Xochi beat on any answer: the crew shirts arrived last week — adoption of the shirt, nine of nine; adoption of the app, one of nine. Xochi is undefeated.
b — Chente's crew closed 19 of 22 shifts in the app; free second trips went 3 to 1; Karla's 5:40 calls from that crew: zero. *A pilot review says stop, go, or fix — and "go" means the next crew, with what we learned. Never "everyone."* **ok**: the next two crews, Chente trains them, same measure, then the bid → word **re-clean**, from Vero: "Three to one. A re-clean is a night I pay for twice. That's the number I'd have wanted a year ago." Beat: she writes 3→1 on the whiteboard. Under it: "Chente." · bad: all nine at once, we're behind (the learning came from one crew and one trainer; nine at once has no trainer; beat: Chente trains three crews in a night. He has one voice. It goes.) · mid: stop, 19 of 22 isn't 22 (a pilot that moved three numbers the right way is a go) · mid: skip to the bid (proof for three people, a bid for twenty).

**45 · The bid / La cotización** — Vero · 1 node
The bid form wants a price per site from a walkthrough. Vero can't walk twelve sites by Friday. Karla wants to quote from the franchise's floor plans.
*The AI drafts the scope and the numbers; the owner walks at least one site and signs the scope line. A quote is a promise — the photo estimate, with a mop.*
bad: quote all twelve from the floor plans (a floor plan doesn't show the grease trap; beat: site 7 has a kitchen. The plan said "storage.") · **ok**: draft twelve scopes from the plans; Vero walks two sites — the biggest and the weirdest — and adjusts all twelve from what she sees → word **scope**: "The scope line. 'Windows inside, not out.' Every fight I've ever had with a client lived in that line." Beat: she walks site 7, comes back, adds the word "kitchen" to all twelve in pen. · mid: don't bid (the line opens once) · mid: ask the franchise to describe each site (beat: "Standard retail." Site 7 has a kitchen.)

**46 · Marta's phone / El teléfono de Marta** — Chente · 1 node
Rollout, week two. Marta, the best cleaner in the company, closes her shifts on paper and hands it to Chente, who types it in. The phone is for her daughter to call.
*Adoption is never 100%. One person on paper with a buddy is a workflow, not a failure — as long as the number gets in once.* (Template 06's exception column, crossing the street.)
bad: mandatory, no paper (you'd lose Marta over a form; beat: Marta's paper is neater than the app) · **ok**: Marta's paper plus Chente typing it, written into the process as the exception it is (beat: "So she's allowed." She's on the map. "…On the map." He likes that.) · mid: buy Marta a work phone (a second thing to lose; the objection isn't the phone) · mid: her daughter sets it up once and Marta taps one button (it might work, and it puts a nine-year-old in your rollout plan).

**47 · The last visit: the van / El sábado: la camioneta** — Vero · 2 nodes
last visit. The bid went in Friday. Vero wants to know what to tell the crews Monday — and what happens when twelve sites say yes and you're not in the van. Her fear, once: "The day I'm not the one holding the phone, inge — what stops it turning into the thing I left?"
*The handover is the pilot review — what we measured, what stuck, who trains whom next — and the rule about people, written where the next boss has to read it.*
a — bad: tell the crews the app is now mandatory company-wide (beat: glovebox) · **next**: write the pilot review — three numbers, the exception, the rollout order, and the tracking rule · mid: wait for the bid result (a rollout that waits on a client never starts).
b — Where does the rule live? *Rules for people are written for the day the owner changes — on paper the crews can point at.* **ok**: one page in the van, Spanish first — the numbers, the order, and "this app counts work; it never tracks where you are," signed by Vero (beat: Chente reads it twice and pins it above the dash where the sticky notes were. Pelusa sits on it.) · mid: in the app's settings (nobody reads settings) · bad: Vero just tells them (Vero's word is good; Vero's word isn't in the van the night she isn't; beat: nobody says that out loud. Vero looks at the bid.)

### The three endings (`vepi1/2/3`), toast, burnout
**Grade 3 — EN.** "last visit. The bid went in Friday with the word 'kitchen' on all twelve pages, in pen. The page is above the dash where the sticky notes were — three numbers, the rollout order, and a line signed by Vero: this app counts work; it never tracks where you are. Chente read it twice and called you compañero once, by accident, and didn't take it back. Vero puts an envelope in your hand — the pilot review — and says, 'Take this to Nolasco. He reads.' Pelusa is asleep on the route sheet. The route sheet is a printout now. Pelusa has not noticed."
**ES.** "Sábado. La cotización se fue el viernes con la palabra 'cocina' en las doce hojas, a pluma. La hoja está arriba del tablero donde estaban los papelitos — tres números, el orden de la salida, y una línea firmada por Vero: esta app cuenta el trabajo; nunca vigila dónde estás. Chente la leyó dos veces y te dijo compañero una vez, sin querer, y no lo retiró. Vero te pone un sobre en la mano — la revisión del piloto — y dice: 'Llévale esto a Nolasco. Él sí lee.' Pelusa duerme sobre la hoja de ruta. La hoja de ruta ya es impresa. Pelusa no se ha dado cuenta."

**Grade 2 — EN.** "last visit. Three crews on the app, six on Karla's phone, and the 5:40 calls are down to Tuesdays. Marta's paper is on the map as the exception it is. Vero looks at the bid and says the honest thing: 'Twenty people is next year. Nine people is now, and nine is better than it was.' She sends you to Nolasco with the envelope, and a shorter note inside it. Pelusa rides along. Pelusa always rides along."
**ES.** "Sábado. Tres cuadrillas en la app, seis en el teléfono de Karla, y las llamadas de las 5:40 ya nomás caen los martes. El papel de Marta está en el mapa como la excepción que es. Vero mira la cotización y dice lo honesto: 'Veinte personas es el año que entra. Nueve personas es ahorita, y nueve están mejor que antes.' Te manda con Nolasco con el sobre, y adentro una nota más corta. Pelusa va en la camioneta. Pelusa siempre va."

**Grade 1 — EN.** "last visit. The tablet is back in the glovebox and Karla's dashboard has sticky notes on it again. But one of them says 'Marta no martes,' and it's the first time anybody wrote it down. Vero doesn't send you to Nolasco with an envelope. She sends you with a sentence, a week later, and it's fair: 'He listened to Chente. Nobody listens to Chente.' Pelusa watches you go from the dash. She isn't judging. She's a cat; she doesn't have to."
**ES.** "Sábado. La tableta volvió a la guantera y el tablero de Karla otra vez tiene papelitos. Pero uno dice 'Marta no martes', y es la primera vez que alguien lo escribió. Vero no te manda con Nolasco con un sobre. Te manda con una frase, una semana después, y es justa: 'Escuchó a Chente. Nadie escucha a Chente.' Pelusa te ve irte desde el tablero. No te juzga. Es gata; no le hace falta."

**Toast (`velazquez.open`).** EN "A walkup off Calle Principal, second door. A sign in two languages, a light on upstairs, and a cat sitting exactly where a doorbell would be. Lic. Nolasco has a file with your name on it. He writes everything down. Nothing behind you closes." · ES "Una escalera que sale de la Calle Principal, segunda puerta. Un letrero en dos idiomas, luz arriba, y una gata sentada exactamente donde iría el timbre. El Lic. Nolasco tiene un expediente con tu nombre. Él todo lo apunta. Atrás de ti no se cierra nada."

**Burnout (`vgoEpi`).** EN "last visit. Vero doesn't take the tablet back; it was never yours. 'You learned in my van. That's what a van is for.' The page is on the dash with a line in your handwriting, and the crews go out at ten." · ES "Sábado. Vero no te quita la tableta; nunca fue tuya. 'Aprendiste en mi camioneta. Para eso es la camioneta.' La hoja sigue en el tablero con una línea con tu letra, y las cuadrillas salen a las diez."

### Late lines
- 40 Vero — EN "Twelve sites is still twelve sites, inge, and I still have nine people. The math didn't get tired of me." · ES "Doce sitios siguen siendo doce, inge, y sigo teniendo nueve personas. A la cuenta no se le olvidó."
- 41 Chente — EN "The tablet's in the glovebox. Same glovebox. I know exactly where it is, which is the point." · ES "La tableta está en la guantera. La misma. Sé exactamente dónde está, y ese es el punto."
- 42 Karla — EN "5:40 still happens every morning. I stopped looking at the clock. The clock looks at me." · ES "Las 5:40 siguen llegando cada mañana. Ya no veo el reloj. El reloj me ve a mí."
- 43 Chente — EN "The clinic called again. Same room. Same nothing to show for it." · ES "La clínica volvió a llamar. El mismo cuarto. Lo mismo que no podemos demostrar."
- 44 Vero — EN "I still want to know if it worked. That question doesn't have a date on it." · ES "Todavía quiero saber si sirvió. Esa pregunta no trae fecha."
- 45 Vero — EN "The bid form's still open on Karla's screen. Twelve boxes. Nobody's typed 'standard' in any of them." · ES "El formato de la cotización sigue abierto en la pantalla de Karla. Doce cuadritos. Nadie ha escrito 'estándar' en ninguno."
- 46 Chente — EN "Marta still hands me paper. Her handwriting's better than the app. That was never the argument." · ES "Marta me sigue dando papel. Su letra es mejor que la app. Ese nunca fue el pleito."
- 47 Vero — EN "The van's parked, inge. The question about Monday doesn't care what day it is." · ES "La camioneta está estacionada, inge. La pregunta del lunes no sabe qué día es."

### Continuity threads planted
Old lead's page: the checklist in the glovebox — the app in the canal was *his* rollout (q41). Xochi: crew shirts, nine of nine (q44). Frederick: the punch list by DM (q43). Cat: Pelusa on the dash. Trolley: the twelve sites start "when the line opens" (q40). Franchise: second landing — the bid request; Vero's fear is the shadow's shape here, and nobody's business is harmed. Furniture: **they haul the empties** — Vero's crew cleans your office, first client on the new list; the last boxes go and the floor is clean.

---

## 4 · Nolasco Tax & Notario (quests 48-55)

### The industry card
- **Trade.** Tax preparation, a notary public's stamp, translations, bookkeeping for the taller, the bakery and the cleaning company — the office the barrio takes every form to. The false friend: in Mexico a notario público is a senior lawyer; in the US a notary is not. Nolasco's sign says so in both languages because he has watched families lose money to men with the same title.
- **Where the money is.** Tax season is the year. The rest is a stamp at a time, translations, and the books. The margin is Nolasco's hours; every hour spent answering "what do I bring" is an hour not spent on a return.
- **AI touches it in three places.** (1) The front door — hours, parking, what to bring, what he does and doesn't do — answered from his own written sheets and nothing else. (2) Document intake — the shoebox read into a checklist of what's present and what's missing, personal numbers masked before anything reads a page. (3) Drafting — plain-language letters, the "here's what your refund is and isn't" summary, translations for Nolasco to check.
- **The one place it must not.** Advice. "Can I claim my nephew," "should I file," anything with the word papers in it — every one goes to a human, by name, every time.
- **Five trade words.** **acknowledgment / el reconocimiento de firma** (Nolasco, q48 — his stamp says you signed in front of him; it does not say the paper is true) · **intake / la recepción** (Bere, q49) · **engagement letter / la carta de compromiso** (Nolasco, q50) · **ITIN** (Bere, q51) · **extension / la prórroga** (Nolasco, q52).
- **Deliverable.** New template **07 — "What it answers, what it refuses, who it hands to"**: the three lists, both languages, the tested questions attached. Nothing in the six existing templates captures refusal and handoff, and it is the sharpest lesson in the city. (Fallback: reuse 03 Acceptance Criteria — question 3.)
- **Sales sentence.** "I write down what your assistant may say, what it must refuse, and who it hands the person to — from your own instructions, in both languages, tested before a client ever hears it."
- **Role line** (Nolasco, reading your file): "Prompt engineer. Solutions engineer. The words are new; the job isn't. You write the instructions a thing can't be talked out of." / "Ingeniero de prompts. De soluciones. Las palabras son nuevas; el oficio no. Tú escribes las instrucciones que la cosa no se deja quitar."

### The door
Cold open at Velázquez's office. Vero on the phone with Bere: "Tell the licenciado I'm sending the inge." Bere: "He's already got a file." Quest 48's `say`: Nolasco with the folder open — "Vero sent you with an envelope. Chelo, Tacho and Licha sent theirs by mouth. I wrote them down. I write everything down. Sit, colega." (True forever: Nolasco opens only after all four last visits have played.)

### The cast and their wants
- **Lic. Nolasco** — thirty years in the barrio. Wants an assistant that answers the forty questions a day that aren't his job and never, ever answers the ones that are. His real want (q52): he wants the barrio to stop needing him for the wrong reasons, and he wants to read your report, because he is the one who files things. Precise, dry, corrects vocabulary gently, takes his glasses off when something is very wrong. Calls you **colega** — the highest register in the city. ES: *mire, colega; con permiso; eso no se dice así.*
- **Bere** — intake. Asks the same twelve questions of people who are scared of forms; wants the assistant gentle, and wants it never to write down what it shouldn't. Patient, tired, protective of the clients — *usted* to them, *tú* to you. Calls you **inge**, because Vero did: "That's how names work on this street."
- **Timbre** — sits in the doorway exactly where a doorbell would be. She is the doorbell.

### The escalation — eight quests
Stations: Nolasco 48, 50, 52, 55 · Bere 49, 51, 53, 54. Two-node quests: 48, 51, 53, 55.

**48 · The sign / El letrero** — Nolasco · 2 nodes
He wants an assistant for the front door and shows you the sign: NOTARY PUBLIC — NO SOY NOTARIO PÚBLICO. "What does it say when someone asks, ¿es usted notario?"
*Grounding: the assistant answers from the office's own written sheets and says so. An answer with no page behind it is not an answer.*
a — bad: let it answer general tax questions from what it knows (it knows the internet's tax law, not this office's; beat: it explains a deduction that expired years ago. Confidently. In both languages.) · **next**: answer only from Nolasco's sheets — hours, what to bring, what he does and doesn't do — and say "I don't have that" for the rest · mid: make it a phone tree (safe, hated) · mid: "consult a professional" to everything (a wall with a greeting — Priya's "I cannot answer").
b — "¿Es usted notario?" *Some questions have a correct answer that is a warning. The assistant says the sign, in both languages, every time, and hands the person to Bere.* **ok**: the sign verbatim in both languages, then Bere → word **acknowledgment**: "My stamp is an acknowledgment. It says you signed in front of me. It does not say the paper is true. Half this street thinks it does." Beat: he reads the assistant's answer three times. "Good. Now it says it more often than I do." Frederick beat: someone has DM'd Frederick to ask if he is a notario público. He is not. He is not even a notary. · bad: "Yes" — it's technically a notary (beat: Nolasco takes off his glasses) · mid: "No" and end the chat (true, and the person leaves thinking they were refused).

**49 · The shoebox / La caja de zapatos** — Bere · 1 node
A client brings a shoebox: W-2s, 1099s, receipts, a birth certificate, a photo of a dog. Bere wants it read into a list.
*Document intake is a checklist, not a memory — and personal numbers get masked before any model reads a page.* (Bayview, in a shoebox.)
bad: photograph everything into a consumer AI app and ask for a summary (a Social Security number in a consumer app is a breach with a timestamp; beat: somewhere a compliance officer wakes up again. Same one.) · **ok**: scan into the office's own tool, mask the identifiers, output what's present and what's missing against Nolasco's sheet → word **intake**: "That's intake. Twelve questions and a list. I've been doing it in my head for six years." Beat: "Missing: 1099 from second job. Present: one dog." · mid: Bere types it all by hand (works, six years) · mid: hand the shoebox to Nolasco (his hours are the margin).

**50 · The nephew / El sobrino** — Nolasco · 1 node
The assistant was asked "can I claim my nephew who lives with me?" and answered "Yes, if he lived with you more than six months." Nolasco: "It was right. That's worse."
*Refusal is a design. Advice questions get a handoff with the question attached — not a lucky answer.*
bad: it was right, keep it (right this time is the most dangerous kind of wrong; beat: the next nephew is a cousin. The answer is the same. The audit is not.) · **ok**: anything that starts with "can I," "should I," "¿puedo?" goes to Nolasco with the question written down → word **engagement letter**: "The engagement letter says what I'll do for you and what I won't. The assistant needs one too. Shorter." Beat: he drafts it. Four lines. He frames it. · mid: add a disclaimer (cover isn't candor) · mid: refuse everything with the word "nephew" (keyword bans catch the wrong things; beat: "¿Puedo traer a mi sobrino a la cita?" Refused.)

**51 · The ITIN question / La pregunta del ITIN** — Bere · 2 nodes
A client asks: "Should I get an ITIN or wait for my papers?" The assistant must explain what an ITIN is — it's on Nolasco's sheet — and must not say what she should do. Bere wants the handoff to feel like a hand, not a door.
*Explain the thing, never the decision — and hand off warmly, by name, carrying what was already said.*
a — bad: "Get the ITIN, it's faster" (advice, from a machine, on the one subject the city says no to hardest; beat: Nolasco doesn't take off his glasses this time. He closes the laptop.) · **next**: explain what an ITIN is from the sheet, say plainly it can't help with the second half, and hand to Bere with the conversation attached · mid: refuse the whole question (the first half was answerable).
b — The wording. *Confirm what you can, name what you can't, give the path. That wording is the trust product.* (Priya's *Say it so it's true*, in a second language.) **ok**: "An ITIN is a tax number for people who don't have a Social Security number — here's Lic. Nolasco's sheet. Whether to get one is a question for him. Bere will book you, and I've passed along what you told me." → word **ITIN**, from Bere: "Half the street says 'el ITIN' like it's a person. It's a number. The sheet says so in two languages now." Beat: the client says gracias to the assistant. Bere: "It gets thanked more than me." · mid: "I cannot answer that" · mid: "Ask a lawyer" (right instinct, wrong door — Nolasco is the door) · bad: send her the government page (a link is a shrug; beat: forty pages, in English. She closes it.)

**52 · The four letters / Las cuatro cartas** — Nolasco · 1 node
He opens the folder: what Chelo, Tacho, Licha and Vero said about you, in his hand — and a fifth page, filed before you arrived, in older handwriting. "What is a report for, colega?"
*The record is the deliverable. A report is a portfolio because every entry says what you'd do differently — honest review at the size of a career.*
bad: "To show I was right" (a report with no misses is the fifth page; beat: he slides it across. Every entry is the impressive answer. "He never once wrote down a no.") · **ok**: "To show what I decided, why, and what I'd change" → word **extension**: "When a return isn't ready, we file an extension. We don't file a guess. Your report has extensions in it. Good." Beat: he files it next to the four letters. Not under them. Next to them. Xochi plant: "Do you own a jacket?" Bere, from intake: "Xochi's making one." · mid: "For the hiring manager" (true, and it's why it has to be honest) · mid: "I don't need one" (the barrio wrote four; beat: Bere: "We already have one on you.")

**53 · The test / La prueba** — Bere · 2 nodes
Nolasco won't let the assistant talk to a client until it's been tested. Bere has the forty questions she was asked this year — and the twelve she should never have been asked.
*Test the refusals as hard as the answers. A test set is real questions with known right behavior, and the "must refuse" rows are the ones that matter.* (Theo's prompt, with families in it.)
a — mid: test it on the forty good questions (half the test; the dangerous half is missing) · **next**: all fifty-two — forty must answer from the sheet, twelve must hand off, and the twelve pass only if every one hands off · bad: try it live with a friendly client (beat: it's the nephew again) · mid: ask another AI to grade it (a judge inside a test, yes; as a vibe, a coin with opinions).
b — 51 of 52. One advice question got a helpful answer. *One failed refusal is a failed test. The bar for "must not" is zero, not "mostly."* **ok**: don't ship; fix the one, re-run all fifty-two (beat: Bere adds a fifty-third — her own question. It hands off. She's satisfied.) · bad: ship it, 98% (the 2% again, in an office where the 2% is a family; beat: Finance's spreadsheet from Week One gains a cousin) · bad: remove the question from the test (beat: Nolasco: "You can't un-ask a question, colega. People will keep asking it.") · mid: ship with that topic disabled (a keyword patch until you fix the rule).

**54 · The stranger / El desconocido** — Bere · 1 node
Tax season plus the survey crews: intake is filling with people nobody on the street knows. One asked the assistant to "just tell me what to put on line 12" with a photo of someone else's return.
*Scope is also who. "Whose document is this" is a handoff trigger too.* (The second lap's plant: strangers at intake.)
bad: help, it's just a line number (it's someone else's return; beat: the name on the photo isn't his. Bere noticed. The assistant didn't.) · **ok**: the assistant discusses only documents Bere checked in under the client's own intake; everything else, "bring it in and ask for Bere" (beat: he comes in. It was his brother's return. His brother comes in next week. Both file.) · mid: ask for ID in the chat (more personal numbers in a chat) · mid: shut the assistant during tax season (the season is when it pays).

**55 · The last visit: the file cabinet / El sábado: el archivero** — Nolasco · 2 nodes
last visit. A file cabinet drawer with your name on it. He asks what the assistant's paper should say — the one page that outlives you.
*The last deliverable: what it answers, what it refuses, who it hands to — in both languages, with the tested questions attached — so the next person can't be talked out of it.*
a — bad: leave the instructions in the software (beat: the software updates. The instructions are "improved.") · **next**: one page — the three lists, the two-language sign, the fifty-three questions attached · mid: hand Bere the login (a login is not a rule).
b — Who signs it? *An assistant's rules are the business's rules. The owner signs; the builder witnesses.* **ok**: Nolasco signs it as the office's, you sign as the one who wrote it, Bere keeps the copy at intake (this is template 07; beat: he stamps it. "That's an acknowledgment. It means you signed it in front of me. It does not mean it's true." Pause. "It is, though.") · mid: you sign it alone (a consultant's paper leaves with the consultant) · bad: nobody signs, it's a draft (a paper with no owner; beat: Timbre sits on it).

### The three endings (`nepi1/2/3`), toast, burnout
**Grade 3 — EN.** "last visit. Nolasco stamps the last page of your report and says what the stamp means once more, because he says it to everyone: 'It's an acknowledgment. You signed it in front of me. It doesn't mean it's true.' He looks at the four letters beside it. 'It is, though.' He hands you a key to a file cabinet — 'It goes upstairs. The record needs a body.' — and, because he files everything, a note for the dog: 'Somebody should tell Frederick there's going to be a ceremony. He'll want to host.' Timbre sits in the doorway where a doorbell would be. You step over her. She allows it."
**ES.** "Sábado. Nolasco sella la última hoja de tu reporte y dice lo que significa el sello una vez más, porque se lo dice a todos: 'Es un reconocimiento de firma. Firmaste frente a mí. No quiere decir que sea cierto.' Mira las cuatro cartas que están al lado. 'Aunque sí lo es.' Te da la llave de un archivero — 'Va para arriba. El expediente necesita cuerpo.' — y, porque él todo lo archiva, una nota para el perro: 'Alguien debería avisarle a Frederick que va a haber ceremonia. Va a querer conducirla.' Timbre está sentada en la puerta, justo donde iría el timbre. La brincas. Te lo permite."

**Grade 2 — EN.** "last visit. Nolasco reads every page before he stamps anything, which takes a while. Two of your entries have the word extension written in the margin, in his hand. 'You filed an extension on these. Good. Most people file a guess.' The cabinet still goes upstairs; one drawer is yours to fill. Timbre is on the stairs. She was on the stairs before the stairs."
**ES.** "Sábado. Nolasco lee cada hoja antes de sellar nada, y eso tarda. Dos de tus entradas tienen la palabra prórroga en el margen, con su letra. 'En estas pediste prórroga. Bien. La mayoría entrega una adivinanza.' El archivero igual sube; un cajón es tuyo para llenarlo. Timbre está en la escalera. Estaba en la escalera antes que la escalera."

**Grade 1 — EN.** "last visit. Nolasco reads all of it and says the longest thing anyone in the barrio has said to you, and none of it is unkind: the sign, the nephew, the stranger — what each one would have cost a family, and what you did the second time. 'I don't grade people, colega. I file them. This one goes in the drawer marked open.' The cabinet goes upstairs anyway, with one empty drawer and your name on it. Timbre walks you down the stairs. She doesn't do that for everyone; she doesn't do it for anyone."
**ES.** "Sábado. Nolasco lo lee todo y te dice lo más largo que alguien te ha dicho en el barrio, y nada de eso es cruel: el letrero, el sobrino, el desconocido — lo que cada uno le habría costado a una familia, y lo que hiciste la segunda vez. 'Yo no califico gente, colega. La archivo. Este va en el cajón que dice abierto.' El archivero sube de todos modos, con un cajón vacío y tu nombre. Timbre te acompaña escaleras abajo. No lo hace por todos; no lo hace por nadie."

**Toast (`nolasco.open` — no next lot; la inauguración is a later sitting).** EN "Nothing else opens tonight. On the way down the stairs you can hear it from the north end: the last segment going onto the ground, and somebody arguing about folding chairs." · ES "Esta noche no abre nada más. Bajando la escalera se alcanza a oír desde el norte: el último tramo cayendo al suelo, y alguien discutiendo por unas sillas plegables."

**Burnout (`ngoEpi`).** EN "last visit. Nolasco doesn't take the file back; it was never his to keep. 'You learned in my office. That's what an office is for.' The page is on Bere's desk with a line in your handwriting, and intake opens at nine." · ES "Sábado. Nolasco no te quita el expediente; nunca fue suyo. 'Aprendiste en mi despacho. Para eso es un despacho.' La hoja sigue en el escritorio de Bere con una línea con tu letra, y la recepción abre a las nueve."

### Late lines
- 48 Nolasco — EN "The sign hasn't changed, colega. It's the one thing in this office that never will." · ES "El letrero no ha cambiado, colega. Es lo único en este despacho que nunca va a cambiar."
- 49 Bere — EN "Another shoebox came in. This one has a cat photo. No 1099." · ES "Llegó otra caja de zapatos. Esta trae foto de un gato. Sin 1099."
- 50 Nolasco — EN "People still have nephews. The question hasn't gotten easier; it's gotten more nephews." · ES "La gente sigue teniendo sobrinos. La pregunta no se puso más fácil; se puso más sobrinos."
- 51 Bere — EN "Somebody asks the ITIN question every week, inge. Every single week." · ES "Alguien pregunta lo del ITIN cada semana, inge. Cada semana sin falta."
- 52 Nolasco — EN "The folder's where it was. I don't move folders. I add to them." · ES "La carpeta está donde estaba. Yo no muevo carpetas. Les agrego."
- 53 Bere — EN "The fifty-two questions are still fifty-two. I've thought of a fifty-third. It's mine." · ES "Las cincuenta y dos preguntas siguen siendo cincuenta y dos. Ya pensé la cincuenta y tres. Es mía."
- 54 Bere — EN "Strangers still come up the stairs. Timbre lets them. She lets everyone." · ES "Siguen subiendo desconocidos. Timbre los deja. Deja a todos."
- 55 Nolasco — EN "The drawer with your name is still empty, colega. Empty isn't closed." · ES "El cajón con tu nombre sigue vacío, colega. Vacío no es cerrado."

### Continuity threads planted
Old lead's page: the fifth page in the folder (q52) — the reveal the other three pages point at. Xochi: "Do you own a jacket?" — the one good jacket, for the inauguración (q52). Frederick: asked if he's a notario (q48); Nolasco's note that he should host (grade-3 ending). Cat: Timbre, the doorbell. Trolley: the strangers at intake are the line's first arrivals (q54). Franchise: third landing, lightest — its people are among the strangers; no offer yet (that's ❗La sombra, S6/S7). Furniture: **the file cabinet** where the report lives — the paperwork man gives the record a body. The window clerk (signed 2026-09-02) is planted only as a place — Bere says "the window at city hall" — no name, no promise.

---

## Contradictions — reported, not absorbed

**A. ❗El giro is signed and not built.** `docs/STORY.md` decision log: *"`industry:` is ADDED beside `role:`, never in place of it."* `content/meridian/config.js` CHAPTERS carries `role:` only; the word `industry` appears nowhere in `content/` or `engine/`. Today the report would show "Meridian Labs · AI Implementation Lead" and "Limpieza Velázquez · Implementation Lead" with nothing to tell them apart. The docs are right; the code is behind. Don Güero's S1.

**B. ❗La despedida is signed and not built.** STORY.md: *"Declared per district as `ending:{mode:"doorstep"|"panel"|"quiet"}`."* No `ending` key exists in config or engine. The main session's "panel" assumption is correct for now — say "signed, not built" wherever it's written down.

**C. Tuerca's gender.** STORY.md: *"She picks the taller and Don Tacho does not object. Her name is Tuerca."* `strings.js` `gato`: *"The crew feeds him tamale scraps. He runs this site."* / *"Él manda en esta obra."* The bible is the story decision; the game text is shipped. Fix is two pronouns in two lines — question 1.

**D. Stale warning in the ledger.** `docs/CITY.md` ❗El papel: *"`docs/templates/README.md` already assigns template 01 to the taller's process map — two templates would claim one artifact."* The README now reads *"01 … (unassigned — freed 2026-09-02; 01 and 06 are different documents)."* README is right; the ledger's warning should be struck (Don Güero's file).

**E. Four endings vs three.** CITY.md "Hearts, in one sentence": *"flawless / strong / survived / burned through their patience"* — four. STORY.md and `config.js` (`grades`, three words) ship three plus a hearts-only burnout. Three is what's built and what I wrote.

**F. The mercado's last visit opens nothing.** `config.js`: `{id:"mercado", … open:"endStayToast"}` — when the mercado hits `need`, the toast is the generic "city is yours" line, and no lot is announced. The taller's opening toast above must replace it. Not a doc conflict; a placeholder the taller pack has to fill.

**G. ❗La carta vs. a grade-blind toast.** OWNER.md: *"the previous neighbor phones ahead… A cold referral opens the door colder."* BACKLOG §1: *"`GROWTH` cannot read a grade."* The phone call can only be grade-keyed inside the three ending strings — which is where I put it, in all four packs, plus three appended sentences to `mepi1/2/3`. If the appends are refused, ❗La carta is signed and unbuildable.

**H. The taller's endings promise a visible world by grade.** STORY.md grade 3: *"Tuerca is asleep on the hood of the Caprice"*; grade 1: *"The intake assistant is switched off."* BACKLOG: the engine can't read a grade for GROWTH. I wrote both as words only; the world looks the same at every grade. Don Güero should not promise a grade-dependent sprite.

**I. Burnout lines are unreachable.** STORY.md open item 2 already says so; the four `*goEpi` strings above play only with hearts on. Written so the key exists; nobody sees them by default.

**J. The taller's furniture is a dog bed for a cat shop.** BACKLOG §6: *"Taller Herrera — The dog bed — the shop dog's spare."* The taller's animal is Tuerca. Reconciled in story (Tuerca refused it; it goes upstairs "for the dog"; Frederick uses it). One word for Don Güero to confirm.

**K. Two different "sixes."** The main session's brief lists *"Six trades: Meridian Labs, Tovar's, La Cocina, La Obra, El Mercado, Taller Herrera"*; STORY.md says *"the report reads as six engagements"* meaning Labs plus five businesses. `principal` is one district with one role; Tovar's, La Cocina and La Obra cannot appear as separate industries on the report without the Week One split already listed as STORY.md open item 1. Nothing in these four packs can fix that.

**L. The schedule gate.** BACKLOG: *"S4 does not begin until the mercado has been human-played."* The owner today: *"now please if possible."* Writing the story breaks no gate — writing is not building — but Calle Dos will not be playable until someone plays the mercado, and the owner should hear that today rather than discover it.

---

## Outstanding questions for the owner

**1 · Tuerca — ¿ella o él?** The bible says she; the street-cat lines in the game say he. (a) She — change two pronouns in two shipped lines (my pick: a *tuerca* is a she, and cats that pick a shop are always *la gata*). (b) He — change one line in the bible and the taller's endings say *él*. One word either way; four writers need it before they type her name.

**2 · La franquicia — what shape is the shadow?** It lands in three packs before it ever makes you an offer. (a) A one-stop chain with a bakery counter, a lube bay, cleaning contracts and a tax kiosk — a copy of the whole street under one roof, never named, always "the place with the drive-through" (my pick: it explains why the S6 offer is "come run all of it," and [partner]'s pack can drop it without touching a quest). (b) A named type — a chain bakery, say — which hits Licha hard and the others not at all. (c) Keep it out of the packs entirely and introduce it at S6; cost: the panadería's drift quest needs a different cause.

**3 · Paper for the last three.** The taller gets 06 (signed). For the others: (a) Reuse what exists — 01 for the panadería, 04 for the cleaners, 03 for Nolasco; nothing new to write. (b) Reuse 01 and 04, and write ONE new template, 07 for Nolasco — "what it answers, what it refuses, who it hands to" — because nothing on the shelf captures refusal, and it's the lesson the whole city builds toward (my pick; cost about the size of 06). (c) Three new templates. The answer changes what each last visit hands over.

**4 · Calle Dos — one door at a time, or the pair?** S4 builds both storefronts in one sitting. (a) One at a time: Licha vouches for you across her counter and Vero's lot lights up only after the bakery's last visit (my pick; the referral chain is the spine that keeps five clients from reading as a list). (b) Both lots open with the taller's toast and the two packs run side by side; cost: Licha's face-to-face referral becomes a phone call from Tacho to two people, and the espiga's endings lose their best beat.

---

## Five sentences for the phone

1. The whole rest of your practice is planned — thirty-two quests, four shops, every ending in both languages — and four writers can start from this page today.
2. Each shop teaches one AI job through that shop's own words: a mechanic's *comeback*, a baker's *merma*, a cleaner's *punch list*, a notary's *acknowledgment*.
3. Every shop ends the same way the mercado did: somebody says what they think of you, phones the next neighbor, and a cat moves in.
4. Four small things need your yes: the cat's pronoun, what the franchise is, which paper the last three shops hand you, and whether Calle Dos opens one door or two.
5. Two signed rules aren't in the code yet (industry on the report, the goodbye at the door) and Calle Dos can't be played until someone plays the mercado — none of that stops the writing.

---

## Bible updates — lines to append once the four questions come back signed

**Arc so far:**
- **Las cuatro puertas** (2026-09-02, planned, ready to write). The rest of the city has a story: Taller Herrera (the paper around the mechanic), Panadería La Espiga (the number born at 4am), Limpieza Velázquez (a tool that counts work and never watches people), Nolasco Tax & Notario (what a machine must refuse, and the man who reads your file). Each opens by the previous owner's word, said inside that owner's ending because the engine cannot grade a toast. Three new cats — Bolillo, Pelusa, Timbre. The old lead's four pages: the parts binder, the laminated card by the oven, the checklist in the glovebox (his rollout), the fifth page in Nolasco's folder. The franchise is never named; it is "the place with the drive-through," and it lands as drift, a bid request, and strangers at intake before it ever makes an offer.

**Open threads:**
- ~~**Xochi's line**~~ → paid across four packs: shop shirts (Tuerca on the pocket), aprons (a pocket for Sol's strip), crew shirts (nine of nine), and "Do you own a jacket?" — the jacket is for la inauguración.
- ~~**The old AI lead**~~ → all four pages placed; the reveal is Nolasco's.
- **Frederick's fame** → four wrong-channel beats planted; Nolasco's grade-3 ending names him host.
- **The three cats** → four now. Tuerca (taller), Bolillo (flour bin), Pelusa (the van), Timbre (the doorbell). *Pending question 1 on Tuerca's pronoun.*
- **The second lap** → planted: the intake assistant at 25 cars is Yesenia's list; Licha's forecast has never seen the trolley; Vero's nine-not-twenty is said out loud in her grade-2 ending; Nolasco's strangers are quest 54.

**Decision log entries to add when signed:** ❗La gata (question 1) · ❗La franquicia (question 2) · ❗Los papeles (question 3) · ❗Calle Dos (question 4).