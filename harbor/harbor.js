// Island Passport drop-in harbour for any website (no 3D needed).
//   <script type="module" src="/harbor/harbor.js" data-passport="/island.json"></script>
// Adds a small "✈ Routes" button, a departures board drawn from your passport's routes, the route's vehicle (plane, boat,
// balloon, rocket…) crossing the screen when someone departs, and a welcome card when a traveller arrives from another island.
// Optional attributes: data-lang="zh-Hant" | "en" (default: <html lang>), data-position="bottom-right" | "bottom-left",
// data-label="…" (button text), data-button="none" (no floating button; call IslandHarbor.open() yourself).
// No network requests besides your own passport; nothing stored. A traveller card (1.1) that arrives is used for the
// greeting and carried on (in memory only) to islands that accept cards, and home on the return trip.
import { text, departUrl, readArrival, returnUrl, validatePassport, categoriesOf, categoryLabel, modeOf, vehicleOf, vehicleMark, vehicleLabel } from "./passport-core.js";

const me = document.currentScript || document.querySelector('script[src*="harbor.js"][data-passport]');
const cfg = { passport: me?.dataset.passport || "/island.json", lang: me?.dataset.lang || document.documentElement.lang || navigator.language || "en",
  position: me?.dataset.position || "bottom-right", label: me?.dataset.label || "", button: me?.dataset.button !== "none" };
