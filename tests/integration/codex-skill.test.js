import { spawn } from "node:child_process";
import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const runsRoot = join(repoRoot, "tmp", "integration-runs");

const scenarios = [
  {
    slug: "backend-platform",
    applicationSlug: "aurora-platform",
    persona: `# Fake Persona: Morgan Vale

Morgan Vale is a senior backend engineer in Lyon, France.

- Email: morgan.vale@example.test
- Phone: +33 6 00 00 00 01
- Links: https://linkedin.example.test/in/morgan-vale and https://github.example.test/morgan-vale
- Experience: led a platform team at Northstar Systems, built event-driven services, improved API latency, mentored engineers, and operated Kubernetes workloads.
- Education: MSc Computer Science, Universite de Lyon.
- Languages: English fluent, French native.
`,
    job: `# Fake Job: Senior Backend Engineer at Aurora Platform

Aurora Platform needs a senior backend engineer to design reliable distributed services, improve observability, own APIs, and mentor product engineering teams.
`,
  },
];

describe("cv-application skill with Codex CLI", () => {
  for (const scenario of scenarios) {
    test(`generates an inspectable CV for ${scenario.slug}`, async () => {
      const workspace = await createWorkspace(scenario.slug);
      const skillSource = await prepareSkillSource(workspace);

      await runCommand(
        "npx",
        [
          "--yes",
          "skills",
          "add",
          skillSource,
          "--agent",
          "codex",
          "--skill",
          "cv-application",
          "--copy",
          "--yes",
        ],
        {
          cwd: workspace,
          env: { DISABLE_TELEMETRY: "1" },
          timeout: 180_000,
        },
      );

      const skillDir = join(workspace, ".agents", "skills", "cv-application");
      await expectPath(skillDir);

      await runCommand("sh", [join(skillDir, "scripts", "setup.sh")], {
        cwd: workspace,
        timeout: 180_000,
      });

      await writeFile(join(workspace, "persona.md"), scenario.persona);
      await writeFile(join(workspace, "job.md"), scenario.job);

      await runCommand("codex", ["--version"], {
        cwd: workspace,
        timeout: 30_000,
      });

      await runCommand(
        "codex",
        [
          "--sandbox",
          "workspace-write",
          "-a",
          "never",
          "-c",
          'model_reasoning_effort="medium"',
          "-m",
          "gpt-5.3-codex-spark",
          "exec",
          "--cd",
          workspace,
          "--skip-git-repo-check",
          "--ephemeral",
          codexPrompt(scenario),
        ],
        {
          cwd: workspace,
          timeout: 600_000,
        },
      );

      const applicationDir = join(
        workspace,
        "applications",
        scenario.applicationSlug,
      );
      const cvPath = join(applicationDir, "cv.html");
      const html = await readFile(cvPath, "utf8");

      expect(html.length).toBeGreaterThan(500);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("<title");
      expect(html).toContain("<h2>Experience</h2>");
      expect(html).toContain("<h2>Education</h2>");
      expect(html).toContain("<h2>Skills</h2>");
      expect(html).toContain("<h2>Languages</h2>");
      expect(html).not.toContain("{{");

      const config = JSON.parse(
        await readFile(join(applicationDir, "config.json"), "utf8"),
      );
      expect(config.schemaVersion).toBe(1);
    });
  }
});

async function createWorkspace(slug) {
  const timestamp = new Date()
    .toISOString()
    .replaceAll(":", "")
    .replaceAll(".", "");
  const workspace = join(runsRoot, `${timestamp}-${slug}`);

  await mkdir(workspace, { recursive: true });
  return workspace;
}

async function prepareSkillSource(workspace) {
  const skillSource = join(workspace, "local-skill-source");
  const entries = [
    "SKILL.md",
    "README.md",
    "LICENSE",
    "agents",
    "assets",
    "references",
    "scripts",
  ];

  await mkdir(skillSource, { recursive: true });

  for (const entry of entries) {
    await cp(join(repoRoot, entry), join(skillSource, entry), {
      recursive: true,
      filter: (source) => !source.split("/").includes("node_modules"),
    });
  }

  return skillSource;
}

function codexPrompt(scenario) {
  return `Use $cv-application to create a complete fake CV application in this repository.

Inputs:
- Candidate facts are in persona.md.
- Job description is in job.md.
- Application slug must be ${scenario.applicationSlug}.

Requirements:
- Do not ask follow-up questions.
- The test harness has already run the installed skill setup script; do not run setup again.
- Do not execute scripts/setup.sh, setup.ps1, npm install, or npm ci inside .agents/skills/cv-application.
- Bootstrap the repository if needed.
- Create applications/${scenario.applicationSlug}/job.md, strategy.md, interview.md, config.json, and cv.html.
- Use only the fake facts in persona.md and job.md.
- Generate the CV by running the installed skill generator against applications/${scenario.applicationSlug}/config.json.
- Finish only after applications/${scenario.applicationSlug}/cv.html exists.`;
}

async function expectPath(targetPath) {
  await expect(
    stat(targetPath),
    `${basename(targetPath)} should exist at ${targetPath}`,
  ).resolves.toBeTruthy();
}

async function runCommand(command, args, options) {
  console.log(`\n[integration] cwd: ${options.cwd}`);
  console.log(`[integration] run: ${formatCommand(command, args)}`);

  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timeoutId;
    let timedOut = false;
    let settled = false;

    if (options.timeout) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, options.timeout);
    }

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      reject(error);
    });

    child.on("close", (code, signal) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);

      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }

      const details = [
        timedOut
          ? `Command timed out after ${options.timeout}ms: ${formatCommand(command, args)}`
          : `Command failed with code ${code ?? signal}: ${formatCommand(command, args)}`,
        `cwd: ${options.cwd}`,
        stdout ? `stdout:\n${stdout}` : "",
        stderr ? `stderr:\n${stderr}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      reject(new Error(details));
    });
  });
}

function formatCommand(command, args) {
  const formattedArgs = args.map((arg) => {
    if (arg.length <= 180) {
      return arg;
    }

    return `${arg.slice(0, 177)}...`;
  });

  return [command, ...formattedArgs].join(" ");
}
