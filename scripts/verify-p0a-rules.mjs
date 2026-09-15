import assert from "node:assert/strict";
import fs from "node:fs";
import * as R from "../js/systems/rules.js";
import { resetTransientState } from "../js/systems/session-state.js";

function baseState() {
  return {
    progression: {
      tickets: 5,
      unlockedFacilities: ["fishing", "excavation"],
    },
    fishing: {
      trip: null,
      unlockedAreas: ["water_0", "water_1"],
    },
    dinosaurs: {
      trip: null,
      unlockedAreas: ["dig_0", "dig_1"],
    },
    arena: { active: null },
  };
}

function assertUnchanged(actual, expected, label) {
  assert.deepEqual(actual, expected, `${label} must leave save state unchanged`);
}

{
  const s = baseState();
  const first = R.startFishing(s, "water_0");
  assert.deepEqual(first, { area: "water_0", remaining: 3 });
  assert.equal(s.progression.tickets, 4);
  assert.equal(R.startFishing(s, "water_0"), first);
  assert.equal(s.progression.tickets, 4, "fishing resume consumed a second ticket");
  const before = structuredClone(s);
  assert.throws(() => R.startFishing(s, "water_1"), /おわらせてから/);
  assertUnchanged(s, before, "different fishing area");
}

{
  const s = baseState();
  const first = R.startDig(s, "dig_0");
  assert.deepEqual(first, { area: "dig_0", remaining: 3 });
  assert.equal(s.progression.tickets, 4);
  assert.equal(R.startDig(s, "dig_0"), first);
  assert.equal(s.progression.tickets, 4, "dig resume consumed a second ticket");
  const before = structuredClone(s);
  assert.throws(() => R.startDig(s, "dig_1"), /おわらせてから/);
  assertUnchanged(s, before, "different dig area");
}

{
  const transient = {
    companion: "friend_01",
    noticeQueue: [{ type: "arrival" }],
    arenaRound: { cup: "cup_0" },
    pendingImport: { slot: 2 },
    roomFriend: "friend_01",
    decorateSlot: 4,
    walkPath: [{ x: 1, z: 1 }],
    walkDestination: "school",
    nearDoor: { id: "school" },
    activity: { kind: "fish" },
    modalOpen: true,
    page: 3,
    category: "fish",
    memoryPage: 2,
    shopCategory: "rods",
    shopPage: 4,
    walkOverview: true,
    editing: true,
    draft: {},
    newSlot: 2,
    walkKeys: new Set(["ArrowUp"]),
  };
  resetTransientState(transient);
  assert.equal(transient.companion, null);
  assert.deepEqual(transient.noticeQueue, []);
  assert.equal(transient.arenaRound, null);
  assert.equal(transient.pendingImport, null);
  assert.equal(transient.roomFriend, null);
  assert.equal(transient.decorateSlot, null);
  assert.deepEqual(transient.walkPath, []);
  assert.equal(transient.walkDestination, null);
  assert.equal(transient.nearDoor, null);
  assert.equal(transient.activity, null);
  assert.equal(transient.modalOpen, false);
  assert.equal(transient.walkKeys.size, 0);
}

{
  const s = baseState();
  s.arena.active = { cup: "cup_0", wins: 1, creature: "animal_01" };
  const before = structuredClone(s.arena.active);
  assert.throws(() => R.assertArenaStartAllowed(s, "cup_1"), /べつのたいかい/);
  assert.deepEqual(s.arena.active, before, "active tournament was overwritten");
  assert.throws(() => R.assertArenaStartAllowed(s, "cup_0"), /つづけよう/);
  s.arena.active = null;
  assert.doesNotThrow(() => R.assertArenaStartAllowed(s, "cup_1"));
}

{
  const weak = { stats: { power: 10, speed: 10, guard: 10, special: 10 } };
  const strong = { stats: { power: 90, speed: 90, guard: 90, special: 90 } };
  assert.ok(R.arenaScore(strong, 50, 50, 50) > R.arenaScore(weak, 50, 50, 50));
}

const main = fs.readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
const games = fs.readFileSync(new URL("../js/games.js", import.meta.url), "utf8");
const rules = fs.readFileSync(new URL("../js/systems/rules.js", import.meta.url), "utf8");
assert.equal(main.includes("いきものの つよさは かわらないよ"), false);
assert.ok(main.includes("いきものによって とくいが ちがうよ"));
assert.ok(main.includes('data-a="togetherfishing:${id}"'));
assert.ok(main.includes('data-a="togetherdig:${id}"'));
assert.ok(main.includes("this.resetSessionState();"));
assert.ok(main.includes("this.companion = null;\n    this.setScene(\"island\")"));
assert.ok(games.includes("this.companionReward(\"つり\");"));
assert.ok(games.includes("rules.assertArenaStartAllowed(this.s, cup);"));
assert.ok(rules.includes("s.fishing.trip.area !== area"));
assert.ok(rules.includes("s.dinosaurs.trip.area !== area"));

console.log("PASS: Obecolle2 v1.3.2 P0-A rules and session regression verifier");
