/* 시안 렌더러: ?s=cover|works|about|social|cheremi  (&m=1 모바일) — 피그마 스케치용 정지 화면 */
import * as THREE from "three";

const q = new URLSearchParams(location.search);
const S = q.get("s") || "cover";
const M = q.get("m") === "1";
if (M) document.body.classList.add("m");
const P = Object.fromEntries((window.PROJECTS || []).map((p) => [p.slug, p]));
const img = (p) => `../assets/img/${p}.webp`;
const W = (n) => img(`wheel/${n}`);

const MID = ["01","02","03","04","05","06","07","08","09","10","11","12"].map(W);
const EXT = ["e01","e05","e06","e08","e09","e11"].map(W);
const EXT2 = ["e02","e03","e07","e10","e12","e04"].map(W);

/* 글자 카드 (캔버스로 그림) */
function textCard(lines, { bg = "#ffffff", fg = "#141414", accent = null, w = 600, h = 800 } = {}) {
  return { draw: (c) => {
    c.width = w; c.height = h; const g = c.getContext("2d");
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (accent) { g.fillStyle = accent; g.fillRect(0, 0, w, 14); }
    let y = 70;
    for (const [txt, size, weight, color, gap] of lines) {
      g.fillStyle = color || fg;
      g.font = `${weight || 500} ${size}px Inter, "IBM Plex Sans KR", sans-serif`;
      for (const ln of txt.split("\n")) { g.fillText(ln, 48, y + size * 0.8); y += size * 1.3; }
      y += gap ?? 18;
    }
  } };
}
function phoneCard(src) {
  return { phone: src };
}

