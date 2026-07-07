---
name: remoteok-search
version: 1.0.0
description: >
  Search for remote jobs on RemoteOK (remoteok.com). Use whenever the user wants to find
  remote work, work-from-anywhere positions, or explicitly asks about RemoteOK. Triggers on:
  "remote jobs", "work from anywhere", "remoteok", "remote job sites", "find remote work",
  /scrape remote, /scrape remote jobs. Personal use only — automated scraping against
  RemoteOK is at the user's own risk per RemoteOK's ToS.
---

# RemoteOK Search Skill

Search live remote job listings from RemoteOK. No authentication needed.
Covers 12,000+ remote positions across all categories, updated in real time.

## When to use this skill

Invoke this skill when the user wants to:
- Find remote work opportunities (any category)
- Search for work-from-anywhere positions by keyword, role, or technology
- Filter by location (country/region) for companies that hire globally
- Get the full description of a specific job listing

## Commands

### Search job listings

```bash
bun run skills/remoteok-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (job title, skill, company). **Required** for meaningful results.
- `--location <text>` — filter by location/region (e.g. "Europe", "US", "Germany")
- `--sort <order>` — `score` (relevance, default) or `date` (newest first)
- `--page <n>` — page number (1-indexed, 20 results per page)
- `--limit <n>` — cap total results (client-side)
- `--format json|table|plain`

### Fetch full job detail

```bash
bun run skills/remoteok-search/cli/src/cli.ts detail <id> [--format json|plain]
```

`id` is the job ID from `search` results. Returns the full job description, requirements, apply link, and salary if listed.

## Usage examples

### Find remote Python jobs

```bash
bun run skills/remoteok-search/cli/src/cli.ts search \
  --query python \
  --format table
```

### Data engineer remote jobs, sorted by date

```bash
bun run skills/remoteok-search/cli/src/cli.ts search \
  --query "data engineer" \
  --sort date \
  --format table
```

### Remote jobs in Europe

```bash
bun run skills/remoteok-search/cli/src/cli.ts search \
  --query developer \
  --location Europe \
  --format json
```

## Output formats

| Format | Best for |
|--------|---------|
| `json` | Default — programmatic use, data processing |
| `table` | Quick human-readable overview and scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- Data from RemoteOK's public JSON API — no credentials required.
- RemoteOK aggregates from many sources, so postings may link to original job boards.
- Some postings are for specific time zones or regions — check the location field.
- Posting dates are relative (e.g. "2 days ago") — the CLI normalizes to absolute dates.
