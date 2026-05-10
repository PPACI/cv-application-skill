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
npx skills add PPACI/cv-application-skill --skill cv-application
```

Install globally for Codex:

```bash
npx skills add PPACI/cv-application-skill --skill cv-application -g -a codex
```

List the skill without installing:

```bash
npx skills add PPACI/cv-application-skill --list
```

The installable skill lives in `skills/cv-application/`, separate from this repository's integration tests and package tooling. See the [Vercel Agent Skills docs](https://vercel.com/docs/agent-resources/skills) and the [Vercel Labs Skills CLI README](https://github.com/vercel-labs/skills/blob/main/README.md) for the current CLI syntax and supported agents.

## Prerequisites

- Node.js with `npm` and `npx`, or a compatible JavaScript package runner, to run the Skills CLI and bundled scripts.

The skill includes setup helpers that install the generator runtime dependencies under `scripts/`:

```bash
sh skills/cv-application/scripts/setup.sh
```

```powershell
.\skills\cv-application\scripts\setup.ps1
```

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

This source repository keeps the skill implementation under `skills/cv-application/` and the integration harness under `tests/`.

The skill creates this layout in target CV application repositories:

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
