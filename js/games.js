import {
  SUBJECTS,
  CREATURES,
  DINOS,
  FISH,
  TYPING_MODES,
  PART_NAMES,
  TOURNAMENTS,
} from "./data/catalog.js";
import { generateSession } from "./systems/learning.js";
import { TypingEngine, typingWords, typingScore } from "./systems/typing.js";
import * as rules from "./systems/rules.js";
const E = (x) =>
  String(x).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const games = {
  startQuiz(subject, level, callback = null) {
    this.activity = {
      kind: "quiz",
      subject,
      level,
      questions: generateSession(subject, level),
      index: 0,
      correct: 0,
      answered: false,
      callback,
    };
    this.world.set("quiz", this.s);
    this.scene = "quiz";
    this.audio.setScene("school");
    this.quizQuestion();
  },
  quizQuestion() {
    const a = this.activity,
      q = a.questions[a.index];
    a.answered = false;
    this.world.set("quiz", this.s, { creatureId: q.creature });
    this.panel(
      `<div class="row spread"><span class="pill">${a.callback ? "ありーな" : SUBJECTS.find((x) => x.id === a.subject).name + " Lv" + a.level}</span><b>${a.index + 1} / 5</b><button data-a="pause">Ⅱ</button></div><div class="progress-track"><div style="width:${a.index * 20}%"></div></div><div class="question">${E(q.text)}</div>${this.questionVisual(q)}<div class="answers">${q.options.map((v, i) => `<button data-a="answer:${i}">${E(v)}</button>`).join("")}</div><div id="feedback" class="feedback"></div>`,
      "small",
    );
  },
  questionVisual(q) {
    if (q.visual === "dots")
      return `<div class="dots">${"●".repeat(q.count)}</div>`;
    if (q.visual === "coins")
      return `<div class="coins">${q.coins.map((c) => `<span class="coin coin-${c}">${c}<small>えん</small></span>`).join("")}</div>`;
    if (q.visual === "clock")
      return `<div class="clock">${Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) / 12) * Math.PI * 2;
        return `<span class="number" style="left:${50 + Math.sin(a) * 40}%;top:${50 - Math.cos(a) * 40}%">${i + 1}</span>`;
      }).join(
        "",
      )}<i class="hand hour" style="transform:translateX(-50%) rotate(${q.hour * 30 + q.minute * 0.5}deg)"></i><i class="hand minute" style="transform:translateX(-50%) rotate(${q.minute * 6}deg)"></i></div>`;
    if (q.visual === "creature")
      return `<div class="collection-icon">${this.icon(
        CREATURES.find((c) => c.id === q.creature),
        false,
      )}</div>`;
    return "";
  },
  async answer(index) {
    const a = this.activity;
    if (a?.kind !== "quiz" || a.answered) return;
    const q = a.questions[a.index];
    a.answered = true;
    const ok = q.options[index] === q.answer;
    if (ok) a.correct++;
    this.audio.effect(ok ? "correct" : "miss");
    document
      .querySelectorAll(".answers button")
      .forEach((b) => (b.disabled = true));
    document.querySelector("#feedback").innerHTML =
      `${ok ? "せいかい！" : "おしい！"} ${E(q.explanation)} <button class="muted-button" data-a="quiznext">つぎへ ▸</button>`;
    document.querySelector("[data-a=quiznext]").focus();
  },
  async quizNext() {
    const a = this.activity;
    if (!a?.answered) return;
    if (++a.index < 5) return this.quizQuestion();
    this.activity = null;
    if (a.callback) return a.callback((a.correct / 5) * 100);
    const reward = rules.finishLearning(this.s, a.subject, a.level, a.correct);
    await this.commit();
    this.panel(
      `<div class="result"><h2>${a.correct >= 3 ? "よく がんばったね！" : "もういちど やってみよう"}</h2><div class="stars">${"★".repeat(reward.stars)}${"☆".repeat(3 - reward.stars)}</div><p>5もんのうち ${a.correct}もん せいかい</p><p>＋${reward.coins} こいん ／ あたらしいすたー ＋${reward.added}${reward.ticket ? " ／ ちけっと ＋1" : ""}</p><p class="muted">${a.correct >= 3 ? (a.level >= SUBJECTS.find((x) => x.id === a.subject).maxLevel ? "さいごまで できたね！ きねんの ごほうびを もらったよ。" : "つぎのれべるがひらいたよ。") : "まちがえたところを、ゆっくりれんしゅうしよう。"}</p><div class="row"><button data-a="levels:${a.subject}">がっこうへ</button><button class="primary" data-a="island">しまにもどる</button></div></div>`,
      "small",
    );
  },
  startTyping(mode = "basic", level = this.s.typing.level, callback = null) {
    const modeInfo = TYPING_MODES.find((x) => x.id === mode);
    if (!callback && modeInfo && this.s.typing.level < modeInfo.level) return;
    this.scene = "typing";
    this.world.set("typing", this.s, { mode });
    this.audio.setScene("typing");
    const words = typingWords(level),
      a = (this.activity = {
        kind: "typing",
        mode,
        level,
        callback,
        words: [...words],
        engine: new TypingEngine(words[0]),
        wordIndex: 0,
        correct: 0,
        misses: 0,
        combo: 0,
        bestCombo: 0,
        elapsed: 0,
        started: false,
        timeLimit: callback
          ? 40
          : mode === "challenge"
            ? 30
            : mode === "escape"
              ? 60
              : 0,
      });
    this.panel(
      `<div class="row spread"><h2>${callback ? "FINAL たいぴんぐ" : modeInfo?.name || "たいぴんぐ"}</h2><button data-a="pause">Ⅱ</button></div><div class="row spread"><span id="type-progress">1 / 5</span><span id="type-time">${a.timeLimit ? a.timeLimit + "びょう" : "じかんせいげんなし"}</span><span id="type-combo">0 こんぼ</span></div><div class="typing-word" id="type-word"></div><div class="roman" id="type-roman"></div><div class="feedback" id="type-feedback">きーぼーどで はじめよう</div><div class="progress-track"><div id="type-meter" style="width:0%"></div></div>${this.s.settings.keyboard ? '<div class="keyboard" id="keyboard"></div>' : ""}<p class="footnote">えいじきーでにゅうりょく・ひょうきゆれOK ／ Esc でひとやすみ</p>`,
      "small",
    );
    this.renderTyping();
  },
  renderTyping() {
    const a = this.activity;
    if (a?.kind !== "typing") return;
    document.querySelector("#type-word").textContent = a.engine.text;
    document.querySelector("#type-roman").innerHTML =
      `<span class="typed">${E(a.engine.input.toUpperCase())}</span><span class="remain">${E(a.engine.hint.toUpperCase())}</span>`;
    document.querySelector("#type-progress").textContent =
      a.mode === "challenge"
        ? a.wordIndex + "ご"
        : `${Math.min(5, a.wordIndex + 1)} / 5`;
    document.querySelector("#type-combo").textContent = a.combo + " こんぼ";
    const key = document.querySelector("#keyboard");
    if (key)
      key.innerHTML = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]
        .map((row) =>
          [...row]
            .map(
              (c) =>
                `<span class="key ${c.toLowerCase() === a.engine.hint[0] ? "next" : ""}">${c}</span>`,
            )
            .join(""),
        )
        .join("<br>");
    document.querySelector("#type-meter").style.width =
      Math.min(100, a.wordIndex * 20) + "%";
  },
  async typeKey(key) {
    const a = this.activity;
    if (a?.kind !== "typing" || this.modalOpen) return;
    a.started = true;
    const ok = a.engine.feed(key);
    if (ok) {
      a.correct++;
      a.combo++;
      a.bestCombo = Math.max(a.combo, a.bestCombo);
      this.audio.effect("typing");
      document.querySelector("#type-feedback").textContent =
        a.mode === "rescue"
          ? "あわが ほどけていく！"
          : a.mode === "escape"
            ? "いいぞ！ そのちょうし！"
            : a.mode === "battle"
              ? "ぱわーが たまった！"
              : "いいね！";
      if (a.engine.done) {
        a.wordIndex++;
        this.world.typingProgress?.(a.wordIndex, a.mode);
        if (a.mode !== "challenge" && a.wordIndex >= 5)
          return this.finishTypingGame();
        a.engine = new TypingEngine(a.words[a.wordIndex % a.words.length]);
      }
    } else {
      a.misses++;
      a.combo = 0;
      this.audio.effect("miss");
      document.querySelector("#type-feedback").textContent =
        "だいじょうぶ。つぎのもじをみよう";
    }
    this.renderTyping();
  },
  async finishTypingGame() {
    const a = this.activity;
    if (a?.kind !== "typing") return;
    this.activity = null;
    const result = {
      ...typingScore(a.correct, a.misses, a.elapsed, a.bestCombo, a.level),
      correct: a.correct,
      misses: a.misses,
      words: a.wordIndex,
    };
    if (a.callback) return a.callback(result.score);
    if (a.wordIndex === 0 && a.correct === 0) {
      this.typingLab();
      return;
    }
    const reward = rules.finishTyping(this.s, a.mode, a.level, result);
    await this.commit();
    this.world.hero?.setState("victory");
    this.panel(
      `<div class="result"><h2>${reward.isBest ? "じぶんべすと！" : "おつかれさま！"}</h2><div class="stars">${result.score}てん</div><p>せいかくさ ${result.accuracy.toFixed(0)}% ／ 1ぷんで ${result.speed.toFixed(0)}もじ</p><p>いちばん ${result.combo}こんぼ ／ ${result.words}ご</p><h3>なかまぱわー ＋${reward.power}</h3><p>${a.mode === "basic" && result.accuracy >= 60 && result.words >= 5 ? "れべるくりあ！" : "すくしずつ、じょうずになろう。"}</p><div class="row"><button data-a="typing">けんきゅうじょへ</button><button class="primary" data-a="island">しまへ</button></div></div>`,
      "small",
    );
  },
  async beginFishing(area) {
    rules.startFishing(this.s, area);
    await this.commit();
    this.scene = "fishing";
    this.world.set("fishing", this.s);
    this.addCompanion();
    this.audio.setScene("fishing");
    this.fishingCastScreen();
  },
  fishingCastScreen() {
    const trip = this.s.fishing.trip;
    if (!trip) return this.fishing();
    this.activity = {
      kind: "fish",
      phase: "power",
      elapsed: 0,
      power: 0,
      tension: 0.5,
      progress: 0,
      holding: false,
      wait: 2 + Math.random() * 4,
    };
    this.panel(
      `<h2>のこり ${trip.remaining}きゃすと</h2><p id="fish-instruction">いいところで きゃすと！</p><div class="meter"><i id="fish-needle" class="needle"></i></div><div class="progress-track"><div id="fish-progress" style="width:0%"></div></div><div class="row"><button id="fish-action" class="primary" data-a="fishaction">なげる！</button><button data-a="pause">Ⅱ</button></div><p class="footnote">なげる → 「！」であわせる → みどりのはんいにたもってひく<br>ひくときはぼたんか Space をながおし／はなす</p>`,
      "small",
    );
  },
  fishAction(down = true) {
    const a = this.activity;
    if (a?.kind !== "fish") return;
    if (a.phase === "power") {
      a.phase = "wait";
      a.elapsed = 0;
      a.castBonus = Math.abs(a.power - 0.5) < 0.2 ? 0.1 : 0;
      document.querySelector("#fish-instruction").textContent =
        "うきが うごくのを まとう…";
      document.querySelector("#fish-action").textContent = "まってね";
    } else if (a.phase === "bite") {
      a.phase = "pull";
      a.elapsed = 0;
      document.querySelector("#fish-instruction").textContent =
        "みどりのはんいに たもとう！";
      document.querySelector("#fish-action").textContent = "ながおしで ひく";
    } else if (a.phase === "pull") {
      /* Holding is owned by pointerdown/up and physical key events. */
    }
  },
  async endCast(success) {
    if (this.activity?.kind !== "fish") return;
    this.activity = null;
    const result = rules.finishCast(this.s, success);
    if (result) this.companionReward("つり");
    await this.commit();
    if (result) {
      this.world.hero?.setState("victory");
      this.audio.effect("reward");
    }
    this.panel(
      `<div class="result"><h2>${result ? (result.isNew ? "あたらしい さかな！" : result.record ? "おおきさ しんきろく！" : "つれた！") : "にげちゃった。またちょうせんしよう！"}</h2>${result ? `${this.icon(result.fish)}<h3>${result.fish.name}</h3><p>${result.size} cm ／ ${"★".repeat(result.fish.rarity)}</p><p>${result.fish.fact}</p>` : ""}<button class="primary" data-a="${this.s.fishing.trip ? "nextcast" : "fishing"}">${this.s.fishing.trip ? "つぎのきゃすと" : "つりみなとへ"}</button></div>`,
      "small",
    );
  },
  async beginDig(area) {
    rules.startDig(this.s, area);
    await this.commit();
    this.scene = "excavation";
    this.world.set("excavation", this.s);
    this.addCompanion();
    this.audio.setScene("excavation");
    this.digSite();
  },
  digSite() {
    const trip = this.s.dinosaurs.trip;
    if (!trip) return this.excavation();
    this.activity = {
      kind: "dig",
      cells: Array(12).fill(3),
      tool: "hammer",
      target: Math.floor(Math.random() * 12),
      moves: 0,
    };
    this.panel(
      `<h2>のこり ${trip.remaining}ばしょ</h2><div class="row"><button data-a="digtool:hammer" aria-pressed="true">はんまー</button><button data-a="digtool:brush">ぶらし</button><button data-a="digtool:sensor">せんさー</button><button data-a="pause">Ⅱ</button></div><p id="dig-hint">いわをけずって、じめんをしらべよう</p><div class="dig-grid">${Array.from({ length: 12 }, (_, i) => `<button class="dig-cell" data-a="digcell:${i}">◆</button>`).join("")}</div><p class="footnote">はんまーでおおきく、ぶらしでほそかく。かせきはこわれません。</p>`,
      "small",
    );
  },
  digTool(tool) {
    const a = this.activity;
    if (a?.kind !== "dig") return;
    a.tool = tool;
    document
      .querySelectorAll('[data-a^="digtool:"]')
      .forEach((b) =>
        b.setAttribute("aria-pressed", b.dataset.a === "digtool:" + tool),
      );
    if (tool === "sensor") {
      document
        .querySelector(`[data-a="digcell:${a.target}"]`)
        .classList.add("hint");
      document.querySelector("#dig-hint").textContent =
        "ここに なにかありそう！";
    }
  },
  async digCell(i) {
    const a = this.activity;
    if (a?.kind !== "dig" || a.tool === "sensor") return;
    a.moves++;
    a.cells[i] = Math.max(0, a.cells[i] - (a.tool === "hammer" ? 2 : 1));
    const b = document.querySelector(`[data-a="digcell:${i}"]`);
    b.textContent = a.cells[i]
      ? "·".repeat(a.cells[i])
      : i === a.target
        ? "✦"
        : "　";
    if (!a.cells[i]) b.classList.add("clean");
    if (i === a.target && a.cells[i] === 0) {
      this.activity = null;
      const r = rules.digReward(this.s);
      this.companionReward("はっくつ");
      await this.commit();
      this.world.hero?.setState("happy");
      this.panel(
        `<div class="result"><h2>${r.d ? "かせきを はっけん！" : "こいんを はっけん！"}</h2>${r.d ? `<h3>${r.d.name}</h3><p>${PART_NAMES[r.part]} ${r.isNew ? "NEW！" : "もっていたぱーつ → 20こいん"}</p>` : `<p>＋${r.coins}こいん</p>`}<button class="primary" data-a="${this.s.dinosaurs.trip ? "nextdig" : "excavation"}">${this.s.dinosaurs.trip ? "つぎのばしょ" : "はっくつじまへ"}</button></div>`,
        "small",
      );
    }
  },
  restoration(id) {
    const d = DINOS.find((d) => d.id === id),
      b = this.s.dinosaurs.fossilBook[id];
    if (!b || b.completed || b.parts.length !== 4)
      throw Error("4つのぱーつをそろえよう");
    this.activity = { kind: "restore", id, placed: [], selected: null };
    this.panel(
      `<h2>${d.name}を ふくげんしよう</h2><p>ぱーつをえらんで、おなじばしょにはめよう</p><div class="row">${d.parts.map((p) => `<button data-a="part:${p}">${PART_NAMES[p]}</button>`).join("")}</div><div class="grid two" style="margin-top:25px">${d.parts.map((p) => `<button data-a="socket:${p}">＋ ${PART_NAMES[p]}</button>`).join("")}</div>`,
      "small",
    );
  },
  async socket(part) {
    const a = this.activity;
    if (a?.kind !== "restore" || a.selected !== part)
      return this.toast("おなじなまえのところにおこう");
    if (a.placed.includes(part)) return;
    a.placed.push(part);
    document.querySelector(`[data-a="socket:${part}"]`).textContent =
      "✓ " + PART_NAMES[part];
    if (a.placed.length === 4) {
      rules.restoreDinosaur(this.s, a.id);
      await this.commit();
      this.activity = null;
      const d = DINOS.find((d) => d.id === a.id);
      this.world.set("arena", this.s, { creature: d, opponent: d });
      this.world.opponent.visible = false;
      this.world.fighter.position.x = 0;
      this.world.camera.position.set(3, 2.5, 8);
      this.world.camera.lookAt(0, 1, 0);
      this.panel(
        `<div class="result"><h2>${d.name} ふくげん！</h2><p>${d.fact}</p><p>ずかんとふぃぎゅあについかされたよ</p><button class="primary" data-a="excavation">ふくげんらぼへ</button></div>`,
        "right",
      );
    }
  },
  async startArena(cup, creature) {
    if (!this.s.arena.unlockedTournaments.includes(cup))
      throw Error("このたいかいはまだひらいていないよ");
    if (!this.ownedCreatures().some((c) => c.id === creature))
      throw Error("いきものをえらぼう");
    this.s.arena.active = { cup, wins: 0, creature };
    await this.commit();
    this.arenaMatch();
  },
  arenaMatch() {
    const active = this.s.arena.active;
    if (!active) return this.arena();
    this.arenaRound = {
      cup: active.cup,
      creature: active.creature,
      learn: 0,
      knowledge: 0,
      typing: 0,
    };
    const level = Math.min(20, this.s.learning.math.unlocked);
    this.panel(
      `<div class="result"><h2>${TOURNAMENTS.find((x) => x.id === active.cup).name}</h2><p>だい ${active.wins + 1}しあい ／ 3しあい</p><p>ROUND 1：がくしゅう → ROUND 2：ちしき → FINAL：たいぴんぐ</p><button class="primary" data-a="arenaround">はじめる</button></div>`,
      "small",
    );
  },
  arenaRoundStart() {
    this.startQuiz(
      "math",
      Math.min(20, this.s.learning.math.unlocked),
      (score) => {
        this.arenaRound.learn = score;
        this.panel(
          `<div class="result"><h2>ROUND 1 できあがり！</h2><p>まなびぱわー ${score}</p><button class="primary" data-a="arenaknow">ROUND 2 ちしきへ</button></div>`,
          "small",
        );
      },
    );
  },
  arenaKnowledge() {
    this.startQuiz(
      ["fish", "dinosaurs", "animals"][this.s.arena.active.wins],
      Math.max(1, Math.min(20, this.s.learning.animals.unlocked)),
      (score) => {
        this.arenaRound.knowledge = score;
        this.panel(
          `<div class="result"><h2>ROUND 2 できあがり！</h2><p>ちしきがーど ${score}</p><button class="primary" data-a="arenatype">FINAL たいぴんぐへ</button></div>`,
          "small",
        );
      },
    );
  },
  arenaTyping() {
    this.startTyping("battle", this.s.typing.level, (score) => {
      this.arenaRound.typing = score;
      this.battleAnimation();
    });
  },
  battleAnimation() {
    const round = this.arenaRound,
      c = CREATURES.find((c) => c.id === round.creature),
      cup = TOURNAMENTS.find((c) => c.id === round.cup),
      op =
        CREATURES[
          (TOURNAMENTS.indexOf(cup) * 7 + this.s.arena.active.wins * 3 + 1) %
            CREATURES.length
        ];
    const score = rules.arenaScore(
        c,
        round.learn,
        round.knowledge,
        round.typing,
      ),
      won = score >= cup.difficulty + this.s.arena.active.wins * 2;
    this.world.set("arena", this.s, { creature: c, opponent: op });
    this.scene = "arena";
    this.activity = {
      kind: "battle",
      elapsed: 0,
      won,
      score,
      creature: c,
      round,
    };
    this.screen.innerHTML =
      '<div class="arena-overlay"><h2 id="battle-text">まなびのちからを あつめて！</h2><button class="muted-button" data-a="battleskip">えんしゅつをすきっぷ</button></div>';
  },
  async battleEnd() {
    const a = this.activity;
    if (a?.kind !== "battle") return;
    this.activity = null;
    let reward;
    if (a.won) reward = rules.arenaWin(this.s, a.creature.id);
    await this.commit();
    this.panel(
      `<div class="result"><h2>${a.won ? (reward.champion ? "ゆうしょう おめでとう！" : "しょうり！") : "もういちど ちゃれんじ！"}</h2><p>ぜんぶ ${a.score.toFixed(1)} ／ がくしゅう${a.round.learn}・ちしき${a.round.knowledge}・たいぴんぐ${a.round.typing}</p><p>${reward?.champion ? `＋${reward.coins}こいん${reward.first ? "・とろふぃー・かーどもらった" : ""}` : a.won ? "つぎのしあいも がんばろう！" : "がくしゅうとたいぴんぐで、つぎはもっとつよくなれるよ。"}</p><button class="primary" data-a="${this.s.arena.active ? "arenacontinue" : "arena"}">${this.s.arena.active ? "たいかいをつづける" : "ありーなへ"}</button></div>`,
      "small",
    );
  },
  updateGame(dt, t) {
    const a = this.activity;
    if (!a || this.modalOpen) return;
    if (a.kind === "opening") {
      a.elapsed += dt;
      if (a.elapsed >= 16) {
        this.activity = null;
        this.arrive().catch((e) => this.error(e));
      }
    }
    if (a.kind === "ending") {
      a.elapsed += dt;
      if (a.elapsed >= 15) {
        this.activity = null;
        this.endingFinish().catch((e) => this.error(e));
      }
    }
    if (a.kind === "typing" && a.started) {
      a.elapsed += dt;
      const e = document.querySelector("#type-time");
      if (e)
        e.textContent = a.timeLimit
          ? Math.max(0, Math.ceil(a.timeLimit - a.elapsed)) + "びょう"
          : Math.floor(a.elapsed) + "びょう";
      if (a.mode === "escape" && this.world.hero) {
        this.world.hero.setState("run");
        this.world.typingCreature.position.x =
          5 - a.misses * 0.08 + a.wordIndex * 0.2;
      }
      if (a.timeLimit && a.elapsed >= a.timeLimit)
        this.finishTypingGame().catch((e) => this.error(e));
    }
    if (a.kind === "fish") {
      a.elapsed += dt;
      const n = document.querySelector("#fish-needle");
      if (a.phase === "power") {
        a.power = (Math.sin(a.elapsed * 2) + 1) / 2;
        if (n) n.style.left = a.power * 96 + "%";
      }
      if (a.phase === "wait" && a.elapsed > a.wait) {
        a.phase = "bite";
        a.elapsed = 0;
        document.querySelector("#fish-instruction").textContent = "！ いまだ！";
        document.querySelector("#fish-action").textContent = "あわせる！";
        this.audio.effect("reward");
      }
      if (a.phase === "bite" && a.elapsed > 3)
        this.endCast(false).catch((e) => this.error(e));
      if (a.phase === "pull") {
        const rod = +this.s.fishing.equippedRod.slice(4);
        a.tension +=
          (dt * ((a.holding ? 0.25 : -0.19) + Math.sin(t * 2) * 0.035)) /
          (1 + rod * 0.08);
        a.tension = Math.max(0, Math.min(1, a.tension));
        if (a.tension > 0.3 && a.tension < 0.7)
          a.progress += dt * (0.18 + (a.castBonus || 0));
        else a.progress = Math.max(0, a.progress - dt * 0.04);
        if (n) n.style.left = a.tension * 96 + "%";
        document.querySelector("#fish-progress").style.width =
          Math.min(100, a.progress * 100) + "%";
        if (a.progress >= 1) this.endCast(true).catch((e) => this.error(e));
        else if (a.tension <= 0 || a.tension >= 1 || a.elapsed > 35)
          this.endCast(false).catch((e) => this.error(e));
      }
    }
    if (a.kind === "battle") {
      a.elapsed += dt;
      const phase = Math.floor(a.elapsed / 3),
        f = this.world.fighter,
        o = this.world.opponent;
      f.position.x =
        -3 + Math.max(0, Math.sin(a.elapsed * 2)) * Math.min(2, phase * 0.8);
      o.position.x =
        3 -
        Math.max(0, Math.sin(a.elapsed * 2 + Math.PI)) *
          Math.min(2, phase * 0.7);
      f.rotation.z = Math.sin(a.elapsed * 7) * 0.045;
      o.rotation.z = -Math.sin(a.elapsed * 7) * 0.045;
      const e = document.querySelector("#battle-text");
      if (e)
        e.textContent = [
          "まなびのちからを あつめて！",
          "ぱわーあたっく！",
          "ちしきがーど！",
          a.creature.move + "！",
        ][Math.min(3, phase)];
      if (a.elapsed >= 12) this.battleEnd().catch((e) => this.error(e));
    }
  },
};
