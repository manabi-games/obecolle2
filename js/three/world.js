import {
  THREE,
  mesh,
  character,
  animateCharacter,
  creatureModel,
  furniture,
} from "./factories.js";
import {
  FACILITIES,
  FRIENDS,
  FISH,
  DINOS,
  CREATURES,
  ITEMS,
  COLORS,
} from "../data/catalog.js";
export class World {
  constructor(canvas, onSelect) {
    this.canvas = canvas;
    this.onSelect = onSelect;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 160);
    this.ray = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.clock = 0;
    this.last = performance.now();
    this.paused = false;
    this.interactionsEnabled = true;
    this.onFrame = null;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    canvas.addEventListener("pointermove", (e) => this.hover(e));
    canvas.addEventListener("click", (e) => {
      if (!this.interactionsEnabled) return;
      const hit = this.pick(e);
      if (hit) this.onSelect(hit);
    });
    this.set("title", null);
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }
  setInteractionsEnabled(enabled) {
    this.interactionsEnabled = !!enabled;
    if (!this.interactionsEnabled) {
      this.hovered = null;
      this.canvas.style.cursor = "default";
    }
  }
  resize() {
    const w = innerWidth,
      h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  add(m, x, y, z) {
    if (x !== undefined) m.position.set(x, y ?? 0, z ?? 0);
    this.scene.add(m);
    return m;
  }
  box(c, size, pos) {
    const m = mesh("box", c, size, pos);
    this.scene.add(m);
    return m;
  }
  sphere(c, size, pos) {
    const m = mesh("ball", c, size, pos);
    this.scene.add(m);
    return m;
  }
  interact(obj, id, label, offset = 2) {
    obj.userData.action = id;
    this.targets.push(obj);
    if (label) this.labels.push({ object: obj, text: label, offset, id });
    return obj;
  }
  human(appearance, x, z, state = "idle", scale = 1) {
    const c = this.add(character(appearance, scale), x, 0, z);
    c.setState(state);
    this.characters.push(c);
    return c;
  }
  tree(x, z, scale = 1) {
    const g = new THREE.Group();
    g.add(mesh("cylinder", "#ab885e", [0.13, 1.1, 0.13], [0, 0.55, 0]));
    g.add(mesh("ball", "#8dbc82", [0.65, 0.85, 0.65], [0, 1.55, 0]));
    g.add(mesh("ball", "#a6ce86", [0.5, 0.58, 0.5], [0.3, 1.9, 0.1]));
    g.scale.setScalar(scale);
    this.add(g, x, 0.1, z);
    this.ambient.push({ obj: g, type: "tree", phase: Math.random() * 6 });
  }
  building(f) {
    const g = new THREE.Group(),
      add = (k, c, size, pos) => {
        const m = mesh(k, c, size, pos);
        g.add(m);
        return m;
      };
    const large = f.id === "mansion",
      w = large ? 4.8 : 3,
      h = large ? 4 : 2.2;
    if (f.id === "fishing") {
      for (let i = 0; i < 9; i++)
        add("box", "#c6a77e", [3.5, 0.16, 0.42], [0, 0.1, -1.5 + i * 0.47]);
      for (const x of [-1.65, 1.65])
        for (const z of [-1.3, 2.2])
          add("cylinder", "#987453", [0.08, 1.1, 0.08], [x, -0.15, z]);
      add("box", "#c7dfce", [1.1, 1, 0.7], [-1.1, 0.65, -0.7]);
      add("roof", "#6bacaf", [1.2, 0.6, 0.9], [-1.1, 1.45, -0.7]).rotation.y =
        Math.PI / 4;
      add("ring", "#f8eed4", [0.3, 0.3, 0.3], [1, 0.7, -0.8]);
      this.add(g, f.x, 0, f.z);
      this.interact(g, f.id, f.name, 2.2);
      this.labels.at(-1).hoverOnly = true;
      return;
    }
    if (f.id === "excavation") {
      add("cylinder", "#a7be8f", [3.1, 0.6, 2.8], [0, -0.1, 0]);
      for (let i = 0; i < 7; i++)
        add(
          "ball",
          i % 2 ? "#c6b094" : "#b49d82",
          [0.75, 1.15, 0.8],
          [Math.cos(i) * 1.8, 0.7, Math.sin(i) * 1.1 - 0.5],
        );
      add("ball", "#736e60", [0.9, 1, 0.2], [0, 0.8, 0.6]);
      add("box", "#b88d5c", [1, 0.12, 0.8], [0, 0.12, 1.1]);
      for (let i = 0; i < 3; i++)
        add("box", "#b88d5c", [1, 0.12, 0.6], [0, 0.02, 2 + i * 0.6]);
      this.add(g, f.x, 0, f.z);
      this.interact(g, f.id, f.name, 3.4);
      this.labels.at(-1).hoverOnly = true;
      return;
    }
    if (f.id === "arena") {
      add("cylinder", "#d4c49e", [2.8, 1.5, 2.5], [0, 0.7, 0]);
      add("cylinder", "#89a5bd", [2.48, 0.15, 2.2], [0, 1.48, 0]);
      add("cylinder", "#f2dfb8", [1.95, 0.18, 1.75], [0, 1.57, 0]);
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        add(
          "cylinder",
          "#eee4c9",
          [0.15, 1, 0.15],
          [Math.sin(angle) * 2.65, 1.3, Math.cos(angle) * 2.35],
        );
      }
      add("box", "#798db5", [1, 1.4, 0.15], [0, 1.05, 2.48]);
      add("ball", "#f4d277", [0.25, 0.25, 0.06], [0, 1.2, 2.59]);
      this.add(g, f.x, 0, f.z);
      this.interact(g, f.id, f.name, 3);
      this.labels.at(-1).hoverOnly = true;
      return;
    }
    if (f.id === "shop") {
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * 1.45;
        add("box", "#f5e6c8", [1.4, 1.8, 2], [x, 0.9, 0]);
        add("roof", COLORS[i * 2], [1.08, 0.75, 1.6], [x, 2.12, 0]).rotation.y =
          Math.PI / 4;
        for (let j = 0; j < 4; j++)
          add(
            "box",
            j % 2 ? "#fff5d7" : COLORS[i * 2],
            [0.32, 0.11, 0.8],
            [x - 0.48 + j * 0.32, 1.48, 1.1],
          );
        add("box", "#89b8b8", [0.55, 0.95, 0.1], [x, 0.65, 1.03]);
      }
      this.add(g, f.x, 0, f.z);
      this.interact(g, f.id, f.name, 3.2);
      this.labels.at(-1).hoverOnly = true;
      return;
    }
    add("box", "#f2e6ca", [w, h, 2.6], [0, h / 2, 0]);
    add("box", "#dac499", [w + 0.15, 0.2, 2.75], [0, 0.15, 0]);
    const roof = add("roof", f.color, [w * 0.78, 1.1, 2.25], [0, h + 0.55, 0]);
    roof.rotation.y = Math.PI / 4;
    for (const x of large ? [-1.55, 0, 1.55] : [-0.9, 0.9])
      for (const y of large ? [1.1, 2.3, 3.4] : [1.2]) {
        add("box", "#709caa", [0.62, 0.72, 0.08], [x, y, 1.34]);
        add("box", "#f8efda", [0.74, 0.09, 0.26], [x, y - 0.39, 1.4]);
        add("box", "#eadcba", [0.055, 0.75, 0.1], [x, y, 1.4]);
        if (large) {
          add("box", "#dccca4", [0.74, 0.09, 0.24], [x, y - 0.1, 1.58]);
          for (const dx of [-0.28, 0, 0.28])
            add(
              "box",
              "#dacda9",
              [0.035, 0.35, 0.035],
              [x + dx, y - 0.23, 1.65],
            );
        }
      }
    add("box", "#9b785b", [0.65, 1.1, 0.1], [0, 0.6, 1.36]);
    add("roof", f.color, [0.9, 0.45, 0.8], [0, 1.4, 1.5]).rotation.y =
      Math.PI / 4;
    add("box", "#e4d4ad", [1.25, 0.15, 0.8], [0, 0.12, 1.62]);
    if (f.id === "school") {
      add("box", "#f3e8d1", [0.85, 1.3, 0.85], [0, h + 0.85, 0]);
      add("roof", f.color, [0.85, 0.6, 0.85], [0, h + 1.72, 0]).rotation.y =
        Math.PI / 4;
      add(
        "cylinder",
        "#fcf4dc",
        [0.27, 0.06, 0.27],
        [0, h + 1.04, 0.46],
      ).rotation.x = Math.PI / 2;
      add("box", "#65796f", [0.025, 0.18, 0.025], [0, h + 1.06, 0.51]);
      add("box", "#65796f", [0.14, 0.025, 0.025], [0.055, h + 1.0, 0.51]);
    }
    if (f.id === "typing") {
      add("ball", "#9cccd2", [1.05, 0.65, 1], [0, h + 0.55, 0]);
      add("cylinder", "#c5a97f", [0.05, 1.5, 0.05], [0.8, h + 1.3, 0]);
      const glow = add("ball", "#c7eaa8", [0.2, 0.2, 0.2], [0.8, h + 2.1, 0]);
      this.ambient.push({ obj: glow, type: "glow", phase: 0 });
      for (let i = 0; i < 3; i++)
        add(
          "box",
          "#d7bd8a",
          [0.25, 0.1, 0.06],
          [-0.35 + i * 0.35, 0.75, 1.42],
        );
    }
    for (const x of [-w / 2 - 0.3, w / 2 + 0.3]) {
      add("cylinder", "#b99879", [0.22, 0.35, 0.22], [x, 0.18, 1]);
      add("ball", "#8fba82", [0.38, 0.4, 0.35], [x, 0.55, 1]);
    }
    this.add(g, f.x, 0, f.z);
    this.interact(g, f.id, f.name, large ? 5.6 : 4.4);
    this.labels.at(-1).hoverOnly = true;
  }
  set(name, s, params = {}) {
    if (this.scene) {
      this.scene.traverse((o) => {
        if (o.isLight && o.shadow?.map) o.shadow.map.dispose();
      });
      this.renderer.renderLists.dispose();
    }
    this.name = name;
    this.save = s;
    this.params = params;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#a5dde5");
    this.scene.fog = new THREE.Fog("#bce5e6", 45, 120);
    this.targets = [];
    this.labels = [];
    this.characters = [];
    this.ambient = [];
    this.creatures = [];
    this.hero = null;
    this.boat = null;
    this.bobber = null;
    this.fighter = null;
    this.opponent = null;
    this.typingCreature = null;
    this.rescueFish = [];
    this.scene.add(new THREE.HemisphereLight("#fff6de", "#9ab7a4", 1.8));
    const sun = new THREE.DirectionalLight("#fff3d3", 2.1);
    sun.position.set(-8, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    sun.shadow.normalBias = 0.04;
    this.scene.add(sun);
    this.target = new THREE.Vector3(0, 1, 0);
    this.camTo = new THREE.Vector3(18, 23, 32);
    this.labelsRoot = document.querySelector("#labels");
    this.labelsRoot.replaceChildren();
    const night = new Date().getHours() >= 18 || new Date().getHours() < 6;
    if (night && ["island", "title", "mansion"].includes(name)) {
      this.scene.background = new THREE.Color("#7894b3");
      sun.intensity = 1.6;
    }
    if (
      ["island", "title", "opening", "celebration", "arrival"].includes(name)
    ) {
      this.island();
      if (name === "arrival") {
        this.arrivalTime = 0;
        const friend = FRIENDS.find((f) => f.id === params.friend);
        if (friend) {
          const c = this.human(
            { ...friend.baseAppearance, outfit: "clothing_" + friend.defaultOutfit },
            1,
            12,
            "wave",
            1.2,
          );
          this.camTo.set(10, 9, 25);
          this.target.set(0, 1, 10);
        }
      }
      if (name === "title") {
        this.camTo.set(22, 25, 38);
        this.target.set(0, 1, 0);
      }
      if (name === "opening") {
        this.camTo.set(8, 8, 25);
        this.target.set(0, 1, 6);
      }
      if (name === "celebration") {
        this.camTo.set(12, 14, 25);
        for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * Math.PI * 2,
            c = this.human(
              { ...FRIENDS[i].baseAppearance, outfit: "clothing_" + FRIENDS[i].defaultOutfit },
              Math.sin(angle) * 5,
              Math.cos(angle) * 5 + 1,
              "happy",
              0.75,
            );
          c.rotation.y = -angle;
        }
        this.fireworks = true;
      } else this.fireworks = false;
    } else if (name === "mansion") {
      this.box("#b2cc9d", [26, 0.3, 20], [0, -0.2, 0]);
      const ids = Object.keys(s.friends),
        total = ids.length + 1,
        cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(total)))),
        rows = Math.ceil(total / cols);
      this.box(
        "#f6dfb6",
        [cols * 2.2 + 1, rows * 2.7 + 0.8, 2.6],
        [0, rows * 1.35, 0],
      );
      this.box(
        "#d28c70",
        [cols * 2.2 + 1.5, 0.4, 3.2],
        [0, rows * 2.7 + 0.65, 0],
      );
      ["self", ...ids].forEach((id, i) => {
        const x = ((i % cols) - (cols - 1) / 2) * 2.2,
          y = (rows - 1 - Math.floor(i / cols)) * 2.7 + 0.5;
        const window = this.box(
          "#83b5bd",
          [1.55, 1.9, 0.12],
          [x, y + 0.6, 1.36],
        );
        this.interact(
          window,
          "resident:" + id,
          id === "self"
            ? "じぶんのへや"
            : FRIENDS.find((f) => f.id === id).name,
          1.3,
        );
        this.labels.at(-1).hoverOnly = true;
        const f = FRIENDS.find((f) => f.id === id);
        const c = this.human(
          id === "self"
            ? s.player.appearance
            : { ...f.baseAppearance, outfit: "clothing_" + f.defaultOutfit },
          x,
          1.5,
          ["read", "type", "wave", "sleep"][i % 4],
          0.7,
        );
        c.position.y = y - 0.15;
      });
      this.camTo.set(3, rows * 1.35 + 1.5, Math.max(17, rows * 5.4));
      this.target.set(0, rows * 1.35 + 0.3, 0);
    } else if (name === "room") {
      this.room(s, params.friend);
      this.camTo.set(8, 7, 10);
      this.target.set(0, 1, 0);
    } else if (name === "create") {
      this.box("#eedfbd", [22, 0.2, 18], [0, -0.15, 0]);
      this.box("#a3ccc4", [22, 9, 0.2], [0, 4, -5]);
      this.hero = this.human(
        params.appearance || s?.player.appearance,
        -2,
        0,
        "wave",
        1.7,
      );
      this.camTo.set(0, 2.8, 9);
      this.target.set(0, 1.7, 0);
      for (let i = 0; i < 6; i++)
        this.sphere(
          COLORS[i],
          [0.2, 0.2, 0.2],
          [Math.cos(i) * 3, 1 + Math.sin(i) * 1.3, -2],
        );
    } else if (name === "school" || name === "quiz") {
      this.box("#d0b690", [18, 0.2, 15], [0, -0.12, 0]);
      this.box("#fae7bd", [18, 7, 0.2], [0, 3, -4]);
      this.box("#648e80", [10, 3.5, 0.18], [0, 3, -3.8]);
      this.hero = this.human(s.player.appearance, -4, 0, "study");
      for (const x of [-4, 0, 4])
        this.add(furniture(ITEMS.find((i) => i.id === "furniture_1")), x, 0, 1);
      this.camTo.set(1, 5, 13);
      this.target.set(0, 1, -1);
    } else if (name === "typing") {
      this.box("#b5d1ce", [20, 0.2, 16], [0, -0.12, 0]);
      this.box("#dbedf0", [20, 7, 0.2], [0, 3, -4]);
      this.hero = this.human(s.player.appearance, -4, 1, "type");
      this.add(furniture(ITEMS.find((i) => i.id === "furniture_8")), -4, 0, 2);
      this.add(mesh("cylinder", "#87b7bc", [0.75, 2, 0.75], [4, 1, -1]));
      this.sphere("#baf0bc", [0.7, 0.7, 0.7], [4, 2.5, -1]);
      this.camTo.set(0, 4, 13);
      this.target.set(0, 1, 0);
      this.typingCreature = this.add(creatureModel(DINOS[10], 1.3), 5, 0, 2);
      this.creatures.push(this.typingCreature);
      this.typingCreature.visible = ["escape", "battle"].includes(params.mode);
      this.rescueFish = [];
      if (params.mode === "rescue") {
        const start = ((Math.max(1, params.level || 1) - 1) * 5) % FISH.length;
        for (let i = 0; i < 5; i++) {
          const fish = FISH[(start + i) % FISH.length];
          const f = this.add(
            creatureModel(fish, 0.65),
            3.7 + (i % 2) * 1.1,
            0.9 + Math.floor(i / 2) * 0.8,
            1,
          );
          this.creatures.push(f);
          const bubble = this.add(
            mesh("ring", "#b6e8ed", [0.5, 0.5, 0.5]),
            f.position.x,
            f.position.y,
            1.1,
          );
          this.rescueFish.push({ fish: f, bubble });
        }
      }
      if (params.mode === "battle") {
        this.typingCreature.rotation.y = Math.PI;
        this.hero.setState("victory");
      }
    } else if (name === "fishing") {
      this.box("#69bed2", [100, 0.3, 100], [0, -0.5, 0]);
      this.box("#ddc194", [8, 0.4, 7], [-5, -0.1, 0]);
      for (let i = 0; i < 7; i++)
        this.box("#b89570", [3, 0.15, 0.44], [-1, 0.12, 1 + i * 0.5]);
      for (const x of [-2.2, 0.2])
        for (const z of [1, 4])
          this.box("#a1805e", [0.14, 1.4, 0.14], [x, -0.2, z]);
      this.hero = this.human(s.player.appearance, -1, 2, "fishing", 1.2);
      this.hero.rotation.y = 0.7;
      this.bobber = this.sphere("#f27a61", [0.12, 0.14, 0.12], [3, 0.05, 2]);
      for (let i = 0; i < 5; i++) {
        const f = this.add(
          creatureModel(FISH[i], 0.5),
          3 + i * 0.8,
          -0.25,
          -2 + i,
        );
        this.creatures.push(f);
      }
      this.camTo.set(10, 10, 15);
      this.target.set(0, 0, 1);
      this.tree(-6, -1);
      this.tree(-8, 3);
    } else if (name === "excavation") {
      this.box("#caaa7c", [25, 0.3, 20], [0, -0.2, 0]);
      for (let i = 0; i < 8; i++)
        this.sphere(
          i % 2 ? "#b49a7f" : "#d2b792",
          [1 + (i % 3), 0.8 + (i % 2), 1],
          [-8 + i * 2, 0.2, -4],
        );
      this.hero = this.human(s.player.appearance, -4, 1, "digging", 1.2);
      this.camTo.set(6, 10, 13);
      this.target.set(0, 0, 0);
    } else if (name === "arena") {
      this.box("#ddc69c", [30, 0.3, 24], [0, -0.2, 0]);
      this.add(mesh("cylinder", "#f4dfb4", [6, 0.25, 5], [0, 0, 0]));
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        this.box(
          "#a6b7cc",
          [1, 1.5, 1],
          [Math.sin(a) * 8, 0.5, Math.cos(a) * 6],
        );
      }
      const left = params.creature || CREATURES[0],
        right = params.opponent || CREATURES[2];
      this.fighter = this.add(creatureModel(left, 1.8), -3, 0.3, 0);
      this.opponent = this.add(creatureModel(right, 1.8), 3, 0.3, 0);
      this.opponent.rotation.y = Math.PI;
      this.creatures.push(this.fighter, this.opponent);
      this.hero = this.human(s.player.appearance, -6, 3, "happy", 0.8);
      this.camTo.set(2, 5, 17);
      this.target.set(0, 1, 0);
    } else if (name === "shop") {
      this.box("#d4c5a4", [25, 0.3, 22], [0, -0.2, 0]);
      for (let i = 0; i < 3; i++) {
        this.box("#fce4c0", [4, 3, 3], [(i - 1) * 5, 1.5, -2]);
        for (let j = 0; j < 6; j++)
          this.box(
            j % 2 ? "#fff3d4" : COLORS[i],
            [0.66, 0.18, 1.4],
            [(i - 1) * 5 - 1.7 + j * 0.67, 2.8, -0.1],
          );
      }
      this.hero = this.human(s.player.appearance, -5, 3, "wave");
      this.camTo.set(0, 6, 16);
      this.target.set(0, 1, 0);
    } else {
      this.island();
    }
    if (params.creatureId && name === "quiz") {
      const c = CREATURES.find((c) => c.id === params.creatureId);
      if (c) this.creatures.push(this.add(creatureModel(c, 2.2), -4, 1, 1));
    }
    this.camera.position.copy(this.camTo);
    this.camera.lookAt(this.target);
    for (const l of this.labels) {
      const b = document.createElement("button");
      b.className = "world-label";
      b.textContent = l.text;
      b.dataset.action = l.id;
      b.addEventListener("click", () => this.onSelect(l.id));
      this.labelsRoot.append(b);
      l.element = b;
    }
  }
  island() {
    this.box("#69bfd0", [500, 0.3, 500], [0, -1, 0]);
    this.add(mesh("cylinder", "#8cbe84", [20, 1.1, 16], [0, -0.55, 0]));
    this.add(mesh("cylinder", "#e5cc98", [20.5, 0.3, 16.5], [0, -1, 0]));
    this.box("#e9d4a8", [3, 0.025, 23], [0, 0.03, 0]);
    this.box("#e9d4a8", [29, 0.025, 2.3], [0, 0.03, 1]);
    this.add(mesh("cylinder", "#eee0b6", [3, 0.1, 3], [0, 0.06, 1]));
    this.add(mesh("cylinder", "#9dc7cb", [1.2, 0.4, 1.2], [0, 0.3, 1]));
    this.add(mesh("cylinder", "#bddeda", [0.35, 0.8, 0.35], [0, 0.6, 1]));
    this.sphere("#d9f0de", [0.4, 0.1, 0.4], [0, 1.02, 1]);
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      this.sphere(
        COLORS[i % 8],
        [0.12, 0.12, 0.12],
        [Math.sin(a) * 3.3, 0.16, 1 + Math.cos(a) * 3.3],
      );
    }
    for (const x of [-5, 5]) {
      this.box("#c3a276", [1.5, 0.18, 0.55], [x, 0.5, 1]);
      this.box("#c3a276", [1.5, 0.5, 0.1], [x, 0.7, 0.75]);
    }
    this.sphere("#b0e4e1", [0.8, 0.11, 0.8], [0, 0.53, 1]);
    for (const f of FACILITIES.filter((x) => x.id !== "plaza"))
      this.building(f);
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      this.tree(
        Math.sin(angle) * 18,
        Math.cos(angle) * 13,
        0.8 + Math.sin(i) * 0.2,
      );
    }
    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Group();
      for (let k = 0; k < 3; k++)
        cloud.add(mesh("ball", "#edf7ec", [1.5, 0.5, 0.75], [k, 0, 0]));
      this.add(cloud, -24 + i * 7, 9 + (i % 3), -15 - (i % 4));
      this.ambient.push({ obj: cloud, type: "cloud", phase: i });
    }
    const boat = new THREE.Group();
    boat.add(mesh("ball", "#fff2d4", [1.7, 0.45, 0.65], [0, 0, 0]));
    boat.add(mesh("box", "#78aebb", [1, 0.8, 1], [0, 0.5, 0]));
    this.add(boat, 4, -0.4, 18);
    this.boat = boat;
    this.ambient.push({ obj: boat, type: "boat", phase: 0 });
    for (let i = 0; i < 12; i++) {
      const wave = mesh(
        "ring",
        "#c4e6df",
        [0.8, 0.2, 0.5],
        [Math.sin(i * 2) * 22, -0.78, Math.cos(i * 2) * 18],
      );
      wave.rotation.x = Math.PI / 2;
      this.add(wave);
      this.ambient.push({ obj: wave, type: "wave", phase: i });
    }
    for (let i = 0; i < 4; i++) {
      const bird = new THREE.Group();
      for (const x of [-0.15, 0.15]) {
        const wing = mesh("box", "#fffaf0", [0.35, 0.035, 0.12], [x, 0, 0]);
        wing.rotation.z = Math.sign(x) * 0.3;
        bird.add(wing);
      }
      this.add(bird, -8 + i * 4, 6, -7 + i * 2);
      this.ambient.push({ obj: bird, type: "bird", phase: i * 2 });
    }
    const allFriendIds =
      this.name === "celebration"
        ? []
        : this.save
          ? Object.keys(this.save.friends)
          : FRIENDS.slice(0, 4).map((f) => f.id);
    const visibleFriendIds = allFriendIds.slice(0, 30);
    visibleFriendIds.forEach((id, i) => {
      const f = FRIENDS.find((x) => x.id === id);
      if (!f) return;
      const ring = Math.floor(i / 10),
        ringStart = ring * 10,
        ringCount = Math.min(10, visibleFriendIds.length - ringStart),
        slot = i - ringStart,
        angle = (slot / Math.max(1, ringCount)) * Math.PI * 2 + ring * 0.28,
        radius = 4.8 + ring * 2.8,
        x = Math.sin(angle) * radius,
        z = Math.cos(angle) * radius;
      const c = this.human(
        { ...f.baseAppearance, outfit: "clothing_" + f.defaultOutfit },
        x,
        z,
        ["walk", "read", "wave", "think"][i % 4],
        0.75,
      );
      c.userData.ai = true;
      c.userData.origin = c.position.clone();
      this.interact(c, "friend:" + id, f.name, 2);
      this.labels.at(-1).hoverOnly = true;
      this.labels.at(-1).strictHover = true;
    });
    if (this.save) {
      this.hero = this.human(this.save.player.appearance, 0, 5, "idle", 0.85);
      this.interact(this.hero, "room", "じぶんのへや", 2.4);
      this.labels.at(-1).hoverOnly = true;
    }
    this.camTo.set(21, 26, 35);
    this.target.set(0, 0, 0);
  }
  room(s, friendId) {
    this.box(
      ITEMS.find((i) => i.id === s.room.floor)?.color || "#d9bd95",
      [9, 0.2, 8],
      [0, -0.15, 0],
    );
    const wall =
      ITEMS.find((i) => i.id === s.room.wallpaper)?.color || "#d8e3c6";
    this.box(wall, [9, 4, 0.15], [0, 2, -4]);
    this.box(wall, [0.15, 4, 8], [-4.5, 2, 0]);
    this.box("#93ccd9", [2, 1.7, 0.1], [1.8, 2.4, -3.85]);
    this.box("#f8eccf", [0.12, 1.8, 0.15], [1.8, 2.4, -3.72]);
    this.box("#f8eccf", [2.1, 0.12, 0.15], [1.8, 2.4, -3.72]);
    const curtain = this.box("#f5e9c9", [0.35, 2.1, 0.2], [3, 2.4, -3.5]);
    this.ambient.push({ obj: curtain, type: "curtain", phase: 0 });
    const slots = friendId
      ? Object.fromEntries(
          (s.friends[friendId].gifts.length
            ? s.friends[friendId].gifts
            : ["furniture_0", "furniture_3", "furniture_8"]
          )
            .slice(-6)
            .map((id, i) => [i, id]),
        )
      : s.room.slots;
    const positions = [
      [-3, -2],
      [0, -3],
      [3, -2],
      [-3, 1],
      [0, 1],
      [3, 1],
    ];
    for (let i = 0; i < 6; i++) {
      const [x, z] = positions[i],
        item = ITEMS.find((x) => x.id === slots[i]);
      if (item) {
        const m = this.add(furniture(item), x, 0, z);
        this.interact(m, "furniture:" + i, item.name, 1.6);
        this.labels.at(-1).strictHover = true;
      } else {
        const m = this.box("#c4ac85", [1.7, 0.03, 1.2], [x, 0.02, z]);
        this.interact(m, "furniture:" + i, "＋ おく", 0.4);
        this.labels.at(-1).strictHover = true;
      }
    }
    const f = FRIENDS.find((f) => f.id === friendId);
    this.hero = this.human(
      f
        ? { ...f.baseAppearance, outfit: "clothing_" + f.defaultOutfit }
        : s.player.appearance,
      -0.4,
      2,
      "idle",
    );
    if (f) {
      this.hero.userData.ai = true;
      this.hero.userData.origin = this.hero.position.clone();
      this.hero.userData.needs = s.friends[friendId].needs;
    }
    if (friendId) {
      this.interact(this.hero, "friend:" + friendId, f.name, 2.2);
      this.labels.at(-1).strictHover = true;
    }
    this.box("#d2e9e1", [1, 0.9, 0.4], [3.8, 0.85, 2.8]);
    if (!friendId) {
      const mirror = this.box("#b9dfe0", [0.1, 1.3, 0.8], [-4.25, 1.3, 2.5]);
      this.interact(mirror, "mirror", "かがみ", 1);
      this.labels.at(-1).strictHover = true;
    }
    if (s.inventory.specialItems.aquarium_small) {
      this.box("#90cdd1", [1.5, 0.8, 0.7], [2, 1.2, -3.2]);
      s.room.aquariumFish.slice(0, 5).forEach((id, i) => {
        const fish = this.add(
          creatureModel(
            FISH.find((f) => f.id === id),
            0.35,
          ),
          1.5 + i * 0.2,
          1.2,
          -2.8,
        );
        this.creatures.push(fish);
      });
    }
    s.room.dinosaurFigures.slice(0, 3).forEach((id, i) => {
      this.creatures.push(
        this.add(
          creatureModel(
            DINOS.find((d) => d.id === id),
            0.3,
          ),
          -3 + i * 0.6,
          1.7,
          -3.5,
        ),
      );
    });
    s.room.trophies
      .slice(0, 3)
      .forEach((id, i) =>
        this.add(
          mesh("cone", "#efc358", [0.14, 0.35, 0.14]),
          -0.8 + i * 0.4,
          1.6,
          -3.5,
        ),
      );
    s.room.photos.slice(0, 3).forEach((id, i) => {
      this.box("#f5dfb1", [0.6, 0.5, 0.12], [-2 + i * 0.8, 2.7, -3.8]);
      this.sphere("#c9dba3", [0.22, 0.16, 0.08], [-2 + i * 0.8, 2.7, -3.7]);
    });
  }
  pick(e) {
    if (!this.interactionsEnabled) return null;
    this.pointer.set(
      (e.clientX / innerWidth) * 2 - 1,
      (-e.clientY / innerHeight) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    const hits = this.ray.intersectObjects(this.targets, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData.action) return o.userData.action;
        o = o.parent;
      }
    }
    return null;
  }
  hover(e) {
    if (!this.interactionsEnabled) return;
    const id = this.pick(e);
    this.hovered = id;
    this.canvas.style.cursor = id ? "pointer" : "default";
    for (const c of this.characters)
      if (c.userData.action === id) c.lookAtPoint(this.camera.position);
  }
  frame(now) {
    const rawDt = (now - this.last) / 1000,
      dt = Math.min(0.05, rawDt);
    this.last = now;
    if (!this.paused && !document.hidden) {
      this.clock += dt;
      const t = this.clock;
      if (this.name === "arrival" && this.boat) {
        this.arrivalTime += dt;
        this.boat.position.x = 4 + Math.max(0, 5 - this.arrivalTime);
      }
      for (const c of this.characters) {
        if (c.userData.ai) {
          const u = c.userData;
          u.aiTimer -= dt;
          if (u.aiTimer <= 0) {
            u.aiTimer = 2 + Math.random() * 3;
            u.needs.energy = Math.max(
              0,
              Math.min(100, u.needs.energy + (u.state === "sleep" ? 8 : -1)),
            );
            u.needs.hunger = Math.min(100, u.needs.hunger + 0.3);
            u.needs.curiosity = Math.min(100, u.needs.curiosity + 0.5);
            const states =
              u.needs.energy < 20
                ? ["sleep"]
                : u.needs.hunger > 70
                  ? ["eat"]
                  : u.needs.curiosity > 70
                    ? ["read"]
                    : [
                        "walk",
                        "read",
                        "think",
                        "wave",
                        "idle",
                        "dance",
                        "sit",
                        "type",
                        "yawn",
                      ];
            if (u.state === "eat") u.needs.hunger = 15;
            if (u.state === "read") u.needs.curiosity = 25;
            c.setState(states[Math.floor(Math.random() * states.length)]);
            u.waypoint = u.origin
              .clone()
              .add(
                new THREE.Vector3(
                  Math.random() * 3 - 1.5,
                  0,
                  Math.random() * 2 - 1,
                ),
              );
          }
          if (u.state === "walk" && u.waypoint) {
            const v = u.waypoint.clone().sub(c.position);
            if (v.length() > 0.08) {
              c.rotation.y = Math.atan2(v.x, v.z);
              c.position.addScaledVector(v.normalize(), dt * 0.35);
            } else c.setState("idle");
          }
        }
        animateCharacter(c, t, dt);
      }
      for (const a of this.ambient) {
        if (a.type === "cloud") {
          a.obj.position.x += dt * 0.12;
          if (a.obj.position.x > 30) a.obj.position.x = -30;
        }
        if (a.type === "wave") {
          a.obj.position.y = -0.74 + Math.sin(t + a.phase) * 0.02;
          a.obj.scale.x = 0.8 + Math.sin(t * 0.5 + a.phase) * 0.15;
        }
        if (a.type === "tree") a.obj.rotation.z = Math.sin(t + a.phase) * 0.018;
        if (a.type === "bird") {
          a.obj.position.x += dt * 0.4;
          if (a.obj.position.x > 22) a.obj.position.x = -22;
          a.obj.children.forEach(
            (w, i) =>
              (w.rotation.z = Math.sin(t * 5 + a.phase) * (i ? 1 : -1) * 0.35),
          );
        }
        if (a.type === "boat") a.obj.rotation.z = Math.sin(t * 1.5) * 0.06;
        if (a.type === "curtain") a.obj.rotation.z = Math.sin(t) * 0.025;
        if (a.type === "glow")
          a.obj.scale.setScalar(0.2 + Math.sin(t * 2) * 0.025);
      }
      for (const c of this.creatures) {
        c.rotation.z = Math.sin(t * 2) * 0.025;
        if (c.userData.tail)
          c.userData.tail.rotation.y = Math.sin(t * 4) * 0.18;
      }
      if (this.bobber && this.name === "fishing")
        this.bobber.position.y = 0.03 + Math.sin(t * 4) * 0.08;
      if (this.fireworks) {
        if (
          Math.floor(t * 12) % 10 === 0 &&
          this.ambient.filter((x) => x.type === "spark").length < 50
        ) {
          for (let i = 0; i < 10; i++) {
            const p = this.sphere(
              COLORS[i % 8],
              [0.12, 0.12, 0.12],
              [-3 + Math.sin(t) * 5, 6, 0],
            );
            this.ambient.push({
              obj: p,
              type: "spark",
              phase: t,
              velocity: new THREE.Vector3(
                Math.cos(i) * 2,
                Math.sin(i) * 2,
                Math.sin(i * 2),
              ),
            });
          }
        }
        for (const a of this.ambient.filter((x) => x.type === "spark")) {
          a.obj.position.addScaledVector(a.velocity, dt);
          a.velocity.y -= dt;
          if (t - a.phase > 1.5) {
            this.scene.remove(a.obj);
            this.ambient.splice(this.ambient.indexOf(a), 1);
          }
        }
      }
      this.onFrame?.(dt, t);
    }
    this.renderer.render(this.scene, this.camera);
    for (const l of this.labels) {
      const p = l.object.getWorldPosition(new THREE.Vector3());
      const distanceToHero = this.hero
        ? Math.hypot(
            l.object.position.x - this.hero.position.x,
            l.object.position.z - this.hero.position.z,
          )
        : Infinity;
      const nearby =
        l.object !== this.hero &&
        (FACILITIES.some((f) => f.id === l.id)
          ? distanceToHero < 5.2
          : distanceToHero < 2.5);
      const relevant = l.strictHover
        ? this.hovered === l.id
        : !l.hoverOnly || this.hovered === l.id || nearby;
      p.y += l.offset;
      p.project(this.camera);
      const screenX = (p.x * 0.5 + 0.5) * innerWidth;
      const screenY = (-p.y * 0.5 + 0.5) * innerHeight;
      l.element.style.left =
        Math.max(95, Math.min(innerWidth - 95, screenX)) + "px";
      l.element.style.top =
        Math.max(118, Math.min(innerHeight - 118, screenY)) + "px";
      l.element.style.display =
        !this.interactionsEnabled || p.z > 1 || !relevant
          ? "none"
          : "";
    }
    if (dt > 0.04) {
      this.slow = (this.slow || 0) + dt;
      if (this.slow > 5) {
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;
      }
    } else this.slow = Math.max(0, (this.slow || 0) - dt);
    this.fps = 1 / Math.max(0.001, rawDt);
    requestAnimationFrame(this.frame);
  }
  typingProgress(words, mode) {
    if (mode === "rescue") {
      const x = this.rescueFish[words - 1];
      if (x) {
        x.bubble.visible = false;
        x.fish.position.x += 1.6;
        x.fish.rotation.z = 0.2;
      }
    }
    if (mode === "escape") this.hero.position.x -= 0.25;
    if (mode === "battle") {
      this.typingCreature.position.x += 0.25;
      this.hero.setState("victory");
    }
  }
  setQuality(q) {
    this.renderer.setPixelRatio(
      q === "low" ? 1 : Math.min(devicePixelRatio, q === "high" ? 1.5 : 1.25),
    );
    this.renderer.shadowMap.enabled = q !== "low";
  }
}
