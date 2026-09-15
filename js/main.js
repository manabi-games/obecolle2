import * as D from "./data/catalog.js";
import * as R from "./systems/rules.js";
import { SaveManager, validateSaveData } from "./core/save.js";
import { AudioManager } from "./core/audio.js";
import { World } from "./three/world.js";
import { games } from "./games.js";
import { validateTyping } from "./systems/typing.js";
import { doors, walkable, findPath, findPathToDoor } from "./systems/walking.js";
import { FISH_ART, NEW_FISH_IDS } from "./data/art.js";
import { LEARNING_STEPS } from "./systems/focused-learning.js";
import {
  deriveInteractionState,
  shouldRestoreIsland,
} from "./systems/ui-state.js";
import { EYE_NAMES, eyePreview } from "./ui-face.js";
import { artLayout } from "./data/art-layout.js";
const E = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
class Game {
  constructor() {
    this.screen = document.querySelector("#screen");
    this.hud = document.querySelector("#hud");
    this.dialog = document.querySelector("#dialog-layer");
    this.saveManager = new SaveManager();
    this.audio = new AudioManager();
    this.activity = null;
    this.modalOpen = false;
    this.noticeQueue = [];
    this.scene = "title";
    this.page = 0;
    this.category = "friends";
    this.walkKeys = new Set();
    this.walkPath = [];
    this.world = new World(document.querySelector("#world"), (a) =>
      this.selectWorld(a),
    );
    this.world.onFrame = (dt, t) => {
      this.audio.update(dt);
      this.updateGame(dt, t);
      this.updateWalk(dt);
      if (location.search.includes("debug=1"))
        document.querySelector("#debug").textContent =
          `${this.world.fps?.toFixed(0)} FPS | ${this.scene} | slot ${this.s?.meta.slotId || "-"} | Rank ${this.s?.progression.manabiRank || "-"}`;
    };
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-a]");
      if (b && !b.disabled) {
        this.audio.start();
        this.audio.effect();
        this.action(b.dataset.a).catch((err) => this.error(err));
      }
    });
    document.addEventListener("keydown", (e) => this.key(e));
    document.addEventListener("keyup", (e) => {
      this.walkKeys.delete(e.code);
      if (e.code === "Space" && this.activity?.kind === "fish")
        this.activity.holding = false;
    });
    window.addEventListener("blur", () => {
      this.walkKeys.clear();
    });
    document.addEventListener("pointerdown", (e) => {
      if (e.target.closest("#fish-action") && this.activity?.phase === "pull")
        this.activity.holding = true;
    });
    document.addEventListener("pointerup", () => {
      if (this.activity?.kind === "fish") this.activity.holding = false;
    });
    document.addEventListener("change", (e) =>
      this.change(e).catch((err) => this.error(err)),
    );
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.s && !this.modalOpen) this.pause();
    });
  }
  async init() {
    const errors = [...D.validateGameData(), ...validateTyping()];
    if (errors.length) throw Error(errors.join("\n"));
    await this.saveManager.init();
    this.title();
  }
  panel(html, cls = "") {
    this.walkKeys.clear();
    this.screen.innerHTML = `<section class="panel ${cls}">${html}</section>`;
    this.syncInteractionState();
  }
  interactionState() {
    const sceneReady =
      this.scene === "island"
        ? !!this.screen.querySelector("#walk-enter")
        : !!this.screen.querySelector(".scene-bar");
    return deriveInteractionState({
      scene: this.scene,
      worldName: this.world.name,
      modalOpen: this.modalOpen,
      activityKind: this.activity?.kind || null,
      panelOpen: !!this.screen.querySelector(".panel"),
      sceneReady,
    });
  }
  syncInteractionState() {
    const state = this.interactionState();
    this.world.setInteractionsEnabled(state.worldInteractions);
    document
      .querySelector("#labels")
      .classList.toggle("hidden", !state.labelsVisible);
    document.body.classList.toggle(
      "island-interactive",
      state.walkingEnabled,
    );
    return state;
  }
  setScene(name, params = {}) {
    this.walkKeys.clear();
    this.walkPath = [];
    this.walkDestination = null;
    this.nearDoor = null;
    this.activity = null;
    this.modalOpen = false;
    this.dialog.innerHTML = "";
    this.world.paused = false;
    this.scene = name;
    this.world.set(name, this.s, params);
    this.audio.setScene(name);
    this.screen.innerHTML = "";
    this.hudUpdate();
    this.syncInteractionState();
  }
  hudUpdate() {
    if (!this.s || this.scene === "title" || this.scene === "create") {
      this.hud.innerHTML = "";
      return;
    }
    const p = this.s.progression;
    this.hud.innerHTML = `<div class="profile">${E(this.s.player.name)}<small>まなびらんく ${p.manabiRank} ／ ともだち ${Object.keys(this.s.friends).length}にん</small></div><div class="wallet"><span>◉ ${p.coins}</span><span>★ ${p.stars}</span><span>ちけっと ${p.tickets}</span></div><div class="hud-actions"><button class="home-action" data-a="quickhome">🏝 しま</button><button data-a="collection">これくしょん</button><button data-a="missions">きょうのやること</button><button data-a="pause">☰</button></div>`;
  }
  async commit() {
    const start = this.s.memories.length,
      notices = R.evaluate(this.s);
    this.hudUpdate();
    await this.saveManager.save(this.s);
    if (notices.length) this.toast(notices.slice(0, 3).join(" ／ "));
    for (const m of this.s.memories.slice(start))
      if (m.type === "arrival") this.noticeQueue.push(m);
  }
  toast(text) {
    const e = document.querySelector("#toast");
    e.textContent = text;
    e.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => e.classList.remove("show"), 4800);
  }
  error(e) {
    console.error(e);
    this.toast(e.message || String(e));
  }
  title() {
    this.s = null;
    this.setScene("title");
    document.querySelector("#labels").classList.add("hidden");
    this.screen.innerHTML =
      '<div class="title-box"><div class="subtitle">まなぶ。くらす。あつめる。</div><h1>おべんきょ<br>これくしょん<b>2</b></h1><p>きみのまいにちが、しまをそだてる。</p><button class="primary" data-a="slots">はじめる</button><button data-a="help">あそびかた</button></div><div class="version">おべこれ2　Version 1.3.1 ／ PC・きーぼーどであそぼう</div>';
  }
  async slots() {
    this.setScene("title");
    const slots = await Promise.all(
      [1, 2, 3].map(async (id) => {
        try {
          return { id, ...(await this.saveManager.load(id)) };
        } catch (e) {
          return { id, error: e.message };
        }
      }),
    );
    this.panel(
      `<h2>きみの ぼうけんを えらぼう</h2><div class="grid three">${slots.map((x) => `<div class="tile"><h3>せーぶ ${x.id}</h3>${x.data ? `<div class="icon">☺</div><p>${E(x.data.player.name)}</p><small>らんく${x.data.progression.manabiRank} ／ ともだち${Object.keys(x.data.friends).length}にん</small><small>${E(x.data.meta.updatedAt.slice(0, 10))}${x.recovered ? " ／ まえの せーぶから もどしたよ" : ""}</small><button class="primary" data-a="load:${x.id}">つづきから</button>` : x.error ? `<p>せーぶをよめません</p><small>${E(x.error)}</small>` : `<p>あたらしい おはなし</p><button class="primary" data-a="new:${x.id}">はじめる</button>`}<p><button class="muted-button" data-a="importslot:${x.id}">JSONからふくげん</button></p></div>`).join("")}</div><p><button data-a="title">もどる</button></p>`,
    );
  }
  async load(slot) {
    const loaded = await this.saveManager.load(slot);
    if (!loaded) throw Error("せーぶがありません");
    this.s = loaded.data;
    this.s.meta.playCount++;
    this.audio.music = this.s.settings.music;
    this.audio.sound = this.s.settings.sound;
    this.world.setQuality(this.s.settings.quality);
    await this.commit();
    this.island();
    if (loaded.recovered)
      this.toast(
        "まえのほぞんのせーぶからもとに もどしました。JSONばっくあっぷもほぞんしておこう。",
      );
  }
  create(slot, editing = false) {
    this.editing = editing;
    this.draft = editing ? R.clone(this.s.player) : R.newSave(slot).player;
    this.newSlot = slot;
    this.setScene("create", { appearance: this.draft.appearance });
    const options = (n, names) =>
      Array.from(
        { length: n },
        (_, i) => `<option value="${i}">${names?.[i] || i + 1}</option>`,
      ).join("");
    this.panel(
      `<h2>${editing ? "じぶんを あれんじ" : "きみは どんなこ？"}</h2><div class="appearance-row"><label>なまえ</label><input id="player-name" maxlength="8" value="${editing ? E(this.draft.name) : ""}" placeholder="8もじまで"></div>${[
        [
          "skin",
          "はだ",
          5,
          ["ややしろめ", "ふつう", "げんき", "こむぎいろ", "こいめ"],
        ],
        [
          "face",
          "かお",
          6,
          ["まんまる", "ほっそり", "しかく", "おもち", "たまご", "ほっぺ"],
        ],
        [
          "hair",
          "かみがた",
          12,
          [
            "しょーと",
            "ふんわり",
            "よこわけ",
            "まえがみしょーと",
            "みでぃあむ",
            "そとはね",
            "かーる",
            "せんたー",
            "ぼぶ",
            "ろんぐ",
            "ぽにーてーる",
            "ついん",
          ],
        ],
        [
          "hairColor",
          "かみのいろ",
          8,
          [
            "こげちゃ",
            "くろ",
            "ちゃ",
            "あかるいちゃ",
            "あかちゃ",
            "あお",
            "ぐれー",
            "きん",
          ],
        ],
        [
          "eyes",
          "め",
          12,
          [
            "ぱっちり",
            "にっこり",
            "おこりんぼ",
            "たれめ",
            "つりめ",
            "ねむねむ",
            "まんまる",
            "ほそめ",
            "ういんく",
            "まつげ",
            "びっくり",
            "じとめ",
          ],
        ],
        [
          "brows",
          "まゆ",
          5,
          ["まっすぐ", "きりっ", "こまり", "ぐいっ", "はのじ"],
        ],
        [
          "nose",
          "はな",
          5,
          ["ちいさめ", "だんご", "しかく", "とんがり", "ぺちゃんこ"],
        ],
        [
          "eyewear",
          "めがね",
          6,
          ["なし", "まる", "しかく", "さんぐらす", "おしゃれ", "かためがね"],
        ],
        [
          "mouth",
          "くち",
          8,
          [
            "ちょこん",
            "にっこり",
            "へのじ",
            "びっくり",
            "にやり",
            "にっ",
            "むすっ",
            "おおわらい",
          ],
        ],
      ]
        .map(
          ([key, label, n, names]) =>
            `<div class="appearance-row"><label>${label}</label><select data-appearance="${key}">${options(n, names)}</select></div>${key === "eyes" ? `<div class="face-choices">${EYE_NAMES.map((name, i) => `<button type="button" data-a="faceeye:${i}" aria-label="${name}" aria-pressed="${(this.draft.appearance.eyes || 0) === i}">${eyePreview(i)}<small>${name}</small></button>`).join("")}</div>` : ""}`,
        )
        .join(
          "",
        )}<div class="appearance-row"><label>ふく</label><select data-outfit>${D.ITEMS.filter(
        (i) =>
          i.type === "clothing" &&
          (editing ? this.s.inventory.clothing[i.id] : +i.id.split("_")[1] < 8),
      )
        .map((i) => `<option value="${i.id}">${i.name}</option>`)
        .join(
          "",
        )}</select></div><div class="row"><button data-a="${editing ? "room" : "slots"}">もどる</button><button class="primary" data-a="createfinish">${editing ? "これにする" : "しまへ しゅっぱつ！"}</button></div>`,
      "right",
    );
    document
      .querySelectorAll("[data-appearance]")
      .forEach(
        (el) => (el.value = this.draft.appearance[el.dataset.appearance] || 0),
      );
    document.querySelector("[data-outfit]").value =
      this.draft.appearance.outfit;
  }
  async createFinish() {
    const name = document.querySelector("#player-name").value.trim();
    if (!name || [...name].length > 8 || /[<>]/.test(name))
      throw Error("なまえを1〜8もじでいれてね");
    this.draft.name = name;
    if (this.editing) {
      this.s.player = { ...this.s.player, ...this.draft };
      await this.commit();
      return this.room();
    }
    this.s = R.newSave(this.newSlot, name, this.draft.appearance);
    this.s.inventory.clothing[this.draft.appearance.outfit] = 1;
    await this.commit();
    this.setScene("opening");
    this.screen.innerHTML =
      '<h1 class="ending-title">ようこそ、まなびあいらんどへ</h1><div class="scene-bar"><button data-a="arrive">しまについた！ ▸</button></div>';
    this.activity = { kind: "opening", elapsed: 0 };
  }
  async arrive() {
    this.s.progression.storyFlags.arrived = true;
    await this.commit();
    this.island();
    this.say(
      "はる",
      "ようこそ！ ぼくは はる。\nまんしょんに きみのへやがあるよ。\nがっこうで5もんあそぶと、あたらしいせかいがひらくんだ！",
      [
        ["まんしょんへ", "mansion"],
        ["しまをみてみる", "closedialog"],
      ],
    );
  }
  island() {
    this.setScene("island");
    this.screen.innerHTML = `<div class="next-goal"><strong>つぎの おたのしみ</strong>${E(this.nextGoal())}</div><div class="scene-bar walk-bar"><span>↑ ↓ ← → ／ W A S D で あるこう<br><small>たてものを おすと、そこまで あるくよ</small></span><button class="primary" id="walk-enter" data-a="walkenter" disabled>いりぐちへ あるこう</button><button data-a="overview">${this.walkOverview ? "じぶんを みる" : "しまを みわたす"}</button><button data-a="fullscreen">⛶</button></div>`;
    this.syncInteractionState();
    if (this.noticeQueue.length) {
      const m = this.noticeQueue.shift();
      this.world.set("arrival", this.s, { friend: m.subjectId });
      this.syncInteractionState();
      this.world.hero?.setState("happy");
      this.say(
        "あたらしい ともだち",
        m.title + "\nふねでやってきたよ。まんしょんであってみよう！",
        [
          ["あいにいく", "resident:" + m.subjectId],
          ["つづける", "closedialog"],
        ],
      );
    }
  }
  selectWorld(action) {
    if (this.modalOpen) return;
    if (this.interactionState().walkingEnabled) {
      const door = doors.find((f) => f.id === action);
      if (door) {
        const route = findPathToDoor(this.world.hero.position, door);
        this.walkKeys.clear();
        if (!route.length) {
          this.walkDestination = null;
          this.toast(`${door.name}へ はいるよ`);
          this.action(door.id).catch((e) => this.error(e));
          return;
        }
        this.walkPath = route;
        this.walkDestination = door.id;
        this.toast(`${door.name}へ いくよ！`);
        return;
      }
      const person = this.world.targets.find(
        (t) => t.userData.action === action,
      );
      if (
        person &&
        this.world.hero.position.distanceTo(person.position) > 2.5
      ) {
        this.walkPath = findPath(this.world.hero.position, person.position);
        this.walkDestination = null;
        this.toast("ちかくまで あるいてから、もういちど おしてね");
        return;
      }
    }
    this.action(action).catch((e) => this.error(e));
  }
  updateWalk(dt) {
    if (!this.interactionState().walkingEnabled || !this.world.hero) return;
    const hero = this.world.hero,
      p = hero.position;
    let x =
      Number(this.walkKeys.has("ArrowRight") || this.walkKeys.has("KeyD")) -
      Number(this.walkKeys.has("ArrowLeft") || this.walkKeys.has("KeyA"));
    let z =
      Number(this.walkKeys.has("ArrowDown") || this.walkKeys.has("KeyS")) -
      Number(this.walkKeys.has("ArrowUp") || this.walkKeys.has("KeyW"));
    if (x || z) {
      this.walkPath = [];
      this.walkDestination = null;
    }
    // Camera is isometric: screen-right and screen-up map to ground-plane axes.
    const ox = x;
    x = x * 0.857 + z * 0.514;
    z = z * 0.857 - ox * 0.514;
    if (!x && !z && this.walkPath.length) {
      const target = this.walkPath[0];
      const dist = Math.hypot(target.x - p.x, target.z - p.z);
      if (dist < 0.15) this.walkPath.shift();
      else {
        x = (target.x - p.x) / dist;
        z = (target.z - p.z) / dist;
      }
    }
    const length = Math.hypot(x, z);
    if (length) {
      const speed = (4.2 * dt) / Math.max(1, length),
        nx = p.x + x * speed,
        nz = p.z + z * speed;
      if (walkable(nx, p.z)) p.x = nx;
      if (walkable(p.x, nz)) p.z = nz;
      hero.rotation.y = Math.atan2(x, z);
      hero.setState("walk");
    } else hero.setState("idle");
    const camera = this.world.camera,
      blend = Math.min(1, dt * 4);
    const tx = this.walkOverview ? 0 : p.x,
      tz = this.walkOverview ? 0 : p.z;
    camera.position.x +=
      ((this.walkOverview ? 21 : 11) + tx - camera.position.x) * blend;
    camera.position.y +=
      ((this.walkOverview ? 26 : 14) - camera.position.y) * blend;
    camera.position.z +=
      ((this.walkOverview ? 35 : 18) + tz - camera.position.z) * blend;
    this.world.target.x += (tx - this.world.target.x) * blend;
    this.world.target.z += (tz - this.world.target.z) * blend;
    camera.lookAt(this.world.target);
    this.nearDoor = doors.find((f) => Math.hypot(f.x - p.x, f.z - p.z) < 1.45);
    const button = document.querySelector("#walk-enter");
    if (button) {
      button.disabled = !this.nearDoor;
      const label = this.nearDoor
        ? `${this.nearDoor.name}へ（Enter）`
        : "いりぐちへ あるこう";
      if (button.textContent !== label) button.textContent = label;
    }
    if (this.walkDestination && !this.walkPath.length) {
      const dest = this.walkDestination;
      this.walkDestination = null;
      this.action(dest).catch((e) => this.error(e));
    }
  }
  nextGoal() {
    const next = D.FRIENDS.find(
      (f) => f.route === "typing" && !this.s.friends[f.id],
    );
    if (next && this.s.progression.manabiRank >= 2)
      return `あと ${Math.max(0, next.threshold - this.s.typing.buddyPower)} なかまぱわーで、あたらしいともだち！`;
    const rank = this.s.progression.manabiRank;
    if (rank < 10)
      return `がっこうであと ${D.RANKS[rank] - this.s.progression.stars}すたー！ らんく${rank + 1}へ`;
    return this.s.progression.storyFlags.master
      ? "ずかん・じぶんの いちばん・ともだちとのまいにちをたのしもう"
      : "まんなかひろばで しまのかんせいまでにやることをみよう";
  }
  mansion() {
    this.setScene("mansion");
    this.screen.innerHTML =
      '<div class="scene-bar"><button data-a="island">しまへ</button><button class="primary" data-a="room">じぶんのへや</button></div>';
    this.syncInteractionState();
  }
  room(friend = null) {
    this.roomFriend = friend;
    this.setScene("room", { friend });
    if (!friend) {
      R.metric(this.s, "room");
      this.commit().catch((e) => this.error(e));
    }
    this.screen.innerHTML = `<div class="scene-bar"><button data-a="mansion">まんしょんへ</button>${friend ? `<button class="primary" data-a="friend:${friend}">おはなし</button>` : '<button data-a="decorate">もようがえ</button><button data-a="wardrobe">きせかえ</button><button data-a="display">これくしょんを かざる</button>'}</div>`;
    this.syncInteractionState();
  }
  say(name, text, choices = [["つづける", "closedialog"]]) {
    this.walkKeys.clear();
    this.modalOpen = true;
    this.world.paused = false;
    this.dialog.innerHTML = `<div class="dialog"><h2>${E(name)}</h2><p>${E(text)}</p><div class="row">${choices
      .slice(0, 3)
      .map(([label, a]) => `<button data-a="${a}">${E(label)}</button>`)
      .join("")}</div></div>`;
    this.syncInteractionState();
  }
  closeDialog() {
    this.dialog.innerHTML = "";
    this.modalOpen = false;
    this.world.paused = false;
    if (shouldRestoreIsland(this.scene, this.world.name)) {
      this.island();
      return;
    }
    this.syncInteractionState();
  }
  async friend(id) {
    if (!this.s.friends[id]) return;
    R.talk(this.s, id);
    await this.commit();
    this.roomFriend = id;
    this.world.hero?.setState("wave");
    const data = D.FRIENDS.find((f) => f.id === id),
      f = this.s.friends[id];
    this.say(
      data.name,
      `${this.hearts(f.affinity)}\n${["きょうは なにをして あそぼう？", "あたらしいことをしると、わくわくするね。", "ゆっくり、たのしく やっていこう。", "きょうのきろくに ちょうせんだ！", "がっこうにも いってみようかな。", "きみがくると しまがたのしい！"][D.FRIENDS.indexOf(data) % 6]}${f.affinity >= 40 ? "\nすきなもの：" + data.favoriteActivity + "・" + data.favoriteFood : ""}`,
      [
        ["おねがい", "request:" + id],
        ["ぷれぜんと", "gift:" + id],
        ["いっしょにあそぶ", "together:" + id],
      ],
    );
  }
  hearts(n) {
    const h = n >= 95 ? 5 : n >= 80 ? 4 : Math.floor(n / 20);
    return "♥".repeat(h) + "♡".repeat(5 - h);
  }
  request(id) {
    const r = R.requestFriend(this.s, id),
      names = {
        learning: "がっこうで5もん",
        typing: "たいぴんぐ",
        fish: "さかなをつる",
        dig: "ほるばしょをしらべる",
      };
    this.commit().catch((e) => this.error(e));
    const progress = (this.s.progression.metrics[r.metric] || 0) - r.start;
    this.say(
      D.FRIENDS.find((f) => f.id === id).name,
      `${names[r.metric]}を ${r.target}かい おねがい！\nいま ${Math.min(r.target, progress)} / ${r.target}`,
      [
        ["できたよ！", "fulfill:" + id],
        ["またくるね", "closedialog"],
      ],
    );
  }
  giftMenu(id) {
    this.closeDialog();
    const items = D.ITEMS.filter(
      (i) => i.type === "furniture" && this.s.inventory.furniture[i.id] > 0,
    );
    this.panel(
      `<h2>かぐを ぷれぜんと</h2><div class="grid three">${
        items
          .slice(0, 12)
          .map(
            (i) => `<button data-a="give:${id}:${i.id}">${E(i.name)}</button>`,
          )
          .join("") || "<p>しょっぷでかぐをかってこよう</p>"
      }</div><p><button data-a="resident:${id}">もどる</button></p>`,
    );
  }
  together(id) {
    this.closeDialog();
    this.companion = id;
    this.panel(
      `<h2>${D.FRIENDS.find((f) => f.id === id).name}と あそぼう</h2><div class="row"><button data-a="friendquiz:${id}">いっしょに くいず</button>${this.s.progression.manabiRank >= 4 ? '<button data-a="fishing">いっしょに つり</button>' : ""}${this.s.progression.manabiRank >= 6 ? '<button data-a="excavation">いっしょに はっくつ</button>' : ""}<button data-a="resident:${id}">もどる</button></div>`,
      "small",
    );
  }
  addCompanion() {
    if (!this.companion) return;
    const f = D.FRIENDS.find((f) => f.id === this.companion);
    if (f)
      this.world.human(
        { ...f.baseAppearance, outfitIndex: f.defaultOutfit },
        -3,
        2,
        "wave",
      );
  }
  companionReward(activity) {
    if (!this.companion) return;
    const id = this.companion;
    this.s.friends[id].affinity = Math.min(
      100,
      this.s.friends[id].affinity + 4,
    );
    R.friendMilestone(this.s, id);
    R.remember(this.s, "together", "いっしょに" + activity, id, [id]);
    this.companion = null;
  }
  async friendQuiz(id) {
    this.startQuiz(
      D.FRIENDS.find((f) => f.id === id).strongSubject,
      1,
      async (score) => {
        this.s.friends[id].affinity = Math.min(
          100,
          this.s.friends[id].affinity + 3,
        );
        R.friendMilestone(this.s, id);
        R.remember(this.s, "together", "いっしょにくいず", id, [id]);
        await this.commit();
        this.room(id);
        this.say(
          D.FRIENDS.find((f) => f.id === id).name,
          "いっしょにかんがえると たのしいね！ なかよしど ＋3",
        );
      },
    );
  }
  school() {
    this.setScene("school");
    this.panel(
      `<h2>まなびがっこう</h2><p>すきな がくしゅうで、5もんずつ。きみのぺーすで。</p><div class="grid">${D.SUBJECTS.map((x) => `<button class="tile" data-a="levels:${x.id}"><span class="icon">${x.icon}</span><span class="name">${x.name}</span><small>Lv ${Math.min(x.maxLevel, this.s.learning[x.id].unlocked)} / ${x.maxLevel}</small></button>`).join("")}</div><p><button data-a="island">しまへ</button></p>`,
    );
  }
  levels(subject) {
    this.closeDialog();
    const b = this.s.learning[subject];
    this.panel(
      `<h2>${D.SUBJECTS.find((x) => x.id === subject).name}</h2><div class="grid level-grid">${Array.from({ length: D.SUBJECTS.find((x) => x.id === subject).maxLevel }, (_, i) => `<button data-a="quiz:${subject}:${i + 1}" ${i + 1 > b.unlocked ? "disabled" : ""}>Lv ${i + 1}${LEARNING_STEPS[subject] ? `<small class="step-title">${LEARNING_STEPS[subject][i]}</small>` : ""}<small style="display:block">${"★".repeat(b.levels[i + 1]?.stars || 0)}${"☆".repeat(3 - (b.levels[i + 1]?.stars || 0))}</small></button>`).join("")}</div><p class="muted">★はいちばんのきろくだけたす。Lv5ごと・さいごのLvの はじめてくりあで ちけっと！</p><button data-a="school">がくしゅうをえらぶ</button>`,
    );
  }
  typingLab() {
    this.setScene("typing");
    const t = this.s.typing,
      next = D.FRIENDS.find(
        (f) => f.route === "typing" && !this.s.friends[f.id],
      ),
      nextMode = D.TYPING_MODES.find((m) => m.level > t.level);
    this.panel(
      `<h2>たいぴんぐけんきゅうじょ</h2><div class="row spread"><span class="pill">きほん Lv ${t.level} / 20</span><b>なかまぱわー ${t.buddyPower}</b></div><div class="typing-goal"><strong>つぎは「きほん Lv ${t.level}」を くりあしよう</strong><small>${nextMode ? `${nextMode.name}は きほんLv${nextMode.level - 1}を くりあすると OPEN！` : "ぜんぶの あそびが OPENしているよ！"}</small><button class="primary" data-a="typelevel:basic:${t.level}">きほん Lv ${t.level}を はじめる</button></div><p>${next ? `あと ${Math.max(0, next.threshold - t.buddyPower)} なかまぱわーで あたらしいともだち！` : "たいぴんぐのともだち ぜんいんとうちゃく！"}</p><div class="grid two">${D.TYPING_MODES.filter((m) => m.id !== "basic").map((m) => `<button data-a="typelevel:${m.id}:${t.level}" ${t.level < m.level ? "disabled" : ""}>${m.name}<small>${t.level < m.level ? `🔒 きほんLv${m.level - 1}を くりあでOPEN` : "OPEN！"}</small></button>`).join("")}</div><div class="typing-replay"><label>まえの きほんLvを れんしゅう <select id="typing-level">${Array.from({ length: t.level }, (_, i) => `<option value="${i + 1}" ${i + 1 === t.level ? "selected" : ""}>Lv ${i + 1}</option>`).join("")}</select></label><button data-a="typeselected">えらんだLvを やる</button></div>`,
      "small",
    );
  }
  fishing() {
    this.setScene("fishing");
    this.panel(
      `<h2>つりみなと</h2><p>ちけっと1まいで3きゃすと。おおものを つりあげよう！</p>${this.s.fishing.trip ? `<button class="primary" data-a="fishstart:${this.s.fishing.trip.area}">のこり${this.s.fishing.trip.remaining}かいのつりをつづける</button>` : ""}<div class="grid three">${D.FISH_AREAS.map((a) => `<button data-a="fishstart:${a.id}" ${this.s.fishing.unlockedAreas.includes(a.id) ? "" : "disabled"}>${a.name}<small style="display:block">Rank${a.rank}${a.species ? "・さかな" + a.species + "しゅるい" : ""}</small></button>`).join("")}</div><p>つりざお <select id="rod">${D.RODS.filter(
        (r) => this.s.fishing.ownedRods.includes(r.id),
      )
        .map(
          (r) =>
            `<option value="${r.id}" ${r.id === this.s.fishing.equippedRod ? "selected" : ""}>${r.name}</option>`,
        )
        .join(
          "",
        )}</select></p><div class="row"><button data-a="island">しまへ</button><button data-a="book:fish">さかなずかん</button><button data-a="display">すいそう</button></div>`,
    );
  }
  excavation() {
    this.setScene("excavation");
    this.panel(
      `<h2>はっくつしま</h2><p>ちけっと1まいで 3かい はっくつ。きらきらを えらんで、かせきから きょうりゅうを みつけよう！</p>${this.s.dinosaurs.trip ? `<button class="primary" data-a="digstart:${this.s.dinosaurs.trip.area}">のこり${this.s.dinosaurs.trip.remaining}かいの はっくつを つづける</button>` : ""}<div class="grid three">${D.DIG_AREAS.map((a) => `<button data-a="digstart:${a.id}" ${this.s.dinosaurs.unlockedAreas.includes(a.id) ? "" : "disabled"}>${a.name}<small style="display:block">Rank${a.rank}${a.completed ? "・ふくげん" + a.completed + "しゅるい" : ""}</small></button>`).join("")}</div><p class="muted">1かいの はっくつは 20〜30びょう。はんまー3かい → ぶらしで みつけよう。</p><p><button data-a="island">しまへ</button> <button data-a="book:dinosaurs">きょうりゅうずかん</button></p>`,
    );
  }
  ownedCreatures() {
    return D.CREATURES.filter((c) =>
      c.id.startsWith("dino_")
        ? this.s.dinosaurs.fossilBook[c.id]?.completed
        : c.id.startsWith("fish_")
          ? this.s.fishing.fishBook[c.id]
          : this.s.collections.animals.includes(c.id),
    );
  }
  arena() {
    this.setScene("arena");
    this.panel(
      `<h2>さいきょうありーな</h2><p>がくしゅう・ちしき・たいぴんぐでかつやく！ さんかはむりょう。</p>${this.s.arena.active ? `<p><button class="primary" data-a="arenacontinue">${D.TOURNAMENTS.find((c) => c.id === this.s.arena.active.cup).name} ${this.s.arena.active.wins + 1}しあいめをつづける</button></p>` : ""}<div class="grid three">${D.TOURNAMENTS.map((c) => `<button data-a="cup:${c.id}" ${this.s.arena.unlockedTournaments.includes(c.id) ? "" : "disabled"}>${c.name}<small style="display:block">${this.s.arena.clearedTournaments.includes(c.id) ? "🏆 ゆうしょうずみ" : "Rank " + c.rank}${c.id === "cup_2" ? "・きょうりゅう10しゅるい" : ""}</small></button>`).join("")}</div><p><button data-a="island">しまへ</button></p>`,
    );
  }
  chooseCreature(cup) {
    this.panel(
      `<h2>${D.TOURNAMENTS.find((c) => c.id === cup).name}に えんとりー</h2><p>いきものをえらぼう。いきものの つよさは かわらないよ。</p><select id="arena-creature">${this.ownedCreatures()
        .map((c) => `<option value="${c.id}">${c.name}</option>`)
        .join(
          "",
        )}</select><p><button class="primary" data-a="arenastart:${cup}">このなかまでさんか</button> <button data-a="arena">もどる</button></p>`,
      "small",
    );
  }
  shop(category = "clothing", page = 0) {
    this.shopCategory = category;
    this.shopPage = page;
    this.setScene("shop");
    const rows =
        category === "rods"
          ? D.RODS
          : D.ITEMS.filter((i) => !i.rewardOnly).filter((i) =>
              category === "accessories"
                ? i.type === "accessories"
                : category === "interior"
                  ? ["wallpaper", "floor"].includes(i.type)
                  : i.type === category,
            ),
      pages = Math.ceil(rows.length / 8);
    this.panel(
      `<h2>しょっぷすとりーと</h2><div class="tabs">${[
        ["clothing", "ふく"],
        ["furniture", "かぐ"],
        ["accessories", "ぼうし・めがね"],
        ["interior", "かべ・ゆか"],
        ["rods", "つりざお"],
      ]
        .map(
          ([id, n]) =>
            `<button class="${id === category ? "active" : ""}" data-a="shopcat:${id}">${n}</button>`,
        )
        .join("")}</div><div class="grid">${rows
        .slice(page * 8, page * 8 + 8)
        .map(
          (i) =>
            `<div class="tile"><span class="swatch" style="background:${i.color || "#ac875b"}"></span><span class="name">${E(i.name)}</span><small>${i.price} こいん ／ Rank${i.rank}${D.itemRequirement(i.id, this.s) ? "<br>" + D.itemRequirement(i.id, this.s) : ""}</small><button data-a="buy:${i.id}" ${this.s.progression.manabiRank < i.rank || D.itemRequirement(i.id, this.s) ? "disabled" : ""}>かう</button></div>`,
        )
        .join(
          "",
        )}</div>${this.pagination(page, pages, "shoppage")}<button data-a="island">しまへ</button>`,
      "wide",
    );
  }
  pagination(page, pages, action) {
    return `<div class="pagination"><button data-a="${action}:${page - 1}" ${page <= 0 ? "disabled" : ""}>◀</button><span>${page + 1} / ${Math.max(1, pages)}</span><button data-a="${action}:${page + 1}" ${page >= pages - 1 ? "disabled" : ""}>▶</button></div>`;
  }
  decorate(slot = null) {
    this.roomFriend = null;
    this.decorateSlot = slot;
    const items = D.ITEMS.filter(
      (i) => i.type === "furniture" && this.s.inventory.furniture[i.id] > 0,
    );
    this.panel(
      `<h2>へやの もようがえ</h2><p>かぐをえらんで、おくばしょをくりっくしよう。</p><select id="furniture-choice">${items.map((i) => `<option value="${i.id}">${i.name}（${this.s.inventory.furniture[i.id]}）</option>`).join("")}</select><div class="grid three" style="margin:20px 0">${Array.from({ length: 6 }, (_, i) => `<button data-a="place:${i}">ばしょ ${i + 1}<small style="display:block">${D.ITEMS.find((x) => x.id === this.s.room.slots[i])?.name || "あいている"}</small></button>`).join("")}</div><div class="row"><button data-a="room">おへやへ</button><button data-a="clearroom">かぐをかたづける</button></div>`,
    );
  }
  async place(slot) {
    const id = document.querySelector("#furniture-choice").value,
      used = Object.entries(this.s.room.slots).filter(
        ([k, v]) => +k !== slot && v === id,
      ).length;
    if (used >= this.s.inventory.furniture[id])
      throw Error("そのかぐは もうおいてあるよ。べつのかぐをえらぼう");
    this.s.room.slots[slot] = id;
    await this.commit();
    this.room();
    this.world.hero?.setState("happy");
  }
  wardrobe() {
    const owned = D.ITEMS.filter(
      (i) =>
        (this.s.inventory[i.type]?.[i.id] ||
          this.s.inventory.specialItems[i.id]) > 0 &&
        ["clothing", "accessories", "wallpaper", "floor"].includes(i.type),
    );
    this.panel(
      `<h2>きせかえ・かべ・ゆか</h2><div class="grid three">${owned.map((i) => `<button data-a="wear:${i.id}"><span class="swatch" style="background:${i.color}"></span>${E(i.name)}</button>`).join("")}</div><p><button data-a="removeaccessories">ぼうし・めがねをそとす</button> <button data-a="room">おへやへ</button></p>`,
    );
  }
  async wear(id) {
    const i = D.ITEMS.find((x) => x.id === id);
    if (!i) throw Error("あいてむがみつかりません");
    if (i.type === "clothing") this.s.player.appearance.outfit = id;
    else if (i.type === "accessories")
      this.s.player.appearance[id.startsWith("hat_") ? "hat" : "glasses"] = id;
    else this.s.room[i.type] = id;
    await this.commit();
    this.room();
  }
  display() {
    const fish = D.FISH.filter((f) => this.s.fishing.fishBook[f.id]),
      ds = D.DINOS.filter((d) => this.s.dinosaurs.fossilBook[d.id]?.completed),
      trophies = Object.keys(this.s.inventory.specialItems).filter(
        (id) =>
          id.startsWith("trophy_") ||
          id.startsWith("subject_") ||
          id.endsWith("master"),
      );
    this.panel(
      `<h2>できたことを おへやにかざろう</h2><div class="split"><div><h3>すいそう（5ひきまで）</h3>${this.s.inventory.specialItems.aquarium_small ? `<div class="scroll-list">${fish.map((f) => `<label class="row"><input type="checkbox" data-display="aquariumFish" value="${f.id}" ${this.s.room.aquariumFish.includes(f.id) ? "checked" : ""}>${f.name}</label>`).join("")}</div>` : "<p>さかなを5しゅるいつると ちいさなすいそうがもらえるよ。</p>"}</div><div><h3>きょうりゅうふぃぎゅあ（3からだ）</h3><div class="scroll-list">${ds.map((d) => `<label class="row"><input type="checkbox" data-display="dinosaurFigures" value="${d.id}" ${this.s.room.dinosaurFigures.includes(d.id) ? "checked" : ""}>${d.name}</label>`).join("") || "きょうりゅうをふくげんすると かざれるよ"}</div><h3>とろふぃー（3こ）</h3><div class="scroll-list">${trophies.map((id) => `<label class="row"><input type="checkbox" data-display="trophies" value="${id}" ${this.s.room.trophies.includes(id) ? "checked" : ""}>${E(this.specialName(id))}</label>`).join("")}</div></div></div><p><button data-a="room">かざったへやをみる</button> <button data-a="memories">おもいでしゃしんをえらぶ</button></p>`,
    );
  }
  specialName(id) {
    if (id.startsWith("trophy_cup_"))
      return (
        D.TOURNAMENTS.find((c) => "trophy_" + c.id === id)?.name + "とろふぃー"
      );
    if (id.startsWith("subject_"))
      return (
        D.SUBJECTS.find((s) => "subject_" + s.id === id)?.name + " Lv20きねん"
      );
    return (
      {
        fish_master: "さかなますたーふく",
        dinosaur_master: "きょうりゅうますたーふく",
        typing_master: "たいぴんぐますたーふく",
        arena_master: "ありーなおうじゃとろふぃー",
        obecolle_master: "おべこれますたーとろふぃー",
      }[id] || "きねんとろふぃー"
    );
  }
  icon(c, hidden = false) {
    if (!c) return "";
    if (c.id?.startsWith("fish_") || c.id?.startsWith("dino_")) {
      if (hidden)
        return '<span class="unknown-creature" aria-label="まだ みつけていないよ">？</span>';
      if (FISH_ART[c.id])
        return `<img class="creature-art legacy-art" src="${FISH_ART[c.id]}" alt="${E(c.name)}" loading="lazy">`;
      const a = artLayout(c.id);
      return `<span class="creature-atlas" role="img" aria-label="${E(c.name)}" style="aspect-ratio:${a.w / a.h};background-image:url('${a.source}');background-size:${(a.width / a.w) * 100}% ${(a.height / a.h) * 100}%;background-position:${(a.x / (a.width - a.w)) * 100}% ${(a.y / (a.height - a.h)) * 100}%"></span>`;
    }
    const color = hidden ? "#7da593" : c.color || "#9ac4af",
      isDino = c.id?.startsWith("dino_"),
      isFish = c.id?.startsWith("fish_");
    return `<svg viewBox="0 0 120 80" role="img" aria-label="${hidden ? "いきもの" : E(c.name)}"><ellipse cx="60" cy="67" rx="39" ry="5" fill="#738f7625"/>${isFish ? `<path d="M32 42 L9 21 L9 63 Z" fill="${color}"/><ellipse cx="64" cy="42" rx="37" ry="23" fill="${color}"/><path d="M52 23 L62 8 L75 25" fill="${color}"/><circle cx="86" cy="36" r="6" fill="white"/><circle cx="88" cy="36" r="3" fill="#35483f"/>` : `<ellipse cx="54" cy="43" rx="30" ry="22" fill="${color}"/><circle cx="85" cy="27" r="20" fill="${color}"/><path d="M30 43 L5 32 L26 61" fill="${color}"/><path d="M38 55 V69 H49 V54 M65 55 V69 H76 V53" stroke="${color}" stroke-width="7"/><circle cx="93" cy="23" r="5" fill="white"/><circle cx="95" cy="23" r="2.5" fill="#35483f"/>${isDino ? '<path d="M78 12 L80 1 L88 10 M94 9 L102 2 L103 17" fill="#eee1b7"/>' : ""}`}</svg>`;
  }
  collection(category = this.category, page = 0) {
    this.category = category;
    this.page = page;
    this.activity = null;
    const categories = [
      ["friends", "ともだち"],
      ["fish", "さかな"],
      ["dinosaurs", "きょうりゅう"],
      ["animals", "いきもの"],
      ["clothing", "ふく"],
      ["furniture", "かぐ"],
      ["cards", "かーど"],
      ["trophies", "とろふぃー"],
    ];
    let rows, owned;
    if (category === "friends") {
      rows = D.FRIENDS;
      owned = (x) => !!this.s.friends[x.id];
    } else if (category === "fish") {
      rows = D.FISH;
      owned = (x) => !!this.s.fishing.fishBook[x.id];
    } else if (category === "dinosaurs") {
      rows = D.DINOS;
      owned = (x) => !!this.s.dinosaurs.fossilBook[x.id]?.completed;
    } else if (category === "animals") {
      rows = D.ANIMALS;
      owned = (x) => this.s.collections.animals.includes(x.id);
    } else if (category === "cards") {
      rows = D.CREATURES;
      owned = (x) => !!this.s.arena.cards[x.id];
    } else if (category === "trophies") {
      rows = [
        ...D.TOURNAMENTS.map((x) => ({
          id: "trophy_" + x.id,
          name: x.name + "とろふぃー",
        })),
        ...D.SUBJECTS.map((x) => ({
          id: "subject_" + x.id,
          name: x.name + "きねんひん",
        })),
        ...D.ACHIEVEMENTS.filter((x) => x.target >= 20).map((x) => ({
          id: "trophy_" + x.id,
          name: x.name,
        })),
        { id: "obecolle_master", name: "おべこれますたー" },
      ];
      owned = (x) => !!this.s.inventory.specialItems[x.id];
    } else {
      rows = D.ITEMS.filter((i) => i.type === category);
      owned = (x) => !!this.s.inventory[category][x.id];
    }
    const hints = {
      friends: "たいぴんぐ・がくしゅう・あつめるで…",
      fish: "つりばをひろげよう",
      dinosaurs: "はっくつで かせきをみつけよう",
      animals: "いきもののがくしゅうで…",
      cards: "ありーなでかつと…",
      trophies: "がくしゅう・たいかい・できたことで…",
      clothing: "しょっぷでみつかるよ",
      furniture: "しょっぷでみつかるよ",
    };
    this.panel(
      `<div class="row spread"><h2>これくしょんぶっく</h2><span>${rows.filter(owned).length} / ${rows.length}</span></div><div class="tabs">${categories.map(([id, n]) => `<button class="${category === id ? "active" : ""}" data-a="book:${id}">${n}</button>`).join("")}</div><div class="grid">${rows
        .slice(page * 8, page * 8 + 8)
        .map(
          (x) =>
            `<button class="tile ${owned(x) ? "" : "locked"}" data-a="detail:${category}:${x.id}"><div class="collection-icon">${["fish", "dinosaurs", "animals", "cards"].includes(category) ? this.icon(x, !owned(x)) : '<span class="icon">' + (owned(x) ? (category === "friends" ? "☺" : category === "trophies" ? "🏆" : "✦") : "？") + "</span>"}</div><span class="name">${owned(x) ? E(x.name) : "???"}</span><small>${owned(x) ? (category === "fish" ? this.s.fishing.fishBook[x.id].biggest + " cm" : category === "friends" ? this.hearts(this.s.friends[x.id].affinity) : "GET！") : hints[category]}</small></button>`,
        )
        .join(
          "",
        )}</div>${this.pagination(page, Math.ceil(rows.length / 8), "bookpage")}<div class="row"><button data-a="island">しまへ</button><button data-a="achievements">できたこと</button><button data-a="memories">おもいであるばむ</button></div>`,
      "wide",
    );
  }
  detail(category, id) {
    let text = "";
    const x = [
      ...D.FRIENDS,
      ...D.FISH,
      ...D.DINOS,
      ...D.ANIMALS,
      ...D.ITEMS,
    ].find((x) => x.id === id);
    if (category === "fish") {
      const f = this.s.fishing.fishBook[id];
      text = f
        ? `${"★".repeat(x.rarity)} ／ ${D.FISH_AREAS.find((a) => a.id === x.area).name}\nいちばんおおきい ${f.biggest}cm ／ ${f.count}ひき\n${x.fact}`
        : `${D.FISH_AREAS.find((a) => a.id === x.area).name}にいるさかなだよ`;
    } else if (category === "dinosaurs") {
      const b = this.s.dinosaurs.fossilBook[id];
      text = b?.completed
        ? `${x.fact}\nたべもの：${x.food}\nみつけたひ：${b.completedAt.slice(0, 10)}`
        : b?.parts?.length
          ? `まえの ばーじょんで ${b.parts.length}/4ぱーつまで みつけたよ。\nつぎの はっくつで まるごと ふくげんできるよ。`
          : "まだ ふくげんまえ。はっくつで かせきを みつけよう。";
    } else if (category === "friends") {
      text = this.s.friends[id]
        ? `${x.personality} ／ ${this.hearts(this.s.friends[id].affinity)}\n${x.favoriteActivity}がすき`
        : `${x.route === "typing" ? "ぜんぶでなかまぱわー " + x.threshold : "がくしゅう・あつめる・ともだちとのこうりゅうをすすめよう"}`;
    } else if (category === "cards") {
      const c = D.CREATURES.find((c) => c.id === id);
      text = this.s.arena.cards[id]
        ? `${Object.entries(c.stats)
            .map(([k, v]) => k + " " + "★".repeat(Math.ceil(v / 20)))
            .join(
              "\n",
            )}\n${c.move}${this.s.arena.shinyCards.includes(id) ? "\nきらかーど！" : ""}`
        : "このいきものでありーなにかつともらえるよ";
    } else
      text =
        x?.fact || "あつめたできたことは、へややぷろふぃーるにかざれるよ。";
    const known =
      category === "fish"
        ? this.s.fishing.fishBook[id]
        : category === "dinosaurs"
          ? this.s.dinosaurs.fossilBook[id]?.completed
          : category === "friends"
            ? this.s.friends[id]
            : true;
    this.say(known ? x?.name || "これくしょん" : "???", text);
    if (known && ["fish", "dinosaurs"].includes(category))
      this.dialog
        .querySelector("p")
        .insertAdjacentHTML(
          "beforebegin",
          `<div class="collection-icon detail-art">${this.icon(x)}</div>`,
        );
  }
  achievements() {
    this.panel(
      `<h2>できたことと ぷろふぃーるばっじ</h2><p>ばっじは3こまで。できるとじどうでごほうび！</p><div class="grid">${D.ACHIEVEMENTS.map((a) => `<button class="tile" data-a="badge:${a.id}" ${this.s.achievements[a.id] ? "" : "disabled"}><span class="name">${a.name}</span><small>${Math.min(a.target, this.s.progression.metrics[a.metric] || 0)} / ${a.target} ${this.s.player.badges.includes(a.id) ? "✓ つかっている" : ""}</small></button>`).join("")}</div><p><button data-a="collection">ぶっくへ</button></p>`,
      "wide",
    );
  }
  memories(page = 0) {
    this.memoryPage = page;
    const rows = [...this.s.memories].reverse();
    this.panel(
      `<h2>おもいであるばむ</h2><div class="grid">${
        rows
          .slice(page * 8, page * 8 + 8)
          .map(
            (m) =>
              `<div class="tile"><div class="photo">${m.friendIds.length ? "☺　☺" : "✦"}<br>${E(m.title)}</div><small>${m.date.slice(0, 10)}</small><button data-a="photo:${m.id}">${this.s.room.photos.includes(m.id) ? "✓ かざっている" : "おへやにかざる"}</button></div>`,
          )
          .join("") || "<p>これからおもいでがふえていくよ。</p>"
      }</div>${this.pagination(page, Math.ceil(rows.length / 8), "memorypage")}<button data-a="collection">ぶっくへ</button>`,
      "wide",
    );
  }
  missions() {
    R.refreshMissions(this.s);
    this.panel(
      `<h2>きょうの みっしょん</h2><p>${this.s.missions.date} ／ じぶんの ぺーすで あそぼう</p><div class="grid three">${this.s.missions.daily.map((m) => `<div class="tile"><h3>${m.name}</h3><p>${m.claimed ? "✓ できた！ +10こいん" : `${Math.min(m.target, (this.s.progression.metrics[m.metric] || 0) - m.start)} / ${m.target}`}</p></div>`).join("")}</div><p><button class="gold" data-a="chest" ${this.s.missions.completedToday || !this.s.missions.daily.every((m) => m.claimed) ? "disabled" : ""}>${this.s.missions.completedToday ? "たからばこをうけとりました" : "きょうのたからばこを あける"}</button></p><p><button data-a="island">しまへ</button></p>`,
    );
  }
  plaza() {
    this.setScene("island");
    this.panel(
      `<h2>まなびあいらんど かんせいへのみち</h2><div class="grid two">${R.masterRequirements(
        this.s,
      )
        .map(
          ([n, ok]) =>
            `<div class="tile ${ok ? "inline-check" : ""}">${ok ? "✓" : "○"} ${n}</div>`,
        )
        .join(
          "",
        )}</div><p><button class="gold" data-a="ending" ${R.masterReady(this.s) ? "" : "disabled"}>${this.s.progression.storyFlags.master ? "おいわいをもういちど" : "かんせいいべんとをはじめる"}</button></p><button data-a="island">しまへ</button>`,
    );
  }
  async ending() {
    if (!R.masterReady(this.s)) return;
    this.setScene("celebration");
    this.screen.innerHTML =
      '<h1 class="ending-title">まなびあいらんど かんせい！<br><small>みんなの おべこれますたー</small></h1><div class="scene-bar"><button data-a="endingfinish">きねんしゃしんを とる ▸</button></div>';
    this.activity = { kind: "ending", elapsed: 0 };
  }
  async endingFinish() {
    if (!this.s.progression.storyFlags.master) {
      this.s.progression.storyFlags.master = true;
      this.s.inventory.specialItems.obecolle_master = 1;
      R.remember(
        this.s,
        "master",
        "まなびあいらんどかんせい！",
        "",
        Object.keys(this.s.friends),
      );
      await this.commit();
    }
    this.island();
    this.say(
      "みんな",
      "おべこれますたー、おめでとう！\nこれからも いっしょに あそぼうね。\nきみのまいにちは、まだまだ つづくよ。",
    );
  }
  pause() {
    if (this.modalOpen) return;
    this.walkKeys.clear();
    this.modalOpen = true;
    this.world.paused = true;
    this.dialog.innerHTML = `<div class="overlay"><section class="panel small"><h2>ひとやすみ</h2><div class="grid two"><button class="primary" data-a="resume">つづける</button><button data-a="settings">せってい</button>${this.activity ? '<button data-a="restartactivity">やりなおす</button><button data-a="quitactivity">やめる</button>' : ""}<button data-a="quickhome">🏝 しまへ</button><button data-a="export">ばっくあっぷ</button><button data-a="confirmtitle">たいとるへ</button></div></section></div>`;
    this.syncInteractionState();
  }
  settings() {
    this.modalOpen = true;
    this.world.paused = true;
    this.dialog.innerHTML = `<div class="overlay"><section class="panel small"><h2>せってい</h2><p><label>BGM <input type="range" min="0" max="1" step=".05" value="${this.s.settings.music}" data-setting="music"></label></p><p><label>おと <input type="range" min="0" max="1" step=".05" value="${this.s.settings.sound}" data-setting="sound"></label></p><p>がめんのきれいさ <select data-setting="quality">${[
      ["low", "かるい"],
      ["standard", "ふつう"],
      ["high", "きれい"],
    ]
      .map(
        ([v, n]) =>
          `<option value="${v}" ${this.s.settings.quality === v ? "selected" : ""}>${n}</option>`,
      )
      .join(
        "",
      )}</select></p><p><label><input type="checkbox" data-setting="keyboard" ${this.s.settings.keyboard ? "checked" : ""}> きーぼーどがいど</label></p><div class="row"><button data-a="export">JSONほぞん</button><button data-a="importslot:${this.s.meta.slotId}">JSONふくげん</button><button data-a="quickhome">🏝 しまへ</button><button data-a="fullscreen">がめんをおおきく</button><button class="primary" data-a="resume">もどる</button></div></section></div>`;
    this.syncInteractionState();
  }
  async importSlot(slot) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      try {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 8e6) throw Error("ふぁいるがおおきすぎます");
        const text = await file.text(),
          data = JSON.parse(text),
          errors = validateSaveData(data);
        if (errors.length) throw Error(errors.slice(0, 3).join(" / "));
        this.pendingImport = { text, slot };
        this.say(
          "ばっくあっぷからふくげん",
          `せーぶ${slot}へ「${data.player.name}」をふくげんします。\nいまのでーたはpreviousほぞんへほぞんします。`,
          [
            ["ふくげんする", "importconfirm"],
            ["やめる", "closedialog"],
          ],
        );
      } catch (e) {
        this.error(e);
      }
    };
    input.click();
  }
  async importConfirm() {
    const p = this.pendingImport;
    if (!p) return;
    this.s = await this.saveManager.import(p.text, p.slot);
    this.pendingImport = null;
    this.closeDialog();
    this.island();
    this.toast("ばっくあっぷからふくげんしました");
  }
  help() {
    this.panel(
      '<h2>あそびかた</h2><p>しまのたてものやともだちをくりっくして あそぼう。<br>がっこうでまなぶと、ほし・こいん・ちけっとがもらえるよ。<br>たいぴんぐであたらしいともだち、つりやはっくつでこれくしょん！</p><p>まうす：えらぶ ／ Enter：これにする<br>Esc：ひとやすみ ／ やじるしきー：ぼたんいどう</p><p>ほぞんはじどう。たいせつなきろくはせっていからJSONばっくあっぷ。</p><button class="primary" data-a="title">たいとるへ</button>',
      "small",
    );
  }
  async change(e) {
    const el = e.target;
    if (el.dataset.appearance) {
      this.draft.appearance[el.dataset.appearance] = +el.value;
      document
        .querySelectorAll("[data-a^=faceeye]")
        .forEach((b) =>
          b.setAttribute(
            "aria-pressed",
            String(+b.dataset.a.split(":")[1] === this.draft.appearance.eyes),
          ),
        );
      this.world.set("create", this.s, { appearance: this.draft.appearance });
    }
    if (el.hasAttribute("data-outfit")) {
      this.draft.appearance.outfit = el.value;
      this.world.set("create", this.s, { appearance: this.draft.appearance });
    }
    if (el.dataset.setting) {
      const k = el.dataset.setting;
      this.s.settings[k] =
        el.type === "checkbox"
          ? el.checked
          : el.type === "range"
            ? +el.value
            : el.value;
      this.audio.music = this.s.settings.music;
      this.audio.sound = this.s.settings.sound;
      this.world.setQuality(this.s.settings.quality);
      await this.commit();
    }
    if (el.id === "rod") {
      this.s.fishing.equippedRod = el.value;
      await this.commit();
    }
    if (el.dataset.display) {
      const k = el.dataset.display,
        a = this.s.room[k],
        max = k === "aquariumFish" ? 5 : 3;
      if (el.checked) {
        if (a.length >= max) {
          el.checked = false;
          throw Error(`${max}こまで かざれるよ`);
        }
        a.push(el.value);
      } else this.s.room[k] = a.filter((x) => x !== el.value);
      await this.commit();
    }
  }
  key(e) {
    if (e.code === "Escape") {
      e.preventDefault();
      if (this.modalOpen) this.closeDialog();
      else if (this.s) this.pause();
      return;
    }
    if (
      this.interactionState().walkingEnabled &&
      !["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)
    ) {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
        ].includes(e.code)
      ) {
        e.preventDefault();
        this.walkPath = [];
        this.walkDestination = null;
        this.walkKeys.add(e.code);
        return;
      }
      if (e.code === "Enter" && this.nearDoor && !e.repeat) {
        e.preventDefault();
        this.action(this.nearDoor.id).catch((err) => this.error(err));
        return;
      }
    }
    if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (this.modalOpen && e.code === "Tab") {
      const buttons = [
        ...this.dialog.querySelectorAll("button:not(:disabled),input,select"),
      ];
      if (buttons.length) {
        e.preventDefault();
        const at = buttons.indexOf(document.activeElement);
        buttons[
          (at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length
        ].focus();
      }
      return;
    }
    if (
      this.modalOpen &&
      ["Enter", "Space"].includes(e.code) &&
      !this.dialog.contains(document.activeElement)
    ) {
      e.preventDefault();
      this.dialog.querySelector("button:not(:disabled)")?.click();
      return;
    }
    if (this.activity?.kind === "typing" && !this.modalOpen) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = /^Key[A-Z]$/.test(e.code)
        ? e.code.slice(3).toLowerCase()
        : /^Digit[0-9]$/.test(e.code)
          ? e.code.slice(5)
          : { Minus: "-", Quote: "'", Period: ".", Comma: ",", Space: " " }[
              e.code
            ];
      if (key) {
        e.preventDefault();
        if (!e.repeat) this.typeKey(key).catch((err) => this.error(err));
      }
      return;
    }
    if (
      this.activity?.kind === "fish" &&
      !this.modalOpen &&
      e.code === "Space"
    ) {
      e.preventDefault();
      if (!e.repeat) {
        if (this.activity.phase === "pull") this.activity.holding = true;
        else this.fishAction(true);
      }
      return;
    }
    if (e.code === "Enter" || e.code === "Space") {
      if (e.target.tagName === "BUTTON") return;
      const root = this.modalOpen ? this.dialog : this.screen,
        b = root.querySelector(
          "button.primary:not(:disabled),[data-a=quiznext],button:not(:disabled)",
        );
      if (b) {
        e.preventDefault();
        b.click();
      }
    }
    if (e.code.startsWith("Arrow")) {
      e.preventDefault();
      const root = this.modalOpen ? this.dialog : this.screen,
        bs = [...root.querySelectorAll("button:not(:disabled)")];
      if (bs.length) {
        let i = bs.indexOf(document.activeElement);
        i =
          (i +
            (e.code === "ArrowLeft" || e.code === "ArrowUp" ? -1 : 1) +
            bs.length) %
          bs.length;
        bs[i].focus();
      }
    }
  }
  async action(action) {
    const [a, b, c] = action.split(":");
    if (
      this.activity &&
      !this.modalOpen &&
      ["collection", "missions", "island"].includes(a)
    ) {
      this.pause();
      return;
    }
    if (a === "closedialog" || a === "resume") {
      this.closeDialog();
      return;
    }
    if (
      this.modalOpen &&
      ![
        "pause",
        "quickhome",
        "settings",
        "export",
        "importslot",
        "importconfirm",
        "confirmtitle",
        "restartactivity",
        "quitactivity",
      ].includes(a)
    )
      this.closeDialog();
    if (
      D.FACILITIES.some((f) => f.id === a) &&
      a !== "plaza" &&
      this.s &&
      !this.s.progression.unlockedFacilities.includes(a)
    ) {
      this.say(
        "もうすこしで おーぷん",
        `まなびらんく ${D.FACILITIES.find((f) => f.id === a).rank}でひらくよ。\nがっこうであたらしいすたーをあつめよう！`,
      );
      return;
    }
    switch (a) {
      case "overview":
        this.walkOverview = !this.walkOverview;
        document.querySelector("[data-a=overview]").textContent = this
          .walkOverview
          ? "じぶんを みる"
          : "しまを みわたす";
        break;
      case "faceeye": {
        const select = document.querySelector('[data-appearance="eyes"]');
        if (select) {
          select.value = b;
          await this.change({ target: select });
        }
        break;
      }
      case "walkenter":
        if (this.nearDoor) await this.action(this.nearDoor.id);
        break;
      case "title":
        this.title();
        break;
      case "slots":
        await this.slots();
        break;
      case "new":
        this.create(+b);
        break;
      case "load":
        await this.load(+b);
        break;
      case "createfinish":
        await this.createFinish();
        break;
      case "arrive":
        await this.arrive();
        break;
      case "quickhome":
        if (this.activity) {
          this.say(
            "しまへ もどる？",
            "いまの あそびを とじて しまへ もどるよ。つり・はっくつの のこりは そのまま のこるよ。",
            [
              ["しまへ もどる", "quitactivity"],
              ["つづける", "closedialog"],
            ],
          );
        } else this.island();
        break;
      case "island":
        this.island();
        break;
      case "mansion":
        this.mansion();
        break;
      case "room":
        this.room();
        break;
      case "resident":
        this.room(b === "self" ? null : b);
        break;
      case "friend":
        await this.friend(b);
        break;
      case "request":
        this.request(b);
        break;
      case "fulfill":
        R.fulfillRequest(this.s, b);
        await this.commit();
        this.say(
          D.FRIENDS.find((f) => f.id === b).name,
          "ありがとう！ なかよしど ＋5 ／ ＋20こいん",
        );
        break;
      case "gift":
        this.giftMenu(b);
        break;
      case "give":
        R.gift(this.s, b, c);
        await this.commit();
        this.room(b);
        this.say(
          D.FRIENDS.find((f) => f.id === b).name,
          "ありがとう！ おへやに かざるね。",
        );
        break;
      case "together":
        this.together(b);
        break;
      case "friendquiz":
        await this.friendQuiz(b);
        break;
      case "school":
        this.school();
        break;
      case "levels":
        this.levels(b);
        break;
      case "quiz":
        this.startQuiz(b, +c);
        break;
      case "answer":
        await this.answer(+b);
        break;
      case "quiznext":
        await this.quizNext();
        break;
      case "typing":
        this.typingLab();
        break;
      case "type":
        this.startTyping(b, +document.querySelector("#typing-level").value);
        break;
      case "typelevel":
        this.startTyping(b, +c);
        break;
      case "typeselected":
        this.startTyping("basic", +document.querySelector("#typing-level").value);
        break;
      case "speakquestion":
        this.speakQuestion();
        break;
      case "fishing":
        this.fishing();
        break;
      case "fishstart":
        await this.beginFishing(b);
        break;
      case "fishaction":
        this.fishAction();
        break;
      case "nextcast":
        this.fishingCastScreen();
        break;
      case "excavation":
        this.excavation();
        break;
      case "digstart":
        await this.beginDig(b);
        break;
      case "nextdig":
        this.digSite();
        break;
      case "digspot":
        this.chooseDigSpot(+b);
        break;
      case "dighammer":
        this.digHammer();
        break;
      case "digbrush":
        await this.digBrush();
        break;
      case "restore":
        this.restoration(b);
        break;
      case "part":
        if (this.activity?.kind === "restore") this.activity.selected = b;
        break;
      case "socket":
        await this.socket(b);
        break;
      case "arena":
        this.arena();
        break;
      case "cup":
        this.chooseCreature(b);
        break;
      case "arenastart":
        await this.startArena(
          b,
          document.querySelector("#arena-creature").value,
        );
        break;
      case "arenacontinue":
        this.arenaMatch();
        break;
      case "arenaround":
        this.arenaRoundStart();
        break;
      case "arenaknow":
        this.arenaKnowledge();
        break;
      case "arenatype":
        this.arenaTyping();
        break;
      case "battleskip":
        await this.battleEnd();
        break;
      case "shop":
        this.shop();
        break;
      case "shopcat":
        this.shop(b);
        break;
      case "shoppage":
        this.shop(this.shopCategory, +b);
        break;
      case "buy":
        R.purchase(this.s, b);
        await this.commit();
        this.toast("かえたよ！");
        break;
      case "decorate":
        this.decorate();
        break;
      case "furniture":
        if (this.roomFriend) {
          this.world.hero?.setState(["sit", "read", "type"][+b % 3]);
          this.toast("おへやで くつろいでいるよ");
        } else {
          const item = D.ITEMS.find((i) => i.id === this.s.room.slots[b]);
          if (item) {
            this.world.hero?.setState(
              item.shape === 3
                ? "read"
                : item.shape === 8
                  ? "type"
                  : item.shape === 4
                    ? "sleep"
                    : "sit",
            );
            this.toast(item.name + "で ひとやすみ");
          } else this.decorate(+b);
        }
        break;
      case "place":
        await this.place(+b);
        break;
      case "clearroom":
        this.s.room.slots = {};
        await this.commit();
        this.room();
        break;
      case "mirror":
        this.create(this.s.meta.slotId, true);
        break;
      case "wardrobe":
        this.wardrobe();
        break;
      case "wear":
        await this.wear(b);
        break;
      case "removeaccessories":
        delete this.s.player.appearance.hat;
        delete this.s.player.appearance.glasses;
        await this.commit();
        this.room();
        break;
      case "display":
        this.display();
        break;
      case "collection":
        this.collection();
        break;
      case "book":
        this.collection(b);
        break;
      case "bookpage":
        this.collection(this.category, +b);
        break;
      case "detail":
        this.detail(b, c);
        break;
      case "achievements":
        this.achievements();
        break;
      case "badge":
        if (!this.s.achievements[b]) return;
        if (this.s.player.badges.includes(b))
          this.s.player.badges = this.s.player.badges.filter((x) => x !== b);
        else {
          if (this.s.player.badges.length >= 3) throw Error("ばっじは3こまで");
          this.s.player.badges.push(b);
        }
        await this.commit();
        this.achievements();
        break;
      case "memories":
        this.memories();
        break;
      case "memorypage":
        this.memories(+b);
        break;
      case "photo":
        if (this.s.room.photos.includes(b))
          this.s.room.photos = this.s.room.photos.filter((x) => x !== b);
        else {
          if (this.s.room.photos.length >= 3)
            throw Error("しゃしんは3まいまで");
          this.s.room.photos.push(b);
        }
        const m = this.s.memories.find((x) => x.id === b);
        if (m) m.favorite = this.s.room.photos.includes(b);
        await this.commit();
        this.memories(this.memoryPage);
        break;
      case "missions":
        this.missions();
        break;
      case "chest":
        const reward = R.claimChest(this.s);
        await this.commit();
        this.say(
          "きょうのたからばこ",
          ["いつも", "ぎん", "きん"][reward.tier] +
            "のたからばこ！\n" +
            [30, 50, 80][reward.tier] +
            "こいん＋ちけっと" +
            [1, 2, 3][reward.tier] +
            "まい" +
            (reward.item ? "\n" + reward.item.name : ""),
        );
        break;
      case "plaza":
        this.plaza();
        break;
      case "ending":
        await this.ending();
        break;
      case "endingfinish":
        await this.endingFinish();
        break;
      case "pause":
        this.pause();
        break;
      case "settings":
        this.settings();
        break;
      case "export":
        await this.saveManager.save(this.s);
        this.saveManager.export(this.s);
        this.toast("ばっくあっぷをほぞんしました");
        break;
      case "importslot":
        await this.importSlot(+b);
        break;
      case "importconfirm":
        await this.importConfirm();
        break;
      case "confirmtitle":
        await this.commit();
        this.title();
        break;
      case "restartactivity":
        const old = this.activity;
        this.closeDialog();
        if (old?.kind === "typing")
          this.startTyping(old.mode, old.level, old.callback);
        else if (old?.kind === "quiz")
          this.startQuiz(old.subject, old.level, old.callback);
        else if (old?.kind === "fish") this.fishingCastScreen();
        else if (old?.kind === "dig") this.digSite();
        else this.island();
        break;
      case "quitactivity":
        this.closeDialog();
        this.activity = null;
        await this.commit();
        this.island();
        break;
      case "fullscreen":
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
        break;
      case "help":
        this.help();
        break;
      default:
        throw Error("そうさがみつかりません：" + action);
    }
  }
}
Object.assign(Game.prototype, games);
let game;
try {
  game = new Game();
  if (location.search.includes("debug=1")) window.obecolle2 = game;
  await game.init();
} catch (e) {
  console.error(e);
  document.querySelector("#screen").innerHTML =
    `<section class="panel small"><h2>げーむでえらーがおきました</h2><p>${E(e.message)}</p><button onclick="location.reload()">たいとるにもどる</button></section>`;
}
window.addEventListener("error", (e) =>
  game?.error(e.error || Error(e.message)),
);
window.addEventListener("unhandledrejection", (e) => game?.error(e.reason));
