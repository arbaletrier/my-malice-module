/******************************************************
 * HP → Required XP Sync Module (Minimal Ver.)
 * - PCの最大HPを「必要XP」に常時同期
 * - XP.value(経験値蓄積)は変更しない
 ******************************************************/

console.log("HP→XP Sync Module [Minimal] loaded");

// 1) ゲーム開始時：HP.max → XP.max 初期同期
Hooks.once("ready", async () => {
  console.log("⚙️ Initial HP→XP.max sync...");

  for (const actor of game.actors.contents) {
    if (actor.type !== "character") continue;
    const maxHP = actor.system?.attributes?.hp?.max ?? 0;

    await actor.update({ 
      "system.details.xp.max": maxHP 
    }, { noHook: true });
  }

  console.log("🟢 Initial HP→XP.max sync complete");
});


// 2) HP.max変更時：XP.max自動同期（PCのみ）
Hooks.on("preUpdateActor", (actor, update) => {
  if (actor.type !== "character") return;

  const newMaxHP = getProperty(update, "system.attributes.hp.max");
  if (newMaxHP === undefined) return;

  console.log(`🔁 Sync HP.max(${newMaxHP}) → XP.max`);
  setProperty(update, "system.details.xp.max", newMaxHP);
});
