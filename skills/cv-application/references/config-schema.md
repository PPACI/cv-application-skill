# CV Application Config Schema

The generator reads a single JSON file and writes `cv.html` in the same directory.

Run:

```bash
node <skill-dir>/scripts/generate/main.js applications/<slug>/config.json
```

## Contract

- `schemaVersion` must be `1`.
- `template` is optional and defaults to `default`.
- `cv.candidate.photo` is optional. When present, the path is relative to the config file unless absolute.
- `cv.sideProjects` is optional and may be omitted or empty.
- The generator is intentionally simple: all CV content must already be selected and ordered in JSON.
- Keep the JSON job-specific. Reusable facts belong in `knowledge/`.

```json
{
  "schemaVersion": 1,
  "template": "default",
  "application": {
    "slug": "application-slug",
    "company": "Hiring organization",
    "role": "Target role"
  },
  "cv": {
    "candidate": {
      "name": "Candidate Name",
      "location": "City, Country",
      "email": "candidate@example.com",
      "phone": "+00 0 00 00 00 00",
      "photo": "",
      "links": [
        { "label": "linkedin.com/in/example", "url": "https://linkedin.com/in/example" }
      ]
    },
    "summary": "Tailored professional summary.",
    "experience": [
      {
        "name": "Company",
        "location": "Location",
        "description": "Optional company context.",
        "roles": [
          {
            "title": "Role title",
            "period": "Jan 2020 - Present",
            "items": ["Selected achievement"]
          }
        ]
      }
    ],
    "sideProjects": [],
    "education": {
      "degree": "Degree",
      "school": "School",
      "period": "2013 - 2016 | City, Country"
    },
    "skills": [
      { "name": "Category", "items": ["Skill A", "Skill B"] }
    ],
    "languages": [
      { "name": "French", "level": "Native" }
    ]
  }
}
```
