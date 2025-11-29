/************************************************************
 * Xeno-Malice Unified Module v4.0.0
 * - Xenotic ダメージタイプ定義
 * - Xenoticダメージを Auraへ転送
 * - XenoticPoint蓄積（GM権限安全処理）
 ************************************************************/

console.log("🔥 [Xeno-Malice] Unified Module v4.0.0 loaded");

/* ---------------------------------------------------------
 * GM API: アイテム更新処理（Socket経由）
 * --------------------------------------------------------- */
async function gmUpdateItem(actorId, itemId, data) {
  console.log("📡 [Xeno-Malice] Request GM to update item:", data);

  if (game.user.isGM) {
    const actor = game.actors.get(actorId);
    const item = actor?.items.get(itemId);
    if (!item) {
      console.warn("⚠ [Xeno-Malice] GM: item not found");
      return false;
    }
    return item.update(data);
  }

  // プレイヤー操作 → GMへ転送
  return socket.executeAsGM("xenoUpdateItem", actorId, itemId, data);
}

if (game.user.isGM) {
  socket.register("xenoUpdateItem", async (actorId, itemId, data) => {
    const actor = game.actors.get(actorId);
    const item = actor?.items.get(itemId);
    if (!item) {
      console.warn("⚠ [Xeno-Malice] GM: item not found");
      return false;
    }
    console.log("👑 [Xeno-Malice] GM updating item:", data);
    return item.update(data);
  });
}

/* ---------------------------------------------------------
 * Xenotic Damage Type
 * --------------------------------------------------------- */
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

/* ---------------------------------------------------------
 * Xenotic Damage Handling
 * --------------------------------------------------------- */
Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  console.log("🜂 [Xeno-Malice] DamageRollComplete!");

  const attacker = workflow.actor;
  const targetToken = workflow.hitTargets?.first?.();
  if (!attacker || !targetToken) return;

  const defender = targetToken.actor;
  if (!defender) return;

  // --- Damage Split ---
  let xenotic = 0;
  let normal = 0;
  const normalDetails = [];

  for (const d of workflow.damageDetail) {
    const type = (d.type ?? "").toLowerCase();
    if (type === "xenotic") {
      xenotic += d.value ?? d.damage ?? 0;
    } else {
      normal += d.value ?? d.damage ?? 0;
      normalDetails.push(d);
    }
  }

  console.log(`🧮 [Xeno-Malice] Totals → Normal:${normal} / Xenotic:${xenotic}`);

  /* ----------------------------------------
   * Xenotic蓄積（攻撃側）
   * ---------------------------------------- */
  if (xenotic > 0 && attacker.type === "character") {
    console.log(`🔥 [Xeno-Malice] Attacker dealt Xenotic: +${xenotic}`);

    // XenoticPoint アイテム特定（名前完全一致）
    const xpItem = attacker.items.find(i =>
      (i.name ?? "").toLowerCase() === "xenoticpoint"
    );

    if (!xpItem) {
      console.warn("🚫 [Xeno-Malice] XenoticPoint missing on attacker");
    } else {
      const uses = xpItem.system?.uses;
      const before = Number(uses?.value ?? 0);
      const after = before + xenotic;

      console.log(`📈 [Xeno-Malice] XenoticPoint: ${before} → ${after}`);

      const updateData = { "system.uses.value": after };
      if (uses?.max === "") updateData["system.uses.max"] = null;

      await gmUpdateItem(attacker.id, xpItem.id, updateData);

      console.log("💾 [Xeno-Malice] XenoticPoint updated ✔");
    }
  }

  /* ----------------------------------------
   * Aura 転送処理
   * ---------------------------------------- */
  if (xenotic <= 0) return;

  const auraId = await defender.getFlag("world", "auraId");
  if (!auraId) return;

  const auraActor = game.actors.get(auraId);
  const auraToken = auraActor?.getActiveTokens()[0];
  if (!auraToken) return;

  workflow.damageDetail = normalDetails;
  workflow.damageTotal = normal;

  try {
    await MidiQOL.applyTokenDamage(
      [{ damage: xenotic, type: "xenotic" }],
      xenotic,
      new Set([auraToken]),
      workflow.item,
      new Set(),
      { flavor: "Xenotic" }
    );
    console.log(`➡ [Xeno-Malice] Xenotic transferred to Aura: ${xenotic}`);
  } catch (e) {
    console.error("❌ [Xeno-Malice] Aura damage error", e);
  }
});
