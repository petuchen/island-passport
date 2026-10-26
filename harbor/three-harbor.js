// Island Passport helpers for three.js islands: low-poly vehicles for every travel mode (plane, jet, helicopter, balloon,
// airship, ferry, sailboat, rocket, UFO…), departure / arrival paths, and a small travel animator with an
// optional follow camera. Pass your own THREE so there's no version clash:
//   import * as THREE from "three";
//   import { makeVehicle, departPath, arrivePath, Traveller } from "./three-harbor.js";
//   const v = makeVehicle(THREE, arrival.vehicle);          // falls back to a vehicle of the same mode if it has no model
//   scene.add(v.group); new Traveller(THREE, v.group, arrivePath(THREE, v.style, padOrDock, heading), { ms: 4000 });
// The single makers (makeHelicopter, makePlane, makeBoat, …) and paths (liftoffPath, sailPath, …) are exported too.
// Models face +Z and sit with their keel / wheels at y = 0. Sizes are in your scene units (scale the group).

const mat = (THREE, color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...o });

/* a chubby propeller plane, ~1.6 long; returns { group, tick(dt, speed) } (tick spins the propeller) */
export function makePlane(THREE, { body = "#FFF6EC", wing = "#DB6A41", accent = "#2C7A80", glass = "#9FD5E0", tail } = {}) {
  const g = new THREE.Group(), add = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; g.add(o); return o; };
  const mBody = mat(THREE, body), mWing = mat(THREE, wing), mAcc = mat(THREE, accent), mGlass = mat(THREE, glass, { roughness: 0.2 }), mTail = mat(THREE, tail || wing);
  add(new THREE.CylinderGeometry(0.2, 0.13, 1.25, 12), mBody, 0, 0.42, 0, Math.PI / 2);          /* fuselage */
  add(new THREE.SphereGeometry(0.2, 12, 10), mBody, 0, 0.42, 0.62);                                /* nose */
  add(new THREE.SphereGeometry(0.13, 10, 8), mBody, 0, 0.42, -0.62);                               /* tail cone */
  add(new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mGlass, 0, 0.56, 0.24); /* canopy */
  add(new THREE.BoxGeometry(1.7, 0.05, 0.36), mWing, 0, 0.4, 0.1);                                 /* wings */
  add(new THREE.BoxGeometry(0.62, 0.04, 0.2), mTail, 0, 0.5, -0.6);                                /* tailplane */
  add(new THREE.BoxGeometry(0.04, 0.3, 0.24), mTail, 0, 0.63, -0.62);                              /* fin */
  add(new THREE.BoxGeometry(0.42, 0.03, 0.3), mAcc, 0, 0.425, 0.1);                                /* wing stripe */
  add(new THREE.CylinderGeometry(0.205, 0.205, 0.08, 12), mAcc, 0, 0.42, 0.3, Math.PI / 2);        /* body stripe */
  for (const x of [-0.22, 0.22]) { add(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), mAcc, x, 0.2, 0.25); add(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10), mAcc, x, 0.08, 0.25, 0, 0, Math.PI / 2); }
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 8), mAcc, 0, 0.12, -0.55, 0, 0, Math.PI / 2);   /* tail wheel */
  const prop = new THREE.Group(); prop.position.set(0, 0.42, 0.83); g.add(prop);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.02), mAcc); prop.add(blade);
  const blade2 = blade.clone(); blade2.rotation.z = Math.PI / 2; prop.add(blade2);
  return { group: g, prop, tick(dt, speed = 1) { prop.rotation.z += dt * (4 + 40 * speed); } };
}

