#!/usr/bin/env node
// Check Island Passport files and traveller cards: node tools/validate.mjs public/island.json [card.json …]
// Exit code 1 if any file has errors. No dependencies.
import { readFileSync } from "node:fs";
import { validatePassport, validateTraveller } from "../harbor/passport-core.js";

const files = process.argv.slice(2);
if (!files.length) { console.error("usage: node tools/validate.mjs island.json [more.json …]"); process.exit(2); }
let bad = 0;
for (const f of files) {
  let data;
  try { data = JSON.parse(readFileSync(f, "utf8")); }
  catch (e) { console.log(`✗ ${f}: not valid JSON (${e.message})`); bad++; continue; }
  const card = data && typeof data === "object" && "traveller" in data;
  const { ok, errors, warnings } = card ? validateTraveller(data) : validatePassport(data);
  console.log(`${ok ? "✓" : "✗"} ${f}: ${card ? "traveller card" : "passport"}, ${errors.length} error(s), ${warnings.length} warning(s)${card ? "" : `, ${(data.routes || []).length} route(s)`}`);
  errors.forEach((m) => console.log(`  error   ${m}`));
  warnings.forEach((m) => console.log(`  warning ${m}`));
  if (!ok) bad++;
}
process.exit(bad ? 1 : 0);
