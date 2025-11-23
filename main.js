Hooks.once("init", () => {
  console.log("Malice module loaded!");
  Hooks.on("createChatMessage", (msg, opts, userId) => {
    console.log("Malice Hook Triggered:", msg);
  });
});
