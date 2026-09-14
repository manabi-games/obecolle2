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
  ["なぎは みずを のみました。なにを のんだ？", "みず", ["ぎゅうにゅう", "おちゃ", "じゅーす"]],
  ["あおは きいろい くつを はきました。なにを はいた？", "くつ", ["ぼうし", "てぶくろ", "かさ"]],
  ["りんは そらに とりを みつけました。なにを みつけた？", "とり", ["さかな", "いぬ", "むし"]],
  ["かいは つくえに えんぴつを おきました。なにを おいた？", "えんぴつ", ["けしごむ", "ほん", "かさ"]],
  ["ももは こうえんで はなを みました。なにを みた？", "はな", ["くるま", "ほん", "つき"]],
  ["れんは あさ 7じに おきました。いつ おきた？", "あさ 7じ", ["ひる 12じ", "よる 7じ", "あさ 5じ"]],
  ["ひなは 3にんで こうえんへ いきました。なんにん？", "3にん", ["1にん", "2にん", "5にん"]],
];

const EN_GROUPS = ["ABCDEF", "GHIJKL", "MNOPQR", "STUVWXYZ"];
const EN_COLORS_NUMBERS = [
  ["あか", "red"], ["あお", "blue"], ["きいろ", "yellow"], ["みどり", "green"],
  ["しろ", "white"], ["くろ", "black"], ["1", "one"], ["2", "two"],
  ["3", "three"], ["4", "four"], ["5", "five"], ["6", "six"],
];
const EN_WORDS = [
  ["ねこ", "cat"], ["いぬ", "dog"], ["さかな", "fish"], ["たいよう", "sun"],
  ["ほん", "book"], ["りんご", "apple"], ["みず", "water"], ["とり", "bird"],
  ["くるま", "car"], ["いえ", "house"], ["つき", "moon"], ["ほし", "star"],
  ["はな", "flower"], ["き", "tree"], ["あめ", "rain"], ["そら", "sky"],
];
const EN_PHRASES = [
  ["こんにちは", "Hello"], ["ありがとう", "Thank you"], ["おはよう", "Good morning"],
  ["さようなら", "Goodbye"], ["おやすみ", "Good night"], ["またね", "See you"],
  ["はい", "Yes"], ["いいえ", "No"], ["おねがいします", "Please"],
  ["さかなが すき", "I like fish."],
];

// Creature learning deliberately rotates its cast by level. v1.2 always started each
// level at index 0, which made the same first five creatures appear over and over.
const rotatePool = (rows, level, width, step) => {
  if (!rows.length) return [];
  const out = [];
  const start = ((level - 1) * step) % rows.length;
  for (let i = 0; i < Math.min(width, rows.length); i++) out.push(rows[(start + i) % rows.length]);
  return out;
};
const fishPool = (level) => rotatePool(FISH, level, 14, 9);
const dinoPool = (level) => rotatePool(DINOS, level, 10, 5);

