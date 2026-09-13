import { focusedQuestion } from "./focused-learning.js";
import { FISH, DINOS, ANIMALS } from "../data/catalog.js";

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[rand(0, a.length - 1)];
const shuffle = (a) =>
  [...a]
    .map((v) => [Math.random(), v])
    .sort((a, b) => a[0] - b[0])
    .map((x) => x[1]);

function choice(text, answer, others, explanation, extra = {}) {
  const options = [...new Set([String(answer), ...others.map(String).filter((x) => x !== String(answer))])];
  if (options.length < 2) throw Error("question needs choices");
  return {
    text,
    answer: String(answer),
    options: shuffle(options.slice(0, 4)),
    explanation,
    ...extra,
  };
}

function numeric(text, answer, explanation, extra = {}, min = 0, max = 99) {
  const set = new Set([answer]);
  for (const delta of shuffle([-10, -5, -3, -2, -1, 1, 2, 3, 5, 10])) {
    const value = answer + delta;
    if (value >= min && value <= max) set.add(value);
    if (set.size === 4) break;
  }
  for (let n = min; set.size < 4 && n <= max; n++) set.add(n);
  return choice(text, answer, [...set], explanation, extra);
}

const HIRAGANA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん".split("");
const KATAKANA = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン".split("");
const KANA_PAIRS = HIRAGANA.map((h, i) => [h, KATAKANA[i]]);
const SIMPLE_WORDS = ["いぬ", "ねこ", "そら", "はな", "やま", "かわ", "うみ", "ほん", "いえ", "あめ", "ほし", "つき", "かさ", "くつ", "みみ", "て", "あし", "くち", "とり", "むし"];
const DAKUTEN_WORDS = ["ぱんだ", "りんご", "ごま", "ぶた", "かばん", "でんわ", "びわ", "ぺん", "ぼうし", "ざりがに", "ぐみ", "げた"];
const SMALL_Y_WORDS = ["きゃく", "しゃしん", "ちょうちょ", "ぎゅうにゅう", "りょこう", "きゅうり", "しゅくだい", "にゅうがく"];
const SMALL_TSU_WORDS = ["がっこう", "きって", "こっぷ", "らっぱ", "きっぷ", "ざっし", "べっど", "ろけっと"];
const KATAKANA_WORDS = ["パン", "バス", "ペン", "テレビ", "カメラ", "ドア", "コップ", "ノート", "ゲーム", "ホテル", "アイス", "ジュース"];
const KANJI = [
  ["山", "やま"], ["川", "かわ"], ["日", "ひ"], ["月", "つき"], ["火", "ひ"],
  ["水", "みず"], ["木", "き"], ["人", "ひと"], ["口", "くち"], ["目", "め"],
  ["耳", "みみ"], ["手", "て"], ["足", "あし"], ["犬", "いぬ"], ["花", "はな"],
  ["空", "そら"], ["雨", "あめ"], ["石", "いし"], ["田", "た"], ["森", "もり"],
];
const SHORT_SENTENCES = [
  ["はるは りんごを たべました。なにを たべた？", "りんご", ["ほん", "さかな", "ぼうし"]],
  ["そらは あおい ぼうしを かぶりました。なにを かぶった？", "ぼうし", ["くつ", "かさ", "ほん"]],
  ["ゆいは ほんを よみました。なにを よんだ？", "ほん", ["てがみ", "ちず", "ざっし"]],
  ["りくは こうえんで いぬを みました。なにを みた？", "いぬ", ["ねこ", "とり", "さかな"]],
  ["めいは あかい かさを もちました。なにを もった？", "かさ", ["ぼうし", "くつ", "ぺん"]],
];

