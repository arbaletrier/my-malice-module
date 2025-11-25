/******************************************************
 * Malice Damage Splitter Module
 * 神のオーラに Malice ダメージのみを転送するダークソウル風拡張
 ******************************************************/

console.log("Malice Damage Splitter Module v1.1.0 loaded");

// 1) Malice ダメージタイプを DnD5e に追加
Hooks.once("init", () => {
  console.log("🔮 [Malice Aura Splitter] registering new damage type: malice");
  CONFIG.DND5E.damageTypes["malice"] = "Malice";
  CONFIG.DND5E.damageResistanceTypes["malice"] = "Malice";
  CONFIG.DND5E.damageVulnerabilityTypes["malice"] = "Malice";
  CONFIG.DND5E.damageImmunityTypes["malice"] = "Malice";
});

// 2) ゲーム準備
Hooks.once("ready", () => {
  console.log("⚔️ [Malice Aura Splitter] Module ready — DamageRollComplete active");
});

// 3) Malice ダメージを Aura に振り替える処理本体
Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  console.log("🌀 [Malice] DamageRollComplete triggered");

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
  let maliceTotal = 0;
  let normalTotal = 0;
  const normalDetails = [];

  for (const d of workflow.damageDetail) {
    const dmgType = String(d.type ?? "").toLowerCase();
    if (dmgType === "malice") {
      maliceTotal += d.value ?? d.damage ?? 0;
    } else {
      normalTotal += d.value ?? d.damage ?? 0;
      normalDetails.push(d);
    }
  }

  // Malice が無いなら通常処理
  if (maliceTotal === 0) return;

  // --- God へは通常ダメージのみ残す ---
  workflow.damageDetail = normalDetails;
  workflow.damageTotal = normalTotal;

  // --- Aura へ Malice ダメージ ---
  try {
    await MidiQOL.applyTokenDamage(
      [{ damage: maliceTotal, type: "malice" }],
      maliceTotal,
      new Set([auraToken]),
      workflow.item,
      new Set(),
      { flavor: "Malice" }
    );
  } catch (e) {
    console.error("❌ Malice Aura damage error:", e);
  }
});
