import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] || process.cwd());
const read = (p) => fs.readFileSync(path.join(repo, p), "utf8");
const load = async (p) =>
  import(pathToFileURL(path.join(repo, p)).href + `?qa=${Date.now()}-${Math.random()}`);
const has = (text, needle, label = needle) =>
  assert.ok(text.includes(needle), `missing source gate: ${label}`);
const lacks = (text, needle, label = needle) =>
  assert.equal(text.includes(needle), false, `forbidden source gate remains: ${label}`);
const valid = (Save, s, label) =>
  assert.deepEqual(Save.validateSaveData(s), [], `${label}: save validation failed`);

assert.equal(read("VERSION").trim(), "1.4.0");
const main = read("js/main.js");
const games = read("js/games.js");
const css = read("css/game.css");
const factories = read("js/three/factories.js");
const world = read("js/three/world.js");
const rulesSource = read("js/systems/rules.js");
const saveSource = read("js/core/save.js");
const learningSource = read("js/systems/learning.js");

has(main, "Version 1.4.0", "main release version");
has(main, "collection-panel");
has(main, "shop-panel");
has(main, "pickfurniture");
has(main, 'this.display(b || "fish", 0)', "explicit fish display route");
has(main, "this.s.inventory.specialItems.aquarium_small", "aquarium ownership gate");
has(main, 'if (!owned) throw Error("もっていない あいてむだよ")', "wear ownership guard");
lacks(main, 'document.querySelector("#typing-level")', "old typing select route");
lacks(main, 'document.querySelector("#arena-creature")', "old arena select route");
lacks(main, 'case "restore":', "dead restoration action");
lacks(main, 'case "part":', "dead restoration part action");
lacks(main, 'case "socket":', "dead restoration socket action");
const clearRoomBlock = main.match(/case "clearroomconfirm":[\s\S]*?break;/)?.[0] || "";
assert.ok(clearRoomBlock, "clearroomconfirm route missing");
lacks(clearRoomBlock, "closeDialog()", "clearroomconfirm must not close the newly rendered decorate panel");

has(games, "rules.arenaEligible(cup, selected)", "arena selected-creature revalidation");
has(games, "eligibleOpponents = CREATURES.filter", "arena opponent eligibility");
has(games, "this.syncInteractionState();", "arena overlay interaction sync");
for (const [label, needle] of [
  ["arena match island exit", '<button class="primary" data-a="arenaround">はじめる</button> <button data-a="island">しまへ</button>'],
  ["arena result island exit", '${this.s.arena.active ? "たいかいをつづける" : "ありーなへ"}</button> <button data-a="island">しまへ</button>'],
  ["fishing result island exit", '${this.s.fishing.trip ? "つぎのきゃすと" : "つりみなとへ"}</button> <button data-a="island">しまへ</button>'],
  ["excavation result island exit", '${this.s.dinosaurs.trip ? "つぎの きらきらへ" : "はっくつじまへ"}</button> <button data-a="island">しまへ</button>'],
]) has(games, needle, label);

has(world, "const allFriendIds", "all friend ids in world");
has(world, "visibleFriendIds = allFriendIds.slice(0, 30)", "30-friend island cap");
has(world, "strictHover = true", "strict hover labels");
has(world, 'outfit: "clothing_" + f.defaultOutfit', "friend 3D outfit id");
lacks(world, ".slice(0, 6)", "old six-friend island cap");
lacks(world, "outfitIndex: f.defaultOutfit", "old friend outfitIndex path");

has(factories, "shape = a.shape", "animal model shape dispatch");
has(factories, 'shape === "marine_reptile"', "marine reptile model");
has(factories, 'shape === "plesiosaur"', "plesiosaur model");
lacks(factories, "return illustratedCreature(c, scale)", "illustrated creature fallback");

has(css, "v1.4 child UX foundation");
has(css, "body.panel-open #hud {", "panel-open HUD hide");
has(css, ".panel.child-grid-panel", "child grid panel viewport fit");
has(css, ".panel.creator-panel", "creator viewport fit");
has(css, "@media (max-height: 680px)", "720p-safe compact height rule");
has(css, ".friend-avatar.hair-11", "friend hair variants 4-11");
has(css, ".help-grid", "help 2x2 grid");
has(css, ".adult-note", "adult note styling");