const FISH_INFO = {
  めだか: ["ちいさな からだ", "いけや みずろなどで みられる ちいさな さかなだよ。"],
  きんぎょ: ["ひらひらした ひれ", "ひとが ながいあいだ そだててきた さかなだよ。"],
  ふな: ["こいに にた からだ", "いけや かわで くらす みぢかな さかなだよ。"],
  こい: ["くちの まわりの ひげ", "いけや かわで くらし、くちの ひげが めじるしだよ。"],
  どじょう: ["ほそながい からだ", "かわぞこや どろの ちかくで くらすことが おおいよ。"],
  なまず: ["おおきな くちと ひげ", "かわや いけに くらす なかまだよ。"],
  あゆ: ["すっきりした からだ", "かわで くらし、いわに ついた こけなどを たべるよ。"],
  やまめ: ["からだの もよう", "つめたい かわに くらす なかまだよ。"],
  いわな: ["やまの かわに くらす", "つめたい やまの かわに くらす なかまだよ。"],
  にじます: ["からだの てんてん", "からだの てんてんもようが めじるしだよ。"],
  うなぎ: ["とても ながい からだ", "かわと うみの りょうほうに かかわって くらすよ。"],
  さけ: ["つよい しっぽ", "うみで そだち、たまごを うむため かわへ もどる なかまがいるよ。"],
  あじ: ["ぎんいろの からだ", "うみで むれになって およぐことが おおいよ。"],
  さば: ["せなかの しまもよう", "うみを すばやく およぐ さかなだよ。"],
  いわし: ["ちいさな ぎんいろの からだ", "うみで おおきな むれに なることが あるよ。"],
  まだい: ["あかっぽい からだ", "うみで くらす あかっぽい さかなだよ。"],
  ひらめ: ["ひらたい からだ", "うみの そこに ちかい ところで くらす ひらたい さかなだよ。"],
  はりせんぼん: ["とげの ある からだ", "からだを ふくらませる なかまがいるよ。"],
  うつぼ: ["ながく くねった からだ", "いわの すきまなどに かくれることが あるよ。"],
  まぐろ: ["はやく およぎやすい からだ", "ひろい うみを はやく およぐ さかなだよ。"],
  とびうお: ["つばさのような おおきな ひれ", "おおきな ひれを ひろげて みずの うえを すすむよ。"],
  まんぼう: ["まるく ひらたい からだ", "おおきく ひらたい からだが とくちょうだよ。"],
  しゅもくざめ: ["かなづちのような あたま", "よこに ひろがった あたまが とくちょうの さめだよ。"],
  ちょうちんあんこう: ["あたまの えさを さそう ぶぶん", "ふかい うみに すむ なかまがいるよ。"],
  りゅうぐうのつかい: ["とても ながい からだ", "ふかい うみに すむ、とても ながい さかなだよ。"],
  らぶか: ["ながい からだの さめ", "ふかい うみに すむ さめの なかまだよ。"],
  みつくりざめ: ["まえに のびた くちもと", "ふかい うみに すむ さめの なかまだよ。"],
  じんべえざめ: ["とても おおきな からだ", "げんざい しられている さかなの なかで もっとも おおきな なかまだよ。"],
  ほほじろざめ: ["おおきな はと からだ", "うみで くらす おおきな さめの なかまだよ。"],
  おにいとまきえい: ["つばさのような おおきな ひれ", "おおきな ひれを はばたくように うごかして およぐよ。"],
  しーらかんす: ["ふとい ひれ", "ふかい うみに すむ なかまで、ふとい ひれが とくちょうだよ。"],
};
const fishInfoRows = () => FISH.filter((f) => FISH_INFO[f.name]);
const fishHome = (f) => ["water_0", "water_1"].includes(f.area) ? "かわ・いけ" : "うみ";
const fishAreaName = (f) => ["はじまりのいけ", "おおきなかわ", "かいがん", "さんごしょう", "おきのうみ", "しんかい", "でんせつのうみ"][+f.area.slice(6)];

const dinoFeature = {
  horn: "かおに つのがある",
  plates: "せなかに おおきな いたがある",
  long: "くびと しっぽが ながい",
  armor: "からだが よろいのよう",
  crest: "あたまの かたちに とくちょうがある",
  rex: "おおきな あたまと 2ほんあし",
  sail: "せなかに おおきな とっきがある",
  raptor: "2ほんあしで うごく からだ",
};
const sizeBand = (length) => length < 5 ? "5mより ちいさい" : length <= 12 ? "5〜12mくらい" : "12mより おおきい";