/* a round little helicopter, ~1.7 long with the tail; returns { group, rotor, tail, tick(dt, speed) } (speed 0 = idle, 1 = flying) */
export function makeHelicopter(THREE, { body = "#FFF6EC", accent = "#DB6A41", trim = "#2C7A80", glass = "#9FD5E0", skid = "#3A4448" } = {}) {
  const g = new THREE.Group(), add = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = g) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; parent.add(o); return o; };
  const mBody = mat(THREE, body), mAcc = mat(THREE, accent), mTrim = mat(THREE, trim), mGlass = mat(THREE, glass, { roughness: 0.15 }), mSkid = mat(THREE, skid);
  add(new THREE.SphereGeometry(0.36, 16, 12), mBody, 0, 0.5, 0.05).scale.set(0.9, 0.85, 1.15);          /* cabin */
  add(new THREE.SphereGeometry(0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mGlass, 0, 0.53, 0.2, Math.PI * 0.42).scale.set(0.85, 0.85, 0.9); /* windscreen */
  add(new THREE.CylinderGeometry(0.37, 0.37, 0.08, 16), mAcc, 0, 0.5, 0.05).scale.set(0.9, 1, 1.15);   /* stripe */
  add(new THREE.CylinderGeometry(0.07, 0.04, 0.95, 8), mBody, 0, 0.58, -0.68, Math.PI / 2 - 0.08);      /* tail boom */
  add(new THREE.BoxGeometry(0.04, 0.3, 0.16), mAcc, 0, 0.7, -1.12);                                     /* tail fin */
  add(new THREE.BoxGeometry(0.34, 0.035, 0.1), mTrim, 0, 0.6, -1.0);                                    /* stabiliser */
  for (const x of [-0.24, 0.24]) {
    add(new THREE.BoxGeometry(0.04, 0.04, 0.9), mSkid, x, 0.03, 0.05);                                  /* skids */
    for (const z of [-0.18, 0.28]) add(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 6), mSkid, x * 0.85, 0.15, z, 0, 0, x > 0 ? -0.35 : 0.35);
  }
  add(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 8), mTrim, 0, 0.9, 0.02);                            /* mast */
  const rotor = new THREE.Group(); rotor.position.set(0, 0.99, 0.02); g.add(rotor);
  for (let i = 0; i < 3; i++) { const a = (i * Math.PI * 2) / 3; add(new THREE.BoxGeometry(0.07, 0.02, 1.15), mTrim, Math.sin(a) * 0.55, 0, Math.cos(a) * 0.55, 0, a, 0, rotor); } /* three blades */
  add(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 10), mAcc, 0, 0, 0, 0, 0, 0, rotor);               /* hub */
  const tail = new THREE.Group(); tail.position.set(0.05, 0.72, -1.14); g.add(tail);
  add(new THREE.BoxGeometry(0.015, 0.3, 0.05), mTrim, 0, 0, 0, 0, 0, 0, tail);
  let spin = 0;
  return { group: g, rotor, tail, tick(dt, speed = 0) {
    spin += (Math.max(0, Math.min(1, speed)) - spin) * Math.min(1, dt * 1.5);               /* rotors spool up and down */
    rotor.rotation.y += dt * (0.6 + spin * 28); tail.rotation.x += dt * (1 + spin * 40);
  } };
}

/* a small ferry, ~1.5 long; returns { group, tick(dt, t) } (tick bobs it on the water) */
export function makeBoat(THREE, { hull = "#FFFCF6", stripe = "#DB6A41", cabin = "#FFFFFF", roof = "#2C7A80", glass = "#9FD5E0" } = {}) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const add = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; body.add(o); return o; };
  const mHull = mat(THREE, hull), mStripe = mat(THREE, stripe), mCab = mat(THREE, cabin), mRoof = mat(THREE, roof), mGlass = mat(THREE, glass, { roughness: 0.2 });
  add(new THREE.BoxGeometry(0.62, 0.26, 1.2), mHull, 0, 0.1, -0.05);
  add(new THREE.CylinderGeometry(0.31, 0.31, 0.26, 3, 1, false, 0, Math.PI), mHull, 0, 0.1, 0.55, 0, Math.PI / 2, 0).scale.set(1, 1, 0.9); /* pointed bow */
  add(new THREE.BoxGeometry(0.64, 0.06, 1.22), mStripe, 0, 0.2, -0.05);
  add(new THREE.BoxGeometry(0.46, 0.3, 0.6), mCab, 0, 0.38, -0.15);
  add(new THREE.BoxGeometry(0.47, 0.1, 0.5), mGlass, 0, 0.42, -0.15);
  add(new THREE.BoxGeometry(0.54, 0.05, 0.7), mRoof, 0, 0.55, -0.15);
  add(new THREE.CylinderGeometry(0.05, 0.06, 0.22, 8), mStripe, 0, 0.66, -0.3);   /* funnel */
  return { group: g, body, tick(dt, t = performance.now() / 1000) { body.position.y = Math.sin(t * 1.6) * 0.025; body.rotation.z = Math.sin(t * 1.1) * 0.03; body.rotation.x = Math.sin(t * 0.9) * 0.02; } };
}

