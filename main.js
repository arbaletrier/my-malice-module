/******************************************************
 * Xeno-Malice Unified Module v2.3.1
 * - Xenotic Damage Splitter
 * - HP.max → XP.max Sync (PC Only)
 ******************************************************/

console.log("Xeno-Malice Unified Module v2.3.1 loaded");


/* -------------------------------------------
 * 1) ready時：DnD5e用の Xenotic ダメージタイプ登録
 *    ＋ HP.max → XP.max 初期同期
 * ------------------------------------------- */
Hooks.once("ready", async () => {
  console.log("⚙️ [Xeno-Malice] ready hook start");

  // ---- DnD5e コンフィグ取得 ----
  const dnd5eConfig = CONFIG.DND5E ?? CONFIG.dnd5e;
  if (!dnd5eConfig) {
    console.error("❌ [Xeno-Malice] DnD5e system config not found. Is the dnd5e system active?");
    return;
  }

  // ---- Xenotic ダメージタイプ登録 ----
  console.log("🧬 [Xeno-Malice] Registering Xenotic damage type");
  dnd5eConfig.damageTypes["xenotic"] = "Xenotic";
  dnd5eConfig.damageResistanceTypes["xenotic"] = "Xenotic";
  dnd5eConfig.damageVulnerabilityTypes["xenotic"] = "Xenotic";
  dnd5eConfig.damageImmunityTypes["xenotic"] = "Xenotic";

  // ---- HP.max → XP.max 初期同期 ----
  console.log("⚙️ [Xeno-Malice] Initial HP→XP.max sync running...");

  for (const actor of game.actors.contents) {
    if (actor.type !== "character") continue;

    const maxHP = actor.system?.attributes?.hp?.max ?? 0;

    await actor.update(
      { "system.details.xp.max": maxHP },
      { noHook: true }  // ループ防止
    );
  }

  console.log("🟢 [Xeno-Malice] Initial sync complete.");
});


/* -------------------------------------------
 * 2) HP.max の変更時 → XP.max 自動同期（PCのみ）
 * ------------------------------------------- */
Hooks.on("preUpdateActor", (actor, update) => {
  if (actor.type !== "character") return;

  const newMaxHP = getProperty(update, "system.attributes.hp.max");
  if (newMaxHP === undefined) return;

  console.log(`🔁 [Xeno-Malice] Sync HP.max(${newMaxHP}) -> XP.max for`, actor.name);
  setProperty(update, "system.details.xp.max", newMaxHP);
});


/* -------------------------------------------
 * 3) Xenotic Damage Splitter
 *    Xenotic ダメージのみ Aura に転送
 * ------------------------------------------- */
Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  console.log("🜂 [Xenotic] DamageRollComplete triggered");

  const targetToken = workflow.hitTargets?.first?.() ?? workflow.targets?.first?.();
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
    console.log("🔧 [Xeno-Malice] Damage detail entry:", d);
    const dmgType = String(d.type ?? "").toLowerCase();
    if (dmgType === "xenotic") {
      xenoticTotal += d.value ?? d.damage ?? 0;
    } else {
      normalTotal += d.value ?? d.damage ?? 0;
      normalDetails.push(d);
    }
  }

  // Xenotic ダメージが無ければ通常通り
  if (xenoticTotal === 0) return;

  // Defender 側には通常ダメージのみ
  workflow.damageDetail = normalDetails;
  workflow.damageTotal = normalTotal;

  // Aura に Xenotic ダメージ転送
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
