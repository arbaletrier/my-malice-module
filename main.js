/******************************************************
 * Xeno-Malice: XP Bar Visual Override
 * - Show Corruption as XP.value / HP.max
 * - Red corruption gauge on dark background
 ******************************************************/

Hooks.on("renderActorSheet", (sheet, html, data) => {
  const actor = sheet.actor;
  if (!actor || actor.type !== "character") return;

  const hpMax = actor.system.attributes.hp.max ?? 1;
  const xpVal = actor.system.details.xp.value ?? 0;

  const pct = Math.clamped((xpVal / hpMax) * 100, 0, 100).toFixed(1);

  // XPゲージのDOMを操作
  const xpBar = html.find(".xp-bar");
  const xpLabel = html.find(".xp-label");

  // Bar visual styling
  xpBar.css({
    "background-color": "black",
    "border": "1px solid #700000",
    "height": "10px"
  });

  xpBar.find(".bar").css({
    "background": "linear-gradient(90deg, darkred, red)",
    "width": `${pct}%`
  });

  // Label override
  xpLabel.text(`Corruption: ${xpVal} / ${hpMax} (${pct}%)`);
});
