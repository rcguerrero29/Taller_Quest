# The Story Bible 🖌️

Nacho's wall. The `/nacho` skill reads this, plans the narrative on Opus 5, and
brings story decisions back as side quests. Signed decisions are canon.

## Premise

You are the new AI lead at Meridian Labs — the old one fine-tuned something he
shouldn't have and was never seen again. The real story: a barrio learning to use
AI without losing itself. Every business that opens is a neighbor betting their
livelihood; every quest is a judgment call with a face attached. Bilingual EN/ES.

## Principles (owner-signed)

- **Teaching mode IS story mode** (owner, 2026-08-31). Concepts land as beats.
- **Districts, not weeks** (owner, 2026-08-31). Weeks One and Two stay in the
  fiction as written; nothing new is counted in days. A business is a
  relationship with a first visit, an escalation, and a last visit that pays off.
- **The grade picks the ending, and the grade is always on.** Every ending has a
  3 / 2 / 1 variant — the tone shifts, never the door.
- **Stakes are an optional layer on top** (`none` by default; `hearts` for a
  mini-game). Story is written for `none`: no quest text may threaten a life, a
  reset or a week. With hearts on, the story reads exactly the same.
- **Nothing is ever taken away** — not progress, not the city, not a character's
  business. A rough grade costs warmth, never access.
- Retry-until-correct: wrong answers are scenes too — the codex teaches, the
  shuffle re-tests, nobody is humiliated.
- **The city has no credits.** Every ending hands the player something and points
  at the next lot.
- **A day may end. It may never close anything.** Days are light and memory, not
  containers for content. If a day's ending changes what the player CAN DO, it is
  a week wearing a hat. *(signed 2026-09-01, ❗El día)*
- **La inauguración plays in the world, not in a curtain** — the CITY's final ceremony,
  and only that. *(signed 2026-09-01, ❗El listón; SCOPE CORRECTED 2026-09-02 — the
  session, not the owner, generalised it to every ending in the game and then cited it
  against `finish()`. See docs/OWNER.md.)* A DISTRICT's last visit is a separate call.
### La esquina (2026-09-17) — Doña Meche's corner

The barrio's smallest business got a page. **Measured, not assumed: nobody on Calle Dos had ever
carried a ❗ in any chapter state** — six people, six empty quest queues, a street dressed for a
fiesta that never needed you. Doña Meche carries it: a pot, a folding table, a corner she owns by
standing on it, and the only business in Meridian with no door, no employee and no register. Four
quests, `need:3`, appended last so no save's `chSeen` moves.

The craft is the mercado's — **AI product manager** — in the opposite room, which is ❗El giro's own
proof that a skill transfers: *the user is not the requester* (she asked for an app; the person
hurting is four blocks up the street), *design for the hand that is busy* (a sign flipped with a wet
wrist beats a screen at nine in the morning), *a refusal must hand off to somebody who exists* (there
is no representative; there is Meche at four in the afternoon), *one record, claimed* (a delivery app
was already answering questions in her name, from a photograph of her own hands), and the last visit
— **a solution is a template plus somebody else's own record**, which is the sentence this city owes
a man who intends to sell this skill onward.

**The office sends you** *(owner, 2026-09-17: "ok yeah lets do the office sending me")* — not
Nolasco. A page you wrote is on your own office wall and there is a name on it you have walked past
forty times. It costs no canon change (*"Nolasco's door opens nothing"* stands) and it makes the
office mean something for the first time.

**Doña Chayo of Quinta** is the next offstage name to take a tile — atole, forty years, and her sign
says *YA MERO* instead of *SE ACABÓ*, because atole does not end, it thins. **Vapor**, the trolley
stop's cat, belongs to nobody and has decided the pot is the warmest object on Calle Dos; she is in
all three endings and owns nothing, which is the rule the corner teaches about everything on it.

