---
name: weworkremotely-search
version: 1.0.0
description: >
  Search for remote jobs on We Work Remotely (weworkremotely.com). Use whenever the user wants
  to find remote work or asks about WeWorkRemotely. Triggers on: "we work remotely", "weworkremotely",
  "wwr", "remote jobs", "work from anywhere", /ai-job-scrape remote, /ai-job-scrape remote jobs.
  Personal use only — check weworkremotely.com/robots.txt before automated scraping.
---

# We Work Remotely Search Skill

Search live remote job listings from WeWorkRemotely.com. No authentication needed.
Covers 40,000+ remote positions across all categories, updated in real time.

## When to use this skill

Invoke this skill when the user wants to:
- Find remote work opportunities (any category)
- Search for work-from-anywhere positions by keyword, role, or technology
- Get the full description of a specific job listing

## Commands

### Search job listings

```bash
bun run skills/weworkremotely-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (job title, skill, company). **Required** for meaningful results.
- `--sort <order>` — `score` (relevance, default) or `date` (newest first)
- `--page <n>` — page number (1-indexed)
- `--limit <n>` — cap total results (client-side)
- `--format json|table|plain`

### Fetch full job detail

```bash
bun run skills/weworkremotely-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Pass the job ID from search results, or the full WeWorkRemotely URL. Returns the full job description, requirements, and apply link.

## Usage examples

### Find remote Python jobs

```bash
bun run skills/weworkremotely-search/cli/src/cli.ts search \
  --query python \
  --format table
```

### Data engineer remote jobs

```bash
bun run skills/weworkremotely-search/cli/src/cli.ts search \
  --query "data engineer" \
  --sort date \
  --format table
```

### Get job detail

```bash
bun run skills/weworkremotely-search/cli/src/cli.ts detail 1234567 --format plain
```

## Output formats

| Format | Best for |
|--------|---------|
| `json` | Default — programmatic use, data processing |
| `table` | Quick human-readable overview and scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- WeWorkRemotely is a popular remote job aggregator with postings from many company career pages.
- Posting dates are relative (e.g. "2 days ago") — the CLI normalizes to absolute dates.
- Some listings may have expired; check the posting date.
