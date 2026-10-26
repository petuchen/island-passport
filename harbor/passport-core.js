// Island Passport core, v1.2: read a passport, build departure links, read arrivals, carry traveller cards, check a passport.
// No dependencies, no network requests, nothing stored. Works in browsers and in Node (validation).
// Spec: SPEC.md in https://github.com/petuchen/island-passport

export const PASSPORT_VERSION = "1.2";
export const PASSPORT_VERSIONS = ["1.0", "1.1", "1.2"];
/* travel modes (`by`): how the traveller moves. land and space are 1.2; older readers treat them as air */
export const TRAVEL = ["air", "sea", "land", "space"];
/* Suggested vehicles (`vehicle`, 1.2; SPEC.md §9): any lowercase slug is allowed, these have a mode, a mark and labels.
   An island draws the vehicle if it can, otherwise its own vehicle for that mode. */
export const VEHICLES = {
  plane: ["air", "✈️", "飛機", "Plane"], jet: ["air", "🛩️", "噴射機", "Jet"], helicopter: ["air", "🚁", "直升機", "Helicopter"],
  seaplane: ["air", "🛩️", "水上飛機", "Seaplane"], balloon: ["air", "🎈", "熱氣球", "Balloon"], airship: ["air", "🎈", "飛艇", "Airship"],
  glider: ["air", "🪁", "滑翔機", "Glider"],
  boat: ["sea", "⛴️", "船", "Boat"], ferry: ["sea", "⛴️", "渡輪", "Ferry"], sailboat: ["sea", "⛵", "帆船", "Sailboat"], speedboat: ["sea", "🚤", "快艇", "Speedboat"],
  yacht: ["sea", "🛥️", "遊艇", "Yacht"], ship: ["sea", "🚢", "郵輪", "Ship"], canoe: ["sea", "🛶", "獨木舟", "Canoe"], submarine: ["sea", "🌊", "潛水艇", "Submarine"],
  train: ["land", "🚆", "火車", "Train"], tram: ["land", "🚋", "電車", "Tram"], bus: ["land", "🚌", "公車", "Bus"], car: ["land", "🚗", "汽車", "Car"],
  bicycle: ["land", "🚲", "腳踏車", "Bicycle"], scooter: ["land", "🛵", "機車", "Scooter"], cablecar: ["land", "🚡", "纜車", "Cable car"], walk: ["land", "🚶", "步行", "On foot"],
  rocket: ["space", "🚀", "火箭", "Rocket"], ufo: ["space", "🛸", "飛碟", "UFO"],
};
/* each mode's everyday vehicle, used when a route names none or a vehicle an island can't draw */
export const DEFAULT_VEHICLE = { air: "plane", sea: "boat", land: "train", space: "rocket" };
export const MODE_MARK = { air: "✈️", sea: "⛴️", land: "🚆", space: "🚀" };
const SLUG = /^[a-z0-9][a-z0-9-]{0,31}$/;
/* a travel mode from a mode or a vehicle name ("helicopter" → "air"), or null */
export const mode = (v) => (TRAVEL.includes(v) ? v : VEHICLES[v]?.[0] || null);
/* a route's vehicle slug: its own `vehicle` if it is a slug, else the default for its mode */
export const vehicleOf = (r) => (typeof r?.vehicle === "string" && SLUG.test(r.vehicle) ? r.vehicle : DEFAULT_VEHICLE[mode(r?.by) || mode(r?.vehicle) || "air"]);
/* a route's travel mode: `by`, else the mode of its vehicle, else air */
export const modeOf = (r) => mode(r?.by) || mode(r?.vehicle) || "air";
/* a mark (emoji) and label for a vehicle; unknown slugs use their mode's mark and the slug as written */
export const vehicleMark = (slug, by) => VEHICLES[slug]?.[1] || MODE_MARK[by || mode(slug) || "air"];
export const vehicleLabel = (slug, lang = "en") => { const v = VEHICLES[slug]; return v ? v[/^zh/i.test(lang) ? 2 : 3] : String(slug || ""); };
export const KINDS = ["island", "site"];