- **Nobody is introduced by a reference a newcomer cannot follow.** *(Owner, 2026-09-17: "tell the
  agents to ensure a person just meeting the characters cant be confused as to what they are talking
  about.")* Not "explain everything" — **the first time a name, a place or a piece of trade
  vocabulary appears in front of the player, the sentence carrying it must also tell them enough to
  keep walking.** One clause usually does it: not *"Chayo wants the same"* but *"Doña Chayo works
  the corner by the clinic on Quinta — forty years, atole where I do tamales — and she wants the
  same."* Three ways it goes wrong: a name dropped as if already known; a callback to a district the
  player may have skipped (districts open in order, the quests inside them do not); and **the
  project's own private words leaking into the fiction**, which is the one that bit us — the internal
  term for a district's ending was "a Saturday" and it ended up as a title prefix on five quests in
  two languages. The check: read the scene as somebody whose first five minutes in this city this is.

- **A district needs FOUR quests and a `need` of THREE, minimum — or one of its endings is
  fiction.** *(2026-09-16, found by Nacho while costing la esquina; corrected in `docs/CITY.md`
  on the owner's word 2026-09-17.)* `gradeOf` grades on the fraction of **answered** quests that
  landed first try, and the last visit fires the *instant* `need` is met — so with `need:2` exactly
  two are answered, the fraction can only be 0, ½ or 1, and the grades are **1, 1, 3**. The middle
  ending would be written and never played, and nobody would notice, because a missing ending does
  not fail: it simply never appears. `need:3` of four gives 0, ⅓, ⅔, 1 → **1, 1, 2, 3**. And
  `test/smoke.js` separately refuses `need === quests.length`, so three-of-three was never open
  either. **❗El espejo was signed at three and two and is corrected before anybody writes it** —
  which is the cheap moment to find this, and the only one.

- **A district's LAST VISIT is a goodbye at the door.** *(2026-09-02, ❗La despedida —
  the owner deferred the call to /nacho. **Renamed from "a Saturday" on 2026-09-17**, owner:
  *"this concept of a Saturday is silly, explain it differently"* — and he is right. "Saturday"
  was a private metaphor about the end of a working week that told a reader nothing and had to be
  learned before any of these pages made sense. It is the LAST VISIT, because that is literally
  what it is: you walk up to that person one more time and that walk is the ending.)*
  **In plain words:** every business in this city is a small job you take. You meet them, you do
  some work, and then you go and see them one last time — and how that visit goes depends on how
  the work went. Reaching `need` ends nothing: it puts a ❗
  over that business's owner, and walking up to them IS the ending. Three to five spoken
  beats keyed to the grade, an object in your hands, the role said out loud once, and
  the phone call to the next neighbour placed before you are off the lot. The long
  version waits in your office as a letter, re-readable forever. Nothing takes control;
  the ❗ waits as long as you do. Declared per district as
  `ending:{mode:"doorstep"|"panel"|"quiet"}` — never hardcoded, so a pack picks its own.
  **Hard dependency: this needs the office. If `f2` is not furnished, districts keep
  `mode:"panel"`.**
- **No practice is ever missed.** Every quest stays answerable forever; a quest the
  world outgrows gets rewritten, never removed. *(owner, 2026-09-01: "i dont
  understand why i would miss any practice, if anything got stale.")* The shipped
  line `retryNote` — "this one stays open, come back and make the better call" —
  was always this law; it just applied to one quest instead of the city.
- **Old quest, reframe line; changed world, new quest.** A late-answered quest keeps
  its text and gains one line in the NPC's voice that acknowledges only that time
  passed — never what happened in it, or the reframe goes stale too. When the world
  genuinely moves on, you write a second-order quest (the second lap), never an edit.
- **Never a quest log.** A list of undone things is a backlog; a person with
  something to tell you is an invitation. The ❗ means one thing forever — *this
  neighbor has something to say* — with no count, no colour, no age. One person,
  one open ask at a time; that is the bound that keeps an open city from piling up.
- **Paint only ever goes on.** A grade can improve after its ending played and the
  mural repaints — but a late answer may never scrape colour off a panel already
  earned. Derived from "nothing is ever taken away"; recorded so nobody freezes the
  grade at the last visit, and nobody lets a rusty return trip cost the player a wall.
- **A quest may depend on another quest only if the same person gives both.** The
  station queues (`WNPC` / `STATIONS`) serve one NPC's quests in order, so "one more
  thing…" is always safe inside a character. Nothing enforces order between two
  characters. Cross-NPC callbacks get written as general law, not as history — quest 0
  says "'Sounds right' is *how* Free Churro Friday happens," which reads as
  foreshadowing or as lore in either order. Copy that technique. *(2026-09-01, from
  the continuity pass.)*
- **Every ambient line must be true forever.** Chat has no state — Beto promised
  groceries in two weeks for a year, and Chava's catchphrase outlived the quest that
  fixed him. A townsperson's line is written to survive its own resolution or it is
  written differently. *(2026-09-01.)*
- EN and ES are equals, written with sazón, never machine-flat.

## The arc so far

- **Week One** (quests 0-15): the office proves you're real — RAG vs fine-tuning,
  guardrails, build-vs-buy — then the barrio does: La Cocina trusts you, La Obra
  raises the Studio with your calls, Xochi opens her collar line. Ends at the feria
  de logros; the epilogue promises Week Two.
- **Week Two, chapter one** (quests 16-23): Monday. Doña Chelo unlocks the gate and
  El Mercado Robles grows onto the southwest lot. You're the de-facto AI PM —
  scoping, saying no, shipping the small version. Plays its last visit at 5 of 8
  quests **and stays open** — epilogue at the register ("You built me a Tuesday I
  can trust"), and the other three answerable forever.
- **The open city** (post-mercado, planned 2026-09-01). Weeks end; referrals
  begin. Doña Chelo phones Don Tacho, and what she says is the grade you earned
  at her register — the barrio is the player's reference letter. Four businesses
  stay open at once and the through-line is **Barrio Norte**: the MQT is laying
  the northbound track teased since Multiplayer 🚧. It is a deadline in the world,
  never a countdown on screen — everyone has a reason to get ready now, and nobody
  is punished for not being. What arrives with the line is **good news with a
  shadow**: more foot traffic, and a franchise scouting the north end. Two visible
  progress bars, neither a number: Nacho's mural fills one panel per finished
  business (unfinished business stays in charcoal outline, paintable forever), and
  the rails advance a segment. *Not a retcon:* Week One made you Meridian Labs'
  AI lead; the barrio is what you do with it. From here you are the person the
  neighborhood calls.
- **La inauguración** — the city's turn, not its ending. Fourth district closed,
  the player next steps onto Calle Principal: the street is dressed (papel picado,
  folding chairs, the cast in their own doorways), one trolley horn from the north,
  one toast — *"El barrio se pintó solo. Yo nomás sostuve la brocha." / "The barrio
  painted itself. I just held the brush."* — and the trolley pulls into the west
  terminus carrying people who have never been here. Five seconds, fully diegetic,
  control never taken. **The grade is carried by the mural alone** (full colour /
  one charcoal panel / mostly outline) — no words, readable at a glance, permanent.
  The four owners' speeches become **walk-up dialogue** while the chairs are up:
  the player elects to hear their own report card, and a player who would rather
  walk is never cornered. The decision report **hangs on the mural wall, forever**.
  Nacho's line lives at that wall any time outline panels remain: *"Un mural no se
  acaba. Se deja listo para el que sigue."*
- **The morning after.** The day ends while the player is away. Next launch: chairs
  stacked against the wall, papel picado torn a little by wind and nobody's taken
  it down, a neighbor mentions yesterday, a new sign on a lot. Nothing announced;
  the street simply remembers. **Reusable for every business's last visit** — close
  the taller at dusk, come back Monday and Tuerca has moved onto the Caprice.
- **La carpeta abierta** (2026-09-01). The owner's law arrives as story: nothing in
  Meridian closes. Doña Chelo does not ask for the keys back; the work you didn't
  finish is a folder on her counter with your handwriting on it, and the gate opens
  at seven. The first lap is **the referral** — a neighbor vouches for you to the
  next one. The second lap is **the callback** — a neighbor phones *you*, by name.
  A business's second-order quest only opens after its own last visit, so the barrio
  deepens instead of accumulating and "more training" reads as a promotion.
- **La línea tardía** (2026-09-01, built). The law grew a voice. Every quest in the
  city can now open with one line from its own NPC that acknowledges only that time
  passed — never what happened in it, or the reframe goes stale with the world.
  Twenty-four of them, EN+ES. The grammar is fixed and it is the whole discipline:
  **the neighbor is still interested, never still waiting on you.** "I never closed
  that folder" is a door; "you never answered me" is a bill. No *finally*, no
  *took you long enough*. Two carve-outs, both earned: a line may report a cycle the
  quest itself already declared (Tovar's monthly doc churn, the mercado's annual
  hoja-de-maíz stockout), because the more time passes the truer those get. Frederick
  has none and never will — his quest belongs to no district, so the seam can never
  fire, and he already reopens his folder for a treat, which is the joke.
- **La despedida** (2026-09-02). The city learned how to say goodbye. A district's
  ending stopped being a screen and became a doorway. The street grows while you stand
  there — the mural panel takes colour, the rails advance, ground breaks on the next lot.
  The paragraph that used to be the epilogue screen is filed in your office beside the
  furniture that business sent you. **The grade asymmetry is the design:** at grade 3 the
  letter is short, because they already said it to your face; at grade 1 it is the
  longest of the three, because a letter can be honest in a way a doorstep goodbye
  cannot. A rough run sends you home with the most words — "consequences over scolding"
  and "learning beats punishment" doing the same job at once. **The goodbye is the only
  thing that grows the city, and it never expires.**
- **Meridian Labs is the sixth trade** (2026-09-02, ❗El giro). HQ becomes corporate /
  enterprise IT. Every quest now
  lands under an industry, the report reads as six engagements instead of five plus an
  orphan, and the `principal`/Limpieza "implementation lead" collision dissolves rather
  than being patched: the same craft in two very different rooms is proof the skill
  transfers. Cost accepted: Meridian Labs stops being neutral home base and becomes a
  client with a *giro* — softened by the player's desk moving upstairs to `f2` anyway.
- **El oficio y el giro** (2026-09-02, owner's steer: *"lets focus on highlighting and
  learning the AI with how it can help diff industries"*). Five job titles become five
  trades. A role is a label; an industry is a room with a smell — and every memorable
  beat this pack has produced came out of a trade, not a title: the paper book, the photo
  estimate, the four hundred kilos of PESCADO, the notario false-friend. The role does
  not leave; it shrinks to one line in a character's mouth and stays a lens on the report.
  Each pack now owes an **industry card** (the trade, where the money is, the three places
  AI touches it and the one place it must not), **five terms in that trade's own
  vocabulary** (a shop says *comeback*, a bakery says *stockout*, a cleaning company says
  *punch list*), **one deliverable**, **one plain sales sentence** a consultant could say to
  a real prospect, and **one role line**. The gradient survives as the **grain**, not the
  spine — what each room teaches best — and the referral chain, never a lock, keeps the
  order. **The one danger:** five clients can read as a list instead of an arc. Barrio
  Norte, the franchise's shadow and the second lap are what make them chapters.
- **The second lap** — what "more training" means after the ribbon. The franchise's
  shadow and doubled foot traffic hand every neighbor a *second-order* problem, the
  kind you only get after the first thing worked: Chelo's bot misses the ten angry
  calls (drift and the long tail), Tacho's intake breaks at 25 cars (scaling a
  workflow that was right when built), Licha's forecast predates the trolley
  (distribution shift, arriving by rail), Vero's adoption held at 9 crew and not at
  20, Nolasco's intake fills with strangers (refusal and escalation under new PII
  pressure). Zero new parcels, zero new cast, zero new maps. The truest version of
  *clients, not chapters*: a real client calls you back.
- **El cuarto de arriba** (2026-09-02). The office stopped being a promise and became a
  bare room with two people in it. Nacho came up from the street with his sketch pad,
  Güero with his clipboard, and between them they ask the player ten questions that
  have no wrong answer — the first conversation in the city that grades nothing. The
  payoff is paper: the sheet pinned above the old desk, the carbon copy handed up the
  stairs. *"Everybody brings one piece — that's how it works here"* is the promise the
  barrio now owes, one business at a time, and her must-have is the first piece.
- **La ventana del norte** (2026-09-02). The office got the one view in Meridian that
  looks at something that hasn't happened yet. Three panes in the north wall over the old
  lead's desk: the back lot, an old road leaving the barrio, two warehouse roofs, a power
  pole — and on the horizon the survey stakes and graded dirt where the line is being
  laid. Not Barrio Norte. The WAY to it. The room the barrio is furnishing for you looks
  at the thing the whole city is getting ready for, and the sheet you filled out is pinned
  to the frame in front of it. **The city's two progress bars now face opposite
  directions and you sit between them:** the mural on the avenue is what the street sees
  of what you already did; the window upstairs is what you see of what's coming. The
  season may repaint the sky at the glass; it may never change what is out there.

- **Las cuatro puertas** (2026-09-02, written and wired, `docs/story/las-cuatro-puertas.md`).
  The rest of the city has a story, and the game carries it: Taller Herrera (quests 24-31,
  the paper around the mechanic — *repair order, book time, core charge, write-up,
  comeback*), Panadería La Espiga (32-39, the number born at 4am — *sold-out time, par,
  bake sheet, merma, day-old*), Limpieza Velázquez (40-47, a tool that counts work and
  never watches people — *walkthrough, punch list, route sheet, re-clean, scope*), Nolasco
  Tax & Notario (48-55, what a machine must refuse, and the man who reads your file —
  *acknowledgment, intake, engagement letter, ITIN, extension*). Each district opens by
  the previous owner's word, said inside that owner's ending because the engine cannot
  grade a toast: Chelo phones Tacho (three sentences appended to `mepi1/2/3`), Tacho
  phones Licha, Licha says it to Vero across her counter, Vero sends you to Nolasco with
  an envelope. Nolasco's door opens nothing — la inauguración is a later sitting. Four
  cats now: Tuerca (she), Bolillo (he, the flour bin), Pelusa (the van), Timbre (the
  doorbell). The old lead's four pages are placed; the reveal is Nolasco's. The
  franchise is never named — "the place with the drive-through" — and lands as drift, a
  bid request and strangers at intake before it ever makes an offer. Every district ends
  the way the mercado did: somebody says what they think of you, phones the next
  neighbour, and a cat moves in.

**La silla (2026-09-07).** Xochi's line grew a second hand. Naye Robles cuts hair between her
tía's crates on Calle Dos — the head for every outfit Xochi ever made — and the barrio's most
irreversible tool is a pair of scissors. Her shop is a service until ❗El espejo (CITY.md) says
otherwise. The same day the casa's neighbour got her own name back: Doña Tencha, not a second Chelo.

## Open threads (promises already on the wall)

- **La ventanilla** — the city's own record, kept by a government NPC, separate from the
  player's office. *(Owner steer 2026-09-02.)* Two documents that do not quite agree is
  the truest thing you can say about a barrio: your office holds what the neighbours said
  about you; the window holds what the city has on paper. Three laws, all load-bearing:
  she is **not a villain and not an obstacle** (a *ventanilla* clerk on the barrio's side
  and bound by paperwork — the comedy is she needs the form, the warmth is she wants you
  to pass); she **speaks only about what is filed, never about what is missing**, past
  tense only, or she becomes a quest log with a face; and she is **droppable like the
  franchise**. She is also the natural voice for Barrio Norte, which is a public works
  project — the promise keeps a face without becoming a place.
  **SIGNED 2026-09-02, and it relaxes Nacho's second law:** she MAY speak about what is
  missing — but only when the player walks to her window and asks. Nothing ever pushes a
  list at you; you went looking for it, so it is help and not homework. Owner's words:
  *"quest log with a face could be good, she could develop some ai stuff, but we mostly
  avoid it."* So **government is not a trade the city
  trains**: she stays small, is not a district, and trains no role. Her ask-only
  behaviour is **content-declared and customisable** — the owner wants it swappable for
  [partner]'s game and for fun quests. Against `docs/OWNER.md`'s "never build a quest log", she
  is the named exception, and the distinction is the whole reason it holds: the rule bans
  a list that FINDS you, not a clerk you CHOOSE to visit.
  **Deferral dated 2026-09-03 (la junta):** SIGNED means the design is agreed, not that
  she exists. She is in no file — no name, no look, no world, no glyph — and stays
  deferred until a sitting is priced for her. Do not read SIGNED as shipped.
  **Planned 2026-09-05:** `docs/story/la-ventanilla.md` — what she reads, where she could
  stand, every seam she touches with its tag, and the personal build (❗La puerta trasera).
- **The names inside quests are people who can walk on** (2026-09-13). Rigo is the first off-screen
  name in this city to take a tile. The rule it establishes is general and belongs to any pack: a
  character mentioned inside a quest may appear ambiently anywhere — but **an ambient line may never
  reveal which way that quest was answered**, because chat has no state and every quest has three or
  four endings. Still waiting on the wall: the lady with the sister who checked her paperwork, the
  kid from the tire place, Yesenia's nephew reading job postings.
- **Barrio Norte** — PROMOTED to the city's through-line. The northbound track
  advances a visible segment per finished business and the sound gets closer.
  Never a place you visit — it stays a promise (kept free for multiplayer/[partner]).
  Nacho's defence: the moment you can ride north, Meridian stops being one street
  where you know everybody, which is the whole reason it is comfortable. If the
  owner ever wants a fifth-and-beyond expansion, this is the sanctioned place —
  after the second lap, not instead of it.
  **And the line has no face** (2026-09-13, ❗El chofer). The tram's driver is
  deliberately nobody, so that nobody in Meridian can be asked what is at the other
  end. **He is the only person in this city who would have had to have been there.**
  Give him a name and a mouth and the first question every player asks him is *what is
  up north* — and he either answers, and the promise is spent by a man instead of a
  skyline, or he refuses, which is a character built to dodge. If the MQT ever needs a
  human voice it is la ventanilla's, at a window the player can walk to — public works,
  asked-only, already signed — never the driver's, behind glass where nothing can be
  asked at all.
  **The window is now its only surface** (2026-09-02). The promise is visible from `f2`
  and nowhere else, which is what keeps it a promise: you can watch it, you cannot walk
  there. Two laws follow. The view may advance a stage as businesses finish (stakes →
  graded roadbed → rail) — the second progress bar. And the view may NEVER show Barrio
  Norte itself: no buildings on that horizon, ever, in any season. The moment the
  skyline arrives, the promise is spent.
- **The mural is the record's room** — one panel per finished business on Calle
  Principal, the decision report on the wall underneath. Unfinished business is
  left in charcoal outline, unjudged and paintable forever. This is OWNER.md's
  "the record is a room, not a menu," rendered as a wall.
- **The old AI lead** — four pages of his folder, one hidden in each business
  (a sheet in Tacho's parts binder, a laminated card at the panadería, a checklist
  in Vero's van, one filed at Nolasco's). Read together they are a decision report
  exactly like the player's — except every entry is the *impressive* answer. He
  fine-tuned something he shouldn't have because he was building the biggest thing
  on the list, and that is what had always got him praised. He never appears on
  screen. His name is on Chelo's wall by the register, in older handwriting — now
  planted in quest 23's honest-review beat as well as in `mepi2`, so every player who
  tells her the truth sees it, not only the grade-2 ones.
  **All four pages placed (2026-09-02):** the parts binder (q26), the laminated card by
  the oven, the checklist in the glovebox (his rollout), the fifth page in Nolasco's
  folder. Nolasco is the one who reads them together.
- **Frederick's fame** — the barrio's media department; his DMs fill with
  questions meant for the businesses (the wrong-channel gag, with a real lesson
  under it). He hosts the inauguración. The star dog is the intern (his name is the player's, #264). **Four wrong-channel beats
  planted (2026-09-02)**, one per pack; Nolasco's grade-3 ending names him host.
- **The four cats** — the street cat has no business. She picks the taller and
  Don Tacho does not object. Her name is Tuerca. Every new business gets a cat, and
  now every business has one (2026-09-02): Bolillo in La Espiga's flour bin (a he),
  Pelusa in Vero's van, Timbre where Nolasco's doorbell would be. Each sits in the
  endings and nowhere in the rules.
- **Xochi's line** — she outfits the city one business at a time: shop shirts,
  aprons, crew uniforms, one good jacket. Proof this is a barrio, not four shops.
  **Paid across four packs (2026-09-02):** shop shirts with Tuerca on the pocket (q31),
  aprons with a pocket for Sol's strip, crew shirts nine of nine, and \"Do you own a
  jacket?\" — the jacket is for la inauguración. **And one apprentice (2026-09-07):** Naye,
  El Espejo — the fifth thing she outfitted was a person.
- ~~**The reserved lot**~~ — Taller Herrera, Phase 2.
- ~~**Week Two, chapter two+**~~ — retired with weeks.

## Phase 2 — Taller Herrera (planned 2026-09-01 · **written 2026-09-02** — the finished plan for all four districts is `docs/story/las-cuatro-puertas.md`; this section is the earlier draft, kept)

Automation / solutions consultant. Cast: **Don Tacho** (master mechanic, refuses
the tablet), **Yesenia** (service writer, runs a paper book), **Moy** (apprentice,
already using AI on his phone and already burned by it). Cat: **Tuerca**.

**The door — the referral beat.** Cold open at the mercado, not the taller. Chelo
is on the landline — *the same phone from quest 16* — says the sentence your grade
earned, hangs up: *"He's coming over. Be nice."* Tacho at the gate: *"I don't need
a computer guy."* Chelo, still on the line: *"I didn't say he was for you.
Yesenia's book is full."* The premise in one exchange: **the shop's bottleneck is
not the mechanic, it's the paperwork around him.**

**The wants.** Tacho wants his hands to stay the last word — not anti-technology,
anti-being-replaced-by-a-guess; his real fear, revealed late and quietly, is not
that the machine will be wrong but that it will be right often enough that Moy
stops learning to listen to an engine. Yesenia wants to stop being a bottleneck
she never asked to be — her book is the only place the schedule exists and nobody
has ever asked her what she needs (**deliberate rhyme with Nando's spreadsheet,
flipped**: his workaround was the requirements document, hers is a single point of
failure with a person's name on it — same shape, opposite lesson). Moy wants to be
trusted; he is why the shop cannot simply ban the tools, because they are already
inside the building.

**The escalation** (8 quests, `need: 5`, matching the mercado template):

1. **The door** — you're pointed at Tacho; the move is to go look at Yesenia's
   book. *Find the constraint; the loudest objection is not the bottleneck.*
2. **The photo estimate** — a customer sends a picture of a bumper and wants a
   number; Moy already ran it through his phone: $1,200. *An estimate is not a
   prediction, it's a promise with a price on it. Automate the draft, never the
   commitment.*
3. **The parts order** — reorder points, the supplier who ships the wrong
   alternator, the automation that quietly orders three. *Automate the boring step
   all the way; keep a human on the irreversible one. Money leaving is
   irreversible; typing is not.*
4. **The tablet, again** — the centrepiece. A lesser story makes Tacho come around.
   He doesn't. The right answer changes the workflow so **he never has to touch it
   and the data still gets captured**: Moy narrates, Yesenia confirms, Tacho signs
   a paper he was already signing. *The lever is the workflow, not the person.*
5. **The sound** — Moy diagnoses with the phone and is confidently wrong; Tacho
   hears the actual problem in four seconds. Nobody raises their voice. *What stays
   human — the honest version, not the flattering one: not "AI can't," but "here
   the cost of being wrong is a car on a freeway, so the confidence bar is a
   different bar."*
6. **The one it shouldn't have answered** — a customer asks the new intake
   assistant about a warranty and it answers. *Scope and refusal — Nolasco, planted
   three phases early.*
7. **The cousin's platform** — Tacho's cousin sells shop-management software that
   does everything and costs more than it saves. *Build vs buy vs don't.* The
   counterweight to the mercado's "build the small thing," rhyming with "The Monday
   number."
8. **The last visit** — Yesenia closes the book. Not throws it away: **closes it, and
   shelves it next to Tacho's old manuals**, the highest honour available in that
   building.

**The three endings, keyed off the grade.**
- **Grade 3.** The book is on the shelf. Yesenia leaves at six for the first time in
  four years and Tacho *notices out loud*, which from him is a parade. Moy is
  teaching the intake flow to the kid from the tire place. Tacho hands you a key to
  the side door — *"for when the trolley opens and you need somewhere to sit."*
  Tuerca is asleep on the hood of the Caprice: *"That's Tuerca. She lives here now.
  I didn't decide it."*
- **Grade 2.** Half of it stuck. Yesenia still keeps the book — but only for the
  jobs she doesn't trust yet, and the pile is thinner every week. Tacho's verdict,
  the truest line in the chapter: **"You didn't sell me anything. That's why I let
  you stay."** The taller's mural panel gets painted with one corner in charcoal.
- **Grade 1.** The intake assistant is switched off. The book is exactly as thick as
  it was. Nothing broke, nothing burned, and Tacho is *kind*, which is worse and
  better than angry: *"You came, you looked, and you were honest about what you
  didn't know. Most of them lie in the first ten minutes."* Moy walks you to the
  gate and asks, quietly, if he should stop using the phone thing. You tell him no —
  you teach him what to check. **The run's failure becomes the one lesson the player
  did transmit, to the person who needed it most.** Nothing closes. Tuerca moves in
  anyway.

**All three variants end with a referral going out.** Grade 3, Tacho phones Doña
Licha before you're off the lot. Grade 1, he phones her a week later and says less.
Either way, Phase 3's door opens.

**Quest voice (for whoever writes EN+ES).** **Tacho** speaks in short declaratives
and car facts; he never explains an objection, he states a consequence — *"That
number goes on a paper. The paper goes to a man with a wife and a payment. You want
a phone to write it?"* He calls the player **joven** — never *mijo*, that's Chelo's
and it stays hers. **Yesenia** is the fastest talker in the city and the most
organised, narrating in the order things happen; her book is not disorganised, it is
*encrypted*. Give her exactly one moment where she's tired. She says **compa**.
**Moy** is eager and slightly ashamed — the only one in the barrio who already has
the vocabulary, he uses it a little wrong, and nobody corrects him unkindly; his arc
runs from hiding the phone to writing the shop's one rule about it. He calls you
**profe**, half-joking, and by the last quest not joking. **Spanish is shop Spanish**,
not office Spanish: *mande, ándale, la mera verdad, el chiste es que, ¿cómo la ves?*
The ES pass is not a translation — Tacho in particular should be blunter and funnier
in Spanish, because that is how that man actually talks. **Codex entries** keep the
mercado's register: one paragraph, a rule, and why the rule exists — never a bulleted
list. **Wrong-answer beats** keep the mercado's comedy discipline: the joke is on the
situation, never on the player and never on a neighbour. The standard to hit is *"The
system confidently receives 400 kilos of PESCADO. It was 40."*

## Naming the role — the career layer, inside the fiction

Nacho's finding (2026-09-01): the quests train the roles; the arc did not. The role
was a label in `config.js` that nobody in Meridian ever said, needed, doubted, or
hired you for. Three fixes, now canon:

1. **Referrals.** The grade stops being a screen and becomes a thing a person says
   about you. Every business is a job interview: you walk into a room where somebody
   already has an opinion of you and earn the rest.
2. **Name the role once per business, out of a character's mouth, by someone who
   wants something.** Never narration. Tacho: *"So what are you, exactly? A computer
   guy?"* Yesenia, who has been reading job postings for her nephew: *"He's the one
   who figures out what the machine should do and what it shouldn't."*
3. **Give the report a reader in the world.** Lic. Nolasco, Phase 5 — a notario
   whose entire profession is paperwork that has to be true.

## Decision log

- 2026-09-03 · ❗Un solo Don Güero · **he stands upstairs only; Lupe carries quests 12 and 13
  and introduces him in her first line** · owner: "ok give it to lupe and just let her
  introduce/talk about him right away" · the estimate was always the estimator's paper, and
  deleting the quest instead of moving it would have broken "nothing is ever taken away".
  A character can leave a tile without leaving the story.
- 2026-09-03 · ❗A la orden · **REVERSED THE SAME DAY, and the session's note corrected.**
  The office was put on the Trolley Pass list so the pair were a couple of taps away. The owner
  killed it in one line: *"i dont like that i go from a train to a floor. dont do that. i asked
  to make the world realistic."* A trolley stops where there are rails; you reach an office
  through its front door and up its stairs. Removed, with a test that every trolley destination
  is a world that actually holds a trolley stop.
- 2026-09-03 · ❗El maestro constructor · **what "game building assistants" actually means, in
  the owner's own correction.** The session had recorded the no-API decision as "it is only [partner]".
  Wrong: *"well its not that its just [partner], its just us building but one day we want to assign him
  a house template that he can build and just add some random customizations."* So the ambition
  is **not** a chatbot in the game. It is **Don Güero given a house template he can build from,
  varying it each time** — procedural building from a declared template, which needs no network
  at all and is exactly the kind of thing this engine's content seams are for. A pack would
  declare a template (footprint, door, windows, roof, the pieces that may vary and their range)
  and Don Güero would instantiate it on a lot. **Buildable offline. Not yet designed.**

*(date · decision · one-line why — append only; /nacho fills it)*

- 2026-09-01 · ❗La vía · **good news with a shadow** — the trolley brings customers
  AND a franchise scouting the north end · everyone gets a reason to hurry; nobody
  closes, nobody is harmed.
- 2026-09-01 · ❗La carta · **yes, and she says so out loud** — Chelo phones ahead and
  the grade is what she says · the barrio is the player's reference letter, so the
  career layer lives inside the fiction instead of beside it.
- 2026-09-01 · ❗Tacho · **never comes around, and that's the win** · the workflow
  moves around him and he signs the paper he always signed. No bow — the lesson is
  that you changed the process, not the man.
- 2026-09-01 · ❗El listón · **la inauguración plays in the world, not in a curtain**
  — five diegetic seconds, speeches become walk-up dialogue, the grade is carried by
  the mural alone, the file hangs on the wall forever · owner: "we make the player
  notice for 5 seconds then the game goes back to normal."
- 2026-09-01 · ❗El día · **the morning after** — you play as long as you like and the
  day ends while you are away; next launch the street remembers (chairs stacked,
  papel picado torn, a neighbour mentions yesterday, a new sign on a lot) · the north
  star said out loud, and reusable for every business's last visit.
- 2026-09-01 · The second lap · after the trolley opens, the four businesses call you
  BACK with second-order problems (drift, scale, distribution shift, adoption at
  scale, refusal under new pressure) · "continue with more training" costs no new
  parcels, no new cast, and deepens relationships instead of adding strangers.
  Barrio Norte stays a promise.

- 2026-09-01 · ❗La carpeta · **no practice is ever missed; old quests get a reframe
  line, changed worlds get new quests** · owner order, not a survey — the city stops
  doing to the player what Taller Herrera is about to teach him to stop doing to
  customers: never automate the irreversible step.

- 2026-09-01 · ❗La carpeta · **one reframe line, from the neighbor, in their voice**
  — signed with a condition: *"make sure all the story lines essentially make sense —
  you can explain any erroneous or conflicting info in text and make a note."* 24 lines
  EN+ES shipped; nine continuity breaks fixed in the text; four unresolved items
  written to the OPEN list below.

- 2026-09-01 · ❗La puerta · **Week One's bar drops 16 → 12** · the office was the one
  room in Meridian that closed behind you; twelve opens the street with four quests
  still answerable and puts every reframe line into default play. Owner: *"drop it to
  12 but doesnt have to happen in the office"* — which is what `need` already meant.

- 2026-09-02 · ❗La oficina · **the office opens bare and the barrio furnishes it** —
  the old lead's empty desk and a north window, then one piece per business · the mystery
  pays off in furniture instead of a cutscene, and the room visibly fills.
  *Amended 2026-09-02 by the owner: the office opens MID-MOVE — taped boxes, a cone, a
  plant in its pot; the furnishing rule is unchanged ("for the move it should be mid").*
- 2026-09-02 · ❗La palabra · **the word is the reward** — a term enters through whoever
  NEEDS it, in the beat after a right answer; wrong answers stay funny and earn nothing ·
  vocabulary is given, never tested. Under ❗El giro the five terms are the TRADE's
  vocabulary, not the role's.
- 2026-09-02 · ❗El papel · **template 06 Process & Exception Map gets written** · a real
  artifact consultants hand over, so it earns a place in a work folder.
- 2026-09-02 · ❗La despedida · **the goodbye at the door**, declared per district
  (`doorstep`/`panel`/`quiet`) · the inauguración's grammar on a smaller instrument, so
  the finale keeps its size. `panel` is KEPT, not deleted — nothing regresses, and [partner] can
  pick another shape.
- 2026-09-02 · ❗El giro · **industry leads, role follows** · `industry:` is ADDED beside
  `role:`, never in place of it — the signed role summary in the report stays, and the
  `principal`/Limpieza "implementation lead" collision stops being a bug the moment
  districts are told apart by the business rather than the job title.
- 2026-09-02 · ❗El cuarto de arriba · **the office opens bare and two neighbours ask what
  it should be** — Nacho (feel) and Don Güero (build), ten questions, no wrong answers,
  no XP, nothing in the report; the answers become a sheet the player copies · the owner
  wanted [partner] to design the office through the characters with no API, and a sheet she can
  hand over IS the back-and-forth. Nacho leaves the street to stand upstairs. The window is
  promised, not built — no window tile exists, and the trolley runs south of HQ, so "onto
  the trolley line" was the wrong wall (Don Güero). Four owner calls in
  `docs/rooms/partner-office.md` §8.
- 2026-09-02 · ❗La ventana · **north wall, three panes, the way to Barrio Norte** —
  the owner deferred the call to /nacho and /don-guero together ("i dont care that much
  about the window but maybe /nacho and /don-guero can work something cool out") · the
  window is cut, so Güero's line goes from promise to fact and the three answers are all
  north-true; the season repaints the sky, never the view. Nacho's closing line pins the
  sheet to the window frame: mural south = what you did, window north = what's coming.
- 2026-09-02 · ❗Para quién · **Don Güero asks it, first line of his work order** —
  owner: "i guess that should be a question in the creation - who is the room for" · it is
  a count, not a feeling, and it changes the meaning of every other line on his form. His
  closing question is sharpened to seating so the two bookend instead of repeating. Nine
  questions become ten; an existing player gets the ❗ back over Güero, which is the badge
  meaning what it always means.
- 2026-09-02 · ❗La mudanza · **the office opens mid-move** (owner: "for the move it should
  be mid") · your own boxes at your feet and the old lead's desk untouched is a better
  first line than an empty floor: "Look at it before it's yours" now has something to look
  at. Nacho's talk retitled *Before you unpack* (Don Güero's words; Nacho may rename).
- 2026-09-02 · Corrections carried, not absorbed · the mural deco sits at st(20,0), on the
  south-facing avenue wall EAST of HQ's entrance, not on HQ's own face (Nacho); the ledger's
  "a north window onto the trolley line" was the wrong wall and is amended in place with
  a dated note (Don Güero); the smoke test was written one commit ahead of the pack it
  tests, on purpose — red first.
- 2026-09-02 · Scope correction, recorded not silently fixed · ❗El listón was signed
  about the CITY's finale; the session generalised it to every ending in the owner's name
  and cited it against `finish()`. Corrected in OWNER.md and here — including the
  Principles bullet, which the first correction pass MISSED and which is the one a
  planner reads and stops at.

- 2026-09-02 · ❗Las cuatro puertas · **the rest of the story written and wired the same
  day** — owner: "i want the rest of the story... now please if
  possible" · Nacho planned all four districts at the auto shop's depth; four writers
  drafted 32 quests EN+ES in the mercado's exact shape against a validator; the four open
  calls were answered with Nacho's picks (Tuerca is a she; the franchise is "the place
  with the drive-through"; paper 06/01/04 and a new 07; Calle Dos one door at a time) and
  are one line each to flip. Nacho's Bolillo is a he — the "every cat is she" rule was the
  session's over-reach, not Nacho's, and was corrected before the espiga was written.
- 2026-09-02 · ❗La carta · **the referral lives inside the previous owner's ending** ·
  the engine cannot grade a toast, so the grade-keyed sentence is the ending's last line;
  three sentences appended to `mepi1/2/3` so Chelo phones Tacho. The "next lot opens"
  toast stays grade-blind, as it must.
- 2026-09-02 · ❗El giro · **built** — `industry:` beside `role:` in every chapter; the
  report prints *industry · role* ("Auto repair · AI Solutions Architect"), so five
  engagements read as five trades. Week One stays one industry (Enterprise IT) until the
  Week One split is decided — open item 1 stands.
- 2026-09-02 · The cats' names · **Nacho's over Don Güero's placeholders** (Bolillo,
  Pelusa, Timbre for Concha, Cloro, Expediente) · the names carry story; the maps were laid
  the same morning and nobody had met the cats yet.

## Bible vs. game text — RESOLVED 2026-09-01 (the open-city items only)

The items logged on 2026-09-01 **as of that morning** are shipped (sw `mq-v38`, smoke
green). Kept as a record of what was wrong and what replaced it.

**⚠️ Corrected the same day — this header used to say "everything ... is now shipped",
which was over-broad.** Two rules signed LATER on 2026-09-01 are NOT built, and one of
them the engine currently contradicts:

- **❗El listón — the INAUGURACIÓN is signed and not built.** The five-second diegetic
  ceremony, the walk-up speeches and the mural carrying the grade are still promises.
  **Correction 2026-09-02:** an earlier version of this entry called `finish()`'s end
  panel a *contradiction* of a Settled rule. It is not. The owner scoped their answer to
  the city's finale; the session generalised it to every district ending. `finish()` is
  **unchanged, unjudged, and awaiting a /nacho call** on how a district's last visit should
  present itself — which then ships as content-declared, per district, never hardcoded.
- **❗El día — "the morning after" is NOT built.** Nothing tracks last-played; there is
  no day-turnover state anywhere in the engine.

Both are real work, not wording. They belong with the 3D/world sitting or after it.

**Built — the open city.** `qOpen` in `engine/engine.js` had `c>=chSeen`, which closed
every district behind the player and (latently) left unopened districts nominally
answerable. Now `c<=chSeen`: a district's quests open when it opens and stay open
forever. Reaching a district's `need` plays its ending beat and breaks ground on the
next lot; it closes nothing. The smoke suite's two assertions that encoded the old law
are inverted, and a new one checks the other half — an unopened district is not
answerable. Stale comments corrected in `engine/engine.js`, `content/meridian/maps.js`
and `content/meridian/config.js`.

**Built — nine strings that contradicted signed canon**, EN+ES, all in
`content/meridian/strings.js`:

- `mepi1` → "Outside, somebody is laying track." · `mepi2` → "…next to the permit —
  and under a name in older handwriting you don't recognize yet." · `mepi3` → "The
  door does not lock behind you." *(the three "Roll credits" against Settled "the
  city has no credits"; now the hook into the open city, Barrio Norte and the old
  AI lead.)*
- `in3` — the intro card no longer threatens "the week resets" while stakes ship as
  `none`. It describes the grade, which is always on, and promises the report. True
  at `none`, still true if admin flips `hearts`.
- `weekTwoToast` → the gate is unlocked "and left open. Nothing behind you closes
  either." · `endGo` → "▶ Out to the street" *(weeks retired)*.
- `mgoEpi` — Chelo no longer takes the keys back and the mercado no longer "forgets
  the rest": the unfinished work is a folder on the counter with your handwriting on
  it, and the gate opens at seven.
- `goEpi` — Priya said the new law's exact negation out loud ("whatever you left
  unanswered stays unanswered"). Now: "Nothing in here got closed."
- `epi3` — no longer tells a struggling player to run the week again; everything they
  didn't answer is still sitting there. `endStayToast` — "Whatever's still open stays
  open." `goTitle` — "The floor stopped trusting you" *(no calendar, no funeral)*.
- `epi1` — the credits tail becomes the mural's first appearance: Nacho chalking the
  outline of a block that isn't built yet, at the end of Week One. The earliest
  possible plant for the record's room.

Deliberately untouched: `epi2` (names a week, which is canon, and rolls no credits);
`mepi3`'s "a folder nobody opens" (a deliverable, not lost practice); Perla's
wrong-answer beat in `quests.en.js` (consequence, not closure — and one of the best
lines in the pack).

**Flagged to Don Güero's lane:** `docs/CITY.md` still describes districts as things
that "close". His file, his call — but the word is now load-bearing and wrong.

## Bible vs. game text — OPEN (for the customization pass)

Contradictions found 2026-09-01 that cannot be settled by rewriting a line. Each names
what conflicts, why it is not Nacho's to decide, and the options. Owner's instruction:
*"make a note so that during customization we clear the goals and this topic."*

1. ~~**Where Week One's last visit belongs.**~~ **SETTLED 2026-09-01 (❗La puerta):
   `need` dropped 16 → 12.** Week One's last visit now plays with four quests still on
   the board, they stay answerable forever, and all 24 reframe lines are live in
   default play. Owner's clarification, which was already true of the data: *"doesnt
   have to happen in the office"* — `need` is a count over the whole district, and
   the district (id `principal` since 2026-09-01, formerly `week1`) spans HQ (0-9, 14),
   La Cocina (10, 11), La Obra (12, 13) and the Studio (15).
   Any twelve, from anywhere, in any order.
   **What is still open, and it is smaller:** eleven of the sixteen are HQ quests, so a
   player who works the office hard can reach twelve having answered just one barrio
   quest, and open El Mercado barely knowing the neighborhood. Referrals (❗La carta)
   assume the barrio can vouch for you. A per-district floor does not exist in the
   engine and would be a build. Nacho's preferred fix is the one he already named:
   **split Week One into the office (0-9) and the barrio (10-15) as two districts with
   two last visits and two mural panels** — which makes the floor structural instead of
   arithmetic. Queued for the session that builds Taller Herrera, when districts are
   already on the workbench.

2. **The burnout epilogues belong to a mode that ships off.** `goTitle`, `goEpi` and
   `mgoEpi` only play when stakes are `hearts`, which is admin-only; `goEpi` still
   frames the loss as "the week," which is retired. Three good strings currently
   unreachable in normal play. Options: keep them as hearts-only flavour; rewrite them
   as a "rough patch" beat any mode can reach; or retire them with the calendar.
   Blocked on whether hearts returns as a real mini-game.

3. **Which calendar survives into the reusable template.** *(Half resolved
   2026-09-01: the district id was renamed `week1` → `principal`, so a planner reading
   the pack no longer inherits a calendar from the structure.)* Still open: Weeks One
   and Two remain canon in Meridian's **fiction** and appear in `epi2` and both
   quest-file headers. Options for the words: keep them as Meridian-only flavour that
   [partner]'s pack simply does not copy; retire them from the text too; or keep them and
   document explicitly that the calendar is content, never structure. Lowest-stakes of
   the four — the structural half, which was the one that could mislead, is done.

4. **Ambient chat has no state.** Every `chat` and `chill` line renders forever
   regardless of what the player has done — which is why Beto and Chava needed
   rewriting rather than conditioning. Options: make "write chat that cannot go stale"
   the standing rule for every future pack (free, and it is the rule as of today); or
   give chat a `when` predicate like `TOWNLBL` already has (a build, Don Güero prices
   it). Until decided, Phase 2's crew lines get written under the free rule.

5. **Terminology and teaching are under-served against the owner's stated need.**
   *(The owner asked for the trade’s terminology to be taught.)* The
   codex teaches judgment beautifully and mostly avoids naming things — which was a
   deliberate anti-homework choice and is now in tension with a stated goal. A player
   finishes El Mercado having practised scoping, prioritisation and honest review
   without ever meeting the words *acceptance criteria*, *drift*, *human-in-the-loop*
   or *success metric*. Options: leave the codex as-is and put terminology in the
   exported report only (safest for comfort, weakest for teaching); let characters use
   the real term once, in plain speech, the way Yesenia is already written to define
   the consultant's role for her nephew (recommended shape — it is a scene, not a
   glossary); or add a glossary surface in the world (the mural wall, a codex index)
   that fills as terms are met. Nacho's call on the writing, Don Güero's on any new
   surface, the owner's on how far to push it.

- 2026-09-13 · ❗El chofer · **the tram's driver is nobody, on purpose — he is a uniform,
  not a neighbour.** Nacho, asked by the owner by name. Three rules make the call and
  **none of them is taste**: the car is reborn off the edge of the map, so a PERSON would
  owe the world an account of where he went and a LIVERY does not (Rigo, *"Two cabs, no
  turn"*); a named man behind glass on a ride with no verbs is *"scenery pretending to be
  a place"* pointed at a human being, and this city already carries 25 neighbours with no
  chat lines; and he is the only person in Meridian who would have been to Barrio Norte,
  which the window is signed as the only surface for. **He gets no name, no `NPCLOOK`
  entry, no line in either language and no ❗.** He gets the MQT cap brim, a gold band
  that matches the car's own trim, and **one gesture — the hand comes off the power when
  something alive is on the rails**, which is Rigo's own rule made watchable instead of
  written down. A player on their fifth ride notices the hand move before they notice
  why. **Revisit trigger, and only this one: the day a second HUMAN passenger rides**
  (`ARCH-LOG` A13¾'s pivot — the dog does not count, because a dog does not make the car
  a room with people in it). Then he is named out of la ventanilla's world — a city
  employee, never a Robles.
  **Refused in advance, both expected within the month:** *a wise old motorman who says
  one thing about the journey* — there is no press, no ❗ and no trigger a line could hang
  off, so it would fire unprompted into a beat containing nothing else, which makes it
  not a line but the entire content of the ride, i.e. the cutscene A12 exists to prevent;
  and **"the driver is Rigo"** — Rigo is `changarrito` content, and putting a crew persona
  into the public game is a leak, not a cameo (`CLAUDE.md`; `docs/story/el-changarrito.md`
  §7½). His forty-one years belong on the wall that records how we work, not in a barrio
  he was never a neighbour of.

- 2026-09-13 · ❗El chofer, segunda parte · **the owner overruled the refusal above and asked for a
  cameo. He was right, and the refusal was narrower than it was written.** Verbatim: *"welll lets fix
  the leak... secondly, lets do a cameo to fix in game story."* Two corrections, both checked against
  the code first. **One: there was no leak** — the tranviario's name appears zero times in `engine/`
  and zero times in `content/meridian/`; the proposal was refused at plan time and never written to a
  file. **Two: the name was never the leak — a biography would be.** Meridian has had a Rigo since
  2026-09-02, **nine days older than the crew persona**: Don Tacho's cousin who sells shop software,
  named in quest 30 in both languages, offstage and never seen. Eight of nineteen crew personas
  already share a name with a shipped NPC, because they were named *after* the cast.
  **So the cameo is the cousin, and he was always ours.** He takes a tile at the Calle Dos trolley
  stop beside Doña Meche's cart — ambient, chat only, four lines EN+ES, no quest and no ❗: the man
  who sells dashboards, riding, because his own car is in his cousin's bay. He wears Don Tacho's
  exact skin value and the opposite clothes, so the family reads at ten tiles and the silhouette —
  the only tie on Calle Dos — carries the cold read alone.
  **What it refuses, and this is the load-bearing part: he never mentions the sale.** Ambient chat
  has no state and quest 30 has four endings, so a Rigo who mentions it becomes a permanent
  advertisement for a decision the player may have refused to his face. The player who bought the
  board and the player who said no meet the same man. He talks about the family, the ride and the
  bread.
  **The cab is unchanged.** The driver keeps no name, no line, no ❗ and no face, for the reason that
  was never about a name: he is the only person in this city who would have had to have been north.
  And the tranviario's forty-one years stay on the wall that records how we work.
  **A cameo that pays off a line already in the game costs Meridian nothing. One invented to nod at
  us would have cost it a person.**

**Dead text, flagged so it is not resurrected stale:** `vmTitle` / `vmHQ` / `vmSt` /
`vmLc` / `vmSite0` / `vmSite2` / `vmPlots` / `vmHere` in `content/meridian/strings.js`
are referenced nowhere in the engine — `TOWNLBL` in `maps.js` replaced them during the
Phase 1 seam extraction. Only `vmPlots` is factually wrong now ("Reserved lots — El
Mercado & more"). Deleting or reviving them is Don Güero's lane.

## An ending reports; it does not stage — 2026-09-17 (#208)

**What was reported**, by a narrative designer and not by a test: La Espiga tells you how its story
ended, and then Doña Licha is still standing there with a question about the same afternoon. The two
texts opened with **the same sentence**.

**Measured before writing a word, and it was never only La Espiga.** Twelve ending strings across six
districts shared a seven-word verbatim run with their own quests, in both languages. In four of them
the ending re-played the exact outcome beat the quest plays — so a player who DID the quest watched
it happen twice, and a player who skipped it (which `need` allows) was shown it happening and then
offered it as still to come.

**One bug with two faces, and both are fixed.**

1. **The writing rule, from now on: an ending may PAY OFF a scene; it may not STAGE one again.** The
   ending speaks from after the fact and reports the state the beat left behind. *The page is above
   the oven now* — not *Licha pins the page above the oven.* Fourteen strings rewritten.
2. **The mechanism: a district closes on its count AND on the visit that ends it.** `chClose` — the
   last quest a district lists, overridable with `close:`. You may still skip anything else; ❗La
   puerta holds and a full sweep is never required. This is what let the ending fire first.

**And the day stamp went with it.** Six of those endings opened *"Saturday, …"* — the owner had
already called the concept silly, and la junta found it was the same beat in all six. Removing the
staged tableau removed the stamp with it, which is the first of T4's repairs falling out of a
different fix.

**The guard** (`test/smoke.js`) fails an ending that repeats **seven** words of its own district's
quest text, and prints the longest run it found either way. Seven is not arbitrary: at six it flags
an ending for NAMING THE SAME OBJECT as its quest — *"on the wall by the register"* — which an ending
has to be allowed to do, and which Spanish reaches sooner than English because it takes more words to
say the same thing. Planted with the original `eepi1` restored: *"repeats 11 words of its own
district's quest text word for word".*

## No two places end the same way — 2026-09-17 (T4)

La junta measured what the owner had already felt: **every one of the six business districts ran the
same five beats in the same order** — a day stamp, the artifact named and located, the owner's
verdict in quotation marks, the handoff to the next name, a named animal — and the first of them was
literally the same words. **"Saturday." opened nine endings.** He had called the concept silly; what
he was looking at was a form with the nouns swapped, six times.

**The rules now, and they are guarded (`test/smoke.js`) so they cannot quietly come back:**

1. **No two districts open a tier the same way**, in either language.
2. **No district opens two of its own tiers the same way.**
3. **No district's ending opens on the same clause as the quest that closes it** — the #208 shape.
4. **A day of the week may open at most ONE ending in the game.** One is a place with a calendar;
   two is a format. Meridian spends its one on Meridian Labs, whose whole character is that it runs
   on the week.

**What an opener should be instead: the thing that is different now.** The book has moved to the
shelf. The page is above the oven. The word *kitchen* is on all twelve pages, in pen. The pot comes
off the flame at 9:25. Every one of those is the district's own object or its own hour, and no two
businesses share either.

**The burnout endings are held to the same rules**, because they are six more paragraphs in the same
slot — and five of the six named a different room to learn in while **two of them said "floor"**.
Tacho's is a shop.

**And one thing that is NOT a rule, because the audit got it wrong and the cross-examination caught
it:** the handoff to the next district is a fixed *slot*, and that is fine — the *medium* is already
five different things (a phone call, an envelope, a note, a name said over a counter, a week's
delay). A proposal to "stop using the phone" would have fixed something that was never broken.
