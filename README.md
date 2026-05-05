# CV Application Skill

An agent skill for building job-specific CV applications from reusable candidate evidence.

The skill helps an agent:

- bootstrap a CV application repository with `knowledge/` and `applications/`
- keep reusable candidate facts separate from job-specific positioning
- interview for missing evidence instead of inventing facts
- generate a tailored `cv.html` from an application `config.json`

## Install

Install with the Vercel Skills CLI:

```bash
npx skills add PPACI/cv-application-skill
```

Install globally for Codex:

```bash
npx skills add PPACI/cv-application-skill -g -a codex
```

List the skill without installing:

```bash
npx skills add PPACI/cv-application-skill --list
```

This repository has a root-level `SKILL.md`, so the CLI can discover the skill directly. See the [Vercel Agent Skills docs](https://vercel.com/docs/agent-resources/skills) and the [Vercel Labs Skills CLI README](https://github.com/vercel-labs/skills/blob/main/README.md) for the current CLI syntax and supported agents.

## Prerequisites

- Node.js with `npx`, or a compatible JavaScript package runner, to run the Skills CLI.
- Go to run the bundled bootstrap and HTML generator scripts.

The skill includes setup helpers that check for Go and install it through common package managers when possible:

```bash
sh scripts/setup.sh
```

```powershell
.\scripts\setup.ps1
```

Agents should request approval before running installer commands that need system or network access.

## Quick Start

After installing the skill, ask your agent:

```text
Use $cv-application to bootstrap this repo for CV applications.
```

Then provide a job description and ask for a tailored application:

```text
Use $cv-application to create a CV application for this job description:
<paste job description>
```

The skill will create an application folder, compare the job requirements against `knowledge/`, ask for missing reusable evidence, and generate `applications/<slug>/cv.html`.

## Repository Layout

```text
knowledge/
|-- profile.md
|-- education.md
|-- projects.md
`-- experience/

applications/
`-- <application-slug>/
    |-- job.md
    |-- strategy.md
    |-- interview.md
    |-- config.json
    `-- cv.html
```

Generated `cv.html` files are local artifacts and should not be committed.

## License

MIT
