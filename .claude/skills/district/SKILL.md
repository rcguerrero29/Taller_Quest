---
name: district
description: The pre-flight for a DISTRICT — a business with quests, a chapter, an ending. Use when the user says /district, before adding or resizing any district, before choosing its quest count or its `need`, when a story beat is being costed, and whenever somebody says a district "needs a couple of quests". Carries the arithmetic that decides how many endings a district can actually show, the two ways a district's last visit goes wrong, and the guards that already exist so nobody writes them twice.
---

# District — how many endings can this thing actually show?

*Opened 2026-09-23 at the owner's question, which was the right one: after being told a district
signed at `need:2` could never show its middle ending, he asked* **"have we logged this lesson as a
skill for the fix and added tests?"** *The answer was no to both. The lesson had been written into
`docs/CITY.md` as a paragraph in 2026-09-16 and guarded nowhere for a week.* **A skill is listed to
every session; a ledger entry is read by whoever goes looking.**

## The one thing to know before you pick a number

**A district ends the instant `need` quests are answered, and its grade divides by how many were
ANSWERED — not by how many exist.** Both halves are in the engine:

```js
chClosed = c => c.quests.filter(i => done.has(i)).length >= c.need && (k === null || done.has(k));

function gradeOf(c){
  const ans = c.quests.filter(i => done.has(i));       // ANSWERED, not declared
  if(!ans.length) return 3;
  const clean = ans.filter(i => marks[i] === 1).length / ans.length;
  return clean >= 0.9 ? 3 : clean >= 0.6 ? 2 : 1;      // the two bands
}
```

So **at the moment the ending is chosen, the denominator IS `need`**. The only scores that can exist
are `0/need … need/need`, and each lands in a band. **The grade picks which of three endings the
player sees.** Work it out before you write them:

| `need` | possible scores | grades | verdict |
|---|---|---|---|
| **2** | 0, **0.50**, 1 | 1, **1**, 3 | ❌ **grade 2 impossible** — 0.50 misses the 0.60 band |
| **3** | 0, 0.33, **0.67**, 1 | 1, 1, **2**, 3 | ✅ all three |
| 5 | 0, .2, .4, **.6**, **.8**, 1 | 1,1,1,2,2,3 | ✅ all three |
| 12 | … | … | ✅ all three |

> **A district needs at least FOUR quests and a `need` of at least THREE, or one of its three endings
> is fiction.** Four, not three, because `test/smoke.js` separately forbids `need === quests.length`
> — a district that requires every quest can never have an optional last visit.

**Why nobody notices.** Nothing errors. No test fails. The third ending sits in the file forever and
simply never appears. Whoever wrote it would have written three endings and shipped two. The only
way to find it is this multiplication — which is why it is now a guard (below) and not a habit.

**The history, so the number is not re-argued:** El Espejo was signed at three quests / `need:2` on
2026-09-09 and Nacho found the fault on 2026-09-16 while *costing* it, before it was built. **No
ending has ever been lost in this game** — every shipped district reaches 1, 2 and 3. It was a near
miss, and near misses are the cheapest lessons there are.

## The guards that already exist — do not write them again

| It checks | Where |
|---|---|
| **every grade a district declares an ending for is reachable** | `test/smoke.js`, grep `can never happen` — planted 2026-09-23 by setting a real district to `need:2` |
| `need` is lower than the pack size | `test/smoke.js`, grep `need must be lower than its pack size` |
| the quest it closes on is one of its own | same block, grep `is not one of its own` |
| the count alone, without the closing visit, is not enough | same block |
| `gradeOf` itself returns 1, 2 and 3 | `test/smoke.js`, grep `all-first-try did not grade 3` — **this is the FUNCTION, not reachability.** It passed happily while the rule above was unguarded, which is the whole point: a unit test of a grader says nothing about whether a district can reach its grades |

## The other two ways a district's last visit goes wrong

**1 · The ending and the last quest describing the same afternoon, out of order.** A district closes
on a COUNT, so its last-visit quest is *optional* — the player may never see it, or may see it after
the ending. That is issue #208. `docs/STORY.md`'s rule: **no district's ending opens on the same
clause as the quest that closes it.**

**2 · Appending a quest moves the closing quest.** `chClose` returns the **last entry** of
`c.quests` unless `close:` says otherwise. So adding a quest to the end of an existing district
silently changes what closes it — and if the ending's prose was written to follow the old closer, it
is now describing something that has not happened. Set `close:` explicitly, or append deliberately.

## Before you add a district, answer these

1. **How many quests, and what is `need`?** Run the table above. Four and three is the floor.
2. **Which quest closes it**, and does the ending's prose avoid that quest's own last clause?
3. **What role does it practise?** Meridian's districts are practice — `docs/CITY.md` names the
   role per district. *(A room with a verb in it and no quests is a different thing and is allowed:
   **Meridian is not a place where every action is practice, it is a place where every QUEST is**
   — Don Güero, 2026-09-22, from the bridge's petal moment and the piñata that only sways.)*
4. **Does the cast collide?** A cast key declared twice fails the build — the Chelo/Tencha fix. Grep
   the key in `npcs.js` for BOTH games before you spend it.
5. **Does it move `MAXXP`, the grade denominator, or a chapter's order?** Say so in the commit.

## And the rule this skill is really about

**A lesson written in a ledger is not a guard.** This one sat in `docs/CITY.md` for a week, correct
and unenforced, while the test suite stayed green. If you find an arithmetic trap: write the guard in
the same sitting, plant it, and quote what it printed. Then write the skill, because the next person
will not read the ledger.
