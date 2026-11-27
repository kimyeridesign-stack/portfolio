/* 첫 화면 3D 이미지 휠: 스크롤·드래그로 돌고, 앞에 온 작업의 제목이 바뀌고, 누르면 작업으로 들어간다. */
import * as THREE from "three";

const P = (window.PROJECTS || []).filter((p) => p.slug !== "kt-diary");
const bySlug = Object.fromEntries(P.map((p, i) => [p.slug, i]));

/* 패널: 프로젝트마다 2장. a = 가로/세로 비율, x = 좌우 어긋남 */
const PANELS = [
  { src: "01", slug: "social-content", a: 1.0, x: -0.18 },
  { src: "02", slug: "social-content", a: 0.75, x: 0.22 },
  { src: "03", slug: "detail-pages", a: 0.75, x: -0.1 },
  { src: "04", slug: "detail-pages", a: 0.75, x: 0.3 },
  { src: "05", slug: "cheremimaka", a: 1.31, x: -0.12 },
  { src: "06", slug: "cheremimaka", a: 1.53, x: 0.16 },
  { src: "07", slug: "kt-jinro", a: 1.32, x: -0.22 },
  { src: "08", slug: "kt-jinro", a: 1.0, x: 0.12 },
  { src: "09", slug: "welcome-kit", a: 1.78, x: -0.05 },
  { src: "10", slug: "welcome-kit", a: 1.46, x: 0.24 },
  { src: "11", slug: "event-poster", a: 0.72, x: -0.2 },
  { src: "12", slug: "event-poster", a: 0.74, x: 0.18 },
];