/* heading (radians, 0 = +Z) for route i of n, fanned around an outward direction so each destination flies its own way */
export function bearing(i, n, outward = 0, spread = Math.PI * 0.7) { return n <= 1 ? outward : outward + (i / (n - 1) - 0.5) * spread; }

/* take-off: roll along the runway from `start` to `end`, lift off, climb and turn to `heading`, out to `range` */
export function takeoffPath(THREE, start, end, heading, { climb = 14, range = 60 } = {}) {
  const v = (x, y, z) => new THREE.Vector3(x, y, z), dir = end.clone().sub(start).setY(0).normalize();
  const lift = end.clone().addScaledVector(dir, 2).setY(start.y + 1.2);
  const h = v(Math.sin(heading), 0, Math.cos(heading));
  const turn = lift.clone().addScaledVector(dir, 6).addScaledVector(h, 4).setY(start.y + climb * 0.4);
  const far = turn.clone().addScaledVector(h, range).setY(start.y + climb);
  return new THREE.CatmullRomCurve3([start.clone(), start.clone().lerp(end, 0.5), end.clone(), lift, turn, far], false, "centripetal");
}

/* landing: the reverse idea: come in from far along `heading`, line up with the runway, touch down, roll to `stop` */
export function landingPath(THREE, touch, stop, heading, { height = 12, range = 50 } = {}) {
  const dir = stop.clone().sub(touch).setY(0).normalize(), h = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
  const final = touch.clone().addScaledVector(dir, -6).setY(touch.y + 1.6);
  const turn = final.clone().addScaledVector(dir, -6).addScaledVector(h, 5).setY(touch.y + height * 0.45);
  const far = turn.clone().addScaledVector(h, range).setY(touch.y + height);
  return new THREE.CatmullRomCurve3([far, turn, final, touch.clone(), stop.clone()], false, "centripetal");
}

/* helicopter lift-off: rise straight up from the pad, then lean forward and climb away along `heading` */
export function liftoffPath(THREE, pad, heading, { hover = 2.4, climb = 13, range = 55 } = {}) {
  const h = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
  const up = pad.clone().setY(pad.y + hover), lean = up.clone().addScaledVector(h, 3).setY(pad.y + hover + 1.2);
  const away = lean.clone().addScaledVector(h, 14).setY(pad.y + climb * 0.6), far = lean.clone().addScaledVector(h, range).setY(pad.y + climb);
  return new THREE.CatmullRomCurve3([pad.clone(), pad.clone().setY(pad.y + hover * 0.5), up, lean, away, far], false, "centripetal");
}

/* helicopter touchdown: come in along `heading`, slow to a hover over the pad, settle down */
export function touchdownPath(THREE, pad, heading, { hover = 2.4, height = 12, range = 45 } = {}) {
  const h = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
  const far = pad.clone().addScaledVector(h, range).setY(pad.y + height), near = pad.clone().addScaledVector(h, 8).setY(pad.y + hover + 2);
  const over = pad.clone().addScaledVector(h, 1.2).setY(pad.y + hover);
  return new THREE.CatmullRomCurve3([far, near, over, pad.clone().setY(pad.y + hover * 0.4), pad.clone()], false, "centripetal");
}

