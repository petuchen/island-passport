// node --test tests/   (Node 18+, no dependencies)
import test from "node:test";
import assert from "node:assert/strict";
import { text, canonical, sameIsland, departUrl, readArrival, returnUrl, validatePassport, categoriesOf, categoryLabel, mode,
  cleanCard, trimCard, encodeTraveller, decodeTraveller, readTraveller, nearestColor, nearestStyle, validateTraveller, vehicleOf, modeOf, vehicleMark, vehicleLabel, VEHICLES, DEFAULT_VEHICLE } from "../harbor/passport-core.js";
import { readFileSync } from "node:fs";

const me = JSON.parse(readFileSync(new URL("../examples/full.json", import.meta.url)));
const loc = (href) => ({ href });

test("text picks the visitor's language, then the base language, then English", () => {
  const v = { "zh-Hant": "燈塔島", en: "Lighthouse Island" };
  assert.equal(text(v, "zh-Hant"), "燈塔島"); assert.equal(text(v, "zh-TW"), "燈塔島"); assert.equal(text(v, "fr"), "Lighthouse Island"); assert.equal(text("x", "en"), "x");
});
test("canonical keeps https origin + path only", () => {
  assert.equal(canonical("https://a.example/x/?q=1#h"), "https://a.example/x/");
  assert.equal(canonical("http://a.example/"), null); assert.equal(canonical("javascript:alert(1)"), null);
  assert.equal(canonical("http://localhost:8765/public/"), "http://localhost:8765/public/");
});
test("sameIsland matches origin and path prefix", () => {
  assert.ok(sameIsland("https://harbour-town.example/island/", "https://harbour-town.example/island/"));
  assert.ok(!sameIsland("https://harbour-town.example/blog/", "https://harbour-town.example/island/"));
  assert.ok(!sameIsland("https://harbour-town.example.evil.example/island/", "https://harbour-town.example/island/"));
});
test("departUrl adds from and by for islands, nothing for plain sites, and honours arrive templates", () => {
  const comet = me.routes.find((r) => r.url.includes("comet-island.example"));
  assert.equal(departUrl(comet, me.url, "air"), "https://comet-island.example/island/?from=https%3A%2F%2Flighthouse-island.example%2F&by=air&via=helicopter");
  const tie = me.routes.find((r) => r.url.includes("tea-house"));
  assert.equal(departUrl(tie, me.url, "sea"), "https://tea-house.example/");
  assert.equal(departUrl({ url: "https://x.example/", arrive: "https://x.example/land?o={from}&m={by}" }, me.url, "boat"), "https://x.example/land?o=" + encodeURIComponent(me.url) + "&m=sea");
});
test("readArrival recognises listed islands and offers a return only for them", () => {
  const a = readArrival(me, loc("https://lighthouse-island.example/?from=https%3A%2F%2Fcomet-island.example%2Fisland%2F&by=air"), { clean: false });
  assert.equal(a.host, "comet-island.example"); assert.equal(a.by, "air"); assert.ok(a.route);
  assert.match(returnUrl(a, me), /^https:\/\/comet-island\.example\/island\/\?from=/);
  const s = readArrival(me, loc("https://lighthouse-island.example/?from=https%3A%2F%2Fevil.example%2F&by=sea"), { clean: false });
  assert.equal(s.route, null); assert.equal(returnUrl(s, me), null);
  assert.equal(readArrival(me, loc("https://lighthouse-island.example/?from=javascript%3Aalert(1)"), { clean: false }), null);
  assert.equal(readArrival(me, loc("https://lighthouse-island.example/"), { clean: false }), null);
  assert.equal(readArrival(me, loc("https://h/?from=https%3A%2F%2Fa.example%2F&by=plane"), { clean: false }).by, "air");
});
test("modes and categories", () => {
  assert.equal(mode("helicopter"), "air"); assert.equal(mode("ferry"), "sea"); assert.equal(mode("car"), null); assert.equal(mode("land"), null); assert.equal(mode("teleport"), null);
  assert.deepEqual(categoriesOf({ category: "art" }), ["art"]); assert.equal(categoryLabel("health", "zh-Hant"), "健康"); assert.equal(categoryLabel("knitting", "en"), "knitting");
});
test("the example passports validate; broken ones don't", () => {
  for (const f of ["full.json", "minimal.json", "vehicles.json"]) assert.ok(validatePassport(JSON.parse(readFileSync(new URL(`../examples/${f}`, import.meta.url)))).ok, f);
  const bad = validatePassport({ passport: "1.0", name: "x", url: "https://x.example/", category: ["Health!"], routes: [{ url: "https://x.example/sub", by: "teleport" }] });
  assert.ok(!bad.ok); assert.ok(bad.errors.some((e) => e.includes("category"))); assert.ok(bad.errors.some((e) => e.includes("own island"))); assert.ok(bad.errors.some((e) => e.includes(".by")));
});

