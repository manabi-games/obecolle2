export const RANKS = [0, 1, 5, 10, 18, 28, 40, 52, 64, 75];
export const BUDDY = [
  100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500,
];
const SUBJECT_LEVELS = {
  math: 12,
  japanese: 10,
  clock: 6,
  money: 6,
  english: 8,
  fish: 6,
  dinosaurs: 6,
  animals: 6,
};
export const SUBJECTS = [
  ["math", "さんすう", "＋"],
  ["japanese", "こくご", "あ"],
  ["clock", "とけい", "🕒"],
  ["money", "おかね", "¥"],
  ["english", "えいご", "A"],
  ["fish", "さかな", "🐟"],
  ["dinosaurs", "きょうりゅう", "🦖"],
  ["animals", "いきもの", "🐾"],
].map(([id, name, icon]) => ({
  id,
  name,
  icon,
  maxLevel: SUBJECT_LEVELS[id],
}));
export const CORE_SUBJECT_IDS = ["math", "japanese", "english"];
export const FACILITIES = [
  ["mansion", "おべこれまんしょん", 1, 0, -8, "#f6c887"],
  ["school", "まなびがっこう", 1, 9, -6, "#ef987a"],
  ["typing", "たいぴんぐはっくつじょ", 2, 12, 1, "#80c9df"],
  ["arena", "さいきょうありーな", 8, 9, 8, "#b4a0dc"],
  ["fishing", "つりみなと", 4, -1, 11, "#69b9c8"],
  ["shop", "しょっぷすとりーと", 3, -9, 6, "#e8abbd"],
  ["excavation", "はっくつしま", 6, -14, -3, "#cbb080"],
  ["plaza", "まんなかひろば", 1, 0, 1, "#a9cb87"],
].map(([id, name, rank, x, z, color]) => ({ id, name, rank, x, z, color }));
export const FISH_AREAS = [
  "はじまりのいけ",
  "おおきなかわ",
  "かいがん",
  "さんごしょう",
  "おきのうみ",
  "しんかい",
  "でんせつのうみ",
].map((name, i) => ({
  id: "water_" + i,
  name,
  rank: [4, 5, 5, 7, 7, 9, 10][i],
  species: i === 3 ? 20 : 0,
}));
export const DIG_AREAS = [
  "はじめてのいわば",
  "あかいたに",
  "おおきなかせきひろば",
  "こだいのもり",
  "ふしぎなちそう",
  "でんせつのはっくつばしょ",
].map((name, i) => ({
  id: "dig_" + i,
  name,
  rank: [6, 7, 7, 8, 9, 10][i],
  completed: i === 2 ? 5 : i === 4 ? 15 : 0,
}));
const fishRows = [
  ["めだか", "めだか", 0, 4],
  ["きんぎょ", "きんぎょ", 0, 20],
  ["ふな", "ふな", 0, 30],
  ["こい", "こい", 0, 70],
  ["どじょう", "どじょう", 0, 15],
  ["なまず", "なまず", 0, 60],
  ["たなご", "たなご", 0, 8],
  ["もつご", "もつご", 0, 8],
  ["あゆ", "あゆ", 1, 25],
  ["やまめ", "やまめ", 1, 25],
  ["いわな", "いわな", 1, 35],
  ["にじます", "にじます", 1, 50],
  ["うぐい", "うぐい", 1, 30],
  ["おいかわ", "おいかわ", 1, 15],
  ["うなぎ", "うなぎ", 1, 80],
  ["さけ", "さけ", 1, 80],
  ["あじ", "あじ", 2, 30],
  ["さば", "さば", 2, 40],
  ["いわし", "いわし", 2, 20],
  ["まだい", "まだい", 2, 60],
  ["くろだい", "くろだい", 2, 45],
  ["ひらめ", "ひらめ", 2, 60],
  ["かれい", "かれい", 2, 35],
  ["きす", "きす", 2, 25],
  ["すずき", "すずき", 2, 80],
  ["ぼら", "ぼら", 2, 50],
  ["かくれくまのみ", "かくれくまのみ", 3, 10],
  ["なんようはぎ", "なんようはぎ", 3, 25],
  ["ちょうちょううお", "ちょうちょううお", 3, 20],
  ["つのだし", "つのだし", 3, 20],
  ["ぶだい", "ぶだい", 3, 40],
  ["はりせんぼん", "はりせんぼん", 3, 30],
  ["みのかさご", "みのかさご", 3, 25],
  ["うつぼ", "うつぼ", 3, 100],
  ["まぐろ", "まぐろ", 4, 220],
  ["かつお", "かつお", 4, 70],
  ["しいら", "しいら", 4, 120],
  ["かじき", "かじき", 4, 300],
  ["とびうお", "とびうお", 4, 30],
  ["まんぼう", "まんぼう", 4, 250],
  ["よしきりざめ", "よしきりざめ", 4, 300],
  ["しゅもくざめ", "しゅもくざめ", 4, 350],
  ["ちょうちんあんこう", "ちょうちんあんこう", 5, 40],
  ["ふうせんうなぎ", "ふうせんうなぎ", 5, 80],
  ["りゅうぐうのつかい", "りゅうぐうのつかい", 5, 500],
  ["らぶか", "らぶか", 5, 180],
  ["みつくりざめ", "みつくりざめ", 5, 350],
  ["でめにぎす", "でめにぎす", 5, 15],
  ["きんめだい", "きんめだい", 5, 40],
  ["あかむつ", "あかむつ", 5, 35],
  ["ほうらいえそ", "ほうらいえそ", 5, 25],
  ["じんべえざめ", "じんべえざめ", 6, 1000],
  ["ほほじろざめ", "ほほじろざめ", 6, 500],
  ["おにいとまきえい", "おにいとまきえい", 6, 500],
  ["しーらかんす", "しーらかんす", 6, 150],
  ["めがまうす", "めがまうす", 6, 450],
  ["なぽれおんふぃっしゅ", "なぽれおんふぃっしゅ", 6, 180],
  ["たまかい", "たまかい", 6, 220],
  ["ろうにんあじ", "ろうにんあじ", 6, 150],
  ["ばしょうかじき", "ばしょうかじき", 6, 280],
];
const FISH_RARITIES = [1, 1, 1, 2, 1, 2, 2, 1, 1, 2, 2, 2, 1, 1, 3, 3, 1, 1, 1, 2, 2, 2, 1, 1, 2, 1, 1, 2, 2, 2, 2, 2, 3, 3, 2, 1, 2, 3, 1, 3, 3, 4, 2, 3, 4, 4, 4, 3, 2, 2, 3, 4, 4, 3, 5, 4, 3, 4, 3, 4];
const FISH_VISUAL = {
  めだか: "tiny", たなご: "tiny", もつご: "tiny",
  どじょう: "eel", うなぎ: "eel", うつぼ: "eel", ふうせんうなぎ: "eel",
  ひらめ: "flat", かれい: "flat",
  はりせんぼん: "puffer", かじき: "sword", ばしょうかじき: "sword",
  まんぼう: "sunfish", ちょうちんあんこう: "angler",
  おにいとまきえい: "ray", りゅうぐうのつかい: "ribbon",
  よしきりざめ: "shark", しゅもくざめ: "shark", らぶか: "shark",
  みつくりざめ: "shark", じんべえざめ: "shark",
  ほほじろざめ: "shark", めがまうす: "shark",
};
export const FISH = fishRows.map(([name, kana, area, size], i) => ({
  id: "fish_" + String(i + 1).padStart(2, "0"),
  name,
  kana,
  area: "water_" + area,
  rarity: FISH_RARITIES[i],
  size,
  color: ["#f2a969", "#7ac8d0", "#95b4db", "#e7c960", "#b6a0d1"][i % 5],
  shape: FISH_VISUAL[name] || "fish",
  fact:
    area === 0
      ? "いけや みずろの なかま。ひれのうごきをみてみよう。"
      : area === 1
        ? "かわのなかま。からだのもようにもちゅうもく。"
        : area === 5
          ? "ふかいうみのなかま。すむふかさはしゅるいでちがうよ。"
          : "うみのなかま。からだやひれのかたちをみくらべよう。",
}));
const dinoRows = [
  ["とりけらとぷす", "とりけらとぷす", "しょくぶつ", "はくあき", 9, "horn"],
  ["すてごさうるす", "すてごさうるす", "しょくぶつ", "じゅらき", 9, "plates"],
  [
    "ぶらきおさうるす",
    "ぶらきおさうるす",
    "しょくぶつ",
    "じゅらき",
    25,
    "long",
  ],
  [
    "あんきろさうるす",
    "あんきろさうるす",
    "しょくぶつ",
    "はくあき",
    8,
    "armor",
  ],
  [
    "ぱらさうろろふす",
    "ぱらさうろろふす",
    "しょくぶつ",
    "はくあき",
    10,
    "crest",
  ],
  ["いぐあのどん", "いぐあのどん", "しょくぶつ", "はくあき", 10, "crest"],
  ["でぃぷろどくす", "でぃぷろどくす", "しょくぶつ", "じゅらき", 27, "long"],
  ["あぱとさうるす", "あぱとさうるす", "しょくぶつ", "じゅらき", 23, "long"],
  [
    "ぱきけふぁろさうるす",
    "ぱきけふぁろさうるす",
    "しょくぶつなど",
    "はくあき",
    5,
    "crest",
  ],
  [
    "すてぃらこさうるす",
    "すてぃらこさうるす",
    "しょくぶつ",
    "はくあき",
    6,
    "horn",
  ],
  ["てぃらのさうるす", "てぃらのさうるす", "にく", "はくあき", 12, "rex"],
  ["あろさうるす", "あろさうるす", "にく", "じゅらき", 9, "rex"],
  ["すぴのさうるす", "すぴのさうるす", "さかななど", "はくあき", 15, "sail"],
  ["ゔぇろきらぷとる", "べろきらぷとる", "にく", "はくあき", 2, "raptor"],
  ["でいのにくす", "でいのにくす", "にく", "はくあき", 3, "raptor"],
  ["かるのたうるす", "かるのたうるす", "にく", "はくあき", 8, "rex"],
  ["けらとさうるす", "けらとさうるす", "にく", "じゅらき", 6, "rex"],
  ["ばりおにくす", "ばりおにくす", "さかななど", "はくあき", 9, "sail"],
  ["かまらさうるす", "かまらさうるす", "しょくぶつ", "じゅらき", 18, "long"],
  ["まいあさうら", "まいあさうら", "しょくぶつ", "はくあき", 9, "crest"],
  ["こりとさうるす", "こりとさうるす", "しょくぶつ", "はくあき", 9, "crest"],
  [
    "えどもんとさうるす",
    "えどもんとさうるす",
    "しょくぶつ",
    "はくあき",
    12,
    "crest",
  ],
  [
    "ぷしったこさうるす",
    "ぷしったこさうるす",
    "しょくぶつ",
    "はくあき",
    2,
    "horn",
  ],
  [
    "けんとろさうるす",
    "けんとろさうるす",
    "しょくぶつ",
    "じゅらき",
    5,
    "plates",
  ],
  ["みんみ", "みんみ", "しょくぶつ", "はくあき", 3, "armor"],
  ["ぎがのとさうるす", "ぎがのとさうるす", "にく", "はくあき", 13, "rex"],
  [
    "あるぜんちのさうるす",
    "あるぜんちのさうるす",
    "しょくぶつ",
    "はくあき",
    30,
    "long",
  ],
  [
    "てりじのさうるす",
    "てりじのさうるす",
    "しょくぶつなど",
    "はくあき",
    10,
    "raptor",
  ],
  ["おゔぃらぷとる", "おびらぷとる", "いろいろ", "はくあき", 2, "raptor"],
  ["おるにとみむす", "おるにとみむす", "いろいろ", "はくあき", 4, "raptor"],
];
export const DINOS = dinoRows.map(
  ([name, kana, food, era, length, shape], i) => ({
    id: "dino_" + String(i + 1).padStart(2, "0"),
    name,
    kana,
    food,
    era,
    length,
    shape,
    area: "dig_" + Math.floor(i / 5),
    parts: ["head", "body", "legs", "tail"],
    color: ["#98bc7b", "#dfa17c", "#89bbbd", "#b5a1c8", "#dec67c"][i % 5],
    fact: `${era}のきょうりゅう。たいちょうはやく${length}mとかんがえられているよ。`,
  }),
);
const ANIMAL_VISUAL = {
  らいおん: "feline", とら: "feline", すみろどん: "feline",
  ぞう: "elephant", まんもす: "elephant", かば: "hippo", さい: "rhino",
  ごりら: "primate", きりん: "giraffe", ぱんだ: "bear", ひぐま: "bear",
  こあら: "koala", かんがるー: "kangaroo", うさぎ: "rabbit", りす: "squirrel",
  らくだ: "camel", わに: "crocodile", かめ: "turtle", かえる: "frog",
  ぺんぎん: "bird", だちょう: "bird", ふくろう: "bird", わし: "bird",
  いるか: "cetacean", しゃち: "cetacean", しろながすくじら: "cetacean",
  あざらし: "pinniped", らっこ: "otter", たこ: "octopus", くらげ: "jellyfish",
  めがろどん: "shark", もささうるす: "marine_reptile",
  ぷてらのどん: "pterosaur", えらすもさうるす: "plesiosaur",
};
const animalNames =
  "らいおん,とら,ぞう,かば,さい,ごりら,きりん,しまうま,ぱんだ,こあら,かんがるー,ひぐま,おおかみ,きつね,たぬき,うさぎ,りす,しか,らくだ,あるぱか,わに,かめ,かえる,ぺんぎん,だちょう,ふくろう,わし,いるか,しゃち,しろながすくじら,あざらし,らっこ,たこ,くらげ,まんもす,すみろどん,めがろどん,もささうるす,ぷてらのどん,えらすもさうるす".split(
    ",",
  );