const ANIMAL_INFO = {
  らいおん: ["🦁", "そうげん", "にく", "はしる", "おすには たてがみが ある なかまがいるよ。"],
  とら: ["🐯", "もり", "にく", "はしる", "しまもようが ある おおきな ねこの なかまだよ。"],
  ぞう: ["🐘", "そうげん", "くさや は", "あるく", "ながい はなで ものを つかめるよ。"],
  かば: ["🦛", "みずべ", "くさ", "はしる", "みずべで くらし、おおきな くちが とくちょうだよ。"],
  さい: ["🦏", "そうげん", "くさや は", "はしる", "はなの うえの つのが めじるしだよ。"],
  ごりら: ["🦍", "もり", "はや くだもの", "あるく", "おおきな からだの さるの なかまだよ。"],
  きりん: ["🦒", "そうげん", "は", "はしる", "ながい くびで たかい ところの はも たべるよ。"],
  しまうま: ["🦓", "そうげん", "くさ", "はしる", "しろと くろの しまもようが あるよ。"],
  ぱんだ: ["🐼", "もり", "たけ", "あるく", "しろと くろの からだで、たけを よく たべるよ。"],
  こあら: ["🐨", "もり", "ゆーかりの は", "のぼる", "きの うえで すごすことが おおいよ。"],
  かんがるー: ["🦘", "くさはら", "くさや は", "じゃんぷ", "つよい うしろあしで じゃんぷするよ。"],
  ひぐま: ["🐻", "もりや やま", "いろいろ", "あるく", "おおきな からだの くまの なかまだよ。"],
  おおかみ: ["🐺", "もりや そうげん", "にく", "はしる", "いぬに ちかい なかまだよ。"],
  きつね: ["🦊", "もりや そうげん", "いろいろ", "はしる", "ふさふさの しっぽが あるよ。"],
  うさぎ: ["🐰", "くさはら", "くさ", "じゃんぷ", "ながい みみと つよい うしろあしが あるよ。"],
  りす: ["🐿️", "もり", "きのみ", "のぼる", "きに のぼるのが とくいな なかまがいるよ。"],
  しか: ["🦌", "もりや くさはら", "くさや は", "はしる", "おすに つのが ある なかまがいるよ。"],
  らくだ: ["🐫", "さばく", "くさなど", "あるく", "せなかの こぶが とくちょうだよ。"],
  あるぱか: ["🦙", "こうげん", "くさ", "あるく", "ふわふわした けに おおわれているよ。"],
  わに: ["🐊", "みずべ", "にく", "およぐ", "おおきな くちと つよい しっぽが あるよ。"],
  かめ: ["🐢", "みずべ", "いろいろ", "およぐ", "こうらで からだを まもるよ。"],
  かえる: ["🐸", "みずべ", "むしなど", "じゃんぷ", "こどものころは おたまじゃくしだよ。"],
  ぺんぎん: ["🐧", "うみべ", "さかななど", "およぐ", "とりだけど そらは とばず、じょうずに およぐよ。"],
  ふくろう: ["🦉", "もり", "ちいさな どうぶつなど", "とぶ", "よるに かつどうする なかまが おおいよ。"],
  わし: ["🦅", "やまや もり", "にく", "とぶ", "おおきな つばさで そらを とぶよ。"],
  いるか: ["🐬", "うみ", "さかななど", "およぐ", "さかなではなく ほにゅうるいだよ。"],
  しゃち: ["🐋", "うみ", "さかななど", "およぐ", "いるかの なかまで、とても おおきいよ。"],
  あざらし: ["🦭", "うみ", "さかななど", "およぐ", "ひれのような あしで じょうずに およぐよ。"],
  らっこ: ["🦦", "うみ", "かいや うになど", "およぐ", "うみの うえで あおむけに うかぶことが あるよ。"],
  たこ: ["🐙", "うみ", "かいや えびなど", "およぐ", "うでが 8ほん あるよ。"],
};
const animalRows = () => ANIMALS.filter((a) => ANIMAL_INFO[a.name]);
const animalPool = (level) => rotatePool(animalRows(), level, 12, 5);

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
    return choice(
      `「${upper}」の こもじは？`,
      upper.toLowerCase(),
      shuffle([...group].filter((x) => x !== upper).map((x) => x.toLowerCase())).slice(0, 3),
      `${upper} と ${upper.toLowerCase()} は おなじ あるふぁべっと。`,
      { speak: upper, speakLang: "en-US" },
    );
  }
  if (level === 5) {
    const upper = String.fromCharCode(65 + (index * 5) % 26);
    return choice(
      `「${upper.toLowerCase()}」と おなじ あるふぁべっとは？`,
      upper,
      [1, 4, 9].map((v) => String.fromCharCode(65 + ((upper.charCodeAt(0) - 65 + v) % 26))),
      `${upper.toLowerCase()} と ${upper} は おなじだよ。`,
      { speak: upper, speakLang: "en-US" },
    );
  }
  const bank = level === 6 ? EN_COLORS_NUMBERS : level === 7 ? EN_WORDS : EN_PHRASES;
  const row = bank[index % bank.length];
  return choice(
    `「${row[0]}」を えいごで？`,
    row[1],
    shuffle(bank.filter((x) => x !== row).map((x) => x[1])).slice(0, 3),
    `${row[0]} = ${row[1]}`,
    { speak: row[1], speakLang: "en-US" },
  );
}

