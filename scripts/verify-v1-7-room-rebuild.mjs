import assert from "node:assert/strict";
import fs from "node:fs";

assert.equal(fs.readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim(), "1.7.0");
const main = fs.readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
const world = fs.readFileSync(new URL("../js/three/world.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../css/game.css", import.meta.url), "utf8");
const session = fs.readFileSync(new URL("../js/systems/session-state.js", import.meta.url), "utf8");

assert.ok(main.includes("Version 1.7.0"));
assert.ok(main.includes("mansion(page = 0)"));
assert.ok(main.includes('case "mansionpage"'));
assert.ok(main.includes("decorate(slot = null, page = 0)"));
assert.ok(main.includes('case "decorateslot"'));
assert.ok(main.includes('case "decoratepage"'));
assert.ok(main.includes('case "placeitem"'));
assert.ok(main.includes("async placeItem(slot, id)"));
assert.equal(main.includes("これくしょんを かざる</button>"), false);
assert.equal(main.includes('data-a="clearroom"'), false);
assert.equal(main.includes('data-a="pickfurniture:'), false);
assert.ok(main.includes("Math.ceil(rows.length / 6)"));
assert.ok(main.includes("おくった かぐは おへやに じどうで かざられるよ。"));
assert.ok(main.includes("これくしょんを かざる そうさは いったん おやすみ"));

assert.equal(world.includes("s.room.aquariumFish.slice"), false);
assert.equal(world.includes("s.room.dinosaurFigures.slice"), false);
assert.equal(world.includes("s.room.trophies"), false);
assert.equal(world.includes("s.room.photos.slice"), false);
assert.ok(world.includes("friendWalls"));
assert.ok(world.includes("if (!friendId)"));

assert.ok(session.includes("target.decoratePage = 0"));
assert.ok(session.includes("target.mansionPage = 0"));
assert.ok(css.includes("/* v1.7 room rebuild"));
assert.ok(css.includes(".room-location-grid"));
assert.ok(css.includes(".room-item-grid"));
assert.ok(css.includes(".furniture-picker,"));
assert.ok(css.includes("display: none !important"));
console.log("PASS: Obecolle2 v1.7 room rebuild verifier");
