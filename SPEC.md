# Island Passport 1.2

Island Passport is a small open format that lets illustrated "island" websites link to each other with an
airport, a helipad, a harbour, a station or a launch pad: a visitor picks a destination, a helicopter lifts off, a boat
leaves the dock, a train pulls out or a rocket launches, and they arrive on the other island, which welcomes them and
offers a trip home.

It has three parts, plus two optional ones:

1. **The passport**: a JSON file at `/island.json` that describes your island and the routes you travel, by air, sea,
   land or space.
2. **Departures**: a link to the other island that says where the traveller came from (`?from=…&by=…`, and from 1.2
   optionally `&via=…`, the vehicle).
3. **Arrivals**: the other island reads those two parameters, welcomes the traveller, and offers a return
   link only if it lists your island too.
4. **Traveller cards** (1.1): the visitor's character can travel along, as a small JSON card in the link's
   fragment, to islands that say they accept one (§8).
5. **Vehicles** (1.2): a route may name any vehicle (a jet, a sailboat, a train, a rocket…); islands draw it if they
   can, or their own vehicle for the same mode (§9).

The key words MUST, SHOULD and MAY are used as in RFC 2119.

## 1. The passport file

An island MUST publish its passport as JSON at `/island.json` on its own origin, or point to it from every page with

```html
<link rel="island-passport" href="/path/to/island.json">
```

It SHOULD be served as `application/json` with `Access-Control-Allow-Origin: *`, so other islands and tools can read
it. The file is public; put nothing private in it.

### Fields