function fishQuestion(level, index) {
  if (level === 1) {
    const bank = fishPool(level);
    const f = pick(bank);
    return choice(
      "この さかなの なまえは？",
      f.name,
      shuffle(bank.filter((x) => x.id !== f.id).map((x) => x.name)).slice(0, 3),
      `${f.name}だよ。`,
      { visual: "creature", creature: f.id },
    );
  }
  if (level === 2) {
    const bank = fishPool(level);
    const f = pick(bank);
    const home = fishHome(f);
    return choice(
      `${f.name}は どちらの なかま？`,
      home,
      home === "うみ" ? ["かわ・いけ", "やま", "そら"] : ["うみ", "やま", "そら"],
      `${f.name}は ${home}で くらす なかまだよ。`,
      { visual: "creature", creature: f.id },
    );
  }
  if (level === 3 || level === 4) {
    const rows = fishInfoRows();
    const offsetRows = rotatePool(rows, level, Math.min(18, rows.length), 11);
    const f = pick(offsetRows);
    const info = FISH_INFO[f.name];
    if (level === 3)
      return choice(
        `${f.name}の みための とくちょうは？`,
        info[0],
        shuffle(rows.filter((x) => x.id !== f.id).map((x) => FISH_INFO[x.name][0])).slice(0, 3),
        info[1],
        { visual: "creature", creature: f.id },
      );
    return choice(
      `${f.name}について ただしいのは？`,
      info[1],
      shuffle(rows.filter((x) => x.id !== f.id).map((x) => FISH_INFO[x.name][1])).slice(0, 3),
      info[1],
      { visual: "creature", creature: f.id },
    );
  }
  if (level === 5) {
    const f = pick(fishPool(level));
    const areaName = fishAreaName(f);
    return choice(
      `${f.name}は このゲームの どの つりばで みつかる？`,
      areaName,
      shuffle(["はじまりのいけ", "おおきなかわ", "かいがん", "さんごしょう", "おきのうみ", "しんかい", "でんせつのうみ"].filter((v) => v !== areaName)).slice(0, 3),
      `${f.name}は「${areaName}」で みつかるよ。`,
      { visual: "creature", creature: f.id },
    );
  }
  const f = pick(FISH);
  const kind = index % 3;
  if (kind === 0)
    return choice(
      "この さかなの なまえを おさらい！",
      f.name,
      shuffle(FISH.filter((x) => x.id !== f.id).map((x) => x.name)).slice(0, 3),
      `${f.name}だよ。`,
      { visual: "creature", creature: f.id },
    );
  if (kind === 1) {
    const home = fishHome(f);
    return choice(
      `${f.name}の くらす ばしょを おさらい！`,
      home,
      home === "うみ" ? ["かわ・いけ", "やま", "そら"] : ["うみ", "やま", "そら"],
      `${f.name}は ${home}の なかまだよ。`,
      { visual: "creature", creature: f.id },
    );
  }
  const areaName = fishAreaName(f);
  return choice(
    `${f.name}の つりばを おさらい！`,
    areaName,
    shuffle(["はじまりのいけ", "おおきなかわ", "かいがん", "さんごしょう", "おきのうみ", "しんかい", "でんせつのうみ"].filter((v) => v !== areaName)).slice(0, 3),
    `このゲームでは「${areaName}」で みつかるよ。`,
    { visual: "creature", creature: f.id },
  );
}

