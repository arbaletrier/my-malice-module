/************************************************************
 * Xeno-Malice Unified Module v3.7.0
 * - Xenotic ダメージ集計
 * - XenoticPoint アイテムの uses.value をピンポイント更新
 * - Actor や Token には一切触らない
 ************************************************************/

console.log("🧪 [Xeno-Malice] Unified Module v3.7.0 loaded");

Hooks.once("init", () => {
  console.log("🧬 [Xeno-Malice] Registering Xenotic damage type");
  CONFIG.DND5E.damageTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageResistanceTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageVulnerabilityTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageImmunityTypes["xenotic"] = "Xenotic";
});

// ★ GM権限で Item を更新するヘルパー
async function gmUpdateItem(item, updateData) {
  if (game.user.isGM) {
    return item.update(updateData);
  }
  return socket.executeAsGM("updateItemUses", item.actor.id, item.id, updateData);
}

if (game.user.isGM) {
  socket.register("updateItemUses", async (actorId, itemId, data) => {
    const actor = game.actors.get(actorId);
    const item  = actor?.items.get(itemId);
    if (!item) return false;
    console.log("👑 [GM] Applying update on server:", data);
    return item.update(data);
  });
}


Hooks.once("ready", () => {
  console.log("⚔️ [Xeno-Malice] Ready — DamageRollComplete active");
});

Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  console.log("🜂 [Xeno-Malice] DamageRollComplete triggered");

  const attacker = workflow.actor;
  const targetToken = workflow.hitTargets?.first?.() ?? workflow.targets?.first?.();
  if (!attacker || !targetToken) return;

  const defender = targetToken.actor;
  if (!defender) return;

  // --- Xenoticダメージ集計 ---
  let xenoticTotal = 0;
  let normalTotal = 0;
  const normalDetails = [];

  console.log("🔧 [Xeno-Malice] workflow.damageDetail:", workflow.damageDetail);

  for (const d of workflow.damageDetail) {
    console.log("🔧 [Xeno-Malice] Damage detail entry:", d);
    const dmgType = String(d.type ?? "").toLowerCase();
    if (dmgType === "xenotic") {
      xenoticTotal += d.value ?? d.damage ?? 0;
    } else {
      normalTotal += d.value ?? d.damage ?? 0;
      normalDetails.push(d);
    }
  }

  console.log(
    `🔧 [Xeno-Malice] collected totals → Normal:${normalTotal}, Xenotic:${xenoticTotal}`
  );

  if (xenoticTotal > 0 && attacker.type === "character") {
    console.log(`🔥 [Xeno-Malice] Xenotic +${xenoticTotal}`);

    // ★ XenoticPoint アイテムを特定（同名が複数あるので「最後の1つ」を採用）
    const allXenoItems = attacker.items.contents.filter(i =>
      (i.name ?? "").toLowerCase() === "xenoticpoint"
    );

    console.log(
      "📦 [Xeno-Malice] XenoticPoint candidates:",
      allXenoItems.map(i => `${i.name} (${i.id})`)
    );

    const xpItem = allXenoItems.at(-1); // 配列の最後の XenoticPoint を使用
    if (!xpItem) {
      console.warn("❌ [Xeno-Malice] XenoticPoint item NOT FOUND on attacker");
    } else {
      console.log(`🎯 [Xeno-Malice] Using XenoticPoint item: ${xpItem.name} (${xpItem.id})`);
      const uses = xpItem.system?.uses;

      if (!uses) {
        console.warn("⚠ [Xeno-Malice] XenoticPoint.item.system.uses is missing");
      } else {
        const before = Number(uses.value ?? 0);
        let rawMax = uses.max;
        let max = isNaN(Number(rawMax)) || rawMax === "" ? null : Number(rawMax);

        const after = before + xenoticTotal;

        console.log(
          `📈 [Xeno-Malice] XenoticPoint uses: ${before} → ${after} (max=${max ?? "∞"})`
        );

        const updateData = { "system.uses.value": after };
        if (rawMax === "") {
          // maxが空文字ならついでにnullにしておく（安全化）
          updateData["system.uses.max"] = null;
          console.log("🧹 [Xeno-Malice] Fixed invalid max ('') → null");
        }

        // GM権限で確実に適用
	await gmUpdateItem(xpItem, updateData);

	console.log(
  	"💾 [Xeno-Malice] GM-safe XenoticPoint update requested:",
  	updateData
      }
    }
  }

  // === 以下はオーラへのXenoticダメージ転送（必要であれば残す） ===
  const auraId = await defender.getFlag("world", "auraId");
  if (!auraId || xenoticTotal <= 0) return;

  const auraActor = game.actors.get(auraId);
  if (!auraActor) return;
  const auraToken = auraActor.getActiveTokens()[0];
  if (!auraToken) return;

  // Defenderには通常ダメージのみ残す
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
