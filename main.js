/************************************************************
 * Xeno-Malice Unified Module v3.5.0
 * - uses.max="" の場合に max=nullへ自動修正
 ************************************************************/

console.log("🧪 [Xeno-Malice] Unified Module v3.5.0 loaded");

Hooks.once("init", () => {
  console.log("🧬 [Xeno-Malice] Registering Xenotic damage type");
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

  // ★ 修正ポイント：空文字→null
  let max = isNaN(Number(rawMax)) || rawMax === "" ? null : Number(rawMax);

  const newValue = current + xeno;
  console.log(`📈 [Xeno-Malice] ${current} → ${newValue} (max=${max ?? "∞"})`);

  const updateData = {
    "system.uses.value": newValue
  };

  // maxが空だった場合、併せてnullに更新
  if (max === null) {
    updateData["system.uses.max"] = null;
    console.log("🧹 [Xeno-Malice] Fixed invalid max ('') → null");
  }

  await xpItem.update(updateData);

  console.log("💾 [Xeno-Malice] XenoticPoint UPDATED!");
});
