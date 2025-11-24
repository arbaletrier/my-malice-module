/******************************************************
 * Malice Damage Splitter Module
 * 神のオーラに Malice ダメージのみを転送するダークソウル風拡張
 * 対象が auraId を持っている場合のみ発動
 ******************************************************/
console.log("Malice Damage Splitter Module起動");
// Malice Splitter – damageApplied 対応版
Hooks.on("midi-qol.preDamageApplication", (workflow) => {
  console.log("preDamageApplication fired!", workflow);
});