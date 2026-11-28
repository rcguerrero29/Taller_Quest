---
name: check-speed
description: Make the checks faster without losing anything they catch, and report the result to a person in plain words. Use before changing how a check, a suite or the build check runs to save time, when the owner asks why the checks are slow or how long they take, when a pull request waits on its checks longer than the work took, and before telling anyone a check got faster. Carries the order to work in, the costs that recur here, the one rule that is never traded, and the shape of a report a person can read.
---

# Check speed — faster checks that still catch everything, said plainly

*Opened 2026-11-28, after the build check went from about 21 minutes to about 11 by running its parts side by side,
with the privacy scans first, and after the game's dice made a check's chance repeatable. Everything here was measured
on this repository's own runs. The owner's rule for it, confirmed the same day: the checks keep getting faster alongside
the work, never instead of it; nothing a check catches is given up for speed; every finding is written down; and any
change to how the checks run on GitHub comes to the owner before it merges.*

## The one rule that is never traded

**A check is faster only if it still catches everything it caught.** Nothing is skipped, loosened or turned off to save
time, and no wait is shortened until the thing it waits for is read instead. Prove it the way every guard here is
proved (the `guard` skill): the check's planted faults still go red after the change, and a check that now finds
nothing and passes is no speed-up at all, it is a hole. Count the rows a check asks before and after; a lower count is a
red, whatever the clock says.

## The order to work in

1. **Measure first, and alone.** Time each part of the suite on its own, then together. One run is a rumour: take at
   least three and use the middle one. Times on a shared machine are noisy; GitHub's are the ones a pull request waits
   for. Write down when and where each time was taken.
2. **Find what the clock actually waits for.** Parts that run side by side end when the slowest one ends, plus whatever
   runs before all of them and after all of them. That chain is the only thing worth shortening. Cutting a part that is
   not on it saves nothing a person can feel.
3. **Shorten the chain, one change at a time.** After each change, measure again. When several parts end at about the
   same time, splitting any one of them further buys little: say so and stop.
4. **Try it where it cannot hurt.** A change to how the build check runs goes on a branch and a draft pull request
   that is not merged, is run there at least three times, and goes to the owner with the times before it is marked
   ready.
5. **Write the finding down**, whatever it was, in the running findings document (see the end of this file).

## The costs that recur here

- **One long part holding up the rest.** The engine's check ran as one part of about 19 minutes; as three parts side by
  side the whole check took about 11. Splitting works when a check already has parts that need nothing from each other.
  A guard should know the parts exist, so a part added later is never left unrun.
- **Work before or after everything else.** A step every part waits for, or a step that waits for every part, adds its
  whole length to every run. The cheap gate that must come first (the privacy scans take seconds) belongs first; long
  text checks that need no browser could run beside the other parts instead of after them.
- **Fixed sleeps.** A wait of a set time both wastes time and guarantees nothing. Wait for the thing itself, with a
  limit well above the old sleep, and make the limit running out a red with a sentence.
- **Reds that are no fault in the game.** A check that goes red by chance or on a slow machine costs a whole rerun, the
  most expensive minutes of all. Give its chance a set starting number so a red can be played again, read the thing it
  waits for instead of a clock, and fix the cause; never retry until green.
- **Setting up the same thing in every part.** Installing a browser takes about a minute in each part that needs one.
  Keeping it between runs is faster, but what is kept between runs is something a later run trusts, so it is a
  security choice: it goes to the owner as one, with what it would save and what it would trust.
- **Running checks a change cannot touch.** The check picker chooses the checks a change can affect. Make sure it knows
  every new check and what each reads, so it neither runs too much nor misses one.

## Reporting it to a person

The owner reads the result, not the code. Every report says, in plain words and in this order:

1. **What got faster, in minutes:** a small table, each part before and after, and the whole, with how many runs each
   number is the middle of. A percentage alone hides the minutes.
2. **What changed**, one sentence each, with no file names, flags or tool names a person would have to look up.
3. **What it still catches:** that its planted faults are still red, and how many rows it asks, before and after.
4. **What could break**, and how it would show: a red, a wait, a skipped part.
5. **What was not tried, and why**, including anything that needs the owner's word (a security choice, a change to
   how the checks run on GitHub).
6. **What it needs from them:** a yes, a merge, nothing.

Say what a number is of, and when it was taken. Say "about" when a time is a middle of a few runs. Do not round a
slower run away.

## The findings document

Every finding goes into one running document, kept with the owner's other notes, newest first. Each entry says: the
date; the check or part; its measured time and how it was measured; what was found slow and why; what was tried; what
it saved, or that it saved nothing; and whether it is waiting on the owner. A finding that saved nothing stays in the
document: the next person would otherwise try it again.
