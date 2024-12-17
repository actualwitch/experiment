
let text = await Bun.file("node_modules/jsdom/lib/jsdom/living/xhr/XMLHttpRequest-impl.js").text();

text = text.replace(`require.resolve("./xhr-sync-worker.js")`, "null");

Bun.write("node_modules/jsdom/lib/jsdom/living/xhr/XMLHttpRequest-impl.js", text);