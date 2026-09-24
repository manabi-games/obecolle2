import { FISH, DINOS, ANIMALS } from "../data/catalog.js";
const BASE = {
  あ: ["a"],
  い: ["i", "yi"],
  う: ["u", "wu", "whu"],
  え: ["e"],
  お: ["o"],
  か: ["ka", "ca"],
  き: ["ki"],
  く: ["ku", "cu", "qu"],
  け: ["ke"],
  こ: ["ko", "co"],
  さ: ["sa"],
  し: ["shi", "si", "ci"],
  す: ["su"],
  せ: ["se", "ce"],
  そ: ["so"],
  た: ["ta"],
  ち: ["chi", "ti"],
  つ: ["tsu", "tu"],
  て: ["te"],
  と: ["to"],
  な: ["na"],
  に: ["ni"],
  ぬ: ["nu"],
  ね: ["ne"],
  の: ["no"],
  は: ["ha"],
  ひ: ["hi"],
  ふ: ["fu", "hu"],
  へ: ["he"],
  ほ: ["ho"],
  ま: ["ma"],
  み: ["mi"],
  む: ["mu"],
  め: ["me"],
  も: ["mo"],
  や: ["ya"],
  ゆ: ["yu"],
  よ: ["yo"],
  ら: ["ra"],
  り: ["ri"],
  る: ["ru"],
  れ: ["re"],
  ろ: ["ro"],
  わ: ["wa"],
  を: ["wo"],
  が: ["ga"],
  ぎ: ["gi"],
  ぐ: ["gu"],
  げ: ["ge"],
  ご: ["go"],
  ざ: ["za"],
  じ: ["ji", "zi"],
  ず: ["zu"],
  ぜ: ["ze"],
  ぞ: ["zo"],
  だ: ["da"],
  ぢ: ["di"],
  づ: ["du"],
  で: ["de"],
  ど: ["do"],
  ば: ["ba"],
  び: ["bi"],
  ぶ: ["bu"],
  べ: ["be"],
  ぼ: ["bo"],
  ぱ: ["pa"],
  ぴ: ["pi"],
  ぷ: ["pu"],
  ぺ: ["pe"],
  ぽ: ["po"],
  ぁ: ["xa", "la"],
  ぃ: ["xi", "li"],
  ぅ: ["xu", "lu"],
  ぇ: ["xe", "le"],
  ぉ: ["xo", "lo"],
  ゃ: ["xya", "lya"],
  ゅ: ["xyu", "lyu"],
  ょ: ["xyo", "lyo"],
  ー: ["-"],
  " ": [" "],
  "。": ["."],
  "、": [","],
};
const COMBO = {
  しゃ: ["sha", "sya"],
  しゅ: ["shu", "syu"],
  しょ: ["sho", "syo"],
  ちゃ: ["cha", "tya", "cya"],
  ちゅ: ["chu", "tyu", "cyu"],
  ちょ: ["cho", "tyo", "cyo"],
  じゃ: ["ja", "jya", "zya"],
  じゅ: ["ju", "jyu", "zyu"],
  じょ: ["jo", "jyo", "zyo"],
  ふぁ: ["fa"],
  ふぃ: ["fi"],
  ふぇ: ["fe"],
  ふぉ: ["fo"],
  てぃ: ["thi"],
  でぃ: ["dhi"],
  うぃ: ["wi"],
  うぇ: ["we"],
  うぉ: ["who"],
};
for (const [k, v] of Object.entries({
  き: "ky",
  ぎ: "gy",
  に: "ny",
  ひ: "hy",
  び: "by",
  ぴ: "py",
  み: "my",
  り: "ry",
}))
  for (const [a, b] of [
    ["ゃ", "a"],
    ["ゅ", "u"],
    ["ょ", "o"],
  ])
    COMBO[k + a] = [v + b];
