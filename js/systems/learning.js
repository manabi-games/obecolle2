import { focusedQuestion } from "./focused-learning.js";
import { FISH, DINOS, ANIMALS } from "../data/catalog.js";
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = (a) =>
  a
    .map((v) => [Math.random(), v])
    .sort((a, b) => a[0] - b[0])
    .map((x) => x[1]);
function numeric(text, answer, explanation, extra = {}) {
  const set = new Set([answer]);
  while (set.size < 4) set.add(Math.max(0, answer + rand(-10, 10)));
  return {
    text,
    answer: String(answer),
    options: shuffle([...set].map(String)),
    explanation,
    ...extra,
  };
}
function choice(text, answer, others, explanation, extra = {}) {
  return {
    text,
    answer,
    options: shuffle(
      [...new Set([answer, ...others.filter((x) => x !== answer)])].slice(0, 4),
    ),
    explanation,
    ...extra,
  };
}
const kanaPairs = [
  ["あ", "ア"],
  ["い", "イ"],
  ["う", "ウ"],
  ["え", "エ"],
  ["お", "オ"],
  ["か", "カ"],
  ["き", "キ"],
  ["く", "ク"],
  ["け", "ケ"],
  ["こ", "コ"],
  ["さ", "サ"],
  ["し", "シ"],
  ["す", "ス"],
  ["せ", "セ"],
  ["そ", "ソ"],
  ["た", "タ"],
  ["ち", "チ"],
  ["つ", "ツ"],
  ["て", "テ"],
  ["と", "ト"],
  ["な", "ナ"],
  ["に", "ニ"],
  ["ぬ", "ヌ"],
  ["ね", "ネ"],
  ["の", "ノ"],
];
const kanji = [
  ["山", "やま"],
  ["川", "かわ"],
  ["日", "ひ"],
  ["月", "つき"],
  ["火", "ひ"],
  ["水", "みず"],
  ["木", "き"],
  ["金", "かね"],
  ["土", "つち"],
  ["人", "ひと"],
  ["口", "くち"],
  ["目", "め"],
  ["耳", "みみ"],
  ["手", "て"],
  ["足", "あし"],
  ["犬", "いぬ"],
  ["花", "はな"],
  ["空", "そら"],
  ["雨", "あめ"],
  ["石", "いし"],
];
const opposites = [
  ["おおきい", "ちいさい"],
  ["ながい", "みじかい"],
  ["たかい", "ひくい"],
  ["あかるい", "くらい"],
  ["うえ", "した"],
  ["みぎ", "ひだり"],
  ["まえ", "あとろ"],
  ["おおい", "すくない"],
];
const english = [
  ["りんご", "apple"],
  ["ねこ", "cat"],
  ["いぬ", "dog"],
  ["ほん", "book"],
  ["あか", "red"],
  ["あお", "blue"],
  ["みず", "water"],
  ["たいよう", "sun"],
  ["つき", "moon"],
  ["ほし", "star"],
];
const enAnimals = [
  ["さかな", "fish"],
  ["とり", "bird"],
  ["らいおん", "lion"],
  ["ぞう", "elephant"],
  ["かめ", "turtle"],
  ["さめ", "shark"],
  ["くま", "bear"],
  ["うさぎ", "rabbit"],
  ["きょうりゅう", "dinosaur"],
  ["かえる", "frog"],
];
const greetings = [
  ["こんにちは", "Hello"],
  ["ありがとう", "Thank you"],
  ["おはよう", "Good morning"],
  ["さようなら", "Goodbye"],
  ["おやすみ", "Good night"],
  ["さかながすき", "I like fish."],
  ["わたしのなまえははるです", "My name is Haru."],
];
const habitats = [
  "いけ",
  "かわ",
  "かいがん",
  "さんごしょう",
  "おきのうみ",
  "しんかい",
  "でんせつのうみ",
];
const animalFacts = [
  ["らいおん", "ほにゅうるい", "こどもにおちちをあげるどうぶつだよ。"],
  ["ぞう", "ながいはな", "はなでみずやものをあつかうよ。"],
  ["きりん", "ながいくび", "たかいところのはもたべるよ。"],
  ["ぱんだ", "たけ", "たけをよくたべるよ。"],
  ["ぺんぎん", "とり", "はねでみずのなかをおよぐよ。"],
  ["いるか", "ほにゅうるい", "すいめんでくうきをすうよ。"],
  ["かえる", "おたまじゃくし", "こどものすがたはおとなとちがうよ。"],
  ["かめ", "こうら", "からだをまもるこうらがあるよ。"],
  ["たこ", "8ほん", "うでは8ほんあるよ。"],
  ["わに", "はちゅうるい", "とりやほにゅうるいとはべつのなかまだよ。"],
  ["ふくろう", "とり", "はねがあり、とりのなかまだよ。"],
  ["まんもす", "ぞうのなかま", "きょうりゅうではなく、ほにゅうるいだよ。"],
  [
    "ぷてらのどん",
    "よくりゅう",
    "そらをとぶはちゅうるい。きょうりゅうとはべつのぐるーぷだよ。",
  ],
  [
    "もささうるす",
    "うみのはちゅうるい",
    "うみでくらしたはちゅうるい。きょうりゅうではないよ。",
  ],
  ["しゃち", "ほにゅうるい", "さかなではなく、いるかのなかまだよ。"],
];
export function question(subject, level, index = 0) {
  if (["clock", "money"].includes(subject))
    return focusedQuestion(subject, level, index);
  const n = rand(0, 999) + index;
  switch (subject) {
    case "math": {
      if (level === 3) {
        const a = rand(1, 9),
          b = rand(a + 1, 10);
        return n % 2
          ? numeric(
              `${a} と ${b}、おおきいかずは？`,
              b,
              `${b}のほうがおおきいよ。`,
            )
          : numeric(
              `${a} と ${b}、ちいさいかずは？`,
              a,
              `${a}のほうがちいさいよ。`,
            );
      }
      if (level <= 2) {
        const a = rand(1, 10);
        return numeric("● は いくつ？", a, `ひとつずつかずえると ${a}こ。`, {
          visual: "dots",
          count: a,
        });
      }
      if (level <= 6) {
        const a = rand(0, 9),
          b = rand(0, 10 - a);
        return numeric(
          `${a} ＋ ${b} ＝ ？`,
          a + b,
          `${a}に${b}をたすと${a + b}。`,
        );
      }
      if (level <= 9) {
        const a = rand(1, 10),
          b = rand(0, a);
        return numeric(
          `${a} − ${b} ＝ ？`,
          a - b,
          `${a}から${b}をひくと${a - b}。`,
        );
      }
      if (level <= 6) {
        const a = rand(10, 15),
          b = rand(1, 5);
        return numeric(
          `${a} ＋ ${b} ＝ ？`,
          a + b,
          "10のまとまりと、のこりをかずえよう。",
        );
      }
      if (level <= 15) {
        const a = rand(5, 9),
          b = rand(10 - a, 9);
        return n % 2
          ? numeric(`${a} ＋ ${b} ＝ ？`, a + b, "まず10のまとまりをつくろう。")
          : numeric(
              `${10 + a} − ${b} ＝ ？`,
              10 + a - b,
              "10からひいて、のこりをたそう。",
            );
      }
      if (level <= 18) {
        const a = rand(3, 12),
          b = rand(1, 7);
        return numeric(
          `りんごが ${a}こ。${b}こ もらうと、ぜんぶで？`,
          a + b,
          `${a}＋${b}＝${a + b}こ。`,
        );
      }
      const a = rand(11, 89);
      return n % 2
        ? numeric(
            `${a} の じゅうのくらいは？`,
            Math.floor(a / 10),
            "10がいくつあるかかんがえよう。",
          )
        : numeric(
            `${a} ＋ ${3} ＝ ？`,
            a + 3,
            "いちのくらいからけいさんしよう。",
          );
    }
    case "japanese": {
      if (level <= 4) {
        const row = kanaPairs[n % kanaPairs.length];
        return choice(
          `「${row[0]}」と おなじ ひらがなは？`,
          row[0],
          shuffle(kanaPairs.filter((x) => x !== row).map((x) => x[0])).slice(
            0,
            3,
          ),
          `「${row[0]}」のかたちをおぼえよう。`,
        );
      }
      if (level <= 7) {
        const words = [
          "きゃく",
          "しゃしん",
          "ちょうちょ",
          "ぎゅうにゅう",
          "ぱんだ",
          "きんぎょ",
          "らっぱ",
          "がっこう",
        ];
        const w = words[n % words.length];
        return choice(
          `「${w}」を えらぼう`,
          w,
          [
            w.replace(
              /[ゃゅょっ]/g,
              (c) => ({ ゃ: "や", ゅ: "ゆ", ょ: "よ", っ: "つ" })[c],
            ) + "う",
            ...words.filter((x) => x !== w),
          ],
          "ちいさいもじや、てん・まるにもちゅうもくしよう。",
        );
      }
      if (level <= 10) {
        const row = kanaPairs[n % kanaPairs.length];
        return choice(
          `「${row[0]}」の かたかなは？`,
          row[1],
          shuffle(kanaPairs.filter((x) => x !== row).map((x) => x[1])).slice(
            0,
            3,
          ),
          `${row[0]} → ${row[1]}`,
        );
      }
      if (level <= 14) {
        const row = kanji[n % kanji.length];
        return choice(
          `「${row[0]}」の よみかたは？`,
          row[1],
          shuffle(kanji.map((x) => x[1])).slice(0, 5),
          `${row[0]}は「${row[1]}」とよむよ。`,
        );
      }
      if (level <= 17) {
        const row = opposites[n % opposites.length];
        return choice(
          `「${row[0]}」の はんたいは？`,
          row[1],
          shuffle(opposites.map((x) => x[1])).slice(0, 5),
          `${row[0]} ↔ ${row[1]}`,
        );
      }
      const who = ["はる", "そら", "ゆい", "りく"][n % 4],
        what = ["りんご", "ほん", "さかな", "ぼうし"][Math.floor(n / 4) % 4];
      return choice(
        `${who}は ${what}を みつけました。\nなにを みつけた？`,
        what,
        ["りんご", "ほん", "さかな", "ぼうし"],
        `${who}がみつけたのは、${what}だね。`,
      );
    }
    case "english": {
      if (level <= 5) {
        const a = String.fromCharCode(65 + (n % 26));
        return choice(
          `「${a}」の こもじは？`,
          a.toLowerCase(),
          [1, 3, 8].map((v) => String.fromCharCode(97 + ((n + v) % 26))),
          `${a} と ${a.toLowerCase()} はおなじあるふぁべっと。`,
        );
      }
      const bank = level <= 10 ? english : level <= 15 ? enAnimals : greetings,
        row = bank[n % bank.length];
      return choice(
        `「${row[0]}」を えいごで？`,
        row[1],
        shuffle(bank.filter((x) => x !== row).map((x) => x[1])).slice(0, 3),
        `${row[0]} = ${row[1]}`,
      );
    }
    case "fish": {
      const f = FISH[n % FISH.length];
      if (level <= 8)
        return choice(
          "この さかなの なまえは？",
          f.name,
          shuffle(FISH.filter((x) => x !== f).map((x) => x.name)).slice(0, 3),
          f.fact,
          { visual: "creature", creature: f.id },
        );
      return choice(
        `${f.name}の げーむの なかの つりばは？`,
        habitats[+f.area.slice(6)],
        shuffle(habitats.filter((x) => x !== habitats[+f.area.slice(6)])).slice(
          0,
          3,
        ),
        "げーむの なかのつりばをずかんでもみてみよう。",
      );
    }
    case "dinosaurs": {
      const d = DINOS[n % DINOS.length];
      if (level <= 7)
        return choice(
          "この きょうりゅうの なまえは？",
          d.name,
          shuffle(DINOS.filter((x) => x !== d).map((x) => x.name)).slice(0, 3),
          d.fact,
          { visual: "creature", creature: d.id },
        );
      if (level <= 14)
        return choice(
          `${d.name}の たべものは？`,
          d.food,
          ["しょくぶつ", "にく", "さかななど", "しょくぶつなど", "いろいろ"],
          `${d.food}をたべたとかんがえられているよ。`,
        );
      return choice(
        `${d.name}が いた じだいは？`,
        d.era,
        ["さんじょうき", "じゅらき", "はくあき", "いま"],
        d.fact,
      );
    }
    case "animals": {
      const row = animalFacts[n % animalFacts.length];
      if (level <= 5) {
        const a = ANIMALS[n % 27];
        return choice(
          `「${a.kana}」を えらぼう`,
          a.name,
          shuffle(ANIMALS.filter((x) => x !== a).map((x) => x.name)).slice(
            0,
            3,
          ),
          a.fact,
          { visual: "creature", creature: a.id },
        );
      }
      return choice(
        `${row[0]}の とくちょう・なかまは？`,
        row[1],
        shuffle(
          animalFacts.filter((x) => x[1] !== row[1]).map((x) => x[1]),
        ).slice(0, 3),
        row[2],
      );
    }
    default:
      throw Error("Invalid subject");
  }
}
export function generateSession(subject, level) {
  const result = [],
    seen = new Set();
  for (let i = 0; i < 5; i++) {
    let q;
    for (let k = 0; k < 40; k++) {
      q = question(subject, level, i);
      const id = q.text + q.answer;
      if (!seen.has(id) || k === 39) {
        seen.add(id);
        break;
      }
    }
    if (!q.options.includes(q.answer) || q.options.length < 2)
      throw Error("invalid question definition");
    result.push(q);
  }
  return result;
}
