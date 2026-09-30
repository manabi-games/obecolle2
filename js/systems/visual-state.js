import { ACTIVE_FRIENDS, FURNITURE_VISUALS, ITEMS } from "../data/catalog.js?v=visual-12-r2";

const itemsById = new Map(ITEMS.map((item) => [item.id, item]));
export const itemById = (id) => itemsById.get(id) || null;

export const VISUAL_KEYS = {
  furniture: new Set(FURNITURE_VISUALS),
  clothing: new Set("hoodie baseball astronaut ninja pirate chef explorer dinosaur pajamas racer scientist royal hero festival scholar sailor robot raincoat soccer forest".split(" ")),
  accessories: new Set("cap straw explorer crown graduate helmet space ninja pirate ears dino headband chef sailor wizard flower round square star heart monocle sunglasses goggles".split(" ")),
  wallpaper: new Set(["wallpaper-grid"]),
  floor: new Set(["floor-tile"]),
};
export function itemVisual(item) {
  if (!item) return null;
  if (!VISUAL_KEYS[item.type]?.has(item.visual))
    throw Error(`unknown ${item.type} visual: ${item.id} (${item.visual})`);
  return item.visual;
}

export function currentFriendAppearance(friend, state) {
  const gifts = (state?.gifts || []).map(itemById).filter(Boolean).reverse();
  const clothing = gifts.find((item) => item.type === "clothing");
  const glasses = gifts.find((item) => item.type === "accessories" && item.id.startsWith("glasses_"));
  const hat = gifts.find((item) => item.type === "accessories" && !item.id.startsWith("glasses_"));
  return {
    ...friend.baseAppearance,
    outfit: clothing?.id || `clothing_${friend.defaultOutfit}`,
    ...(hat ? { hat: hat.id } : {}),
    ...(glasses ? { glasses: glasses.id } : {}),
  };
}

const FRIEND_WALLS = ["#dcebd5", "#d8e6ef", "#f0dce4", "#f1e5c9", "#dce8df", "#e5def0", "#f2e0cf", "#d9e7e7", "#e8dfd2", "#eee4c9"];
const FRIEND_FLOORS = ["#d6bd95", "#c9b998", "#d7b9a4", "#d4c49c", "#c9bea7", "#c9b6a4", "#d5c0a1", "#c5b79f", "#ccb89e", "#d8c29d"];

export function buildRoomVisualState(save, friendId = null) {
  if (!friendId) {
    const furnitureIds = Array.from({ length: 6 }, (_, i) => save.room.slots?.[i] || null);
    return {
      wallId: save.room.wallpaper,
      floorId: save.room.floor,
      wall: itemById(save.room.wallpaper)?.color || "#d8e3c6",
      floor: itemById(save.room.floor)?.color || "#d9bd95",
      furnitureIds,
      appearance: save.player.appearance,
    };
  }
  const friend = ACTIVE_FRIENDS.find((row) => row.id === friendId);
  if (!friend) throw Error(`unknown friend room: ${friendId}`);
  const index = ACTIVE_FRIENDS.indexOf(friend);
  const state = save.friends[friendId];
  const furnitureIds = (state?.gifts || [])
    .filter((id) => itemById(id)?.type === "furniture")
    .slice(-6);
  return {
    wallId: null,
    floorId: null,
    wall: FRIEND_WALLS[index % FRIEND_WALLS.length],
    floor: FRIEND_FLOORS[index % FRIEND_FLOORS.length],
    furnitureIds: Array.from({ length: 6 }, (_, i) => furnitureIds[i] || null),
    appearance: currentFriendAppearance(friend, state),
  };
}
