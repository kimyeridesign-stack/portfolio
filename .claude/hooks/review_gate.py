"""끝내기 직전(Stop)에 도는 관문. 화면을 고쳤는데 평가를 안 했으면 종료 코드 2로 막는다."""
import json, os, sys
root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
sys.path.insert(0, os.path.join(root, ".claude", "tools"))
from state import site_state, has_changes, MARK

try:
    data = json.load(sys.stdin)
except Exception:
    data = {}
# 한 번 막았는데도 또 멈추려 하면 보내 준다(무한 반복 방지)
if data.get("stop_hook_active") or not has_changes(root):
    sys.exit(0)
try:
    done = open(os.path.join(root, MARK)).read().strip() == site_state(root)
except OSError:
    done = False
if done:
    sys.exit(0)

sys.stderr.write(
    "화면을 고쳤는데 최신 상태로 평가하지 않았어요. 끝내기 전에:\n"
    "1. python3 .claude/tools/shoot.py 고친페이지.html  (데스크톱·모바일 캡처 + 깨진 이미지·오류·넘침 검사)\n"
    "2. /tmp/review의 캡처를 직접 열어 보고, .claude/design-feedback.md의 기준과 예리 피드백으로 하나씩 평가\n"
    "3. 걸리는 게 있으면 고치고 1부터 다시(최대 3번)\n"
    "4. 예리에게 결과 보고: 고친 것, 남은 고민, 예리가 봐 줬으면 하는 것\n"
)
sys.exit(2)
