import assert from "node:assert/strict";
import fs from "node:fs";
import {
  SUBJECTS,
  DINOS,
  RANKS,
  TYPING_MODES,
  validateGameData,
} from "../js/data/catalog.js";
import { LEARNING_STEPS } from "../js/systems/focused-learning.js";
import { generateSession } from "../js/systems/learning.js";
import {
  newSave,
  finishLearning,
  finishTyping,
  startDig,
  digReward,
} from "../js/systems/rules.js";
import { validateSaveData, migrateSave } from "../js/core/save.js";
import { doors, findPathToDoor, walkable } from "../js/systems/walking.js";

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
assert.deepEqual(rows, expected);
assert.equal(SUBJECTS.reduce((sum, s) => sum + s.maxLevel, 0), 60);
for (const subject of SUBJECTS)
  assert.equal(LEARNING_STEPS[subject.id]?.length, subject.maxLevel);
assert.deepEqual(validateGameData(), []);

// Rank 10 must not require perfect 180/180 stars after the 60-level rebuild.
assert.deepEqual(RANKS, [0, 1, 5, 10, 18, 28, 40, 52, 64, 75]);
assert.ok(RANKS.at(-1) < 180, "rank 10 must be reachable without perfect stars");

function questionId(q) {
  const visual =
    q.visual === "coins"
      ? q.coins?.join(",")
      : q.visual === "clock"
        ? `${q.hour}:${q.minute}`
        : q.creature || q.emoji || q.count || "";
  return `${q.text}|${q.answer}|${q.visual || ""}|${visual}`;
}

let generated = 0;
const creatureCoverage = {
  fish: new Set(),
  dinosaurs: new Set(),
  animals: new Set(),
};
for (const subject of SUBJECTS) {
  for (let level = 1; level <= subject.maxLevel; level++) {
    for (let session = 0; session < 10; session++) {
      const questions = generateSession(subject.id, level);
      assert.equal(questions.length, 5, `${subject.id} Lv${level}: expected 5 questions`);
      const ids = new Set();
      for (const q of questions) {
        generated++;
        assert.equal(typeof q.text, "string");
        assert.ok(q.text.length > 0 && q.text.length <= 180);
        assert.equal(typeof q.answer, "string");
        assert.ok(q.options.length >= 2 && q.options.length <= 4);
        assert.ok(q.options.includes(q.answer));
        assert.equal(new Set(q.options).size, q.options.length);
        assert.ok(!q.text.includes("undefined"));
        const id = questionId(q);
        assert.ok(!ids.has(id), `${subject.id} Lv${level}: duplicate inside session`);
        ids.add(id);
        if (creatureCoverage[subject.id] && q.creature)
          creatureCoverage[subject.id].add(q.creature);
        if (subject.id === "english") {
          assert.ok(q.speak, `english Lv${level}: missing speech payload`);
          assert.equal(q.speakLang, "en-US");
        }
      }
    }
  }
}
assert.ok(generated >= 3000);
assert.ok(creatureCoverage.fish.size >= 40, `fish coverage too small: ${creatureCoverage.fish.size}`);
assert.ok(creatureCoverage.dinosaurs.size >= 25, `dino coverage too small: ${creatureCoverage.dinosaurs.size}`);
assert.ok(creatureCoverage.animals.size >= 25, `animal coverage too small: ${creatureCoverage.animals.size}`);

// Save regression from v1.2.
const sparse = newSave(1, "てすと");
delete sparse.room.slots[2];
let errors = validateSaveData(sparse);
assert.deepEqual(errors, [], `sparse room slots: ${errors.join(" / ")}`);

const legacyLearning = newSave(1, "てすと");
legacyLearning.learning.math.unlocked = 20;
legacyLearning.learning.math.levels[20] = { stars: 1, plays: 1 };
legacyLearning.progression.stars = 1;
assert.deepEqual(validateSaveData(legacyLearning), []);

