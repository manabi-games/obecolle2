# obecolle2 v1.4.0 — Browser QA / Release Gate

## Required viewports
必須:
- **1280×720**（最重要。全主要画面を必ず確認）
- 1366×768
- 1920×1080

追加stress test推奨:
- 1365×600 または近い低height viewport

## Browser-wide gates
全viewport共通:
- console error: **0**
- uncaught promise rejection: **0**
- main interaction controlsがHUD / toast / panel外へ隠れない
- panel表示中はHUDが操作競合しない
- 戻る/終了導線が画面内にある
- F5後にsaveが壊れない

## 12 required route screenshots
最低12枚、以下の状態をそれぞれ残すこと。
1. Title
2. Island（friend複数表示）
3. Friend dialog
4. School 8 subjects
5. Typing level picker / play
6. Fishing result
7. Excavation result
8. Collection（friend/creature silhouettes含む）
9. Shop
10. Room + furniture hover label
11. Decorate position map
12. Arena match/result

1280×720の証跡を中心にし、崩れがviewport依存なら追加撮影する。

## Functional gates
### Title / common panels
- main buttons・versionが完全表示。
- panel-open時のHUDが非表示または操作不能で競合しない。
- toastが重要buttonを覆わない。

### Friend / island
- owned friendsは最大30人までislandに出現可能。
- 6人固定上限が残っていない。
- friend appearanceがdefault outfitを正しく反映。
- friend / room / furniture labelはstrict hoverで常時大量表示されない。
- friend request/fulfillへ不正IDを渡しても破損しない。

### School / learning
- 8 subject cardsが見える。
- fish=60 / dinosaurs=30 / animals=40 のデータが学習導線と矛盾しない。
- 魚の場所設問は生物学的な断言ではなく「このゲームでは〜つりばグループ」と説明。
- contextual漢字は設問内に答えの読み仮名を表示しない。
- 同じ読みの漢字が誤答候補に混ざらない。

### Typing
- Lv1〜20が選択可能な範囲で正常表示。
- 20 level banksが別内容。
- Lv1–8: core kana、Lv9–10: short words/促音、Lv11–13: 拗音/game語彙、Lv14–17: fish/dino/animal、Lv18–20: sentences。
- rescue fish castがlevelで変化。

### Fishing / excavation reward
- result artがpanel内に収まる。
- 名前・サイズ/説明・主要buttonが不要な縦スクロールなしで確認可能。
- **「しまへ」** が見える。

### Collection
- friend portraitsが同一アイコンではなくappearance差を持つ。
- locked entryはsilhouette。
- fish/dino atlas cropが正しい。

### Shop / wardrobe
- 所有済みnon-stackable itemは再購入不可。
- furnitureはstack可能。
- 未所有 clothing/accessory/wallpaper/floorをwearできない。
- glasses IDsで見た目が変わる。

### Room / decorate
- raw furniture dropdownなし。
- 「slot 1〜6」の子ども向けでない文言なし。
- visual furniture picker + position mapで置ける。
- 全片付けconfirm後に新しいdecorate panelを誤ってcloseしない。
- inventory所有数より多く同じ家具を配置できない。
- aquarium_small未所有時は魚を飾れない。
- `display:fish` の直接導線がfish categoryを開く。

### Animal visuals
- 3D animalはcatalog `shape` を基準に描画。
- hippo/rhino/bear/koala/kangaroo/rabbit/squirrel/camelがgeneric一択にならない。
- `marine_reptile` と `plesiosaur` が別シルエット。
- painted 2D cutoutとlow-poly 3Dを不自然に混在させない。

### Arena
- cup_0 / cup_5: all creatures
- cup_1: land
- cup_2: dinosaur
- cup_3: ocean
- cup_4: ancient
- selected creatureをstart時にも再検証。
- opponentも同cup eligibility。
- eligible owned creatureが0ならcupをunlockしない。
- legacyで進行中cupはunlock listから落とさない。
- match/resultに **「しまへ」** が見える。
- battle overlayへ切替後もinteraction stateが同期される。

### Chest / missions
- 日付跨ぎ状態ではclaim前にdaily mission stateがrefreshされる。
- 全clothing所有済みでもclothing duplicateを付与しない。
- furniture duplicateは許可。

## Save / reload regression
1. 新規save作成 → F5 → load成功。
2. 家具配置・服装・魚/恐竜/学習の変更後 → F5 →状態保持。
3. v1.3.2相当saveで `room.wallpaper` / `room.floor` が無い状態をload/migrateして、`wallpaper_0` / `floor_0` が復元される。
4. variable `specialItems` を理由にshape validationが落ちない。
5. legacy Lv20 learning recordがvalidationを通る。

## Continuous-play gate
**10分以上**、できれば12分以上連続で:

title → island → friend → school → typing → fish → collection → shop → room → decorate → excavation → arena → island

確認:
- console error 0
- UI stuck 0
- button dead-end 0
- save error 0
- scene/HUD interaction leak 0

## Automated regression before and after browser QA
repo rootで:

```bash
python scripts/run-v1-4-release-checks.py
```

すべてPASSしなければpush禁止。