const card = { traveller: "1.0", name: "Isla", skin: "#E3B48C", hair: { style: "braids", color: "#2B2320" }, outfit: { color: "#F3B9A5" }, accessories: ["glasses"], mobility: "wheelchair" };

test("cards are cleaned: unknown fields dropped, names stripped and capped, bad values ignored", () => {
  const c = cleanCard({ ...card, name: "\u202eIsla<script>abcdefghijklmnop", age: 40, skin: "red", accessories: ["glasses", "laser", "glasses"], mobility: "jetpack" });
  assert.equal(c.name, "Islascriptabcdef"); assert.equal([...c.name].length, 16);
  assert.equal(c.age, undefined); assert.equal(c.skin, undefined); assert.deepEqual(c.accessories, ["glasses"]); assert.equal(c.mobility, undefined);
  assert.equal(cleanCard({ traveller: "1.0" }), null); assert.equal(cleanCard("x"), null);
});
test("cards round-trip through the fragment, with UTF-8 names", () => {
  const t = encodeTraveller({ ...card, name: "小海龜" }); assert.match(t, /^[A-Za-z0-9_-]+$/);
  assert.equal(decodeTraveller(t).name, "小海龜");
  assert.equal(decodeTraveller("not base64!"), null); assert.equal(decodeTraveller("A".repeat(800)), null);
  const r = readTraveller({ href: "https://x.example/#medium&ip-t=" + t }, { clean: false }); assert.equal(r.hair.style, "braids");
  assert.equal(readTraveller({ href: "https://x.example/#medium" }, { clean: false }), null);
});
test("departures attach a card only to islands that accept one, trimmed to their fields", () => {
  const yes = { url: "https://p.example/", by: "air", travellers: { accept: true, fields: ["name", "skin", "hair"] } };
  const u = departUrl(yes, "https://me.example/", "air", { traveller: card });
  const got = readTraveller({ href: u }, { clean: false });
  assert.deepEqual(Object.keys(got).sort(), ["hair", "name", "skin", "traveller"]);
  assert.ok(!departUrl({ url: "https://q.example/", by: "air" }, "https://me.example/", "air", { traveller: card }).includes("#ip-t="));
  assert.ok(!departUrl({ url: "https://s.example/", by: "sea", kind: "site", travellers: { accept: true } }, "https://me.example/", "sea", { traveller: card }).includes("ip-t"));
  const tmpl = departUrl({ url: "https://t.example/", by: "air", arrive: "https://t.example/#/land?from={from}&by={by}&t={traveller}", travellers: { accept: true } }, "https://me.example/", "air", { traveller: card });
  assert.match(tmpl, /&t=[A-Za-z0-9_-]+$/);
});
test("mobility travels only when the destination lists it", () => {
  assert.equal(trimCard(card, ["name", "skin"]).mobility, undefined);
  assert.equal(trimCard(card, ["name", "mobility"]).mobility, "wheelchair");
});
test("a card that arrived goes home on the return trip", () => {
  const href = "https://lighthouse-island.example/?from=https%3A%2F%2Fcomet-island.example%2Fisland%2F&by=air#ip-t=" + encodeTraveller(card);
  const a = readArrival(me, { href }, { clean: false });
  assert.equal(a.traveller.name, "Isla");
  assert.match(returnUrl(a, me), /#ip-t=/);
  const s = readArrival(me, { href: href.replace("comet-island.example", "evil.example") }, { clean: false });
  assert.equal(returnUrl(s, me), null);
});
test("palette and style matching", () => {
  assert.equal(nearestColor("#E0B090", ["#F6D3B3", "#E3B48C", "#B98560", "#8A5A3C"]), 1);
  assert.equal(nearestColor("nope", ["#000000"]), -1);
  assert.equal(nearestStyle("braids", ["short", "long", "bun", "ponytail", "curly", "cap"]), "ponytail");
  assert.equal(nearestStyle("afro", ["short", "long"]), "short");
  assert.equal(nearestStyle("unknown", ["long"]), "long");
});
test("validateTraveller flags what cleaning would drop", () => {
  assert.ok(validateTraveller(JSON.parse(readFileSync(new URL("../examples/traveller.json", import.meta.url)))).ok);
  const bad = validateTraveller({ traveller: "1.0", age: 40, hair: { style: "mohawk" } });
  assert.ok(!bad.ok); assert.ok(bad.errors.some((e) => e.startsWith("age"))); assert.ok(bad.errors.some((e) => e.startsWith("hair")));
});

test("vehicles (1.2): any vehicle rides along as via, and arrivals get a vehicle to draw", () => {
  const jet = { url: "https://j.example/", by: "air", vehicle: "jet", name: "Jet Island" };
  assert.equal(departUrl(jet, me.url), "https://j.example/?from=" + encodeURIComponent(me.url) + "&by=air&via=jet");
  assert.equal(departUrl({ url: "https://t.example/", by: "sea", vehicle: "sailboat" }, me.url), "https://t.example/?from=" + encodeURIComponent(me.url) + "&by=sea&via=sailboat");
  const l = readArrival(me, loc("https://h/?from=https%3A%2F%2Fa.example%2F&by=land&via=train"), { clean: false });
  assert.equal(l.by, "air"); assert.equal(l.vehicle, "train"); /* 1.3: "land" is read as air; an island without a train model draws its plane */
  assert.equal(departUrl({ url: "https://x.example/", arrive: "https://x.example/?o={from}&m={by}&v={via}", vehicle: "balloon", by: "air" }, me.url), "https://x.example/?o=" + encodeURIComponent(me.url) + "&m=air&v=balloon");
  const a = readArrival(me, loc("https://h/?from=https%3A%2F%2Fa.example%2F&by=sea&via=sailboat"), { clean: false });
  assert.equal(a.by, "sea"); assert.equal(a.vehicle, "sailboat");
  const b = readArrival(me, loc("https://h/?from=https%3A%2F%2Fa.example%2F&via=rocket"), { clean: false });
  assert.equal(b.by, "space"); assert.equal(b.vehicle, "rocket");
  const c = readArrival(me, loc("https://h/?from=https%3A%2F%2Fa.example%2F&by=air&via=submarine"), { clean: false });
  assert.equal(c.by, "air"); assert.equal(c.vehicle, "plane"); /* a vehicle that contradicts the mode falls back to the mode's default */
  const d = readArrival(me, loc("https://h/?from=https%3A%2F%2Fa.example%2F&by=air&via=dragon"), { clean: false });
  assert.equal(d.vehicle, "dragon"); /* unknown slugs pass through; islands that can't draw them use their own */
  assert.equal(readArrival(me, loc("https://h/?from=https%3A%2F%2Fa.example%2F&by=air&via=%3Cb%3E"), { clean: false }).vehicle, "plane");
  assert.equal(vehicleOf({ by: "sea" }), "boat"); assert.equal(vehicleOf({ by: "air", vehicle: "helicopter" }), "helicopter"); assert.equal(modeOf({ vehicle: "ferry" }), "sea"); assert.equal(modeOf({ vehicle: "bus" }), "air");
  assert.equal(vehicleMark("rocket"), "🚀"); assert.equal(vehicleMark("dragon", "air"), "✈️"); assert.equal(vehicleLabel("ferry", "zh-Hant"), "渡輪");
  for (const [slug, [by]] of Object.entries(VEHICLES)) assert.ok(["air", "sea", "space"].includes(by), slug);
  for (const v of Object.values(DEFAULT_VEHICLE)) assert.ok(VEHICLES[v]);
});
test("validatePassport (1.2, 1.3): vehicles and space; land is gone", () => {
  const base = { passport: "1.3", name: "X", url: "https://x.example/", category: ["art"] };
  assert.ok(validatePassport({ ...base, routes: [{ url: "https://y.example/", by: "space", vehicle: "rocket", name: "Y" }], ports: { space: true, vehicles: ["rocket"] } }).ok);
  const land = validatePassport({ ...base, routes: [{ url: "https://y.example/", by: "land", vehicle: "train", name: "Y" }], ports: { land: true } });
  assert.ok(land.ok); assert.ok(land.warnings.some((m) => /"land" was removed in 1\.3/.test(m))); assert.ok(land.warnings.some((m) => /ports\.land/.test(m)));
  const w = validatePassport({ ...base, routes: [{ url: "https://y.example/", by: "sea", vehicle: "jet", name: "Y" }] });
  assert.ok(w.ok); assert.ok(w.warnings.some((m) => /jet travels by air/.test(m)));
  assert.ok(!validatePassport({ ...base, routes: [{ url: "https://y.example/", by: "air", vehicle: "Big Jet", name: "Y" }] }).ok);
  const old = validatePassport({ ...base, passport: "1.1", routes: [{ url: "https://y.example/", by: "space", vehicle: "rocket", name: "Y" }] });
  assert.ok(old.ok); assert.ok(old.warnings.some((m) => /1\.2 feature/.test(m)));
  const legacy = validatePassport({ ...base, routes: [{ url: "https://y.example/", by: "helicopter", name: "Y" }] });
  assert.ok(legacy.ok); assert.ok(legacy.warnings.some((m) => /"vehicle": "helicopter"/.test(m)));
});
