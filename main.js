/******************************************************
 * Xeno-Malice Unified Module
 * - Xenotic Damage Split
 * - HP → XP Sync (PC Only)
 ******************************************************/

console.log("Xeno-Malice Unified Module v2.0.0 loaded");


/* ------------------------------------------ *
 * 1) DnD5e へ Xenotic ダメージタイプを追加
 * ------------------------------------------ */
Hooks.once("init", () => {
  console.log("🧬 [Xeno-Malice] registering damage type: xenotic");
  CONFIG.DND5E.damageTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageResistanceTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageVulnerabilityTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageImmunityTypes["xenotic"] = "Xenotic";
});


/* ------------------------------------------ *
 * 2) ゲーム開始時：HP → XP 初期同期
 * ------------------------------------------ */
Hooks.once("ready", async () => {
  console.log("⚙️ [Xeno-Malice] Initial HP→XP Sync running...");

  for (const actor of game.actors.contents) {
    if (actor.type !== "character") continue;
    const hp = actor.system.attributes.hp?.max ?? 0;
    await actor.update({
      "system.details.xp.value": hp
    });
  }

  console.log("🟢 [Xeno-Malice] Init Sync Complete");
});


/* ------------------------------------------ *
 * 3) HP変動時：HP → XP の自動同期（PCのみ）
 * ------------------------------------------ */
Hooks.on("preUpdateActor", (actor, update) => {
  if (actor.type !== "character") return;

  const newHP = getProperty(update, "system.attributes.hp.max");
  if (newHP === undefined) return;

  // HPが増減したら直ちにXPへコピー
  setProperty(update, "system.details.xp.value", newHP);
});


/* ------------------------------------------ *
 * 4) Xenotic ダメージの Aura 転送処理
 * ------------------------------------------ */
Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  console.log("🜂 [Xenotic] DamageRollComplete triggered");

  const targetToken =
    workflow.hitTargets?.first
      ? workflow.hitTargets.first()
      : workflow.targets?.first?.();

  if (!targetToken) return;
  const defender = targetToken.actor;
  if (!defender) return;

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
    const dmgType = String(d.type ?? "").toLowerCase();
    if (dmgType === "xenotic") {
      xenoticTotal += d.value ?? d.damage ?? 0;
    } else {
      normalTotal += d.value ?? d.damage ?? 0;
      normalDetails.push(d);
    }
  }

  if (xenoticTotal === 0) return;

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
  } catch (e) {
    console.error("❌ [Xenotic] Aura damage error:", e);
  }
});
