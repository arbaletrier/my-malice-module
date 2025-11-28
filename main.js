/************************************************************
 * Xeno-Malice Unified Module v3.0.0
 * - Xenoticダメージタイプ登録
 * - 神オーラへXenoticだけを転送
 * - PCが与えたXenoticダメージをXenoticPointに蓄積
 ************************************************************/

console.log("🧪 [Xeno-Malice] Unified Module v3.0.0 loaded");

// 1) Xenotic ダメージタイプ登録
Hooks.once("init", () => {
  console.log("🧬 [Xeno-Malice] Registering Xenotic damage type");
  CONFIG.DND5E.damageTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageResistanceTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageVulnerabilityTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageImmunityTypes["xenotic"] = "Xenotic";
});

// 2) Ready Log
Hooks.once("ready", () => {
  console.log("⚔️ [Xeno-Malice] Ready — DamageRollComplete active");
});

// 3) Xenotic 処理本体
Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  console.log("🜂 [Xeno-Malice] DamageRollComplete triggered");

  const attacker = workflow.actor;
  const targetToken = workflow.hitTargets?.first?.() ?? workflow.targets?.first?.();
  if (!targetToken) return;
  const defender = targetToken.actor;
  if (!defender) return;

  let xenoticTotal = 0;
  let normalTotal = 0;
  const normalDetails = [];

  for (const d of workflow.damageDetail) {
    const dmgType = String(d.type ?? "").toLowerCase();
    if (dmgType === "xenotic") {
      xenoticTotal += d.value ?? d.damage ?? 0;
    } else {
      normalTotal += d.value ?? d.damage ?? 0;
      normalDetails.push(d);
    }
  }

  //★ Xenoticまたは対象不一致なら打ち切り
  if (xenoticTotal <= 0) return;

  //==============================
  // ✦ 追加要素 ✦ PCへの蓄積処理
  //==============================
  if (attacker?.type === "character") {
    console.log(`⚛ [Xeno-Malice] PC dealt ${xenoticTotal} Xenotic`);

    const res = attacker.system.resources;
    const slots = ["primary", "secondary", "tertiary"];

    for (const slot of slots) {
      const r = res[slot];
      if (!r?.label) continue;
      if (r.label.toLowerCase().includes("xenoticpoint")) {
        const newValue = (r.value ?? 0) + xenoticTotal;

        await attacker.update({
          [`system.resources.${slot}.value`]: newValue
        });
        console.log(`📈 [Xeno-Malice] XenoticPoint +${xenoticTotal} → ${newValue}`);
        break;
      }
    }
  }

  //==============================
  // ✦ 既存要素 ✦ オーラへの転送処理
  //==============================
  const auraId = await defender.getFlag("world", "auraId");
  if (!auraId) return;

  const auraActor = game.actors.get(auraId);
  if (!auraActor) return;
  const auraToken = auraActor.getActiveTokens()[0];
  if (!auraToken) return;

  workflow.damageDetail = normalDetails;
  workflow.damageTotal = normalTotal;

  try {
    await MidiQOL.applyTokenDamage(
      [{ damage: xenoticTotal, type: "xenotic" }],
      xenoticTotal,
      new Set([auraToken]),
      workflow.item,
      new Set(),
      { flavor: "Xenotic" }
    );
    console.log(`➡ [Xeno-Malice] Xenotic transferred to Aura (${xenoticTotal})`);
  } catch (e) {
    console.error("❌ [Xeno-Malice] Aura damage error:", e);
  }
});
