export const LEARNING_STEPS = {
  clock: [
    "ぴったり なんじ",
    "なんじ はん",
    "15ふんと 45ふん",
    "5ふんずつ よもう",
    "ながい はり",
    "1ぷんずつ よもう",
    "すこし あと",
    "じかんを またごう",
    "すこし まえ",
    "どのくらい たった？",
  ],
  money: [
    "おかねの しゅるい",
    "おなじ おかねを あわせる",
    "ちがう おかねを あわせる",
    "10えんを あつめる",
    "どちらが おおい？",
    "おかいものの ごうけい",
    "あと いくら？",
    "100えんの おつり",
    "500えんの おつり",
    "おかいものに ちょうせん",
  ],
};
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const mix = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  const set = new Set([answer]);
  for (const delta of mix([-50, -20, -10, -5, -2, -1, 1, 2, 5, 10, 20, 50])) {
    if (answer + delta >= 0) set.add(answer + delta);
    if (set.size === 4) break;
  }
  return choose(text, answer, [...set], explanation, extra);
}
const time = (n) => {
  n = ((n % 720) + 720) % 720;
  return `${Math.floor(n / 60) || 12}じ ${n % 60}ふん`;
};
export function focusedQuestion(subject, level, index = 0) {
  if (subject === "clock") {
    const h = rand(1, 12),
      m =
        level === 1
          ? 0
          : level === 2
            ? 30
            : level === 3
              ? [15, 45][rand(0, 1)]
              : level === 6
                ? rand(1, 59)
                : rand(0, 11) * 5;
    const visual = { visual: "clock", hour: h, minute: m };
    if (level <= 4 || level === 6)
      return choose(
        "とけいを よんでみよう",
        time(h * 60 + m),
        [time(h * 60 + m + 60), time(h * 60 + m + 5), time(h * 60 + m + 30)],
        `みじかい はりは「じ」。ながい はりは「ふん」。${time(h * 60 + m)}だよ。`,
        visual,
      );
    if (level === 5)
      return number(
        "ながい はりは なんふんを さしている？",
        m,
        `1めもりは 1ぷん。おおきな すうじから つぎまでは 5ふんだよ。いまは ${m}ふん。`,
        visual,
      );
    if (level === 10) {
      const elapsed = rand(1, 6) * 10,
        start = h * 60 + m;
      return number(
        `${time(start)}から ${time(start + elapsed)}まで。なんふん たった？`,
        elapsed,
        `ながい はりを すすめると ${elapsed}ふんだよ。`,
        visual,
      );
    }
    const start =
      level === 7
        ? h * 60 + rand(0, 4) * 5
        : level === 8
          ? h * 60 + 45
          : h * 60 + rand(0, 11) * 5;
    const delta =
      level === 7
        ? rand(1, 3) * 5
        : level === 8
          ? rand(2, 4) * 10
          : -rand(1, 4) * 5;
    return choose(
      `${time(start)}の ${Math.abs(delta)}ふん ${delta < 0 ? "まえ" : "あと"}は？`,
      time(start + delta),
      [time(start), time(start - delta), time(start + delta + 60)],
      `${Math.abs(delta)}ふん はりを ${delta < 0 ? "もどす" : "すすめる"}と ${time(start + delta)}だよ。`,
      { visual: "clock", hour: Math.floor(start / 60), minute: start % 60 },
    );
  }
  const denominations = [1, 5, 10, 50, 100, 500];
  if (level === 1) {
    const c = denominations[(index + rand(0, 5)) % 6];
    return choose(
      "この おかねは なんえん？",
      c,
      mix(denominations.filter((x) => x !== c)),
      `${c}えんの おかねだよ。`,
      { visual: "coins", coins: [c] },
    );
  }
  if (level <= 4) {
    const coins =
      level === 2
        ? Array(rand(2, 4)).fill([1, 5, 10][rand(0, 2)])
        : level === 3
          ? [
              [1, 5],
              [5, 10],
              [10, 50],
              [50, 100],
              [1, 10],
              [5, 50],
            ][rand(0, 5)]
          : Array(rand(3, 7)).fill(10);
    const total = coins.reduce((a, b) => a + b, 0);
    return number(
      "あわせて なんえん？",
      total,
      `${coins.join(" ＋ ")} ＝ ${total}えん。`,
      { visual: "coins", coins },
    );
  }
  if (level === 5) {
    const a = rand(1, 9) * 10,
      b = a + [-20, -10, 10, 20][rand(0, 3)];
    const bb = Math.max(0, b);
    return choose(
      `あかい おさいふは ${a}えん。あおい おさいふは ${bb}えん。どちらが おおい？`,
      a > bb ? "あかい おさいふ" : "あおい おさいふ",
      [a > bb ? "あおい おさいふ" : "あかい おさいふ", "おなじ"],
      `${Math.max(a, bb)}えんの ほうが おおいよ。`,
    );
  }
  if (level === 6) {
    const a = rand(1, 5) * 10,
      b = rand(1, 4) * 10,
      c = rand(1, 3) * 10;
    return number(
      `ぱん ${a}えん、りんご ${b}えん、あめ ${c}えん。ぜんぶで？`,
      a + b + c,
      `${a} ＋ ${b} ＋ ${c} ＝ ${a + b + c}えん。`,
    );
  }
  if (level === 7) {
    const target = rand(3, 9) * 10,
      have = rand(1, target / 10 - 1) * 10;
    return number(
      `${target}えんの ぱんを かいたいな。いま ${have}えん。あと なんえん？`,
      target - have,
      `${have} ＋ ${target - have} ＝ ${target}えん。`,
    );
  }
  if (level <= 9) {
    const pay = level === 8 ? 100 : 500,
      price = rand(1, level === 8 ? 9 : 45) * 10;
    return number(
      `${pay}えんで ${price}えんの おかいもの。おつりは？`,
      pay - price,
      `${pay} − ${price} ＝ ${pay - price}えん。`,
    );
  }
  const a = rand(2, 8) * 10,
    b = rand(2, 8) * 10;
  return number(
    `200えん もっているよ。${a}えんの ぱんと ${b}えんの りんごを かったら、のこりは？`,
    200 - a - b,
    `まず ${a} ＋ ${b} ＝ ${a + b}えん。200 − ${a + b} ＝ ${200 - a - b}えん。`,
  );
}