const C = {
  cover: {
    bg: ["#f1fbf5", "#c9efd9"], head: "Design<br>Portfolio", ghost: "",
    center: textCard([
      ["Kim Yeri", 76, 600, null, 2], ["Digital & Brand Designer", 34, 400, "#555", 70],
      ["반갑습니다.\n저는 디자이너 김예리입니다", 36, 500, null, 14], ["당신의 크루가 되고 싶습니다", 36, 500, null, 14], ["지금, 포트폴리오를\n보러 갈까요?", 36, 500, null, 80],
      ["Kimyeri.design@gmail.com\n010 4224 2261", 28, 500, "#555", 0],
    ], { accent: "#4ff2a0", h: 900 }), centerA: 600 / 900,
    mid: MID, top: EXT, bot: EXT2, rot: 0,
    foot: `<div class="l"><b>브랜드의 톤을<br>일관되게 이어갑니다.</b><a class="pill"><span>View Portfolio</span><i>↗</i></a></div>
           <p class="r">9년차 디지털·브랜드 디자이너.<br>글로벌 브랜드 캠페인부터 패키지,<br>SNS 콘텐츠, 영상 제작까지<br>다양한 작업을 해왔습니다.</p>`,
  },
  works: {
    bg: ["#f3eefc", "#dccdf5"], head: "Brand Social<br>Contents",
    mid: MID, top: EXT, bot: EXT2, rot: 0, front: true,
    foot: `<div class="l"><b>소셜 콘텐츠 디자인</b><p class="r" style="justify-self:start;margin-top:8px">${P["social-content"].summary}</p></div>
           <div style="justify-self:end;display:flex;gap:40px;align-items:flex-end"><ul class="list">${Object.values(P).map((p) => `<li class="${p.slug === "social-content" ? "on" : ""}">${p.row.title}</li>`).join("")}</ul><a class="pill" style="margin:0"><span>View Project</span><i>↗</i></a></div>`,
  },
  about: {
    bg: ["#f5f3ee", "#dedad0"], head: "About", ghost: "2016–",
    center: { src: img("about/profile") }, centerA: 685 / 801,
    mid: [
      textCard([["2022.11 – 재직 중", 24, 500, "#777", 10], ["레오버넷(주)", 52, 600, null, 6], ["시니어 디지털 디자이너", 28, 400]], { accent: "#4ff2a0" }),
      W("01"),
      textCard([["2021.09 – 2022.11", 24, 500, "#777", 10], ["체레미마카", 52, 600, null, 6], ["매니저", 28, 400]]),
      W("05"),
      textCard([["2018.04 – 2021.04", 24, 500, "#777", 10], ["디자인티스트", 52, 600, null, 6], ["주임", 28, 400]]),
      W("07"),
      textCard([["2016.04 – 2017.07", 24, 500, "#777", 10], ["하비풀", 52, 600, null, 6], ["사원", 28, 400]]),
      W("09"),
      textCard([["EDUCATION", 22, 600, "#999", 18], ["한양사이버대학교", 40, 600, null, 4], ["시각디자인과", 26, 400, null, 4], ["2023.02 – 2025.02", 22, 400, "#777", 30], ["계원예술대학교", 40, 600, null, 4], ["시각디자인과", 26, 400, null, 4], ["2014.03 – 2016.02", 22, 400, "#777"]]),
      W("03"),
      textCard([["SKILLS · ADOBE", 22, 600, "#999", 24], ["Illustrator\nPhotoshop\nInDesign\nPremiere\nAfter Effects", 46, 500, null]], { bg: "#141414", fg: "#4ff2a0" }),
      W("11"),
    ],
    top: EXT, bot: EXT2, rot: 0,
    foot: `<div class="l"><b>9년차 디지털·브랜드 디자이너<br>김예리입니다.</b><div class="info"><dt>NAME</dt><dd>김예리</dd><dt>PHONE</dt><dd>010.4224.2261</dd><dt>EMAIL</dt><dd>kimyeri.design@gmail.com</dd></div></div>
           <p class="r">대행사에서 크록스, 삼성 멤버스, 애브비 에스테틱스 등 다양한 브랜드의 디지털 콘텐츠를 디자인하며, 브랜드마다 다른 톤과 목소리를 읽어내는 법을 배웠습니다. 인하우스 팀에서 브랜드를 리브랜딩하며 기획부터 제작까지 이어지는 일의 깊이를 경험했고, 하나의 브랜드를 오래 책임질 때 디자인이 더 단단해진다는 것을 알게 되었습니다.</p>`,
  },
  social: {
    bg: ["#f6f0ff", "#d9c8f7"], head: "Crocs", ghost: "",
    center: phoneCard(img("social-content/crocs-7")), centerA: 0.5,
    mid: ["social-content/crocs-2","social-content/crocs-5","social-content/crocs-6","social-content/crocs-8","social-content/crocs-3","social-content/samsung-1","social-content/abbvie-c1-1","social-content/theraflu-c-1","social-content/crocs-2","social-content/abbvie-c2-1","social-content/samsung-3","social-content/theraflu-c-2"].map(img),
    top: ["social-content/samsung-4","social-content/abbvie-c3-1","social-content/theraflu-c-3","social-content/samsung-6","social-content/abbvie-c1-2","social-content/crocs-6"].map(img),
    bot: ["social-content/theraflu-c-4","social-content/samsung-5","social-content/abbvie-c2-2","social-content/crocs-5","social-content/samsung-7","social-content/theraflu-c-5"].map(img),
    rot: 0,
    foot: `<div class="l"><b>Brand Social Contents<br>소셜 콘텐츠 디자인</b><div class="info"><dt>CLIENT</dt><dd>크록스 · 삼성 · 애브비 · 헤일리온</dd><dt>TYPE</dt><dd>릴스 · 포스트 · 카드뉴스</dd></div></div>
           <p class="r">${P["social-content"].sections[2].desc}</p>`,
  },
  cheremi: {
    bg: ["#f3eee7", "#d6c9b8"], head: "Cheremimaka", ghost: "",
    center: { src: W("05") }, centerA: 960 / 733, centerScale: 1.35,
    mid: ["cheremimaka/photo-1","cheremimaka/web","cheremimaka/logos","cheremimaka/application","cheremimaka/photo-2","cheremimaka/package","cheremimaka/photo-3","cheremimaka/hero","cheremimaka/web","cheremimaka/photo-1","cheremimaka/application","cheremimaka/photo-2"].map(img),
    top: [W("e06"), W("e07"), img("cheremimaka/photo-3"), W("e06"), img("cheremimaka/logos"), W("e07")],
    bot: [img("cheremimaka/photo-2"), W("e07"), img("cheremimaka/web"), W("e06"), img("cheremimaka/photo-1"), img("cheremimaka/package")],
    rot: 0,
    foot: `<div class="l"><b>체레미마카 리브랜딩 프로젝트</b><div class="info"><dt>PERIOD</dt><dd>2022.02 – 2022.07</dd><dt>ROLE</dt><dd>브랜드 기획 / 디렉팅 · 포토그래피 총괄 · 패키지 디자인</dd></div></div>
           <p class="r">${P["cheremimaka"].summary}</p>`,
  },
}[S];

/* DOM 글자 */
document.documentElement.style.setProperty("--bg1", C.bg[0]);
document.documentElement.style.setProperty("--bg2", C.bg[1]);
document.getElementById("head").innerHTML = C.head;
document.getElementById("ghost").textContent = C.ghost || "";
document.getElementById("foot").innerHTML = C.foot;
const navOn = { works: 0, social: 0, cheremi: 0, about: 1 }[S];
if (navOn != null) document.querySelectorAll("#nav a")[navOn].classList.add("on");

