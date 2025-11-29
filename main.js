/************************************************************
 * Xeno-Malice Safe Test v3.7.1
 * XenoticPoint (ID固定) の uses.value を +1するだけ
 ************************************************************/

console.log("🧪 [Xeno-Malice Test] v3.7.1 loaded");

// ★ あなたの XenoticPoint アイテムID（固定）
const ITEM_ID = "nWyRMw6vdeX8XQ3K";

// Foundry 起動後、即テスト実行
Hooks.once("ready", async () => {
  console.log("🧪 [Xeno-Malice Test] ready → Try update…");

  const actor = game.user.character;
  if (!actor) {
    return ui.notifications.error("❌ game.user.character なし");
  }

  const item = actor.items.get(ITEM_ID);
  if (!item) {
    return ui.notifications.error("❌ XenoticPoint アイテム未発見（ID不一致？）");
  }

  const uses = item.system?.uses;
  if (!uses) {
    return ui.notifications.error("❌ system.uses が無い");
  }

  const before = Number(uses.value ?? 0);
  const after = before + 1;

  console.log(`📈 [Xeno-Malice Test] uses: ${before} → ${after}`);

  await item.update({ "system.uses.value": after });

  console.log("💾 [Xeno-Malice Test] 更新完了");
  ui.notifications.info("✔ XenoticPoint +1 完了！");

});
