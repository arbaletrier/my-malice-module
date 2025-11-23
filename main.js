/******************************************************
 * Malice Damage Splitter Module
 * 神のオーラに Malice ダメージのみを転送するダークソウル風拡張
 * 対象が auraId を持っている場合のみ発動
 ******************************************************/
console.log("Malice Damage Splitter Module起動");
// Malice Splitter – damageApplied 対応版
Hooks.on("midi-qol.damageApplied", async (workflow) => {
  try {
    const defender = workflow?.actor;
    if (!defender) return;

    const auraId = await defender.getFlag("world", "auraId");
    if (!auraId) return; // 神でない

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

    if (malice === 0) return; // Malice ダメージが無い攻撃は処理しない

    // HP適用（神は通常ダメージのみ / Aura は Malice のみ）
    if (normal > 0) await defender.applyDamage(normal);
    if (malice > 0) await auraActor.applyDamage(malice);

    console.log(`MALICE SPLIT → God:${normal} / Aura:${malice}`);
  } catch (e) {
    console.error("Malice Splitter error:", e);
  }
});

console.log("Malice Splitter module ready — damageApplied hook active");