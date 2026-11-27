"""사이트를 데스크톱·모바일로 찍고, 깨진 이미지·콘솔 오류·가로 넘침을 함께 보고한다.
사용: python3 .claude/tools/shoot.py [페이지 ...]   (기본: 전체 페이지)
결과: /tmp/review/<페이지>-<기기>.png
"""
import http.server, socketserver, threading, os, sys, functools
from playwright.sync_api import sync_playwright

ROOT = os.environ.get("CLAUDE_PROJECT_DIR") or os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = "/tmp/review"
PAGES = sys.argv[1:] or ["index.html", "wheel.html", "works.html", "about.html", "work.html?p=social-content"]
DEVICES = {"desktop": dict(viewport={"width": 1920, "height": 1080}),
           "mobile": dict(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)}
os.makedirs(OUT, exist_ok=True)

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
handler.log_message = lambda *a: None
srv = socketserver.TCPServer(("127.0.0.1", 0), handler)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

# 외부 사이트(구글 폰트·jsdelivr)가 막힌 클라우드 환경용: 같은 파일을 npm에서 받아 대신 끼워 넣는다
VENDOR = "/tmp/review-vendor"
PKGS = {"three": "three@0.170.0", "fontsource-inter": "@fontsource/inter", "fontsource-ibm-plex-sans-kr": "@fontsource/ibm-plex-sans-kr",
        "fontsource-dm-mono": "@fontsource/dm-mono", "fontsource-newsreader": "@fontsource/newsreader"}
FONT_CSS = ["fontsource-inter/%s.css" % w for w in (300, 400, 500, 700)] + \
           ["fontsource-ibm-plex-sans-kr/%s.css" % w for w in (400, 500, 700)] + \
           ["fontsource-dm-mono/%s.css" % w for w in (400, 500)] + ["fontsource-newsreader/300.css"]
use_vendor = bool(os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy"))
if use_vendor:
    import subprocess
    os.makedirs(VENDOR, exist_ok=True)
    for d, spec in PKGS.items():
        if not os.path.isdir(os.path.join(VENDOR, d)):
            out = subprocess.run(["npm", "pack", "-s", spec], cwd=VENDOR, check=True, capture_output=True, text=True).stdout
            tgz = os.path.join(VENDOR, out.strip().splitlines()[-1])
            os.makedirs(os.path.join(VENDOR, d))
            subprocess.run(["tar", "xzf", tgz, "-C", os.path.join(VENDOR, d), "--strip-components=1"], check=True)
    class VH(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            super().end_headers()
        def log_message(self, *a):
            pass
    vh = functools.partial(VH, directory=VENDOR)
    vsrv = socketserver.TCPServer(("127.0.0.1", 0), vh)
    vport = vsrv.server_address[1]
    threading.Thread(target=vsrv.serve_forever, daemon=True).start()
    FONTS = "".join('@import url("http://127.0.0.1:%d/%s");\n' % (vport, c) for c in FONT_CSS)

def wire(ctx):
    if not use_vendor:
        return
    ctx.route("**/fonts.googleapis.com/**", lambda r: r.fulfill(status=200, content_type="text/css", body=FONTS))
    ctx.route("**/fonts.gstatic.com/**", lambda r: r.abort())
    ctx.route("**/cdn.jsdelivr.net/npm/three@*/build/three.module.min.js",
              lambda r: r.fulfill(path=os.path.join(VENDOR, "three/build/three.module.min.js"), content_type="text/javascript"))

report = []
with sync_playwright() as pw:
    # 프록시를 거쳐야 하는 환경이면 브라우저도 같은 프록시를 쓴다(로컬 주소는 제외)
    px = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    kw = {"proxy": {"server": px, "bypass": "127.0.0.1,localhost"}} if px else {}
    try:
        browser = pw.chromium.launch(**kw)
    except Exception:
        browser = pw.chromium.launch(executable_path="/usr/bin/google-chrome", **kw)
    for dev, opts in DEVICES.items():
        ctx = browser.new_context(**opts)
        wire(ctx)
        for page_name in PAGES:
            pg = ctx.new_page()
            errs = []
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(f"http://127.0.0.1:{port}/{page_name}", wait_until="networkidle")
            pg.wait_for_timeout(1200)
            # 지연 로딩 이미지까지 불러오게 끝까지 스크롤
            pg.evaluate("async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0)}")
            pg.wait_for_timeout(600)
            broken = pg.evaluate("[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src'))")
            overflow = pg.evaluate("document.documentElement.scrollWidth - innerWidth")
            name = page_name.replace(".html", "").replace("?p=", "-")
            path = f"{OUT}/{name}-{dev}.png"
            pg.screenshot(path=path, full_page=page_name != "wheel.html")
            line = f"[{dev}] {page_name} → {path}"
            if broken: line += f"\n  깨진 이미지: {broken}"
            if errs: line += f"\n  콘솔 오류: {errs[:5]}"
            if overflow > 1: line += f"\n  가로로 {overflow}px 넘침"
            report.append(line)
            pg.close()
        ctx.close()
    browser.close()
srv.shutdown()
print("\n".join(report))

# 평가용으로 찍은 상태를 기록(끝내기 관문이 확인함). 이후 또 고치면 다시 찍어야 한다.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from state import site_state, MARK
with open(os.path.join(ROOT, MARK), "w") as fh:
    fh.write(site_state(ROOT))
