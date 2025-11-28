/************************************************************
 * Xeno-Malice Unified Module v3.2.0
 * - Xenoticダメージタイプ登録
 * - 神オーラへXenoticだけを転送
 * - PCが与えたXenoticダメージを特徴「XenoticPoint」の使用回数として蓄積
 *   （system.uses か activities.*.uses を自動検出）
 ************************************************************/

console.log("🧪 [Xeno-Malice] Unified Module v3.2.0 loaded");

// 1) Xenotic ダメージタイプ登録
Hooks.once("init", () => {
  console.log("🧬 [Xeno-Malice] Registering Xenotic damage type");
  CONFIG.DND5E.damageTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageResistanceTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageVulnerabilityTypes["xenotic"] = "Xenotic";
  CONFIG.DND5E.damageImmunityTypes["xenotic"] = "Xenotic";
});

// 2) Ready ログ
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

  // --- ダメージ集計 ---
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

  // Xenoticダメージが無ければ何もしない
  if (xenoticTotal <= 0) return;

  //==============================
  // ✦ XenoticPoint蓄積（PCのみ）
  //==============================
  if (attacker?.type === "character") {
    console.log(`⚛ [Xeno-Malice] PC dealt ${xenoticTotal} Xenotic`);

    // 名前に「XenoticPoint」を含む特徴アイテムを探す
    const xenoticItem = attacker.items.find((item) => {
      const name = (item.name ?? "").toLowerCase();
      return name.includes("xenoticpoint") || name.includes("xenotic point");
    });

    if (!xenoticItem) {
      console.warn("⚠ [Xeno-Malice] Feature 'XenoticPoint' not found on attacker");
    } else {
      // データ構造を一度ログに吐いて確認
      console.log("[Xeno-Malice] XenoticPoint item found:", xenoticItem.name);
      console.log("[Xeno-Malice] XenoticPoint system.uses:", xenoticItem.system?.uses);
      console.log("[Xeno-Malice] XenoticPoint system.activities:", xenoticItem.system?.activities);

      let path = null;
      let current = 0;
      let max = null;

      // ① まずは従来の system.uses.value をチェック
      const uses = xenoticItem.system?.uses;
      if (uses && typeof uses.value === "number") {
        path = "system.uses.value";
        current = uses.value;
        max = typeof uses.max === "number" ? uses.max : null;
      }

      // ② 見つからなければ activities.*.uses.value を探索
      if (!path && xenoticItem.system?.activities) {
        for (const [actId, act] of Object.entries(xenoticItem.system.activities)) {
          if (act && act.uses && typeof act.uses.value === "number") {
            path = `system.activities.${actId}.uses.value`;
            current = act.uses.value;
            max = typeof act.uses.max === "number" ? act.uses.max : null;
            console.log(`[Xeno-Malice] Using activity uses at ${path}`);
            break;
          }
        }
      }

      if (!path) {
        console.warn("⚠ [Xeno-Malice] No usable 'uses.value' field found on XenoticPoint item");
      } else {
        let newValue = current + xenoticTotal;
        if (max !== null) {
          newValue = Math.min(newValue, max);
        }

        console.log(
          `📈 [Xeno-Malice] Updating ${path}: ${current} → ${newValue}` +
          (max !== null ? ` / ${max}` : "")
        );

        const updateData = {};
        updateData[path] = newValue;

        await xenoticItem.update(updateData);
      }
    }
  }

  //==============================
  // ✦ オーラへの転送処理
  //==============================
  const auraId = await defender.getFlag("world", "auraId");
  if (!auraId) return;

  const auraActor = game.actors.get(auraId);
  if (!auraActor) return;
  const auraToken = auraActor.getActiveTokens()[0];
  if (!auraToken) return;

  // Defender側には通常ダメージだけ残す
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
