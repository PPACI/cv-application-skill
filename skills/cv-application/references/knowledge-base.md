# Knowledge Base Structure

The knowledge base stores reusable candidate truth. Keep job-specific positioning, keywords, and gap handling in the application folder.

## Required Layout

```text
knowledge/
|-- profile.md
|-- education.md
|-- projects.md
`-- experience/
    `-- <company-or-role>.md
```

## What To Store

- `profile.md`: contact details, links, current role, reusable summary facts, durable strengths, leadership scope, and confirmed metrics.
- `education.md`: degrees, certifications, training, schools, dates, and locations.
- `projects.md`: side projects, talks, publications, open source work, portfolio links, and other reusable proof.
- `experience/*.md`: durable facts by employer, client, role, or career period.

## Rules For Updates

- Add only facts the candidate provided, confirmed, or already stored in the repository.
- Record useful context with each fact: scope, metric, dates, stakeholders, technology, constraints, and outcome.
- Keep raw interview notes in `applications/<slug>/interview.md` when they are job-specific or not yet confirmed as reusable.
- Do not make the knowledge base sound like a CV. Store evidence fragments that can be tailored later.
- If a fact is useful across multiple applications, add it to `knowledge/`. If it only helps one job, keep it in that application folder.
