/******************************************************
 * Xeno-Malice: HP → Required XP Sync Module (Stable)
 ******************************************************/

console.log("[Xeno-Malice] HP→XP Sync Module loaded");


// 1) ゲーム開始時：最大HP→XP.max 初期同期
Hooks.once("ready", async () => {
  console.log("[Xeno-Malice] Initial HP→XP.max sync...");

  for (const actor of game.actors.contents) {
    if (actor.type !== "character") continue;

    const maxHP = actor.system?.attributes?.hp?.max ?? 0;

    await actor.update({
      "system.details.xp.max": maxHP
    }, { noHook: true });
  }

  console.log("[Xeno-Malice] Initial sync complete");
});


// 2) HP.max変動時：XP.max自動同期（PCのみ）
Hooks.on("updateActor", async (actor, update) => {
  if (actor.type !== "character") return;

  const newMaxHP = actor.system?.attributes?.hp?.max;
  if (newMaxHP == null) return;

  console.log(`[Xeno-Malice] Sync HP.max(${newMaxHP}) → XP.max`);

  await actor.update({
    "system.details.xp.max": newMaxHP
  }, { noHook: true });
});