| Field | Required | Type | Meaning |
|---|---|---|---|
| `passport` | yes | `"1.2"` | Format version (`"1.0"` and `"1.1"` are still valid if you don't use newer fields). |
| `name` | yes | Text | The island's name, under 60 characters. |
| `url` | yes | URL | The island's canonical address (its home page). |
| `owner` | no | Text | Who keeps the island (a person, a group). |
| `description` | no | Text | One line about the island, under 160 characters per language. |
| `category` | no* | string[] | What kind of island it is: one to five lowercase slugs, most important first (see *Categories*). *SHOULD be present.* |
| `lang` | no | string[] | Languages of the site, as BCP 47 tags (`"zh-Hant"`, `"en"`). |
| `image` | no | URL | A preview picture, ideally 1200 × 630 (often your `og:image`). |
| `color` | no | `#RRGGBB` | An accent colour others may use for your postcard and flag. |
| `arrive` | no | URL template | How travellers land on your island; see §3. Default: `url` plus `?from={from}&by={by}` (and `&via={via}` when there is a vehicle). It may also contain `{via}` (§9) and `{traveller}` (§8). |
| `ports` | no | object | `{ "air": true, "sea": true, "land": true, "space": true, "vehicles": ["helicopter", "ferry"] }`: which ways your map can receive travellers (an airport or helipad, a harbour, a station, a launch pad) and, from 1.2, which vehicles you can show arriving. Decorative. |
| `travellers` | no | object | `{ "accept": true, "fields": ["name", "skin", "hair", "outfit", "accessories", "mobility"] }`: you welcome traveller cards and can show these fields (§8). |
| `routes` | no | Route[] | The places you travel to; see below. |
| `contact` | no | URL or `mailto:` | Where to ask you to open a route. |
| `updated` | no | `YYYY-MM-DD` | When you last changed this file. |
| `spec` | no | URL | A link to this specification. |

**Text** is a plain string, or an object that maps language tags to strings:
`{ "zh-Hant": "燈塔島", "en": "Lighthouse Island" }`. Readers pick the visitor's language, then the base language
(`zh` for `zh-Hant`), then `en`, then the first entry.

**URL** values MUST be absolute `https:` URLs (`http:` is allowed only for `localhost` while testing).

Custom fields MUST start with `x-` (for example `"x-theme": "forest"`). Readers MUST ignore fields they don't know.

### Categories

`category` tells other islands what kind of place yours is, so a departures board can label, group or filter
destinations. It is an array of one to five lowercase slugs (`a-z`, `0-9`, `-`), the main one first; a single string
is accepted too. These are the suggested slugs, which boards SHOULD label in their own language:

| Slug | 中文 | Slug | 中文 | Slug | 中文 |
|---|---|---|---|---|---|
| `life` | 生活 | `art` | 藝術 | `design` | 設計 |
| `health` | 健康 | `education` | 教育 | `policy` | 政策 |
| `government` | 政府 | `culture` | 文化 | `language` | 語言 |
| `travel` | 旅行 | `food` | 美食 | `tech` | 科技 |
| `ai` | AI | `science` | 科學 | `reading` | 閱讀 |
| `comics` | 漫畫 | `games` | 遊戲 | `music` | 音樂 |
| `community` | 社群 | `business` | 商業 | `portfolio` | 作品集 |
| `news` | 新聞 | `nature` | 自然 | `kids` | 親子 |

Other slugs are allowed (show them as written); propose common ones for the next version of this list.

### Routes

Each route is a destination on your departures board.

| Field | Required | Type | Meaning |
|---|---|---|---|
| `url` | yes | URL | The destination's address. MUST NOT be your own island. |
| `by` | yes* | `"air"`, `"sea"`, `"land"` or `"space"` | The travel **mode**. `land` and `space` are 1.2. *Required unless `vehicle` is a suggested vehicle, but SHOULD always be present so 1.0 and 1.1 readers understand the route.* Readers also accept a vehicle name here (`helicopter` = air, `ferry` = sea…). |
| `vehicle` | no | slug | 1.2: the vehicle to show, e.g. `helicopter`, `jet`, `sailboat`, `train`, `rocket` (§9). Any lowercase slug; islands that can't draw it use their own vehicle for `by`. |
| `kind` | no | `"island"` or `"site"` | `island` (default) speaks Island Passport and gets `from`/`by` on arrival; `site` is any other website and gets a plain link. |
| `name` | no* | Text | A snapshot of the destination's name. *SHOULD be present, so your board works without fetching anything.* |
| `owner` | no | Text | Snapshot of the destination's owner. |
| `description` | no | Text | Snapshot or your own line about the destination. |
| `category` | no | string[] | Snapshot of their categories. |
| `color` | no | `#RRGGBB` | Snapshot of their accent colour. |
| `image` | no | URL | Snapshot of their preview picture. |
| `arrive` | no | URL template | Snapshot of their `arrive` template. |
| `travellers` | no | object | Snapshot of their `travellers`; departures attach a card only when this says `accept: true`. |
| `mutual` | no | boolean | You checked that they list you too. |
| `since` | no | `YYYY-MM-DD` | When the route opened. |

Routes carry **snapshots** on purpose: an island SHOULD draw its board from its own file and MUST NOT need to fetch
other islands' passports at page load (see §5). When a friend changes their passport, you update your snapshot.

### Mutual routes

A route is **mutual** when each island lists the other in `routes`. Islands SHOULD only show a "return flight" to
islands they list themselves, so a route works both ways only when both owners agreed to it. A one-way route is
still a normal link.

### Travel modes

`by` names a **mode** and `vehicle` (1.2) names what to show, so islands can keep their own art: Lighthouse Island
flies a helicopter from its helipad and sails a ferry from its pier; another island may fly a jet or run a train. A
traveller who left by `air` should arrive by air, and the same for `sea`, `land` and `space`. If you can draw the
vehicle they came in (`via`, §9), show that one; otherwise show your own vehicle for the mode.

## 2. Departures

To send a traveller to a route:

1. If the route has an `arrive` template containing `{from}`, replace `{from}` with your island's canonical `url`
   `{by}` with the mode and `{via}` with the route's `vehicle` (empty if none), all percent-encoded.
2. Otherwise, for `kind: "island"`, take the route's `url` and add the query parameters `from` and `by`, and `via`
   when the route names a vehicle (keep any query it already has). For `kind: "site"`, use the `url` unchanged.
3. Navigate to it in the same tab.

Example: Lighthouse Island sending a traveller to Comet Island by air:

```
https://comet-island.example/island/?from=https%3A%2F%2Flighthouse-island.example%2F&by=air
```

The same trip naming its vehicle (1.2):

```
https://comet-island.example/island/?from=https%3A%2F%2Flighthouse-island.example%2F&by=air&via=helicopter
```

Departures MUST be real links (`<a href="…">`) so they work with a keyboard, a screen reader, a middle click or a
new tab. An animation (a helicopter lifting off, a boat leaving) MAY run first, SHOULD last no more than about 3 seconds,
and MUST be skipped when the visitor prefers reduced motion. Offer a plain "go now" link while it runs.

## 3. Arrivals

On page load, an island that has an airport, harbour, station or launch pad SHOULD read `from`, `by` and `via` from
its address:

- `from` MUST be checked: it has to be an `https:` URL (or `http://localhost`). Use only its origin and path.
- `by` is `air`, `sea`, `land` or `space`; a vehicle name means its mode (`helicopter` = air, `train` = land). Without
  `by`, use the mode of `via`; anything else counts as `air`. (A 1.0 or 1.1 reader treats `land` and `space` as air.)
- `via` (1.2) is the vehicle: a lowercase slug of up to 32 characters, else ignore it. If it is a suggested vehicle of a
  different mode, ignore it. Draw it if you can, otherwise your own vehicle for `by`.
- Look the origin up in your own `routes` (same origin, path under the route's path).
  - **Listed:** welcome the traveller by that route's name ("Welcome! You flew in from Comet Island") and offer a
    **return flight**: a departure (§2) back along that route.
  - **Not listed:** you MAY welcome them by host name only ("Welcome, traveller from example.com"). You MUST NOT
    offer a link back, so your island can't be used to send people to an address that someone typed into a link.
- Remove `from`, `by` and `via` from the address bar (`history.replaceState`) so a reload or a shared link doesn't land
  again.
- Do not store, log or send these parameters anywhere.

The landing MAY be animated (a helicopter touching down, a ferry docking, a train pulling in) under the same rules as
departures. A return trip SHOULD use the vehicle the traveller came in, unless your route names its own.

## 4. Showing the airport, harbour, station and launch pad

Island Passport doesn't prescribe the art. Some conventions that keep islands feeling connected:

- A place on the map for each way you travel: a runway, a helipad or a balloon field for air; a harbour with a boat
  at a dock for sea; a station or a bus stop for land; a launch pad for space. For example **Helipad & Harbour /
  直升機坪與港口**.
- A **departures board** that lists `routes`: a mark for the vehicle (✈️ 🚁 ⛴️ ⛵ 🚆 🚀 …), the destination name, owner
  and one line, and a "Depart" link. Flight numbers and times are welcome decoration.
- Air for other people's islands, sea for your own sites or for plain websites.
- When a traveller arrives, show the vehicle bringing them in: theirs (`via`) if you can draw it, else your own for `by`.
- Use the destination's `color` for its postcard or flag; use your own style for everything else.

## 5. Privacy and safety

- Loading an island MUST NOT contact other islands. Draw the board from your own passport's snapshots. If you
  choose to refresh snapshots or show live previews, do it only after the visitor asks (for example on opening the
  board), and say so in your privacy notes.
- Use the destination's `image` only if you are happy for the visitor's browser to load it from their server;
  otherwise draw a postcard from `name` and `color`, or host a copy you have permission to use.
- `from`, `by` and `via` (and a traveller card the visitor chose to bring, §8) are the only things passed between
  islands. Don't add tracking parameters.
- Only link back to islands in your own `routes` (§3).
- Validate your file before publishing (`node tools/validate.mjs island.json`).

## 6. Versioning

This is version `1.2` (1.1 plus vehicles and the `land` and `space` modes; 1.1 added traveller cards). Later `1.x` versions only add optional fields; readers of `1.0` MUST accept them and ignore
what they don't know. A breaking change would be `2.0`.

## 7. Minimal example

```json
{
  "passport": "1.0",
  "name": "My Island",
  "url": "https://my-island.example/",
  "category": ["life"],
  "routes": [
    { "url": "https://comet-island.example/island/", "by": "air", "name": "Comet Island", "category": ["portfolio", "science"] }
  ]
}
```

A full example is in `examples/full.json`; the JSON Schema is `schema/island-passport.schema.json`.

## 8. Traveller cards (1.1)

A traveller card lets a visitor's character travel with them, so they arrive on the next island as themselves.
It describes the character in portable terms (colours, a shared style list), not as one island's palette slots,
and each island draws it in its own style.

### The card

```json
{
  "traveller": "1.0",
  "name": "Isla",
  "skin": "#E3B48C",
  "hair": { "style": "bun", "color": "#2B2320" },
  "outfit": { "color": "#F3B9A5", "accent": "#2C7A80" },
  "accessories": ["glasses"],
  "mobility": "wheelchair",
  "home": "https://lighthouse-island.example/"
}
```

| Field | Type | Meaning |
|---|---|---|
| `traveller` | `"1.0"` | Card format version. Required. |
| `name` | string | What to call them, up to 16 characters. Control and direction-override characters and `<` `>` are removed. |
| `skin` | `#RRGGBB` | Skin colour. |
| `hair` | object | `style`: one of the styles below; `color`: `#RRGGBB`. |
| `outfit` | object | `color` and optionally `accent`, both `#RRGGBB`. |
| `accessories` | string[] | Up to 4 of `glasses`, `sunglasses`, `hat`, `scarf`, `bag`, `mask`, `earrings`, `headphones`. |
| `mobility` | string | `wheelchair`, `cane` or `walker`. **Personal: only sent if the visitor chose to bring it.** |
| `home` | URL | The island where the character was made. |

Every field except `traveller` is optional. Islands MUST ignore fields and values they don't know. A card MUST NOT
hold age, health, contact details, images, model files or links other than `home`.

**Hair styles and fallbacks.** If an island can't draw a style, it uses the first fallback it can, else `short`:

| Style | Falls back to | Style | Falls back to |
|---|---|---|---|
| `short` | (everyone draws it) | `braids` | `ponytail`, `long`, `short` |
| `long` | `short` | `afro` | `curly`, `short` |
| `bun` | `long`, `short` | `bob` | `short` |
| `ponytail` | `long`, `short` | `bald` | `short` |
| `curly` | `short` | `cap`, `hat` | `cap`, `short` |
| `headscarf` | `long`, `short` | | |

**Colours** are matched to the island's own palette by the nearest colour (`nearestColor` in `passport-core.js`).

### Saying you accept cards

An island that can show visiting characters adds to its passport:

```json
"travellers": { "accept": true, "fields": ["name", "skin", "hair", "outfit", "accessories", "mobility"] }
```

`fields` lists what it can draw (default: all). Departing islands copy this into their route snapshot.

### Sending a card

When departing to a route whose snapshot has `travellers.accept: true`, and the visitor has a character:

1. Build the card from the visitor's character. Leave out `mobility` unless the visitor ticked an option such as
   "bring my wheelchair along". Never add anything the visitor didn't choose.
2. Keep only the destination's `fields`.
3. Encode: JSON → UTF-8 → base64url (no padding). The result MUST be at most 700 characters.
4. Put it in the **fragment** of the departure link as `ip-t=<encoded>` (after any fragment the link already has,
   joined with `&`), or where the destination's `arrive` template has `{traveller}`.

The fragment is used because browsers never send it to servers or in `Referer` headers, so the card doesn't land in
anyone's server logs. Example:

```
https://comet-island.example/island/?from=https%3A%2F%2Flighthouse-island.example%2F&by=air#ip-t=eyJ0cmF2ZWxsZXIiOiIxLjAiLC…
```

A **return trip** to the island a card came from carries the card back (including changes the visitor made), even if
your snapshot doesn't list `travellers`: that island evidently accepts cards.

### Accepting a card

1. Read `ip-t` from the fragment, decode and **clean** it (`decodeTraveller`): reject anything over 700 characters,
   not base64url, not JSON, or not an object; keep only known fields with valid values. Then remove `ip-t` from the
   address bar.
2. **Ask the visitor** before using it: "Isla brought their character. Use it?" with a way to keep or make another
   one. Don't replace a character the visitor already has on your island without asking, and don't save the card
   unless they accept.
3. **Translate** it into your style: nearest palette colours, style fallbacks, and leave out what you can't draw.
4. Show `name` as plain text only (never as HTML).
5. Treat the card as **cosmetic**: anyone can write any card into a link, so it MUST NOT grant, unlock or prove
   anything.
6. If the visitor leaves for another island, carry their (possibly changed) character on as a new card.

## 9. Vehicles (1.2)

A route MAY name the vehicle that carries the traveller. `by` still says the mode, so every island knows how to
receive them; `vehicle` says what to draw.

```json
{ "url": "https://comet-island.example/island/", "by": "air", "vehicle": "helicopter", "name": "Comet Island" }
```

Any lowercase slug (`a-z`, `0-9`, `-`, up to 32 characters) is allowed. These are suggested, with their mode:

| Mode | Vehicles |
|---|---|
| `air` | `plane`, `jet`, `helicopter`, `seaplane`, `balloon`, `airship`, `glider` |
| `sea` | `boat`, `ferry`, `sailboat`, `speedboat`, `yacht`, `ship`, `canoe`, `submarine` |
| `land` | `train`, `tram`, `bus`, `car`, `bicycle`, `scooter`, `cablecar`, `walk` |
| `space` | `rocket`, `ufo` |

Each mode has an everyday vehicle that islands fall back to: `plane` (air), `boat` (sea), `train` (land), `rocket`
(space). `passport-core.js` exports the list with marks and labels (`VEHICLES`, `vehicleMark`, `vehicleLabel`), and
`three-harbor.js` has low-poly models and paths for each (`makeVehicle`, `departPath`, `arrivePath`).

- Departures add `via=<vehicle>` (§2). Arrivals read it (§3) and draw that vehicle if they can.
- An island MAY list what it can draw in `ports.vehicles`, so others can pick a vehicle that will look right.
- A vehicle is decoration, like a card: it MUST NOT change where the link goes or what the visitor can do.
