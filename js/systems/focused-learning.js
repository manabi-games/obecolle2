export const LEARNING_STEPS = {
  math: [
    "1〜5を かぞえる",
    "1〜10を かぞえる",
    "おおきい・ちいさい",
    "かずの じゅんばん",
    "5までの たしざん",
    "10までの たしざん",
    "5までの ひきざん",
    "10までの ひきざん",
    "11〜20の かず",
    "20までの たしざん",
    "20までの ひきざん",
    "みじかい ぶんしょうもんだい",
  ],
  japanese: [
    "ひらがな 1もじ",
    "おなじ ひらがな",
    "2〜3もじの ことば",
    "てん・まるの ことば",
    "ちいさい ゃゅょ",
    "ちいさい っ",
    "かたかな にゅうもん",
    "みぢかな かたかな",
    "しょう1の かんじ",
    "とても みじかい ぶん",
  ],
  clock: [
    "○じ",
    "○じはん",
    "30ぷんきざみ",
    "15ふん・45ふん",
    "5ふんきざみ",
    "せいかつの とけい",
  ],
  money: [
    "1えん・5えん・10えん",
    "50えん・100えん",
    "おなじ きんがく",
    "あわせて いくら",
    "ちょうど はらう",
    "かんたんな おつり",
  ],
  english: [
    "A〜F",
    "G〜L",
    "M〜R",
    "S〜Z",
    "おおもじ・こもじ",
    "いろ・かず",
    "みぢかな えいご",
    "あいさつ・みじかい ぶん",
  ],
  fish: [
    "えをみて なまえ",
    "かわ・いけ・うみ",
    "みための とくちょう",
    "やさしい せいたい",
    "このゲームの つりば",
    "おさらい ちゃれんじ",
  ],
  dinosaurs: [
    "えをみて なまえ",
    "たべもの",
    "いた じだい",
    "つの・くび・せなか",
    "からだの おおきさ",
    "おさらい ちゃれんじ",
  ],
  animals: [
    "えをみて なまえ",
    "すむ ばしょ",
    "たべもの",
    "とぶ・およぐ・はしる",
    "やさしい とくちょう",
    "おさらい ちゃれんじ",
  ],
};

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const mix = (a) => {
  const copy = [...a];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const choose = (text, answer, others, explanation, extra = {}) => ({
  text,
  answer: String(answer),
  options: mix(
    [...new Set([String(answer), ...others.map(String)])].slice(0, 4),
  ),
  explanation,
  ...extra,
});
function number(text, answer, explanation, extra = {}) {
  const deltas = mix([-20, -10, -5, -2, -1, 1, 2, 5, 10, 20]);
  const set = new Set([answer]);
  for (const d of deltas) {
    if (answer + d >= 0) set.add(answer + d);
    if (set.size === 4) break;
  }
  return choose(text, answer, [...set], explanation, extra);
}
const time = (h, m = 0) => `${h}じ${m ? ` ${m}ふん` : ""}`;

function clockQuestion(level, index) {
  const h = ((index + rand(0, 11)) % 12) + 1;
  if (level === 1) {
    const visual = { visual: "clock", hour: h, minute: 0 };
    return choose(
      "とけいは なんじ？",
      time(h),
      [time((h % 12) + 1), time(((h + 10) % 12) + 1), time(((h + 5) % 12) + 1)],
      `みじかい はりが ${h}を さしているから、${h}じだよ。`,
      visual,
    );
  }
  if (level === 2) {
    const visual = { visual: "clock", hour: h, minute: 30 };
    return choose(
      "とけいは なんじはん？",
      `${h}じ はん`,
      [`${(h % 12) + 1}じ はん`, `${h}じ`, `${h}じ 15ふん`],
      `ながい はりが 6なら、${h}じ はんだよ。`,
      visual,
    );
  }
  if (level === 3) {
    const minute = index % 2 ? 30 : 0;
    const visual = { visual: "clock", hour: h, minute };
    return choose(
      "とけいを よもう",
      minute ? `${h}じ はん` : time(h),
      minute
        ? [time(h), `${(h % 12) + 1}じ はん`, `${h}じ 15ふん`]
        : [`${h}じ はん`, time((h % 12) + 1), `${h}じ 15ふん`],
      minute ? `${h}じ はんだよ。` : `${h}じ ぴったりだよ。`,
      visual,
    );
  }
  if (level === 4) {
    const minute = index % 2 ? 45 : 15;
    const visual = { visual: "clock", hour: h, minute };
    return choose(
      "とけいを よもう",
      time(h, minute),
      [time(h, minute === 15 ? 45 : 15), time(h, 30), time((h % 12) + 1, minute)],
      `ながい はりを みると ${minute}ふん。${time(h, minute)}だよ。`,
      visual,
    );
  }
  if (level === 5) {
    const minute = ((index + rand(0, 11)) % 12) * 5;
    const visual = { visual: "clock", hour: h, minute };
    return choose(
      "とけいを よもう",
      time(h, minute),
      [time(h, (minute + 5) % 60), time(h, (minute + 55) % 60), time((h % 12) + 1, minute)],
      `ながい はりは 5ふんずつ かぞえよう。${time(h, minute)}だよ。`,
      visual,
    );
  }
  const rows = [
    [7, 0, 7, 30, "あさごはん"],
    [8, 0, 8, 30, "がっこうへ いく"],
    [11, 45, 12, 0, "おひるごはん"],
    [2, 45, 3, 0, "おやつ"],
    [5, 30, 6, 0, "ばんごはん"],
    [7, 45, 8, 0, "ねる じゅんび"],
  ];
  const [hour, minute, targetHour, targetMinute, event] = rows[index % rows.length];
  const start = hour * 60 + minute;
  const target = targetHour * 60 + targetMinute;
  const delta = target - start;
  return number(
    `${time(hour, minute)}。${time(targetHour, targetMinute)}に ${event}。あと なんぷん？`,
    delta,
    `${time(targetHour, targetMinute)}までは ${delta}ふんだよ。`,
    { visual: "clock", hour, minute },
  );
}

function moneyQuestion(level, index) {
  if (level === 1) {
    const coins = [1, 5, 10];
    const c = coins[index % coins.length];
    const prompts = [
      "この おかねは なんえん？",
      "なんえんの こうか？",
      "この こうかの きんがくは？",
    ];
    return choose(
      prompts[Math.floor(index / coins.length) % prompts.length],
      `${c}えん`,
      coins.filter((x) => x !== c).map((x) => `${x}えん`),
      `${c}えんだよ。`,
      { visual: "coins", coins: [c] },
    );
  }
  if (level === 2) {
    const coins = [50, 100];
    const c = coins[index % coins.length];
    const prompts = [
      "この おかねは なんえん？",
      "なんえんの こうか？",
      "この こうかの きんがくは？",
    ];
    return choose(
      prompts[Math.floor(index / coins.length) % prompts.length],
      `${c}えん`,
      [10, 50, 100, 500].filter((x) => x !== c).map((x) => `${x}えん`),
      `${c}えんだよ。`,
      { visual: "coins", coins: [c] },
    );
  }
  if (level === 3) {
    const rows = [
      [[5, 5], 10],
      [[10, 10, 10, 10, 10], 50],
      [[50, 50], 100],
      [[10, 10], 20],
      [[5, 5, 10], 20],
    ];
    const [coins, total] = rows[index % rows.length];
    return choose(
      "この おかねと おなじ きんがくは？",
      `${total}えん`,
      [5, 10, 20, 50, 100].filter((x) => x !== total).map((x) => `${x}えん`),
      `ぜんぶ あわせると ${total}えんだよ。`,
      { visual: "coins", coins },
    );
  }
  if (level === 4) {
    const rows = [
      [10, 5, 1],
      [50, 10, 10],
      [100, 50, 10],
      [10, 10, 5, 5],
      [50, 50, 10, 5],
    ];
    const coins = rows[index % rows.length];
    const total = coins.reduce((a, b) => a + b, 0);
    const candidates = [total - 10, total - 5, total + 5, total + 10, total + 50]
      .filter((x) => x >= 0 && x !== total)
      .map((x) => `${x}えん`);
    return choose(
      "あわせて なんえん？",
      `${total}えん`,
      candidates,
      `${coins.join(" ＋ ")} ＝ ${total}えん。`,
      { visual: "coins", coins },
    );
  }
  if (level === 5) {
    const rows = [
      [15, "10えん＋5えん", ["10えん", "5えん＋5えん", "50えん"]],
      [20, "10えん＋10えん", ["10えん＋5えん", "50えん", "5えん＋5えん"]],
      [55, "50えん＋5えん", ["50えん", "10えん＋5えん", "100えん"]],
      [60, "50えん＋10えん", ["50えん＋5えん", "10えん＋10えん", "100えん"]],
      [100, "100えん", ["50えん＋10えん", "50えん", "10えん＋10えん"]],
    ];
    const [price, answer, others] = rows[index % rows.length];
    return choose(
      `${price}えんを ちょうど はらうには？`,
      answer,
      others,
      `${answer}で ${price}えん ちょうどだよ。`,
    );
  }
  const prices = [20, 30, 40, 50, 60, 70, 80, 90];
  const price = prices[index % prices.length];
  const change = 100 - price;
  return choose(
    `100えんで ${price}えんの おかいもの。おつりは？`,
    `${change}えん`,
    [change - 10, change + 10, price]
      .filter((x) => x >= 0 && x !== change)
      .map((x) => `${x}えん`),
    `100 − ${price} ＝ ${change}えん。`,
  );
}

export function focusedQuestion(subject, level, index = 0) {
  if (subject === "clock") return clockQuestion(Math.max(1, Math.min(6, level)), index);
  if (subject === "money") return moneyQuestion(Math.max(1, Math.min(6, level)), index);
  throw Error("focusedQuestion: unsupported subject");
}
