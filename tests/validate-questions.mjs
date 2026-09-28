#!/usr/bin/env node
// Validates every q_*.json question bank against the app's structural rules.
// Run: node tests/validate-questions.mjs
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXCLUDED = new Set([
  "questions.json",
  "q_uestions.json",
  "questions_example.json",
  "q_otieinai.json",
]);

const files = readdirSync(ROOT).filter(
  (f) => /^q_.*\.json$/i.test(f) && !EXCLUDED.has(f.toLowerCase())
);

if (files.length === 0) {
  console.error("FAIL: no q_*.json files found");
  process.exit(1);
}

let errors = 0;
const err = (file, msg) => { console.error(`  ${file}: ${msg}`); errors++; };

for (const file of files) {
  let data;
  try {
    data = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  } catch (e) {
    err(file, `invalid JSON — ${e.message}`);
    continue;
  }
  if (!Array.isArray(data)) { err(file, "root must be an array"); continue; }
  if (data.length === 0) err(file, "empty question array");

  data.forEach((q, i) => {
    const at = `q[${i}] (number=${q?.number})`;
    if (!q || typeof q !== "object") return err(file, `${at}: not an object`);
    if (typeof q.question_en !== "string" || !q.question_en.trim())
      err(file, `${at}: missing question_en`);
    if (!Array.isArray(q.choices_en) || q.choices_en.length < 2 || q.choices_en.length > 8)
      err(file, `${at}: choices_en must be an array of 2-8 strings`);
    else if (q.choices_en.some((c) => typeof c !== "string" || !c.trim()))
      err(file, `${at}: choices_en contains empty/non-string entries`);
    if (!Number.isInteger(q.correctIndex))
      err(file, `${at}: correctIndex must be an integer`);
    else if (Array.isArray(q.choices_en) && (q.correctIndex < 0 || q.correctIndex >= q.choices_en.length))
      err(file, `${at}: correctIndex ${q.correctIndex} out of range`);
    if (Array.isArray(q.choices_el) && Array.isArray(q.choices_en) && q.choices_el.length !== q.choices_en.length)
      err(file, `${at}: choices_el length differs from choices_en`);
    const tags = Object.keys(q).filter((k) => q[k] === true);
    if (tags.length !== 1)
      err(file, `${at}: expected exactly 1 boolean category tag, found ${tags.length}`);
  });

  // Bundled banks ship in both languages (the EL toggle relies on it).
  data.forEach((q, i) => {
    const at = `q[${i}] (number=${q?.number})`;
    if (typeof q?.question_el !== "string" || !q.question_el.trim())
      err(file, `${at}: missing question_el (Greek translation)`);
    if (!Array.isArray(q?.choices_el) || q.choices_el.some((c) => typeof c !== "string" || !c.trim()))
      err(file, `${at}: missing or empty choices_el (Greek translation)`);
  });

  // Answer-guessability checks: nobody should score well by always picking
  // the longest option or always picking the same letter.
  const valid = data.filter(
    (q) => Array.isArray(q?.choices_en) && Number.isInteger(q?.correctIndex) &&
      q.correctIndex >= 0 && q.correctIndex < q.choices_en.length
  );
  if (valid.length >= 10) {
    for (const key of ["choices_en", "choices_el"]) {
      let longest = 0;
      valid.forEach((q) => {
        const choices = q[key];
        if (!Array.isArray(choices) || choices.length !== q.choices_en.length) return;
        const len = choices.map((c) => String(c).length);
        const correct = len[q.correctIndex];
        const maxWrong = Math.max(...len.filter((_, k) => k !== q.correctIndex));
        if (correct > maxWrong) longest++;
        if (correct >= 12 && correct >= 2 * maxWrong)
          err(file, `number=${q.number}: ${key} correct answer is 2x longer than every wrong one (lengthen a distractor)`);
      });
      const cap = Math.floor(valid.length * 0.3);
      if (longest > cap)
        err(file, `${key}: correct answer is the longest option in ${longest}/${valid.length} questions (max ${cap}); lengthen distractors or shorten correct answers`);
    }
    const counts = {};
    valid.forEach((q) => { counts[q.correctIndex] = (counts[q.correctIndex] || 0) + 1; });
    const slots = Math.min(...valid.map((q) => q.choices_en.length));
    const hi = Math.floor(valid.length * 0.4);
    const lo = Math.floor(valid.length * 0.1);
    for (let k = 0; k < slots; k++) {
      const c = counts[k] || 0;
      if (c > hi || c < lo)
        err(file, `correct answer is option ${"ABCDEFGH"[k]} in ${c}/${valid.length} questions (allowed ${lo}-${hi}); spread answers across positions`);
    }
  }

  // sequential numbering (when the number field is used)
  const nums = data.map((q) => q?.number).filter(Number.isInteger);
  if (nums.length === data.length) {
    nums.forEach((n, i) => {
      if (n !== i + 1) err(file, `q[${i}]: number is ${n}, expected ${i + 1}`);
    });
  }
}

const total = files.length;
if (errors) {
  console.error(`\nFAIL: ${errors} error(s) across ${total} file(s)`);
  process.exit(1);
}
console.log(`OK: ${total} question files valid`);
