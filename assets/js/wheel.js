/* 첫 화면: 작업 카드가 원형 링으로 돈다 (grail 구조).
   가운데 줄 12장 = 프로젝트당 2장, 앞에 온 카드의 작업 제목이 위에 크게 바뀌고, 누르면 그 작업으로 들어간다.
   위·아래 줄은 같은 작업들의 다른 컷이 다른 속도로 돌아 공간감을 만든다. */
import * as THREE from "three";

const P = window.PROJECTS || [];
const bySlug = Object.fromEntries(P.map((p, i) => [p.slug, i]));

/* 가운데 줄: 프로젝트당 2장 */
const MID = [
  ["01", "social-content"], ["02", "social-content"],
  ["03", "detail-pages"], ["04", "detail-pages"],
  ["05", "cheremimaka"], ["06", "cheremimaka"],
  ["07", "kt-jinro"], ["08", "kt-jinro"],
  ["09", "welcome-kit"], ["10", "welcome-kit"],
  ["11", "event-poster"], ["12", "event-poster"],
];
/* 위·아래 줄: 추가 컷 */
const TOP = [["e01", "social-content"], ["e05", "detail-pages"], ["e06", "cheremimaka"], ["e08", "kt-jinro"], ["e09", "welcome-kit"], ["e11", "event-poster"]];
const BOT = [["e02", "social-content"], ["e03", "social-content"], ["e07", "cheremimaka"], ["e10", "welcome-kit"], ["e12", "event-poster"], ["e04", "social-content"]];

