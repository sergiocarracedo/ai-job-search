---
description: Search for jobs across configured job portals by market. Asks for market (Denmark/Spain) and remote, then dispatches to the appropriate skill.
---

# /ai-job-scrape - Search Jobs Across Market-Specific Portals

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

Parse the user's response and dispatch to the relevant skills/CLI tools in parallel.

### Denmark
```bash
cd .agents/skills/jobindex-search/cli && bun run src/cli.ts search --query "<Priority-1 keywords from .agents/skills/job-scraper/search-queries.md>" --jobage 14 --sort date --format json

cd .agents/skills/jobbank-search/cli && bun run src/cli.ts search --query "<Priority-1 keywords>" --jobage 14 --format json

cd .agents/skills/jobdanmark-search/cli && bun run src/cli.ts search --query "<Priority-1 keywords>" --jobage 14 --format json

cd .agents/skills/jobnet-search/cli && bun run src/cli.ts search --query "<Priority-1 keywords>" --jobage 14 --format json
```

Use Priority 1 (and optionally Priority 2) keywords from `.agents/skills/job-scraper/search-queries.md`. Extract 3-5 of the most important role/skill terms.

### Spain
```bash
cd .agents/skills/linkedin-search/cli && bun run src/cli.ts search --query "<Priority-1 keywords>" --location "Spain" --jobage 14 --format json
```

### Remote
```bash
cd .agents/skills/remoteok-search/cli && bun run src/cli.ts search --query "<Priority-1 keywords>" --format json

cd .agents/skills/weworkremotely-search/cli && bun run src/cli.ts search --query "<Priority-1 keywords>" --format json
```

**Note:** All CLI tools run TypeScript directly with `bun run` — no `bun install` step needed. `bun install` only pulls dev types and is not required at runtime.

## Step 3: Merge, Deduplicate & Present

1. Parse all JSON outputs from the tools that ran
2. Skip any tool that returned an error or empty results
3. Deduplicate: skip jobs where the URL or company+title combo already exists in `job_scraper/seen_jobs.json`
4. Skip jobs where company+role already appears in `job_search_tracker.csv`
5. Sort by fit (infer from keyword match against search-queries.md priorities)

Present:

```
## Job Search Results — YYYY-MM-DD

Found X new positions across [selected markets].

| # | Market | Fit | Title | Company | Location | Posted | URL |
|---|--------|-----|-------|---------|----------|--------|-----|
| 1 | Denmark | High | ... | ... | ... | ... | [Link](...) |
```

After presenting, ask:
> "Want me to evaluate any of these in detail? Just give me the number(s)."

If the user picks a number, invoke the **job-application-assistant** skill.

If the run found many new jobs (8+), also suggest `/ai-job-rank`.
