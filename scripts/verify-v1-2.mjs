import assert from "node:assert/strict";
import { SUBJECTS, DINOS, validateGameData } from "../js/data/catalog.js";
import { LEARNING_STEPS } from "../js/systems/focused-learning.js";
import { generateSession } from "../js/systems/learning.js";
import {
  newSave,
  finishLearning,
  startDig,
  digReward,
} from "../js/systems/rules.js";
import { validateSaveData, migrateSave } from "../js/core/save.js";
import fs from "node:fs";

const expected = {
  math: 12,
  japanese: 10,
  clock: 6,
  money: 6,
  english: 8,
  fish: 6,
  dinosaurs: 6,
  animals: 6,
};

const rows = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.maxLevel]));
assert.deepEqual(rows, expected, "subject max levels must match v1.2 spec");
assert.equal(SUBJECTS.reduce((sum, s) => sum + s.maxLevel, 0), 60, "v1.2 must contain exactly 60 learning levels");
for (const subject of SUBJECTS) {
  assert.equal(LEARNING_STEPS[subject.id]?.length, subject.maxLevel, `${subject.id}: step labels must match maxLevel`);
}

const gameDataErrors = validateGameData();
assert.deepEqual(gameDataErrors, [], `validateGameData failed: ${gameDataErrors.join(" / ")}`);

let generated = 0;
for (const subject of SUBJECTS) {
  for (let level = 1; level <= subject.maxLevel; level++) {
    for (let session = 0; session < 3; session++) {
      const questions = generateSession(subject.id, level);
      assert.equal(questions.length, 5, `${subject.id} Lv${level}: session must have 5 questions`);
      const ids = new Set();
      for (const q of questions) {
        generated++;
        assert.equal(typeof q.text, "string");
        assert.ok(q.text.length > 0 && q.text.length <= 160, `${subject.id} Lv${level}: unreasonable question length`);
        assert.equal(typeof q.answer, "string");
        assert.ok(Array.isArray(q.options));
        assert.ok(q.options.length >= 2 && q.options.length <= 4, `${subject.id} Lv${level}: choices must be 2..4`);
        assert.ok(q.options.includes(q.answer), `${subject.id} Lv${level}: answer missing from options`);
        assert.equal(new Set(q.options).size, q.options.length, `${subject.id} Lv${level}: duplicate choices`);
        assert.ok(!q.text.includes("undefined"), `${subject.id} Lv${level}: undefined leaked into question`);
        const visual = q.visual === "coins"
          ? q.coins?.join(",")
          : q.visual === "clock"
            ? `${q.hour}:${q.minute}`
            : q.creature || q.emoji || q.count || "";
        const id = `${q.text}|${q.answer}|${q.visual || ""}|${visual}`;
        assert.ok(!ids.has(id), `${subject.id} Lv${level}: duplicate question within one session`);
        ids.add(id);
      }
    }
  }
}
assert.ok(generated >= 900, "expected broad generated-question coverage");

// Regression: sparse room slots must be valid.
const sparse = newSave(1, "てすと");
delete sparse.room.slots[2];
let errors = validateSaveData(sparse);
assert.deepEqual(errors, [], `sparse room slots regression: ${errors.join(" / ")}`);

// Legacy v1.1 levels 11-20 remain readable even though the UI now stops earlier.
const legacyLearning = newSave(1, "てすと");
legacyLearning.learning.math.unlocked = 20;
legacyLearning.learning.math.levels[20] = { stars: 1, plays: 1 };
legacyLearning.progression.stars = 1;
errors = validateSaveData(legacyLearning);
assert.deepEqual(errors, [], `legacy learning save must remain valid: ${errors.join(" / ")}`);

// Legacy four-part fossil waiting for restoration should migrate to completed automatically.
const legacyFossil = newSave(1, "てすと");
legacyFossil.dinosaurs.fossilBook[DINOS[0].id] = {
  parts: [...DINOS[0].parts],
  completed: false,
};
assert.deepEqual(validateSaveData(legacyFossil), [], "legacy four-part fossil fixture should be valid before migration");
const migrated = migrateSave(legacyFossil);
assert.equal(migrated.dinosaurs.fossilBook[DINOS[0].id].completed, true, "legacy full fossil should auto-complete");
assert.equal(migrated.dinosaurs.completedCount, 1, "migrated completedCount should be repaired");
assert.equal(migrated.inventory.specialItems[`figure_${DINOS[0].id}`], 1, "migrated dinosaur figure should be granted");
assert.deepEqual(validateSaveData(migrated), [], "migrated legacy fossil save should validate");

// Final subject levels must reward a ticket even when maxLevel is not a multiple of five.
const learning = newSave(1, "てすと");
const mathMax = expected.math;
learning.learning.math.unlocked = mathMax;
const beforeTickets = learning.progression.tickets;
const reward = finishLearning(learning, "math", mathMax, 3);
assert.equal(reward.ticket, true, "final math level should award a milestone ticket");
assert.equal(learning.progression.tickets, beforeTickets + 1);
assert.equal(learning.inventory.specialItems.subject_math, 1, "subject completion keepsake should be granted");

// v1.2 excavation: one ticket = three short digs; one successful discovery restores one whole dinosaur.
const dig = newSave(1, "てすと");
dig.progression.manabiRank = 6;
dig.progression.unlockedFacilities.push("excavation");
dig.dinosaurs.unlockedAreas = ["dig_0"];
const digTickets = dig.progression.tickets;
const trip = startDig(dig, "dig_0");
assert.equal(trip.remaining, 3, "v1.2 dig trip should have 3 discoveries");
assert.equal(dig.progression.tickets, digTickets - 1);
const found = digReward(dig, () => 0);
assert.ok(found.d, "dig should always reveal a dinosaur");
assert.equal(found.isNew, true, "first dig should be new");
assert.equal(dig.dinosaurs.fossilBook[found.d.id].completed, true, "found dinosaur should be restored immediately");
assert.equal(dig.dinosaurs.fossilBook[found.d.id].parts.length, 4, "schema-compatible full parts should be recorded");
assert.equal(dig.dinosaurs.completedCount, 1);
assert.equal(dig.dinosaurs.trip.remaining, 2);
assert.deepEqual(validateSaveData(dig), [], "new excavation result should remain save-valid");

// Source-level smoke assertions for UI flow and interaction gating (DOM-free CI check).
const main = fs.readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
const games = fs.readFileSync(new URL("../js/games.js", import.meta.url), "utf8");
const world = fs.readFileSync(new URL("../js/three/world.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../css/game.css", import.meta.url), "utf8");
assert.ok(main.includes("Version 1.2.0"));
assert.ok(main.includes("world.setInteractionsEnabled(false)"));
assert.ok(games.includes("つぎのレベルへ"));
assert.ok(games.includes("fishing-stage"));
assert.ok(games.includes("digspot"));
assert.ok(world.includes("setInteractionsEnabled(enabled)"));
assert.ok(css.includes("/* v1.2 quality rebuild */"));

console.log(`PASS: Obecolle2 v1.2 verifier (${generated} generated learning questions checked)`);
