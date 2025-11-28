/******************************************************
 * HP → Required XP Sync Module (Stable Ver.)
 * - PCの最大HPをXP.maxに常時同期
 * - XP.valueは変更しない
 ******************************************************/

console.log("HP→XP Sync Module [Stable] loaded");


// 1) ゲーム開始時：最大HP→XP.max 初期同期
Hooks.once("ready", async () => {
  console.log("⚙️ Initial HP→XP.max sync...");

  for (const actor of game.actors.contents) {
    if (actor.type !== "character") continue;

    const maxHP = actor.system?.attributes?.hp?.max ?? 0;

    await actor.update({
      "system.details.xp.max": maxHP
    }, { noHook: true });
  }

  console.log("🟢 Initial sync complete");
});


// 2) HP.maxの変動検知→XP.maxに同期
Hooks.on("updateActor", (actor, update) => {
  if (actor.type !== "character") return;

  // updateにhp.maxがないケースが多いため、actorから直接取得
  const newMaxHP = actor.system?.attributes?.hp?.max;
  if (newMaxHP == null) return;

  console.log(`🔁 Sync HP.max(${newMaxHP}) → XP.max`);

  foundry.utils.setProperty(update, "system.details.xp.max", newMaxHP);
});
