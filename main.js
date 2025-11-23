/******************************************************
 * Malice Damage Splitter Module
 * 神のオーラに Malice ダメージのみを転送するダークソウル風拡張
 * 対象が auraId を持っている場合のみ発動
 ******************************************************/
console.log("Malice Damage Splitter Module起動");
Hooks.once("ready", () => {
  console.log("Malice module ready — damage splitter enabled");

  Hooks.on("midi-qol.DamageApplied", async (workflow) => {
    // 対象が存在しないなら中断
    const targetToken = workflow.hitTargets?.first();
    if (!targetToken) return;

    const defender = targetToken.actor;
    const attacker = workflow.actor;

    // defender に auraId（= Aura Actor の ID）がなければ中断
    const auraId = defender.getFlag("world", "auraId");
    if (!auraId) return;

    const auraActor = game.actors.get(auraId);
    if (!auraActor) {
      console.warn("Malice module: Aura Actor not found:", auraId);
      return;
    }

    // ダメージ分解（Malice / 通常）
    let maliceDamage = 0;
    let normalDamage = 0;

    for (let part of workflow.damageDetail) {
      const isMalice = (part.flavor === "Malice" || part.flavor === "怨恨");
      if (isMalice) maliceDamage += part.damage;
      else normalDamage += part.damage;
    }

    // Maliceダメージも通常ダメージも 0 の場合は処理不要
    if (maliceDamage === 0 && normalDamage === 0) return;

    console.log(
      `Malice module: ${attacker.name} hit ${defender.name} → normal=${normalDamage}, malice=${maliceDamage}`
    );

    // --- Maliceは Aura Actorに与える ---
    if (maliceDamage > 0) {
      const auraToken = auraActor?.getActiveTokens()?.[0];
      if (auraToken) {
        await MidiQOL.applyTokenDamage(
          [{ damage: maliceDamage, type: "malice" }],
          maliceDamage,
          new Set([auraToken]),
          null,
          null
        );
      } else {
        // トークンがシーンにいなくても HP を直接更新
        const newHp = Math.max(auraActor.system.attributes.hp.value - maliceDamage, 0);
        await auraActor.update({ "system.attributes.hp.value": newHp });
      }
    }

    // --- 通常ダメージは Defender に任せる（Midi-QOL が自動で適用）---

  });
});