const N = MID.length;
const STEP = (Math.PI * 2) / N;
const CW = 0.9, CH = 1.2; // 카드 크기 (3:4)
const R = 2.6; // 링 반지름
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───── 렌더러 (배경 투명: 뒤의 큰 제목이 카드 사이로 보이게) ───── */
const canvas = document.querySelector(".wh-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
const world = new THREE.Group(); // 전체 기울기 + 속도 흔들림
scene.add(world);

/* 카드 셰이더: 둥근 모서리, 이미지 cover 크롭, 뒷면은 무지 카드, 링 뒤쪽은 옅게 */
const vert = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;
  uniform float uR;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vDepth = wp.z / uR;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const frag = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;
  uniform sampler2D uTex;
  uniform float uImgA;
  uniform float uCardA;
  uniform float uLoad;
  uniform float uFocus;
  uniform float uFar;
  uniform vec3 uBack;
  float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  void main() {
    vec2 p = (vUv - 0.5) * vec2(uCardA, 1.0);
    float d = rbox(p, vec2(uCardA * 0.5, 0.5), 0.035);
    float aa = fwidth(d);
    float alpha = 1.0 - smoothstep(-aa, aa, d);
    if (alpha < 0.01) discard;

    vec2 uv = vUv - 0.5;
    if (uImgA > uCardA) uv.x *= uCardA / uImgA; else uv.y *= uImgA / uCardA;
    uv += 0.5;
    if (!gl_FrontFacing) uv.x = 1.0 - uv.x;
    vec3 img = texture2D(uTex, uv).rgb;
    vec3 c = gl_FrontFacing ? img : mix(uBack, img, 0.12);
    c = mix(uBack, c, uLoad);
    c = mix(c * 0.9 + 0.035, c, uFocus);

    float near = smoothstep(-1.05, 0.55, vDepth);
    float a = alpha * mix(uFar, 1.0, near);
    gl_FragColor = vec4(c, a);
    #include <colorspace_fragment>
  }`;

const loader = new THREE.TextureLoader();
const BACK = new THREE.Color("#d8d8d3");
const geo = new THREE.PlaneGeometry(CW, CH);
const cards = [];
const tiers = [];

function makeTier(list, { radius, y, scale, offset, speed, jitter, far }) {
  const g = new THREE.Group();
  g.position.y = y;
  world.add(g);
  const n = list.length;
  list.forEach(([src, slug], i) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
      uniforms: {
        uTex: { value: null }, uImgA: { value: 1 }, uCardA: { value: CW / CH },
        uLoad: { value: 0 }, uFocus: { value: 0 }, uFar: { value: far }, uBack: { value: BACK }, uR: { value: R },
      },
    });
    mat.extensions = { derivatives: true };
    const m = new THREE.Mesh(geo, mat);
    const a = offset + (i / n) * Math.PI * 2;
    const yj = jitter ? Math.sin(i * 2.3 + offset * 5) * jitter : 0;
    m.position.set(Math.sin(a) * radius, yj, Math.cos(a) * radius);
    m.rotation.set(0, a, 0);
    m.rotateZ(jitter ? Math.sin(i * 1.7) * 0.07 : 0);
    m.scale.setScalar(scale);
    m.userData = { slug, mid: list === MID ? i : -1, load: 0, focus: 0, ready: false };
    g.add(m);
    cards.push(m);
    loader.load(`assets/img/wheel/${src}.webp`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      mat.uniforms.uTex.value = t;
      mat.uniforms.uImgA.value = t.image.width / t.image.height;
      m.userData.ready = true;
    });
  });
  tiers.push({ g, speed });
  return g;
}

makeTier(MID, { radius: R, y: 0, scale: 1, offset: 0, speed: 1, jitter: 0, far: 0.32 });
makeTier(TOP, { radius: R * 0.84, y: 1.42, scale: 0.62, offset: STEP * 1.3, speed: 0.72, jitter: 0.12, far: 0.22 });
makeTier(BOT, { radius: R * 0.9, y: -1.38, scale: 0.6, offset: STEP * 0.6, speed: 1.3, jitter: 0.12, far: 0.22 });

/* ───── 레이아웃 ───── */
let mobile = false;
let camDist = 6, camY = 0.9, lookY = 0;
function layout() {
  const w = innerWidth, h = innerHeight;
  mobile = w <= 760;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  if (mobile) {
    camera.fov = 36; camDist = 7.4; camY = 0.75; lookY = -0.05;
  } else {
    camera.fov = 30; camDist = 6.2; camY = 0.95; lookY = 0.12;
  }
  camera.updateProjectionMatrix();
}
addEventListener("resize", layout);
layout();
world.rotation.z = 0.035;

/* ───── 회전 상태 ───── */
let target = 0, cur = 0, vel = 0, idleT = 0;
const wrap = (v) => ((v % N) + N) % N;
const indexAt = (rot) => wrap(Math.round(rot / STEP));
function snapSoon() { clearTimeout(idleT); idleT = setTimeout(() => { target = Math.round(target / STEP) * STEP; }, 170); }
function goTo(i) {
  const now = Math.round(target / STEP);
  let d = wrap(i - wrap(now));
  if (d > N / 2) d -= N;
  target = (now + d) * STEP;
}

addEventListener("wheel", (e) => {
  e.preventDefault();
  let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (e.deltaMode === 1) d *= 32;
  target += Math.max(-120, Math.min(120, d)) * 0.0014;
  snapSoon();
}, { passive: false });

addEventListener("keydown", (e) => {
  if (["ArrowRight", "ArrowDown"].includes(e.key)) { goTo(indexAt(target) + 1); e.preventDefault(); }
  if (["ArrowLeft", "ArrowUp"].includes(e.key)) { goTo(indexAt(target) - 1); e.preventDefault(); }
  if (e.key === "Enter" && document.activeElement === document.body) enter(MID[indexAt(cur)][1]);
});

/* 드래그: 좌우(모바일은 상하도) */
let drag = null;
const pointer = new THREE.Vector2(9, 9);
canvas.addEventListener("pointerdown", (e) => {
  drag = { x: e.clientX, y: e.clientY, t0: target, moved: 0, last: e.clientX, lt: performance.now(), v: 0 };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.moved = Math.max(drag.moved, Math.abs(dx), Math.abs(dy));
  const use = Math.abs(dx) >= Math.abs(dy) ? dx : dy * 0.8;
  target = drag.t0 - use * (Math.PI * 1.1) / innerWidth;
  const now = performance.now();
  drag.v = (e.clientX - drag.last) / Math.max(1, now - drag.lt);
  drag.last = e.clientX; drag.lt = now;
  if (drag.moved > 6) canvas.classList.add("is-drag");
});
function endDrag(e) {
  if (!drag) return;
  const click = drag.moved < 6;
  target -= drag.v * 0.5;
  target = Math.round(target / STEP) * STEP;
  canvas.classList.remove("is-drag");
  drag = null;
  if (click && e.type === "pointerup") pick(e);
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

const ray = new THREE.Raycaster();
function hit(px, py) {
  ray.setFromCamera(new THREE.Vector2(px, py), camera);
  for (const h of ray.intersectObjects(cards, false)) {
    // 카드 앞면이 카메라를 향할 때만 (뒷면은 통과)
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(h.object.getWorldQuaternion(new THREE.Quaternion()));
    if (n.dot(ray.ray.direction) < 0) return h.object;
  }
  return null;
}
function pick(e) {
  const m = hit((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (!m) return;
  const { slug, mid } = m.userData;
  const activeSlug = MID[indexAt(cur)][1];
  if (mid === indexAt(cur) && Math.abs(target - cur) < 0.05) return enter(slug);
  if (mid >= 0) return goTo(mid);
  if (slug === activeSlug) return enter(slug);
  goTo(MID.findIndex((d) => d[1] === slug));
}

/* ───── 화면 글자 ───── */
const titleEl = document.querySelector("[data-title]");
const korEl = document.querySelector("[data-kor]");
const sumEl = document.querySelector("[data-sum]");
const foot = document.querySelector(".wh-foot");
const list = document.querySelector("[data-list]");
const cta = document.querySelector("[data-cta]");
const veil = document.querySelector("[data-veil]");

list.innerHTML = P.map((p) => `<li data-slug="${p.slug}"><button type="button">${p.row.title}</button></li>`).join("");
list.querySelectorAll("li").forEach((li) => {
  li.querySelector("button").addEventListener("click", () => {
    if (MID[indexAt(target)][1] === li.dataset.slug) enter(li.dataset.slug);
    else goTo(MID.findIndex((d) => d[1] === li.dataset.slug));
  });
});

let shown = null, swapT = 0;
function show(slug) {
  if (slug === shown) return;
  const first = shown === null;
  shown = slug;
  const p = P[bySlug[slug]];
  list.querySelectorAll("li").forEach((li) => li.classList.toggle("is-on", li.dataset.slug === slug));
  cta.href = `work.html?p=${slug}`;
  const put = () => {
    titleEl.innerHTML = p.title.split("\n").map((l) => `<span class="ln"><span>${l}</span></span>`).join("");
    titleEl.setAttribute("aria-label", p.title.replace("\n", " "));
    korEl.textContent = p.kor;
    sumEl.textContent = p.summary || "";
    requestAnimationFrame(() => { titleEl.classList.remove("is-out"); foot.classList.remove("is-out"); });
  };
  clearTimeout(swapT);
  if (first || reduce) return put();
  titleEl.classList.add("is-out");
  foot.classList.add("is-out");
  swapT = setTimeout(put, 260);
}

cta.addEventListener("click", (e) => { e.preventDefault(); enter(MID[indexAt(cur)][1]); });

const zoom = { v: 0, to: 0 };
let leaving = false;
function enter(slug) {
  if (leaving) return;
  leaving = true;
  zoom.to = 1;
  setTimeout(() => veil.classList.remove("is-gone"), 280);
  setTimeout(() => { location.href = `work.html?p=${slug}`; }, 900);
}
addEventListener("pageshow", (e) => { if (e.persisted) { leaving = false; zoom.to = 0; zoom.v = 0; veil.classList.add("is-gone"); } });

/* ───── 루프 ───── */
let last = performance.now();
let intro = reduce ? 1 : 0;
const hoverable = !matchMedia("(hover: none)").matches;

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const prev = cur;
  if (intro < 1) {
    // 첫 진입: 링이 반 바퀴 넘게 감기며 들어옴
    intro = Math.min(1, intro + dt / 2);
    const e = 1 - Math.pow(1 - intro, 4);
    cur = target - (1 - e) * Math.PI * 1.25;
  } else {
    cur += (target - cur) * (1 - Math.pow(0.002, dt)); // 무겁게 따라감
  }
  vel = (cur - prev) / Math.max(dt, 1e-3);

  for (const t of tiers) t.g.rotation.y = -cur * t.speed;
  // 빨리 돌수록 링이 살짝 눕고 가라앉음
  const lean = Math.max(-0.16, Math.min(0.16, vel * 0.03));
  world.rotation.x += (Math.abs(lean) * 0.6 - world.rotation.x) * 0.1;
  world.rotation.z += (0.035 - lean * 0.25 - world.rotation.z) * 0.1;

  zoom.v += (zoom.to - zoom.v) * (1 - Math.pow(0.002, dt));
  const dist = camDist * (1 - zoom.v * 0.5);
  camera.position.set(0, camY * (1 - zoom.v * 0.8), R + dist);
  camera.lookAt(0, lookY * (1 - zoom.v), 0);

  const active = indexAt(cur);
  const activeSlug = MID[active][1];
  show(activeSlug);

  const hov = !drag && hoverable ? hit(pointer.x, pointer.y) : null;
  canvas.classList.toggle("is-hover", !!hov);

  for (const m of cards) {
    const u = m.material.uniforms, d = m.userData;
    if (d.ready) d.load = Math.min(1, d.load + dt * 1.6);
    const on = d.slug === activeSlug || m === hov ? 1 : 0;
    d.focus += (on - d.focus) * 0.08;
    u.uLoad.value = d.load * d.load * (3 - 2 * d.load);
    u.uFocus.value = d.focus;
    // 앞 카드는 살짝 앞으로 나옴
    const lift = d.mid === active ? 1 : 0;
    m.userData.lift = (m.userData.lift || 0) + (lift - (m.userData.lift || 0)) * 0.08;
    m.scale.setScalar((d.mid >= 0 ? 1 : 0.61) * (1 + m.userData.lift * 0.08));
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame((t) => { last = t; tick(t); veil.classList.add("is-gone"); });
