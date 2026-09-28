---
name: game-brief
description: Build a tailored questionnaire for someone who wants a custom game — their world, cast, loop, feel and stakes — plus a map of which files each answer changes. Use when the user says /game-brief, wants to interview someone about a game idea, is onboarding a new content pack or cartridge, or asks what to ask a person before building their game. Produces a folder written TO that person, not about them.
---

# Game Brief

Someone wants a game. Before anyone writes a map file, find out what they actually
want — in their words, in a form they can answer on a phone in five minutes.

The reference implementation is `docs/for-partner/` in `meridian-quest`. Read it before
writing a new one; it is the shape that worked.

## What you produce

A folder — `docs/for-<name>/` or wherever the user says — containing three files:

1. **`README.md`** — written TO them. What the thing is, that they don't have to build
   an engine, that blanks are fine, and how to answer (voice note, text, one word).
2. **`QUESTIONS.md`** — the questions, each tagged with what it decides.
3. **`AFFECTED.md`** — tag → files that change → how big the ask is.

## The question set

Adapt, don't recite. These are the categories that have earned their place; the
wording should sound like the person asking and the person answering.

**The place** `[world]` — Where is it? What is it like to stand there (time of day,
weather, sound)? What is the first thing you'd do when you open it?

**The people** `[cast]` — Name three who live there and one true thing about each. Is
there an animal? Who are you in the game — new in town, or from there?

**What you do** `[quests]` — What do people ask you for help with? Is it teaching
anything, or is it just nice? *(Both are valid; say so out loud.)*

**The feel** `[art] [loop]` — What makes a game cozy to you, *specifically* — name
actual moments from games or shows. What makes you quit a game?

**Stakes** `[stakes]` — Should anything ever go wrong? Can you lose something, or
never? *(See "Ask about stakes properly" below.)*

**Their taste** `[eggs]` — Which shows, books, games, music? Hidden references cost
almost nothing to add and buy enormous delight.

**Practical** `[meta] [i18n]` — What's it called? One language or two? Who plays it —
phone, laptop, both?

**The wildcard** — "Is there anything you want that the example game doesn't have?"
The single most useful question on the sheet. Ask it last, leave room to write.

## Rules that make it work

- **Write to them, never about them.** Second person. No "the stakeholder."
- **Say blanks are fine, and mean it.** Most people answer six of eighteen and that
  is a complete success.
- **Tag every question** with what it decides, and make the tags real — they must
  resolve to actual files in `AFFECTED.md`.
- **Show them the ask is small.** "I want it to be a horse ranch" should visibly be a
  small ask. People self-censor when they think they are causing work.
- **Flag the two or three answers that DO cost real work**, plainly, without
  discouraging the answer. They deserve to know which questions are load-bearing.
- **Never ask a question you have already answered elsewhere.** Check the project's
  standing-rules file first (`docs/OWNER.md` in meridian-quest).
- **No jargon.** Not "progression loop" — "what's the first thing you'd do?"

## Ask about stakes properly

This is the question people get wrong, including us. Do not ask "do you want hearts?"
— that names a mechanic instead of a feeling. Ask:

- Should anything ever go wrong?
- If you get something wrong, what should happen?
- Is there a version of this game with a timer, or is that horrible?
- Is there a mini-game or challenge inside it where stakes WOULD be fun?

That last one matters: a game can be stakes-free to wander and still have a scored
challenge inside it. The two are separable, and most people want both once asked.

## After they answer

- Write the answers into the project's standing-rules file, quoting them.
- Anything ambiguous: ask once more, do not guess.
- Hand the tagged answers to whoever plans content (`/don-guero`) and story
  (`/nacho`) — the tags are the handoff.