export const ANIMALS = animalNames.map((name, i) => ({
  id: "animal_" + (i + 1),
  name,
  kana: name,
  category: i >= 34 ? "ancient" : i >= 27 ? "ocean" : "land",
  shape: ANIMAL_VISUAL[name] || "quadruped",
  color: ["#ddab74", "#cf985d", "#a4b8bc", "#99b5a0", "#cfb1c5"][i % 5],
  fact:
    i >= 34
      ? "おおむかしにいきていたいきもの。きょうりゅうとはべつのぐるーぷだよ。"
      : "すがたやうごきに、それぞれのとくちょうがあるよ。",
}));
export const CREATURES = [
  ...DINOS.map((x) => ({ ...x, category: "dinosaur" })),
  ...FISH.map((x) => ({ ...x, category: "ocean" })),
  ...ANIMALS,
].map((x, i) => ({
  ...x,
  stats: {
    power: 40 + ((i * 13) % 51),
    speed: 40 + ((i * 7) % 51),
    guard: 40 + ((i * 11) % 51),
    special: 40 + ((i * 17) % 51),
  },
  move: [
    "きらめきうぇーぶ",
    "ほしぞらだっしゅ",
    "にじいろすぱーく",
    "ひだまりがーど",
  ][i % 4],
}));
const names =
  "はる,そら,ゆい,りく,めい,なぎ,あお,りん,かい,もも,れん,ひな,とわ,こと,ふう,みな,せな,ゆず,のあ,すい,るい,さき,たく,えま,にこ,ゆき,けい,あん,れお,ほし".split(
    ",",
  );