const EN_GROUPS = ["ABCDEF", "GHIJKL", "MNOPQR", "STUVWXYZ"];
const EN_COLORS_NUMBERS = [
  ["あか", "red"], ["あお", "blue"], ["きいろ", "yellow"], ["みどり", "green"],
  ["1", "one"], ["2", "two"], ["3", "three"], ["4", "four"], ["5", "five"],
];
const EN_WORDS = [
  ["ねこ", "cat"], ["いぬ", "dog"], ["さかな", "fish"], ["たいよう", "sun"],
  ["ほん", "book"], ["りんご", "apple"], ["みず", "water"], ["とり", "bird"],
];
const EN_PHRASES = [
  ["こんにちは", "Hello"], ["ありがとう", "Thank you"], ["おはよう", "Good morning"],
  ["さようなら", "Goodbye"], ["おやすみ", "Good night"], ["さかなが すき", "I like fish."],
];

const GOOD_FISH_IDS = new Set([
  "fish_01", "fish_02", "fish_03", "fish_04", "fish_05", "fish_07", "fish_09", "fish_10",
  "fish_12", "fish_15", "fish_16", "fish_17", "fish_19", "fish_20", "fish_35", "fish_39",
  "fish_43", "fish_45", "fish_53", "fish_54", "fish_55",
]);
const familiarFish = () => {
  const rows = FISH.filter((f) => GOOD_FISH_IDS.has(f.id));
  return rows.length >= 8 ? rows : FISH.slice(0, 16);
};
const fishFeature = {
  めだか: "からだが ちいさい",
  きんぎょ: "ひらひらした ひれ",
  ふな: "こいに にた からだ",
  こい: "くちの まわりに ひげがある",
  どじょう: "ほそながい からだ",
  たなご: "よこからみると ひらたい",
  あゆ: "すっきりした からだ",
  やまめ: "からだに もようがある",
  にじます: "からだに てんてんもようがある",
  うなぎ: "ながい からだ",
  さけ: "おおきな からだと つよい しっぽ",
  あじ: "ぎんいろの からだ",
  いわし: "ちいさく ぎんいろの からだ",
  まだい: "あかっぽい からだ",
  まぐろ: "すいすい はやく およぐ かたち",
  とびうお: "つばさのような おおきな ひれ",
  ちょうちんあんこう: "あたまに えさを さそう ぶぶんがある",
  りゅうぐうのつかい: "とても ながい からだ",
  ほほじろざめ: "おおきな はと とがった からだ",
  おにいとまきえい: "つばさのような おおきな ひれ",
  しーらかんす: "ふとい ひれが とくちょう",
};
const fishFact = {
  めだか: "いけや みずろで みられる ちいさな さかなだよ。",
  きんぎょ: "ひとが ながいあいだ たいせつに そだててきた さかなだよ。",
  ふな: "いけや かわで くらす みぢかな さかなだよ。",
  こい: "いけや かわで くらすよ。くちの ひげも みてみよう。",
  どじょう: "かわぞこや どろの ちかくで くらすことが おおいよ。",
  たなご: "かわや いけで くらす ちいさな さかなだよ。",
  あゆ: "かわで くらす さかな。いわに ついた こけなどを たべるよ。",
  やまめ: "つめたい かわに くらす なかまだよ。からだの もようも みてみよう。",
  にじます: "かわなどで くらすよ。からだの てんてんもようが めじるし。",
  うなぎ: "ながい からだで、かわと うみの りょうほうに かかわるよ。",
  さけ: "うみで そだち、たまごを うむため かわへ もどる なかまがいるよ。",
  あじ: "うみで くらし、むれで およぐことが おおいよ。",
  いわし: "うみで おおきな むれに なることが あるよ。",
  まだい: "うみで くらす あかっぽい さかなだよ。",
  まぐろ: "ひろい うみを はやく およぐよ。",
  とびうお: "おおきな ひれを ひろげて、みずの うえを とぶように すすむよ。",
  ちょうちんあんこう: "ふかい うみに すむ なかまがいるよ。あたまの ぶぶんで えさを さそうよ。",
  りゅうぐうのつかい: "ふかい うみに すむ、とても ながい さかなだよ。",
  ほほじろざめ: "うみで くらす おおきな さめの なかまだよ。",
  おにいとまきえい: "おおきな ひれを はばたくように うごかして およぐよ。",
  しーらかんす: "ふかい うみに すむ なかまで、ふとい ひれが とくちょうだよ。",
};