function tokens(text) {
  text = text
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 96));
  const out = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i],
      pair = text.slice(i, i + 2);
    if (c === "ん") {
      const after = text[i + 1];
      out.push(
        !after
          ? ["nn", "n'"]
          : "あいうえおなにぬねのやゆよ".includes(after)
            ? ["nn", "n'"]
            : ["n", "nn", "n'"],
      );
    } else if (c === "っ") {
      const nextPair = text.slice(i + 1, i + 3),
        next = COMBO[nextPair] || BASE[text[i + 1]];
      if (!next) {
        out.push(["xtu", "ltu", "xtsu"]);
        continue;
      }
      out.push([
        ...new Set(
          next.flatMap((v) => [
            ...(/[bcdfghjkpqrstvwxyz]/.test(v[0]) ? [v[0] + v] : []),
            "xtu" + v,
            "ltu" + v,
            "xtsu" + v,
            ...(v.startsWith("ch") ? ["t" + v] : []),
          ]),
        ),
      ]);
      i += COMBO[nextPair] ? 2 : 1;
    } else if (COMBO[pair]) {
      out.push([
        ...COMBO[pair],
        ...(BASE[c] || []).flatMap((a) =>
          (BASE[text[i + 1]] || []).map((b) => a + b),
        ),
      ]);
      i++;
    } else out.push(BASE[c] || (/[a-z0-9.,!?'\-]/.test(c) ? [c] : []));
  }
  if (out.some((t) => !t.length))
    throw Error("Unsupported typing word: " + text);
  return out;
}
export class TypingEngine {
  constructor(text) {
    this.text = text;
    this.nodes = [{}];
    let start = 0;
    this.recommended = "";
    for (const options of tokens(text)) {
      const end = this.nodes.push({}) - 1;
      this.recommended += options[0];
      for (const str of options) {
        let at = start;
        for (let k = 0; k < str.length; k++) {
          const dest = k === str.length - 1 ? end : this.nodes.push({}) - 1;
          (this.nodes[at][str[k]] ??= []).push(dest);
          at = dest;
        }
      }
      start = end;
    }
    this.end = start;
    this.states = new Set([0]);
    this.input = "";
    this.misses = 0;
  }
  feed(key) {
    key = key.toLowerCase();
    const next = new Set();
    for (const state of this.states)
      for (const dest of this.nodes[state][key] || []) next.add(dest);
    if (!next.size) {
      this.misses++;
      return false;
    }
    this.states = next;
    this.input += key;
    return true;
  }
  get done() {
    return this.states.has(this.end);
  }
  get hint() {
    if (this.done) return "";
    const q = [...this.states].map((n) => [n, ""]);
    const seen = new Set();
    while (q.length) {
      const [n, s] = q.shift();
      if (n === this.end) return s;
      if (seen.has(n)) continue;
      seen.add(n);
      for (const [key, arr] of Object.entries(this.nodes[n]))
        for (const d of arr) q.push([d, s + key]);
    }
    return "";
  }
}
export function typingScore(correct, misses, seconds, combo, level) {
  const accuracy = correct / Math.max(1, correct + misses),
    speed = (correct / Math.max(1, seconds)) * 60,
    target = 15 + level * 5;
  return {
    accuracy: accuracy * 100,
    speed,
    combo,
    score: Math.round(
      55 * accuracy +
        30 * Math.min(1, speed / target) +
        15 * Math.min(1, combo / (5 + level * 2)),
    ),
  };
}
const LEVEL_WORDS = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も", "や", "ゆ", "よ"],
  ["ら", "り", "る", "れ", "ろ", "わ", "を", "ん"],
  ["ねこ", "いぬ", "はな", "やま", "そら", "さかな"],
  ["がっこう", "きっぷ", "ざっし", "にっき", "こっぷ", "まって"],
  ["きゃく", "しゃしん", "しゅくだい", "ちょうちょ", "りょこう", "きょう"],
  ["ともだち", "まなび", "しょっぷ", "みっしょん", "たいぴんぐ", "ずかん"],
  ["きょうりゅう", "いっしょ", "ちょうせん", "ぷれぜんと", "これくしょん", "きんぎょ"],
  ["めだか", "きんぎょ", "こい", "なまず", "やまめ", "にじます"],
  ["うなぎ", "さけ", "あじ", "まだい", "まぐろ", "まんぼう"],
  ["とりけらとぷす", "いぐあのどん", "あろさうるす", "でいのにくす", "みんみ"],
  ["らいおん", "ぞう", "ぱんだ", "いるか", "ぺんぎん", "かんがるー"],
  ["いっしょにあそぼう", "さかなをつろう", "かせきをみつけよう", "しまをあるこう"],
  ["ともだちがきたよ", "がっこうへいこう", "おへやをかざろう", "ずかんをひらこう"],
  ["きょうもがんばった", "あしたもあそぼう", "じぶんのぺーすで", "たのしくつづけよう"],
  ["かせき", "いわば", "はっくつ", "きょうりゅう", "ほねをみつけよう"],
  ["てぃらのさうるす", "すてごさうるす", "あろさうるす", "いぐあのどん"],
  ["とりけらとぷす", "でいのにくす", "ぱきけふぁろさうるす", "あんきろさうるす"],
  ["いわをくだいてすすもう", "かせきをていねいにさがそう", "つぎのちそうへいこう"],
  ["きょうりゅうのほねをみつけた", "はっくつちーむでちょうせん", "ゆっくりでもだいじょうぶ"],
  ["こんぼをつないでいわをくだこう", "みすしてもつづければだいじょうぶ", "さいごまでうちきろう"],
  ["ふるいちそうをしらべてみよう", "おおきなかせきがねむっている", "どんなきょうりゅうかな"],
  ["ともだちといっしょにはっくつ", "みつけたかせきをずかんにいれよう", "あたらしいはっけんだ"],
  ["きょうりゅうはむかしのちきゅうにいた", "からだのかたちをくらべてみよう", "ほねからすがたをそうぞうしよう"],
  ["さいごのちそうまでたどりついた", "さんじゅっしゅるいをみつけよう", "きみはたいぴんぐはっくつめいじん"],
];

export function typingWords(level) {
  return LEVEL_WORDS[Math.max(1, Math.min(30, level)) - 1];
}
export function validateTyping() {
  const errors = [];
  for (let l = 1; l <= 30; l++)
    for (const w of typingWords(l)) {
      try {
        new TypingEngine(w);
      } catch (e) {
        errors.push(e.message);
      }
    }
  return errors;
}