/* sailing: leave the dock along `heading` on the water */
export function sailPath(THREE, dock, heading, { range = 40, y = dock.y } = {}) {
  const h = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading)), side = new THREE.Vector3(h.z, 0, -h.x);
  const a = dock.clone().setY(y), b = a.clone().addScaledVector(h, 4).addScaledVector(side, 1.2), c = a.clone().addScaledVector(h, range);
  return new THREE.CatmullRomCurve3([a, b, c], false, "centripetal");
}

/* docking: come in from the sea along `heading` and stop at the dock */
export function dockPath(THREE, dock, heading, { range = 40 } = {}) {
  const h = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading)), side = new THREE.Vector3(h.z, 0, -h.x);
  return new THREE.CatmullRomCurve3([dock.clone().addScaledVector(h, range), dock.clone().addScaledVector(h, 5).addScaledVector(side, -1.2), dock.clone()], false, "centripetal");
}

/* Moves an object along a curve over `ms`, facing the way it goes (banking planes), optionally steering a camera.
   step(now) returns true while running; call it from your render loop. Ease: slow start (a plane accelerating). */
export class Traveller {
  constructor(THREE, obj, curve, { ms = 3000, bank = 0.5, pitch = 1, maxPitch = 0.45, ease = (k) => k * k * (1.6 - 0.6 * k), camera = null, controls = null, follow = 7, rise = 3, onDone = null } = {}) {
    Object.assign(this, { THREE, obj, curve, ms, bank, pitch, maxPitch, ease, camera, controls, follow, rise, onDone, t0: performance.now(), done: false });
    this._p = new THREE.Vector3(); this._q = new THREE.Vector3(); this._cam = new THREE.Vector3();
  }
  step(now = performance.now()) {
    if (this.done) return false;
    const k = Math.max(0, Math.min(1, (now - this.t0) / this.ms)), e = this.ease(k), { obj, curve, _p, _q } = this;
    curve.getPointAt(Math.min(0.999, e), _p); curve.getPointAt(Math.min(1, e + 0.004), _q);
    obj.position.copy(_p);
    const dx = _q.x - _p.x, dz = _q.z - _p.z, dy = _q.y - _p.y, flat = Math.hypot(dx, dz);
    if (flat > 1e-5) {
      const yaw = Math.atan2(dx, dz), turn = ((yaw - (this._yaw ?? yaw) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const pt = Math.max(-this.maxPitch, Math.min(this.maxPitch, -Math.atan2(dy, flat) * this.pitch));
      if (flat > 0.002) { obj.rotation.set(pt, yaw, -turn * 40 * this.bank, "YXZ"); this._yaw = yaw; } /* straight up or down: keep the heading */
    }
    if (this.camera) {
      const back = new this.THREE.Vector3(Math.sin(obj.rotation.y), 0, Math.cos(obj.rotation.y)).multiplyScalar(-this.follow);
      this._cam.copy(_p).add(back).setY(_p.y + this.rise);
      this.camera.position.lerp(this._cam, 0.08);
      if (this.controls) { this.controls.target.lerp(_p, 0.12); } else this.camera.lookAt(_p);
    }
    if (k >= 1) { this.done = true; this.onDone?.(); return false; }
    return true;
  }
}

/* ---------- more vehicles (1.2). Each returns { group, tick(dt, speedOrTime) }; faces +Z, bottom at y = 0 ---------- */
const part = (THREE, g) => (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; parent.add(o); return o; };

/* a sleek little jet, ~1.7 long, swept wings and a glowing exhaust */
export function makeJet(THREE, { body = "#F4F6F8", wing = "#2C7A80", accent = "#DB6A41", glass = "#7FC4D6" } = {}) {
  const g = new THREE.Group(), add = part(THREE, g), mB = mat(THREE, body), mW = mat(THREE, wing), mA = mat(THREE, accent), mG = mat(THREE, glass, { roughness: 0.15 });
  add(new THREE.CylinderGeometry(0.16, 0.12, 1.3, 14), mB, 0, 0.42, -0.05, Math.PI / 2);
  add(new THREE.ConeGeometry(0.16, 0.45, 14), mB, 0, 0.42, 0.82, Math.PI / 2);
  add(new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mG, 0, 0.53, 0.42).scale.set(0.9, 0.8, 1.8);
  for (const sx of [-1, 1]) { const w = add(new THREE.BoxGeometry(0.75, 0.035, 0.32), mW, sx * 0.45, 0.4, -0.05, 0, sx * -0.45, 0); w.scale.z = 1; const t = add(new THREE.BoxGeometry(0.3, 0.03, 0.16), mW, sx * 0.18, 0.47, -0.62, 0, sx * -0.5, 0); void t; }
  add(new THREE.BoxGeometry(0.03, 0.3, 0.26), mA, 0, 0.62, -0.62, 0.3);
  const flame = add(new THREE.ConeGeometry(0.08, 0.3, 10), mat(THREE, "#FFB45C", { emissive: "#FF8A3D", emissiveIntensity: 1.2 }), 0, 0.42, -0.86, -Math.PI / 2);
  for (const x of [-0.18, 0.18, 0]) add(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8), mA, x, 0.06, x ? -0.05 : 0.5, 0, 0, Math.PI / 2);
  return { group: g, tick(dt, speed = 1) { flame.scale.setScalar(0.4 + 0.6 * Math.min(1, speed) + Math.random() * 0.1); } };
}

/* a hot-air balloon, ~2 tall; tick sways the basket */
export function makeBalloon(THREE, { colors = ["#DB6A41", "#F2C46B", "#2C7A80", "#FFF6EC"], basket = "#A87A4D" } = {}) {
  const g = new THREE.Group(), sway = new THREE.Group(); g.add(sway); const add = part(THREE, sway);
  for (let i = 0; i < 8; i++) add(new THREE.SphereGeometry(0.62, 6, 14, (i / 8) * Math.PI * 2, Math.PI / 4), mat(THREE, colors[i % colors.length]), 0, 1.45, 0).scale.set(1, 1.12, 1);
  add(new THREE.CylinderGeometry(0.2, 0.3, 0.3, 12, 1, true), mat(THREE, colors[0], { side: THREE.DoubleSide }), 0, 0.82, 0);
  add(new THREE.BoxGeometry(0.32, 0.24, 0.32), mat(THREE, basket), 0, 0.12, 0);
  for (const [x, z] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) add(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 4), mat(THREE, "#5A4636"), x, 0.48, z);
  const fire = add(new THREE.ConeGeometry(0.06, 0.16, 8), mat(THREE, "#FFB45C", { emissive: "#FF8A3D", emissiveIntensity: 1.4 }), 0, 0.42, 0);
  return { group: g, tick(dt, t = performance.now() / 1000) { sway.rotation.z = Math.sin(t * 0.9) * 0.04; sway.rotation.x = Math.sin(t * 0.7) * 0.03; fire.visible = Math.sin(t * 3) > -0.3; } };
}

