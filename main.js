/******************************************************
 * Xeno-Malice Unified Module v4.0.0 (Stable)
 * ・Xenoticダメージ → Auraへ移送
 * ・与えたXenoticダメージ分だけXenoticPoint増加
 *   ※uses.spent を減らす方式 (残回数 = max - spent)
 ******************************************************/

console.log("🧬 [Xeno-Malice] Module Loaded v4.0.0");

Hooks.once("init", () => {
  console.log("🧬 [Xeno-Malice] Register Xenotic damage type");
  CONFIG.DND5E.damageTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageResistanceTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageVulnerabilityTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageImmunityTypes["xenotic"] = "Xenotic";
});

Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  console.log("🜂 [Xeno-Malice] DamageRollComplete triggered");

  const attacker = workflow.actor;
  const targetToken = workflow.hitTargets?.first();
  if (!attacker || !targetToken) return;
  const defender = targetToken.actor;
  if (!defender) return;

  const auraId = await defender.getFlag("world", "auraId");
  if (!auraId) return;
  const auraActor = game.actors.get(auraId);
  const auraToken = auraActor?.getActiveTokens()[0];
  if (!auraToken) return;

  let xenoticTotal = 0;
  const normalDetails = [];
  let normalTotal = 0;

  for (const d of workflow.damageDetail) {
    const dmgType = String(d.type ?? "").toLowerCase();
    if (dmgType === "xenotic") {
      xenoticTotal += d.value ?? d.damage ?? 0;
    } else {
      normalTotal += d.value ?? d.damage ?? 0;
      normalDetails.push(d);
    }
  }

  if (xenoticTotal <= 0) {
    console.log("🛑 [Xeno-Malice] No Xenotic damage in this attack");
    return;
  }

  console.log(`⚛ [Xeno-Malice] Xenotic dealt: ${xenoticTotal}`);

  // XenoticPointアイテム取得
  const xenoticItem = attacker.items.find(i =>
    i.name.toLowerCase() === "xenoticpoint"
  );
  if (!xenoticItem) {
    console.warn("❓ [Xeno-Malice] XenoticPoint item not found on attacker!");
  } else {
    const uses = xenoticItem.system.uses;

    // spentを減らす → 残回数増加
    const newSpent = Math.max(0, (uses.spent ?? 0) - xenoticTotal);

    await xenoticItem.update({
      "system.uses.spent": newSpent
    });

    const remaining = uses.max - newSpent;

    console.log(`📈 [Xeno-Malice] XenoticPoint Updated → Remaining: ${remaining}/${uses.max}`);
  }

  // AuraへXenoticダメージ送る
  try {
    await MidiQOL.applyTokenDamage(
      [{ damage: xenoticTotal, type: "xenotic" }],
      xenoticTotal,
      new Set([auraToken]),
      workflow.item,
      new Set(),
      { flavor: "Xenotic Corruption" }
    );
    console.log(`➡ [Xeno-Malice] Aura Damage applied: ${xenoticTotal}`);
  } catch (e) {
    console.error("❌ [Xeno-Malice] Aura Damage Error:", e);
  }

  // 攻撃対象には通常ダメージのみ適用
  workflow.damageDetail = normalDetails;
  workflow.damageTotal = normalTotal;
});
