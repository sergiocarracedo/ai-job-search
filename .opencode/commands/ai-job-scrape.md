---
description: Search for jobs across configured job portals by market. Asks for market (Denmark/Spain) and remote, then dispatches to the appropriate skill.
---

# /scrape - Search Jobs Across Market-Specific Portals

You are searching for jobs across configured job portals. Follow this workflow:

## Step 1: Ask User for Market

Use the **AskUserQuestion** tool to ask:

> **Which market(s) do you want to search?** (Select one or more)
> - **Denmark** — Jobindex, Jobbank, Jobdanmark, Jobnet
> - **Spain** — LinkedIn (filtered to Spain)
> - **Remote** — RemoteOK + We Work Remotely
>
> Reply with the option(s) you want, separated by commas (e.g. "Denmark, Remote").

Wait for the user's response before continuing.

## Step 2: Parse Response and Dispatch

Parse the user's response and dispatch to the relevant skills/CLI tools:

### Denmark
Run the following in parallel:
```bash
# Jobindex
cd .agents/skills/jobindex-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<keywords from search-queries.md>" --jobage 14 --sort date --format json

# Jobbank
cd .agents/skills/jobbank-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<keywords>" --jobage 14 --format json

# Jobdanmark
cd .agents/skills/jobdanmark-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<keywords>" --jobage 14 --format json

# Jobnet
cd .agents/skills/jobnet-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<keywords>" --jobage 14 --format json
```

Use keywords from `.agents/skills/job-scraper/search-queries.md` (Priority 1 and 2 categories).

### Spain
```bash
cd .agents/skills/linkedin-search/cli && bun run src/cli.ts search --query "<keywords>" --location "Spain" --jobage 14 --format json
```

### Remote
```bash
# RemoteOK
cd .agents/skills/remoteok-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<keywords>" --format json

# We Work Remotely
cd .agents/skills/weworkremotely-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<keywords>" --format json
```

## Step 3: Deduplicate and Present Results

1. Read `job_scraper/seen_jobs.json` to exclude already-seen jobs
2. Merge results from all sources, removing exact duplicates (same title + company)
3. Present in a table sorted by fit (infer fit from keyword match against search-queries.md priorities)

```
## Job Search Results — YYYY-MM-DD

Found X new positions across [selected markets].

| # | Market | Title | Company | Location | Posted | URL |
|---|--------|-------|---------|----------|--------|-----|
```

After presenting, suggest running `/ai-job-rank` if more than ~5 jobs were found, and offer to run `/ai-job-apply` on any specific job.
