---
name: shaping
description: Make a drawn, modelled or rendered thing read as a THING instead of a box — silhouette, light, variation, and the render-and-look discipline. Load before modelling an object out of primitives, before re-doing one that "still looks like a box" or "looks generated", before picking colours for anything that will be lit, and before briefing somebody else to do any of it. Portable craft: no engine, framework or repository assumed.
---

# Shaping — why a thing still looks like a box, and the ten minutes that fix it

*This is the portable half of a method that was learned the expensive way on a 2.5D game — five
sittings on a single flower, four attempts at one slice of food, and fourteen objects re-made in a
day. Everything here survived being true in more than one of them. Nothing here names a file, a
framework or an engine: where your project has a seam, you will know its name and this file will
not pretend to.*

---

## 0 · The question that comes before any of it

> **What is this thing made of, and in what order was it assembled?**

Not *what does it look like*. A thing drawn from its appearance is a guess about its surface; a thing
built the way it was built comes out right at the joints without anybody adjusting them. A fence is
posts set in the ground, rails nailed to the posts, pickets nailed to the rails — assemble in that
order and the joints are correct for free. Assemble in any other order and you will be nudging
coordinates for an hour.

**This has its own skill and it is worth loading:** `how-its-made`. Its one rule — *variation enters
at the step it actually entered, and nowhere earlier* — is the single most common reason art reads as
"generated" when every individual object is fine.

---

## 1 · Silhouette first, then value, then colour. In that order, every time.

Decide the size **and the view** the thing will actually be seen at, and be honest about both. Most
objects in most projects are looked at far smaller than they are authored, and from an angle nobody
chose.

**At small sizes the outline is the whole message.** A head with petals sticking out of it. A crate
whose contents mound *above* the rim. A vehicle with a pole over its roof. What does not survive is
detail inside the outline — texture, small facets, interior lines — and time spent there is spent on
something nobody will see.

> **If a thing "still looks like a box", its silhouette is still a box.** No colour, material or
> lighting change will fix that, and every hour spent on those is an hour spent not fixing it.

**The view is the other half, and it decides your evidence too.** A stacked thing — a burger, a
cake — wants a lower camera that shows its layers; a plated thing wants a higher one that shows the
plate. And a before-and-after is only evidence if the thing is IN the frame: on one project, three
rounds of renders showed a building cut off at the frame's edge, behind a passing vehicle, a tree
and a tutorial bubble, and the change could not have been seen in any of them. **Pick the frame
first** — where a person actually stands, at the angle the camera actually has, with nothing in
front — and take the before and the after from exactly that frame.

---

## 2 · When a thing is wrong three times, the number is not the fault

The most expensive lesson here, and it generalises past art.

A flower was drawn as six small balls. It read as dots. It was re-done as eight bigger balls — it read
as balls. Nine lobes — popcorn. **Three attempts, and all three changed a SIZE.** The fourth changed
the *construction*: the real flower is a stack of whorls, florets with their base on the receptacle
and their tips lifted row by row. It read correctly on the first try.

> **Three failed attempts that all adjusted the same parameter are a message about the parameter, not
> about its value.** Stop tuning. Ask what the thing actually IS and rebuild it from that.

The same pattern, in the same project, in a different costume: five separate fixes to how brightly a
small object read against its shelf, before anybody checked whether the thing behind it was being
drawn at all. It was not. **Presence before contrast — blank the one thing that draws it and diff the
frame — before you measure how well anything reads.**

---

## 3 · Know the light before you pick a single colour

Find out, in numbers, what your renderer will actually do to a flat-coloured face — how much ambient,
how much directional, and therefore what the lit range is from the brightest face to the darkest.
Then **paint the value differences into the parts themselves**, because the light will not give you
more separation than it has.

Two consequences that catch everybody:

- **Plan a bigger difference than you want.** If the pipeline tints, fades, or applies a day/night
  wash, a difference of 50 arrives as 40. Author the 50.
