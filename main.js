/******************************************************
 * Malice Damage Splitter Module
 * 神のオーラに Malice ダメージのみを転送するダークソウル風拡張
 * 対象が auraId を持っている場合のみ発動
 ******************************************************/
console.log("Malice Damage Splitter Module起動");
Hooks.once("ready", () => {
  console.log("Malice splitter hook registered");

  Hooks.on("midi-qol.DamageApplied", async (workflow) => {
    const targetToken = workflow.hitTargets.first();
    if (!targetToken) return;
    const defender = targetToken.actor;

    const auraId = defender.getFlag("world", "auraId");
    if (!auraId) return;
    const auraActor = game.actors.get(auraId);
    if (!auraActor) return;

    let malice = 0;
    let normal = 0;

    // 元ダメージから Malice と通常を分解
    for (const d of workflow.damageDetail) {
      if (d.flavor === "Malice" || d.flavor === "怨恨") malice += d.damage;
      else normal += d.damage;
    }

    // 👇 Midi-QOL に渡すダメージを上書き（本体には通常攻撃だけにする）
    workflow.damageDetail = workflow.damageDetail.filter(d => !(d.flavor === "Malice" || d.flavor === "怨恨"));
    workflow.damageTotal = normal;

    // 👇 Aura へ Malice 分のダメージを別途投げる（Midi-QOL 正規ルート）
    if (malice > 0) {
      await MidiQOL.applyTokenDamage(
        [{ damage: malice, type: "force" }],       // ダメージ種別は自由（見た目用）
        malice,
        new Set([auraActor.getActiveTokens()[0]]), // ダメージ対象
        workflow.item,
        new Set()
      );
    }

    console.log(`MALICE→ ${malice}  NORMAL→ ${normal}`);
  });
});
