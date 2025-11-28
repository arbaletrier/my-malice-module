/******************************************************
 * Xeno-Malice: Automatic HP→XP Sync Path Detection
 ******************************************************/

console.log("[Xeno-Malice] Automatic HP→XP Sync Module loaded");

/* XP候補パスリスト */
const XP_PATHS = [
  "system.details.xp.max",
  "system.attributes.xp.max",
  "system.details.xp.value",
  "system.attributes.xp.value",
  "system.details.xpNeeded",
  "system.details.xp.data.max",
  "prototypeToken.actorData.system.details.xp.max"
];

/* 見つかった正解ルートを保存する場所 */
let VALID_XP_PATH = null;


/* --- パス探索処理 --- */
async function detectXPPath(actor) {
  const maxHP = actor.system?.attributes?.hp?.max ?? 0;

  for (const path of XP_PATHS) {
    try {
      await actor.update({ [path]: maxHP }, { noHook: true });

      const got = getProperty(actor, path);
      if (got === maxHP) {
        console.log(`[Xeno-Malice] ✓ Detected valid XP path: ${path}`);
        VALID_XP_PATH = path;
        return true;
      }
    } catch (e) {
      continue;
    }
  }

  console.warn("[Xeno-Malice] ⚠ 正しいXPパスが特定できませんでした");
  return false;
}


/* --- 初期同期 --- */
Hooks.once("ready", async () => {
  console.log("[Xeno-Malice] Starting HP→XP auto path detection...");

  const actor = game.actors.contents.find(a => a.type === "character");
  if (!actor) return console.error("[Xeno-Malice] No PC actors found.");

  await detectXPPath(actor);

  // 成功した場合、全キャラに適用
  if (VALID_XP_PATH) {
    for (const pc of game.actors.contents) {
      if (pc.type !== "character") continue;
      const maxHP = pc.system.attributes.hp.max;
      await pc.update({ [VALID_XP_PATH]: maxHP }, { noHook: true });
    }
  }

  console.log("[Xeno-Malice] Initial XP sync complete.");
});


/* --- HP変更時 --- */
Hooks.on("updateActor", async (actor) => {
  if (actor.type !== "character") return;
  const newMaxHP = actor.system.attributes.hp?.max;
  if (!newMaxHP) return;

  // まだ検出成功してないなら再挑戦
  if (!VALID_XP_PATH) {
    console.log("[Xeno-Malice] Re-trying XP Path Detection...");
    await detectXPPath(actor);
    if (!VALID_XP_PATH) return;
  }

  console.log(`[Xeno-Malice] HP.max(${newMaxHP})→XP(${VALID_XP_PATH})`);
  await actor.update({ [VALID_XP_PATH]: newMaxHP }, { noHook: true });
});
