import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ITEMS, TOWN_DECOR, ACTIVE_FRIENDS } from '../js/data/catalog.js';
import { newSave } from '../js/systems/rules.js';
import { validateSaveData } from '../js/core/save.js';
import { itemArt, townArt } from '../js/ui-visuals.js';
import { appearancePortrait, itemPreview } from '../js/ui-child.js';

const type = (x) => ITEMS.filter((item) => item.type === x && !item.rewardOnly);
assert.equal(type('clothing').length, 40);
assert.equal(type('furniture').length, 60);
assert.equal(ITEMS.filter((item) => item.id.startsWith('hat_')).length, 20);
assert.equal(ACTIVE_FRIENDS.length, 10);
assert.ok(new Set(type('clothing').map((item) => item.visual)).size >= 20);
assert.ok(new Set(ITEMS.filter((item) => item.id.startsWith('hat_')).map((item) => item.visual)).size >= 15);
for (const item of ITEMS.filter((x) => ['clothing', 'furniture', 'accessories'].includes(x.type))) {
  assert.match(itemArt(item), /^<svg/);
  assert.match(itemPreview(item), /toy-preview/);
  assert.ok(!/[🛋️🪑🛏️📚💻]/u.test(itemPreview(item)), item.id);
}
for (const decor of TOWN_DECOR) assert.match(townArt(decor), /^<svg/);
assert.match(appearancePortrait({outfit:'clothing_1',hat:'hat_3'}), /costume-baseball/);
assert.match(appearancePortrait({outfit:'clothing_1',hat:'hat_3'}), /hat-crown/);
assert.deepEqual(validateSaveData(newSave(1)), []);
const dojoSave = newSave(1);
dojoSave.inventory.accessories.dojo_reward_10 = 1;
dojoSave.player.appearance.hat = 'dojo_reward_10';
assert.deepEqual(validateSaveData(dojoSave), [], 'dojo headband must remain wearable after saving');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/game.css', import.meta.url), 'utf8');
assert.match(main, /D\.ACTIVE_FRIENDS\.map\(\(friend\)/);
assert.match(main, /compact-item-panel/);
assert.match(main, /compact-room-panel/);
assert.match(css, /\.panel\.child-grid-panel\.compact-school-panel/);
assert.match(css, /\.mansion-unit\.waiting-room/);
console.log('PASS v1.11 visual assets, room previews, compact screens and save compatibility');