/* an airship, ~2 long, with a gondola and a turning propeller */
export function makeAirship(THREE, { body = "#FFF6EC", stripe = "#DB6A41", gondola = "#2C7A80" } = {}) {
  const g = new THREE.Group(), add = part(THREE, g);
  add(new THREE.SphereGeometry(0.4, 18, 12), mat(THREE, body), 0, 1.0, 0).scale.set(1, 0.9, 2.3);
  add(new THREE.CylinderGeometry(0.405, 0.405, 0.12, 18), mat(THREE, stripe), 0, 1.0, 0.25, Math.PI / 2).scale.set(1, 1, 0.9);
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) add(new THREE.BoxGeometry(0.03, 0.34, 0.3), mat(THREE, stripe), Math.sin(a) * 0.2, 1.0 + Math.cos(a) * 0.2, -0.82, 0, 0, a);
  add(new THREE.BoxGeometry(0.22, 0.14, 0.5), mat(THREE, gondola), 0, 0.55, 0.05);
  const prop = new THREE.Group(); prop.position.set(0, 0.55, -0.26); g.add(prop); add(new THREE.BoxGeometry(0.3, 0.04, 0.02), mat(THREE, "#3A4448"), 0, 0, 0, 0, 0, 0, prop);
  return { group: g, tick(dt, speed = 1) { prop.rotation.z += dt * (2 + 20 * speed); } };
}

