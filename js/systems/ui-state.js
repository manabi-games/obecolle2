const WORLD_SCENES = new Set(["island", "mansion", "room"]);

export function deriveInteractionState({
  scene,
  worldName,
  modalOpen = false,
  activityKind = null,
  panelOpen = false,
  sceneReady = false,
}) {
  const sceneMatchesWorld = scene === worldName;
  const worldScene = WORLD_SCENES.has(scene);
  const worldInteractions =
    sceneMatchesWorld &&
    worldScene &&
    sceneReady &&
    !modalOpen &&
    !activityKind &&
    !panelOpen;

  return {
    sceneMatchesWorld,
    worldInteractions,
    labelsVisible: worldInteractions,
    walkingEnabled: worldInteractions && scene === "island",
  };
}

export function shouldRestoreIsland(scene, worldName) {
  return scene === "island" && worldName !== "island";
}