const legacyFossil = newSave(1, "てすと");
legacyFossil.dinosaurs.fossilBook[DINOS[0].id] = {
  parts: [...DINOS[0].parts],
  completed: false,
};
const migrated = migrateSave(legacyFossil);
assert.equal(migrated.dinosaurs.fossilBook[DINOS[0].id].completed, true);
assert.equal(migrated.dinosaurs.completedCount, 1);
assert.deepEqual(validateSaveData(migrated), []);

// Final level ticket rule remains correct.
const learning = newSave(1, "てすと");
learning.learning.math.unlocked = expected.math;
const beforeTickets = learning.progression.tickets;
const reward = finishLearning(learning, "math", expected.math, 3);
assert.equal(reward.ticket, true);
assert.equal(learning.progression.tickets, beforeTickets + 1);

// Typing fun modes open early: clear basic Lv1..3 -> level becomes 4 -> rescue opens.
const typing = newSave(1, "てすと");
for (let level = 1; level <= 3; level++) {
  assert.equal(typing.typing.level, level);
  finishTyping(typing, "basic", level, {
    score: 90,
    correct: 30,
    misses: 0,
    speed: 40,
    accuracy: 100,
    combo: 30,
    words: 5,
  });
}
assert.equal(typing.typing.level, 4);
assert.equal(TYPING_MODES.find((m) => m.id === "challenge").level, 3);
assert.equal(TYPING_MODES.find((m) => m.id === "rescue").level, 4);
assert.equal(TYPING_MODES.find((m) => m.id === "escape").level, 7);
assert.equal(TYPING_MODES.find((m) => m.id === "battle").level, 10);

// Excavation v1.2 regression.
const dig = newSave(1, "てすと");
dig.progression.manabiRank = 6;
dig.progression.unlockedFacilities.push("excavation");
dig.dinosaurs.unlockedAreas = ["dig_0"];
const trip = startDig(dig, "dig_0");
assert.equal(trip.remaining, 3);
const found = digReward(dig, () => 0);
assert.ok(found.d);
assert.equal(dig.dinosaurs.fossilBook[found.d.id].completed, true);
assert.deepEqual(validateSaveData(dig), []);

// Every building must have a usable auto-route from representative island positions.
for (const start of [
  { x: 0, z: 5 },
  { x: -5, z: 0 },
  { x: 5, z: 5 },
  { x: 0, z: -4 },
]) {
  for (const door of doors) {
    const path = findPathToDoor(start, door);
    assert.ok(path.length, `${door.id}: no route from ${JSON.stringify(start)}`);
    const last = path.at(-1);
    assert.ok(walkable(Math.round(last.x), Math.round(last.z)), `${door.id}: bad final tile`);
  }
}

// Source smoke tests for UX fixes.
const main = fs.readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
const games = fs.readFileSync(new URL("../js/games.js", import.meta.url), "utf8");
const audio = fs.readFileSync(new URL("../js/core/audio.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../css/game.css", import.meta.url), "utf8");
assert.ok(main.includes("Version 1.3.1"));
assert.ok(main.includes("findPathToDoor"));
assert.ok(main.includes('class="home-action" data-a="quickhome"'));
assert.ok(main.includes('<button data-a="quickhome">🏝 しまへ</button>'));
assert.ok(main.includes('data-a="typelevel:basic:${t.level}"'));
assert.ok(main.includes("きほんLv${nextMode.level - 1}を くりあすると OPEN"));
assert.ok(main.includes('case "speakquestion"'));
assert.ok(games.includes('mark.textContent = ok ? "○" : "×"'));
assert.ok(games.includes('data-a="school">きょうかをえらぶ'));
assert.ok(games.includes("q.speak"));
assert.ok(games.includes("typing-clear"));
assert.ok(audio.includes("SpeechSynthesisUtterance"));
assert.ok(css.includes("/* v1.3 playability rebuild */"));
assert.ok(css.includes(".answer-mark.correct"));

console.log(
  `PASS: Obecolle2 v1.3.1 verifier (${generated} questions; coverage fish=${creatureCoverage.fish.size}, dinos=${creatureCoverage.dinosaurs.size}, animals=${creatureCoverage.animals.size})`,
);