- **A lit model takes paler mid-tones than the flat drawing it replaces, and keeps its saturation.**
  Porting a sprite's colours straight onto a lit mesh comes out muddy every time.

And know your primitives' real resolution: a sphere at low segment counts reads as a hexagon below a
certain size. Below that size, do not spend a sphere.

---

## 4 · Procedural variation: make the seed move on both axes

If you vary instances by a hash of their position, **check the hash actually changes along both
axes.** A seed like `(x*7 + y*13) % 7` is constant along a whole row — every instance in that row is
the same instance, in every frame anyone will ever see. Use two coprime multipliers that move on
both (`(x*5 + y*3) % 7`).

**The test is not reading the arithmetic, it is cropping the render at 3× and looking**: if two
neighbours match pixel for pixel, the seed is not reading both axes. This was found by magnifying a
picture, not by anybody clever noticing the formula.

---

## 5 · Render it, at the real size, and LOOK — before you reason about it

The rule that has saved more time here than every other rule combined.

- **Look at the frame before you explain the frame.** A panel that was correct in the code was a
  bathtub wall in the picture.
- **Twice, a measurement said a thing was fixed and a person's eyes said it was not, and the eyes were
  right both times.** A number tells you something changed. It cannot tell you it now looks like a
  flower.
- **Take the picture on the second attempt, not the fifth.** Rendering the object at 8× before
  touching anything takes two minutes and has repeatedly shown that the thing being adjusted was not
  the thing that was wrong.

Keep the pictures. Before and after, in one place, is the only evidence anybody can review quickly.

---

## 6 · Ask the person who knows the thing — and then magnify it anyway

Two different kinds of knowledge, and you need both:

- **Somebody who knows the object** — what a flower head IS, how a garment hangs, how a machine is
  actually assembled. Give them reference photographs. This gets the *construction* right in one
  round instead of three.
- **Somebody who knows what your pipeline does at the size it ships at.** The expert on the object
  will usually tell you, correctly, that they do not know this — and the fix for a small-size problem
  is often *exaggeration*, which is the opposite of what accuracy advice will tell you.

**The magnifier finds what the expert cannot.** The row-constant seed above was invisible to everyone
who knew flowers and obvious at 3×.

---

## 7 · Know what actually costs

Measure before you optimise, and know which number matters in your pipeline. In the project this came
from, merging parts per object meant the triangle count rose by an order of magnitude across several
rounds while the *draw calls never moved* — so the thing everyone assumed was the cost was not the
cost. **Find out which of yours is which, and write the figure down with the date and the run that
produced it**, or the next person will do arithmetic on a stale number.

---

## 8 · If you are briefing somebody else to do this

Mark every line of the brief **`[CODE]`** (you opened the file this hour) or **`[MEMORY]`** (you
believe it and did not check). A brief with no `[MEMORY]` lines has not been honest about itself.

On one run of four people working from briefs, **every single one found a false statement in their
brief and was right to contradict it** — a camera position, two things described as models that were
flat images, a count of six called eight, and a component said to use a shared code path that does
not. Say so in the brief: **somebody who contradicts it with a citation is doing the job, not failing
to follow it.**

Give them: the reference pictures, the light's real numbers, the true shape of whatever seam they
must fit into, the checks they will have to pass — and the rule that **the rendered frame decides**,
not the reasoning that produced it.

---

## The short version

1. Ask how it was made, and build it in that order.
2. Silhouette first, at the size and from the view it will really be seen.
3. Wrong three times the same way? Rebuild, do not re-tune.
4. Learn the light's real range, then paint the differences in.
5. Make the seed move on both axes, and check it by magnifying.
6. Render it and look, early, and keep the pictures.
7. Two kinds of expert. You need both.
8. Measure the cost that is actually the cost.
9. Mark your brief `[CODE]` / `[MEMORY]`, and invite contradiction.
