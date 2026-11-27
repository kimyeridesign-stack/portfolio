// 파일을 고칠 때마다 자동으로 도는 검사.
// 문제가 있으면 종료 코드 2로 끝내서, 리리가 내용을 보고 바로 다시 고치게 한다.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let input = {};
try { input = JSON.parse(fs.readFileSync(0, "utf8")); } catch (e) {}
const file = (input.tool_input && input.tool_input.file_path) || "";
const rel = path.relative(root, path.resolve(root, file)).split(path.sep).join("/");
const problems = [];

// 1) 자바스크립트 문법 검사
if (rel.startsWith("assets/js/") && rel.endsWith(".js")) {
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  const isModule = /^\s*import\s/m.test(src);
  try {
    execFileSync(process.execPath, ["--check", ...(isModule ? ["--input-type=module"] : []), ...(isModule ? [] : [path.join(root, rel)])],
      { input: isModule ? src : undefined, stdio: ["pipe", "pipe", "pipe"] });
  } catch (e) {
    problems.push(rel + " 문법 오류:\n" + String(e.stderr || e.message).trim().split("\n").slice(0, 4).join("\n"));
  }
}

// 2) data.js에 적힌 이미지가 실제로 있는지
if (rel === "assets/js/data.js" && !problems.length) {
  const text = fs.readFileSync(path.join(root, rel), "utf8");
  const names = new Set((text.match(/"[a-z][a-z0-9-]*\/[a-z0-9-]+"/g) || []).map((s) => s.slice(1, -1)));
  const missing = [...names].filter((n) => !fs.existsSync(path.join(root, "assets/img", n + ".webp")));
  if (missing.length) problems.push("data.js에 적었는데 assets/img에 없는 이미지:\n- " + missing.map((n) => n + ".webp").join("\n- "));
}

// 3) css·js를 고쳤으면 html의 ?v= 숫자를 올리라고 알려 주기(막지는 않음)
if (/^assets\/(css|js)\//.test(rel)) {
  console.log(rel + "를 고쳤어요. 이 파일을 불러오는 html의 ?v= 숫자를 올렸는지 확인하세요.");
}

if (problems.length) {
  console.error(problems.join("\n\n"));
  process.exit(2);
}
process.exit(0);