const familiarDinoNames = new Set([
  "とりけらとぷす", "すてごさうるす", "ぶらきおさうるす", "あんきろさうるす",
  "ぱらさうろろふす", "いぐあのどん", "てぃらのさうるす", "すぴのさうるす",
  "ゔぇろきらぷとる", "あろさうるす", "すてぃらこさうるす", "でぃぷろどくす",
]);
const familiarDinos = () => {
  const rows = DINOS.filter((d) => familiarDinoNames.has(d.name));
  return rows.length >= 8 ? rows : DINOS.slice(0, 12);
};
const dinoFeature = {
  horn: "かおに つのがある", plates: "せなかに おおきな いたがある", long: "くびが ながい",
  armor: "からだが よろいのよう", crest: "あたまに とくちょうがある", rex: "おおきな あたまと 2ほんあし",
  sail: "せなかに おおきな とっきがある", raptor: "2ほんあしで すばやく うごく",
};
const dinoLegs = (d) => ["rex", "sail", "raptor"].includes(d.shape) ? "2ほんあし" : "4ほんあし";

const ANIMAL_INFO = {
  らいおん: ["🦁", "そうげん", "にく", "はしる", "おおきな ねこの なかまだよ。"],
  とら: ["🐯", "もり", "にく", "はしる", "しまもようが あるよ。"],
  ぞう: ["🐘", "そうげん", "くさや は", "はしる", "ながい はなで ものを つかめるよ。"],
  きりん: ["🦒", "そうげん", "は", "はしる", "ながい くびで たかい はも たべるよ。"],
  ぱんだ: ["🐼", "もり", "たけ", "はしる", "しろと くろの からだだよ。"],
  こあら: ["🐨", "もり", "ゆーかりの は", "のぼる", "きの うえで すごすことが おおいよ。"],
  おおかみ: ["🐺", "もり", "にく", "はしる", "いぬに ちかい なかまだよ。"],
  きつね: ["🦊", "もり", "いろいろ", "はしる", "ふさふさの しっぽが あるよ。"],
  うさぎ: ["🐰", "くさはら", "くさ", "はしる", "ながい みみが あるよ。"],
  かめ: ["🐢", "みずべ", "いろいろ", "およぐ", "こうらで からだを まもるよ。"],
  かえる: ["🐸", "みずべ", "むしなど", "およぐ", "こどものころは おたまじゃくしだよ。"],
  ぺんぎん: ["🐧", "うみべ", "さかななど", "およぐ", "とりだけど そらは とばず、じょうずに およぐよ。"],
  ふくろう: ["🦉", "もり", "ちいさな どうぶつ", "とぶ", "よるに かつどうする なかまが おおいよ。"],
  わし: ["🦅", "やまや もり", "にく", "とぶ", "おおきな つばさで そらを とぶよ。"],
  いるか: ["🐬", "うみ", "さかななど", "およぐ", "さかなではなく ほにゅうるいだよ。"],
  しゃち: ["🐋", "うみ", "さかななど", "およぐ", "いるかの なかまで、とても おおきいよ。"],
  たこ: ["🐙", "うみ", "かいなど", "およぐ", "うでが 8ほん あるよ。"],
};
const animalRows = () => ANIMALS.filter((a) => ANIMAL_INFO[a.name]);