export const FRIENDS = names.map((name, i) => ({
  id: i === 0 ? "friend_haru" : "friend_" + (i + 1),
  name,
  personality: [
    "げんき",
    "ものしり",
    "のんびり",
    "ちょうせん",
    "しっかり",
    "おもしろ",
  ][i % 6],
  favoriteTopics: [SUBJECTS[i % 8].id],
  favoriteFood: ["りんご", "おにぎり", "ぱん", "いちご"][i % 4],
  favoriteActivity: [
    "つり",
    "どくしょ",
    "たいぴんぐ",
    "はっくつ",
    "べんきょう",
    "おしゃべり",
  ][i % 6],
  weakSubject: SUBJECTS[(i + 3) % 8].id,
  strongSubject: SUBJECTS[i % 8].id,
  homeRoom: i + 1,
  baseAppearance: {
    hair: i % 12,
    hairColor: i % 8,
    skin: i % 5,
    face: i % 6,
    eyes: i % 12,
    nose: i % 5,
    eyewear: i % 4 === 0 ? (i % 5) + 1 : 0,
    brows: i % 5,
    mouth: i % 8,
  },
  defaultOutfit: i % 40,
  route:
    i === 0
      ? "initial"
      : i <= 12
        ? "typing"
        : i <= 17
          ? "learning"
          : i <= 20
            ? "fish"
            : i <= 23
              ? "dinosaur"
              : i <= 26
                ? "arena"
                : "special",
  threshold:
    i === 0
      ? 0
      : i <= 12
        ? BUDDY[i - 1]
        : i <= 17
          ? [12, 25, 50, 80, 120][i - 13]
          : i <= 20
            ? [10, 30, 60][i - 18]
            : i <= 23
              ? [3, 15, 30][i - 21]
              : i <= 26
                ? [1, 3, 6][i - 24]
                : [0, 0, 0][i - 27],
}));
const FRIEND_VOICES = [
  { rate: 1.00, pitch: 1.18, voiceIndex: 0 },
  { rate: 0.82, pitch: 0.92, voiceIndex: 1 },
  { rate: 0.94, pitch: 1.32, voiceIndex: 0 },
  { rate: 1.05, pitch: 0.86, voiceIndex: 1 },
  { rate: 0.88, pitch: 1.12, voiceIndex: 0 },
  { rate: 0.76, pitch: 0.82, voiceIndex: 1 },
  { rate: 1.08, pitch: 1.02, voiceIndex: 0 },
  { rate: 0.90, pitch: 1.25, voiceIndex: 1 },
  { rate: 0.98, pitch: 0.78, voiceIndex: 1 },
  { rate: 0.86, pitch: 1.38, voiceIndex: 0 },
];
const FRIEND_LINES = [
  ["おーい！ きょうも きたね！", "きょうの そら、なんか きれいじゃない？", "ぼく、あさごはん りんごだった！", "このまえ へんな かたちの くもを みたよ。", "まちを ぐるっと さんぽしようかな。", "また あえたら こえかけてね！"],
  ["こんにちは。ぼく、ほんを よむのが すきなんだ。", "しずかな ところって おちつくよね。", "きょうは ちょっと ねむいかも。", "きのう おもしろい ほんを みつけたよ。", "あめの おとって なんか すき。", "ゆっくり はなすのも いいよね。"],
  ["やっほー！ その ふく いいね！", "わたし いちごが だいすき！", "きょう なんか いいこと あった？", "おえかきすると じかん わすれちゃう。", "かわいい もの みつけたら おしえて！", "また あとで はなそうね！"],
  ["よっ！ きょうも げんき？", "おれ、はしるの けっこう はやいんだぜ。", "おなか すいたなー。おにぎり たべたい。", "きょうは ぜったい いいひに なる！", "どっちが さきに ひろばまで いけるかな？", "じゃ、またな！"],
  ["こんにちは。わすれもの してない？", "わたし、つくえが きれいだと うれしい。", "きょうは なんの べんきょう した？", "あしたの じゅんび、もう したよ。", "おちゃを のむと ほっとするね。", "こまったことが あったら いってね。"],
  ["……こんにちは。", "ぼーっと くもを みるの、すき。", "きょうは ゆっくり したい きぶん。", "ねこって ずっと みてられるよね。", "しずかな ばしょ、みつけたんだ。", "……またね。"],
  ["おっ！ ちょうど いいところに！", "さっき へんな むし みつけた！", "まちの すみっこって いがいと おもしろいよ。", "きょうの おやつ、なにかなー。", "ぼく、ひみつの ばしょを さがしてるんだ。", "また おもしろいもの みつけたら おしえる！"],
  ["こんにちは！ ちゃんと こえ きこえた？", "わたし うたを きくのが すき。", "きょうは なんだか ごきげん！", "おはな みつけると ちょっと うれしいよね。", "おともだちが いると まちが にぎやかだね。", "また おしゃべり しよう！"],
  ["よっ。きょうも きたか。", "おれ、からいもの ちょっと にがて。", "ゲームは まけると くやしいよな。", "このまえ すごい ゆめ みたんだ。", "ひるねって さいこうじゃない？", "じゃあな。また はなそうぜ。"],
  ["わーい！ あえた！", "わたし、きいろが いちばん すき！", "きょう かわいい いし ひろったよ。", "ケーキなら いくらでも たべられそう。", "こんど みんなで あそびたいな。", "また すぐ はなしかけてね！"],
];
for (let i = 0; i < FRIENDS.length; i++) {
  FRIENDS[i].voice = FRIEND_VOICES[i % FRIEND_VOICES.length];
  FRIENDS[i].lines =
    FRIEND_LINES[i] || [
      "こんにちは！",
      "きょうも いっしょに あそぼう。",
      "また おはなし しようね。",
    ];
}
const ACTIVE_FRIEND_DETAILS = [
  { personality: "げんき", favoriteActivity: "さんぽ", favoriteFood: "りんご", route: "initial", threshold: 0, strongSubject: "math" },
  { personality: "ものしり", favoriteActivity: "どくしょ", favoriteFood: "ぱん", route: "learning", threshold: 3, strongSubject: "japanese" },
  { personality: "おしゃれ", favoriteActivity: "おえかき", favoriteFood: "いちご", route: "typing", threshold: 150, strongSubject: "english" },
  { personality: "ちょうせん", favoriteActivity: "かけっこ", favoriteFood: "おにぎり", route: "learning", threshold: 8, strongSubject: "math" },
  { personality: "しっかり", favoriteActivity: "おかたづけ", favoriteFood: "おちゃ", route: "typing", threshold: 350, strongSubject: "japanese" },
  { personality: "のんびり", favoriteActivity: "ひなたぼっこ", favoriteFood: "くっきー", route: "learning", threshold: 15, strongSubject: "english" },
  { personality: "こうきしん", favoriteActivity: "たんけん", favoriteFood: "ばなな", route: "typing", threshold: 650, strongSubject: "math" },
  { personality: "やさしい", favoriteActivity: "おんがく", favoriteFood: "ぷりん", route: "learning", threshold: 25, strongSubject: "japanese" },
  { personality: "まいぺーす", favoriteActivity: "げーむ", favoriteFood: "かれー", route: "typing", threshold: 1000, strongSubject: "english" },
  { personality: "あかるい", favoriteActivity: "おしゃべり", favoriteFood: "けーき", route: "learning", threshold: 40, strongSubject: "math" },
];
ACTIVE_FRIEND_DETAILS.forEach((detail, i) => {
  Object.assign(FRIENDS[i], detail);
  FRIENDS[i].favoriteTopics = [detail.strongSubject];
  FRIENDS[i].weakSubject = detail.strongSubject === "math" ? "japanese" : "math";
});
export const ACTIVE_FRIENDS = FRIENDS.slice(0, 10);

