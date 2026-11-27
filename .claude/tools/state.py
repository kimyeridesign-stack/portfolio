"""사이트 파일(html·assets)의 현재 상태를 지문(해시)으로 만든다. 평가 후 다시 고쳤는지 알아보는 데 쓴다."""
import hashlib, os, subprocess

def site_state(root):
    run = lambda *a: subprocess.run(["git", "-C", root, *a], capture_output=True).stdout
    h = hashlib.sha256(run("diff", "HEAD", "--", "*.html", "assets"))
    for f in sorted(run("ls-files", "--others", "--exclude-standard", "--", "*.html", "assets").decode().split("\n")):
        if f:
            h.update(f.encode())
            with open(os.path.join(root, f), "rb") as fh:
                h.update(fh.read())
    return h.hexdigest()

def has_changes(root):
    out = subprocess.run(["git", "-C", root, "status", "--porcelain", "--", "*.html", "assets"], capture_output=True).stdout
    return bool(out.strip())

MARK = ".claude/.reviewed"