function mathQuestion(level, index) {
  if (level === 1 || level === 2) {
    const max = level === 1 ? 5 : 10;
    const count = 1 + ((index + rand(0, max - 1)) % max);
    return numeric("● は いくつ？", count, `ひとつずつ かぞえると ${count}こ。`, { visual: "dots", count }, 0, max + 3);
  }
  if (level === 3) {
    const a = rand(1, 9), b = rand(1, 9);
    if (a === b) return mathQuestion(level, index + 1);
    const wantBig = index % 2 === 0;
    const answer = wantBig ? Math.max(a, b) : Math.min(a, b);
    return numeric(`${a} と ${b}。${wantBig ? "おおきい" : "ちいさい"} かずは？`, answer, `${answer}だよ。`, {}, 0, 12);
  }
  if (level === 4) {
    const start = rand(1, 14);
    return numeric(`${start}、${start + 1}、？、${start + 3}。？に はいる かずは？`, start + 2, `${start + 2}が はいるよ。`, {}, 0, 20);
  }
  if (level === 5) {
    const a = rand(0, 5), b = rand(0, 5 - a);
    return numeric(`${a} ＋ ${b} ＝ ？`, a + b, `${a}に ${b}を たすと ${a + b}。`, {}, 0, 8);
  }
  if (level === 6) {
    const a = rand(0, 10), b = rand(0, 10 - a);
    return numeric(`${a} ＋ ${b} ＝ ？`, a + b, `${a}に ${b}を たすと ${a + b}。`, {}, 0, 12);
  }
  if (level === 7) {
    const a = rand(0, 5), b = rand(0, a);
    return numeric(`${a} − ${b} ＝ ？`, a - b, `${a}から ${b}を ひくと ${a - b}。`, {}, 0, 7);
  }
  if (level === 8) {
    const a = rand(0, 10), b = rand(0, a);
    return numeric(`${a} − ${b} ＝ ？`, a - b, `${a}から ${b}を ひくと ${a - b}。`, {}, 0, 12);
  }
  if (level === 9) {
    const value = 11 + ((index + rand(0, 9)) % 10);
    return numeric("● は いくつ？", value, `${value}こ あるよ。`, { visual: "dots", count: value }, 8, 22);
  }
  if (level === 10) {
    const a = rand(5, 15), b = rand(1, 20 - a);
    return numeric(`${a} ＋ ${b} ＝ ？`, a + b, `${a}に ${b}を たすと ${a + b}。`, {}, 0, 22);
  }
  if (level === 11) {
    const a = rand(10, 20), b = rand(1, a);
    return numeric(`${a} − ${b} ＝ ？`, a - b, `${a}から ${b}を ひくと ${a - b}。`, {}, 0, 22);
  }
  const rows = [
    ["りんごが 5こ。3こ もらうと ぜんぶで？", 8, "5 ＋ 3 ＝ 8こ。"],
    ["あめが 10こ。4こ たべると のこりは？", 6, "10 − 4 ＝ 6こ。"],
    ["あかい ぼーるが 7こ。あおい ぼーるが 5こ。ぜんぶで？", 12, "7 ＋ 5 ＝ 12こ。"],
    ["えんぴつが 15ほん。6ほん つかうと のこりは？", 9, "15 − 6 ＝ 9ほん。"],
    ["さかなが 8ひき。4ひき きたら ぜんぶで？", 12, "8 ＋ 4 ＝ 12ひき。"],
  ];
  const [text, answer, explanation] = rows[index % rows.length];
  return numeric(text, answer, explanation, {}, 0, 20);
}