has(rulesSource, "export function arenaEligible", "arena eligibility API");
has(rulesSource, 'x.type !== "clothing" || !s.inventory.clothing[x.id]', "chest duplicate-clothing guard");
has(saveSource, '"save.inventory.specialItems"', "legacy variable specialItems shape");
has(saveSource, '"save.room.wallpaper"', "legacy room wallpaper optional shape");
has(saveSource, 'migrated.room.wallpaper ||= "wallpaper_0"', "legacy wallpaper migration");
has(learningSource, "export const FISH_INFO", "export fish facts");
has(learningSource, "export const ANIMAL_INFO", "export animal facts");
has(learningSource, "このゲームでは", "fish habitat game-context wording");

const [R, T, U, D, L, Save, Session] = await Promise.all([
  load("js/systems/rules.js"),
  load("js/systems/typing.js"),
  load("js/ui-child.js"),
  load("js/data/catalog.js"),
  load("js/systems/learning.js"),
  load("js/core/save.js"),
  load("js/systems/session-state.js"),
]);

assert.deepEqual(D.validateGameData(), [], "catalog validation");
assert.deepEqual(T.validateTyping(), [], "typing validation");
assert.equal(D.FISH.length, 60, "fish count");
assert.equal(D.DINOS.length, 30, "dinosaur count");
assert.equal(D.ANIMALS.length, 40, "animal count");
assert.equal(D.FRIENDS.length, 30, "friend count");
assert.equal(Object.keys(L.FISH_INFO).length, 60, "fish learning coverage");
assert.equal(Object.keys(L.ANIMAL_INFO).length, 40, "animal learning coverage");
assert.deepEqual([...new Set(D.FISH.map((x) => x.rarity))].sort(), [1, 2, 3, 4, 5], "fish rarity bands");

const animalShape = (name) => D.ANIMALS.find((x) => x.name === name)?.shape;
for (const [name, shape] of [
  ["かば", "hippo"], ["さい", "rhino"], ["ぱんだ", "bear"], ["ひぐま", "bear"],
  ["こあら", "koala"], ["かんがるー", "kangaroo"], ["うさぎ", "rabbit"],
  ["りす", "squirrel"], ["らくだ", "camel"], ["もささうるす", "marine_reptile"],
  ["えらすもさうるす", "plesiosaur"],
]) assert.equal(animalShape(name), shape, `${name} semantic visual shape`);

{
  const signatures = [];
  for (let level = 1; level <= 20; level++) {
    const words = T.typingWords(level);
    assert.ok(words.length >= 4, `typing Lv${level} has too few entries`);
    signatures.push(JSON.stringify(words));
  }
  assert.equal(new Set(signatures).size, 20, "typing levels must have 20 distinct banks");
}

{
  const fresh = R.newSave(1, "QA");
  assert.equal(fresh.inventory.specialItems.wallpaper_0, 1);
  assert.equal(fresh.inventory.specialItems.floor_0, 1);
  valid(Save, fresh, "fresh save");

  const lv20 = R.clone(fresh);
  lv20.learning.math.unlocked = 20;
  lv20.learning.math.levels[20] = { stars: 3, plays: 1 };
  lv20.progression.stars = 3;
  valid(Save, lv20, "legacy Lv20 learning record");

  const old = R.clone(fresh);
  delete old.room.wallpaper;
  delete old.room.floor;
  delete old.inventory.specialItems.wallpaper_0;
  delete old.inventory.specialItems.floor_0;
  old.inventory.specialItems.legacy_keepsake = 1;
  valid(Save, old, "v1.3.2-style missing room surfaces and variable specialItems");
  const migrated = Save.migrateSave(old);
  assert.equal(migrated.room.wallpaper, "wallpaper_0");
  assert.equal(migrated.room.floor, "floor_0");
  assert.equal(migrated.inventory.specialItems.wallpaper_0, 1);
  assert.equal(migrated.inventory.specialItems.floor_0, 1);
  assert.equal(migrated.inventory.specialItems.legacy_keepsake, 1);
  valid(Save, migrated, "migrated v1.3.2-style save");
}