/* Suggested categories (SPEC.md §1). Any lowercase slug is allowed; these have labels everywhere. */
export const CATEGORIES = {
  life: ["生活", "Life"], art: ["藝術", "Art"], design: ["設計", "Design"], health: ["健康", "Health"], education: ["教育", "Education"],
  policy: ["政策", "Policy"], government: ["政府", "Government"], culture: ["文化", "Culture"], language: ["語言", "Language"], travel: ["旅行", "Travel"],
  food: ["美食", "Food"], tech: ["科技", "Tech"], ai: ["AI", "AI"], science: ["科學", "Science"], reading: ["閱讀", "Reading"],
  comics: ["漫畫", "Comics"], games: ["遊戲", "Games"], music: ["音樂", "Music"], community: ["社群", "Community"], business: ["商業", "Business"],
  portfolio: ["作品集", "Portfolio"], news: ["新聞", "News"], nature: ["自然", "Nature"], kids: ["親子", "Kids"],
};
/* the categories of a passport or route as an array of slugs (accepts a single string too) */
export const categoriesOf = (x) => (Array.isArray(x?.category) ? x.category : typeof x?.category === "string" ? [x.category] : []).filter((c) => typeof c === "string");
/* a category's label in a language: suggested ones are translated, others shown as written */
export const categoryLabel = (slug, lang = "en") => { const c = CATEGORIES[slug]; return c ? c[/^zh/i.test(lang) ? 0 : 1] : slug; };

/* LocalizedText is a plain string or { "zh-Hant": "…", "en": "…" }. Pick the best match for a language. */
export function text(v, lang = "en") {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v !== "object") return String(v);
  const want = String(lang || "en").toLowerCase(), keys = Object.keys(v);
  const exact = keys.find((k) => k.toLowerCase() === want);
  if (exact) return v[exact];
  const base = want.split("-")[0], near = keys.find((k) => k.toLowerCase().split("-")[0] === base);
  if (near) return v[near];
  return v.en ?? v[keys[0]] ?? "";
}

/* https (or http on localhost) URL without query or hash, or null */
export function canonical(u) {
  try {
    const x = new URL(u);
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(x.hostname);
    if (x.protocol !== "https:" && !(local && x.protocol === "http:")) return null;
    return x.origin + x.pathname;
  } catch (e) { return null; }
}

/* does `url` belong to the island at `base`? same origin, and the path sits under the base path */
export function sameIsland(url, base) {
  const a = canonical(url), b = canonical(base); if (!a || !b) return false;
  const A = new URL(a), B = new URL(b);
  if (A.origin !== B.origin) return false;
  const bp = B.pathname.endsWith("/") ? B.pathname : B.pathname.replace(/[^/]*$/, "");
  return A.pathname.startsWith(bp);
}

/* the link that takes a traveller from `from` (your island's url) to a route, by air or sea.
   opts.traveller: a traveller card; it is attached only if the route's snapshot says the destination accepts cards
   (route.travellers.accept), trimmed to the fields it lists, unless opts.force (a return trip to the island that sent it). */
