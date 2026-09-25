import assert from "node:assert/strict";
import fs from "node:fs";
import * as D from "../js/data/catalog.js";
import * as R from "../js/systems/rules.js";

assert.equal(fs.readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim(), "1.8.0");
assert.equal(D.TOWN_DECOR.length, 8);
assert.equal(new Set(D.TOWN_DECOR.map((x) => x.id)).size, 8);
assert.ok(D.TOWN_DECOR.every((x) => x.id.startsWith("town_") && x.price > 0 && x.rank >= 1 && x.rank <= 10));

const s = R.newSave(1, "てすと");
const friend = s.friends.friend_haru;
assert.ok(friend);
R.gift(s, "friend_haru", "clothing_0");
assert.ok(friend.gifts.includes("clothing_0"));
assert.equal(s.inventory.clothing.clothing_0, 1, "wearable present must not delete player's owned outfit");
assert.throws(() => R.gift(s, "friend_haru", "clothing_0"));
const beforeFurniture = s.inventory.furniture.furniture_1;
R.gift(s, "friend_haru", "furniture_1");
assert.equal(s.inventory.furniture.furniture_1, beforeFurniture - 1);

const main = fs.readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
const world = fs.readFileSync(new URL("../js/three/world.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../css/game.css", import.meta.url), "utf8");
const session = fs.readFileSync(new URL("../js/systems/session-state.js", import.meta.url), "utf8");

assert.ok(main.includes("Version 1.8.0"));
assert.ok(main.includes("const speed = (6.2 * dt)"));
assert.ok(main.includes("async collectTreasure(index)"));
assert.ok(main.includes('case "treasure"'));
assert.ok(main.includes('["town", "まちのかざり"]'));
assert.ok(main.includes('pageSize = 8'));
assert.ok(main.includes("ふくや ぼうしは そのこが みにつけるよ"));
assert.ok(main.includes("おくった かぐは おへやに じどうで かざられるよ。"));
assert.ok(main.includes("decorate(slot = null, page = 0)"));
assert.ok(world.includes("TOWN_DECOR"));
assert.ok(world.includes("friendAppearance(friend, state)"));
assert.ok(world.includes('`treasure:${i}`'));
assert.ok(world.includes("townDecoration(item)"));
assert.ok(world.includes("furnitureGifts"));
assert.ok(world.includes("hideAction(id)"));
assert.ok(session.includes("target.collectingTreasure = false"));
assert.ok(css.includes("/* v1.8 town loop"));
assert.ok(css.includes("grid-template-columns: repeat(4"));
assert.ok(css.includes(".town-decor-preview"));
console.log("PASS: Obecolle2 v1.8 town-loop verifier");
