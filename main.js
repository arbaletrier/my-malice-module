/************************************************************
 * Xeno-Malice Unified Module v3.4.0 (Debug Extended)
 * - PCの使用アイテム「XenoticPoint」を確実に検出するためのログ強化版
 ************************************************************/

console.log("🧪 [Xeno-Malice] Unified Module v3.4.0 loaded");

Hooks.once("init", () => {
  console.log("🧬 [Xeno-Malice] Xenotic damage type registered");
  CONFIG.DND5E.damageTypes["xenotic"] = "Xenotic";
});

Hooks.once("ready", () => {
  console.log("⚔️ [Xeno-Malice] Ready — XenoticPoint debug enabled");
});

Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
  const attacker = workflow.actor;
  if (!attacker || attacker.type !== "character") return;

  let xeno = 0;
  for (const d of workflow.damageDetail) {
    const type = (d.type ?? "").toLowerCase();
    if (type === "xenotic") xeno += d.value ?? 0;
  }

  if (xeno <= 0) return;

  console.log(`🔥 [Xeno-Malice] Xenotic Damage Detected: +${xeno}`);

  //==============================
  // アイテム探索デバッグ
  //==============================
  console.log("🧿 [Xeno-Malice] Searching for XenoticPoint item…");
  console.log("📦 Attacker items:", attacker.items.contents.map(i => i.name));

  let xpItem = attacker.items.find(i =>
    i.name?.toLowerCase()?.includes("xenotic") &&
    (i.system?.uses !== undefined || i.system?.activities !== undefined)
  );

  if (!xpItem) {
    console.warn("🚫 [Xeno-Malice] XenoticPoint item NOT FOUND on this actor!");
    return; // ここでストップ
  }

  console.log(`🎯 [Xeno-Malice] XenoticPoint item FOUND: ${xpItem.name}`);
  console.log("🧩 uses:", xpItem.system?.uses);
  console.log("🧩 activities:", xpItem.system?.activities);

  let path = null;
  let current = 0;
  let max = null;

  // ① 直接 `system.uses.value` を試す
  if (xpItem.system?.uses?.value !== undefined) {
    path = "system.uses.value";
    current = Number(xpItem.system.uses.value);
    const rawMax = xpItem.system.uses.max;
    max = isNaN(Number(rawMax)) ? null : Number(rawMax);
    console.log("📌 [Xeno-Malice] Direct uses detected at:", path);
  }

  // ② activities 内もチェック
  if (!path && xpItem.system?.activities) {
    for (const [id, act] of Object.entries(xpItem.system.activities)) {
      if (act?.uses?.value !== undefined) {
        path = `system.activities.${id}.uses.value`;
        current = Number(act.uses.value);
        const rawMax = act.uses.max;
        max = isNaN(Number(rawMax)) ? null : Number(rawMax);
        console.log("📌 [Xeno-Malice] Activity uses detected at:", path);
        break;
      }
    }
  }

  // ※ どこにも uses が無い場合
  if (!path) {
    console.error("❌ [Xeno-Malice] NO valid uses.value field found. Cannot update.");
    return;
  }

  let newValue = current + xeno;
  if (max !== null) newValue = Math.min(newValue, max);

  console.log(`📈 [Xeno-Malice] Update: ${current} → ${newValue} (max=${max})`);

  const data = {};
  data[path] = newValue;
  await xpItem.update(data);

  console.log("💾 [Xeno-Malice] XenoticPoint UPDATED successfully!");
});
