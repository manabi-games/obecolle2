# Obecolle2 Rebuild v1.5

## Direction
v1.5 reduces visible information and reconnects the game around one child-readable loop:

**walk -> talk -> typing excavation -> dinosaur discovery -> collection -> talk again**

## Changes
- Protagonist-follow camera is now the default town view; the island overview control is removed from normal play.
- The active friend cast is reduced to 10. Existing save data for friends 11-30 is preserved but hidden.
- Each active friend has a recurring dialogue set and a distinct browser TTS rate/pitch/voice profile.
- Fishing, the old excavation minigame, and the arena are hidden during the rebuild. Their save data remains intact.
- Basic typing and excavation are merged into 30 excavation levels. Clearing level N discovers dinosaur N.
- Typing progression expands from 20 to 30 while migrating old level-20 saves forward.
- Shop, wardrobe/decorating choices, and collection tabs are reduced to representative items instead of repeated lookalikes.
- Completion requirements no longer depend on hidden fishing/arena content.

## Save compatibility
The saveVersion/gameVersion structure is unchanged. Hidden legacy systems are retained in the save schema so existing saves can load without destructive migration.
