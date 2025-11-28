/************************************************************
 * Xeno-Malice Unified Module v3.3.0
 ************************************************************/

console.log("🧪 [Xeno-Malice] Unified Module v3.3.0 loaded");

Hooks.once("init", () => {
  console.log("🧬 [Xeno-Malice] Registering Xenotic damage type");
  CONFIG.DND5E.damageTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageResistanceTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageVulnerabilityTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageImmunityTypes["xenotic"] = "Xenotic";
});

Hooks.once("ready", () => {
  console.log("⚔️ [Xeno-Malice] Ready — DamageRollComplete active");
});

Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  console.log("🜂 [Xeno-Malice] DamageRollComplete triggered");

  const attacker = workflow.actor;
  const targetToken = workflow.hitTargets?.first?.() ?? workflow.targets?.first?.();
  if (!targetToken) return;
  const defender = targetToken.actor;
  if (!defender) return;

  let xeno = 0;
  const normalDetails = [];
  let normalTotal = 0;

  for (const d of workflow.damageDetail) {
    const t = (d.type ?? "").toLowerCase();
    if (t === "xenotic") xeno += d.value ?? 0;
    else {
      normalDetails.push(d);
      normalTotal += d.value ?? 0;
    }
  }

  if (xeno > 0 && attacker?.type === "character") {
    console.log(`⚛ [Xeno-Malice] PC dealt ${xeno} Xenotic`);

    const item = attacker.items.find(i =>
      i.name?.toLowerCase()?.includes("xenotic")
    );

    if (item) {
      const uses = item.system?.uses;
      if (uses) {
        let current = Number(uses.value ?? 0);
        let max = Number(uses.max);

        if (isNaN(max) || max <= 0) {
          max = null; // 上限無視
        }

        let newValue = current + xeno;
        if (max !== null) newValue = Math.min(newValue, max);

        await item.update({
          "system.uses.value": newValue
        });

        console.log(`📈 [Xeno-Malice] XenoticPoint: ${current} → ${newValue}`);
      }
    }
  }

  const auraId = await defender.getFlag("world", "auraId");
  if (!auraId || xeno <= 0) return;

  const auraActor = game.actors.get(auraId);
  const auraToken = auraActor.getActiveTokens()[0];
  if (!auraToken) return;

  workflow.damageDetail = normalDetails;
  workflow.damageTotal = normalTotal;

  try {
    await MidiQOL.applyTokenDamage(
      [{ damage: xeno, type: "xenotic" }],
      xeno,
      new Set([auraToken]),
      workflow.item,
      new Set(),
      { flavor: "Xenotic" }
    );
    console.log(`➡ [Xeno-Malice] Xenotic transferred to Aura (${xeno})`);
  } catch (e) {
    console.error("❌ [Xeno-Malice] Aura error:", e);
  }
});
