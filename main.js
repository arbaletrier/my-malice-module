/******************************************************
 * Malice Damage Splitter Module
 * 神のオーラに Malice ダメージのみを転送するダークソウル風拡張
 * 対象が auraId を持っている場合のみ発動
 ******************************************************/
console.log("Malice Damage Splitter Module起動");
Hooks.once("ready", () => {
  console.log("Malice splitter hook registered");

  Hooks.on("midi-qol.DamageApplied", async (workflow) => {
    console.log("→ MALICE HOOK TRIGGERED");

    const attacker = workflow.actor;
    if (!attacker) return;

    const targetToken = workflow.hitTargets.first();
    if (!targetToken) return;

    const defender = targetToken.actor;
    if (!defender) return;

    const auraId = defender.getFlag("world", "auraId");
    if (!auraId) {
      console.log("No Aura ID on defender");
      return;
    }

    const auraActor = game.actors.get(auraId);
    if (!auraActor) {
      console.log("Aura Actor NOT found");
      return;
    }

    // === ダメージ集計 ===
    let maliceDamage = 0;
    let normalDamage = 0;

    for (const d of workflow.damageDetail) {
      if (d.flavor === "Malice" || d.flavor === "怨恨") maliceDamage += d.damage;
      else normalDamage += d.damage;
    }

    console.log(`MALICE → ${maliceDamage}`);
    console.log(`NORMAL → ${normalDamage}`);

    // === ダメージ適用 ===
    if (maliceDamage > 0) {
      await auraActor.update({
        "system.attributes.hp.value": Math.max(auraActor.system.attributes.hp.value - maliceDamage, 0)
      });
    }

    if (normalDamage > 0) {
      await defender.update({
        "system.attributes.hp.value": Math.max(defender.system.attributes.hp.value - normalDamage, 0)
      });
    }

    console.log("★ Malice damage split finished");
  });
});
