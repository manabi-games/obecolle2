import assert from "node:assert/strict";
import fs from "node:fs";
import * as D from "../js/data/catalog.js";
import * as R from "../js/systems/rules.js";
import { question } from "../js/systems/learning.js";
import { artLayout } from "../js/data/art-layout.js";

assert.equal(fs.readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim(), "1.6.0");
assert.deepEqual(D.CORE_SUBJECT_IDS, ["math", "japanese", "english"]);
assert.equal(D.ACTIVE_FRIENDS.length, 10);
assert.equal(D.DINOS.length, 30);
for (const friend of D.ACTIVE_FRIENDS) {
  assert.ok(friend.lines.length >= 6, `${friend.id} must have rich dialogue`);
  assert.ok(D.CORE_SUBJECT_IDS.includes(friend.strongSubject), `${friend.id} hidden-subject quiz route`);
}
for (let level = 1; level <= 8; level++) {
  const q = question("english", level, level - 1);
  assert.equal(q.optionSpeak, true);
  assert.equal(q.speak, undefined);
  assert.equal(q.speakLang, "en-US");
  assert.equal(q.options.length, 4);
  assert.ok(q.options.includes(q.answer));
}
for (const dino of D.DINOS) {
  const a = artLayout(dino.id);
  assert.ok(a.w > 200 && a.h > 150, `${dino.id} crop too small`);
  assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.w <= a.width && a.y + a.h <= a.height);
}
const s = R.newSave(1, "てすと");
for (const id of D.CORE_SUBJECT_IDS) {
  const sub = D.SUBJECTS.find((x) => x.id === id);
  s.learning[id].levels[sub.maxLevel] = { stars: 1, plays: 1 };
}
const requirements = R.masterRequirements(s);
assert.ok(requirements.some(([name, ok]) => name.includes("がくしゅう") && ok));

const main = fs.readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
const games = fs.readFileSync(new URL("../js/games.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../css/game.css", import.meta.url), "utf8");
const ui = fs.readFileSync(new URL("../js/ui-child.js", import.meta.url), "utf8");
assert.ok(main.includes("Version 1.6.0"));
assert.ok(main.includes("D.CORE_SUBJECT_IDS.includes"));
assert.ok(main.includes('case "speakoption"'));
assert.ok(main.includes('case "friendmore"'));
assert.ok(main.includes('case "levelpage"'));
assert.ok(main.includes('Math.ceil(rows.length / 6)'));
assert.ok(main.includes('pages > 1 ? this.pagination(page, pages, "shoppage") : ""'));
assert.ok(games.includes('class="answer-sound"'));
assert.ok(games.includes("speakOption(index)"));
assert.ok(games.includes('class="excavation-board"'));
assert.ok(games.includes('document.querySelectorAll(".rock-piece")'));
assert.ok(ui.includes("clothing-shape-${shape}"));
assert.ok(ui.includes("hat-shape-${shape}"));
assert.ok(css.includes("/* v1.6 vertical slice"));
assert.ok(css.includes("@media (max-height: 700px)"));
assert.ok(css.includes("overflow: hidden !important"));
console.log("PASS: Obecolle2 v1.6 vertical-slice verifier");
