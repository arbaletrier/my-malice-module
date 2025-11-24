/******************************************************
 * Malice Damage Splitter Module
 * 神のオーラに Malice ダメージのみを転送するダークソウル風拡張
 * 対象が auraId を持っている場合のみ発動
 ******************************************************/
console.log("Malice Damage Splitter Module起動");
// Malice Splitter – damageApplied 対応版
const hooks = [
  "midi-qol.damageApplied",
  "midi-qol.DamageApplied",
  "midi-qol.RollComplete",
  "midi-qol.rollComplete",
  "midi-qol.DamageRollComplete",
  "midi-qol.damageRollComplete",
  "midi-qol.workflowUpdate",
  "midi-qol.preDamageRollComplete",
  "midi-qol.preDamageApplication",
  "midi-qol.damageListApplied",
  "midi-qol.createDamageList",
  "midi-qol.postDamageRoll",
  "midi-qol.onUseItem",
  "midi-qol.AttackRollComplete",
  "midi-qol.DamageRollComplete",
  "midi-qol.postApplyDamage",
];

for (const h of hooks) {
  Hooks.on(h, (...args) => {
    console.log(`💥 HOOK FIRED: ${h}`, ...args);
  });
}

console.log("🔍 Midi-QOL hook diagnostic ready — perform an attack to detect active hook");