function japaneseQuestion(level, index) {
  if (level === 1 || level === 2) {
    const kana = HIRAGANA[(index * 7 + rand(0, HIRAGANA.length - 1)) % HIRAGANA.length];
    const others = shuffle(HIRAGANA.filter((x) => x !== kana)).slice(0, 3);
    return choice(level === 1 ? `「${kana}」を えらぼう` : `「${kana}」と おなじ もじは？`, kana, others, `「${kana}」だよ。`);
  }
  if (level === 3) {
    const word = SIMPLE_WORDS[index % SIMPLE_WORDS.length];
    return choice(`「${word}」を えらぼう`, word, shuffle(SIMPLE_WORDS.filter((x) => x !== word)).slice(0, 3), `「${word}」だよ。`);
  }
  if (level === 4) {
    const word = DAKUTEN_WORDS[index % DAKUTEN_WORDS.length];
    return choice(`「${word}」を えらぼう`, word, shuffle(DAKUTEN_WORDS.filter((x) => x !== word)).slice(0, 3), "てん（゛）や まる（゜）を よく みよう。" );
  }
  if (level === 5) {
    const word = SMALL_Y_WORDS[index % SMALL_Y_WORDS.length];
    const wrong = word.replace(/[ゃゅょ]/g, (c) => ({ゃ:"や",ゅ:"ゆ",ょ:"よ"})[c]);
    return choice(`「${word}」を えらぼう`, word, [wrong, ...shuffle(SMALL_Y_WORDS.filter((x) => x !== word)).slice(0, 2)], "ちいさい ゃ・ゅ・ょを よく みよう。" );
  }
  if (level === 6) {
    const word = SMALL_TSU_WORDS[index % SMALL_TSU_WORDS.length];
    const wrong = word.replace(/っ/g, "つ");
    return choice(`「${word}」を えらぼう`, word, [wrong, ...shuffle(SMALL_TSU_WORDS.filter((x) => x !== word)).slice(0, 2)], "ちいさい っを よく みよう。" );
  }
  if (level === 7) {
    const row = KANA_PAIRS[index % 20];
    return choice(`「${row[0]}」の かたかなは？`, row[1], shuffle(KANA_PAIRS.filter((x) => x !== row).map((x) => x[1])).slice(0, 3), `${row[0]} → ${row[1]} だよ。`);
  }
  if (level === 8) {
    const word = KATAKANA_WORDS[index % KATAKANA_WORDS.length];
    return choice(`「${word}」を えらぼう`, word, shuffle(KATAKANA_WORDS.filter((x) => x !== word)).slice(0, 3), `「${word}」だよ。`);
  }
  if (level === 9) {
    const row = KANJI[index % KANJI.length];
    return choice(`「${row[0]}」の よみかたは？`, row[1], shuffle(KANJI.filter((x) => x !== row).map((x) => x[1])).slice(0, 3), `${row[0]}は「${row[1]}」と よむよ。`);
  }
  const [text, answer, others] = SHORT_SENTENCES[index % SHORT_SENTENCES.length];
  return choice(text, answer, others, `こたえは「${answer}」だね。`);
}

function englishQuestion(level, index) {
  if (level <= 4) {
    const group = EN_GROUPS[level - 1];
    const upper = group[index % group.length];
    return choice(`「${upper}」の こもじは？`, upper.toLowerCase(), shuffle([...group].filter((x) => x !== upper).map((x) => x.toLowerCase())).slice(0, 3), `${upper} と ${upper.toLowerCase()} は おなじ あるふぁべっと。`);
  }
  if (level === 5) {
    const upper = String.fromCharCode(65 + (index * 5) % 26);
    return choice(`「${upper.toLowerCase()}」と おなじ あるふぁべっとは？`, upper, [1, 4, 9].map((v) => String.fromCharCode(65 + ((upper.charCodeAt(0) - 65 + v) % 26))), `${upper.toLowerCase()} と ${upper} は おなじだよ。`);
  }
  const bank = level === 6 ? EN_COLORS_NUMBERS : level === 7 ? EN_WORDS : EN_PHRASES;
  const row = bank[index % bank.length];
  return choice(`「${row[0]}」を えいごで？`, row[1], shuffle(bank.filter((x) => x !== row).map((x) => x[1])).slice(0, 3), `${row[0]} = ${row[1]}`);
}

