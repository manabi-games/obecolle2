import assert from "node:assert/strict";
import fs from "node:fs";
import * as D from "../js/data/catalog.js";
import * as R from "../js/systems/rules.js";
import { TypingEngine, dojoWords, validateTyping } from "../js/systems/typing.js";

assert.equal(fs.readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim(), "1.9.0");
assert.equal(dojoWords().length, 30);
assert.equal(new Set(dojoWords()).size, 30);
for (const word of dojoWords()) assert.doesNotThrow(() => new TypingEngine(word));
assert.deepEqual(validateTyping(), []);

const s = R.newSave(1, "てすと");
const template = () => ({ affinity: 10, needs: { mood: 70, hunger: 20, energy: 80, curiosity: 50, social: 50 }, gifts: [], relationships: {}, request: null });
for (const f of D.ACTIVE_FRIENDS.slice(0, 6)) s.friends[f.id] ||= template();
for (const f of D.ACTIVE_FRIENDS.slice(0, 6)) assert.doesNotThrow(() => R.requestFriend(s, f.id));
assert.equal(Object.values(s.friends).filter((x) => x.request).length, 6, "requests must not globally lock at three");

const main = fs.readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
const games = fs.readFileSync(new URL("../js/games.js", import.meta.url), "utf8");
const rules = fs.readFileSync(new URL("../js/systems/rules.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../css/game.css", import.meta.url), "utf8");
assert.ok(main.includes("Version 1.9.0"));
assert.ok(main.includes("typingDojo()"));
assert.ok(main.includes('case "dojostart"'));
assert.ok(main.includes("いまの おねがいは"));
assert.ok(games.includes("startDojo(dojoType"));
assert.ok(games.includes("finishDojoGame()"));
assert.ok(games.includes("dojo_${type}_best_ms"));
assert.ok(games.includes("dojo_60_best_chars"));
assert.ok(games.includes("しんきろく！"));
assert.equal(rules.includes("まず いまの おねがいを かなえてあげよう"), false);
assert.ok(css.includes("/* v1.9 dojo"));
assert.ok(css.includes("body.island-interactive #toast"));
assert.ok(css.includes(".dojo-mode-grid"));
assert.ok(css.includes(".dojo-play-panel"));
console.log("PASS: Obecolle2 v1.9 request + typing dojo verifier");
