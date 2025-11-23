console.log("Malice Damage Splitter起動");


/******************************************************
 * Malice Damage Splitter (Foundry Module)
 * Author: あなた
 * Foundry 起動時に常駐し、Malice ダメージだけ Aura Actor に送る
 ******************************************************/

Hooks.once("init", () => {
  console.log("Malice Module: INIT - registering hooks...");
});

/**
 * すべてのHookが利用可能になった後に登録
 */
Hooks.once("ready", () => {
  console.log("Malice Module: READY - now listening for Midi-QOL damage events");

  // ---- ここで Midi の DamageRollComplete を監視 ----
  Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
    console.log("→ MALICE HOOK TRIGGERED (module) for item:", workflow.item?.name);

    try {
      handleMaliceDamage(workflow);
    } catch (err) {
      console.error("Malice Module Error:", err);
    }
  });
});


/**
 *  Malice ダメージだけ Aura Actor に送る処理本体
 */
async function handleMaliceDamage(workflow) {

  // Actor が Malice 特徴を持っているか判定
  const actor = workflow.actor;
  if (!actor) return;

  const maliceFeature = actor.items.find(i => i.name === "Malice");
  if (!maliceFeature) return; // 特徴が無ければ処理しない

  // Defender（防御側）
  const defender = workflow?.defender;
  if (!defender) return;

  // ---- God Actor（auraId）を Defender が持っているか確認 ----
  const auraId = defender.getFlag("world", "auraId");
  if (!auraId) {
    console.warn("Malice Module: Defender has no auraId flag, skipping");
    return;
  }

  const auraActor = game.actors.get(auraId);
  if (!auraActor) {
    console.warn("Malice Module: auraId exists but Actor not found:", auraId);
    return;
  }

  // ---- ダメージ内訳 ----
  const maliceDamage = workflow.damageDetail
    .filter(d => d.type === "malice")
    .reduce((sum, d) => sum + d.damage, 0);

  const normalDamage = workflow.damageDetail
    .filter(d => d.type !== "malice")
    .reduce((sum, d) => sum + d.damage, 0);

  console.log(`Malice Module: Malice=${maliceDamage}, Normal=${normalDamage}`);

  // ---- Malice ダメージ分を Aura Actor に適用 ----
  if (maliceDamage > 0) {
    console.log(`Malice → Aura Actor (${auraActor.name}) : ${maliceDamage}`);

    await MidiQOL.applyTokenDamage(
      [{ type: "malice", damage: maliceDamage }],
      maliceDamage,
      new Set([auraActor.getActiveTokens()[0]]),
      null,
      null
    );
  }

  // ---- 通常ダメージを Defender に適用（そのまま） ----
  if (normalDamage > 0) {
    console.log(`Normal → Defender (${defender.name}) : ${normalDamage}`);
    // Midi-QOL に任せるのでここでは変更しない
  }
}
