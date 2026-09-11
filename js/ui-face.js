export const EYE_NAMES = [
  "ぱっちり",
  "にっこり",
  "おこりんぼ",
  "たれめ",
  "つりめ",
  "ねむねむ",
  "まんまる",
  "ほそめ",
  "ういんく",
  "まつげ",
  "びっくり",
  "じとめ",
];
export function eyePreview(style) {
  const eye = (x, side) => {
    if (style === 1 || (style === 8 && side === 1))
      return `<path d="M${x - 6} 26 Q${x} 14 ${x + 6} 26"/>`;
    if ([5, 7, 11].includes(style))
      return `<path d="M${x - 6} 24 H${x + 6}"/>${style === 7 ? "" : `<circle cx="${x}" cy="27" r="2" fill="#493a31"/>`}`;
    const angle =
      style === 2 || style === 4 ? -side * 18 : style === 3 ? side * 18 : 0;
    return `<g transform="rotate(${angle} ${x} 24)"><ellipse cx="${x}" cy="24" rx="${style === 6 ? 7 : 6}" ry="${style === 10 ? 9 : 7}" fill="white" stroke="none"/><ellipse cx="${x}" cy="25" rx="${style === 10 ? 2 : 3}" ry="${style === 6 ? 3 : 4}" fill="#493a31" stroke="none"/>${[2, 3, 4].includes(style) ? `<path d="M${x - 7} 18 H${x + 7}"/>` : ""}${style === 9 ? `<path d="M${x - 5} 18 l-3 -4 M${x} 17 v-4 M${x + 5} 18 l3 -4"/>` : ""}</g>`;
  };
  return `<svg viewBox="0 0 64 52" aria-hidden="true"><ellipse cx="32" cy="26" rx="28" ry="24" fill="#ffdbb9"/><g stroke="#493a31" stroke-width="2" fill="none" stroke-linecap="round">${eye(21, -1)}${eye(43, 1)}<path d="M27 39 Q32 43 37 39"/></g></svg>`;
}
