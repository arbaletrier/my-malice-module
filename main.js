/******************************************************
 * Malice Damage Splitter Module
 * 神のオーラに Malice ダメージのみを転送するダークソウル風拡張
 * 対象が auraId を持っている場合のみ発動
 ******************************************************/
console.log("Malice Damage Splitter Module起動");
Hooks.once("ready", () => {
  console.log("Malice splitter hook registered");

  Hooks.on("midi-qol.WorkflowUpdate", async (workflow, update) => {
    if (!update?.damageApplied) return; // ダメージが適用されたイベント以外は無視

    const targetToken = workflow.hitTargets.first();
    if (!targetToken) return;
    const defender = targetToken.actor;

    const auraId = defender.getFlag("world", "auraId");
    if (!auraId) return;
    const auraActor = game.actors.get(auraId);
    if (!auraActor) return;

    let malice = 0;
    for (const d of update.damageApplied) {
      if (d.flavor === "Malice" || d.flavor === "怨恨") {
        malice += d.totalDamage;
      }
    }

    if (malice === 0) return;

    console.log(`✔ MALICE DETECTED: ${malice} → Aura`);

    // Defender に適用された Malice ダメージをそのまま回復（取り消し）
    await defender.update({
      "system.attributes.hp.value": defender.system.attributes.hp.value + malice
    });

    // Aura に Malice ダメージを適用
    await auraActor.update({
      "system.attributes.hp.value": Math.max(auraActor.system.attributes.hp.value - malice, 0)
    });

    console.log("★ Malice redistribution complete");
  });
});
