# v1.11 visual/UI QA

This branch changes presentation while retaining the v1.11 game rules, item IDs, friend IDs, save version, and the ten active friends.

## Browser checks

- Played an existing Rank 3 save in the local browser. Walked from the island into the shop and mansion, opened self and friend rooms, used the wardrobe and gift screens, and returned to the island.
- Bought and equipped a baseball outfit. Completed math Lv1/Lv2, typing excavation Lv1, and the dojo's 10-word time attack during this visual pass.
- Placed furniture, equipped the dojo headband, refreshed the page, and loaded the same save again. The furniture, outfit, headband, progress, and friend gift remained visible.
- Gifted the dojo headband to a friend. Its room preview and 3D character reflect the gift after reload.
- Checked the shop, typing map, wardrobe, mansion, and gift layout at 1366×600, 1280×720, 1366×768, and 1920×1080. The checked screens had no document scroll or important buttons outside the viewport.
- Checked the browser Console after the final reload and room/shop navigation; no errors were reported.

## Automated checks

- `node scripts/verify-v1-11-ui-mansion.mjs`: PASS
- `node scripts/verify-v1-11-visual.mjs`: PASS
- `node scripts/verify-stabilization.mjs`: PASS
- `node --check` for each changed JavaScript file: PASS
- `git diff --check`: PASS

Historical version-specific verifiers, such as `verify-v1-10-density-dojo.mjs`, assert their old version number and therefore do not pass against v1.11. They were not modified for this presentation change.