/* a sailboat, ~1.4 long; tick bobs it */
export function makeSailboat(THREE, { hull = "#FFFCF6", stripe = "#2C7A80", sail = "#FFF6EC", flag = "#DB6A41" } = {}) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); const add = part(THREE, body);
  add(new THREE.BoxGeometry(0.46, 0.2, 1.0), mat(THREE, hull), 0, 0.1, -0.05);
  add(new THREE.CylinderGeometry(0.23, 0.23, 0.2, 3, 1, false, 0, Math.PI), mat(THREE, hull), 0, 0.1, 0.45, 0, Math.PI / 2, 0).scale.set(1, 1, 0.9);
  add(new THREE.BoxGeometry(0.48, 0.05, 1.02), mat(THREE, stripe), 0, 0.18, -0.05);
  add(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 6), mat(THREE, "#8C6A47"), 0, 0.85, 0.05);
  const s1 = add(new THREE.ConeGeometry(0.45, 1.05, 3), mat(THREE, sail, { side: THREE.DoubleSide }), 0.02, 0.85, -0.18); s1.scale.set(0.05, 1, 1);
  const s2 = add(new THREE.ConeGeometry(0.28, 0.8, 3), mat(THREE, sail, { side: THREE.DoubleSide }), 0.02, 0.72, 0.3); s2.scale.set(0.05, 1, 1);
  add(new THREE.BoxGeometry(0.01, 0.08, 0.14), mat(THREE, flag), 0, 1.5, 0.0);
  return { group: g, body, tick(dt, t = performance.now() / 1000) { body.position.y = Math.sin(t * 1.5) * 0.025; body.rotation.z = Math.sin(t * 1.0) * 0.06; } };
}

/* a cartoon rocket, ~1.8 tall, with fins and a flame */
export function makeRocket(THREE, { body = "#FFF6EC", accent = "#DB6A41", glass = "#7FC4D6" } = {}) {
  const g = new THREE.Group(), add = part(THREE, g);
  add(new THREE.CylinderGeometry(0.26, 0.3, 1.0, 16), mat(THREE, body), 0, 0.75, 0);
  add(new THREE.ConeGeometry(0.26, 0.5, 16), mat(THREE, accent), 0, 1.5, 0);
  add(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 14), mat(THREE, glass, { roughness: 0.15 }), 0, 0.95, 0.27, Math.PI / 2);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; add(new THREE.BoxGeometry(0.04, 0.36, 0.26), mat(THREE, accent), Math.sin(a) * 0.3, 0.3, Math.cos(a) * 0.3, 0, a, 0); }
  const flame = add(new THREE.ConeGeometry(0.16, 0.45, 12), mat(THREE, "#FFB45C", { emissive: "#FF8A3D", emissiveIntensity: 1.5 }), 0, 0.02, 0, Math.PI);
  return { group: g, tick(dt, speed = 0) { flame.visible = speed > 0.05; flame.scale.set(1, 0.6 + speed + Math.random() * 0.2, 1); } };
}

