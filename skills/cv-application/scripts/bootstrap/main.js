#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const generatedCVIgnoreRule = "applications/*/cv.html";

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) {
    throw new Error("usage: node scripts/bootstrap/main.js [repo-root]");
  }

  const repoRoot = path.resolve(args[0] || ".");
  const scaffoldDir = scaffoldPath();

  copyScaffold(scaffoldDir, repoRoot);
  ensureGitignore(repoRoot);

  console.log(`CV application repository scaffold ready at ${repoRoot}`);
}

function scaffoldPath() {
  const skillDir = path.resolve(__dirname, "..", "..");
  const targetPath = path.join(skillDir, "assets", "scaffold");
  fs.statSync(targetPath);
  return targetPath;
}

function copyScaffold(scaffoldDir, repoRoot, currentDir = scaffoldDir) {
  for (const entry of listEntries(currentDir)) {
    const sourcePath = path.join(currentDir, entry);
    const rel = path.relative(scaffoldDir, sourcePath);
    const targetPath = path.join(repoRoot, rel);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true, mode: 0o755 });
      copyScaffold(scaffoldDir, repoRoot, sourcePath);
      continue;
    }

    if (exists(targetPath)) {
      console.log(`skip existing ${toSlash(rel)}`);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true, mode: 0o755 });
    fs.copyFileSync(sourcePath, targetPath);
    fs.chmodSync(targetPath, 0o644);
    console.log(`create ${toSlash(rel)}`);
  }
}

function listEntries(dir) {
  return fs.readdirSync(dir).sort();
}

function ensureGitignore(repoRoot) {
  const targetPath = path.join(repoRoot, ".gitignore");
  let content = "";

  try {
    content = fs.readFileSync(targetPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    fs.writeFileSync(
      targetPath,
      `# Generated CV artifacts\n${generatedCVIgnoreRule}\n`,
      { mode: 0o644 },
    );
    console.log("create .gitignore rule");
    return;
  }

  if (hasIgnoreRule(content, generatedCVIgnoreRule)) {
    console.log("skip existing .gitignore rule");
    return;
  }

  let appendix = "";
  if (content.length > 0) {
    if (!content.endsWith("\n")) {
      appendix += "\n";
    }
    appendix += "\n";
  }
  appendix += `# Generated CV artifacts\n${generatedCVIgnoreRule}\n`;

  fs.appendFileSync(targetPath, appendix);
  console.log("append .gitignore rule");
}

function hasIgnoreRule(content, rule) {
  return content.split("\n").some((line) => line.trim() === rule);
}

function exists(targetPath) {
  try {
    fs.statSync(targetPath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function toSlash(targetPath) {
  return targetPath.split(path.sep).join("/");
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
