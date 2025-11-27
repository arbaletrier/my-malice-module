/******************************************************
 * Xenotic Damage Splitter Module
 * 神のオーラに Xenotic ダメージのみを転送するダークソウル風拡張
 ******************************************************/

console.log("Xenotic Damage Splitter Module v1.1.0 loaded");

// 1) Xenotic ダメージタイプを DnD5e に追加
Hooks.once("init", () => {
  console.log("🧬 [Xenotic Aura Splitter] registering new damage type: xenotic");
  CONFIG.DND5E.damageTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageResistanceTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageVulnerabilityTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageImmunityTypes["xenotic"] = "Xenotic";
});

// 2) ゲーム準備
Hooks.once("ready", () => {
  console.log("⚔️ [Xenotic Aura Splitter] Module ready — DamageRollComplete active");
});

// 3) Xenotic ダメージを Aura に振り替える処理本体
Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  console.log("🜂 [Xenotic] DamageRollComplete triggered");

  // 対象（攻撃された側）取得
  const targetToken =
    workflow.hitTargets?.first
      ? workflow.hitTargets.first()
      : workflow.targets?.first?.();

  if (!targetToken) return;
  const defender = targetToken.actor;
  if (!defender) return;

  // 神 Actor 判定
  const auraId = await defender.getFlag("world", "auraId");
  if (!auraId) return;

  const auraActor = game.actors.get(auraId);
  if (!auraActor) return;

  const auraToken = auraActor.getActiveTokens()[0];
  if (!auraToken) return;

  // --- ダメージ集計 ---
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

  // Xenotic が無いなら通常処理
  if (xenoticTotal === 0) return;

  // --- God へは通常ダメージのみ残す ---
  workflow.damageDetail = normalDetails;
  workflow.damageTotal = normalTotal;

  // --- Aura へ Xenotic ダメージ ---
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
    console.error("❌ Xenotic Aura damage error:", e);
  }
});