export const COLORS = [
  "#40b2b1",
  "#709cd2",
  "#e79b9a",
  "#ebc862",
  "#9cb875",
  "#b69bce",
  "#e5a369",
  "#9bb6b8",
];
const furnitureTypes = [
  "そふぁ",
  "てーぶる",
  "いす",
  "ほんだな",
  "べっど",
  "らんぷ",
  "とけい",
  "かんようしょくぶつ",
  "PCですく",
  "かざるだな",
];
export const ITEMS = [
  ...Array.from({ length: 60 }, (_, i) => ({
    id: "furniture_" + i,
    name:
      [
        "やさしい",
        "うみいろの",
        "きょうりゅうの",
        "けんきゅうしつの",
        "ほしぞらの",
        "にじいろの",
      ][Math.floor(i / 10)] + furnitureTypes[i % 10],
    type: "furniture",
    shape: i % 10,
    color: COLORS[Math.floor(i / 10)],
    price: 150 + (i % 5) * 50,
    rank: 3 + Math.floor(i / 10),
    theme: Math.floor(i / 10),
    rare: i >= 40,
  })),
  ...Array.from({ length: 40 }, (_, i) => ({
    id: "clothing_" + i,
    name:
      ["ぱーかー", "Tしゃつ", "すうぇっと", "しゃつ", "たんけんふく"][
        Math.floor(i / 8)
      ] +
      "・" +
      [
        "あおみどり",
        "あお",
        "もも",
        "きいろ",
        "みどり",
        "むらさき",
        "だいだい",
        "ぐれー",
      ][i % 8],
    type: "clothing",
    shape: Math.floor(i / 8),
    color: COLORS[i % 8],
    price: 50 + Math.floor(i / 8) * 60,
    rank: 3 + Math.floor(i / 8),
    rare: i >= 32,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    id: "hat_" + i,
    name:
      [
        "きゃっぷ",
        "にっとぼう",
        "たんけんぼう",
        "さかなぼう",
        "きょうりゅうぼう",
      ][Math.floor(i / 4)] +
      " " +
      ((i % 4) + 1),
    type: "accessories",
    shape: Math.floor(i / 4),
    color: COLORS[i % 8],
    price: 80 + Math.floor(i / 4) * 40,
    rank: 3 + Math.floor(i / 4),
    rare: i >= 16,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: "glasses_" + i,
    name: (i < 5 ? "まる" : "しかく") + "めがね " + ((i % 5) + 1),
    type: "accessories",
    shape: i < 5 ? 0 : 1,
    color: COLORS[i % 8],
    price: 80,
    rank: 3,
    rare: false,
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    id: "wallpaper_" + i,
    name: "かべがみ " + (i + 1),
    type: "wallpaper",
    color: COLORS[i % 8],
    price: 100,
    rank: 3,
    rare: i >= 10,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: "floor_" + i,
    name: "ゆか " + (i + 1),
    type: "floor",
    color: COLORS[i % 8],
    price: 100,
    rank: 3,
    rare: i >= 8,
  })),
];
export const RODS = [
  "きのつりざお",
  "しっかりろっど",
  "りばーろっど",
  "おーしゃんろっど",
  "でぃーぷろっど",
  "ますたーろっど",
].map((name, i) => ({
  id: "rod_" + i,
  name,
  mult: [1, 1.05, 1.1, 1.15, 1.2, 1.3][i],
  price: i * 150,
  rank: [4, 5, 5, 7, 9, 10][i],
}));
export const TOOLS = [
  "はじめてせっと",
  "じょうぶなはんまー",
  "けんきゅうぶらし",
].map((name, i) => ({ id: "tool_" + i, name, price: i * 200, rank: 6 + i }));
export const TOURNAMENTS = [
  "びぎなーはい",
  "あにまるはい",
  "だいなそーはい",
  "おーしゃんはい",
  "こだいいきものはい",
  "ますたーはい",
].map((name, i) => ({
  id: "cup_" + i,
  name,
  rank: [8, 8, 8, 9, 9, 10][i],
  first: [100, 120, 150, 150, 180, 250][i],
  repeat: [40, 50, 60, 60, 70, 100][i],
  difficulty: [35, 43, 48, 52, 57, 64][i],
}));
export const MISSIONS = [
  {
    id: "study",
    name: "がっこうで5もんあそぼう",
    metric: "learning",
    target: 1,
    rank: 1,
  },
  {
    id: "talk",
    name: "ともだちとおはなししよう",
    metric: "talk",
    target: 1,
    rank: 1,
  },
  {
    id: "room",
    name: "おへやでひとやすみ",
    metric: "room",
    target: 1,
    rank: 1,
  },
  {
    id: "type",
    name: "たいぴんぐを1かい",
    metric: "typing",
    target: 1,
    rank: 2,
  },
  {
    id: "catch",
    name: "さかなを1ひきつろう",
    metric: "fish",
    target: 1,
    rank: 4,
  },
  {
    id: "dig",
    name: "ほるばしょを1つしらべよう",
    metric: "dig",
    target: 1,
    rank: 6,
  },
  {
    id: "arena",
    name: "ありーなで 1かい かとう",
    metric: "arena",
    target: 1,
    rank: 8,
  },
];
export const ACHIEVEMENTS = Array.from({ length: 28 }, (_, i) => ({
  id: "achievement_" + i,
  metric: ["learning", "typing", "fish", "dig", "arena", "talk", "room"][i % 7],
  target: [1, 5, 20, 50][Math.floor(i / 7)],
  name:
    [
      "まなび",
      "きーぼーど",
      "つり",
      "はっくつ",
      "ありーな",
      "ともだち",
      "くらし",
    ][i % 7] +
    ["のだいいっぽ", "がすき", "のたつじん", "のめいじん"][Math.floor(i / 7)],
  coins: 10 + Math.floor(i / 7) * 10,
}));
export const TYPING_MODES = [
  ["basic", "きほんたいぴんぐ", 1],
  ["challenge", "30びょうちゃれんじ", 3],
  ["rescue", "さかなれすきゅー", 4],
  ["escape", "きょうりゅうからにげろ！", 7],
  ["battle", "たいぴんぐばとる", 10],
].map(([id, name, level]) => ({ id, name, level }));
export const PART_NAMES = {
  head: "あたま",
  body: "どうたい",
  legs: "あし",
  tail: "しっぽ",
};
export function validateGameData() {
  const errors = [];
  const groups = {
    FRIENDS,
    FISH,
    DINOS,
    ANIMALS,
    ITEMS,
    TOURNAMENTS,
    ACHIEVEMENTS,
    MISSIONS,
    FACILITIES,
    FISH_AREAS,
    DIG_AREAS,
    RODS,
    SUBJECTS,
  };
  const required = {
    FRIENDS: [
      "personality",
      "favoriteTopics",
      "favoriteFood",
      "favoriteActivity",
      "weakSubject",
      "strongSubject",
      "homeRoom",
      "baseAppearance",
      "defaultOutfit",
      "route",
      "threshold",
    ],
    FISH: ["kana", "area", "rarity", "size", "color", "shape", "fact"],
    DINOS: ["kana", "food", "era", "length", "shape", "area", "parts"],
    ANIMALS: ["kana", "category", "shape", "color", "fact"],
    ITEMS: ["type", "color", "price", "rank"],
    TOURNAMENTS: ["rank", "first", "repeat", "difficulty"],
    ACHIEVEMENTS: ["metric", "target", "coins"],
    MISSIONS: ["metric", "target", "rank"],
  };
  for (const [group, rows] of Object.entries(groups)) {
    const ids = new Set();
    for (const row of rows) {
      for (const key of ["id", "name", ...(required[group] || [])])
        if (row[key] === undefined || row[key] === null || row[key] === "")
          errors.push(`${group}: missing required field ${key}`);
      if (ids.has(row.id)) errors.push(`${group}: duplicate ${row.id}`);
      if (!/^[a-z][a-z0-9_]*$/.test(row.id))
        errors.push(`${group}: invalid ID ${row.id}`);
      ids.add(row.id);
    }
  }
  for (const f of FISH) {
    if (!FISH_AREAS.some((a) => a.id === f.area))
      errors.push("invalid fish area " + f.id);
    if (
      !Number.isInteger(f.rarity) ||
      f.rarity < 1 ||
      f.rarity > 5 ||
      !(f.size > 0)
    )
      errors.push("invalid fish definition " + f.id);
  }
  for (const d of DINOS) {
    if (!DIG_AREAS.some((a) => a.id === d.area))
      errors.push("invalid dig area " + d.id);
    if (
      !Array.isArray(d.parts) ||
      d.parts.length !== 4 ||
      new Set(d.parts).size !== 4
    )
      errors.push("invalid dinosaur parts " + d.id);
  }
  for (const f of FRIENDS) {
    if (
      !SUBJECTS.some((s) => s.id === f.strongSubject) ||
      !SUBJECTS.some((s) => s.id === f.weakSubject)
    )
      errors.push("invalid friend subject " + f.id);
    if (!ITEMS.some((i) => i.id === "clothing_" + f.defaultOutfit))
      errors.push("invalid friend outfit " + f.id);
  }
  for (const rule of SUBJECT_UNLOCKS) {
    if (
      !SUBJECTS.some((s) => s.id === rule.subject) ||
      rule.level < 1 ||
      rule.level > 20
    )
      errors.push("invalid unlock reference " + rule.id);
    for (const id of rule.itemIds)
      if (!ITEMS.some((i) => i.id === id))
        errors.push("invalid unlock item " + id);
  }
  for (const row of [
    ...FACILITIES,
    ...FISH_AREAS,
    ...DIG_AREAS,
    ...TOURNAMENTS,
    ...ITEMS,
  ])
    if (!Number.isInteger(row.rank) || row.rank < 1 || row.rank > 10)
      errors.push("invalid rank unlock " + row.id);
  for (const c of CREATURES)
    for (const n of Object.values(c.stats))
      if (!Number.isFinite(n) || n < 1 || n > 100)
        errors.push("invalid creature stats " + c.id);
  if (
    FRIENDS.length !== 30 ||
    FISH.length !== 60 ||
    DINOS.length !== 30 ||
    ANIMALS.length !== 40
  )
    errors.push("collection count");
  return errors;
}
// Achievement clothing is earned, never sold. The base wardrobe remains 40 items.
export const REWARD_CLOTHING = [
  ["reward_fish", "さかなますたーのふく", "#5aaebf"],
  ["reward_dinosaur", "きょうりゅうますたーのふく", "#8cad63"],
  ["reward_typing", "たいぴんぐますたーのふく", "#9c8bc1"],
  ["reward_arena", "ありーなおうじゃのふく", "#e9bd5b"],
].map(([id, name, color]) => ({
  id,
  name,
  color,
  type: "clothing",
  shape: 4,
  rank: 10,
  price: 0,
  rare: true,
  rewardOnly: true,
}));
ITEMS.push(...REWARD_CLOTHING);
export const SUBJECT_UNLOCKS = [
  {
    id: "money_shop",
    subject: "money",
    level: 5,
    itemIds: ITEMS.filter((i) => i.type === "furniture" && i.theme === 4).map(
      (i) => i.id,
    ),
    name: "ほしぞらのかぐ",
  },
  {
    id: "english_clothes",
    subject: "english",
    level: 5,
    itemIds: ITEMS.filter((i) => i.type === "clothing" && i.shape === 3).map(
      (i) => i.id,
    ),
    name: "しゃつこれくしょん",
  },
  {
    id: "clock_interior",
    subject: "clock",
    level: 5,
    itemIds: ITEMS.filter((i) => i.type === "furniture" && i.shape === 6).map(
      (i) => i.id,
    ),
    name: "とけいのかぐ",
  },
];
export function itemRequirement(id, s) {
  const rule = SUBJECT_UNLOCKS.find((r) => r.itemIds.includes(id));
  return rule && !(s.learning[rule.subject].levels[rule.level]?.stars > 0)
    ? `${SUBJECTS.find((x) => x.id === rule.subject).name} Lv${rule.level}くりあ`
    : null;
}