const zh = /^zh/i.test(cfg.lang);
const T = zh
  ? { routes: "航線", board: "出發航班", close: "關閉", depart: "出發", air: "空路", sea: "海路", space: "太空", site: "網站", now: "直接前往",
      going: (n, by) => ({ air: `飛往 ${n}…`, sea: `開往 ${n}…`, space: `發射前往 ${n}…` })[by] || `前往 ${n}…`,
      welcome: (n, by, mark) => `${mark} 歡迎從「${n}」${({ air: "飛", sea: "搭船", space: "坐火箭" })[by] || ""}來！`, stranger: (h) => `歡迎來自 ${h} 的旅客！`, back: "回程", stay: "逛逛這裡",
      empty: "還沒有航線。", foot: "Island Passport：用 /island.json 讓小島互相連結。" }
  : { routes: "Routes", board: "Departures", close: "Close", depart: "Depart", air: "By air", sea: "By sea", space: "To space", site: "Website", now: "Go now",
      going: (n, by) => ({ air: `Flying to ${n}…`, sea: `Sailing to ${n}…`, space: `Launching to ${n}…` })[by] || `Heading to ${n}…`,
      welcome: (n, by, mark) => `${mark} Welcome! You ${({ air: "flew", sea: "sailed", space: "rocketed" })[by] || "came"} in from ${n}.`, stranger: (h) => `Welcome, traveller from ${h}!`, back: "Return trip", stay: "Look around",
      empty: "No routes yet.", foot: "Island Passport: islands linked by /island.json." };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const CSS = `
.iph-btn{position:fixed;${cfg.position.includes("left") ? "left" : "right"}:16px;bottom:16px;z-index:2147483000;display:inline-flex;align-items:center;gap:6px;
  padding:10px 14px;border-radius:999px;border:1px solid rgba(0,0,0,.12);background:#FFFCF6;color:#1E292D;font:600 14px/1 system-ui,sans-serif;
  box-shadow:0 6px 20px rgba(0,0,0,.15);cursor:pointer}
.iph-btn:focus-visible,.iph a:focus-visible,.iph button:focus-visible{outline:2px solid #2C7A80;outline-offset:2px}
.iph{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:flex-end;justify-content:center;background:rgba(20,28,31,.35)}
.iph[hidden]{display:none}
.iph-card{width:min(560px,100%);max-height:85vh;overflow:auto;background:#FFFCF6;color:#1E292D;border-radius:18px 18px 0 0;padding:16px 16px 20px;font:15px/1.5 system-ui,sans-serif}
@media(min-width:700px){.iph{align-items:center}.iph-card{border-radius:18px}}
.iph-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.iph-head h2{margin:0;font-size:18px}
.iph-x{width:34px;height:34px;border-radius:10px;border:1px solid rgba(0,0,0,.12);background:#fff;font-size:18px;cursor:pointer}
.iph-row{display:grid;grid-template-columns:54px 1fr auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid rgba(0,0,0,.08)}
.iph-pc{width:54px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff}
.iph-row b{display:block}.iph-row small{color:#5B6B70;display:block}
.iph-cats{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}.iph-cats i{font-style:normal;font-size:11px;padding:2px 7px;border-radius:99px;background:#EEF4F3;color:#2C5E62}
.iph-go{padding:8px 12px;border-radius:10px;background:#2C7A80;color:#fff;text-decoration:none;font-weight:600;white-space:nowrap}
.iph-foot{margin:12px 0 0;font-size:12px;color:#5B6B70}
.iph-fly{position:fixed;z-index:2147483002;left:-80px;top:55%;font-size:44px;pointer-events:none;animation:iph-fly 1.6s cubic-bezier(.5,0,.6,1) forwards}
@keyframes iph-fly{to{transform:translate(calc(100vw + 160px),-40vh) rotate(-12deg)}}
.iph-sail{animation:iph-sail 1.8s ease-in forwards;top:auto;bottom:12%}
@keyframes iph-sail{to{transform:translate(calc(100vw + 160px),0)}}
.iph-launch{animation:iph-launch 1.7s cubic-bezier(.6,0,.9,.6) forwards;left:50%;top:auto;bottom:-60px}
@keyframes iph-launch{to{transform:translate(-50%,-110vh)}}
.iph-veil{position:fixed;inset:0;z-index:2147483001;background:#FFFCF6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font:600 18px system-ui,sans-serif;color:#1E292D;opacity:0;animation:iph-veil .5s .9s forwards}
.iph-veil a{font-size:14px;color:#2C7A80}
@keyframes iph-veil{to{opacity:1}}
.iph-hi{position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:2147483000;display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;
  max-width:calc(100% - 24px);padding:10px 14px;border-radius:14px;background:#FFFCF6;color:#1E292D;box-shadow:0 8px 26px rgba(0,0,0,.18);font:600 14px/1.4 system-ui,sans-serif}
.iph-hi a,.iph-hi button{font:inherit;font-size:13px;padding:6px 10px;border-radius:9px;border:1px solid rgba(0,0,0,.12);background:#fff;color:#1E292D;text-decoration:none;cursor:pointer}
.iph-hi a{background:#2C7A80;color:#fff;border-color:transparent}
@media(prefers-reduced-motion:reduce){.iph-fly,.iph-veil{animation:none}.iph-veil{opacity:1}}`;

let passport = null, dialog = null, visitor = null; /* the traveller card that came with this visit, if any */
const name = (r) => text(r?.name, cfg.lang) || (r?.url ? new URL(r.url).host : "");

async function load() {
  if (passport) return passport;
  const res = await fetch(cfg.passport, { credentials: "omit" });
  passport = await res.json();
  const v = validatePassport(passport); if (!v.ok) console.warn("[island-passport]", v.errors);
  return passport;
}

