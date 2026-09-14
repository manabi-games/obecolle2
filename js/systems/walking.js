import { FACILITIES } from "../data/catalog.js";

export const doors = FACILITIES.map((f) => ({
  ...f,
  z: f.z + (f.id === "plaza" ? 2.6 : 2.8),
}));

export function walkable(x, z) {
  if ((x / 19) ** 2 + (z / 15) ** 2 > 1) return false;
  if (Math.hypot(x, z - 1) < 1.55) return false;
  return !FACILITIES.some(
    (f) =>
      f.id !== "plaza" &&
      Math.abs(x - f.x) < (f.id === "mansion" ? 2.8 : 1.95) &&
      Math.abs(z - f.z) < 2.0,
  );
}

// Small island grid, cardinal steps. Paths never cut through buildings or the sea.
export function findPath(start, goal) {
  const key = (x, z) => `${x},${z}`;
  const from = [Math.round(start.x), Math.round(start.z)];
  const to = [Math.round(goal.x), Math.round(goal.z)];
  const queue = [from],
    previous = new Map([[key(...from), null]]);
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    if (x === to[0] && z === to[1]) {
      const path = [];
      let k = key(x, z);
      while (previous.get(k) !== null) {
        const [xx, zz] = k.split(",").map(Number);
        path.unshift({ x: xx, z: zz });
        k = previous.get(k);
      }
      return path;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const xx = x + dx,
        zz = z + dz,
        k = key(xx, zz);
      if (!previous.has(k) && walkable(xx, zz)) {
        previous.set(k, key(x, z));
        queue.push([xx, zz]);
      }
    }
  }
  return [];
}

// Building taps should be a complete command: walk close enough, then enter.
// Try several safe approach tiles so scenery/collision around an entrance cannot
// leave the child stranded one step away from the door.
export function findPathToDoor(start, door) {
  const offsets = [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [2, 0],
    [-2, 0],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [0, 2],
    [0, -2],
  ];
  let best = null;
  let bestScore = Infinity;
  for (const [dx, dz] of offsets) {
    const goal = { x: door.x + dx, z: door.z + dz };
    if (!walkable(Math.round(goal.x), Math.round(goal.z))) continue;
    const path = findPath(start, goal);
    const alreadyThere =
      Math.hypot(start.x - goal.x, start.z - goal.z) < 0.8;
    if (!path.length && !alreadyThere) continue;
    const route = path.length ? path : [{ x: goal.x, z: goal.z }];
    const approachDistance = Math.hypot(dx, dz);
    const score = route.length + approachDistance * 4;
    if (score < bestScore) {
      best = route;
      bestScore = score;
    }
  }
  return best || [];
}
