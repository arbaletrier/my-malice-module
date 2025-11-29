// XenoticPoint の Document ID 固定
const ACTOR_ID = game.user.character?.id;
if (!ACTOR_ID) return ui.notifications.error("❌ No controlled character found");

const actor = game.actors.get(ACTOR_ID);
const item = actor.items.get("nWyRMw6vdeX8XQ3K"); // ←固定

if (!item) {
  return ui.notifications.warn("⚠ XenoticPoint NOT FOUND on Character!");
}

const uses = item.system?.uses;
if (!uses) {
  return ui.notifications.warn("⚠ item.system.uses is undefined!");
}

const before = Number(uses.value ?? 0);
const after  = before + 1;

console.log(`📈 TEST: XenoticPoint uses ${before} → ${after}`);

// --- ★ピンポイント更新---
await item.update({ "system.uses.value": after });

console.log("💾 Update request completed");
ui.notifications.info("✔ Update Done!");