function board() {
  const p = passport, rows = (p.routes || []).map((r, i) => {
    const by = modeOf(r), veh = vehicleOf(r), mark = vehicleMark(veh, by), color = /^#[0-9a-f]{6}$/i.test(r.color || "") ? r.color : ({ sea: "#2C7A80", space: "#5B5F97" })[by] || "#DB6A41";
    const kind = (r.kind || "island") === "site" ? T.site : r.vehicle ? `${T[by]} · ${vehicleLabel(veh, cfg.lang)}` : T[by];
    return `<div class="iph-row"><span class="iph-pc" style="background:${color}" aria-hidden="true">${mark}</span>
      <span><b>${esc(name(r))}</b><small>${esc([kind, text(r.owner, cfg.lang)].filter(Boolean).join(" · "))}</small>${r.description ? `<small>${esc(text(r.description, cfg.lang))}</small>` : ""}${categoriesOf(r).length ? `<span class="iph-cats">${categoriesOf(r).map((c) => `<i>${esc(categoryLabel(c, cfg.lang))}</i>`).join("")}</span>` : ""}</span>
      <a class="iph-go" href="${esc(departUrl(r, p.url, by, { traveller: visitor }))}" data-i="${i}">${T.depart}</a></div>`;
  }).join("");
  return `<div class="iph-card" role="dialog" aria-modal="true" aria-labelledby="iph-t"><div class="iph-head"><h2 id="iph-t">${esc(T.board)} · ${esc(text(p.name, cfg.lang))}</h2>
    <button class="iph-x" type="button" aria-label="${T.close}">×</button></div>${rows || `<p>${T.empty}</p>`}<p class="iph-foot">${esc(T.foot)}</p></div>`;
}

export async function open() {
  await load();
  if (!dialog) {
    dialog = document.createElement("div"); dialog.className = "iph"; document.body.append(dialog);
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog || e.target.closest(".iph-x")) return close();
      const a = e.target.closest("a[data-i]"); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault(); depart(+a.dataset.i);
    });
    dialog.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }
  dialog.innerHTML = board(); dialog.hidden = false; dialog.querySelector("a,button")?.focus();
}
export function close() { if (dialog) dialog.hidden = true; }

/* fly or sail away, then go; the destination link is always shown as a fallback */
export async function depart(i) {
  await load();
  const r = passport.routes[i], by = modeOf(r), url = departUrl(r, passport.url, by, { traveller: visitor }); close();
  if (reduced()) return location.assign(url);
  /* the vehicle crosses the screen: air and space climb away, sea stays low */
  const fly = document.createElement("div"); fly.className = "iph-fly" + (by === "sea" ? " iph-sail" : by === "space" ? " iph-launch" : ""); fly.textContent = vehicleMark(vehicleOf(r), by); fly.setAttribute("aria-hidden", "true");
  const veil = document.createElement("div"); veil.className = "iph-veil"; veil.setAttribute("role", "status");
  veil.innerHTML = `<span>${esc(T.going(name(r), by))}</span><a href="${esc(url)}">${T.now}</a>`;
  document.body.append(fly, veil); setTimeout(() => location.assign(url), 1700);
}

/* welcome a traveller; offer a return trip only for islands in our own routes */
export async function arrive() {
  const p = await load().catch(() => null); if (!p) return null;
  const a = readArrival(p); if (!a) return null;
  visitor = a.traveller;
  const hi = document.createElement("div"); hi.className = "iph-hi"; hi.setAttribute("role", "status");
  const back = returnUrl(a, p);
  const who = a.traveller?.name ? (zh ? `${a.traveller.name}，` : `${a.traveller.name}! `) : "";
  hi.innerHTML = `<span>${esc(who + (a.route ? T.welcome(name(a.route), a.by, vehicleMark(a.vehicle, a.by)) : T.stranger(a.host)))}</span>${back ? `<a href="${esc(back)}">↩ ${T.back}</a>` : ""}<button type="button">${T.stay}</button>`;
  hi.querySelector("button").addEventListener("click", () => hi.remove());
  document.body.append(hi); setTimeout(() => hi.remove(), 20000);
  return a;
}

function boot() {
  const style = document.createElement("style"); style.textContent = CSS; document.head.append(style);
  if (cfg.button) {
    const b = document.createElement("button"); b.type = "button"; b.className = "iph-btn"; b.innerHTML = `<span aria-hidden="true">✈</span>${esc(cfg.label || T.routes)}`;
    b.addEventListener("click", open); b.addEventListener("pointerenter", () => load().catch(() => {}), { once: true }); document.body.append(b);
  }
  arrive();
}
window.IslandHarbor = { open, close, depart, arrive };
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
