---
name: cv-application
description: Create, bootstrap, and generate job-specific CV applications for any candidate. Use when Codex needs to set up a CV application repository, create a tailored CV from a job description, update reusable candidate knowledge, or render an application config.json to HTML.
---

# CV Application

Use an application-first repository layout. Reusable candidate truth lives in `knowledge/`; each job-specific application lives in `applications/<slug>/`. There is no separate general CV source.

## Preflight

Before bootstrap or generation, run the bundled setup script for the current OS:

```bash
sh <skill-dir>/scripts/setup.sh
```

```powershell
& "<skill-dir>\scripts\setup.ps1"
```

Setup verifies Node.js and npm, then installs the bundled script dependencies from `<skill-dir>/scripts/package-lock.json`. It does not install system packages.

## Bootstrap

For a new repository, create the standard scaffold before starting an application:

```bash
node <skill-dir>/scripts/bootstrap/main.js .
```

Bootstrap creates missing `knowledge/` and `applications/` files, appends the generated CV ignore rule to `.gitignore` when needed, and never overwrites existing candidate facts.

## Workflow

1. Bootstrap the repository if `knowledge/` or `applications/` is missing.
2. Create `applications/<slug>/`.
3. Save the job description exactly as provided in `applications/<slug>/job.md`.
4. Read the relevant files under `knowledge/` and compare the job requirements with known evidence.
5. Interview the user only for missing, high-value facts: metrics, scope, leadership examples, stakeholder stories, gaps, and role-specific evidence.
6. Add reusable truth to `knowledge/`. Keep job-specific positioning in `applications/<slug>/strategy.md`.
7. Record interview notes in `applications/<slug>/interview.md`.
8. Create `applications/<slug>/config.json` using `references/config-schema.md`.
9. Generate HTML next to the JSON:

```bash
node <skill-dir>/scripts/generate/main.js applications/<slug>/config.json
```

10. Verify `applications/<slug>/cv.html` exists and contains the tailored summary, experience, skills, languages, and contact links.

## Application Files

Each application folder should contain:

```text
applications/<slug>/
|-- job.md
|-- strategy.md
|-- interview.md
|-- config.json
`-- cv.html
```

`cv.html` is generated and should not be committed.

## Rules

- Do not invent candidate facts. Use `knowledge/` or interview the user.
- Keep application-specific claims, phrasing, ATS keywords, and gap handling in the application folder.
- Keep reusable facts, newly remembered metrics, and durable career history in `knowledge/`.
- Generated `cv.html` files are local artifacts and should not be committed.
- Keep older experience concise unless the job explicitly needs it.
- Keep claims evidence-backed, specific, and honest about gaps.
- Prefer user confirmation before adding durable knowledge that goes beyond the source files.

## References

- Config schema: `references/config-schema.md`
- Knowledge base structure: `references/knowledge-base.md`
- Interview prompts: `references/interview-checklist.md`
