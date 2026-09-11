import {
  SUBJECTS,
  FRIENDS,
  FISH,
  DINOS,
  ANIMALS,
  ITEMS,
  FACILITIES,
  FISH_AREAS,
  DIG_AREAS,
  TOURNAMENTS,
  RANKS,
  MISSIONS,
  ACHIEVEMENTS,
  RODS,
  itemRequirement,
} from "../data/catalog.js";
export const clone = (x) => structuredClone(x);
export const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function newSave(slotId, name = "なまえ", appearance = {}) {
  return {
    saveVersion: 1,
    gameVersion: "1.0.0",
    meta: {
      slotId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      playCount: 1,
    },
    player: {
      name,
      appearance: {
        skin: 0,
        hair: 0,
        hairColor: 0,
        eyes: 0,
        brows: 0,
        mouth: 0,
        face: 0,
        outfit: "clothing_0",
        ...appearance,
      },
      badges: [],
    },
    progression: {
      manabiRank: 1,
      stars: 0,
      coins: 60,
      tickets: 3,
      unlockedFacilities: ["mansion", "school", "plaza"],
      storyFlags: {},
      metrics: {},
    },
    learning: Object.fromEntries(
      SUBJECTS.map((s) => [s.id, { unlocked: 1, levels: {} }]),
    ),
    typing: {
      level: 1,
      totalChars: 0,
      totalCorrect: 0,
      totalMisses: 0,
      bestSpeed: 0,
      bestAccuracy: 0,
      bestCombo: 0,
      personalBestCount: 0,
      buddyPower: 0,
      modes: {},
      completedLevels: [],
    },
    friends: {
      friend_haru: {
        affinity: 20,
        needs: { mood: 70, hunger: 20, energy: 80, curiosity: 50, social: 50 },
        gifts: [],
        relationships: {},
        request: null,
      },
    },
    fishing: {
      unlockedAreas: ["water_0"],
      ownedRods: ["rod_0"],
      equippedRod: "rod_0",
      fishBook: {},
      aquarium: [],
      totalCatches: 0,
      pity: {},
      trip: null,
    },
    dinosaurs: {
      unlockedAreas: ["dig_0"],
      tools: ["tool_0"],
      equippedTool: "tool_0",
      fossilBook: {},
      completedCount: 0,
      pity: 0,
      trip: null,
    },
    arena: {
      unlockedTournaments: [],
      clearedTournaments: [],
      winsByCreature: {},
      cards: {},
      shinyCards: [],
      active: null,
    },
    inventory: {
      furniture: {
        furniture_0: 1,
        furniture_1: 1,
        furniture_3: 1,
        furniture_4: 1,
        furniture_8: 1,
      },
      clothing: { clothing_0: 1 },
      accessories: {},
      specialItems: {},
    },
    room: {
      wallpaper: "wallpaper_0",
      floor: "floor_0",
      slots: {
        0: "furniture_4",
        1: "furniture_3",
        2: "furniture_8",
        3: "furniture_0",
      },
      aquariumFish: [],
      dinosaurFigures: [],
      trophies: [],
      photos: [],
    },
    collections: { animals: ["animal_1", "animal_3", "animal_8"] },
    missions: { date: "", daily: [], completedToday: false },
    achievements: {},
    memories: [],
    settings: { music: 0.25, sound: 0.5, quality: "standard", keyboard: true },
  };
}
const count = (o) => Object.keys(o).length;
export function remember(s, type, title, subjectId = "", friendIds = []) {
  s.memories.push({
    id: "memory_" + Date.now() + "_" + s.memories.length,
    type,
    date: new Date().toISOString(),
    title,
    friendIds,
    backgroundId: type,
    poseIds: ["happy"],
    subjectId,
    favorite: false,
  });
}
export function metric(s, name, n = 1) {
  s.progression.metrics[name] = (s.progression.metrics[name] || 0) + n;
}
export function refreshMissions(s) {
  const date = localDate();
  if (s.missions.date === date) return;
  const choices = MISSIONS.filter(
    (m) =>
      m.rank <= s.progression.manabiRank && !["study", "talk"].includes(m.id),
  );
  const hash = [...date].reduce((v, c) => v + c.charCodeAt(0), 0);
  s.missions = {
    date,
    daily: [MISSIONS[0], MISSIONS[1], choices[hash % choices.length]].map(
      (m) => ({
        ...m,
        start: s.progression.metrics[m.metric] || 0,
        claimed: false,
      }),
    ),
    completedToday: false,
  };
}
export function evaluate(s) {
  const notices = [];
  const p = s.progression;
  for (const sub of SUBJECTS) {
    // Version 1 records (including levels 11–20) keep their earned stars.
    // Existing level 10 clears also earn the newly moved completion keepsake.
    if (s.learning[sub.id].levels[sub.maxLevel]?.stars > 0)
      s.inventory.specialItems["subject_" + sub.id] = 1;
  }
  for (const mission of s.missions.daily) {
    const definition = MISSIONS.find((m) => m.id === mission.id);
    if (definition) mission.name = definition.name;
  }
  p.stars = SUBJECTS.reduce(
    (sum, sub) =>
      sum +
      Object.values(s.learning[sub.id].levels).reduce((a, l) => a + l.stars, 0),
    0,
  );
  const rank = RANKS.filter((n) => p.stars >= n).length;
  if (rank > p.manabiRank) {
    p.manabiRank = rank;
    remember(s, "rank", "まなびらんく " + rank + "！");
    notices.push("まなびらんく " + rank + "！");
  }
  p.unlockedFacilities = FACILITIES.filter((f) => rank >= f.rank).map(
    (f) => f.id,
  );
  s.fishing.unlockedAreas = FISH_AREAS.filter(
    (a) => rank >= a.rank && count(s.fishing.fishBook) >= a.species,
  ).map((a) => a.id);
  s.dinosaurs.unlockedAreas = DIG_AREAS.filter(
    (a) =>
      rank >= a.rank &&
      s.dinosaurs.completedCount >= a.completed &&
      (s.dinosaurs.completedCount > 0 || a.id === "dig_0"),
  ).map((a) => a.id);
  s.arena.unlockedTournaments = TOURNAMENTS.filter(
    (a, i) => rank >= a.rank && (i !== 2 || s.dinosaurs.completedCount >= 10),
  ).map((a) => a.id);
  for (const friend of FRIENDS) {
    if (s.friends[friend.id]) continue;
    const ok =
      friend.route === "typing"
        ? s.typing.buddyPower >= friend.threshold
        : friend.route === "learning"
          ? p.stars >= friend.threshold
          : friend.route === "fish"
            ? count(s.fishing.fishBook) >= friend.threshold
            : friend.route === "dinosaur"
              ? s.dinosaurs.completedCount >= friend.threshold
              : friend.route === "arena"
                ? s.arena.clearedTournaments.length >= friend.threshold
                : friend.id === "friend_28"
                  ? s.learning.english.levels[20]?.stars > 0
                  : friend.id === "friend_29"
                    ? Object.values(s.friends).some((f) => f.affinity >= 95)
                    : friend.id === "friend_30"
                      ? rank >= 10
                      : false;
    if (ok) {
      s.friends[friend.id] = {
        affinity: 0,
        needs: { mood: 70, hunger: 20, energy: 80, curiosity: 50, social: 50 },
        gifts: [],
        relationships: {},
        request: null,
      };
      remember(s, "arrival", friend.name + "が やってきた！", friend.id, [
        friend.id,
      ]);
      notices.push(friend.name + "がしまにやってきた！");
    }
  }
  const friends = count(s.friends);
  for (const milestone of [6, 11, 21])
    if (friends >= milestone && !p.storyFlags["mansion_" + milestone]) {
      p.storyFlags["mansion_" + milestone] = true;
      remember(s, "mansion", "まんしょんがおおきくなった！");
      notices.push("まんしょんがおおきくなった！");
    }
  for (const a of ACHIEVEMENTS)
    if (!s.achievements[a.id] && (p.metrics[a.metric] || 0) >= a.target) {
      s.achievements[a.id] = true;
      p.coins += a.coins;
      notices.push("できたこと：" + a.name);
      if (a.target >= 20) s.inventory.specialItems["trophy_" + a.id] = 1;
    }
  for (const [n, id] of [
    [5, "aquarium_small"],
    [20, "aquarium_medium"],
    [30, "aquarium_large"],
    [50, "aquarium_special"],
    [60, "fish_master"],
  ])
    if (count(s.fishing.fishBook) >= n && !s.inventory.specialItems[id]) {
      s.inventory.specialItems[id] = 1;
      notices.push(
        id === "fish_master"
          ? "さかなますたー！"
          : "すいそうがつかえるようになったよ！",
      );
      remember(s, "collection", "さかな " + n + "しゅるい！");
    }
  if (s.dinosaurs.completedCount === 30)
    s.inventory.specialItems.dinosaur_master = 1;
  if (s.typing.completedLevels.includes(20))
    s.inventory.specialItems.typing_master = 1;
  for (const [key, id] of [
    ["fish_master", "reward_fish"],
    ["dinosaur_master", "reward_dinosaur"],
    ["typing_master", "reward_typing"],
    ["arena_master", "reward_arena"],
  ])
    if (s.inventory.specialItems[key]) s.inventory.clothing[id] = 1;
  for (let i = 0; i < ANIMALS.length; i++) {
    const id = ANIMALS[i].id,
      level = Math.ceil((i + 1) / 2);
    if (
      s.learning.animals.levels[level]?.stars &&
      !s.collections.animals.includes(id)
    )
      s.collections.animals.push(id);
  }
  refreshMissions(s);
  for (const m of s.missions.daily)
    if (!m.claimed && (p.metrics[m.metric] || 0) - m.start >= m.target) {
      m.claimed = true;
      p.coins += 10;
      notices.push("みっしょんできた！ +10こいん");
    }
  if (!p.storyFlags.master && masterReady(s)) {
    p.storyFlags.masterReady = true;
    notices.push("まんなかひろばで まなびあいらんどかんせいいべんと！");
  }
  return notices;
}
export function masterRequirements(s) {
  return [
    ["まなびらんく10", s.progression.manabiRank >= 10],
    ["ともだち30にん", count(s.friends) === 30],
    ["さかな60しゅるい", count(s.fishing.fishBook) === 60],
    ["きょうりゅう30しゅるいふくげん", s.dinosaurs.completedCount === 30],
    [
      "ぜんぶの がくしゅうを くりあ",
      SUBJECTS.every((x) => s.learning[x.id].levels[x.maxLevel]?.stars > 0),
    ],
    ["たいぴんぐLv20", s.typing.completedLevels.includes(20)],
    ["ますたーはいゆうしょう", s.arena.clearedTournaments.includes("cup_5")],
  ];
}
export const masterReady = (s) => masterRequirements(s).every((x) => x[1]);
export function finishLearning(s, subject, level, correct) {
  const book = s.learning[subject];
  const maxLevel = SUBJECTS.find((x) => x.id === subject)?.maxLevel || 20;
  if (!book || level > book.unlocked || level < 1 || level > maxLevel)
    throw Error("そのがくしゅうれべるはまだひらいていません");
  const stars = Math.max(0, correct - 2),
    old = book.levels[level] || { stars: 0, plays: 0 };
  const first = !old.stars && stars > 0;
  book.levels[level] = {
    stars: Math.max(old.stars, stars),
    plays: old.plays + 1,
  };
  book.unlocked = Math.max(
    book.unlocked,
    stars ? Math.min(maxLevel, level + 1) : level,
  );
  const coins = [0, 0, 0, 20, 30, 45][correct];
  s.progression.coins += coins;
  if (first && level % 5 === 0) s.progression.tickets++;
  if (first && level === maxLevel)
    s.inventory.specialItems["subject_" + subject] = 1;
  metric(s, "learning");
  return {
    stars,
    added: Math.max(0, stars - old.stars),
    coins,
    ticket: first && level % 5 === 0,
  };
}
export function finishTyping(s, mode, level, result) {
  const t = s.typing,
    old = t.modes[mode]?.bestScore || 0,
    isBest = result.score > old;
  let power = Math.round(20 + result.score * 0.8);
  if (isBest) power = Math.round(power * 1.25);
  if (!s.progression.storyFlags.firstTyping) {
    power = Math.max(100, power);
    s.progression.storyFlags.firstTyping = true;
  }
  t.buddyPower += power;
  t.totalChars += result.correct + result.misses;
  t.totalCorrect += result.correct;
  t.totalMisses += result.misses;
  t.bestSpeed = Math.max(t.bestSpeed, result.speed);
  t.bestAccuracy = Math.max(t.bestAccuracy, result.accuracy);
  t.bestCombo = Math.max(t.bestCombo, result.combo);
  if (isBest) t.personalBestCount++;
  t.modes[mode] = {
    bestScore: Math.max(old, result.score),
    plays: (t.modes[mode]?.plays || 0) + 1,
  };
  if (mode === "basic" && result.words >= 5 && result.accuracy >= 60) {
    if (!t.completedLevels.includes(level)) t.completedLevels.push(level);
    t.level = Math.max(t.level, Math.min(20, level + 1));
  }
  metric(s, "typing");
  return { power, isBest };
}
export function weighted(rows, weight, rng = Math.random) {
  let total = rows.reduce((s, x) => s + Math.max(0, weight(x)), 0);
  if (!total) return rows[0];
  let n = rng() * total;
  for (const row of rows) {
    n -= Math.max(0, weight(row));
    if (n < 0) return row;
  }
  return rows.at(-1);
}
export function startFishing(s, area) {
  if (s.fishing.trip) return s.fishing.trip;
  if (
    !s.fishing.unlockedAreas.includes(area) ||
    !s.progression.unlockedFacilities.includes("fishing")
  )
    throw Error("まだひらいていないつりばです");
  if (s.progression.tickets < 1)
    throw Error(
      "ちけっとは がっこうのLv5ごとのはじめてくりあや きょうのたからばこでもらえるよ",
    );
  s.progression.tickets--;
  return (s.fishing.trip = { area, remaining: 3 });
}
export function selectFish(s, area, rng = Math.random) {
  const rows = FISH.filter((f) => f.area === area),
    unseen = rows.filter((f) => !s.fishing.fishBook[f.id]),
    pity = s.fishing.pity[area] || 0,
    rod = RODS.find((r) => r.id === s.fishing.equippedRod) || RODS[0];
  if (pity >= 20 && unseen.length) return weighted(unseen, () => 1, rng);
  return weighted(
    rows,
    (f) =>
      ([45, 30, 15, 8, 2][f.rarity - 1] /
        rows.filter((x) => x.rarity === f.rarity).length) *
      (f.rarity >= 3 ? rod.mult : 1) *
      (pity >= 10 && !s.fishing.fishBook[f.id] ? 2 : 1),
    rng,
  );
}
export function finishCast(s, success, rng = Math.random) {
  const trip = s.fishing.trip;
  if (!trip || trip.remaining <= 0) throw Error("つりがありません");
  let result = null;
  if (success) {
    const fish = selectFish(s, trip.area, rng),
      size = Math.round(fish.size * (0.65 + rng() * 0.7) * 10) / 10,
      old = s.fishing.fishBook[fish.id],
      isNew = !old,
      record = !old || size > old.biggest;
    s.fishing.fishBook[fish.id] = {
      caught: true,
      count: (old?.count || 0) + 1,
      biggest: Math.max(size, old?.biggest || 0),
    };
    s.fishing.totalCatches++;
    s.fishing.pity[trip.area] = isNew
      ? 0
      : (s.fishing.pity[trip.area] || 0) + 1;
    s.progression.coins += isNew ? 10 : 5 * fish.rarity;
    metric(s, "fish");
    result = { fish, size, isNew, record };
    if (fish.rarity === 5)
      remember(s, "fish", "れあさかな " + fish.name, fish.id);
  } else s.fishing.pity[trip.area] = (s.fishing.pity[trip.area] || 0) + 1;
  trip.remaining--;
  if (!trip.remaining) s.fishing.trip = null;
  return result;
}
export function startDig(s, area) {
  if (s.dinosaurs.trip) return s.dinosaurs.trip;
  if (
    !s.dinosaurs.unlockedAreas.includes(area) ||
    !s.progression.unlockedFacilities.includes("excavation")
  )
    throw Error("まだひらいていないはっくつえりあです");
  if (s.progression.tickets < 1)
    throw Error("ちけっとは がっこうのふしめや きょうのたからばこでもらえるよ");
  s.progression.tickets--;
  return (s.dinosaurs.trip = { area, remaining: 4 });
}
export function digReward(s, rng = Math.random) {
  const trip = s.dinosaurs.trip;
  if (!trip || trip.remaining <= 0) throw Error("はっくつがありません");
  const ds = s.dinosaurs;
  let result;
  const all = DINOS.filter(
      (d) =>
        d.area === trip.area && (ds.completedCount > 0 || d.id === "dino_01"),
    ).flatMap((d) => d.parts.map((part) => ({ d, part }))),
    fresh = all.filter((x) => !ds.fossilBook[x.d.id]?.parts.includes(x.part)),
    duplicates = all.filter((x) =>
      ds.fossilBook[x.d.id]?.parts.includes(x.part),
    );
  if (rng() < 0.75) {
    const wantNew =
      fresh.length && (ds.pity >= 5 || !duplicates.length || rng() < 0.65);
    const selected = weighted(
        wantNew ? fresh : duplicates.length ? duplicates : all,
        () => 1,
        rng,
      ),
      { d, part } = selected;
    const book = (ds.fossilBook[d.id] ??= { parts: [], completed: false });
    const isNew = !book.parts.includes(part);
    if (isNew) {
      book.parts.push(part);
      ds.pity = 0;
    } else {
      ds.pity++;
      s.progression.coins += 20;
    }
    result = { d, part, isNew, coins: isNew ? 0 : 20 };
  } else {
    ds.pity++;
    s.progression.coins += 15;
    result = { coins: 15 };
  }
  trip.remaining--;
  if (!trip.remaining) ds.trip = null;
  metric(s, "dig");
  return result;
}
export function restoreDinosaur(s, id) {
  const d = DINOS.find((d) => d.id === id),
    b = s.dinosaurs.fossilBook[id];
  if (!d || !b || b.completed || !d.parts.every((p) => b.parts.includes(p)))
    throw Error("ひつようなぱーつをあつめよう");
  b.completed = true;
  b.completedAt = new Date().toISOString();
  s.dinosaurs.completedCount++;
  s.inventory.specialItems["figure_" + id] = 1;
  remember(s, "dinosaur", d.name + " ふくげん！", id);
}
export function purchase(s, id) {
  const item = ITEMS.find((x) => x.id === id) || RODS.find((x) => x.id === id);
  if (!item) throw Error("しょうひんがみつかりません");
  if (item.rewardOnly) throw Error("このふくはごほうびです");
  const requirement = itemRequirement(id, s);
  if (requirement) throw Error(requirement + "でかえるよ");
  if (s.progression.manabiRank < item.rank) throw Error("らんくがあしりません");
  if (s.progression.coins < item.price) throw Error("こいんがあしりないよ");
  if (id.startsWith("rod_")) {
    if (s.fishing.ownedRods.includes(id)) throw Error("もっているよ");
    s.fishing.ownedRods.push(id);
    s.fishing.equippedRod = id;
  } else {
    const cat = ["wallpaper", "floor"].includes(item.type)
      ? "specialItems"
      : item.type;
    s.inventory[cat][id] = (s.inventory[cat][id] || 0) + 1;
  }
  s.progression.coins -= item.price;
}
export function talk(s, id) {
  const f = s.friends[id];
  if (!f) throw Error("まだとうちゃくしていません");
  metric(s, "talk");
  f.affinity = Math.min(100, f.affinity + 1);
  f.needs.social = Math.max(0, f.needs.social - 20);
  const others = Object.keys(s.friends).filter((x) => x !== id);
  if (others.length) {
    const other = others[Math.floor(Math.random() * others.length)];
    f.relationships[other] = Math.min(100, (f.relationships[other] || 0) + 2);
  }
  friendMilestone(s, id);
}
export function friendMilestone(s, id) {
  if (s.friends[id].affinity >= 95 && !s.progression.storyFlags["best_" + id]) {
    s.progression.storyFlags["best_" + id] = true;
    s.inventory.specialItems["friend_gift_" + id] = 1;
    remember(s, "friend", "しんゆうのきねんしゃしん", id, [id]);
  }
}
export function requestFriend(s, id) {
  const f = s.friends[id];
  if (f.request) return f.request;
  if (Object.values(s.friends).filter((x) => x.request).length >= 4)
    throw Error("まずいまのおねがいをかなえてあげよう");
  const choices = [
      "learning",
      ...(s.progression.manabiRank >= 2 ? ["typing"] : []),
      ...(s.progression.manabiRank >= 4 ? ["fish"] : []),
      ...(s.progression.manabiRank >= 6 ? ["dig"] : []),
    ],
    m = choices[Math.floor(Math.random() * choices.length)];
  f.request = {
    metric: m,
    start: s.progression.metrics[m] || 0,
    target: f.affinity >= 60 ? 2 : 1,
  };
  return f.request;
}
export function fulfillRequest(s, id) {
  const f = s.friends[id],
    r = f.request;
  if (!r || (s.progression.metrics[r.metric] || 0) - r.start < r.target)
    throw Error("おねがいをかなえてから またきてね");
  f.affinity = Math.min(100, f.affinity + 5);
  s.progression.coins += 20;
  f.request = null;
  friendMilestone(s, id);
}
export function gift(s, id, itemId) {
  const item = ITEMS.find((i) => i.id === itemId);
  if (!item || item.type !== "furniture" || !s.inventory.furniture[itemId])
    throw Error("おくれるかぐをえらんでね");
  if (Object.values(s.room.slots).includes(itemId))
    throw Error("へやにおいているかぐは、さきにかたづけよう");
  s.inventory.furniture[itemId]--;
  s.friends[id].gifts.push(itemId);
  s.friends[id].affinity = Math.min(
    100,
    s.friends[id].affinity +
      (item.theme === FRIENDS.findIndex((f) => f.id === id) % 6 ? 8 : 3),
  );
  friendMilestone(s, id);
}
export function claimChest(s, rng = Math.random) {
  if (s.missions.completedToday || !s.missions.daily.every((x) => x.claimed))
    throw Error("3つできたらひらくよ");
  const r = rng(),
    tier = r < 0.6 ? 0 : r < 0.9 ? 1 : 2;
  s.progression.coins += [30, 50, 80][tier];
  s.progression.tickets += [1, 2, 3][tier];
  let item = null;
  if (tier) {
    const choices = ITEMS.filter(
      (x) =>
        !x.rewardOnly &&
        ["furniture", "clothing"].includes(x.type) &&
        x.rare === (tier === 2),
    );
    item = choices[Math.floor(rng() * choices.length)];
    s.inventory[item.type][item.id] =
      (s.inventory[item.type][item.id] || 0) + 1;
  }
  s.missions.completedToday = true;
  return { tier, item };
}
export function arenaScore(creature, learning, knowledge, typing) {
  return (
    (Object.values(creature.stats).reduce((a, b) => a + b, 0) / 4) * 0.3 +
    learning * 0.25 +
    knowledge * 0.2 +
    typing * 0.25
  );
}
export function arenaWin(s, creatureId) {
  const active = s.arena.active;
  if (!active) throw Error("たいかいがありません");
  active.wins++;
  metric(s, "arena");
  s.arena.winsByCreature[creatureId] =
    (s.arena.winsByCreature[creatureId] || 0) + 1;
  s.arena.cards[creatureId] = true;
  if (active.wins < 3) return { champion: false };
  const cup = TOURNAMENTS.find((x) => x.id === active.cup),
    first = !s.arena.clearedTournaments.includes(cup.id);
  s.progression.coins += first ? cup.first : cup.repeat;
  if (first) {
    s.arena.clearedTournaments.push(cup.id);
    s.inventory.specialItems["trophy_" + cup.id] = 1;
    s.arena.cards[creatureId] = true;
    if (!s.arena.shinyCards.includes(creatureId))
      s.arena.shinyCards.push(creatureId);
    if (cup.id === "cup_5") s.inventory.specialItems.arena_master = 1;
  }
  remember(s, "arena", cup.name + " ゆうしょう！", creatureId);
  s.arena.active = null;
  return { champion: true, first, coins: first ? cup.first : cup.repeat };
}
