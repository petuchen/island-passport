---
name: island-passport
description: Add an Island Passport to a website, so illustrated "island" sites link to each other by air, sea, land or space with any vehicle (helicopter, jet, ferry, sailboat, train, rocket…): publish /island.json, add a departures board (drop-in script or a three.js helipad/airport and harbour), welcome travellers who arrive with ?from=…&by=…&via=…, and carry visitors' characters between islands as traveller cards. Use when someone wants their island or site to connect with other islands, add an airport/harbour/helipad/station/launch pad, join an island webring, let avatars travel between sites, or implement or validate island.json.
---

# Island Passport

Island Passport links island-style websites: each site publishes a small `/island.json` (its passport) listing the
islands it travels to; a departures board sends visitors off with `?from=<your url>&by=air|sea|land|space&via=<vehicle>`; the receiving island
welcomes them and offers a trip home if it lists them too. The full rules are in `SPEC.md` next to this file. Read
it before writing code; this page is the working procedure.

Files in this skill:

- `SPEC.md`: the format (normative). `schema/island-passport.schema.json`: JSON Schema.
- `harbor/passport-core.js`: `text`, `departUrl`, `readArrival`, `returnUrl`, `validatePassport`, `categoriesOf`,
  `categoryLabel`, and for traveller cards `cleanCard`, `trimCard`, `encodeTraveller`, `decodeTraveller`, `readTraveller`,
  `nearestColor`, `nearestStyle`, `validateTraveller`. No dependencies. Use it rather than re-implementing the rules.
- `schema/traveller-card.schema.json`, `examples/traveller.json`: the traveller card (SPEC.md §8).
- `harbor/harbor.js`: drop-in board for any site (one `<script type="module">`).
- `harbor/three-harbor.js`: three.js models and paths: `makeHelicopter`, `makePlane`, `makeBoat`, `liftoffPath`,
  `touchdownPath`, `takeoffPath`, `landingPath`, `sailPath`, `dockPath`, `bearing`, `Traveller`.
- `tools/validate.mjs`: `node tools/validate.mjs path/to/island.json`.
- `examples/`: `minimal.json`, `full.json` (a full one), `demo/` (the drop-in on a plain page).

## 1. Look at the site first

Find out, from the code rather than by asking: where the public root is (what gets served at `/`), how it is built
and hosted (static files, a framework, Wasmer, Netlify, GitHub Pages…), whether it draws a 3D scene with three.js,
the languages it uses, and its accent colour. If it is a three.js island, find the render loop, how the camera and
controls are set up, and whether there is already a pier, dock, runway or helipad on the map you can reuse.

## 2. Settle the passport with the person

Ask only for what the code can't tell you, in one short message:

- the island's name (in each language the site uses), the owner's name as they want it shown, one line about it
- its categories, one to five, main one first (suggested: life, art, design, health, education, policy, government,
  culture, language, travel, food, tech, ai, science, reading, comics, games, music, community, business, portfolio,
  news, nature, kids)
