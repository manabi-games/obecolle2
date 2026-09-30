import { writeFileSync } from "node:fs";
import { newSave, clone } from "../js/systems/rules.js";
import { ACTIVE_FRIENDS, FACILITIES, ITEMS } from "../js/data/catalog.js";
import { validateSaveData } from "../js/core/save.js";

const save = newSave(2, "てすと");
save.progression.coins = 9999;
save.progression.manabiRank = 10;
save.progression.unlockedFacilities = FACILITIES.map((row) => row.id);
save.friends[ACTIVE_FRIENDS[1].id] = clone(save.friends[ACTIVE_FRIENDS[0].id]);
for (const item of ITEMS) {
  if (item.type === "clothing" && item.id !== "clothing_1") save.inventory.clothing[item.id] = 2;
  if (item.type === "accessories" && item.id !== "hat_0") save.inventory.accessories[item.id] = 2;
  if (item.type === "furniture") save.inventory.furniture[item.id] = 2;
  if (["wallpaper", "floor"].includes(item.type)) save.inventory.specialItems[item.id] = 1;
}
const errors = validateSaveData(save);
if (errors.length) throw Error(errors.join(" / "));
const path = new URL("../docs/qa/v1.12/qa-save.json", import.meta.url);
writeFileSync(path, JSON.stringify(save, null, 2));
console.log(path.pathname);
