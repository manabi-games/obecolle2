import { NEW_FISH_IDS } from "./art.js";

export function artLayout(id) {
  if (id.startsWith("dino_")) {
    const number = Number(id.slice(5));
    if (!Number.isInteger(number) || number < 1 || number > 30) throw Error(`Unknown dinosaur: ${id}`);
    return {
      source: `assets/illustrations/dinos/dino_${number}.png`,
      x: 0, y: 0, w: 320, h: 240, width: 320, height: 240,
    };
  }
  const i = NEW_FISH_IDS.indexOf(id),
    w = 992 / 5,
    h = 1586 / 8;
  return {
    source: "assets/illustrations/fish-atlas.png",
    x: (i % 5) * w,
    y: Math.floor(i / 5) * h,
    w,
    h,
    width: 992,
    height: 1586,
  };
}
