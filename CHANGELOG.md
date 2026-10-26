# Changelog

## 1.2.1 (2026-10-26)

- Examples, tests and docs use fictional islands (`lighthouse-island.example`, `comet-island.example`) only;
  the full example is now `examples/full.json`. The directory starts empty, ready for your island.

## 1.2.0 (2026-10-26)

- Any vehicle (SPEC.md §9): routes may name a `vehicle` (`helicopter`, `jet`, `balloon`, `ferry`, `sailboat`, `train`,
  `bus`, `rocket`, `ufo`… or any slug). Departures add `via=<vehicle>`; arrivals draw it if they can, otherwise their
  own vehicle for the mode. `ports.vehicles` lists what an island can draw.
- Two new modes: `land` (stations, bus stops) and `space` (launch pads). Older readers treat them as air.
- `passport-core.js`: `VEHICLES`, `DEFAULT_VEHICLE`, `vehicleOf`, `modeOf`, `vehicleMark`, `vehicleLabel`; arrivals return
  `vehicle`; the validator checks vehicles and modes. Templates may use `{via}`.
- `three-harbor.js`: jet, balloon, airship, sailboat, train, car, bus, rocket and UFO models; `makeVehicle`,
  `departPath`, `arrivePath`, `VEHICLE_STYLE`.
- Drop-in harbour: board marks and labels per vehicle, launch animation for space, welcome by vehicle.
- New example `examples/vehicles.json`; README rewritten with diagrams.

## 1.1.0 (2026-10-26)
- Traveller cards (SPEC.md §8): a visitor's character travels in the departure link's fragment (`#ip-t=`) to islands
  whose passport says `travellers.accept`; portable fields (hex colours, shared hair styles with fallbacks,
  accessories, opt-in mobility), cleaned on arrival, used only after the visitor agrees, carried home on return trips.
- `passport-core.js`: `cleanCard`, `trimCard`, `encodeTraveller`, `decodeTraveller`, `readTraveller`, `nearestColor`,
  `nearestStyle`, `validateTraveller`; `departUrl(..., { traveller })`, `readArrival` returns `traveller`,
  `returnUrl` carries it back. Passport `"1.1"` and `travellers` (also on routes).
- `schema/traveller-card.schema.json`, `examples/traveller.json`; the validator checks cards too; 14 tests.
- Drop-in harbour greets travellers by name and carries their card on and home.

## 1.0.0 (2026-10-26)
- Island Passport 1.0: `/island.json` with name, url, owner, description, category, lang, image, color, arrive,
  ports, routes, contact, updated, spec; routes travel `by: "air" | "sea"` (readers accept plane/helicopter/boat/ferry).
- Departures with `?from=…&by=…`, arrivals that link back only to listed islands, privacy rules.
- `harbor/passport-core.js`, drop-in `harbor/harbor.js`, three.js `harbor/three-harbor.js` (helicopter, plane, ferry),
  validator, JSON Schema, tests, demo, agent skill (`SKILL.md`), directory and badge.
