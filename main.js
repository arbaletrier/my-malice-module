/******************************************************
 * Malice Damage Splitter Module
 * 神のオーラに Malice ダメージのみを転送するダークソウル風拡張
 * 対象が auraId を持っている場合のみ発動
 ******************************************************/
console.log("Malice Damage Splitter ModuleV1.1.0起動");
// ================================
// Malice Aura Splitter - main.js
// ================================

// 1) DnD5e 初期化時に Malice ダメージタイプを追加
Hooks.once("init", () => {
  console.log("🔮 [Malice Aura Splitter] adding new damage type: malice");

  // DnD5e v4.3+ 新仕様
  CONFIG.DND5E.damageTypes["malice"] = "Malice";        // 表示名称
  CONFIG.DND5E.damageResistanceTypes["malice"] = "Malice";
  CONFIG.DND5E.damageVulnerabilityTypes["malice"] = "Malice";
  CONFIG.DND5E.damageImmunityTypes["malice"] = "Malice";
});

// 2) ゲーム準備完了
Hooks.once("ready", () => {
  console.log("✅ [Malice Aura Splitter] Module ready - using DamageRollComplete hook");
});

// 3) DamageRollComplete で Malice ダメージを Aura に飛ばす
Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  console.log("🌀 [Malice] DamageRollComplete fired");

  // --- 対象取得（ヒット対象優先 / なければ targets） ---
  const targetToken =
    workflow.hitTargets?.first
      ? workflow.hitTargets.first()
      : workflow.targets?.first?.();

  console.log("  🎯 targetToken:", targetToken);

  if (!targetToken) {
    console.log("  ⛔ STOP: no target token");
    return;
  }

  const defender = targetToken.actor;
  console.log("  👤 defender:", defender?.name);

  if (!defender) {
    console.log("  ⛔ STOP: no defender actor");
    return;
  }

  // --- 神Actor判定：flags.world.auraId を持っているか ---
  const auraId = await defender.getFlag("world", "auraId");
  console.log("  🌫 auraId flag:", auraId);

  if (!auraId) {
    console.log("  ⛔ STOP: defender has no auraId flag (not a God)");
    return;
  }

  const auraActor = game.actors.get(auraId);
  console.log("  👻 auraActor:", auraActor?.name);

  if (!auraActor) {
    console.log("  ⛔ STOP: auraActor not found for auraId");
    return;
  }

  // シーン上のAuraトークン（最初の1体だけ想定）
  const auraToken = auraActor.getActiveTokens()[0];
  console.log("  🧿 auraToken:", auraToken);

  if (!auraToken) {
    console.log("  ⛔ STOP: auraActor has no active token on scene");
    return;
  }

  // --- ダメージ内訳 ---
  console.log("  📦 workflow.damageDetail:", workflow.damageDetail);

  let maliceTotal = 0;
  let normalTotal = 0;

  const normalDetails = [];

  for (const d of workflow.damageDetail) {
    console.log("    🔍 entry:", d);

    // d.type が "malice" なら Malice ダメージとみなす
    const dmgType = String(d.type ?? "").toLowerCase();
    if (dmgType === "malice") {
      maliceTotal += d.value ?? d.damage ?? 0;
      console.log(`    👉 counted as MALICE: +${d.value ?? d.damage ?? 0}`);
    } else {
      normalTotal += d.value ?? d.damage ?? 0;
      normalDetails.push(d);
      console.log(`    👉 counted as NORMAL: +${d.value ?? d.damage ?? 0}`);
    }
  }

  console.log(
    `  📊 collected totals → Normal:${normalTotal}, Malice:${maliceTotal}`
  );

  if (maliceTotal === 0) {
    console.log("  ⛔ STOP: no Malice damage in this roll");
    return;
  }

  // --- God へのダメージを書き換え（通常ダメージのみ残す） ---
  workflow.damageDetail = normalDetails;
  workflow.damageTotal = normalTotal;

  console.log(
    `  ✂ damageDetail overwritten for God → now only Normal:${normalTotal}`
  );

  // --- Aura へ Malice ダメージを別途適用 ---
  try {
    console.log(
      `  ⚡ applying ${maliceTotal} Malice damage to Aura token ${auraToken.name}`
    );

    // Midi-QOL の applyTokenDamage を使って Aura にだけ Malice を与える
    await MidiQOL.applyTokenDamage(
      [{ damage: maliceTotal, type: "malice" }],
      maliceTotal,
      new Set([auraToken]),
      workflow.item,
      new Set(),
      { flavor: "Malice" }
    );

    console.log("  🎉 Malice damage applied to Aura");
  } catch (e) {
    console.error("  💥 ERROR applying Malice damage to Aura:", e);
  }

  console.log("✅ [Malice Aura Splitter] DamageRollComplete finished");
});
