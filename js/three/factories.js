import * as THREE from "../../assets/vendor/three.module.js";
import { COLORS, ITEMS } from "../data/catalog.js";
import { illustratedCreature } from "./illustrations.js";
export { THREE };
const materials = new Map(),
  geometries = new Map();
export function material(color) {
  if (!materials.has(color))
    materials.set(
      color,
      new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 }),
    );
  return materials.get(color);
}
export function mesh(kind, color, size = [1, 1, 1], pos = [0, 0, 0]) {
  const key = kind;
  let geo = geometries.get(key);
  if (!geo) {
    geo =
      kind === "charball"
        ? new THREE.SphereGeometry(1, 8, 6)
        : kind === "charcylinder"
          ? new THREE.CylinderGeometry(1, 1, 1, 8)
          : kind === "ball"
            ? new THREE.SphereGeometry(1, 12, 8)
            : kind === "cylinder"
              ? new THREE.CylinderGeometry(1, 1, 1, 12)
              : kind === "roof"
                ? new THREE.CylinderGeometry(0, 1, 1, 4, 1)
                : kind === "cone"
                  ? new THREE.ConeGeometry(1, 1, 12)
                  : kind === "ring"
                    ? new THREE.TorusGeometry(1, 0.12, 6, 20)
                    : new THREE.BoxGeometry(1, 1, 1);
    geometries.set(key, geo);
  }
  const m = new THREE.Mesh(geo, material(color));
  m.scale.set(...size);
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
const add = (g, kind, color, size, pos) => {
  const m = mesh(kind, color, size, pos);
  g.add(m);
  return m;
};
const HAIR = [
    "#594234",
    "#2c2b31",
    "#795037",
    "#b99162",
    "#954b3e",
    "#354e67",
    "#929092",
    "#e6c26b",
  ],
  SKIN = ["#ffdbb9", "#f2c6a0", "#dba77c", "#b7815c", "#845b48"];
export function character(appearance = {}, scale = 1) {
  const g = new THREE.Group(),
    body = new THREE.Group();
  g.add(body);
  const skin = SKIN[appearance.skin || 0],
    hair = HAIR[appearance.hairColor || 0],
    outfit = ITEMS.find((x) => x.id === appearance.outfit),
    shirt = outfit?.color || COLORS[(appearance.outfitIndex || 0) % 8];
  const torso = add(body, "charball", shirt, [0.36, 0.43, 0.24], [0, 0.87, 0]);
  if (outfit?.shape === 1)
    add(body, "charball", "#fff6df", [0.11, 0.12, 0.025], [0, 0.99, 0.238]);
  if (outfit?.shape === 2)
    for (const y of [0.75, 0.88, 1.01])
      add(body, "box", "#eaf0d8", [0.54, 0.035, 0.045], [0, y, 0.24]);
  if (outfit?.shape === 3) {
    for (const x of [-0.1, 0.1]) {
      const collar = add(
        body,
        "box",
        "#f1e6ca",
        [0.14, 0.12, 0.04],
        [x, 1.17, 0.18],
      );
      collar.rotation.z = Math.sign(x) * 0.4;
    }
    for (const y of [0.78, 0.93, 1.07])
      add(body, "charball", "#e8d9b5", [0.02, 0.02, 0.02], [0, y, 0.25]);
  }
  if (outfit?.shape >= 4) {
    add(body, "box", "#a18055", [0.66, 0.08, 0.06], [0, 0.73, 0.23]);
    for (const x of [-0.17, 0.17])
      add(body, "box", "#cbb282", [0.16, 0.13, 0.04], [x, 0.96, 0.24]);
  }
  add(body, "box", "#c7ac82", [0.53, 0.25, 0.35], [0, 0.5, 0]);
  const legs = [];
  for (const x of [-0.17, 0.17]) {
    const limb = new THREE.Group();
    limb.position.set(x, 0.46, 0);
    add(limb, "charcylinder", skin, [0.095, 0.28, 0.095], [0, -0.1, 0]);
    add(limb, "charball", "#fff8e9", [0.13, 0.095, 0.19], [0, -0.3, 0.055]);
    body.add(limb);
    legs.push(limb);
  }
  const head = new THREE.Group();
  head.position.y = 1.55;
  body.add(head);
  add(
    head,
    appearance.face === 2 ? "box" : "charball",
    skin,
    [
      [0.53, 0.52, 0.46],
      [0.43, 0.58, 0.44],
      [0.95, 0.85, 0.8],
      [0.59, 0.43, 0.46],
      [0.47, 0.61, 0.45],
      [0.58, 0.5, 0.46],
    ][(appearance.face || 0) % 6],
    [0, 0, 0],
  );
  for (const x of [-0.5, 0.5])
    add(head, "charball", skin, [0.11, 0.14, 0.095], [x, -0.04, 0]);
  if (appearance.face === 5)
    for (const x of [-0.34, 0.34])
      add(head, "charball", skin, [0.22, 0.19, 0.16], [x, -0.2, 0.29]);
  add(head, "charball", hair, [0.545, 0.37, 0.46], [0, 0.21, -0.06]);
  const hairstyle = appearance.hair || 0;
  for (let i = 0; i < (hairstyle === 7 ? 0 : 5); i++) {
    const fringe = add(
      head,
      hairstyle === 3 ? "box" : "charball",
      hair,
      hairstyle === 3
        ? [0.18, 0.27, 0.12]
        : [0.14, 0.22 + (hairstyle % 3) * 0.025, 0.12],
      [(i - 2) * 0.18, 0.27 - Math.sin(i) * 0.035, 0.35],
    );
    fringe.rotation.z = -0.3 + i * 0.14;
    if (hairstyle === 2) {
      fringe.rotation.z = 0.65;
      fringe.position.x += 0.07;
    }
  }
  if (hairstyle === 7)
    for (const x of [-0.3, 0.3])
      add(head, "charball", hair, [0.23, 0.35, 0.16], [x, 0.25, 0.33]);
  if (hairstyle === 6)
    for (const x of [-0.43, 0.43])
      for (const y of [-0.1, 0.15, 0.4])
        add(head, "charball", hair, [0.19, 0.17, 0.18], [x, y, 0]);
  if (hairstyle >= 6) {
    for (const x of [-0.42, 0.42])
      add(
        head,
        "charball",
        hair,
        [0.16, 0.35 + (hairstyle % 3) * 0.07, 0.2],
        [x, -0.17, -0.08],
      );
  }
  if (hairstyle === 10 || hairstyle === 11) {
    for (const x of hairstyle === 10 ? [0] : [-0.5, 0.5])
      add(head, "charball", hair, [0.21, 0.36, 0.22], [x, 0.05, -0.37]);
  }
  if (hairstyle === 1 || hairstyle === 5)
    for (let i = 0; i < 3; i++) {
      const t = add(
        head,
        "cone",
        hair,
        [0.17, 0.23, 0.14],
        [(i - 1) * 0.23, 0.55, 0],
      );
      t.rotation.z = (i - 1) * -0.3;
    }
  // Each style has its own silhouette; expressions do not overwrite the chosen shape.
  const stroke = (parent, points, color, width = 0.022) => {
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i - 1],
        [xx, yy] = points[i];
      const line = add(
        parent,
        "box",
        color,
        [Math.hypot(xx - x, yy - y), width, 0.025],
        [(x + xx) / 2, (y + yy) / 2, 0.477],
      );
      line.rotation.z = Math.atan2(yy - y, xx - x);
    }
  };
  const eyes = [],
    style = (appearance.eyes || 0) % 12;
  for (const x of [-0.19, 0.19]) {
    const e = new THREE.Group();
    e.position.set(x, -0.025, 0);
    head.add(e);
    eyes.push(e);
    const side = Math.sign(x);
    if (style === 1 || (style === 8 && x > 0))
      stroke(
        e,
        [
          [-0.085, -0.02],
          [0, 0.065],
          [0.085, -0.02],
        ],
        "#493a31",
        0.032,
      );
    else if (style === 5 || style === 7 || style === 11) {
      stroke(
        e,
        [
          [-0.09, 0],
          [0.09, 0],
        ],
        "#493a31",
        0.03,
      );
      if (style !== 7)
        add(
          e,
          "charball",
          "#493a31",
          [0.035, 0.035, 0.025],
          [0, -0.035, 0.468],
        );
    } else {
      const tilt =
        style === 2
          ? side * 0.32
          : style === 3
            ? -side * 0.4
            : style === 4
              ? side * 0.4
              : 0;
      const white = add(
        e,
        "charball",
        "#fffdf6",
        [style === 6 ? 0.115 : 0.098, style === 10 ? 0.15 : 0.12, 0.03],
        [0, 0, 0.43],
      );
      white.rotation.z = tilt;
      const pupil = add(
        e,
        "charball",
        "#493a31",
        [style === 10 ? 0.032 : 0.052, style === 6 ? 0.055 : 0.08, 0.023],
        [0, 0, 0.466],
      );
      pupil.rotation.z = tilt;
      add(
        e,
        "charball",
        "#ffffff",
        [0.014, 0.018, 0.01],
        [-0.018, 0.028, 0.488],
      );
      if (style === 2 || style === 3 || style === 4)
        stroke(
          e,
          [
            [-0.1, 0.08 - 0.1 * Math.tan(tilt)],
            [0.1, 0.08 + 0.1 * Math.tan(tilt)],
          ],
          "#493a31",
          0.035,
        );
      if (style === 9)
        for (const dx of [-0.06, 0, 0.06])
          stroke(
            e,
            [
              [dx, 0.08],
              [dx - 0.025, 0.145],
            ],
            "#493a31",
            0.015,
          );
    }
    const brow = add(
      head,
      "box",
      hair,
      [0.19, 0.027, 0.025],
      [x, 0.175, 0.445],
    );
    brow.rotation.z =
      [0, 0.35, -0.35, 0.65, -0.65][(appearance.brows || 0) % 5] * side;
    add(
      head,
      "charball",
      "#f5ac98",
      [0.088, 0.04, 0.021],
      [x * 1.6, -0.17, 0.394],
    );
  }
  const nose = (appearance.nose || 0) % 5;
  add(
    head,
    nose === 2 ? "box" : nose === 3 ? "cone" : "charball",
    "#edb38b",
    [
      [0.052, 0.048, 0.07],
      [0.1, 0.1, 0.1],
      [0.09, 0.1, 0.14],
      [0.07, 0.16, 0.1],
      [0.11, 0.045, 0.06],
    ][nose],
    [0, -0.12, 0.47],
  );
  const mouth = new THREE.Group();
  head.add(mouth);
  const ms = (appearance.mouth || 0) % 8;
  if ([0, 3, 7].includes(ms))
    add(
      mouth,
      "charball",
      "#9b6051",
      [ms === 0 ? 0.055 : 0.1, ms === 0 ? 0.02 : ms === 3 ? 0.09 : 0.07, 0.022],
      [0, -0.25, 0.44],
    );
  else
    stroke(
      mouth,
      ms === 1
        ? [
            [-0.1, -0.23],
            [0, -0.29],
            [0.1, -0.23],
          ]
        : ms === 2
          ? [
              [-0.1, -0.29],
              [0, -0.23],
              [0.1, -0.29],
            ]
          : ms === 4
            ? [
                [-0.09, -0.28],
                [0.1, -0.22],
              ]
            : [
                [-0.1, -0.25],
                [0.1, -0.25],
              ],
      "#9b6051",
      ms === 5 ? 0.045 : 0.025,
    );
  const arms = [];
  for (const x of [-0.36, 0.36]) {
    const arm = new THREE.Group();
    arm.position.set(x, 1.1, 0);
    body.add(arm);
    add(
      arm,
      "charball",
      shirt,
      [0.13, 0.16, 0.14],
      [Math.sign(x) * 0.02, -0.11, 0],
    );
    add(
      arm,
      "charcylinder",
      skin,
      [0.083, 0.3, 0.083],
      [Math.sign(x) * 0.04, -0.3, 0],
    );
    add(
      arm,
      "charball",
      skin,
      [0.09, 0.1, 0.085],
      [Math.sign(x) * 0.04, -0.46, 0],
    );
    arms.push(arm);
  }
  if (appearance.hat) {
    const item = ITEMS.find((x) => x.id === appearance.hat);
    add(
      head,
      "charball",
      item?.color || "#dfb45d",
      [0.57, 0.25, 0.48],
      [0, 0.43, 0],
    );
    add(
      head,
      "charball",
      item?.color || "#dfb45d",
      [0.45, 0.035, 0.3],
      [0, 0.38, 0.35],
    );
    if (item?.shape === 4)
      for (let i = 0; i < 3; i++)
        add(
          head,
          "cone",
          "#95b869",
          [0.1, 0.17, 0.1],
          [0, 0.68, -0.25 + i * 0.2],
        );
  }
  if (appearance.glasses || appearance.eyewear) {
    const boughtStyle = String(appearance.glasses || "").match(/^glasses_(\d+)$/);
    const style = boughtStyle ? (Number(boughtStyle[1]) % 5) + 1 : appearance.eyewear || 1;
    for (const x of [-0.19, 0.19]) {
      if (style === 5 && x < 0) continue;
      if (style === 2 || style === 3) {
        if (style === 3)
          add(head, "box", "#253d48", [0.3, 0.2, 0.03], [x, -0.015, 0.51]);
        else
          for (const [dx, dy, w, h] of [
            [0, 0.1, 0.3, 0.025],
            [0, -0.1, 0.3, 0.025],
            [-0.15, 0, 0.025, 0.2],
            [0.15, 0, 0.025, 0.2],
          ])
            add(
              head,
              "box",
              "#665057",
              [w, h, 0.025],
              [x + dx, -0.015 + dy, 0.51],
            );
      } else {
        const ring = add(
          head,
          "ring",
          style === 4 ? "#df927f" : "#5b686a",
          [0.145, 0.17, 0.15],
          [x, -0.015, 0.5],
        );
        if (style === 4) {
          ring.scale.set(0.18, 0.1, 0.15);
          ring.rotation.z = Math.sign(x) * 0.3;
        }
      }
    }
    if (style !== 5)
      add(head, "box", "#5b686a", [0.15, 0.025, 0.03], [0, 0, 0.51]);
  }
  const prop = new THREE.Group();
  body.add(prop);
  g.scale.setScalar(scale);
  g.userData = {
    body,
    head,
    eyes,
    mouth,
    arms,
    legs,
    prop,
    restMouth: 1,
    state: "idle",
    phase: Math.random() * 6,
    blink: Math.random() * 4 + 2,
    needs: { energy: 70, curiosity: 40, social: 40, hunger: 20 },
    aiTimer: 2,
    base: [0, 0, 0],
    waypoint: null,
  };
  g.setState = (state) => {
    state = state.toLowerCase();
    const alias = {
      fishingcast: "cast",
      fishingwait: "fishing",
      fishingpull: "pull",
      fishingsuccess: "victory",
      fishingfail: "sad",
      dighammer: "digging",
      digbrush: "brush",
      fossilfound: "happy",
      arenacheer: "wave",
      victoryjump: "victory",
      lookaquarium: "think",
      lookfigure: "think",
      lookwindow: "window",
      pc: "type",
      stand: "idle",
      laugh: "laugh",
      standup: "standup",
      turn: "turn",
    };
    state = alias[state] || state;
    if (g.userData.state === state) return;
    g.userData.state = state;
    prop.clear();
    if (["read", "study"].includes(state)) {
      const book = add(
        prop,
        "box",
        "#6ea9c7",
        [0.42, 0.06, 0.3],
        [0, 0.85, 0.45],
      );
      book.rotation.x = 0.3;
    }
    if (state === "type") {
      add(prop, "box", "#7a8589", [0.5, 0.04, 0.25], [0, 0.7, 0.45]);
    }
    if (["fishing", "cast", "pull"].includes(state)) {
      const rod = add(
        prop,
        "charcylinder",
        "#a5754c",
        [0.018, 1.6, 0.018],
        [0.48, 1.2, 0.45],
      );
      rod.rotation.x = 0.5;
    }
    if (["digging", "brush"].includes(state)) {
      add(prop, "box", "#839097", [0.3, 0.16, 0.18], [-0.42, 1, 0.25]);
      add(
        prop,
        "charcylinder",
        "#a47850",
        [0.03, 0.5, 0.03],
        [-0.42, 0.75, 0.25],
      );
    }
  };
  g.lookAtPoint = (point) => {
    head.rotation.y = THREE.MathUtils.clamp(
      Math.atan2(point.x - g.position.x, point.z - g.position.z) - g.rotation.y,
      -0.6,
      0.6,
    );
  };
  g.setExpression = (x) => {
    g.userData.expression = x;
  };
  return g;
}
export function animateCharacter(g, t, dt) {
  const u = g.userData;
  if (!u.body) return;
  const p = t * 3 + u.phase,
    s = u.state;
  u.body.position.y = Math.sin(p) * 0.015;
  u.head.rotation.z = Math.sin(p * 0.4) * 0.025;
  u.arms.forEach((a, i) => {
    a.rotation.set(0, 0, i ? -0.1 : 0.1);
  });
  u.legs.forEach((a) => (a.rotation.x = 0));
  u.body.rotation.set(0, 0, 0);
  u.head.rotation.x = 0;
  u.blink -= dt;
  if (u.blink < -0.14) u.blink = 2 + Math.random() * 3;
  u.eyes.forEach((e) => (e.scale.y = u.blink < 0 ? 0.08 : 1));
  u.mouth.scale.y = ["happy", "victory", "laugh"].includes(s)
    ? 1.15
    : s === "surprised"
      ? 1.25
      : u.restMouth;
  if (["walk", "run"].includes(s)) {
    const k = s === "run" ? 10 : 6;
    u.legs.forEach(
      (a, i) => (a.rotation.x = Math.sin(t * k + i * Math.PI) * 0.55),
    );
    u.arms.forEach(
      (a, i) => (a.rotation.x = -Math.sin(t * k + i * Math.PI) * 0.55),
    );
    u.body.position.y = Math.abs(Math.sin(t * k)) * 0.03;
  }
  if (["wave", "happy", "victory", "laugh", "surprised"].includes(s)) {
    u.arms[0].rotation.z = -2.2 + Math.sin(t * 8) * 0.25;
    u.arms[1].rotation.z = 2.2 + Math.sin(t * 8) * 0.25;
    u.body.position.y = Math.abs(Math.sin(t * 5)) * 0.13;
  }
  if (["sit", "read", "study", "type", "eat"].includes(s)) {
    u.body.position.y = -0.24;
    u.legs.forEach((l) => (l.rotation.x = -1.3));
    u.arms.forEach(
      (a, i) => (a.rotation.x = -0.8 + Math.sin(t * 6 + i) * 0.08),
    );
    u.head.rotation.x = 0.15;
  }
  if (["think", "yawn", "sad"].includes(s)) {
    u.arms[0].rotation.x = -1.5;
    u.head.rotation.x = 0.15;
    u.head.rotation.z = Math.sin(t) * 0.08;
  }
  if (s === "sleep") {
    u.body.rotation.z = 1.2;
    u.body.position.y = -0.15;
    u.eyes.forEach((e) => (e.scale.y = 0.01));
  }
  if (s === "turn") u.body.rotation.y = Math.sin(t) * 0.7;
  if (s === "standup") {
    u.body.position.y = -0.18 + 0.18 * Math.sin(t);
    u.legs.forEach((l) => (l.rotation.x = -0.7 + 0.7 * Math.sin(t)));
  }
  if (s === "window") u.head.rotation.y = Math.sin(t * 0.4) * 0.5;
  if (s === "angry") {
    u.body.rotation.z = Math.sin(t * 5) * 0.04;
    u.arms.forEach((a) => (a.rotation.x = -1.2));
  }
  if (s === "cast")
    u.arms.forEach((a) => (a.rotation.x = -1 + Math.sin(t * 3)));
  if (s === "pull")
    u.arms.forEach((a) => (a.rotation.x = -1 + Math.sin(t * 4) * 0.25));
  if (s === "brush") {
    u.arms[0].rotation.x = -1.1 + Math.sin(t * 8) * 0.1;
    u.body.rotation.x = 0.2;
  }
  if (s === "fishing")
    u.arms.forEach((a) => (a.rotation.x = -0.7 + Math.sin(t * 2) * 0.08));
  if (s === "digging") {
    u.arms[0].rotation.x = -1.2 + Math.sin(t * 5) * 0.7;
    u.body.rotation.x = 0.17;
  }
  if (s === "dance") {
    u.body.rotation.z = Math.sin(t * 5) * 0.15;
    u.arms.forEach((a, i) => (a.rotation.z = Math.sin(t * 5 + i) * 1.5));
  }
}
export function fishModel(f, scale = 1) {
  const g = new THREE.Group(),
    c = f.color || "#6fa3b8",
    shape = f.shape || "fish";
  const body = (size = [0.75, 0.28, 0.25], pos = [0, 0.55, 0]) =>
    add(g, "ball", c, size, pos);
  const eye = (x = 0.5, y = 0.62, z = 0.2) => {
    add(g, "ball", "#fffdf5", [0.06, 0.065, 0.025], [x, y, z]);
    add(g, "ball", "#31403d", [0.028, 0.03, 0.012], [x + 0.015, y, z + 0.022]);
  };
  const tail = (x = -0.72, y = 0.55) => {
    const t = add(g, "cone", c, [0.28, 0.45, 0.1], [x, y, 0]);
    t.rotation.z = Math.PI / 2;
    return t;
  };

  if (shape === "eel" || shape === "ribbon") {
    body(shape === "ribbon" ? [1.0, 0.12, 0.12] : [0.95, 0.14, 0.14]);
    const t = tail(-0.98, 0.55);
    t.scale.y *= 0.6;
    eye(0.72, 0.58, 0.12);
  } else if (shape === "flat") {
    body([0.75, 0.1, 0.48]);
    tail(-0.72, 0.55);
    eye(0.43, 0.66, 0.16);
  } else if (shape === "puffer") {
    body([0.47, 0.42, 0.42]);
    tail(-0.48, 0.55);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const spike = add(
        g,
        "cone",
        c,
        [0.04, 0.18, 0.04],
        [Math.cos(a) * 0.42, 0.55 + Math.sin(a) * 0.32, 0],
      );
      spike.rotation.z = -a;
    }
    eye(0.33, 0.65, 0.25);
  } else if (shape === "sword") {
    body([0.85, 0.24, 0.22]);
    tail(-0.85, 0.55);
    const bill = add(g, "cone", "#d7d0a2", [0.06, 0.75, 0.06], [1.0, 0.56, 0]);
    bill.rotation.z = -Math.PI / 2;
    eye(0.55, 0.63, 0.2);
  } else if (shape === "sunfish") {
    body([0.48, 0.58, 0.15]);
    add(g, "cone", c, [0.12, 0.34, 0.06], [0, 1.08, 0]);
    add(g, "cone", c, [0.12, 0.34, 0.06], [0, 0.06, 0]).rotation.z = Math.PI;
    eye(0.32, 0.7, 0.14);
  } else if (shape === "angler") {
    body([0.58, 0.38, 0.34]);
    tail(-0.58, 0.55);
    const stalk = add(g, "cylinder", "#7b6d58", [0.03, 0.45, 0.03], [0.2, 0.92, 0]);
    stalk.rotation.z = -0.3;
    add(g, "ball", "#f7e684", [0.08, 0.08, 0.08], [0.33, 1.13, 0]);
    eye(0.37, 0.67, 0.25);
  } else if (shape === "ray") {
    body([0.72, 0.12, 0.72]);
    const t = add(g, "cylinder", c, [0.03, 0.72, 0.03], [-0.75, 0.52, 0]);
    t.rotation.z = Math.PI / 2;
    eye(0.25, 0.61, 0.18);
  } else if (shape === "shark") {
    body([0.9, 0.28, 0.24]);
    tail(-0.9, 0.55);
    add(g, "cone", c, [0.14, 0.38, 0.08], [-0.05, 0.88, 0]);
    eye(0.58, 0.64, 0.2);
  } else if (shape === "tiny") {
    body([0.48, 0.18, 0.16]);
    tail(-0.46, 0.55);
    eye(0.3, 0.6, 0.14);
  } else {
    body();
    const t = tail();
    add(g, "cone", c, [0.12, 0.28, 0.06], [0, 0.82, 0]);
    eye();
    g.userData.tail = t;
  }
  g.scale.setScalar(scale);
  return g;
}
export function dinosaurModel(d, scale = 1) {
  const g = new THREE.Group(),
    c = d.color || "#a2bd86",
    long = d.shape === "long",
    rex = ["rex", "raptor", "sail"].includes(d.shape);
  add(g, "ball", c, [0.66, 0.51, 0.38], [0, 0.65, 0]);
  const tail = add(g, "cone", c, [0.24, 1.1, 0.23], [-0.8, 0.55, 0]);
  tail.rotation.z = 1.1;
  const head = add(
    g,
    "ball",
    c,
    [rex ? 0.45 : 0.32, 0.29, 0.28],
    [long ? 0.38 : 0.63, long ? 1.8 : 1.07, 0],
  );
  if (long) {
    const neck = add(g, "cylinder", c, [0.17, 1, 0.17], [0.34, 1.22, 0]);
    neck.rotation.z = -0.2;
  }
  for (const z of [-0.25, 0.25]) {
    add(
      g,
      "ball",
      "#fffef4",
      [0.075, 0.085, 0.028],
      [long ? 0.49 : 0.76, long ? 1.86 : 1.13, z],
    );
    add(
      g,
      "ball",
      "#394635",
      [0.035, 0.055, 0.015],
      [long ? 0.52 : 0.79, long ? 1.86 : 1.13, z * 1.13],
    );
  }
  for (const x of rex ? [-0.13] : [-0.38, 0.35])
    for (const z of [-0.27, 0.27]) {
      add(g, "cylinder", c, [0.14, 0.4, 0.14], [x, 0.24, z]);
      add(g, "ball", "#efdfbd", [0.2, 0.09, 0.15], [x + 0.07, 0.065, z]);
    }
  if (rex)
    for (const z of [-0.3, 0.3])
      add(g, "ball", c, [0.12, 0.12, 0.14], [0.42, 0.7, z]);
  if (d.shape === "horn") {
    add(g, "ball", c, [0.14, 0.44, 0.4], [0.35, 1.08, 0]);
    for (const z of [-0.17, 0.17])
      add(g, "cone", "#f6e7c0", [0.075, 0.35, 0.075], [0.7, 1.4, z]);
  }
  if (["plates", "armor", "sail"].includes(d.shape))
    for (let i = 0; i < 5; i++)
      add(
        g,
        "cone",
        d.shape === "sail" ? "#d78573" : "#d6c394",
        [0.16, d.shape === "armor" ? 0.2 : 0.4, 0.11],
        [-0.45 + i * 0.2, 1.17, 0],
      );
  g.scale.setScalar(scale);
  g.userData.tail = tail;
  return g;
}
export function animalModel(a, scale = 1) {
  const g = new THREE.Group(),
    c = a.color || "#a9b992",
    shape = a.shape || "quadruped";
  const eye = (x, y, z = 0.25) => {
    add(g, "ball", "#fffdf5", [0.065, 0.07, 0.03], [x, y, z]);
    add(g, "ball", "#34413d", [0.03, 0.035, 0.015], [x + 0.018, y, z + 0.025]);
  };
  const leg = (x, z, h = 0.34, width = 0.1) =>
    add(g, "cylinder", c, [width, h, width], [x, h / 2, z]);
  const flipper = (x, y, z, tilt = 1.1) => {
    const f = add(g, "cone", c, [0.16, 0.45, 0.09], [x, y, z]);
    f.rotation.x = Math.sign(z || 1) * tilt;
    return f;
  };

  if (["cetacean", "shark"].includes(shape)) {
    add(g, "ball", c, [0.95, 0.3, 0.3], [0, 0.58, 0]);
    const tail = add(g, "cone", c, [0.34, 0.5, 0.12], [-0.98, 0.58, 0]);
    tail.rotation.z = Math.PI / 2;
    add(g, "cone", c, [0.16, 0.34, 0.1], [-0.05, 0.92, 0]);
    flipper(0, 0.45, 0.31);
    if (shape === "shark")
      add(g, "cone", c, [0.12, 0.3, 0.08], [0.8, 0.58, 0]).rotation.z = -Math.PI / 2;
    eye(0.58, 0.65, 0.25);
    g.userData.tail = tail;
  } else if (shape === "pinniped") {
    add(g, "ball", c, [0.74, 0.32, 0.36], [0, 0.48, 0]);
    add(g, "ball", c, [0.34, 0.32, 0.32], [0.58, 0.62, 0]);
    flipper(-0.08, 0.34, -0.36);
    flipper(-0.08, 0.34, 0.36);
    eye(0.73, 0.69, 0.24);
  } else if (shape === "otter") {
    add(g, "ball", c, [0.68, 0.3, 0.34], [0, 0.48, 0]);
    add(g, "ball", c, [0.32, 0.31, 0.3], [0.55, 0.7, 0]);
    const tail = add(g, "cone", c, [0.16, 0.7, 0.12], [-0.72, 0.42, 0]);
    tail.rotation.z = 1.25;
    eye(0.7, 0.76, 0.23);
    g.userData.tail = tail;
  } else if (shape === "octopus") {
    add(g, "ball", c, [0.48, 0.55, 0.48], [0, 0.78, 0]);
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2;
      const arm = add(g, "cylinder", c, [0.055, 0.48, 0.055], [Math.cos(a0) * 0.35, 0.3, Math.sin(a0) * 0.35]);
      arm.rotation.z = Math.cos(a0) * 0.45;
      arm.rotation.x = Math.sin(a0) * 0.45;
    }
    eye(0.2, 0.85, 0.42);
  } else if (shape === "jellyfish") {
    add(g, "ball", c, [0.58, 0.34, 0.58], [0, 0.85, 0]);
    for (let i = 0; i < 6; i++)
      add(g, "cylinder", c, [0.035, 0.55 + (i % 2) * 0.2, 0.035], [-0.35 + i * 0.14, 0.28, 0]);
  } else if (["bird", "pterosaur"].includes(shape)) {
    add(g, "ball", c, [0.4, 0.47, 0.33], [0, 0.75, 0]);
    add(g, "ball", c, [0.28, 0.28, 0.27], [0.2, 1.18, 0]);
    const beak = add(g, "cone", "#e7b85a", [0.08, 0.3, 0.08], [0.5, 1.16, 0]);
    beak.rotation.z = -Math.PI / 2;
    for (const z of [-0.38, 0.38]) {
      const wing = add(g, "cone", c, [shape === "pterosaur" ? 0.38 : 0.28, 0.72, 0.08], [0, 0.82, z]);
      wing.rotation.x = Math.sign(z) * 1.25;
    }
    leg(-0.08, -0.13, 0.28, 0.07);
    leg(-0.08, 0.13, 0.28, 0.07);
    eye(0.34, 1.23, 0.22);
  } else if (shape === "turtle") {
    add(g, "ball", "#6f8f63", [0.65, 0.24, 0.52], [0, 0.42, 0]);
    add(g, "ball", c, [0.25, 0.22, 0.22], [0.65, 0.45, 0]);
    for (const [x, z] of [[-0.35,-0.42],[-0.35,0.42],[0.35,-0.42],[0.35,0.42]])
      add(g, "ball", c, [0.18, 0.08, 0.13], [x, 0.25, z]);
    eye(0.78, 0.49, 0.16);
  } else if (shape === "crocodile") {
    add(g, "ball", c, [0.95, 0.26, 0.32], [0, 0.46, 0]);
    add(g, "ball", c, [0.5, 0.18, 0.26], [0.78, 0.5, 0]);
    const tail = add(g, "cone", c, [0.22, 1.0, 0.18], [-1.0, 0.45, 0]);
    tail.rotation.z = 1.25;
    for (const z of [-0.28, 0.28]) { leg(-0.35, z, 0.22); leg(0.35, z, 0.22); }
    eye(0.96, 0.55, 0.22);
    g.userData.tail = tail;
  } else if (shape === "marine_reptile") {
    add(g, "ball", c, [0.9, 0.3, 0.34], [0, 0.5, 0]);
    add(g, "ball", c, [0.42, 0.24, 0.28], [0.72, 0.58, 0]);
    const tail = add(g, "cone", c, [0.2, 0.95, 0.16], [-0.92, 0.48, 0]);
    tail.rotation.z = 1.28;
    for (const z of [-0.32, 0.32]) { flipper(-0.3, 0.35, z); flipper(0.32, 0.35, z); }
    eye(0.88, 0.63, 0.22);
    g.userData.tail = tail;
  } else if (shape === "plesiosaur") {
    add(g, "ball", c, [0.72, 0.3, 0.42], [0, 0.45, 0]);
    const neck = add(g, "cylinder", c, [0.12, 0.9, 0.12], [0.55, 0.92, 0]);
    neck.rotation.z = -0.55;
    add(g, "ball", c, [0.25, 0.22, 0.24], [0.92, 1.25, 0]);
    for (const z of [-0.34, 0.34]) { flipper(-0.25, 0.3, z); flipper(0.28, 0.3, z); }
    eye(1.04, 1.3, 0.18);
  } else if (shape === "frog") {
    add(g, "ball", c, [0.5, 0.28, 0.42], [0, 0.38, 0]);
    add(g, "ball", c, [0.4, 0.3, 0.38], [0.35, 0.55, 0]);
    for (const z of [-0.3, 0.3]) add(g, "ball", c, [0.32, 0.1, 0.14], [-0.28, 0.18, z]);
    eye(0.52, 0.72, 0.26);
  } else if (shape === "elephant") {
    add(g, "ball", c, [0.75, 0.52, 0.48], [0, 0.7, 0]);
    add(g, "ball", c, [0.45, 0.45, 0.42], [0.55, 1.0, 0]);
    add(g, "cylinder", c, [0.09, 0.65, 0.09], [0.88, 0.66, 0]).rotation.z = -0.18;
    for (const z of [-0.28, 0.28]) { add(g, "ball", c, [0.26, 0.34, 0.08], [0.48, 1.08, z]); leg(-0.38, z, 0.48); leg(0.32, z, 0.48); }
    eye(0.73, 1.08, 0.3);
  } else if (shape === "giraffe") {
    add(g, "ball", c, [0.62, 0.36, 0.34], [0, 0.78, 0]);
    add(g, "cylinder", c, [0.16, 1.15, 0.16], [0.42, 1.35, 0]);
    add(g, "ball", c, [0.33, 0.28, 0.28], [0.48, 2.05, 0]);
    for (const z of [-0.25, 0.25]) { leg(-0.32, z, 0.72); leg(0.3, z, 0.72); }
    eye(0.66, 2.1, 0.22);
  } else if (shape === "primate") {
    add(g, "ball", c, [0.6, 0.62, 0.42], [0, 0.82, 0]);
    add(g, "ball", c, [0.38, 0.36, 0.34], [0.3, 1.35, 0]);
    for (const z of [-0.42, 0.42]) add(g, "cylinder", c, [0.13, 0.72, 0.13], [0, 0.54, z]);
    eye(0.48, 1.4, 0.25);
  } else if (shape === "hippo") {
    add(g, "ball", c, [0.82, 0.48, 0.52], [0, 0.62, 0]);
    add(g, "ball", c, [0.52, 0.38, 0.42], [0.65, 0.78, 0]);
    add(g, "ball", c, [0.36, 0.22, 0.38], [0.96, 0.68, 0]);
    for (const z of [-0.3, 0.3]) { leg(-0.38, z, 0.35, 0.13); leg(0.32, z, 0.35, 0.13); }
    eye(0.8, 0.92, 0.27);
  } else if (shape === "rhino") {
    add(g, "ball", c, [0.82, 0.45, 0.45], [0, 0.68, 0]);
    add(g, "ball", c, [0.46, 0.34, 0.35], [0.64, 0.83, 0]);
    const horn = add(g, "cone", "#e9dfc7", [0.09, 0.38, 0.09], [1.03, 0.93, 0]);
    horn.rotation.z = -Math.PI / 2;
    for (const z of [-0.27, 0.27]) { leg(-0.4, z, 0.42, 0.12); leg(0.3, z, 0.42, 0.12); }
    eye(0.82, 0.94, 0.24);
  } else if (["bear", "koala"].includes(shape)) {
    const small = shape === "koala";
    add(g, "ball", c, [small ? 0.5 : 0.65, small ? 0.45 : 0.55, 0.4], [0, 0.7, 0]);
    add(g, "ball", c, [0.38, 0.38, 0.34], [0.42, 1.14, 0]);
    for (const z of [-0.25, 0.25]) add(g, "ball", c, [small ? 0.17 : 0.13, small ? 0.2 : 0.14, 0.08], [0.34, 1.43, z]);
    for (const z of [-0.25, 0.25]) { leg(-0.28, z, 0.35); leg(0.22, z, 0.35); }
    eye(0.6, 1.2, 0.24);
  } else if (shape === "kangaroo") {
    add(g, "ball", c, [0.48, 0.62, 0.36], [0, 0.88, 0]);
    add(g, "ball", c, [0.3, 0.34, 0.28], [0.38, 1.48, 0]);
    for (const z of [-0.18, 0.18]) add(g, "cone", c, [0.1, 0.42, 0.08], [0.34, 1.85, z]);
    leg(-0.2, -0.22, 0.65, 0.12); leg(-0.2, 0.22, 0.65, 0.12);
    const tail = add(g, "cone", c, [0.18, 1.15, 0.13], [-0.72, 0.5, 0]); tail.rotation.z = 1.18;
    eye(0.56, 1.54, 0.2); g.userData.tail = tail;
  } else if (["rabbit", "squirrel"].includes(shape)) {
    add(g, "ball", c, [0.5, 0.38, 0.34], [0, 0.58, 0]);
    add(g, "ball", c, [0.32, 0.33, 0.3], [0.43, 0.94, 0]);
    if (shape === "rabbit") for (const z of [-0.15, 0.15]) add(g, "cone", c, [0.09, 0.48, 0.07], [0.42, 1.35, z]);
    else { const tail = add(g, "ball", c, [0.35, 0.6, 0.3], [-0.55, 0.92, 0]); g.userData.tail = tail; }
    leg(-0.25, -0.2, 0.28); leg(-0.25, 0.2, 0.28); eye(0.6, 1.0, 0.22);
  } else if (shape === "camel") {
    add(g, "ball", c, [0.72, 0.4, 0.36], [0, 0.76, 0]);
    add(g, "ball", c, [0.35, 0.42, 0.3], [-0.18, 1.15, 0]);
    add(g, "cylinder", c, [0.13, 0.72, 0.13], [0.55, 1.15, 0]).rotation.z = -0.25;
    add(g, "ball", c, [0.3, 0.27, 0.28], [0.72, 1.55, 0]);
    for (const z of [-0.25, 0.25]) { leg(-0.35, z, 0.58); leg(0.3, z, 0.58); }
    eye(0.88, 1.6, 0.2);
  } else if (shape === "feline") {
    add(g, "ball", c, [0.66, 0.38, 0.34], [0, 0.62, 0]);
    add(g, "ball", c, [0.34, 0.34, 0.3], [0.5, 0.95, 0]);
    for (const z of [-0.2, 0.2]) add(g, "cone", c, [0.12, 0.3, 0.08], [0.45, 1.25, z]);
    for (const z of [-0.24, 0.24]) { leg(-0.34, z, 0.36); leg(0.3, z, 0.36); }
    const tail = add(g, "cone", c, [0.12, 0.75, 0.09], [-0.72, 0.72, 0]); tail.rotation.z = 1.25;
    eye(0.7, 1.0, 0.22); g.userData.tail = tail;
  } else {
    add(g, "ball", c, [0.62, 0.4, 0.34], [0, 0.58, 0]);
    add(g, "ball", c, [0.36, 0.35, 0.32], [0.5, 0.9, 0]);
    for (const z of [-0.24, 0.24]) { add(g, "ball", c, [0.14, 0.18, 0.1], [0.45, 1.15, z]); leg(-0.34, z, 0.38); leg(0.33, z, 0.38); }
    eye(0.72, 0.98, 0.24);
  }
  g.scale.setScalar(scale);
  return g;
}
export function creatureModel(c, scale = 1) {
  if (c.id.startsWith("dino_")) return dinosaurModel(c, scale);
  if (c.id.startsWith("fish_")) return fishModel(c, scale);
  return animalModel(c, scale);
}
export function furniture(item) {
  const g = new THREE.Group(),
    c = item?.color || "#b1c9bb",
    shape = item?.shape || 0;
  const leg = (x, z) =>
    add(g, "cylinder", "#a77b54", [0.05, 0.5, 0.05], [x, 0.25, z]);
  if (shape === 0) {
    add(g, "box", c, [1.6, 0.35, 0.7], [0, 0.35, 0]);
    add(g, "box", c, [1.6, 0.6, 0.18], [0, 0.65, -0.3]);
    for (const x of [-0.7, 0.7])
      add(g, "box", c, [0.2, 0.4, 0.75], [x, 0.55, 0]);
  } else if ([1, 2, 8].includes(shape)) {
    add(g, "box", c, [shape === 2 ? 0.6 : 1.3, 0.12, 0.75], [0, 0.6, 0]);
    for (const x of [-0.5, 0.5]) for (const z of [-0.25, 0.25]) leg(x, z);
    if (shape === 8) {
      add(g, "box", "#748c96", [0.55, 0.42, 0.06], [0, 0.89, -0.15]);
      add(g, "box", "#91decd", [0.48, 0.32, 0.015], [0, 0.9, -0.11]);
    }
  } else if ([3, 9].includes(shape)) {
    add(g, "box", c, [1.2, 1.5, 0.3], [0, 0.75, -0.18]);
    for (let j = 0; j < 3; j++) {
      add(g, "box", "#e4cb9f", [1.22, 0.06, 0.5], [0, 0.16 + j * 0.48, 0]);
      for (let k = 0; k < 6; k++)
        add(
          g,
          "box",
          COLORS[k],
          [0.12, 0.27, 0.16],
          [-0.43 + k * 0.17, 0.33 + j * 0.48, 0.05],
        );
    }
  } else if (shape === 4) {
    add(g, "box", "#bd9c73", [1.2, 0.32, 1.7], [0, 0.2, 0]);
    add(g, "box", c, [1.16, 0.18, 1.6], [0, 0.44, 0]);
    add(g, "ball", "#fff3d7", [0.44, 0.12, 0.25], [0, 0.59, -0.5]);
  } else if (shape === 5) {
    add(g, "cylinder", "#af957a", [0.04, 1, 0.04], [0, 0.5, 0]);
    add(g, "cone", c, [0.4, 0.4, 0.4], [0, 1.1, 0]);
  } else if (shape === 6) {
    add(g, "cylinder", c, [0.35, 0.12, 0.35], [0, 0.85, 0]).rotation.x =
      Math.PI / 2;
    add(g, "box", "#624f45", [0.025, 0.25, 0.02], [0, 0.9, 0.08]);
  } else {
    add(g, "cylinder", "#bd946f", [0.23, 0.4, 0.23], [0, 0.2, 0]);
    for (let i = 0; i < 5; i++)
      add(
        g,
        "ball",
        "#87b474",
        [0.2, 0.35, 0.2],
        [
          Math.sin(i * 1.5) * 0.2,
          0.65 + Math.cos(i) * 0.15,
          Math.cos(i * 1.5) * 0.2,
        ],
      );
  }
  return g;
}
