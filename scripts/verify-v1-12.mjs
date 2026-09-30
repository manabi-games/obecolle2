import assert from "node:assert/strict";
import { CORE_SUBJECT_IDS, SUBJECTS, ITEMS, ACTIVE_FRIENDS, FURNITURE_VISUALS, SUBJECT_UNLOCKS } from "../js/data/catalog.js";
import { generateSession } from "../js/systems/learning.js";
import { newSave, evaluate, refreshMissions, masterRequirements } from "../js/systems/rules.js";
import { migrateSave, validateSaveData } from "../js/core/save.js";
import { buildRoomVisualState, currentFriendAppearance, itemVisual } from "../js/systems/visual-state.js";
import { itemArt } from "../js/ui-visuals.js";
import { appearancePortrait } from "../js/ui-child.js";
import { character, furniture } from "../js/three/factories.js";
import { games } from "../js/games.js";

let generated = 0;
for (const id of CORE_SUBJECT_IDS) {
  const subject = SUBJECTS.find((row) => row.id === id);
  for (let level = 1; level <= subject.maxLevel; level++) {
    for (let run = 0; run < 100; run++) {
      const questions = generateSession(id, level);
      assert.equal(questions.length, 5, `${id} Lv${level}`);
      for (const q of questions) {
        const context = `${id} Lv${level}: ${q.text}`;
        assert.ok(typeof q.text === "string" && q.text.trim().length > 0, context);
        assert.ok(typeof q.answer === "string" && q.answer.trim().length > 0, context);
        assert.ok(q.options.includes(q.answer), context);
        assert.equal(new Set(q.options).size, q.options.length, context);
        assert.ok(q.options.length >= 2 && q.options.length <= 4, context);
        assert.ok(q.options.every((v) => typeof v === "string" && v.trim()), context);
        assert.ok(!/undefined|NaN/.test(JSON.stringify(q)), context);
        assert.ok(q.text.length < 160, context);
        if (q.visual === "dots") {
          assert.ok(Number.isInteger(q.count) && q.count >= 1 && q.count <= 20, context);
          assert.equal(games.questionVisual(q).match(/class="dot"/g)?.length, q.count, context);
        }
        generated++;
      }
    }
  }
}

for (const item of ITEMS) {
  assert.equal(itemVisual(item), item.visual, item.id);
  assert.match(itemArt(item), /^<svg/, item.id);
  if (item.type === "furniture") {
    assert.ok(FURNITURE_VISUALS.includes(item.visual), item.id);
    assert.equal(furniture(item).userData.visual, item.visual, item.id);
  }
}
for (const item of ITEMS.filter((row) => ["clothing", "accessories"].includes(row.type))) {
  const model = character(item.type === "clothing" ? { outfit: item.id } : { hat: item.id });
  const head = model.userData.head;
  if (item.type === "clothing") assert.ok(model.getObjectByName(`costume-${item.visual}`), item.id);
  else if (!item.id.startsWith("glasses_")) assert.equal(head.userData.hatVisual, item.visual, item.id);
}
for (const item of ITEMS.filter((row) => row.id.startsWith("glasses_"))) {
  const appearance = { glasses: item.id };
  assert.ok(character(appearance).getObjectByName(`glasses-${item.visual}`), item.id);
  assert.match(appearancePortrait(appearance), new RegExp(`glasses-${item.visual}`), item.id);
}
assert.equal(ITEMS.find((row) => row.id === "glasses_2").visual, "star");

for (const unlock of SUBJECT_UNLOCKS) {
  const subject = SUBJECTS.find((row) => row.id === unlock.subject);
  assert.ok(CORE_SUBJECT_IDS.includes(unlock.subject), unlock.id);
  assert.ok(unlock.level <= subject.maxLevel, unlock.id);
}

const save = newSave(1);
const friend = ACTIVE_FRIENDS[0];
save.friends[friend.id] ||= { gifts: [], affinity: 0 };
save.friends[friend.id].gifts.push("clothing_2", "hat_3", "glasses_2", "furniture_5");
const friendRoom = buildRoomVisualState(save, friend.id);
assert.deepEqual(friendRoom.furnitureIds.filter(Boolean), ["furniture_5"]);
assert.deepEqual(friendRoom.appearance, currentFriendAppearance(friend, save.friends[friend.id]));
assert.equal(friendRoom.appearance.glasses, "glasses_2");
const selfRoom = buildRoomVisualState(save);
assert.deepEqual(selfRoom.furnitureIds.filter(Boolean), Object.values(save.room.slots));

const legacy = newSave(2);
legacy.learning.money.levels[1] = { stars: 3, plays: 1 };
legacy.progression.stars = 3;
const migrated = migrateSave(legacy);
assert.equal(migrated.progression.stars, 0);
assert.equal(migrated.learning.money.levels[1].stars, 3);
assert.deepEqual(validateSaveData(migrated), []);
evaluate(migrated);
assert.equal(migrated.progression.stars, 0);
assert.deepEqual(validateSaveData(newSave(3)), []);
refreshMissions(save);
assert.ok(save.missions.daily.every((row) => ["learning", "talk", "room", "typing"].includes(row.metric)));
assert.ok(masterRequirements(save).every((row) => !/さかな|つり|ありーな/.test(row[0])));
console.log(`PASS v1.12: ${generated} core questions, semantic glasses, shared room and legacy save`);