export function departUrl(route, from, by = modeOf(route), opts = {}) {
  const tmpl = typeof route?.arrive === "string" && route.arrive.includes("{from}") ? route.arrive : null;
  const f = canonical(from) || from, b = mode(by) || "air";
  /* the vehicle rides along as `via` when the route names one (or the caller passes opts.vehicle) */
  const via = [opts.vehicle, route?.vehicle].find((v) => typeof v === "string" && SLUG.test(v)) || "";
  const accepts = route?.travellers?.accept === true, card = opts.traveller && (accepts || opts.force) ? trimCard(opts.traveller, accepts ? route.travellers.fields : null) : null;
  const t = card ? encodeTraveller(card) : "";
  if (tmpl) {
    let out = tmpl.replace(/\{from\}/g, encodeURIComponent(f)).replace(/\{by\}/g, encodeURIComponent(b)).replace(/\{via\}/g, encodeURIComponent(via));
    if (out.includes("{traveller}")) return out.replace(/\{traveller\}/g, t);
    return t ? withFragment(out, t) : out;
  }
  const u = new URL(route.url);
  if ((route.kind || "island") === "island") { u.searchParams.set("from", f); u.searchParams.set("by", b); if (via) u.searchParams.set("via", via); }
  return t && (route.kind || "island") === "island" ? withFragment(u.toString(), t) : u.toString();
}
const withFragment = (url, t) => { const u = new URL(url), h = u.hash.replace(/^#/, ""); u.hash = (h ? h + "&" : "") + "ip-t=" + t; return u.toString(); };

/* Read ?from=…&by=air|sea|land|space[&via=vehicle] on arrival. Returns null when nobody arrived, otherwise
   { from, host, by, vehicle, route } where route is one of YOUR routes when the traveller came from an island you list
   (only then is it safe to offer a "return trip" link), and vehicle is what they came in (draw it if you can, else your
   own vehicle for `by`). Removes the parameters from the address bar. */
export function readArrival(passport, loc = globalThis.location, { clean = true } = {}) {
  if (!loc) return null;
  const u = new URL(loc.href), raw = u.searchParams.get("from"); if (!raw) return null;
  const viaRaw = u.searchParams.get("via"), via = viaRaw && SLUG.test(viaRaw) ? viaRaw : null;
  const by = mode(u.searchParams.get("by")) || mode(via) || "air";
  if (clean && globalThis.history?.replaceState) {
    u.searchParams.delete("from"); u.searchParams.delete("by"); u.searchParams.delete("via");
    try { history.replaceState(history.state, "", u.pathname + (u.search || "") + u.hash); } catch (e) {}
  }
  const from = canonical(raw); if (!from) return null;
  const route = (passport?.routes || []).find((r) => sameIsland(from, r.url)) || null;
  const traveller = readTraveller(loc, { clean });
  const vehicle = via && (!VEHICLES[via] || VEHICLES[via][0] === by) ? via : DEFAULT_VEHICLE[by];
  return { from, host: new URL(from).host, by, vehicle, route, traveller };
}

/* the return link for an arrival: only for islands in your own routes, never for an arbitrary address.
   If the traveller brought a card, it goes home with them (the sending island evidently accepts cards). */
export function returnUrl(arrival, self, traveller = arrival?.traveller) {
  return arrival?.route ? departUrl(arrival.route, self.url, arrival.by, { traveller, force: !!arrival?.traveller, vehicle: arrival.route.vehicle ? undefined : arrival.vehicle }) : null;
}

/* ---------- traveller cards (SPEC.md §8): a character that travels with the visitor ---------- */
export const TRAVELLER_VERSION = "1.0";
export const CARD_FIELDS = ["name", "skin", "hair", "outfit", "accessories", "mobility"];
/* shared vocabularies; each style has a fallback chain ending in a style every island can draw */
export const HAIR_STYLES = { short: [], long: ["short"], bun: ["long", "short"], ponytail: ["long", "short"], curly: ["short"], braids: ["ponytail", "long", "short"],
  afro: ["curly", "short"], bob: ["short"], bald: ["short"], cap: ["short"], hat: ["cap", "short"], headscarf: ["long", "short"] };
export const ACCESSORIES = ["glasses", "sunglasses", "hat", "scarf", "bag", "mask", "earrings", "headphones"];
export const MOBILITY = ["wheelchair", "cane", "walker"];
const MAX_CARD = 700; /* characters, encoded */
const HEX = /^#[0-9a-fA-F]{6}$/;
const BAD_NAME = /[\u0000-\u001f\u007f<>​-‏‪-‮⁦-⁩]/g;

/* keep only known fields with valid values; returns a clean card or null */
export function cleanCard(c) {
  if (!c || typeof c !== "object" || Array.isArray(c)) return null;
  const out = { traveller: TRAVELLER_VERSION };
  if (typeof c.name === "string") { const n = [...c.name.replace(BAD_NAME, "").trim()].slice(0, 16).join(""); if (n) out.name = n; }
  if (HEX.test(c.skin || "")) out.skin = c.skin.toUpperCase();
  if (c.hair && typeof c.hair === "object") { const h = {}; if (HAIR_STYLES[c.hair.style]) h.style = c.hair.style; if (HEX.test(c.hair.color || "")) h.color = c.hair.color.toUpperCase(); if (Object.keys(h).length) out.hair = h; }
  if (c.outfit && typeof c.outfit === "object") { const o = {}; if (HEX.test(c.outfit.color || "")) o.color = c.outfit.color.toUpperCase(); if (HEX.test(c.outfit.accent || "")) o.accent = c.outfit.accent.toUpperCase(); if (Object.keys(o).length) out.outfit = o; }
  if (Array.isArray(c.accessories)) { const a = [...new Set(c.accessories.filter((x) => ACCESSORIES.includes(x)))].slice(0, 4); if (a.length) out.accessories = a; }
  if (MOBILITY.includes(c.mobility)) out.mobility = c.mobility;
  if (c.home && canonical(c.home)) out.home = canonical(c.home);
  return Object.keys(out).length > 1 ? out : null;
}
/* keep only the fields a destination asked for (null = all); "mobility" only travels when listed explicitly */
export function trimCard(card, fields) {
  const c = cleanCard(card); if (!c) return null;
  const keep = new Set(Array.isArray(fields) ? fields : CARD_FIELDS);
  for (const k of CARD_FIELDS) if (!keep.has(k)) delete c[k];
  return Object.keys(c).some((k) => CARD_FIELDS.includes(k)) ? c : null;
}
const b64e = (str) => { const bytes = new TextEncoder().encode(str); let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b))); return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const b64d = (s) => { const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/")); return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))); };
/* card -> URL-safe string (base64url of the JSON), or "" if it doesn't fit */
export function encodeTraveller(card) { const c = cleanCard(card); if (!c) return ""; const t = b64e(JSON.stringify(c)); return t.length <= MAX_CARD ? t : ""; }
/* URL-safe string -> clean card, or null */
export function decodeTraveller(t) { if (typeof t !== "string" || !t || t.length > MAX_CARD || !/^[A-Za-z0-9_-]+$/.test(t)) return null; try { return cleanCard(JSON.parse(b64d(t))); } catch (e) { return null; } }
/* read #ip-t=… from the address; removes it from the address bar (keeping the rest of the fragment) */
export function readTraveller(loc = globalThis.location, { clean = true } = {}) {
  if (!loc) return null;
  const u = new URL(loc.href), parts = u.hash.replace(/^#/, "").split("&").filter(Boolean);
  const hit = parts.find((p) => p.startsWith("ip-t=")); if (!hit) return null;
  if (clean && globalThis.history?.replaceState) {
    const rest = parts.filter((p) => p !== hit).join("&");
    try { history.replaceState(history.state, "", u.pathname + u.search + (rest ? "#" + rest : "")); } catch (e) {}
  }
  return decodeTraveller(hit.slice(5));
}
/* nearest colour in a palette (array of #RRGGBB), as an index; "redmean" distance, good enough for skin, hair and cloth */
export function nearestColor(hex, palette) {
  if (!HEX.test(hex || "") || !palette?.length) return -1;
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), [r, g, b] = rgb(hex);
  let best = 0, bd = Infinity;
  palette.forEach((p, i) => { const [R, G, B] = rgb(p), rm = (r + R) / 2, d = (2 + rm / 256) * (r - R) ** 2 + 4 * (g - G) ** 2 + (2 + (255 - rm) / 256) * (b - B) ** 2; if (d < bd) { bd = d; best = i; } });
  return best;
}
/* the closest hair style an island can draw: the style itself, else its fallbacks, else the island's first style */
export function nearestStyle(style, available) {
  if (!available?.length) return null;
  for (const s of [style, ...(HAIR_STYLES[style] || [])]) if (available.includes(s)) return s;
  return available.includes("short") ? "short" : available[0];
}

/* check a traveller card as written (before cleaning): { ok, errors, warnings } */
export function validateTraveller(c) {
  const errors = [], warnings = [];
  if (!c || typeof c !== "object" || Array.isArray(c)) return { ok: false, errors: ["a card must be a JSON object"], warnings };
  if (c.traveller !== TRAVELLER_VERSION) errors.push(`traveller: expected "${TRAVELLER_VERSION}"`);
  if (c.name != null && (typeof c.name !== "string" || [...c.name].length > 16)) errors.push("name: a string of up to 16 characters");
  else if (c.name && BAD_NAME.test(c.name)) { BAD_NAME.lastIndex = 0; warnings.push("name: has characters that will be removed"); }
  if (c.skin != null && !HEX.test(c.skin)) errors.push("skin: #RRGGBB");
  if (c.hair != null && (typeof c.hair !== "object" || (c.hair.style != null && !HAIR_STYLES[c.hair.style]) || (c.hair.color != null && !HEX.test(c.hair.color)))) errors.push(`hair: { style: one of ${Object.keys(HAIR_STYLES).join(", ")}, color: #RRGGBB }`);
  if (c.outfit != null && (typeof c.outfit !== "object" || (c.outfit.color != null && !HEX.test(c.outfit.color)) || (c.outfit.accent != null && !HEX.test(c.outfit.accent)))) errors.push("outfit: { color: #RRGGBB, accent: #RRGGBB }");
  if (c.accessories != null && !(Array.isArray(c.accessories) && c.accessories.length <= 4 && c.accessories.every((a) => ACCESSORIES.includes(a)))) errors.push(`accessories: up to 4 of ${ACCESSORIES.join(", ")}`);
  if (c.mobility != null && !MOBILITY.includes(c.mobility)) errors.push(`mobility: ${MOBILITY.join(", ")}`);
  if (c.home != null && !canonical(c.home)) errors.push("home: an https URL");
  Object.keys(c).filter((k) => !["traveller", ...CARD_FIELDS, "home"].includes(k)).forEach((k) => errors.push(`${k}: not allowed in a card (cards carry only the listed fields)`));
  if (errors.length === 0 && !encodeTraveller(c)) errors.push("the encoded card is longer than 700 characters");
  return { ok: errors.length === 0, errors, warnings };
}

/* light, dependency-free check of a passport against SPEC.md; returns { ok, errors, warnings } */
export function validatePassport(p) {
  const errors = [], warnings = [];
  const isText = (v) => typeof v === "string" ? v.trim().length > 0 : v && typeof v === "object" && !Array.isArray(v) && Object.values(v).length > 0 && Object.values(v).every((x) => typeof x === "string" && x.trim());
  const isUrl = (v) => typeof v === "string" && !!canonical(v);
  const len = (v) => (typeof v === "string" ? [v] : Object.values(v || {})).reduce((m, s) => Math.max(m, [...String(s)].length), 0);
  const hex = (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
  const cats = (v, at) => {
    if (v == null) return;
    const list = Array.isArray(v) ? v : [v];
    if (!list.length || list.length > 5 || !list.every((c) => typeof c === "string" && /^[a-z0-9][a-z0-9-]{0,23}$/.test(c))) return errors.push(`${at}: one to five lowercase slugs, e.g. ["health", "education"]`);
    list.filter((c) => !CATEGORIES[c]).forEach((c) => warnings.push(`${at}: "${c}" isn't a suggested category (fine, but others won't have a label for it)`));
  };
  if (!p || typeof p !== "object" || Array.isArray(p)) return { ok: false, errors: ["the passport must be a JSON object"], warnings };
  if (!PASSPORT_VERSIONS.includes(p.passport)) (typeof p.passport === "string" && /^1\.\d+$/.test(p.passport) ? warnings : errors).push(`passport: expected "${PASSPORT_VERSION}", got ${JSON.stringify(p.passport)}`);
  const need12 = (what) => { if (p.passport === "1.0" || p.passport === "1.1") warnings.push(`${what}: a 1.2 feature; set "passport": "1.2"`); };
  const tv = (v, at) => {
    if (v == null) return;
    if (typeof v !== "object" || typeof v.accept !== "boolean") return errors.push(`${at}: { accept: true|false, fields: [...] }`);
    if (v.fields != null && !(Array.isArray(v.fields) && v.fields.every((f) => CARD_FIELDS.includes(f)))) errors.push(`${at}.fields: a list from ${CARD_FIELDS.join(", ")}`);
    if (p.passport === "1.0") warnings.push(`${at}: traveller cards are a 1.1 feature; set "passport": "1.1"`);
  };
  tv(p.travellers, "travellers");
  if (!isText(p.name)) errors.push("name: required, a string or a language map");
  else if (len(p.name) > 60) warnings.push("name: keep it under 60 characters");
  if (!isUrl(p.url)) errors.push("url: required, an https URL");
  if (p.owner != null && !isText(p.owner)) errors.push("owner: a string or a language map");
  if (p.description != null && !isText(p.description)) errors.push("description: a string or a language map");
  else if (p.description && len(p.description) > 160) warnings.push("description: keep each language under 160 characters");
  if (p.image != null && !isUrl(p.image)) errors.push("image: an https URL");
  cats(p.category, "category");
  if (p.category == null) warnings.push("category: add one or more, e.g. [\"health\", \"education\"], so boards can group and label islands");
  if (p.color != null && !hex(p.color)) errors.push("color: a #RRGGBB hex colour");
  if (p.lang != null && !(Array.isArray(p.lang) && p.lang.every((x) => typeof x === "string"))) errors.push("lang: an array of language tags");
  if (p.arrive != null && !(typeof p.arrive === "string" && p.arrive.includes("{from}") && isUrl(p.arrive.replace(/\{(from|by)\}/g, "x")))) errors.push("arrive: an https URL template containing {from} (and optionally {by})");
  if (p.ports != null && (typeof p.ports !== "object" || Object.entries(p.ports).some(([k, v]) => k === "vehicles" ? !(Array.isArray(v) && v.every((x) => typeof x === "string" && SLUG.test(x))) : !TRAVEL.includes(k) || typeof v !== "boolean"))) errors.push("ports: { air, sea, land, space: boolean, vehicles: [\"helicopter\", \"ferry\", …] }");
  if (p.ports && ["land", "space"].some((k) => k in p.ports) || p.ports?.vehicles) need12("ports: land, space and vehicles");
  if (p.contact != null && !(typeof p.contact === "string" && (isUrl(p.contact) || /^mailto:/.test(p.contact)))) errors.push("contact: an https URL or a mailto: link");
  if (p.updated != null && !/^\d{4}-\d{2}-\d{2}$/.test(p.updated)) errors.push("updated: a date, YYYY-MM-DD");
  if (p.routes != null && !Array.isArray(p.routes)) errors.push("routes: an array");
  const seen = new Set();
  (Array.isArray(p.routes) ? p.routes : []).forEach((r, i) => {
    const at = `routes[${i}]`;
    if (!r || typeof r !== "object") return errors.push(`${at}: an object`);
    if (!isUrl(r.url)) errors.push(`${at}.url: required, an https URL`);
    else { const c = canonical(r.url); if (seen.has(c)) warnings.push(`${at}.url: listed twice`); seen.add(c); if (isUrl(p.url) && sameIsland(r.url, p.url)) errors.push(`${at}.url: a route can't point at your own island`); }
    if (r.vehicle != null && !(typeof r.vehicle === "string" && SLUG.test(r.vehicle))) errors.push(`${at}.vehicle: a lowercase slug, e.g. "helicopter", "jet", "sailboat", "train"`);
    else if (r.vehicle != null) { need12(`${at}.vehicle`); if (!VEHICLES[r.vehicle]) warnings.push(`${at}.vehicle: "${r.vehicle}" isn't a suggested vehicle; islands that can't draw it use their own ${modeOf(r)} vehicle`); }
    if (r.by == null && mode(r.vehicle)) warnings.push(`${at}.by: add "by": "${mode(r.vehicle)}" so 1.0 and 1.1 readers know the way you travel`);
    else if (!TRAVEL.includes(r.by)) (mode(r.by) ? warnings : errors).push(mode(r.by) ? `${at}.by: write "by": "${mode(r.by)}", "vehicle": "${r.by}" instead of "${r.by}"` : `${at}.by: "air", "sea", "land" or "space"`);
    else if (r.vehicle && VEHICLES[r.vehicle] && VEHICLES[r.vehicle][0] !== r.by) warnings.push(`${at}.vehicle: a ${r.vehicle} travels by ${VEHICLES[r.vehicle][0]}, not ${r.by}`);
    if (["land", "space"].includes(r.by)) need12(`${at}.by: "${r.by}"`);
    if (r.kind != null && !KINDS.includes(r.kind)) errors.push(`${at}.kind: "island" or "site"`);
    if (r.name != null && !isText(r.name)) errors.push(`${at}.name: a string or a language map`);
    if (r.name == null) warnings.push(`${at}.name: add a snapshot of the name, so your board works without fetching their passport`);
    if (r.owner != null && !isText(r.owner)) errors.push(`${at}.owner: a string or a language map`);
    if (r.description != null && !isText(r.description)) errors.push(`${at}.description: a string or a language map`);
    if (r.color != null && !hex(r.color)) errors.push(`${at}.color: a #RRGGBB hex colour`);
    if (r.image != null && !isUrl(r.image)) errors.push(`${at}.image: an https URL`);
    if (r.arrive != null && !(typeof r.arrive === "string" && r.arrive.includes("{from}"))) errors.push(`${at}.arrive: a URL template containing {from} (and optionally {by}, {traveller})`);
    if (r.since != null && !/^\d{4}-\d{2}-\d{2}$/.test(r.since)) errors.push(`${at}.since: a date, YYYY-MM-DD`);
    cats(r.category, `${at}.category`);
    tv(r.travellers, `${at}.travellers`);
    if (r.mutual != null && typeof r.mutual !== "boolean") errors.push(`${at}.mutual: true or false`);
  });
  const known = new Set(["$schema", "passport", "name", "url", "owner", "description", "category", "lang", "image", "color", "arrive", "ports", "travellers", "routes", "contact", "updated", "spec"]);
  Object.keys(p).filter((k) => !known.has(k) && !k.startsWith("x-")).forEach((k) => warnings.push(`${k}: unknown field (custom fields start with "x-")`));
  return { ok: errors.length === 0, errors, warnings };
}