function dinosaurQuestion(level, index) {
  const bank = level === 6 ? DINOS : dinoPool(level);
  const d = pick(bank);
  if (level === 1)
    return choice(
      "この きょうりゅうの なまえは？",
      d.name,
      shuffle(bank.filter((x) => x.id !== d.id).map((x) => x.name)).slice(0, 3),
      `${d.name}だよ。`,
      { visual: "creature", creature: d.id },
    );
  if (level === 2) {
    const food = d.food.includes("しょくぶつ") ? "しょくぶつ" : d.food.includes("さかな") ? "さかななど" : d.food === "にく" ? "にく" : "いろいろ";
    return choice(
      `${d.name}は なにを たべた？`,
      food,
      ["しょくぶつ", "にく", "さかななど", "いろいろ"].filter((x) => x !== food),
      `${d.name}は ${d.food}を たべたと かんがえられているよ。`,
      { visual: "creature", creature: d.id },
    );
  }
  if (level === 3)
    return choice(
      `${d.name}が いた じだいは？`,
      d.era,
      ["じゅらき", "はくあき", "いま"].filter((x) => x !== d.era),
      `${d.name}は ${d.era}の きょうりゅうだよ。`,
      { visual: "creature", creature: d.id },
    );
  if (level === 4) {
    const feature = dinoFeature[d.shape] || "からだの かたちに とくちょうがある";
    return choice(
      `${d.name}の とくちょうは？`,
      feature,
      shuffle(Object.values(dinoFeature).filter((x) => x !== feature)).slice(0, 3),
      `${feature}よ。`,
      { visual: "creature", creature: d.id },
    );
  }
  if (level === 5) {
    const band = sizeBand(d.length);
    return choice(
      `${d.name}の たいちょうの めやすは？`,
      band,
      ["5mより ちいさい", "5〜12mくらい", "12mより おおきい"].filter((x) => x !== band),
      `このゲームの ずかんでは やく${d.length}mとしているよ。`,
      { visual: "creature", creature: d.id },
    );
  }
  const asksEra = index % 2 === 0;
  if (asksEra)
    return choice(
      `${d.name}の じだいを おさらい！`,
      d.era,
      ["じゅらき", "はくあき", "いま"].filter((x) => x !== d.era),
      `${d.name}は ${d.era}の きょうりゅうだよ。`,
      { visual: "creature", creature: d.id },
    );
  const food = d.food.includes("しょくぶつ") ? "しょくぶつ" : d.food.includes("さかな") ? "さかななど" : d.food === "にく" ? "にく" : "いろいろ";
  return choice(
    `${d.name}の たべものを おさらい！`,
    food,
    ["しょくぶつ", "にく", "さかななど", "いろいろ"].filter((x) => x !== food),
    `${d.name}は ${d.food}を たべたと かんがえられているよ。`,
    { visual: "creature", creature: d.id },
  );
}

function animalQuestion(level, index) {
  const rows = animalPool(level);
  const a = pick(rows);
  const info = ANIMAL_INFO[a.name];
  const extra = { visual: "emoji", emoji: info[0], creature: a.id };
  if (level === 1)
    return choice(
      "この いきものの なまえは？",
      a.name,
      shuffle(rows.filter((x) => x.id !== a.id).map((x) => x.name)).slice(0, 3),
      info[4],
      extra,
    );
  if (level === 2)
    return choice(
      `${a.name}が よく くらす ばしょは？`,
      info[1],
      shuffle(rows.filter((x) => x.id !== a.id).map((x) => ANIMAL_INFO[x.name][1]).filter((x) => x !== info[1])).slice(0, 3),
      `${a.name}は ${info[1]}で くらす なかまがいるよ。`,
      extra,
    );
  if (level === 3)
    return choice(
      `${a.name}が よく たべるものは？`,
      info[2],
      shuffle(rows.filter((x) => x.id !== a.id).map((x) => ANIMAL_INFO[x.name][2]).filter((x) => x !== info[2])).slice(0, 3),
      `${a.name}は ${info[2]}などを たべるよ。`,
      extra,
    );
  if (level === 4)
    return choice(
      `${a.name}の うごきで とくいなのは？`,
      info[3],
      shuffle(["はしる", "あるく", "のぼる", "およぐ", "とぶ", "じゃんぷ"].filter((x) => x !== info[3])).slice(0, 3),
      `${a.name}は ${info[3]}のが とくいだよ。`,
      extra,
    );
  if (level === 5)
    return choice(
      `${a.name}について ただしいのは？`,
      info[4],
      shuffle(rows.filter((x) => x.id !== a.id).map((x) => ANIMAL_INFO[x.name][4])).slice(0, 3),
      info[4],
      extra,
    );
  const kind = index % 3;
  if (kind === 0)
    return choice(
      "この いきものの なまえを おさらい！",
      a.name,
      shuffle(rows.filter((x) => x.id !== a.id).map((x) => x.name)).slice(0, 3),
      info[4],
      extra,
    );
  if (kind === 1)
    return choice(
      `${a.name}の くらす ばしょを おさらい！`,
      info[1],
      shuffle(rows.filter((x) => x.id !== a.id).map((x) => ANIMAL_INFO[x.name][1]).filter((x) => x !== info[1])).slice(0, 3),
      `${a.name}は ${info[1]}で くらす なかまがいるよ。`,
      extra,
    );
  return choice(
    `${a.name}の とくちょうを おさらい！`,
    info[4],
    shuffle(rows.filter((x) => x.id !== a.id).map((x) => ANIMAL_INFO[x.name][4])).slice(0, 3),
    info[4],
    extra,
  );
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
    [...recent, ...result.map(questionId)].slice(-20),
  );
  return result;
}
