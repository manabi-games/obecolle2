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
import { resetTransientState } from "./systems/session-state.js";
import { EYE_NAMES, eyePreview } from "./ui-face.js";
import { artLayout } from "./data/art-layout.js";
import { atlasSvg, animalIcon, appearancePortrait, friendPortrait, itemPreview } from "./ui-child.js";
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
    this.walkKeys = new Set();
    this.resetSessionState();
    this.scene = "title";
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
  resetSessionState() {
    resetTransientState(this);
    if (this.dialog) this.dialog.innerHTML = "";
  }
  panel(html, cls = "") {
    this.walkKeys.clear();
    const toast = document.querySelector("#toast"),
      recentToast =
        toast?.classList.contains("show") &&
        performance.now() - (this.toastShownAt || 0) < 1500
          ? toast.textContent
          : "";
    this.clearToast();
    this.screen.innerHTML = `<section class="panel ${cls}">${html}</section>`;
    this.syncInteractionState();
    if (recentToast) this.toast(recentToast);
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
    const panelOpen = !!this.screen.querySelector(".panel");
    const dialogOpen = this.modalOpen && !!this.dialog.querySelector(".dialog");
    const overlayOpen = !!this.dialog.querySelector(".overlay");
    document.body.classList.toggle("panel-open", panelOpen);
    document.body.classList.toggle("dialog-open", dialogOpen);
    document.body.classList.toggle("overlay-open", overlayOpen);
    return state;
  }
  setScene(name, params = {}) {
    if (performance.now() - (this.toastShownAt || 0) >= 1500)
      this.clearToast();
    this.walkKeys.clear();
    this.walkPath = [];
    this.walkDestination = null;
    this.nearDoor = null;
    this.nearFriend = null;
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
    const p = this.s.progression,
      activeFriends = D.ACTIVE_FRIENDS.filter((f) => !!this.s.friends[f.id]).length;
    this.hud.innerHTML = `<div class="profile">${E(this.s.player.name)}<small>まなびらんく ${p.manabiRank} ／ ともだち ${activeFriends} / 10</small></div><div class="wallet"><span>◉ ${p.coins}</span><span>★ ${p.stars}</span></div><div class="hud-actions"><button data-a="room">🏠 おへや</button><button data-a="collection">📖 ずかん</button><button data-a="pause">☰</button></div>`;
  }
  featuredShopItem(item) {
    if (item?.rewardOnly) return true;
    const id = String(item?.id || ""),
      n = Number(id.split("_")[1]);
    if (item?.type === "furniture") return Number.isInteger(n) && n < 10;
    if (item?.type === "clothing")
      return Number.isInteger(n) && n % 8 === 0 && n <= 32;
    if (id.startsWith("hat_")) return Number.isInteger(n) && n % 4 === 0;
    if (id.startsWith("glasses_")) return n === 0 || n === 5;
    if (item?.type === "wallpaper" || item?.type === "floor")
      return Number.isInteger(n) && n < 4;
    return true;
  }
  friendVoiceProfile(id) {
    return D.ACTIVE_FRIENDS.find((f) => f.id === id)?.voice || {
      rate: 0.86,
      pitch: 1,
      voiceIndex: 0,
    };
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
  clearToast() {
    const e = document.querySelector("#toast");
    clearTimeout(this.toastTimer);
    this.toastShownAt = 0;
    if (e) {
      e.classList.remove("show");
      e.textContent = "";
    }
  }
  toast(text) {
    const e = document.querySelector("#toast");
    if (!e) return;
    e.textContent = text;
    e.classList.add("show");
    this.toastShownAt = performance.now();
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      e.classList.remove("show");
      this.toastShownAt = 0;
    }, 4800);
  }
  error(e) {
    console.error(e);
    this.toast(e.message || String(e));
  }
  title() {
    this.resetSessionState();
    this.s = null;
    this.setScene("title");
    document.querySelector("#labels").classList.add("hidden");
    this.screen.innerHTML =
      '<div class="title-box"><div class="subtitle">まなぶ。くらす。あつめる。</div><h1>おべんきょ<br>これくしょん<b>2</b></h1><p>きみのまいにちが、しまをそだてる。</p><button class="primary" data-a="slots">はじめる</button><button data-a="help">あそびかた</button></div><div class="version">おべこれ2　Version 1.6.0 ／ PC・きーぼーどであそぼう</div>';
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
      `<div class="row spread panel-heading"><div><h2>きみの ぼうけんを えらぼう</h2><p>つづきからでも、あたらしくでも だいじょうぶ。</p></div><button data-a="title">たいとるへ</button></div><div class="grid three slot-grid">${slots.map((x) => `<div class="tile slot-card"><h3>せーぶ ${x.id}</h3>${x.data ? `${appearancePortrait(x.data.player.appearance, null, false, x.data.player.name)}<p>${E(x.data.player.name)}</p><small>らんく${x.data.progression.manabiRank} ／ ともだち${D.ACTIVE_FRIENDS.filter((f) => !!x.data.friends[f.id]).length}にん</small><small>${E(x.data.meta.updatedAt.slice(0, 10))}${x.recovered ? " ／ まえの せーぶから もどしたよ" : ""}</small><button class="primary" data-a="load:${x.id}">つづきから</button>` : x.error ? `<div class="slot-error">！</div><p>せーぶを よめません</p><small>${E(x.error)}</small>` : `<div class="slot-new">＋</div><p>あたらしい おはなし</p><button class="primary" data-a="new:${x.id}">はじめる</button>`}<button class="muted-button" data-a="importslot:${x.id}">ばっくあっぷから もどす</button></div>`).join("")}</div><p class="adult-note">おとなのひとへ：ばっくあっぷは JSONふぁいるを つかいます。</p>`,
      "wide child-grid-panel slots-panel",
    );
  }
  async load(slot) {
    const loaded = await this.saveManager.load(slot);
    if (!loaded) throw Error("せーぶがありません");
    this.resetSessionState();
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
    if (!editing) this.resetSessionState();
    this.editing = editing;
    this.draft = editing ? R.clone(this.s.player) : R.newSave(slot).player;
    this.newSlot = slot;
    this.creatorPage = 0;
    this.setScene("create", { appearance: this.draft.appearance });
    this.creator(0);
  }
  creator(page = 0) {
    this.creatorPage = Math.max(0, Math.min(3, Number(page) || 0));
    const a = this.draft.appearance,
      names = {
        skin: ["ややしろめ", "ふつう", "げんき", "こむぎいろ", "こいめ"],
        face: ["まんまる", "ほっそり", "しかく", "おもち", "たまご", "ほっぺ"],
        hair: ["しょーと", "ふんわり", "よこわけ", "まえがみしょーと", "みでぃあむ", "そとはね", "かーる", "せんたー", "ぼぶ", "ろんぐ", "ぽにーてーる", "ついん"],
        hairColor: ["こげちゃ", "くろ", "ちゃ", "あかるいちゃ", "あかちゃ", "あお", "ぐれー", "きん"],
        eyes: ["ぱっちり", "にっこり", "おこりんぼ", "たれめ", "つりめ", "ねむねむ", "まんまる", "ほそめ", "ういんく", "まつげ", "びっくり", "じとめ"],
        brows: ["まっすぐ", "きりっ", "こまり", "ぐいっ", "はのじ"],
        nose: ["ちいさめ", "だんご", "しかく", "とんがり", "ぺちゃんこ"],
        mouth: ["ちょこん", "にっこり", "へのじ", "びっくり", "にやり", "にっ", "むすっ", "おおわらい"],
      },
      control = (key, label) => `<div class="creator-control"><strong>${label}</strong><div class="row"><button data-a="cycleappearance:${key}:-1">◀</button><span>${E(names[key][a[key] || 0])}</span><button data-a="cycleappearance:${key}:1">▶</button></div></div>`,
      outfits = D.ITEMS.filter(
        (i) =>
          i.type === "clothing" &&
          (this.editing ? this.s.inventory.clothing[i.id] : +i.id.split("_")[1] < 8),
      ),
      outfitIndex = Math.max(0, outfits.findIndex((i) => i.id === a.outfit)),
      pages = [
        `<div class="creator-controls"><div class="appearance-row"><label>なまえ</label><input id="player-name" maxlength="8" value="${E(this.draft.name || "")}" placeholder="1〜8もじ"></div>${control("skin", "はだ")}${control("face", "かお")}</div>`,
        `<div class="creator-controls">${control("hair", "かみがた")}${control("hairColor", "かみのいろ")}</div>`,
        `<div class="creator-controls">${control("eyes", "め")}${control("brows", "まゆ")}${control("nose", "はな")}${control("mouth", "くち")}</div>`,
        `<div class="creator-controls"><div class="creator-control"><strong>ふく</strong><div class="row"><button data-a="cycleoutfit:-1">◀</button>${itemPreview(outfits[outfitIndex])}<span>${E(outfits[outfitIndex]?.name || "ふく")}</span><button data-a="cycleoutfit:1">▶</button></div></div></div>`,
      ];
    this.panel(
      `<div class="row spread panel-heading"><div><h2>${this.editing ? "じぶんを あれんじ" : "きみは どんなこ？"}</h2><p>${this.creatorPage + 1} / 4</p></div><button data-a="creatorcancel">やめる</button></div>${pages[this.creatorPage]}<div class="creator-dots">${[0,1,2,3].map((i) => `<button class="${i === this.creatorPage ? "active" : ""}" data-a="creatorpage:${i}">${i + 1}</button>`).join("")}</div><div class="row creator-actions">${this.creatorPage > 0 ? `<button data-a="creatorpage:${this.creatorPage - 1}">◀ まえ</button>` : ""}${this.creatorPage < 3 ? `<button class="primary" data-a="creatorpage:${this.creatorPage + 1}">つぎ ▶</button>` : `<button class="primary" data-a="createfinish">${this.editing ? "これにする" : "しまへ しゅっぱつ！"}</button>`}</div>`,
      "right creator-panel",
    );
  }
  async createFinish() {
    const name = String(this.draft?.name || "").trim();
    if (!name || [...name].length > 8 || /[<>]/.test(name))
      throw Error("なまえを1〜8もじでいれてね");
    this.draft.name = name;
    if (this.editing) {
      this.s.player = { ...this.s.player, ...this.draft };
      this.draft = null;
      this.editing = false;
      this.newSlot = null;
      await this.commit();
      return this.room();
    }
    const slot = this.newSlot,
      appearance = structuredClone(this.draft.appearance),
      outfit = appearance.outfit;
    this.resetSessionState();
    this.s = R.newSave(slot, name, appearance);
    this.s.inventory.clothing[outfit] = 1;
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
    this.companion = null;
    this.setScene("island");
    this.screen.innerHTML = `<div class="scene-bar walk-bar">
      <span class="walk-guide"><strong>まちを あるこう</strong><small>↑ ↓ ← → ／ W A S D　ちかづくと おはなし・はいる ができるよ</small></span>
      <button class="primary" id="walk-talk" data-a="walktalk" disabled>ともだちと はなす</button>
      <button id="walk-enter" data-a="walkenter" disabled>はいる</button>
    </div>`;
    this.syncInteractionState();
    if (this.noticeQueue.length) {
      const m = this.noticeQueue.shift(),
        friend = D.ACTIVE_FRIENDS.find((f) => f.id === m.subjectId);
      if (!friend) return;
      this.world.set("arrival", this.s, { friend: m.subjectId });
      this.syncInteractionState();
      this.world.hero?.setState("happy");
      this.say(
        friend.name,
        `はじめまして！ ${friend.name}だよ。\nこれから まちで いっぱい おはなししようね！`,
        [["よろしく！", "closedialog"]],
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
      blend = Math.min(1, dt * 5.5);
    camera.position.x += (p.x + 6.8 - camera.position.x) * blend;
    camera.position.y += (8.8 - camera.position.y) * blend;
    camera.position.z += (p.z + 11.5 - camera.position.z) * blend;
    this.world.target.x += (p.x - this.world.target.x) * blend;
    this.world.target.y += (1.1 - this.world.target.y) * blend;
    this.world.target.z += (p.z - this.world.target.z) * blend;
    camera.lookAt(this.world.target);

    this.nearDoor = doors.find(
      (f) => Math.hypot(f.x - p.x, f.z - p.z) < 1.45,
    );
    const nearbyFriend = this.world.targets.find(
      (t) =>
        String(t.userData.action || "").startsWith("friend:") &&
        t !== hero &&
        Math.hypot(t.position.x - p.x, t.position.z - p.z) < 2.6,
    );
    this.nearFriend = nearbyFriend?.userData.action || null;

    const talkButton = document.querySelector("#walk-talk");
    if (talkButton) {
      talkButton.disabled = !this.nearFriend;
      const id = this.nearFriend?.split(":")[1],
        friend = D.ACTIVE_FRIENDS.find((f) => f.id === id);
      talkButton.textContent = friend ? `${friend.name}と はなす` : "ともだちと はなす";
    }
    const enterButton = document.querySelector("#walk-enter");
    if (enterButton) {
      enterButton.disabled = !this.nearDoor;
      enterButton.textContent = this.nearDoor
        ? `${this.nearDoor.name}へ はいる`
        : "はいる";
    }
    if (this.walkDestination && !this.walkPath.length) {
      const dest = this.walkDestination;
      this.walkDestination = null;
      this.action(dest).catch((e) => this.error(e));
    }
  }
  nextGoal() {
    const friends = D.ACTIVE_FRIENDS.filter((f) => !!this.s.friends[f.id]).length;
    if (this.s.dinosaurs.completedCount < 30)
      return `たいぴんぐはっくつで きょうりゅう ${this.s.dinosaurs.completedCount} / 30。つぎの かせきを みつけよう！`;
    if (friends < 10)
      return "まちには まだ あっていない ともだちが いるよ。たいぴんぐや がくしゅうを つづけよう！";
    return "まちを あるいて、ともだちと おはなししよう！";
  }
  mansion() {
    this.setScene("mansion");
    this.screen.innerHTML =
      '<div class="scene-bar"><button data-a="island">まちへ</button><button class="primary" data-a="room">じぶんのへや</button></div>';
    this.syncInteractionState();
  }
  room(friend = null) {
    if (
      friend &&
      (!this.s.friends[friend] || !D.FRIENDS.some((f) => f.id === friend))
    )
      throw Error("ともだちの おへやが みつからないよ");
    this.roomFriend = friend;
    this.setScene("room", { friend });
    this.screen.innerHTML = `<div class="scene-bar"><button data-a="mansion">まんしょんへ</button>${friend ? `<button class="primary" data-a="friend:${friend}">おはなし</button>` : '<button data-a="decorate">もようがえ</button><button data-a="wardrobe">きせかえ</button><button data-a="display">これくしょんを かざる</button>'}</div>`;
    this.syncInteractionState();
  }
  say(name, text, choices = [["つづける", "closedialog"]]) {
    const toast = document.querySelector("#toast");
    if (
      toast?.classList.contains("show") &&
      performance.now() - (this.toastShownAt || 0) < 1500
    )
      this.deferredToast = toast.textContent;
    this.clearToast();
    this.walkKeys.clear();
    this.modalOpen = true;
    this.world.paused = false;
    this.dialog.innerHTML = `<div class="dialog"><h2>${E(name)}</h2><p>${E(text)}</p><div class="row">${choices
      .slice(0, 3)
      .map(([label, a]) => `<button data-a="${a}">${E(label)}</button>`)
      .join("")}</div></div>`;
    this.syncInteractionState();

    const friend = D.ACTIVE_FRIENDS.find((f) => f.name === name);
    if (friend) {
      const spoken = String(text)
        .replace(/[♥♡★☆✓✨]/g, "")
        .replace(/\n+/g, "。")
        .replace(/\s+/g, " ")
        .trim();
      if (spoken)
        setTimeout(
          () => this.audio.speak(spoken, "ja-JP", this.friendVoiceProfile(friend.id)),
          40,
        );
    }
  }
  closeDialog() {
    this.audio.stopSpeech?.();
    const deferred = this.deferredToast;
    this.deferredToast = null;
    this.dialog.innerHTML = "";
    this.modalOpen = false;
    this.world.paused = false;
    if (shouldRestoreIsland(this.scene, this.world.name)) {
      this.island();
      if (deferred) this.toast(deferred);
      return;
    }
    this.syncInteractionState();
    if (deferred) this.toast(deferred);
  }
  async friend(id, advance = false) {
    const data = D.ACTIVE_FRIENDS.find((f) => f.id === id);
    if (!data || !this.s.friends[id]) return;
    if (!advance) {
      R.talk(this.s, id);
      await this.commit();
    }
    this.roomFriend = id;
    this.world.hero?.setState("wave");
    const lines = data.lines?.length ? data.lines : ["こんにちは！"],
      hadLine = Object.prototype.hasOwnProperty.call(this.friendLineIndex, id),
      current = hadLine ? Number(this.friendLineIndex[id]) : -1,
      lineIndex = (current + 1) % lines.length;
    this.friendLineIndex[id] = lineIndex;
    this.say(
      data.name,
      lines[lineIndex],
      [
        ["もうちょっと はなす", "friendmore:" + id],
        ["おねがい ある？", "request:" + id],
        ["またね", "closedialog"],
      ],
    );
  }
  hearts(n) {
    const h = n >= 95 ? 5 : n >= 80 ? 4 : Math.floor(n / 20);
    return "♥".repeat(h) + "♡".repeat(5 - h);
  }
  async request(id) {
    const friend = D.FRIENDS.find((f) => f.id === id);
    if (!friend || !this.s.friends[id])
      throw Error("ともだちが みつからないよ");
    const r = R.requestFriend(this.s, id),
      names = {
        learning: "がっこうで5もん",
        typing: "たいぴんぐ",
        fish: "さかなをつる",
        dig: "ほるばしょをしらべる",
      };
    await this.commit();
    const progress = Math.max(
        0,
        (this.s.progression.metrics[r.metric] || 0) - r.start,
      ),
      done = progress >= r.target;
    this.say(
      friend.name,
      `${names[r.metric]}を ${r.target}かい おねがい！
いま ${Math.min(r.target, progress)} / ${r.target}${done ? "\nできた！ ほうこくしよう。" : ""}`,
      done
        ? [
            ["できたよ！", "fulfill:" + id],
            ["またくるね", "closedialog"],
          ]
        : [["わかった！", "closedialog"]],
    );
  }
  giftMenu(id, page = 0) {
    this.closeDialog();
    const friend = D.FRIENDS.find((f) => f.id === id);
    if (!friend || !this.s.friends[id])
      throw Error("ともだちが みつからないよ");
    const items = D.ITEMS.filter(
        (i) =>
          i.type === "furniture" &&
          this.featuredShopItem(i) &&
          R.availableFurnitureCount(this.s, i.id) > 0,
      ),
      pages = Math.max(1, Math.ceil(items.length / 8));
    page = Number.isInteger(Number(page)) ? Number(page) : 0;
    page = Math.max(0, Math.min(pages - 1, page));
    this.giftFriend = id;
    this.giftPage = page;
    this.panel(
      `<div class="row spread panel-heading"><h2>${friend.name}へ ぷれぜんと</h2><button data-a="resident:${id}">もどる</button></div><div class="grid gift-grid">${items.slice(page * 8, page * 8 + 8).map((i) => `<button class="tile" data-a="give:${id}:${i.id}">${itemPreview(i)}<span class="name">${E(i.name)}</span><small>おくれる ${R.availableFurnitureCount(this.s, i.id)}こ</small></button>`).join("") || "<p>おへやで つかっていない かぐが ないよ。</p>"}</div>${items.length ? this.pagination(page, pages, "giftpage") : ""}`,
      "wide child-grid-panel gift-panel",
    );
  }
  together(id) {
    this.closeDialog();
    this.panel(
      `<h2>${D.FRIENDS.find((f) => f.id === id).name}と あそぼう</h2><div class="row"><button data-a="friendquiz:${id}">いっしょに くいず</button>${this.s.progression.manabiRank >= 4 ? `<button data-a="togetherfishing:${id}">いっしょに つり</button>` : ""}${this.s.progression.manabiRank >= 6 ? `<button data-a="togetherdig:${id}">いっしょに はっくつ</button>` : ""}<button data-a="resident:${id}">もどる</button></div>`,
      "small",
    );
  }
  addCompanion() {
    if (!this.companion) return;
    const f = D.FRIENDS.find((f) => f.id === this.companion);
    if (f)
      this.world.human(
        { ...f.baseAppearance, outfit: "clothing_" + f.defaultOutfit },
        -3,
        2,
        "wave",
      );
  }
  companionReward(activity) {
    if (!this.companion) return;
    const id = this.companion;
    this.companion = null;
    if (!this.s.friends[id]) return;
    this.s.friends[id].affinity = Math.min(
      100,
      this.s.friends[id].affinity + 4,
    );
    R.friendMilestone(this.s, id);
    R.remember(this.s, "together", "いっしょに" + activity, id, [id]);
  }
  async friendQuiz(id) {
    const data = D.FRIENDS.find((f) => f.id === id),
      friend = this.s.friends[id];
    if (!data || !friend) throw Error("ともだちが みつからないよ");
    const subject = data.strongSubject,
      maxLevel = D.SUBJECTS.find((x) => x.id === subject).maxLevel,
      friendshipLevel =
        1 + Math.floor((Math.min(100, friend.affinity) / 100) * (maxLevel - 1)),
      level = Math.max(
        1,
        Math.min(this.s.learning[subject].unlocked, friendshipLevel),
      );
    this.startQuiz(subject, level, async () => {
      this.s.friends[id].affinity = Math.min(
        100,
        this.s.friends[id].affinity + 3,
      );
      R.friendMilestone(this.s, id);
      R.remember(
        this.s,
        "together",
        `いっしょに${D.SUBJECTS.find((x) => x.id === subject).name} Lv${level}`,
        id,
        [id],
      );
      await this.commit();
      this.room(id);
      this.say(
        data.name,
        `いっしょに Lv${level}を かんがえたよ！ なかよしど ＋3`,
      );
    });
  }
  school() {
    this.setScene("school");
    const subjects = D.SUBJECTS.filter((x) => D.CORE_SUBJECT_IDS.includes(x.id));
    this.panel(
      `<div class="row spread panel-heading"><div><h2>まなびがっこう</h2><p>3つから えらぼう。</p></div><button data-a="island">まちへ</button></div><div class="grid school-grid core-school-grid">${subjects.map((x) => {
        const learned = Object.values(this.s.learning[x.id].levels).reduce(
          (sum, row) => sum + (row.stars || 0),
          0,
        );
        return `<button class="tile core-subject" data-a="levels:${x.id}"><span class="icon">${x.icon}</span><strong>${x.name}</strong><small>Lv ${Math.min(x.maxLevel, this.s.learning[x.id].unlocked)} / ${x.maxLevel}</small><small>★ ${learned}</small></button>`;
      }).join("")}</div>`,
      "wide child-grid-panel school-panel",
    );
  }
  levels(subject, page = null) {
    this.closeDialog();
    const info = D.SUBJECTS.find((x) => x.id === subject);
    if (!info || !D.CORE_SUBJECT_IDS.includes(subject) || !this.s.learning[subject])
      throw Error("がくしゅうが みつからないよ");
    const b = this.s.learning[subject],
      unlocked = Math.max(1, Math.min(info.maxLevel, b.unlocked)),
      pageSize = 6,
      pages = Math.ceil(info.maxLevel / pageSize);
    if (page === null || page === undefined)
      page = Math.floor((unlocked - 1) / pageSize);
    page = Math.max(0, Math.min(pages - 1, Number(page) || 0));
    this.learningPage = page;
    const levels = Array.from(
      { length: Math.min(pageSize, info.maxLevel - page * pageSize) },
      (_, i) => page * pageSize + i + 1,
    );
    this.panel(
      `<div class="row spread panel-heading"><div><h2>${info.name}</h2><p>いま Lv ${unlocked}。6こずつ みられるよ。</p></div><button data-a="school">がくしゅうを えらぶ</button></div><div class="grid level-grid compact-level-grid">${levels.map((lv) => {
        const stars = b.levels[lv]?.stars || 0,
          title = LEARNING_STEPS[subject]?.[lv - 1] || "";
        return `<button data-a="quiz:${subject}:${lv}" ${lv > unlocked ? "disabled" : ""}><strong>Lv ${lv}</strong>${title ? `<small class="step-title">${title}</small>` : ""}<small>${"★".repeat(stars)}${"☆".repeat(3 - stars)}</small><small>${lv > unlocked ? "🔒 まだ" : stars ? "もういちど" : lv === unlocked ? "▶ いま ここ" : "ちょうせん"}</small></button>`;
      }).join("")}</div>${pages > 1 ? this.pagination(page, pages, `levelpage:${subject}`) : ""}`,
      "wide child-grid-panel levels-panel",
    );
  }
  typingLab(page = null) {
    this.setScene("typing");
    const t = this.s.typing,
      maxLevel = 30,
      unlocked = Math.max(1, Math.min(maxLevel, t.level)),
      pageSize = 6,
      pages = Math.ceil(maxLevel / pageSize);
    if (page === null || page === undefined)
      page = Math.floor((unlocked - 1) / pageSize);
    page = Math.max(0, Math.min(pages - 1, Number(page) || 0));
    this.typingPage = page;
    const levels = Array.from(
      { length: Math.min(pageSize, maxLevel - page * pageSize) },
      (_, i) => page * pageSize + i + 1,
    );
    this.panel(
      `<div class="row spread panel-heading"><div><h2>⛏️ たいぴんぐはっくつ</h2><p>いまの ちそう：Lv ${unlocked} / 30</p></div><div class="row"><span class="pill">🦖 ${this.s.dinosaurs.completedCount} / 30</span><button data-a="island">まちへ</button></div></div><div class="dig-current"><div><small>つぎの はっくつ</small><strong>ちそう Lv ${unlocked}</strong><span>5つの ことばで いわを くだこう</span></div><button class="primary" data-a="typelevel:basic:${unlocked}">はっくつする！</button></div><div class="grid dig-levels compact-dig-levels">${levels.map((lv) => {
        const dino = D.DINOS[lv - 1],
          found = !!this.s.dinosaurs.fossilBook[dino?.id]?.completed,
          locked = lv > unlocked;
        return `<button data-a="typelevel:basic:${lv}" ${locked ? "disabled" : ""}><strong>Lv ${lv}</strong><small>${found ? "🦖 " + E(dino.name) : locked ? "🔒 まだ" : "▶ いま ここ"}</small></button>`;
      }).join("")}</div>${this.pagination(page, pages, "typingpage")}<div class="row collection-footer"><button data-a="book:dinosaurs">きょうりゅうずかん</button></div>`,
      "wide child-grid-panel typing-lab-panel",
    );
  }
  fishing(friend = null) {
    this.setScene("fishing", { area: this.s.fishing.trip?.area || "water_0" });
    const active = this.s.fishing.trip,
      areas = D.FISH_AREAS.filter((a) => this.s.fishing.unlockedAreas.includes(a.id)),
      rods = D.RODS.filter((r) => this.s.fishing.ownedRods.includes(r.id));
    this.panel(
      `<div class="row spread panel-heading"><div><h2>つりみなと</h2><p>${active ? `いまは ${D.FISH_AREAS.find((a) => a.id === active.area)?.name}で のこり${active.remaining}かい` : "つりばと つりざおを えらぼう。"}</p></div><button data-a="island">まちへ</button></div><div class="rod-picker"><strong>つりざお</strong>${rods.map((r) => `<button class="${r.id === this.s.fishing.equippedRod ? "selected" : ""}" data-a="equiprod:${r.id}:${friend || ""}">${itemPreview(r)}<span>${E(r.name)}</span></button>`).join("")}</div><div class="grid fishing-area-grid">${areas.map((a) => {
        const blocked = active && active.area !== a.id;
        return `<button class="tile" data-a="fishstart:${a.id}:${friend || ""}" ${blocked ? "disabled" : ""}><span class="icon">🎣</span><strong>${a.name}</strong><small>${active?.area === a.id ? `つづきから ／ のこり${active.remaining}かい` : blocked ? "いまの つりを おわらせよう" : `らんく${a.rank}${a.species ? "・さかな" + a.species + "しゅるい" : ""}`}</small></button>`;
      }).join("")}</div><div class="row"><button data-a="book:fish">さかなずかん</button><button data-a="display:fish">おへやの すいそう</button></div>`,
      "wide child-grid-panel fishing-panel",
    );
  }
  excavation(friend = null) {
    this.setScene("excavation", { area: this.s.dinosaurs.trip?.area || "dig_0" });
    const active = this.s.dinosaurs.trip,
      areas = D.DIG_AREAS.filter((a) => this.s.dinosaurs.unlockedAreas.includes(a.id));
    this.panel(
      `<div class="row spread panel-heading"><div><h2>はっくつしま</h2><p>${active ? `いまは ${D.DIG_AREAS.find((a) => a.id === active.area)?.name}で のこり${active.remaining}かい` : "ほる ばしょを えらぼう。"}</p></div><button data-a="island">まちへ</button></div><div class="grid excavation-area-grid">${areas.map((a) => {
        const blocked = active && active.area !== a.id;
        return `<button class="tile" data-a="digstart:${a.id}:${friend || ""}" ${blocked ? "disabled" : ""}><span class="icon">⛏️</span><strong>${a.name}</strong><small>${active?.area === a.id ? `つづきから ／ のこり${active.remaining}かい` : blocked ? "いまの はっくつを おわらせよう" : `らんく${a.rank}${a.completed ? "・ふくげん" + a.completed + "しゅるい" : ""}`}</small></button>`;
      }).join("")}</div><p class="muted">どこを えらんでも だいじょうぶ。はんまーと ぶらしで みつけよう！</p><div class="row"><button data-a="book:dinosaurs">きょうりゅうずかん</button></div>`,
      "wide child-grid-panel excavation-panel",
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
    const active = this.s.arena.active,
      activeCup = active && D.TOURNAMENTS.find((c) => c.id === active.cup);
    this.panel(
      `<div class="row spread panel-heading"><div><h2>さいきょうありーな</h2><p>いきものの つよさ・がくしゅう・ちしき・たいぴんぐ。4つの ちからで しょうぶ！</p></div><button data-a="island">まちへ</button></div>${active ? `<p>いまのたいかいを おわらせてから、つぎのたいかいをえらべるよ。</p><p><button class="primary" data-a="arenacontinue">${activeCup.name} ${active.wins + 1}しあいめを つづける</button></p>` : ""}<div class="grid three arena-cup-grid">${D.TOURNAMENTS.map((c) => {
        const requirement =
          c.id === "cup_2"
            ? "・きょうりゅう10しゅるい"
            : c.id === "cup_3"
              ? "・うみのいきもの1しゅるい"
              : c.id === "cup_4"
                ? "・こだいいきもの1しゅるい"
                : "・いきもの1しゅるい";
        return `<button data-a="cup:${c.id}" ${this.s.arena.unlockedTournaments.includes(c.id) && !active ? "" : "disabled"}>${c.name}<small>${active ? "いまのたいかいを つづけよう" : this.s.arena.clearedTournaments.includes(c.id) ? "🏆 ゆうしょうずみ" : "らんく" + c.rank + requirement}</small></button>`;
      }).join("")}</div>`,
      "wide child-grid-panel arena-menu-panel",
    );
  }
  chooseCreature(cup, page = this.arenaPickPage || 0) {
    const cupInfo = D.TOURNAMENTS.find((c) => c.id === cup);
    if (!cupInfo || !this.s.arena.unlockedTournaments.includes(cup))
      throw Error("この たいかいは まだ えらべないよ");
    R.assertArenaStartAllowed(this.s, cup);
    const all = this.ownedCreatures().filter((c) => R.arenaEligible(cup, c)),
      pages = Math.max(1, Math.ceil(all.length / 6));
    if (!all.length) {
      this.panel(
        `<h2>${cupInfo.name}</h2><p>このたいかいに でられる いきものを まだ もっていないよ。</p><button data-a="arena">もどる</button>`,
        "small",
      );
      return;
    }
    page = Number.isInteger(Number(page)) ? Number(page) : 0;
    page = Math.max(0, Math.min(pages - 1, page));
    this.arenaCup = cup;
    this.arenaPickPage = page;
    if (!all.some((c) => c.id === this.arenaCreature))
      this.arenaCreature = all[0].id;
    const rows = all.slice(page * 6, page * 6 + 6);
    this.panel(
      `<div class="row spread panel-heading"><div><h2>${cupInfo.name}</h2><p>いっしょに たたかう なかまを えらぼう。</p></div><button data-a="arena">もどる</button></div><div class="arena-creature-grid">${rows.map((c) => `<button class="${c.id === this.arenaCreature ? "selected" : ""}" data-a="arenapick:${c.id}"><div class="collection-icon">${this.icon(c)}</div><strong>${E(c.name)}</strong><small>${c.id === this.arenaCreature ? "✓ このなかま" : "えらぶ"}</small></button>`).join("")}</div>${pages > 1 ? this.pagination(page, pages, "arenapage") : ""}<button class="primary" data-a="arenastart:${cup}">このなかまで さんか！</button>`,
      "wide child-grid-panel arena-pick-panel",
    );
  }
  shop(category = "clothing", page = 0) {
    const allowed = ["clothing", "furniture", "accessories", "interior"];
    if (!allowed.includes(category)) category = "clothing";
    this.setScene("shop");
    const rows = D.ITEMS.filter((i) => !i.rewardOnly)
      .filter((i) =>
        category === "accessories"
          ? i.type === "accessories"
          : category === "interior"
            ? ["wallpaper", "floor"].includes(i.type)
            : i.type === category,
      )
      .filter((i) => this.featuredShopItem(i)),
      pages = Math.max(1, Math.ceil(rows.length / 6)),
      owned = (i) =>
        i.type === "furniture"
          ? false
          : ["wallpaper", "floor"].includes(i.type)
            ? !!this.s.inventory.specialItems[i.id]
            : !!this.s.inventory[i.type]?.[i.id];
    page = Math.max(0, Math.min(pages - 1, Number(page) || 0));
    this.shopCategory = category;
    this.shopPage = page;
    this.panel(
      `<div class="row spread panel-heading"><div><h2>しょっぷ</h2><p>おなじ みための いろちがいは へらして、えらびやすくしたよ。</p></div><span class="panel-balance">◉ ${this.s.progression.coins}</span><button data-a="island">まちへ</button></div>
      <div class="tabs">${[
        ["clothing", "ふく"],
        ["furniture", "かぐ"],
        ["accessories", "ぼうし・めがね"],
        ["interior", "かべ・ゆか"],
      ].map(([id, n]) => `<button class="${id === category ? "active" : ""}" data-a="shopcat:${id}">${n}</button>`).join("")}</div>
      <div class="grid shop-grid">${rows.slice(page * 6, page * 6 + 6).map((i) => {
        const requirement = D.itemRequirement(i.id, this.s),
          hasIt = owned(i),
          locked =
            this.s.progression.manabiRank < i.rank ||
            !!requirement ||
            this.s.progression.coins < i.price ||
            hasIt;
        return `<div class="tile shop-tile"><div class="shop-preview">${itemPreview(i)}</div><span class="name">${E(i.name)}</span><small>${i.price} こいん</small><button data-a="buy:${i.id}" ${locked ? "disabled" : ""}>${hasIt ? "✓ もってる" : this.s.progression.coins < i.price ? "こいんが たりない" : "かう"}</button></div>`;
      }).join("")}</div>${pages > 1 ? this.pagination(page, pages, "shoppage") : ""}`,
      "wide child-grid-panel shop-panel",
    );
  }
  pagination(page, pages, action) {
    return `<div class="pagination"><button data-a="${action}:${page - 1}" ${page <= 0 ? "disabled" : ""}>◀</button><span>${page + 1} / ${Math.max(1, pages)}</span><button data-a="${action}:${page + 1}" ${page >= pages - 1 ? "disabled" : ""}>▶</button></div>`;
  }
  decorate() {
    this.roomFriend = null;
    const items = D.ITEMS.filter(
      (i) =>
        i.type === "furniture" &&
        this.featuredShopItem(i) &&
        R.availableFurnitureCount(this.s, i.id) > 0,
    );
    if (!this.decorateItem || !items.some((i) => i.id === this.decorateItem))
      this.decorateItem = items[0]?.id || null;
    const slotNames = [
      "うしろ・ひだり",
      "うしろ・まんなか",
      "うしろ・みぎ",
      "まえ・ひだり",
      "まえ・まんなか",
      "まえ・みぎ",
    ];
    this.panel(
      `<div class="row spread panel-heading"><div><h2>へやの もようがえ</h2><p>① かぐを えらぶ → ② おきたい ばしょを えらぶ</p></div><button data-a="room">おへやへ</button></div>${items.length ? `<div class="furniture-picker">${items.map((i) => `<button class="${i.id === this.decorateItem ? "selected" : ""}" data-a="pickfurniture:${i.id}">${itemPreview(i)}<small>${E(i.name)} ／ つかえる ${R.availableFurnitureCount(this.s, i.id)}こ</small></button>`).join("")}</div>` : '<p class="muted">あたらしく おける かぐは ないよ。いま おいている かぐは したから かたづけられるよ。</p>'}<div class="room-slot-map">${Array.from({ length: 6 }, (_, i) => {
        const item = D.ITEMS.find((x) => x.id === this.s.room.slots[i]);
        return `<div class="room-slot-wrap slot-${i}"><button class="room-slot" data-a="place:${i}"><strong>${slotNames[i]}</strong>${item ? itemPreview(item) + `<small>${E(item.name)}</small>` : '<span class="empty-slot">＋</span><small>あいている</small>'}</button>${item ? `<button class="slot-clear" data-a="clearslot:${i}">かたづける</button>` : ""}</div>`;
      }).join("")}</div><div class="row"><button data-a="clearroom">ぜんぶ かたづける</button></div>`,
      "wide child-grid-panel decorate-panel",
    );
  }
  async place(slot) {
    if (!Number.isInteger(slot) || slot < 0 || slot > 5)
      throw Error("おく ばしょを えらんでね");
    const id = this.decorateItem,
      item = D.ITEMS.find((i) => i.id === id && i.type === "furniture");
    if (!id || !item) throw Error("さきに かぐを えらんでね");
    const used = Object.entries(this.s.room.slots).filter(
      ([k, v]) => +k !== slot && v === id,
    ).length;
    if (used >= (this.s.inventory.furniture[id] || 0))
      throw Error("そのかぐは ぜんぶ おへやに おいてあるよ");
    this.s.room.slots[slot] = id;
    await this.commit();
    this.room();
    this.decorate();
    this.world.hero?.setState("happy");
    this.toast(item.name + "を おいたよ！");
  }
  wardrobe(category = this.wardrobeCategory || "clothing", page = 0) {
    const categories = [
        ["clothing", "ふく"],
        ["accessories", "ぼうし・めがね"],
        ["interior", "かべ・ゆか"],
      ];
    if (!categories.some(([id]) => id === category)) category = "clothing";
    const rows = D.ITEMS.filter((i) => {
        if (category === "interior")
          return ["wallpaper", "floor"].includes(i.type) &&
            !!this.s.inventory.specialItems[i.id];
        if (i.type !== category) return false;
        return this.featuredShopItem(i) && !!this.s.inventory[i.type]?.[i.id];
      }),
      pages = Math.max(1, Math.ceil(rows.length / 8));
    page = Math.max(0, Math.min(pages - 1, Number(page) || 0));
    this.wardrobeCategory = category;
    this.wardrobePage = page;
    const selected = (i) =>
      i.type === "clothing"
        ? this.s.player.appearance.outfit === i.id
        : i.id.startsWith("hat_")
          ? this.s.player.appearance.hat === i.id
          : i.id.startsWith("glasses_")
            ? this.s.player.appearance.glasses === i.id
            : this.s.room[i.type] === i.id;
    this.panel(
      `<div class="row spread panel-heading"><div><h2>きせかえ・かべ・ゆか</h2><p>もっているものから えらべるよ。</p></div><button data-a="room">おへやへ</button></div><div class="tabs">${categories.map(([id, name]) => `<button class="${id === category ? "active" : ""}" data-a="wardrobecat:${id}">${name}</button>`).join("")}</div><div class="grid wardrobe-grid">${rows.slice(page * 8, page * 8 + 8).map((i) => `<button class="tile ${selected(i) ? "selected" : ""}" data-a="wear:${i.id}">${itemPreview(i)}<span class="name">${E(i.name)}</span><small>${selected(i) ? "✓ いま つかっている" : "つかう"}</small></button>`).join("") || "<p>まだ もっていないよ。</p>"}</div>${this.pagination(page, pages, "wardrobepage")}${category === "accessories" ? '<p><button data-a="removeaccessories">ぼうし・めがねを はずす</button></p>' : ""}`,
      "wide child-grid-panel wardrobe-panel",
    );
  }
  async wear(id) {
    const item = D.ITEMS.find((x) => x.id === id);
    if (!item || !["clothing", "accessories", "wallpaper", "floor"].includes(item.type))
      throw Error("あいてむが みつかりません");
    const owned = ["wallpaper", "floor"].includes(item.type)
      ? this.s.inventory.specialItems[id]
      : this.s.inventory[item.type]?.[id];
    if (!owned) throw Error("もっていない あいてむだよ");
    if (item.type === "clothing") this.s.player.appearance.outfit = id;
    else if (item.type === "accessories") {
      if (id.startsWith("hat_")) this.s.player.appearance.hat = id;
      else if (id.startsWith("glasses_")) this.s.player.appearance.glasses = id;
      else throw Error("みにつけられない あいてむだよ");
    } else this.s.room[item.type] = id;
    await this.commit();
    this.room();
  }
  display(category = this.displayCategory || "fish", page = 0) {
    const fish = D.FISH.filter((f) => this.s.fishing.fishBook[f.id]),
      dinos = D.DINOS.filter((d) => this.s.dinosaurs.fossilBook[d.id]?.completed),
      trophies = Object.keys(this.s.inventory.specialItems)
        .filter(
          (id) =>
            id.startsWith("trophy_") ||
            id.startsWith("subject_") ||
            id.endsWith("master"),
        )
        .map((id) => ({ id, name: this.specialName(id) })),
      definitions = {
        fish: {
          title: "すいそう",
          max: 5,
          key: "aquariumFish",
          rows: fish,
          visual: (x) => this.icon(x),
          empty: "さかなを つると ここから えらべるよ。",
          ready: !!this.s.inventory.specialItems.aquarium_small,
        },
        dinosaurs: {
          title: "きょうりゅうふぃぎゅあ",
          max: 3,
          key: "dinosaurFigures",
          rows: dinos,
          visual: (x) => this.icon(x),
          empty: "きょうりゅうを ふくげんすると えらべるよ。",
          ready: true,
        },
        trophies: {
          title: "とろふぃー・きねんひん",
          max: 3,
          key: "trophies",
          rows: trophies,
          visual: () => '<span class="trophy-preview">🏆</span>',
          empty: "できたことを ふやすと かざれるよ。",
          ready: true,
        },
      };
    if (!definitions[category]) category = "fish";
    const info = definitions[category],
      pages = Math.max(1, Math.ceil(info.rows.length / 8));
    page = Number.isInteger(Number(page)) ? Number(page) : 0;
    page = Math.max(0, Math.min(pages - 1, page));
    this.displayCategory = category;
    this.displayPage = page;
    const selected = this.s.room[info.key];
    this.panel(
      `<div class="row spread panel-heading"><div><h2>おへやに かざる</h2><p>${info.title}：${selected.length} / ${info.max}</p></div><button data-a="room">おへやへ</button></div><div class="tabs"><button class="${category === "fish" ? "active" : ""}" data-a="displaycat:fish">すいそう</button><button class="${category === "dinosaurs" ? "active" : ""}" data-a="displaycat:dinosaurs">きょうりゅう</button><button class="${category === "trophies" ? "active" : ""}" data-a="displaycat:trophies">とろふぃー</button></div>${!info.ready ? '<p class="empty-state">さかなを 5しゅるい みつけると、すいそうが つかえるよ。</p>' : `<div class="grid display-grid">${info.rows.slice(page * 8, page * 8 + 8).map((x) => `<button class="tile ${selected.includes(x.id) ? "selected" : ""}" data-a="toggledecor:${info.key}:${x.id}">${info.visual(x)}<span class="name">${E(x.name)}</span><small>${selected.includes(x.id) ? "✓ かざっている" : "かざす"}</small></button>`).join("") || `<p>${info.empty}</p>`}</div>${info.rows.length ? this.pagination(page, pages, "displaypage") : ""}`}<p><button data-a="memories">しゃしんは おもいでから</button></p>`,
      "wide child-grid-panel display-panel",
    );
  }
  specialName(id) {
    if (id.startsWith("trophy_cup_")) {
      const cup = D.TOURNAMENTS.find((c) => "trophy_" + c.id === id);
      return cup ? cup.name + " とろふぃー" : "たいかい とろふぃー";
    }
    if (id.startsWith("subject_")) {
      const subject = D.SUBJECTS.find((s) => "subject_" + s.id === id);
      return subject
        ? `${subject.name} Lv${subject.maxLevel}きねん`
        : "がくしゅう きねんひん";
    }
    if (id.startsWith("trophy_achievement_")) {
      const achievement = D.ACHIEVEMENTS.find(
        (a) => "trophy_" + a.id === id,
      );
      return achievement ? achievement.name + " とろふぃー" : "できたこと とろふぃー";
    }
    return (
      {
        fish_master: "さかなますたー きねんひん",
        dinosaur_master: "きょうりゅうますたー きねんひん",
        typing_master: "たいぴんぐますたー きねんひん",
        arena_master: "ありーなおうじゃ とろふぃー",
        obecolle_master: "おべこれますたー とろふぃー",
      }[id] || "きねんとろふぃー"
    );
  }
  icon(c, hidden = false) {
    if (!c) return "";
    if (c.id?.startsWith("fish_") || c.id?.startsWith("dino_")) {
      if (FISH_ART[c.id])
        return `<img class="creature-art legacy-art${hidden ? " silhouette" : ""}" src="${FISH_ART[c.id]}" alt="${hidden ? "まだ みつけていない いきもの" : E(c.name)}" loading="lazy">`;
      return atlasSvg(artLayout(c.id), c.name, hidden);
    }
    if (c.id?.startsWith("animal_")) return animalIcon(c, hidden);
    return "";
  }
  collection(category = this.category, page = 0) {
    this.activity = null;
    const categories = [
      ["friends", "ともだち"],
      ["dinosaurs", "きょうりゅう"],
      ["clothing", "ふく"],
      ["furniture", "かぐ"],
    ];
    if (!categories.some(([id]) => id === category)) category = "friends";
    let rows, owned;
    if (category === "friends") {
      rows = D.ACTIVE_FRIENDS;
      owned = (x) => !!this.s.friends[x.id];
    } else if (category === "dinosaurs") {
      rows = D.DINOS;
      owned = (x) => !!this.s.dinosaurs.fossilBook[x.id]?.completed;
    } else {
      rows = D.ITEMS.filter(
        (i) => i.type === category && this.featuredShopItem(i),
      );
      owned = (x) => !!this.s.inventory[category]?.[x.id];
    }
    const pages = Math.max(1, Math.ceil(rows.length / 8));
    page = Math.max(0, Math.min(pages - 1, Number(page) || 0));
    this.category = category;
    this.page = page;
    const hints = {
      friends: "まちで はなしかけてみよう",
      dinosaurs: "たいぴんぐはっくつで みつけよう",
      clothing: "しょっぷや ごほうびで みつかるよ",
      furniture: "しょっぷや ごほうびで みつかるよ",
    };
    const visual = (x, known) =>
      category === "friends"
        ? friendPortrait(x, !known)
        : category === "dinosaurs"
          ? this.icon(x, !known)
          : itemPreview(x, !known);
    this.panel(
      `<div class="row spread panel-heading"><div><h2>これくしょんぶっく</h2><p>いま だいじなものだけを みやすく まとめたよ。</p></div><span class="collection-count">${rows.filter(owned).length} / ${rows.length}</span><button data-a="island">まちへ</button></div>
      <div class="tabs">${categories.map(([id, n]) => `<button class="${category === id ? "active" : ""}" data-a="book:${id}">${n}</button>`).join("")}</div>
      <div class="grid collection-grid">${rows.slice(page * 8, page * 8 + 8).map((x) => {
        const known = owned(x);
        return `<button class="tile collection-card ${known ? "" : "locked"}" data-a="detail:${category}:${x.id}"><div class="collection-icon">${visual(x, known)}</div><span class="name">${known ? E(x.name) : "？？？"}</span><small>${known ? (category === "friends" ? this.hearts(this.s.friends[x.id].affinity) : "みつけた！") : hints[category]}</small></button>`;
      }).join("")}</div>
      ${this.pagination(page, pages, "bookpage")}
      <div class="row collection-footer"><button data-a="memories">おもいで</button></div>`,
      "wide child-grid-panel collection-panel",
    );
  }
  detail(category, id) {
    const known =
      category === "fish"
        ? !!this.s.fishing.fishBook[id]
        : category === "dinosaurs"
          ? !!this.s.dinosaurs.fossilBook[id]?.completed
          : category === "friends"
            ? !!this.s.friends[id]
            : category === "animals"
              ? this.s.collections.animals.includes(id)
              : category === "cards"
                ? !!this.s.arena.cards[id]
                : category === "trophies"
                  ? !!this.s.inventory.specialItems[id]
                  : !!this.s.inventory[category]?.[id];
    if (!known) {
      const hints = {
        friends: "まだ あっていない ともだち。しまを そだててみよう。",
        fish: "まだ つっていない さかな。つりばで みつけよう。",
        dinosaurs: "まだ ふくげんしていないよ。はっくつを つづけよう。",
        animals: "まだ ずかんに とうろくしていないよ。いきものを まなぼう。",
        cards: "この かーどは まだ。ありーなで しょうぶしてみよう。",
        trophies: "できたことが ふえると もらえるよ。",
        clothing: "しょっぷなどで みつけよう。",
        furniture: "しょっぷなどで みつけよう。",
      };
      this.say("？？？", hints[category] || "まだ みつけていないよ。");
      return;
    }
    const x = [
      ...D.FRIENDS,
      ...D.FISH,
      ...D.DINOS,
      ...D.ANIMALS,
      ...D.ITEMS,
      ...D.CREATURES,
    ].find((row) => row.id === id);
    let text = "";
    if (category === "fish") {
      const f = this.s.fishing.fishBook[id];
      text = `${"★".repeat(x.rarity)} ／ ${D.FISH_AREAS.find((a) => a.id === x.area).name}
いちばん おおきい ${f.biggest}cm ／ ${f.count}ひき
${x.fact}`;
    } else if (category === "dinosaurs") {
      const b = this.s.dinosaurs.fossilBook[id];
      text = `${x.fact}
たべもの：${x.food}
みつけたひ：${b.completedAt.slice(0, 10)}`;
    } else if (category === "friends") {
      const f = this.s.friends[id];
      text = `${x.personality} ／ ${this.hearts(f.affinity)}
${x.favoriteActivity}が すき`;
    } else if (category === "cards") {
      const c = D.CREATURES.find((row) => row.id === id);
      text = `${Object.entries(c.stats).map(([k, v]) => k + " " + "★".repeat(Math.ceil(v / 20))).join("\n")}
${c.move}${this.s.arena.shinyCards.includes(id) ? "\nきらかーど！" : ""}`;
    } else if (category === "trophies") {
      text = "がんばった きろくの きねんひんだよ。";
    } else {
      text = x?.fact || "あつめた あいてむだよ。";
    }
    this.say(category === "trophies" ? this.specialName(id) : x?.name || "これくしょん", text);
    if (["fish", "dinosaurs", "animals", "cards"].includes(category)) {
      const art = category === "cards" ? D.CREATURES.find((row) => row.id === id) : x;
      this.dialog
        .querySelector("p")
        ?.insertAdjacentHTML(
          "beforebegin",
          `<div class="collection-icon detail-art">${this.icon(art)}</div>`,
        );
    }
  }
  achievements(page = this.achievementPage || 0) {
    const rows = D.ACHIEVEMENTS,
      pages = Math.max(1, Math.ceil(rows.length / 8));
    page = Math.max(0, Math.min(pages - 1, Number(page) || 0));
    this.achievementPage = page;
    this.panel(
      `<div class="row spread panel-heading"><div><h2>できたこと</h2><p>できた きろく。ばっじは 3こまで つけられるよ。</p></div><button data-a="collection">ぶっくへ</button></div><div class="grid achievement-grid">${rows.slice(page * 8, page * 8 + 8).map((a) => {
        const done = !!this.s.achievements[a.id],
          using = this.s.player.badges.includes(a.id),
          progress = Math.min(a.target, this.s.progression.metrics[a.metric] || 0);
        return `<button class="tile ${done ? "done" : ""}" data-a="badge:${a.id}" ${done ? "" : "disabled"}><span class="icon">${done ? "🏅" : "○"}</span><strong>${a.name}</strong><small>${progress} / ${a.target}</small><small>${using ? "✓ ぷろふぃーるに つけている" : done ? "ばっじに する" : "まだ ちょうせんちゅう"}</small></button>`;
      }).join("")}</div>${this.pagination(page, pages, "achievementpage")}`,
      "wide child-grid-panel achievements-panel",
    );
  }
  memories(page = 0) {
    const rows = [...this.s.memories].reverse(),
      pages = Math.max(1, Math.ceil(rows.length / 8));
    page = Math.max(0, Math.min(pages - 1, Number(page) || 0));
    this.memoryPage = page;
    this.panel(
      `<div class="row spread panel-heading"><div><h2>おもいであるばむ</h2><p>いっしょに すごした きろく。</p></div><button data-a="collection">ぶっくへ</button></div><div class="grid memory-grid">${rows.slice(page * 8, page * 8 + 8).map((memory) => {
        const friend = memory.friendIds?.length
          ? D.FRIENDS.find((f) => f.id === memory.friendIds[0])
          : null;
        return `<div class="tile memory-card"><div class="photo">${friend ? friendPortrait(friend) : '<span class="memory-symbol">✦</span>'}<strong>${E(memory.title)}</strong></div><small>${memory.date.slice(0, 10)}</small><button data-a="photo:${memory.id}">${this.s.room.photos.includes(memory.id) ? "✓ おへやに かざっている" : "おへやに かざす"}</button></div>`;
      }).join("") || "<p>これから おもいでが ふえていくよ。</p>"}</div>${this.pagination(page, pages, "memorypage")}`,
      "wide child-grid-panel memories-panel",
    );
  }
  async missions() {
    R.refreshMissions(this.s);
    await this.commit();
    const done = this.s.missions.daily.filter((m) => m.claimed).length;
    this.panel(
      `<div class="row spread panel-heading"><div><h2>きょうの みっしょん</h2><p>${done} / 3 できたよ。じぶんの ぺーすで あそぼう。</p></div><button data-a="island">まちへ</button></div><div class="grid three mission-grid">${this.s.missions.daily.map((mission) => {
        const progress = Math.max(
          0,
          Math.min(
            mission.target,
            (this.s.progression.metrics[mission.metric] || 0) - mission.start,
          ),
        );
        return `<div class="tile ${mission.claimed ? "done" : ""}"><span class="icon">${mission.claimed ? "✓" : "○"}</span><h3>${mission.name}</h3><p>${mission.claimed ? "できた！ ＋10こいん" : `${progress} / ${mission.target}`}</p></div>`;
      }).join("")}</div><button class="gold mission-chest" data-a="chest" ${this.s.missions.completedToday || !this.s.missions.daily.every((m) => m.claimed) ? "disabled" : ""}>${this.s.missions.completedToday ? "きょうの たからばこは うけとったよ" : "3つ できた！ たからばこを あける"}</button>`,
      "wide child-grid-panel missions-panel",
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
        )}</div><p><button class="gold" data-a="ending" ${R.masterReady(this.s) ? "" : "disabled"}>${this.s.progression.storyFlags.master ? "おいわいをもういちど" : "かんせいいべんとをはじめる"}</button></p><button data-a="island">まちへ</button>`,
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
    this.dialog.innerHTML = `<div class="overlay"><section class="panel small"><h2>ひとやすみ</h2><div class="grid two"><button class="primary" data-a="resume">つづける</button><button data-a="settings">せってい</button>${this.activity ? '<button data-a="restartactivity">やりなおす</button><button data-a="quitactivity">やめる</button>' : ""}<button data-a="quickhome">🏘 まちへ</button><button data-a="export">ばっくあっぷ</button><button data-a="confirmtitle">たいとるへ</button></div></section></div>`;
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
      )}</select></p><p><label><input type="checkbox" data-setting="keyboard" ${this.s.settings.keyboard ? "checked" : ""}> きーぼーどがいど</label></p><div class="row"><button data-a="export">JSONほぞん</button><button data-a="importslot:${this.s.meta.slotId}">JSONふくげん</button><button data-a="quickhome">🏘 まちへ</button><button data-a="fullscreen">がめんをおおきく</button><button class="primary" data-a="resume">もどる</button></div></section></div>`;
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
    const imported = await this.saveManager.import(p.text, p.slot);
    this.resetSessionState();
    this.s = imported;
    this.island();
    this.toast("ばっくあっぷからふくげんしました");
  }
  help() {
    this.panel(
      `<div class="row spread panel-heading"><div><h2>あそびかた</h2><p>あるいて、はなして、みつけよう！</p></div><button data-a="title">たいとるへ</button></div>
      <div class="grid two help-grid">
        <div class="tile"><span class="icon">🚶</span><h3>じぶんで まちを あるく</h3><p>↑ ↓ ← → または W A S D。しゅじんこうを うごかして、ちかくの ばしょを みつけよう。</p></div>
        <div class="tile"><span class="icon">🗣️</span><h3>ともだちと はなす</h3><p>ちかづくと「はなす」が でるよ。ともだちには それぞれ こえと せりふが あるよ。</p></div>
        <div class="tile"><span class="icon">⛏️</span><h3>たいぴんぐで はっくつ</h3><p>ことばを うつと いわが くだける！ 30のLvに 30しゅるいの きょうりゅうが ねむっているよ。</p></div>
        <div class="tile"><span class="icon">📖</span><h3>みつけたものを あつめる</h3><p>きょうりゅうや ともだちが ずかんに ふえていくよ。いまは だいじなものだけを ひょうじしているよ。</p></div>
      </div><p class="adult-note">おとなのひとへ：つり・旧はっくつ・ありーなは Rebuild中のため いったん非表示です。</p>`,
      "wide child-grid-panel help-panel",
    );
  }
  async change(e) {
    const el = e.target;
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
      if (e.code === "Enter" && !e.repeat) {
        if (this.nearFriend) {
          e.preventDefault();
          this.action(this.nearFriend).catch((err) => this.error(err));
          return;
        }
        if (this.nearDoor) {
          e.preventDefault();
          this.action(this.nearDoor.id).catch((err) => this.error(err));
          return;
        }
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
    if (["fishing", "excavation", "arena", "togetherfishing", "togetherdig"].includes(a)) {
      this.say(
        "いまは おやすみちゅう",
        "この あそびは Rebuildちゅうだよ。いまは まち・ともだち・たいぴんぐはっくつを たのしんでね！",
      );
      return;
    }
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
      case "walkenter":
        if (this.nearDoor) await this.action(this.nearDoor.id);
        break;
      case "walktalk":
        if (this.nearFriend) await this.action(this.nearFriend);
        break;
      case "creatorcancel": {
        const wasEditing = this.editing;
        this.draft = null;
        this.editing = false;
        this.newSlot = null;
        this.creatorPage = 0;
        if (wasEditing) this.room();
        else await this.slots();
        break;
      }
      case "creatorpage": {
        const input = document.querySelector("#player-name");
        if (input) this.draft.name = input.value.trim();
        this.creator(+b);
        break;
      }
      case "cycleappearance": {
        const input = document.querySelector("#player-name");
        if (input) this.draft.name = input.value.trim();
        const limits = {
          skin: 5, face: 6, hair: 12, hairColor: 8,
          eyes: 12, brows: 5, nose: 5, mouth: 8,
        };
        if (!limits[b]) throw Error("えらべない みためだよ");
        const current = Number(this.draft.appearance[b] || 0),
          step = Number(c);
        if (!Number.isFinite(step)) throw Error("えらべない みためだよ");
        this.draft.appearance[b] =
          (current + step + limits[b]) % limits[b];
        this.world.set("create", this.s, { appearance: this.draft.appearance });
        this.creator(this.creatorPage);
        break;
      }
      case "cycleoutfit": {
        const input = document.querySelector("#player-name");
        if (input) this.draft.name = input.value.trim();
        const outfits = D.ITEMS.filter(
          (i) =>
            i.type === "clothing" &&
            (this.editing
              ? this.s.inventory.clothing[i.id]
              : +i.id.split("_")[1] < 8),
        );
        if (!outfits.length) throw Error("えらべる ふくが ないよ");
        let at = outfits.findIndex((i) => i.id === this.draft.appearance.outfit);
        if (at < 0) at = 0;
        const step = Number(b);
        if (!Number.isFinite(step)) throw Error("えらべない ふくだよ");
        at = (at + step + outfits.length) % outfits.length;
        this.draft.appearance.outfit = outfits[at].id;
        this.world.set("create", this.s, { appearance: this.draft.appearance });
        this.creator(this.creatorPage);
        break;
      }
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
            "いまの あそびを とじて まちへ もどるよ。",
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
      case "friendmore":
        await this.friend(b, true);
        break;
      case "request":
        await this.request(b);
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
      case "giftpage":
        this.giftMenu(this.giftFriend, +b);
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
      case "togetherfishing":
        this.fishing(b);
        break;
      case "togetherdig":
        this.excavation(b);
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
      case "levelpage":
        this.levels(b, +c);
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
      case "typelevel":
        this.startTyping(b, +c);
        break;
      case "typingpage":
        this.typingLab(+b);
        break;
      case "speakquestion":
        this.speakQuestion();
        break;
      case "speakoption":
        this.speakOption(+b);
        break;
      case "fishing":
        this.fishing();
        break;
      case "fishstart":
        await this.beginFishing(b, c);
        break;
      case "equiprod":
        if (!this.s.fishing.ownedRods.includes(b))
          throw Error("もっていない つりざおだよ");
        this.s.fishing.equippedRod = b;
        await this.commit();
        this.fishing(c || null);
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
        await this.beginDig(b, c);
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
      case "arena":
        this.arena();
        break;
      case "cup":
        this.chooseCreature(b);
        break;
      case "arenapick":
        if (!this.ownedCreatures().some((x) => x.id === b))
          throw Error("もっていない いきものだよ");
        this.arenaCreature = b;
        this.chooseCreature(this.arenaCup, this.arenaPickPage);
        break;
      case "arenapage":
        this.chooseCreature(this.arenaCup, +b);
        break;
      case "arenastart":
        if (!this.arenaCreature) throw Error("いきものを えらぼう");
        await this.startArena(b, this.arenaCreature);
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
        this.shop(this.shopCategory, this.shopPage);
        this.toast("かえたよ！");
        break;
      case "decorate":
        this.decorate();
        break;
      case "pickfurniture":
        if (!D.ITEMS.some((i) => i.id === b && i.type === "furniture"))
          throw Error("かぐが みつからないよ");
        if (R.availableFurnitureCount(this.s, b) < 1)
          throw Error("そのかぐは ぜんぶ おへやに おいてあるよ");
        this.decorateItem = b;
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
            R.metric(this.s, "room");
            this.toast(item.name + "で ひとやすみ");
            await this.commit();
          } else this.decorate();
        }
        break;
      case "place":
        await this.place(+b);
        break;
      case "clearslot":
        if (!/^[0-5]$/.test(String(b)))
          throw Error("かぐの ばしょが みつからないよ");
        delete this.s.room.slots[b];
        await this.commit();
        this.room();
        this.decorate();
        break;
      case "clearroom":
        this.say(
          "ぜんぶ かたづける？",
          "おへやの かぐを ぜんぶ しまうよ。かぐは なくならないよ。",
          [
            ["ぜんぶ かたづける", "clearroomconfirm"],
            ["やめる", "closedialog"],
          ],
        );
        break;
      case "clearroomconfirm":
        this.s.room.slots = {};
        await this.commit();
        this.room();
        this.decorate();
        break;
      case "mirror":
        this.create(this.s.meta.slotId, true);
        break;
      case "wardrobe":
        this.wardrobe();
        break;
      case "wardrobecat":
        this.wardrobe(b, 0);
        break;
      case "wardrobepage":
        this.wardrobe(this.wardrobeCategory, +b);
        break;
      case "wear":
        await this.wear(b);
        this.wardrobe(this.wardrobeCategory, this.wardrobePage);
        break;
      case "removeaccessories":
        delete this.s.player.appearance.hat;
        delete this.s.player.appearance.glasses;
        delete this.s.player.appearance.eyewear;
        await this.commit();
        this.room();
        this.wardrobe(this.wardrobeCategory, this.wardrobePage);
        break;
      case "display":
        this.display(b || "fish", 0);
        break;
      case "displaycat":
        this.display(b, 0);
        break;
      case "displaypage":
        this.display(this.displayCategory, +b);
        break;
      case "toggledecor": {
        const list = this.s.room[b],
          max = b === "aquariumFish" ? 5 : 3,
          allowed =
            b === "aquariumFish"
              ? !!this.s.inventory.specialItems.aquarium_small &&
                !!this.s.fishing.fishBook[c]
              : b === "dinosaurFigures"
                ? !!this.s.dinosaurs.fossilBook[c]?.completed
                : b === "trophies"
                  ? !!this.s.inventory.specialItems[c]
                  : false;
        if (!Array.isArray(list) || !allowed)
          throw Error("かざせない あいてむだよ");
        if (list.includes(c)) this.s.room[b] = list.filter((x) => x !== c);
        else {
          if (list.length >= max) throw Error(`${max}こまで かざせるよ`);
          list.push(c);
        }
        await this.commit();
        this.display(this.displayCategory, this.displayPage);
        break;
      }
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
      case "achievementpage":
        this.achievements(+b);
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
        this.achievements(this.achievementPage);
        break;
      case "memories":
        this.memories();
        break;
      case "memorypage":
        this.memories(+b);
        break;
      case "photo": {
        const m = this.s.memories.find((x) => x.id === b);
        if (!m) throw Error("おもいでが みつからないよ");
        if (this.s.room.photos.includes(b))
          this.s.room.photos = this.s.room.photos.filter((x) => x !== b);
        else {
          if (this.s.room.photos.length >= 3)
            throw Error("しゃしんは3まいまで");
          this.s.room.photos.push(b);
        }
        m.favorite = this.s.room.photos.includes(b);
        await this.commit();
        this.memories(this.memoryPage);
        break;
      }
      case "missions":
        await this.missions();
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
