---
name: mcq-questions
description: Rules for writing or editing MCQ Trainer question banks (q_*.json). Use whenever you create, translate, fix or review questions in this repo, so answers are never guessable from option length or position and every bank stays bilingual EN/EL.
---

# Writing MCQ Trainer questions

Question banks are the `q_*.json` files in the repo root. `node tests/validate-questions.mjs`
enforces everything below and runs in CI, so run it before every commit.

## Format (one object per question)

```json
{
  "number": 1,
  "question_en": "Which port does HTTPS use by default?",
  "question_el": "Ποια θύρα χρησιμοποιεί το HTTPS από προεπιλογή;",
  "choices_en": ["80", "8080", "443", "8443"],
  "choices_el": ["80", "8080", "443", "8443"],
  "correctIndex": 2,
  "networking": true
}
```

- `number` is sequential from 1. `correctIndex` is zero-based.
- Exactly one boolean category tag set to `true` (same tag for the whole file).
- Optional: `id`, `code` (shown as a code block), `image`, `image_answers`.
- `question_el` / `choices_el` are required for bundled banks. `choices_el` has the same order
  and length as `choices_en`. Keep technical terms (TCP, SELECT, LINQ, class, commit…) in English.
- A new bundled bank also needs an entry in `BUNDLED_SETS` (`js/07-quiz.js`). Never list it in
  `sources_index.json`.

## The answer must not be guessable from the options' form

1. **Length.** The correct option must not stand out as the longest. Keep options of similar
   length; when the correct answer needs detail, give at least one wrong option the same detail.
   Limit per file: the correct option is strictly the longest in at most 30% of questions, in
   English and in Greek separately. It must never be 2x longer than every wrong option.
2. **Position.** Spread correct answers evenly over A/B/C/D. Limit per file: every position holds
   between 10% and 40% of the correct answers. Avoid visible patterns (A, B, C, D, A, B…).
3. **Distractors.** Plausible to a beginner, clearly wrong to someone who knows the topic. No joke
   options, no "all/none of the above", no two options that mean the same thing, and never a
   second defensible correct answer (watch for "also true in some setups" cases).
4. **Weak fillers** like "They are identical" or "There is no difference" are fine occasionally,
   but not as the only short options next to one long correct answer.

## Workflow

1. Write or edit the questions following the rules above.
2. Run `node tests/validate-questions.mjs` and fix every reported line.
3. When editing an existing question, keep its `number` so saved stats stay attached to it.
4. Changing choices or `correctIndex` is safe for users: at boot the app refreshes their stored
   copy of bundled sets and drops saved answers only for the questions whose choices changed.