function fishQuestion(level, index) {
  const bank = familiarFish();
  const f = bank[index % bank.length];
  if (level <= 2) {
    return choice(level === 1 ? "この さかなの なまえは？" : "この さかなと おなじ なまえは？", f.name, shuffle(bank.filter((x) => x.id !== f.id).map((x) => x.name)).slice(0, 3), fishFact[f.name] || f.fact, { visual: "creature", creature: f.id });
  }
  if (level === 3) {
    const habitat = ["water_0", "water_1"].includes(f.area) ? "かわ・いけ" : "うみ";
    return choice(`${f.name}が くらす ばしょは？`, habitat, habitat === "うみ" ? ["かわ・いけ", "やま", "そら"] : ["うみ", "やま", "そら"], `${f.name}は ${habitat}の なかまだよ。`, { visual: "creature", creature: f.id });
  }
  if (level === 4) {
    const rows = bank.filter((x) => fishFeature[x.name]);
    const x = rows[index % rows.length];
    return choice(`${x.name}の みための とくちょうは？`, fishFeature[x.name], shuffle(Object.values(fishFeature).filter((v) => v !== fishFeature[x.name])).slice(0, 3), fishFact[x.name] || x.fact, { visual: "creature", creature: x.id });
  }
  const rows = bank.filter((x) => fishFact[x.name]);
  const x = rows[index % rows.length];
  if (level === 5) {
    return choice(`${x.name}について ただしいのは？`, fishFact[x.name], shuffle(rows.filter((y) => y.id !== x.id).map((y) => fishFact[y.name])).slice(0, 3), fishFact[x.name], { visual: "creature", creature: x.id });
  }
  const areaName = ["いけ", "かわ", "かいがん", "さんごしょう", "おきのうみ", "しんかい", "でんせつのうみ"][+x.area.slice(6)];
  return choice(`${x.name}の ずかんを みよう。げーむの つりばは？`, areaName, shuffle(["いけ", "かわ", "かいがん", "さんごしょう", "おきのうみ", "しんかい"].filter((v) => v !== areaName)).slice(0, 3), `${x.name}は ${areaName}で みつかるよ。`, { visual: "creature", creature: x.id });
}

function dinosaurQuestion(level, index) {
  const bank = familiarDinos();
  const d = bank[index % bank.length];
  if (level <= 2) {
    return choice(level === 1 ? "この きょうりゅうの なまえは？" : "この きょうりゅうと おなじ なまえは？", d.name, shuffle(bank.filter((x) => x.id !== d.id).map((x) => x.name)).slice(0, 3), d.fact, { visual: "creature", creature: d.id });
  }
  if (level === 3) {
    const food = d.food.includes("しょくぶつ") ? "しょくぶつ" : d.food.includes("さかな") ? "さかななど" : d.food === "にく" ? "にく" : "いろいろ";
    return choice(`${d.name}は なにを たべた？`, food, ["しょくぶつ", "にく", "さかななど", "いろいろ"].filter((x) => x !== food), `${d.name}は ${d.food}を たべたと かんがえられているよ。`, { visual: "creature", creature: d.id });
  }
  if (level === 4) {
    const feature = dinoFeature[d.shape] || "からだに とくちょうがある";
    return choice(`${d.name}の とくちょうは？`, feature, shuffle(Object.values(dinoFeature).filter((x) => x !== feature)).slice(0, 3), feature + "よ。", { visual: "creature", creature: d.id });
  }
  if (level === 5) {
    const legs = dinoLegs(d);
    return choice(`${d.name}は どちらの たいぷ？`, legs, [legs === "2ほんあし" ? "4ほんあし" : "2ほんあし", "つばさで とぶ", "あしが ない"], `${d.name}は ${legs}の たいぷだよ。`, { visual: "creature", creature: d.id });
  }
  return choice(`${d.name}が いた じだいは？`, d.era, ["じゅらき", "はくあき", "いま"].filter((x) => x !== d.era), `${d.name}は ${d.era}の きょうりゅうだよ。`, { visual: "creature", creature: d.id });
}