const N = PANELS.length;
const H = 1; // 패널 높이
const GAP = 0.16;
const STEP = (Math.PI * 2) / N;
const R = (N * (H + GAP)) / (Math.PI * 2);
const BG = new THREE.Color("#e7e7e4");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───── 렌더러 ───── */
const canvas = document.querySelector(".wh-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(BG, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
const tilt = new THREE.Group(); // 원통 전체 기울기(비스듬히 보이게)
const skew = new THREE.Group(); // 속도에 따른 비틀림
const wheel = new THREE.Group(); // 실제로 도는 원통
tilt.add(skew);
skew.add(wheel);
scene.add(tilt);

/* 패널 셰이더: 원통 뒤로 갈수록 배경색으로 흐려짐, 로딩 페이드, 호버 밝기 */
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
  uniform vec3 uBg;
  uniform float uLoad;
  uniform float uFocus;
  void main() {
    vec3 c = texture2D(uTex, vUv).rgb;
    float fade = smoothstep(-0.35, 0.95, vDepth);
    float k = mix(0.18, 1.0, fade) * uLoad;
    c = mix(c, c * 0.86 + 0.02, 1.0 - uFocus);
    gl_FragColor = vec4(mix(uBg, c, k), 1.0);
    #include <colorspace_fragment>
  }`;

/* 원통 곡면을 따라 휘어진 판 */
function bentPlane(w, h, a0) {
  const g = new THREE.PlaneGeometry(w, h, 1, 24);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const ang = a0 + y / R;
    p.setXYZ(i, p.getX(i), R * Math.sin(ang), R * Math.cos(ang));
  }
  g.computeBoundingSphere();
  return g;
}

const loader = new THREE.TextureLoader();
const meshes = PANELS.map((d, i) => {
  const w = H * d.a;
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTex: { value: null },
      uBg: { value: BG },
      uR: { value: R },
      uLoad: { value: 0 },
      uFocus: { value: 0 },
    },
  });
  const m = new THREE.Mesh(bentPlane(w, H, -i * STEP), mat);
  m.position.x = d.x;
  m.userData = { i, slug: d.slug, load: 0, focus: 0 };
  wheel.add(m);
  loader.load(`assets/img/wheel/${d.src}.webp`, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    mat.uniforms.uTex.value = t;
    m.userData.ready = true;
  });
  return m;
});

/* ───── 레이아웃 ───── */
let mobile = false;
let camDist = 5;
function layout() {
  const w = innerWidth, h = innerHeight;
  mobile = w <= 760;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // 원통을 비스듬히 돌려도 맨 앞 패널이 원하는 x에 오도록 보정
  const place = (fx, fy, ry, rz) => {
    tilt.rotation.set(0, ry, rz);
    tilt.position.set(fx - R * Math.sin(ry), fy, -R * (1 - Math.cos(ry)) * 0);
  };
  if (mobile) {
    camera.fov = 34;
    camDist = 6.6;
    place(0.06, 0.3, -0.26, 0.05);
  } else {
    camera.fov = 28;
    camDist = 4.5;
    const visW = 2 * camDist * Math.tan((14 * Math.PI) / 180) * (w / h);
    place(-0.09 * visW, 0.02, -0.42, 0.06);
  }
  camera.position.set(0, 0, R + camDist);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}
addEventListener("resize", layout);
layout();

/* ───── 회전 상태 (무게감: 목표값을 천천히 따라감) ───── */
let target = 0, cur = 0, vel = 0;
let idleT = 0;
const wrap = (v) => ((v % N) + N) % N;
const indexAt = (rot) => wrap(Math.round(rot / STEP));
function snapSoon() { clearTimeout(idleT); idleT = setTimeout(() => { target = Math.round(target / STEP) * STEP; }, 160); }

function goToPanel(i) {
  const now = Math.round(target / STEP);
  let d = wrap(i - wrap(now));
  if (d > N / 2) d -= N;
  target = (now + d) * STEP;
}

addEventListener("wheel", (e) => {
  e.preventDefault();
  const d = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
  target += Math.max(-120, Math.min(120, d)) * 0.0016;
  snapSoon();
}, { passive: false });

addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "PageDown") { goToPanel(indexAt(target) + 1); e.preventDefault(); }
  if (e.key === "ArrowUp" || e.key === "PageUp") { goToPanel(indexAt(target) - 1); e.preventDefault(); }
  if (e.key === "Enter" && document.activeElement === document.body) enter(PANELS[indexAt(cur)].slug);
});

/* 드래그 / 터치 */
let drag = null;
canvas.addEventListener("pointerdown", (e) => {
  drag = { y: e.clientY, x: e.clientX, t0: target, moved: 0, last: e.clientY, lt: performance.now(), v: 0 };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (!drag) return;
  const dy = e.clientY - drag.y;
  drag.moved = Math.max(drag.moved, Math.abs(dy), Math.abs(e.clientX - drag.x));
  const k = 3.2 / innerHeight;
  target = drag.t0 - dy * k;
  const now = performance.now();
  drag.v = (e.clientY - drag.last) / Math.max(1, now - drag.lt);
  drag.last = e.clientY; drag.lt = now;
  if (drag.moved > 6) canvas.classList.add("is-drag");
});
function endDrag(e) {
  if (!drag) return;
  const wasClick = drag.moved < 6;
  target -= drag.v * 0.45; // 손을 놓으면 관성으로 더 돎
  target = Math.round(target / STEP) * STEP;
  canvas.classList.remove("is-drag");
  drag = null;
  if (wasClick && e.type === "pointerup") pick(e);
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

/* 클릭: 앞 패널이면 진입, 아니면 그 패널로 돌림 */
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2(9, 9);
function hit(px, py) {
  ray.setFromCamera(new THREE.Vector2(px, py), camera);
  const h = ray.intersectObjects(meshes, false)[0];
  return h ? h.object : null;
}
function pick(e) {
  const m = hit((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (!m) return;
  if (m.userData.i === indexAt(cur) && Math.abs(target - cur) < 0.05) enter(m.userData.slug);
  else goToPanel(m.userData.i);
}

/* ───── UI: 리스트, 큰 제목 ───── */
const list = document.querySelector("[data-list]");
const titleEl = document.querySelector("[data-title]");
const korEl = document.querySelector("[data-kor]");
const catEl = document.querySelector("[data-cat]");
const cta = document.querySelector("[data-cta]");
const veil = document.querySelector("[data-veil]");

list.innerHTML = P.map((p) =>
  `<li data-slug="${p.slug}"><button type="button"><span>${p.row.title}</span></button></li>`
).join("");
list.querySelectorAll("li").forEach((li) => {
  li.querySelector("button").addEventListener("click", () => {
    const first = PANELS.findIndex((d) => d.slug === li.dataset.slug);
    if (PANELS[indexAt(target)].slug === li.dataset.slug) enter(li.dataset.slug);
    else goToPanel(first);
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
    korEl.textContent = p.kor;
    catEl.textContent = p.row.period;
    requestAnimationFrame(() => titleEl.classList.remove("is-out"));
  };
  clearTimeout(swapT);
  if (first || reduce) { put(); return; }
  titleEl.classList.add("is-out");
  swapT = setTimeout(put, 280);
}

cta.addEventListener("click", (e) => { e.preventDefault(); enter(PANELS[indexAt(cur)].slug); });

let leaving = false;
function enter(slug) {
  if (leaving) return;
  leaving = true;
  zoom.to = 1;
  setTimeout(() => veil.classList.remove("is-gone"), 260);
  setTimeout(() => { location.href = `work.html?p=${slug}`; }, 900);
}
addEventListener("pageshow", (e) => { if (e.persisted) { leaving = false; zoom.to = 0; zoom.v = 0; veil.classList.add("is-gone"); } });

/* ───── 루프 ───── */
const zoom = { v: 0, to: 0 };
let last = performance.now();
let intro = reduce ? 1 : 0;

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // 첫 진입: 원통이 한 바퀴 남짓 감기며 멈춤
  if (intro < 1) {
    intro = Math.min(1, intro + dt / 1.8);
    const e = 1 - Math.pow(1 - intro, 4);
    cur = target + (1 - e) * -Math.PI * 0.9;
  } else {
    const k = 1 - Math.pow(0.0015, dt); // 프레임과 무관한 부드러운 추종
    const prev = cur;
    cur += (target - cur) * k;
    vel = (cur - prev) / Math.max(dt, 1e-3);
  }
  wheel.rotation.x = -cur;

  // 속도에 따라 살짝 비틀림(묵직한 관성)
  const sk = Math.max(-0.12, Math.min(0.12, vel * 0.02));
  skew.rotation.z += (sk - skew.rotation.z) * 0.12;

  // 진입 줌
  zoom.v += (zoom.to - zoom.v) * (1 - Math.pow(0.002, dt));
  camera.position.z = R + camDist - zoom.v * camDist * 0.62;
  camera.updateMatrixWorld();

  const active = indexAt(cur);
  show(PANELS[active].slug);

  // 호버
  let hov = null;
  if (!drag && !matchMedia("(hover: none)").matches) hov = hit(pointer.x, pointer.y);
  canvas.classList.toggle("is-hover", !!hov);

  for (const m of meshes) {
    const u = m.material.uniforms, d = m.userData;
    if (d.ready) d.load = Math.min(1, d.load + dt * 1.6);
    const on = PANELS[m.userData.i].slug === PANELS[active].slug || m === hov ? 1 : 0;
    d.focus += (on - d.focus) * 0.08;
    u.uLoad.value = d.load * d.load * (3 - 2 * d.load);
    u.uFocus.value = d.focus;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame((t) => { last = t; tick(t); veil.classList.add("is-gone"); });
