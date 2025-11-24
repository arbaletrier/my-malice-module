/******************************************************
 * Malice Damage Splitter Module
 * 神のオーラに Malice ダメージのみを転送するダークソウル風拡張
 * 対象が auraId を持っている場合のみ発動
 ******************************************************/
console.log("Malice Damage Splitter ModuleV1.1.0起動");
// Malice Splitter – damageApplied 対応版
// ======== MALICE DEBUG VERSION ========
console.log("🔧 MALICE DEBUG: script loaded");

Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  console.log("🔧 MALICE DEBUG: DamageRollComplete fired");
  console.log("🔧 workflow:", workflow);

  // defender（対象Actor）取得
  const targetToken = workflow?.targets?.first();
  console.log("🔧 targetToken:", targetToken);
  if (!targetToken) return console.log("🛑 STOP: no target token → defender missing");

  const defender = targetToken.actor;
  console.log("🔧 defender:", defender);
  if (!defender) return console.log("🛑 STOP: no defender actor");

  // auraIdの有無チェック（神判定）
  const auraId = defender.getFlag("world", "auraId");
  console.log("🔧 auraId:", auraId);
  if (!auraId) return console.log("🛑 STOP: this defender is NOT a God (auraId missing)");

  const auraActor = game.actors.get(auraId);
  console.log("🔧 auraActor:", auraActor);
  if (!auraActor) return console.log("🛑 STOP: auraId set but actor not found in Actors directory");

  console.log("🔧 workflow.damageDetail:", workflow.damageDetail);

  let malice = 0;
  let normal = 0;

  for (const d of workflow.damageDetail) {
    console.log("🔧 Damage detail entry:", d);
    if (d.flavor === "Malice" || d.flavor === "怨恨") {
      malice += d.value;
      console.log(`🔧 → counted as MALICE ${d.value}`);
    } else {
      normal += d.value;
      console.log(`🔧 → counted as NORMAL ${d.value}`);
    }
  }

  console.log(`🔧 collected totals → Normal:${normal}, Malice:${malice}`);

  if (malice === 0) return console.log("🛑 STOP: no Malice damage found in this roll");

  console.log(`⚡ APPLY: God receives ${normal}, Aura receives ${malice}`);

  try {
    if (normal > 0) {
      console.log("🔧 applying normal damage to defender");
      await defender.applyDamage(normal);
    }
    if (malice > 0) {
      console.log("🔧 applying malice damage to aura");
      await auraActor.applyDamage(malice);
    }
    console.log("🎉 MALICE APPLIED SUCCESSFULLY");
  } catch (e) {
    console.error("💥 APPLY ERROR:", e);
  }
});

console.log("🔧 MALICE DEBUG: DamageRollComplete hook registered");
