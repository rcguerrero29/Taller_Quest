---
name: guard
description: The pre-flight for writing or trusting a guard — a test, a check, a scan, a CI step. Use when the user says /guard, before writing any new test or assertion, at step 5 of /crew-fix, whenever a suite is green and somebody is surprised, and whenever a guard is about to be believed. Carries the four ways a guard fools the person who wrote it, each with the run that found it. Reading a guard is not checking it; planting is.
---

# Guard — the pre-flight, and the four ways a guard fools its author

*Opened 2026-09-15, after four guards written in one day each went green while wrong — and each was
caught by a plant or by looking, never by reading. This file exists because the lesson had already
been written down twice that week, in this project's regression register and in the guards' own
comments, and a
rule in a document has never stopped anything. Pili painted that on the wall the same afternoon:
**the lamp is the instrument; the sentence in the file is not.***

**Keep a register of guards that read a PROXY** — asked one thing and meant
another. That is the biggest family and it has twenty-five rows. This file is the other half: four
ways a guard is asking the right question and still cannot answer it.

---

## Before you write the assertion

**1 · Say out loud what a person would notice if this broke.** Write the failure message first, in
that sentence. If the message needs a variable name in it to make sense, the guard is reading the
code and not the thing.

**2 · Decide what you will plant.** A guard you cannot describe a plant for is a guard you cannot
check. Plant in a copy **outside the repository**, and prove the working tree is clean afterwards.

**3 · Then write it, and run the plant.** Green before the plant and red after, in the sentence from
step 1. Anything else and you have not finished.

---

## The four ways it fools you

### 1 · It supplies its own inputs

*The quest-marker guard baked the 3D sprite with a lift and a scale it had **typed out itself**.
`engine3d.js` passed its own literals. Changing the numbers the engine actually ships walked
straight past the check, silently — the guard was testing its own arithmetic.*

**Ask:** where did every input come from? If the guard names a constant the code also names
separately, there is no guard — there are two copies of a number. Move the value to **one** place the
code reads at runtime and have the guard read the same one. Best: give the call site a *name*
(`drawSayMark(g,x,y,"bake")`) so there are no numbers at the call site to drift.

### 2 · It has nothing to measure, and passes anyway

*The bearing guard reported `Infinity%` for three directions and said nothing at all about the
fourth. The viewport was `0×0` behind the character panel, `0/0` is `NaN`, and every comparison
against `NaN` is false. **The one direction that looked fine was the one dividing nothing by
nothing.***

**Ask:** what does this guard do when the thing it measures is absent, empty, hidden or zero-sized?
Assert the *preconditions* out loud and fail on them. Nothing to look at is **not** a pass — that is
the silent-zero failure, and it is the most common way a check evaporates.

### 3 · It reads the clock

*The marker guard went green, then red on the next run with "3 pixels". The marker rides a sine of
`Date.now()`. One sample tests one phase of an animation and calls it the drawing.*

**Ask:** is anything here a function of time, of `Math.random`, of a date, of the device, of the
order tests ran in? Stub it and sweep the whole range — eight phases of a full period, not one. A
guard that passes or fails by the clock is worth **less than no guard**, because it teaches people
to re-run it until it is green.

### 4 · It measures the surface it was given, not the one that ships

*The first clip test asked "does the mark touch row 0 of the sprite?" — but the top row is there to
be used, so it failed good art and would have passed a mark that wanted to paint five rows higher.
Drawing the same mark onto a surface with forty extra rows of sky and counting what lands above the
real top reads the actual noun: **what does the bake throw away.***

**Ask:** am I measuring the thing, or the edge of the container I happened to put it in? Where a
limit is the subject, give yourself room beyond the limit and measure what falls outside it.

---

## And one that is not about guards at all

**A background job that never returns never reports.** Two jobs in one day ran for five and nine
hours having finished their work in seconds: a multi-line command was flattened to one line, so a
heredoc never terminated and `python3` / `node -c` sat reading stdin forever. Both looked like work
in progress and were not.

**Write the script to a file, then run the file.** Never put a heredoc, or any command whose meaning
depends on its newlines, into a background shell. And when a background job has been running far
longer than its work could take, `ps -eo pid,etime,cmd` first — the answer is usually that it is
waiting for input nobody is going to give it.

---

## The one line under all of it

Reading a guard tells you what its author meant. Only a plant tells you what it does.