{
  const badQty = R.newSave(1, "QA");
  badQty.room.slots[4] = "furniture_0";
  assert.ok(Save.validateSaveData(badQty).includes("room quantity"), "room placed quantity must not exceed ownership");

  const badAppearance = R.newSave(1, "QA");
  badAppearance.player.appearance.hair = 99;
  assert.ok(Save.validateSaveData(badAppearance).some((x) => x.includes("appearance hair")), "appearance bounds guard");

  const badRod = R.newSave(1, "QA");
  badRod.fishing.equippedRod = "rod_9";
  assert.ok(Save.validateSaveData(badRod).includes("equipped rod"), "equipped rod ownership guard");

  const badPhoto = R.newSave(1, "QA");
  badPhoto.room.photos.push("memory_missing");
  assert.ok(Save.validateSaveData(badPhoto).includes("photo reference"), "photo memory reference guard");
}

{
  const s = R.newSave(1, "QA");
  s.progression.manabiRank = 10;
  s.progression.coins = 99999;
  const before = s.inventory.furniture.furniture_0;
  R.purchase(s, "furniture_0");
  assert.equal(s.inventory.furniture.furniture_0, before + 1, "furniture remains stackable");
  R.gift(s, "friend_haru", "furniture_0");
  assert.equal(s.inventory.furniture.furniture_0, before, "only spare copy is gifted while placed copy remains owned");
  assert.throws(() => R.requestFriend(s, "friend_missing"), /ともだち|しま/);
  assert.throws(() => R.fulfillRequest(s, "friend_missing"), /ともだち|しま/);
}

{
  const stale = R.newSave(1, "QA");
  stale.missions.date = "1900-01-01";
  stale.missions.completedToday = true;
  stale.missions.daily = [{ id: "study", name: "old", metric: "learning", target: 1, start: 0, claimed: true }];
  assert.throws(() => R.claimChest(stale, () => 0.7), /3つ/);
  assert.notEqual(stale.missions.date, "1900-01-01", "chest must refresh missions across midnight");
  assert.equal(stale.missions.completedToday, false, "midnight refresh reopens today's chest state");

  for (const rareRoll of [0.7, 0.95]) {
    const s = R.newSave(1, "QA");
    for (const item of D.ITEMS.filter((x) => x.type === "clothing")) s.inventory.clothing[item.id] = 1;
    const clothingBefore = structuredClone(s.inventory.clothing);
    R.refreshMissions(s);
    s.missions.daily.forEach((m) => (m.claimed = true));
    const seq = [rareRoll, 0.999999];
    const reward = R.claimChest(s, () => seq.shift() ?? 0);
    if (reward.item) assert.equal(reward.item.type, "furniture", "owned clothing must never be duplicated by chest");
    assert.deepEqual(s.inventory.clothing, clothingBefore, "all-owned clothing inventory must remain unchanged after chest claim");
  }
}

const makeRank10 = (s) => {
  let levelsNeeded = 25;
  for (const subject of D.SUBJECTS) {
    const bucket = s.learning[subject.id];
    const count = Math.min(subject.maxLevel, levelsNeeded);
    for (let i = 1; i <= count; i++)
      bucket.levels[i] = { stars: 3, plays: 1 };
    bucket.unlocked = Math.max(bucket.unlocked, count);
    levelsNeeded -= count;
    if (levelsNeeded === 0) break;
  }
  assert.equal(levelsNeeded, 0, "rank-10 setup must use real subject levels");
  R.evaluate(s);
  assert.equal(s.progression.manabiRank, 10, "rank-10 arena test setup");
};

