import assert from "node:assert/strict";
import fs from "node:fs";
import {
  deriveInteractionState,
  shouldRestoreIsland,
} from "../js/systems/ui-state.js";
import { doors, findPathToDoor, walkable } from "../js/systems/walking.js";

const state = (overrides = {}) =>
  deriveInteractionState({
    scene: "island",
    worldName: "island",
    modalOpen: false,
    activityKind: null,
    panelOpen: false,
    sceneReady: true,
    ...overrides,
  });

assert.deepEqual(state(), {
  sceneMatchesWorld: true,
  worldInteractions: true,
  labelsVisible: true,
  walkingEnabled: true,
});

for (const blocked of [
  { modalOpen: true },
  { activityKind: "typing" },
  { panelOpen: true },
  { sceneReady: false },
  { worldName: "arrival" },
]) {
  const result = state(blocked);
  assert.equal(result.worldInteractions, false, JSON.stringify(blocked));
  assert.equal(result.labelsVisible, false, JSON.stringify(blocked));
  assert.equal(result.walkingEnabled, false, JSON.stringify(blocked));
}

assert.equal(shouldRestoreIsland("island", "arrival"), true);
assert.equal(shouldRestoreIsland("island", "island"), false);
assert.equal(shouldRestoreIsland("room", "room"), false);

for (const door of doors) {
  const position = { x: 0, z: 5 };
  const route = findPathToDoor(position, door);
  assert.ok(route.length, `${door.id} must have an approach route`);
  let frames = 0;
  while (route.length && frames++ < 2400) {
    const target = route[0];
    const distance = Math.hypot(target.x - position.x, target.z - position.z);
    if (distance < 0.15) {
      route.shift();
      continue;
    }
    const step = Math.min(4.2 / 60, distance);
    const dx = ((target.x - position.x) / distance) * step;
    const dz = ((target.z - position.z) / distance) * step;
    if (walkable(position.x + dx, position.z)) position.x += dx;
    if (walkable(position.x, position.z + dz)) position.z += dz;
  }
  assert.equal(route.length, 0, `${door.id} route must not stall at collision edges`);
  assert.ok(
    Math.hypot(door.x - position.x, door.z - position.z) < 1.45,
    `${door.id} route must finish inside Enter range`,
  );
}

for (const scene of ["mansion", "room"]) {
  const result = state({ scene, worldName: scene });
  assert.equal(result.worldInteractions, true);
  assert.equal(result.labelsVisible, true);
  assert.equal(result.walkingEnabled, false);
}

for (const scene of ["opening", "school", "quiz", "typing", "fishing"])
  assert.equal(
    state({ scene, worldName: scene }).worldInteractions,
    false,
    `${scene} must not expose world labels`,
  );

const main = fs.readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
const world = fs.readFileSync(
  new URL("../js/three/world.js", import.meta.url),
  "utf8",
);
const css = fs.readFileSync(new URL("../css/game.css", import.meta.url), "utf8");

assert.ok(main.includes("shouldRestoreIsland(this.scene, this.world.name)"));
assert.ok(main.includes("this.syncInteractionState();"));
assert.ok(main.includes("this.walkPath = [];\n        this.walkDestination = null;"));
assert.ok(
  main.indexOf('if (e.code === "Escape")') <
    main.indexOf('if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName))'),
  "Escape must work while a settings control is focused",
);
assert.ok(world.includes("this.labels.at(-1).hoverOnly = true;"));
assert.ok(world.includes("Math.max(118, Math.min(innerHeight - 118, screenY))"));
assert.ok(css.includes("/* v1.3.1 interaction and HUD stabilization */"));
assert.ok(css.includes("@media (max-width: 1450px)"));

console.log("PASS: Obecolle2 v1.3.1 interaction-state regression verifier");