/* 3D */
const canvas = document.querySelector("canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(M ? 42 : 30, innerWidth / innerHeight, 0.1, 100);
const world = new THREE.Group(); scene.add(world);
world.rotation.z = 0.04;
world.position.y = M ? 0.55 : 0.28;

const R = 2.6 * (C.ringR || (C.center ? 1.32 : 1));
const vert = `varying vec2 vUv; varying float vD; uniform float uR; void main(){ vUv=uv; vec4 wp=modelMatrix*vec4(position,1.); vD=wp.z/uR; gl_Position=projectionMatrix*viewMatrix*wp; }`;
const frag = `varying vec2 vUv; varying float vD; uniform sampler2D uTex; uniform float uImgA, uCardA, uFar, uRad; uniform vec3 uBack;
float rb(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
void main(){ vec2 p=(vUv-.5)*vec2(uCardA,1.); float d=rb(p,vec2(uCardA*.5,.5),uRad); float aa=fwidth(d); float al=1.-smoothstep(-aa,aa,d); if(al<.01) discard;
 vec2 uv=vUv-.5; if(uImgA>uCardA) uv.x*=uCardA/uImgA; else uv.y*=uImgA/uCardA; uv+=.5; if(!gl_FrontFacing) uv.x=1.-uv.x;
 vec3 c=texture2D(uTex,uv).rgb; c=gl_FrontFacing?c:mix(uBack,c,.1);
 float n=smoothstep(-1.05,.55,vD); gl_FragColor=vec4(c, al*mix(uFar,1.,n));
#include <colorspace_fragment>
}`;

const loader = new THREE.TextureLoader();
let pending = 0;
function texFor(item, done) {
  if (typeof item === "string") { pending++; loader.load(item, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; done(t, t.image.width / t.image.height); pending--; }); return; }
  if (item.draw) { const c = document.createElement("canvas"); item.draw(c); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; done(t, c.width / c.height); return; }
  if (item.src) return texFor(item.src, done);
  if (item.phone) {
    pending++;
    const im = new Image(); im.onload = () => {
      const c = document.createElement("canvas"); c.width = 600; c.height = 1200; const g = c.getContext("2d");
      g.fillStyle = "#141414"; g.beginPath(); g.roundRect(0, 0, 600, 1200, 80); g.fill();
      g.save(); g.beginPath(); g.roundRect(22, 22, 556, 1156, 62); g.clip();
      const a = im.width / im.height, ca = 556 / 1156; let sw = im.width, sh = im.height, sx = 0, sy = 0;
      if (a > ca) { sw = im.height * ca; sx = (im.width - sw) / 2; } else { sh = im.width / ca; sy = (im.height - sh) / 2; }
      g.drawImage(im, sx, sy, sw, sh, 22, 22, 556, 1156); g.restore();
      g.fillStyle = "#141414"; g.beginPath(); g.roundRect(220, 44, 160, 40, 20); g.fill();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; done(t, 0.5); pending--;
    }; im.src = item.phone; return;
  }
}
function card(item, { w, h, rad = 0.035, far = 0.3 }) {
  const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true, side: THREE.DoubleSide,
    uniforms: { uTex: { value: null }, uImgA: { value: 1 }, uCardA: { value: w / h }, uFar: { value: far }, uRad: { value: rad }, uBack: { value: new THREE.Color("#d6d6d1") }, uR: { value: R } } });
  texFor(item, (t, a) => { mat.uniforms.uTex.value = t; mat.uniforms.uImgA.value = a; });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}
function tier(list, { radius, y, scale, offset, jitter, far }) {
  const g = new THREE.Group(); g.position.y = y; world.add(g);
  list.forEach((it, i) => {
    const a = offset + (i / list.length) * Math.PI * 2;
    const m = card(it, { w: 0.9 * scale, h: 1.2 * scale, far });
    m.position.set(Math.sin(a) * radius, jitter ? Math.sin(i * 2.3 + offset * 5) * jitter : 0, Math.cos(a) * radius);
    m.rotation.y = a; if (jitter) m.rotateZ(Math.sin(i * 1.7) * 0.07);
    g.add(m);
  });
  return g;
}
const step = (Math.PI * 2) / 12;
const gm = tier(C.mid, { radius: R, y: 0, scale: 1, offset: 0, far: 0.3 });
const gt = tier(C.top, { radius: R * 0.84, y: 1.45, scale: 0.6, offset: step * 1.3, jitter: 0.12, far: 0.2 });
const gb = tier(C.bot, { radius: R * 0.9, y: -1.3, scale: 0.6, offset: step * 0.6, jitter: 0.12, far: 0.2 });
const rot = C.front ? 0 : step * (0.5 + (C.rot || 0));
gm.rotation.y = -rot; gt.rotation.y = -rot * 0.72; gb.rotation.y = -rot * 1.3;

if (C.center) {
  const h = 1.9 * (C.centerScale || 1) * (C.centerA > 1 ? 0.62 : 1);
  const cm = card(C.center, { w: h * C.centerA, h, rad: C.center.phone ? 0.0 : 0.03, far: 1 });
  cm.position.set(0, 0.05, 0.35); cm.rotation.y = -0.18; cm.rotation.z = 0.02;
  world.add(cm);
}

const dist = M ? 6.6 : 6.6;
camera.position.set(0, M ? 0.7 : 0.95, R + dist);
camera.lookAt(0, M ? -0.15 : 0.1, 0);
function render() { renderer.render(scene, camera); }
(function loop() { render(); if (pending > 0) requestAnimationFrame(loop); else setTimeout(() => { render(); document.body.dataset.ready = "1"; }, 200); })();
