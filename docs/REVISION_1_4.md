# Version 1.4.0 — Child UX Foundation / Visual Integrity

v1.3.2 exact baseline `9f4570639afbcd00c7dc86b6bc9822003395b16d` を対象にした、子ども向けUX・視覚整合性・save互換性の統合改修。

## UX / viewport
- dialog focus mode
- panel-open時HUD競合を解消
- 1280×720を含む低height表示をhardening
- child-grid / creator panelをviewport内へ収める
- creator desktop右寄せ / narrow中央寄せ
- help 2×2 / adult note
- toastと重要操作の競合を軽減

## Friend / appearance
- island friendの旧6人capを廃止、owned最大30人を3ring配置
- 3D friend outfitを`clothing_N` IDで統一
- strictHover labels
- friend portrait hair 4〜11差分
- request/fulfill invalid friend ID guard

## Creature visuals
- fish semantic rarity / shape
- animal catalog semantic shapeを拡張
- `animalModel()` は名前配列ではなく `a.shape` 主体
- hippo/rhino/bear/koala/kangaroo/rabbit/squirrel/camel専用branch
- `marine_reptile` / `plesiosaur` を分離
- locked collection silhouette / atlas crop整合

## Learning
- fish 60種すべて学習情報を保持
- checkpoint後不足していた29種に個別情報を追加
- animal 40種すべて学習情報を保持
- `FISH_INFO` / `ANIMAL_INFO` export
- salmon/eel等を含む場所問題は「このゲームのつりばグループ」表現へ変更
- gorilla food typo修正
- contextual漢字へ変更し、設問中の読み答え露出を除去
- 同じ読みの漢字を誤答候補から除外

## Typing
- Lv1〜20で20 distinct banks
- Lv1–8 core kana
- Lv9–10 short words / 促音
- Lv11–13 拗音 / game vocabulary
- Lv14–17 fish / dinosaur / animal
- Lv18–20 sentences
- rescue fish variety by level

## Room / inventory / save
- starter `wallpaper_0` / `floor_0` ownership
- v1.3.2 saveでroom surface key欠落をvalidation許容しmigrationで復元
- variable `specialItems` をstrict shape比較対象外へ
- room placed quantity <= owned quantity
- equipped rod ownership validation
- room photo -> memory reference validation
- appearance bounds / outfit/accessory ownership validation
- wear ownership guard
- direct `display:fish` routing
- clear-room confirm後のpanel誤close修正
- aquarium_small ownership gate
- furniture stack / spare-copy gift

## Daily chest
- claim前にdaily date rolloverをrefresh
- clothingは所有済みを抽選候補から除外
- furniture duplicateは維持
- eligible item poolが空でもcrashしない

## Arena
- eligibility:
  - cup_0 / cup_5 = all
  - cup_1 = land
  - cup_2 = dinosaur
  - cup_3 = ocean
  - cup_4 = ancient
- unlock時にeligible owned creatureを要求
- legacy in-progress cupを保持
- start時にselected creatureを再検証
- opponentもsame-cup eligible poolから選択
- round1 subject variety / tournament-theme knowledge
- match/resultへvisible `しまへ`
- battle overlay切替後`syncInteractionState()`

## Automated verification
`verify-v1-4-ux.mjs` をcomprehensive verifierへ更新し、最低限以下を検証:
- VERSION / data validator / typing validator
- counts 60/30/40/30
- learning coverage 60/40
- semantic animal shapes / fish rarity 1..5
- 20 distinct typing banks
- fresh save / legacy Lv20 / old surface migration
- room qty / appearance / rod / photo
- spare furniture gift / friend invalid IDs
- midnight chest / duplicate clothing guard
- Arena eligibility / ownership unlock / active legacy cup
- transient reset
- old dropdown/action route removal
- world / CSS source gates

## Package safety
- exact baseline HEAD + blob SHA checks
- in-memory staging; replacement failure before flush leaves repo untouched
- package audit checks OLD-anchor target-token contamination and literal `\\n` emission
- major POST-CHECKPOINT DELTA anchors checked against exact GitHub baseline and confirmed unique

## Deferred beyond v1.4.0
- full bespoke anatomy for every single creature
- deeper reward/economy rebalancing
- complete mobile-specific redesign
- unrelated new game modes/features
