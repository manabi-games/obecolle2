export function resetTransientState(target) {
  target.companion = null;
  target.noticeQueue = [];
  target.arenaRound = null;
  target.pendingImport = null;
  target.roomFriend = null;
  target.decorateSlot = null;
  target.walkPath = [];
  target.walkDestination = null;
  target.nearDoor = null;
  target.activity = null;
  target.modalOpen = false;
  target.page = 0;
  target.category = "friends";
  target.memoryPage = 0;
  target.shopCategory = "clothing";
  target.shopPage = 0;
  target.walkOverview = false;
  target.editing = false;
  target.draft = null;
  target.newSlot = null;
  target.walkKeys?.clear();
  return target;
}