{
  const land = D.ANIMALS.find((x) => x.category === "land");
  const ancient = D.ANIMALS.find((x) => x.category === "ancient");
  const fish = D.FISH[0];
  const dino = D.DINOS[0];
  assert.ok(R.arenaEligible("cup_0", land));
  assert.ok(R.arenaEligible("cup_5", fish));
  assert.ok(R.arenaEligible("cup_1", land));
  assert.equal(R.arenaEligible("cup_1", fish), false);
  assert.ok(R.arenaEligible("cup_2", dino));
  assert.equal(R.arenaEligible("cup_2", land), false);
  assert.ok(R.arenaEligible("cup_3", fish));
  assert.equal(R.arenaEligible("cup_3", land), false);
  assert.ok(R.arenaEligible("cup_4", ancient));
  assert.equal(R.arenaEligible("cup_4", fish), false);

  const s = R.newSave(1, "QA");
  s.collections.animals = [];
  s.fishing.fishBook = {};
  s.dinosaurs.fossilBook = {};
  s.dinosaurs.completedCount = 0;
  makeRank10(s);
  assert.deepEqual(s.arena.unlockedTournaments, [], "no creature means no tournament can unlock");

  s.collections.animals = [land.id];
  R.evaluate(s);
  assert.ok(s.arena.unlockedTournaments.includes("cup_1"), "land creature unlocks animal cup");
  assert.ok(s.arena.unlockedTournaments.includes("cup_0"), "land creature unlocks beginner cup");

  s.fishing.fishBook[fish.id] = { caught: true, count: 1, bestSize: 10 };
  R.evaluate(s);
  assert.ok(s.arena.unlockedTournaments.includes("cup_3"), "fish unlocks ocean cup");

  s.collections.animals.push(ancient.id);
  R.evaluate(s);
  assert.ok(s.arena.unlockedTournaments.includes("cup_4"), "ancient creature unlocks ancient cup");

  s.dinosaurs.completedCount = 10;
  s.dinosaurs.fossilBook[dino.id] = { parts: [...dino.parts], completed: true };
  R.evaluate(s);
  assert.ok(s.arena.unlockedTournaments.includes("cup_2"), "completed dinosaur unlocks dinosaur cup after restoration gate");

  const activeLegacy = R.newSave(1, "QA");
  activeLegacy.collections.animals = [];
  activeLegacy.arena.active = { cup: "cup_3", wins: 1, creature: fish.id };
  makeRank10(activeLegacy);
  assert.ok(activeLegacy.arena.unlockedTournaments.includes("cup_3"), "legacy in-progress cup stays unlocked");
}

{
  const transient = {
    companion: "friend_haru", noticeQueue: [1], arenaRound: {}, pendingImport: {}, roomFriend: "friend_haru",
    decorateSlot: 3, decorateItem: "furniture_0", creatorPage: 3, typingPage: 2, arenaCup: "cup_1",
    arenaCreature: "animal_1", arenaPickPage: 2, achievementPage: 2, giftFriend: "friend_haru", giftPage: 1,
    wardrobeCategory: "accessories", wardrobePage: 2, displayCategory: "dino", displayPage: 2,
    walkPath: [1], walkDestination: {}, nearDoor: "school", activity: {}, modalOpen: true, page: 3,
    category: "fish", memoryPage: 2, shopCategory: "furniture", shopPage: 2, walkOverview: true,
    editing: true, draft: {}, newSlot: 2, deferredToast: "x", toastShownAt: 123, walkKeys: new Set(["w"]),
  };
  Session.resetTransientState(transient);
  assert.equal(transient.decorateItem, null);
  assert.equal(transient.creatorPage, 0);
  assert.equal(transient.arenaCup, null);
  assert.equal(transient.arenaCreature, null);
  assert.equal(transient.wardrobeCategory, "clothing");
  assert.equal(transient.displayCategory, "fish");
  assert.equal(transient.deferredToast, null);
  assert.equal(transient.walkKeys.size, 0);
}

{
  const fish = D.FISH.find((x) => x.id === "fish_37");
  assert.ok(fish);
  const svg = U.atlasSvg({ source: "x.png", x: 10, y: 20, w: 30, h: 40, width: 100, height: 200 }, fish.name);
  assert.ok(svg.includes('viewBox="10 20 30 40"'));
  assert.ok(svg.includes('<image href="x.png"'));
}

console.log("PASS: Obecolle2 v1.4.0 comprehensive static/data verifier");