- which places to link to, and for each whether it's an island (speaks Island Passport) or a plain site, the mode
  (air, sea, land or space; common: air to friends' islands, sea to their own other sites) and, if they like, the
  vehicle (`helicopter`, `jet`, `balloon`, `ferry`, `sailboat`, `train`, `bus`, `rocket`…; see SPEC.md §9). With a
  vehicle, use `"passport": "1.2"` and keep `by` too.
- optionally a contact link for people who want a route

For each destination, copy a snapshot into the route: name, owner, one line, categories, colour. If a destination
publishes `/island.json`, copy from it (ask before fetching anything if the person cares about that); otherwise write
the snapshot from what the person tells you. Never invent facts about someone else's site.

## 3. Write and check `/island.json`

Put it at the public root so it is served at `https://their-site/island.json` (or add
`<link rel="island-passport" href="…">` to every page). Start from `examples/minimal.json`. Then run
`node tools/validate.mjs <file>` and fix every error; deal with the warnings unless there's a reason not to. If the
host allows headers, serve it with `Access-Control-Allow-Origin: *`.

## 4. Add the harbour

Pick one:

**A. Any website (no 3D):** copy `harbor/harbor.js` and `harbor/passport-core.js` into the site (keep them together),
then add before `</body>`:

```html
<script type="module" src="/harbor/harbor.js" data-passport="/island.json"></script>
```

Options: `data-lang`, `data-position="bottom-left"`, `data-label`, `data-button="none"` (then call
`IslandHarbor.open()` from your own button). It shows the board, a short take-off animation, and the arrival welcome.

**B. A three.js island:** copy `harbor/passport-core.js` and `harbor/three-harbor.js`, and build the port in the
scene, in the island's own style:

1. Choose the spots: a pad or runway for air, a dock for sea, a station for land, a launch pad for space. Reuse what's
   on the map; otherwise add a small islet.
2. Make the vehicles with your palette (`makeVehicle(THREE, slug, colors, by)` builds any suggested vehicle, or the
   mode's everyday one; or call `makeHelicopter`, `makeJet`, `makeBoat`, `makeSailboat`, `makeTrain`, `makeRocket`…)
   and park them there; call their `tick(dt, …)` from the render loop so rotors spin and boats bob (only while the
   scene is animating).
3. Add a clickable label or pin at each port that opens a **departures board** drawn from your passport's `routes`:
   mark (`vehicleMark(vehicleOf(route), modeOf(route))`), name, owner, categories, one line, and a "Depart" link whose
   `href` is `departUrl(route, me.url)`.
4. On a plain click (no modifier keys), `preventDefault()` and animate: `departPath(THREE, vehicle.style, spot,
   heading)` with a `Traveller` that follows the camera, about 3–4 seconds; fade to a "Flying to …" screen that also shows the
   link; then `location.assign(url)`. Skip the animation when the visitor prefers reduced motion.
5. On load, if the address has `from`, call `readArrival(passport)`; bring the traveller in with `touchdownPath`/
   `landingPath` or `dockPath`, then show a welcome: the route's name if `a.route`, else just `a.host`; a return link
   only from `returnUrl(a, passport)` (it is null for islands you don't list).
6. Handle the Back button: on `pageshow` with `event.persisted`, clear timers, park the vehicles and restore controls.

Keep it small: the board can reuse the site's existing card or dialog component.

## 4b. Traveller cards (if the site has characters)

If the site lets visitors make a character, let it travel (SPEC.md §8):

1. **Describe the character portably.** Write a function from the site's own character data to a card: hex colours
   from its palette for `skin`, `hair.color`, `outfit.color`; the nearest shared `hair.style`; `accessories`; `name`.
   Never put age, health or anything the visitor didn't choose in it. `mobility` (wheelchair, cane, walker) only
   behind an explicit opt-in ("also bring my wheelchair").
2. **Say what you accept**: add `"passport": "1.1"` and `"travellers": { "accept": true, "fields": [...] }` with the
   fields the site can draw.
3. **Send it**: `departUrl(route, me.url, route.by, { traveller: card })` attaches it only when the route's snapshot
   accepts cards, trimmed to their fields. Give the visitor a switch to travel without it.
4. **Receive it**: `readArrival` returns `a.traveller` (already cleaned). Ask before using it; translate it with
   `nearestColor(hex, palette)` and `nearestStyle(style, available)`; save only after the visitor agrees; show the
   name as text. `returnUrl(a, passport, currentCard)` takes the character home.
5. Keep the original card next to the translated character, and send the original values back for anything the
   visitor didn't change, so a character goes home as itself rather than in your palette.

## 5. Rules that must hold (from SPEC.md)

- Loading the page contacts no other island. The board comes from your own passport's snapshots.
- Departures are real links (`<a href>`), keyboard-usable, and work in a new tab.
- `from` is checked (https, or http on localhost) and only its origin and path are used; `by` is `air`, `sea`, `land`
  or `space`; `via` is a slug, drawn if you can, else your own vehicle for `by`.
- A return link appears only for islands in your own `routes`. Nothing about arrivals is stored or logged.
- `from`, `by` and `via` are removed from the address bar after reading them.
- Animations are short and skipped with reduced motion.
- Traveller cards travel only in the fragment (`#ip-t=`), only to islands that accept them, are cleaned on arrival,
  used only after the visitor agrees, and never carry age, health details or unrequested mobility aids.

## 6. Test before you say it's done

- `node tools/validate.mjs public/island.json` passes.
- Open the board; every route's link has the right `from` and `by` (plain sites get no parameters).
- Click a departure: it animates and lands on the destination; with reduced motion it goes straight there.
- Open `/?from=<an island you list>&by=air`: welcome with its name and a working return link.
- Open `/?from=<an island you list>&by=land&via=train`: a train (or your land vehicle) brings them in.
- Open `/?from=https://example.com/&by=sea`: welcome by host name, no link. `/?from=javascript:alert(1)`: nothing.
- After an arrival the address bar no longer has `from`/`by`.
- Watch the network panel on load: no requests to other islands.
- With traveller cards: arrive with `#ip-t=<encodeTraveller(examples/traveller.json)>`; you are asked first, the
  character looks right, the fragment is gone afterwards, and the return link carries the character back. A route
  without `travellers.accept` gets no card. A broken or oversized `ip-t` is ignored.

## 7. Afterwards

Tell the person how to get routes back to them: send their `island.json` address to the islands they link to and
ask to be added; once a friend lists them, set `"mutual": true` on that route. Mention the privacy note to add to
their about page (what is passed between islands: only `from`, `by` and `via`, plus a character card if the visitor brings one;
nothing stored). If they publish the site,
suggest adding it to the directory in this repo (`directory/islands.json`) with a pull request.
