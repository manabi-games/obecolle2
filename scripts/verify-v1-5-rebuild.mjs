import assert from "node:assert/strict";
import fs from "node:fs";
import * as D from "../js/data/catalog.js";
import * as R from "../js/systems/rules.js";
import { typingWords, validateTyping } from "../js/systems/typing.js";
import { validateSaveData } from "../js/core/save.js";

assert.equal(fs.readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim(), "1.5.0");
assert.equal(D.ACTIVE_FRIENDS.length, 10);
assert.equal(new Set(D.ACTIVE_FRIENDS.map((f) => f.id)).size, 10);
for (const f of D.ACTIVE_FRIENDS) {
  assert.ok(f.voice && Number.isFinite(f.voice.rate) && Number.isFinite(f.voice.pitch));
  assert.ok(Array.isArray(f.lines) && f.lines.length >= 3);
}
assert.equal(D.DINOS.length, 30);
assert.deepEqual(validateTyping(), []);
for (let level = 1; level <= 30; level++) assert.ok(typingWords(level).length >= 3);

const s = R.newSave(1, "てすと");
for (let level = 1; level <= 30; level++) {
  const reward = R.finishTyping(s, "basic", level, {
    score: 100,
    correct: 20,
    misses: 0,
    speed: 120,
    accuracy: 100,
    combo: 20,
    words: 5,
  });
  assert.equal(reward.dinosaur?.id, D.DINOS[level - 1].id);
  assert.equal(s.dinosaurs.fossilBook[D.DINOS[level - 1].id]?.completed, true);
}
assert.equal(s.typing.level, 30);
assert.equal(s.typing.completedLevels.length, 30);
assert.equal(s.dinosaurs.completedCount, 30);
assert.equal(validateSaveData(s).length, 0);

R.refreshMissions(s);
assert.ok(s.missions.daily.every((m) => ["learning", "talk", "room", "typing"].includes(m.metric)));
const req = R.requestFriend(s, "friend_haru");
assert.ok(["learning", "typing"].includes(req.metric));

const main = fs.readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
const world = fs.readFileSync(new URL("../js/three/world.js", import.meta.url), "utf8");
const walking = fs.readFileSync(new URL("../js/systems/walking.js", import.meta.url), "utf8");
const audio = fs.readFileSync(new URL("../js/core/audio.js", import.meta.url), "utf8");
assert.ok(main.includes("Version 1.5.0"));
assert.ok(main.includes('id="walk-talk"'));
assert.equal(main.includes('data-a="overview"'), false);
assert.ok(main.includes("たいぴんぐはっくつじょ"));
assert.ok(main.includes('["fishing", "excavation", "arena", "togetherfishing", "togetherdig"]'));
assert.ok(main.includes('["friends", "ともだち"]'));
assert.equal(main.includes('["fish", "さかな"]'), false);
assert.ok(world.includes('!["plaza", "fishing", "excavation", "arena"].includes(x.id)'));
assert.ok(world.includes("ACTIVE_FRIENDS"));
assert.ok(world.includes('"idle", 1.1'));
assert.ok(world.includes("this.typingRock"));
assert.ok(walking.includes('new Set(["fishing", "excavation", "arena"])'));
assert.ok(audio.includes("options.voiceIndex"));
console.log("PASS: Obecolle2 v1.5 rebuild verifier (10 friends, 30 typing excavation levels, 30 dinosaurs)");
