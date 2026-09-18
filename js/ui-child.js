import { ITEMS } from "./data/catalog.js";

const E = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const HAIR = [
  "#594234",
  "#2c2b31",
  "#795037",
  "#b99162",
  "#954b3e",
  "#354e67",
  "#929092",
  "#e6c26b",
];
const SKIN = ["#ffdbb9", "#f2c6a0", "#dba77c", "#b7815c", "#845b48"];
const OUTFIT = [
  "#40b2b1",
  "#709cd2",
  "#e79b9a",
  "#ebc862",
  "#9cb875",
  "#b69bce",
  "#e5a369",
  "#9bb6b8",
];

const ANIMAL_EMOJI = {
  らいおん: "🦁",
  とら: "🐯",
  ぞう: "🐘",
  かば: "🦛",
  さい: "🦏",
  ごりら: "🦍",
  きりん: "🦒",
  しまうま: "🦓",
  ぱんだ: "🐼",
  こあら: "🐨",
  かんがるー: "🦘",
  ひぐま: "🐻",
  おおかみ: "🐺",
  きつね: "🦊",
  たぬき: "🦝",
  うさぎ: "🐰",
  りす: "🐿️",
  しか: "🦌",
  らくだ: "🐪",
  あるぱか: "🦙",
  わに: "🐊",
  かめ: "🐢",
  かえる: "🐸",
  ぺんぎん: "🐧",
  だちょう: "🐦",
  ふくろう: "🦉",
  わし: "🦅",
  いるか: "🐬",
  しゃち: "🐋",
  しろながすくじら: "🐋",
  あざらし: "🦭",
  らっこ: "🦦",
  たこ: "🐙",
  くらげ: "🪼",
  まんもす: "🦣",
  すみろどん: "🐅",
  めがろどん: "🦈",
  もささうるす: "🦎",
  ぷてらのどん: "🪽",
  えらすもさうるす: "🦕",
};

const FURNITURE_EMOJI = ["🛋️", "▰", "🪑", "📚", "🛏️", "💡", "🕒", "🪴", "💻", "🗄️"];

export function atlasSvg(layout, name, hidden = false) {
  if (!layout) return "";
  const cls = hidden ? "creature-atlas-svg silhouette" : "creature-atlas-svg";
  return `<svg class="${cls}" viewBox="${layout.x} ${layout.y} ${layout.w} ${layout.h}" role="img" aria-label="${hidden ? "まだ みつけていない いきもの" : E(name)}" preserveAspectRatio="xMidYMid meet"><image href="${layout.source}" x="0" y="0" width="${layout.width}" height="${layout.height}"/></svg>`;
}

export function animalIcon(animal, hidden = false) {
  const emoji = ANIMAL_EMOJI[animal?.name] || "🐾";
  return `<span class="animal-emoji${hidden ? " silhouette" : ""}" role="img" aria-label="${hidden ? "まだ みつけていない いきもの" : E(animal?.name)}">${emoji}</span>`;
}

export function appearancePortrait(
  appearance = {},
  outfitIndex = null,
  hidden = false,
  label = "あばたー",
) {
  const hairIndex = Number(appearance.hairColor || 0) % HAIR.length,
    skinIndex = Number(appearance.skin || 0) % SKIN.length,
    parsedOutfit = Number(String(appearance.outfit || "").split("_")[1]),
    outfit = Number.isFinite(parsedOutfit)
      ? parsedOutfit
      : Number.isFinite(Number(outfitIndex))
        ? Number(outfitIndex)
        : 0,
    outfitId =
      appearance.outfit ||
      (Number.isFinite(Number(outfitIndex))
        ? `clothing_${Number(outfitIndex)}`
        : "clothing_0"),
    shirt =
      ITEMS.find((i) => i.id === outfitId)?.color ||
      OUTFIT[outfit % OUTFIT.length],
    hairStyle = Number(appearance.hair || 0) % 12,
    cls = `${hidden ? "friend-avatar silhouette" : "friend-avatar"} hair-${hairStyle}`,
    glasses = appearance.glasses || appearance.eyewear
      ? '<i class="friend-glasses"></i>'
      : "";
  return `<span class="${cls}" role="img" aria-label="${hidden ? "まだ みつけていない あばたー" : E(label)}" style="--hair:${HAIR[hairIndex]};--skin:${SKIN[skinIndex]};--shirt:${shirt}"><i class="friend-hair"></i><i class="friend-head"><b class="friend-eye left"></b><b class="friend-eye right"></b><b class="friend-mouth"></b>${glasses}</i><i class="friend-body"></i></span>`;
}

export function friendPortrait(friend, hidden = false) {
  if (!friend) return "";
  return appearancePortrait(
    friend.baseAppearance || {},
    friend.defaultOutfit || 0,
    hidden,
    friend.name,
  );
}

export function itemPreview(item, hidden = false) {
  if (!item) return "";
  let emoji = "✦";
  if (item.id?.startsWith("rod_")) emoji = "🎣";
  else if (item.type === "clothing") emoji = "👕";
  else if (item.type === "accessories")
    emoji = item.id?.startsWith("hat_") ? "🧢" : "👓";
  else if (item.type === "wallpaper") emoji = "▦";
  else if (item.type === "floor") emoji = "▰";
  else if (item.type === "furniture")
    emoji = FURNITURE_EMOJI[item.shape ?? 0] || "🪑";
  const color = item.color || "#8fb9ac";
  return `<span class="item-preview${hidden ? " silhouette" : ""}" style="--item-color:${color}" role="img" aria-label="${hidden ? "まだ もっていない あいてむ" : E(item.name)}"><span>${emoji}</span></span>`;
}
