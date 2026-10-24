// Print a guide's data as JSON: node --experimental-strip-types scripts/cruising/dump.mjs lib/cruising/guides/<id>.ts
const [, , file] = process.argv;
const mod = await import(new URL(`../../${file}`, import.meta.url).href);
const guide = Object.values(mod).find((v) => v && typeof v === "object" && "legs" in v);
console.log(JSON.stringify(guide));