/* a friendly UFO, ~1.2 wide; tick spins it and blinks its lights */
export function makeUfo(THREE, { body = "#C9D3DA", dome = "#9FD5E0", light = "#F2C46B" } = {}) {
  const g = new THREE.Group(), spin = new THREE.Group(); spin.position.y = 0.4; g.add(spin); const add = part(THREE, spin), lights = [];
  add(new THREE.SphereGeometry(0.6, 20, 10), mat(THREE, body, { metalness: 0.3, roughness: 0.4 }), 0, 0, 0).scale.set(1, 0.22, 1);
  add(new THREE.SphereGeometry(0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(THREE, dome, { roughness: 0.1 }), 0, 0.08, 0);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; lights.push(add(new THREE.SphereGeometry(0.04, 8, 6), mat(THREE, light, { emissive: light, emissiveIntensity: 1 }), Math.sin(a) * 0.5, -0.03, Math.cos(a) * 0.5)); }
  return { group: g, tick(dt, t = performance.now() / 1000) { spin.rotation.y += dt * 1.5; lights.forEach((l, i) => (l.visible = Math.sin(t * 4 + i) > -0.2)); } };
}

/* ---------- picking a model and a path for any vehicle ---------- */
/* how each vehicle moves: "rotor" rises and settles vertically, "plane" rolls and climbs, "water" sails, "rocket"
   launches straight up */
export const VEHICLE_STYLE = { plane: "plane", jet: "plane", seaplane: "plane", glider: "plane", helicopter: "rotor", balloon: "rotor", airship: "rotor", ufo: "rotor",
  boat: "water", ferry: "water", sailboat: "water", speedboat: "water", yacht: "water", ship: "water", canoe: "water", submarine: "water",
  rocket: "rocket" };
const MAKERS = { plane: makePlane, glider: makePlane, seaplane: makePlane, jet: makeJet, helicopter: makeHelicopter, balloon: makeBalloon, airship: makeAirship, ufo: makeUfo,
  boat: makeBoat, ferry: makeBoat, ship: makeBoat, yacht: makeBoat, speedboat: makeBoat, canoe: makeSailboat, submarine: makeBoat, sailboat: makeSailboat,
  rocket: makeRocket };
const MODE_OF = { rotor: "air", plane: "air", water: "sea", rocket: "space" };
const FALLBACK = { air: "plane", sea: "boat", space: "rocket" };
/* a model for any vehicle slug: its own if we have one, else the everyday vehicle of `by` (or of the slug's mode).
   Returns { group, tick, slug, style } where slug is what was actually built. */
export function makeVehicle(THREE, slug, colors = {}, by) {
  const s = MAKERS[slug] ? slug : FALLBACK[by || MODE_OF[VEHICLE_STYLE[slug]] || "air"];
  return { ...MAKERS[s](THREE, colors), slug: s, style: VEHICLE_STYLE[s] };
}
/* a departure path for a vehicle style from `at` (pad, dock or launch pad) towards `heading` */
export function departPath(THREE, style, at, heading, o = {}) {
  const h = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
  if (style === "rotor") return liftoffPath(THREE, at, heading, o);
  if (style === "plane") return o.runwayEnd ? takeoffPath(THREE, at, o.runwayEnd, heading, o) : takeoffPath(THREE, at, at.clone().addScaledVector(h, 4), heading, o);
  if (style === "rocket") { const up = (y) => at.clone().setY(at.y + y); return new THREE.CatmullRomCurve3([at.clone(), up(2), up(8), up(20).addScaledVector(h, 3), up(60).addScaledVector(h, 20)], false, "centripetal"); }
  return sailPath(THREE, at, heading, o); /* water */
}
/* an arrival path for a vehicle style, ending at `at` */
export function arrivePath(THREE, style, at, heading, o = {}) {
  const h = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
  if (style === "rotor") return touchdownPath(THREE, at, heading, o);
  if (style === "plane") return o.runwayEnd ? landingPath(THREE, at, o.runwayEnd, heading, o) : landingPath(THREE, at.clone().addScaledVector(h, 3), at, heading, o);
  if (style === "rocket") { const up = (y) => at.clone().setY(at.y + y); return new THREE.CatmullRomCurve3([up(50).addScaledVector(h, 12), up(16).addScaledVector(h, 2), up(5), up(1.2), at.clone()], false, "centripetal"); }
  return dockPath(THREE, at, heading, o);
}