function animalQuestion(level, index) {
  const rows = animalRows();
  const a = rows[index % rows.length];
  const info = ANIMAL_INFO[a.name];
  if (level <= 2) {
    return choice(level === 1 ? "この いきものの なまえは？" : "この いきものと おなじ なまえは？", a.name, shuffle(rows.filter((x) => x.id !== a.id).map((x) => x.name)).slice(0, 3), info[4], { visual: "emoji", emoji: info[0] });
  }
  if (level === 3)
    return choice(`${a.name}が くらす ばしょは？`, info[1], shuffle(rows.filter((x) => x.id !== a.id).map((x) => ANIMAL_INFO[x.name][1]).filter((x) => x !== info[1])).slice(0, 3), `${a.name}は ${info[1]}で くらす なかまだよ。`, { visual: "emoji", emoji: info[0] });
  if (level === 4)
    return choice(`${a.name}が よく たべるものは？`, info[2], shuffle(rows.filter((x) => x.id !== a.id).map((x) => ANIMAL_INFO[x.name][2]).filter((x) => x !== info[2])).slice(0, 3), `${a.name}は ${info[2]}を たべるよ。`, { visual: "emoji", emoji: info[0] });
  if (level === 5)
    return choice(`${a.name}の うごきは？`, info[3], ["とぶ", "およぐ", "はしる", "のぼる"].filter((x) => x !== info[3]), `${a.name}は ${info[3]}のが とくいだよ。`, { visual: "emoji", emoji: info[0] });
  return choice(`${a.name}について ただしいのは？`, info[4], shuffle(rows.filter((x) => x.id !== a.id).map((x) => ANIMAL_INFO[x.name][4])).slice(0, 3), info[4], { visual: "emoji", emoji: info[0] });
}

export function question(subject, level, index = 0) {
  if (["clock", "money"].includes(subject)) return focusedQuestion(subject, level, index);
  switch (subject) {
    case "math": return mathQuestion(Math.max(1, Math.min(12, level)), index);
    case "japanese": return japaneseQuestion(Math.max(1, Math.min(10, level)), index);
    case "english": return englishQuestion(Math.max(1, Math.min(8, level)), index);
    case "fish": return fishQuestion(Math.max(1, Math.min(6, level)), index);
    case "dinosaurs": return dinosaurQuestion(Math.max(1, Math.min(6, level)), index);
    case "animals": return animalQuestion(Math.max(1, Math.min(6, level)), index);
    default: throw Error("Invalid subject");
  }
}


function questionId(q) {
  const visual =
    q.visual === "coins"
      ? q.coins?.join(",")
      : q.visual === "clock"
        ? `${q.hour}:${q.minute}`
        : q.visual === "creature"
          ? q.creature
          : q.visual === "emoji"
            ? q.emoji
            : q.visual === "dots"
              ? q.count
              : "";
  return `${q.text}|${q.answer}|${q.visual || ""}|${visual ?? ""}`;
}

const recentQuestions = new Map();
export function generateSession(subject, level) {
  const result = [];
  const seen = new Set();
  const key = `${subject}:${level}`;
  const recent = recentQuestions.get(key) || [];
  for (let i = 0; i < 5; i++) {
    let q = null;
    let fallback = null;
    for (let attempt = 0; attempt < 120; attempt++) {
      const candidate = question(subject, level, i + attempt * 7);
      const id = questionId(candidate);
      if (seen.has(id)) continue;
      fallback ||= candidate;
      if (!recent.includes(id)) {
        q = candidate;
        break;
      }
    }
    q ||= fallback;
    if (!q) throw Error(`not enough unique questions: ${subject} Lv${level}`);
    const id = questionId(q);
    seen.add(id);
    if (!q.options.includes(q.answer) || q.options.length < 2)
      throw Error("invalid question definition");
    result.push(q);
  }
  recentQuestions.set(
    key,
    [...recent, ...result.map(questionId)].slice(-10),
  );
  return result;
}
