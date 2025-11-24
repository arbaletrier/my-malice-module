/******************************************************
 * Malice Damage Splitter Module
 * 神のオーラに Malice ダメージのみを転送するダークソウル風拡張
 * 対象が auraId を持っている場合のみ発動
 ******************************************************/
console.log("Malice Damage Splitter ModuleV1.1.0起動");
// Malice Splitter – damageApplied 対応版
Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  try {
    const defender = workflow?.targets?.first()?.actor;
    if (!defender) return;

    // 神Actor判定：auraIdを持っているか
    const auraId = defender.getFlag("world", "auraId");
    if (!auraId) return;

    const auraActor = game.actors.get(auraId);
    if (!auraActor) return;

    let malice = 0;
    let normal = 0;

    for (const d of workflow.damageDetail) {
      if (d.flavor === "Malice" || d.flavor === "怨恨") {
        malice += d.value;
      } else {
        normal += d.value;
      }
    }

    if (malice === 0) return; // Maliceが無い攻撃は処理不要

    console.log(`⚡ Malice detected: God receives ${normal}, Aura receives ${malice}`);

    if (normal > 0) await defender.applyDamage(normal);
    if (malice > 0) await auraActor.applyDamage(malice);

    ui.notifications.info(`Malice → Aura ${malice} / God ${normal}`);
  } catch (e) {
    console.error("Malice splitter error:", e);
  }
});

console.log("Malice Splitter — DamageRollComplete hook active");
