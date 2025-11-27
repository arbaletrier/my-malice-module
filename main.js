/******************************************************
 * Xeno-Malice Unified Module v2.2.0
 * - Xenotic Damage Splitter
 * - HP.max → XP.max Sync (PC Only)
 *   ※XP.value（侵蝕蓄積値）はまだ使用しない
 ******************************************************/

console.log("Xeno-Malice Module v2.2.0 loaded");


/* -------------------------------------------
 * 1) Xenotic Damage Type の登録
 * ------------------------------------------- */
Hooks.once("init", () => {
  CONFIG.DND5E.damageTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageResistanceTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageVulnerabilityTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageImmunityTypes["xenotic"] = "Xenotic";
  console.log("🧬 [Xeno-Malice] Xenotic damage type registered.");
});


/* -------------------------------------------
 * 2) ready時：全PCの MaxHP → XP.max 初期同期
 * ------------------------------------------- */
Hooks.once("ready", async () => {
  console.log("⚙️ [Xeno-Malice] Initial HP→XP.max sync running...");

  for (const actor of game.actors.contents) {
    if (actor.type !== "character") continue;

    const maxHP = actor.system?.attributes?.hp?.max ?? 0;

    await actor.update(
      { "system.details.xp.max": maxHP },
      { noHook: true } // 循環呼び出し防止
    );
  }

  console.log("🟢 [Xeno-Malice] Init sync complete.");
});


/* -------------------------------------------
 * 3) HP.max の変更時：XP.max を自動同期（PCのみ）
 * ------------------------------------------- */
Hooks.on("preUpdateActor", (actor, update) => {
  if (actor.type !== "character") return;

  // 更新内に MaxHP 変更があるか検索
  const newMaxHP = getProperty(update, "system.attributes.hp.max");
  if (newMaxHP === undefined) return;

  // 必要XP(=XP.max)へ反映
  setProperty(update, "system.details.xp.max", newMaxHP);
});


/* -------------------------------------------
 * 4) Xenotic Damage Splitter
 *    神のAuraへ転送する処理本体
 * ------------------------------------------- */
Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  const targetToken = workflow.hitTargets?.first?.() ?? workflow.targets?.first?.();
  if (!targetToken) return;

  const defender = targetToken.actor;
  if (!defender) return;

  // Auraへのリンク判定
  const auraId = await defender.getFlag("world", "auraId");
  if (!auraId) return;

  const auraActor = game.actors.get(auraId);
  if (!auraActor) return;

  const auraToken = auraActor.getActiveTokens()[0];
  if (!auraToken) return;

  let xenoticTotal = 0;
  let normalTotal = 0;
  const normalDetails = [];

  for (const d of workflow.damageDetail) {
    if (String(d.type ?? "").toLowerCase() === "xenotic") {
      xenoticTotal += d.value ?? d.damage ?? 0;
    } else {
      normalTotal += d.value ?? d.damage ?? 0;
      normalDetails.push(d);
    }
  }

  // Xenoticダメージ無しなら無処理
  if (xenoticTotal === 0) return;

  // Defender側には通常ダメージのみ
  workflow.damageDetail = normalDetails;
  workflow.damageTotal = normalTotal;

  // XenoticダメージはAuraへ
  try {
    await MidiQOL.applyTokenDamage(
      [{ damage: xenoticTotal, type: "xenotic" }],
      xenoticTotal,
      new Set([auraToken]),
      workflow.item,
      new Set(),
      { flavor: "Xenotic" }
    );
  } catch (e) {
    console.error("❌ [Xeno-Malice] Aura damage error:", e);
  }
});
