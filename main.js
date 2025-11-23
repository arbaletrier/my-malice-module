console.log("Malice Damage Splitter起動");


/******************************************************
 * Malice Damage Splitter (Foundry Module)
 * Author: あなた
 * Foundry 起動時に常駐し、Malice ダメージだけ Aura Actor に送る
 ******************************************************/

Hooks.once("init", () => {
  console.log("Malice module loaded!");
  Hooks.on("createChatMessage", (msg, opts, userId) => {
    console.log("Malice Hook Triggered:", msg);
  });
});
