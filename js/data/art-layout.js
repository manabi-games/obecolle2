import { NEW_FISH_IDS } from "./art.js";
// Measured bounds keep neighboring sprites out of each picture-book illustration.
const dinoBounds = [
  [0, 0, 276, 177],
  [277, 0, 283, 177],
  [560, 0, 277, 178],
  [838, 0, 282, 178],
  [1120, 0, 282, 178],
  [0, 178, 277, 175],
  [278, 178, 282, 175],
  [580, 178, 259, 175],
  [840, 178, 280, 175],
  [1120, 178, 282, 175],
  [0, 353, 277, 179],
  [278, 353, 282, 177],
  [550, 355, 286, 177],
  [840, 355, 280, 175],
  [1120, 355, 282, 175],
  [0, 534, 277, 173],
  [277, 534, 282, 173],
  [541, 534, 296, 176],
  [839, 528, 281, 180],
  [1120, 534, 282, 176],
  [0, 708, 277, 176],
  [278, 710, 282, 174],
  [560, 710, 279, 176],
  [835, 710, 285, 174],
  [1120, 712, 282, 172],
  [0, 885, 278, 222],
  [278, 884, 283, 224],
  [560, 885, 279, 223],
  [840, 884, 280, 224],
  [1120, 885, 282, 223],
];
export function artLayout(id) {
  if (id.startsWith("dino_")) {
    const [x, y, w, h] = dinoBounds[Number(id.slice(5)) - 1];
    return {
      source: "assets/illustrations/dinosaurs-atlas.png",
      x,
      y,
      w,
      h,
      width: 1402,
      height: 1122,
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
