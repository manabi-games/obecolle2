import { newSave, clone } from "../systems/rules.js";
import {
  SUBJECTS,
  FRIENDS,
  FISH,
  DINOS,
  ITEMS,
  CREATURES,
  FACILITIES,
  TOURNAMENTS,
  ANIMALS,
  ACHIEVEMENTS,
} from "../data/catalog.js";
const object = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const integer = (n, max = 1e9) => Number.isSafeInteger(n) && n >= 0 && n <= max;
export function validateSaveData(s) {
  const errors = [];
  if (!object(s)) return ["せーぶの かたちが ちがうよ"];
  if (s.saveVersion !== 1) errors.push("たいおうしていないsaveVersion");
  if (s.gameVersion !== "1.0.0") errors.push("たいおうしていないgameVersion");
  const shape = (a, t, path) => {
    for (const [k, v] of Object.entries(t)) {
      const x = a?.[k],
        p = path + "." + k;
      if (Array.isArray(v)) {
        if (!Array.isArray(x)) errors.push(p + " must be array");
      } else if (object(v)) {
        if (!object(x)) errors.push(p + " must be object");
        else if (p !== "save.room.slots") shape(x, v, p);
      } else if (v !== null && typeof x !== typeof v) errors.push(p + " type");
    }
  };
  shape(s, newSave(1), "save");
  if (errors.length) return errors;
  const refs = (ids, rows, label) => {
    for (const id of ids)
      if (!rows.some((x) => x.id === id))
        errors.push(label + ": invalid reference " + id);
  };
  if (!integer(s.meta.slotId, 3) || s.meta.slotId < 1) errors.push("slotId");
  if (!s.player.name.trim() || [...s.player.name].length > 8)
    errors.push("name");
  for (const k of ["stars", "coins", "tickets"])
    if (!integer(s.progression[k])) errors.push(k);
  if (!integer(s.progression.manabiRank, 10) || s.progression.manabiRank < 1)
    errors.push("rank");
  let stars = 0;
  for (const sub of SUBJECTS) {
    const b = s.learning[sub.id];
    if (!integer(b.unlocked, 20) || b.unlocked < 1)
      errors.push("learning unlocked");
    for (const [lv, x] of Object.entries(b.levels)) {
      if (
        !/^(?:[1-9]|1[0-9]|20)$/.test(lv) ||
        !object(x) ||
        !integer(x.stars, 3) ||
        !integer(x.plays)
      )
        errors.push("learning record");
      else stars += x.stars;
    }
  }
  if (stars !== s.progression.stars) errors.push("star total mismatch");
  for (const [key, val] of Object.entries(s.typing))
    if (
      typeof val === "number" &&
      (!Number.isFinite(val) || val < 0 || val > 1e9)
    )
      errors.push("typing " + key);
  if (!integer(s.typing.level, 20) || s.typing.level < 1)
    errors.push("typing level");
  if (s.typing.completedLevels.some((x) => !integer(x, 20) || x < 1))
    errors.push("typing completedLevels");
  refs(Object.keys(s.friends), FRIENDS, "friends");
  for (const f of Object.values(s.friends)) {
    if (
      !object(f) ||
      !integer(f.affinity, 100) ||
      !object(f.needs) ||
      !Array.isArray(f.gifts) ||
      !object(f.relationships)
    ) {
      errors.push("friend shape");
      continue;
    }
    for (const n of Object.values(f.needs))
      if (!Number.isFinite(n) || n < 0 || n > 100) errors.push("friend needs");
    refs(f.gifts, ITEMS, "gift");
    if (
      f.request !== null &&
      (!object(f.request) ||
        typeof f.request.metric !== "string" ||
        !integer(f.request.start) ||
        !integer(f.request.target, 10))
    )
      errors.push("request");
  }
  refs(Object.keys(s.fishing.fishBook), FISH, "fish");
  for (const b of Object.values(s.fishing.fishBook))
    if (
      !object(b) ||
      b.caught !== true ||
      !integer(b.count) ||
      typeof b.biggest !== "number" ||
      !Number.isFinite(b.biggest) ||
      b.biggest <= 0
    )
      errors.push("fish record");
  refs(s.room.aquariumFish, FISH, "aquarium");
  if (
    s.room.aquariumFish.some((id) => !s.fishing.fishBook[id]) ||
    s.room.aquariumFish.length > 5
  )
    errors.push("aquarium ownership");
  refs(Object.keys(s.dinosaurs.fossilBook), DINOS, "dinosaur");
  let completed = 0;
  for (const [id, b] of Object.entries(s.dinosaurs.fossilBook)) {
    const d = DINOS.find((x) => x.id === id);
    if (
      !object(b) ||
      !Array.isArray(b.parts) ||
      typeof b.completed !== "boolean"
    ) {
      errors.push("fossil record");
      continue;
    }
    if (
      !d ||
      b.parts.some((p) => !d.parts.includes(p)) ||
      new Set(b.parts).size !== b.parts.length
    )
      errors.push("fossil parts");
    if (b.completed) {
      completed++;
      if (b.parts.length !== 4) errors.push("incomplete restoration");
    }
  }
  if (completed !== s.dinosaurs.completedCount) errors.push("completed count");
  for (const section of ["furniture", "clothing", "accessories"]) {
    refs(Object.keys(s.inventory[section]), ITEMS, "inventory");
    for (const n of Object.values(s.inventory[section]))
      if (!integer(n)) errors.push("inventory quantity");
  }
  refs(Object.values(s.room.slots), ITEMS, "room item");
  for (const id of Object.values(s.room.slots))
    if (!s.inventory.furniture[id]) errors.push("room ownership");
  refs(s.room.dinosaurFigures, DINOS, "figures");
  refs(s.collections.animals, ANIMALS, "animals");
  refs(s.progression.unlockedFacilities, FACILITIES, "facility");
  refs(s.arena.clearedTournaments, TOURNAMENTS, "cup");
  refs(Object.keys(s.arena.cards), CREATURES, "card");
  refs(Object.keys(s.achievements), ACHIEVEMENTS, "achievement");
  for (const [key, trip, max, pattern] of [
    ["fish", s.fishing.trip, 3, /^water_[0-6]$/],
    ["dig", s.dinosaurs.trip, 4, /^dig_[0-5]$/],
  ])
    if (
      trip !== null &&
      (!object(trip) ||
        !pattern.test(trip.area) ||
        !integer(trip.remaining, max) ||
        trip.remaining < 1)
    )
      errors.push(key + " trip");
  if (
    s.arena.active !== null &&
    (!object(s.arena.active) ||
      !TOURNAMENTS.some((x) => x.id === s.arena.active.cup) ||
      !integer(s.arena.active.wins, 2))
  )
    errors.push("arena active");
  for (const m of s.memories)
    if (
      !object(m) ||
      typeof m.id !== "string" ||
      typeof m.title !== "string" ||
      !Array.isArray(m.friendIds)
    )
      errors.push("memory");
  for (const m of s.missions.daily)
    if (
      !object(m) ||
      typeof m.name !== "string" ||
      !integer(m.start) ||
      !integer(m.target) ||
      typeof m.claimed !== "boolean"
    )
      errors.push("mission");
  for (const k of ["music", "sound"])
    if (
      !Number.isFinite(s.settings[k]) ||
      s.settings[k] < 0 ||
      s.settings[k] > 1
    )
      errors.push("volume");
  const safeId = /^[a-z][a-z0-9_]*$/;
  for (const k of Object.keys(s.inventory.specialItems))
    if (!safeId.test(k) || !integer(s.inventory.specialItems[k]))
      errors.push("special item");
  for (const k of Object.keys(s.room.slots))
    if (!/^[0-5]$/.test(k)) errors.push("room slot");
  for (const [k, n] of Object.entries(s.progression.metrics))
    if (!safeId.test(k) || !integer(n)) errors.push("metric");
  for (const [k, v] of Object.entries(s.typing.modes))
    if (
      !["basic", "challenge", "rescue", "escape", "battle"].includes(k) ||
      !object(v) ||
      !integer(v.plays) ||
      !integer(v.bestScore, 100)
    )
      errors.push("typing mode");
  for (const m of s.memories)
    if (!/^memory_[0-9]+_[0-9]+$/.test(m.id) || m.title.length > 200)
      errors.push("memory id/title");
  const inspect = (x, depth = 0) => {
    if (depth > 30) {
      errors.push("nesting depth");
      return;
    }
    if (typeof x === "string" && (x.length > 2000 || /[<>]/.test(x)))
      errors.push("invalid text");
    if (x && typeof x === "object")
      for (const [k, v] of Object.entries(x)) {
        if (["__proto__", "constructor", "prototype"].includes(k))
          errors.push("unsafe key");
        inspect(v, depth + 1);
      }
  };
  inspect(s);
  return errors;
}
export function migrateSave(data) {
  const errors = validateSaveData(data);
  if (errors.length)
    throw Error("せーぶを よめなかったよ：" + errors.slice(0, 3).join(" / "));
  const migrated = clone(data);
  let completedCount = 0;
  for (const d of DINOS) {
    const book = migrated.dinosaurs.fossilBook[d.id];
    if (!book) continue;
    const hasAllLegacyParts = d.parts.every((part) => book.parts.includes(part));
    if (!book.completed && hasAllLegacyParts) {
      book.completed = true;
      book.completedAt = migrated.meta.updatedAt || new Date().toISOString();
    }
    if (book.completed) {
      completedCount++;
      book.completedAt ||= migrated.meta.updatedAt || new Date().toISOString();
      migrated.inventory.specialItems["figure_" + d.id] = 1;
    }
  }
  migrated.dinosaurs.completedCount = completedCount;
  return migrated;
}
export function checksum(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
export function pack(data) {
  const text = JSON.stringify(data);
  return { text, checksum: checksum(text) };
}
export function unpack(record) {
  if (
    !record ||
    typeof record.text !== "string" ||
    checksum(record.text) !== record.checksum
  )
    throw Error("せーぶが こわれているよ");
  return migrateSave(JSON.parse(record.text));
}
export class SaveManager {
  constructor() {
    this.queue = Promise.resolve();
  }
  async init() {
    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("obecolle2_saves", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("slots");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  read(slot) {
    return new Promise((resolve, reject) => {
      const r = this.db.transaction("slots").objectStore("slots").get(slot);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async load(slot) {
    const record = await this.read(slot);
    if (!record) return null;
    try {
      return { data: unpack(record.current), recovered: false };
    } catch {
      try {
        return { data: unpack(record.previous), recovered: true };
      } catch {
        throw Error(
          "せーぶを よめなかったよ。おとなのひとと ばっくあっぷを もどしてね。",
        );
      }
    }
  }
  save(data) {
    const snapshot = clone(data);
    snapshot.meta.updatedAt = new Date().toISOString();
    const errors = validateSaveData(snapshot);
    if (errors.length)
      return Promise.reject(
        Error("ほぞんが できなかったよ：" + errors.slice(0, 3).join(" / ")),
      );
    const task = () =>
      new Promise((resolve, reject) => {
        const tx = this.db.transaction("slots", "readwrite"),
          store = tx.objectStore("slots"),
          r = store.get(snapshot.meta.slotId);
        r.onsuccess = () => {
          const old = r.result;
          let previous;
          try {
            unpack(old?.current);
            previous = old.current;
          } catch {
            previous = old?.previous || pack(snapshot);
          }
          store.put(
            { current: pack(snapshot), previous },
            snapshot.meta.slotId,
          );
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () =>
          reject(tx.error || Error("ほぞんが とまってしまったよ"));
      });
    this.queue = this.queue.catch(() => {}).then(task);
    return this.queue;
  }
  async import(text, slot) {
    if (text.length > 8e6) throw Error("ばっくあっぷが おおきすぎるよ");
    const data = migrateSave(JSON.parse(text));
    data.meta.slotId = slot;
    await this.save(data);
    return data;
  }
  export(data) {
    const now = new Date(),
      pad = (n) => String(n).padStart(2, "0");
    const name = `obecolle2_save_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
    const a = document.createElement("a"),
      url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return name;
  }
}
