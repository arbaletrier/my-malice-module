/************************************************************
 * Xeno-Malice Unified Module v3.6.0
 * - Actor本体とTokenデータ両方を更新しUIへ反映
 ************************************************************/

console.log("🧪 [Xeno-Malice] Unified Module v3.6.0 loaded");

Hooks.once("init", () => {
  console.log("🧬 [Xeno-Malice] Xenotic damage type registered");
  CONFIG.DND5E.damageTypes["xenotic"] = "Xenotic";
});

Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  const attacker = workflow.actor;
  if (!attacker || attacker.type !== "character") return;

  let xeno = 0;
  for (const d of workflow.damageDetail) {
    if ((d.type ?? "").toLowerCase() === "xenotic")
      xeno += d.value ?? 0;
  }
  if (xeno <= 0) return;

  console.log(`🔥 [Xeno-Malice] Xenotic +${xeno}`);

  const xpItem = attacker.items.find(i =>
    i.name?.toLowerCase()?.includes("xenotic")
  );
  if (!xpItem) return console.warn("❌ XenoticPoint not found");

  const uses = xpItem.system?.uses;
  if (!uses) return console.warn("❌ Uses field missing");

  let current = Number(uses.value) || 0;
  let rawMax = uses.max;
  let max = isNaN(Number(rawMax)) || rawMax === "" ? null : Number(rawMax);

  const newValue = current + xeno;
  console.log(`📈 [Xeno-Malice] ${current} → ${newValue} (max=${max ?? "∞"})`);

  const updateData = {
    "system.uses.value": newValue,
    "system.uses.max": max
  };

  //========================
  // Actor 本体更新
  //========================
  await xpItem.update(updateData);
  console.log("💾 Actor item updated");

  //========================
  // Token 側の表示強制更新
  //========================
  for (const token of attacker.getActiveTokens()) {
    await token.actor.update(updateData, { render: true });
    await token.object.drawEffects();
  }

  console.log("🖥 [Xeno-Malice] Token HUD refreshed successfully!");
});
