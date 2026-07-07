---
name: job-scraper
description: >
  Searches configured job portals by market and presents new matches with a fit assessment.
  Deduplicates across runs. Triggers on: /scrape, /ai-job-scrape, scrape jobs, find jobs, job search
---

# Job Scraper

---

## How It Works

This skill searches multiple job portals using the CLI tools configured in `.agents/skills/`, deduplicates against previously seen jobs and the application tracker, and presents new matches with a quick fit assessment.

## Invocation

The user triggers this skill by saying things like:
- "Find new jobs"
- "Scrape for jobs"
- "Any new positions?"
- "/scrape" or "/ai-job-scrape"

Optional arguments:
- A market flag: `--market denmark`, `--market spain`, `--market remote`, or `--market all` (default: ask user)
- A focus area, e.g. "/scrape data science" or "/scrape geophysics"

---

## Execution Steps

### Step 0: Load State

1. Read `job_scraper/seen_jobs.json` (create if missing — start with `{"seen": {}}`)
2. Read `job_search_tracker.csv` to extract already-applied companies+roles
3. Read `.agents/skills/job-scraper/search-queries.md` for the search strategy

### Step 1: Determine Market

If `--market` is not provided, ask the user:
> **Which market(s) do you want to search?** (Select one or more)
> - **Denmark** — Jobindex, Jobbank, Jobdanmark, Jobnet
> - **Spain** — LinkedIn (filtered to Spain)
> - **Remote** — RemoteOK + We Work Remotely
> Reply with the option(s) you want, separated by commas.

Parse the response and set the market(s) to search.

### Step 2: Run Portal CLI Tools

Dispatch to the relevant CLI skills in parallel for each selected market:

**Denmark — run all in parallel:**
```bash
# Jobindex
cd .agents/skills/jobindex-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<Priority-1 keywords from search-queries.md>" --jobage 14 --sort date --format json

# Jobbank
cd .agents/skills/jobbank-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<keywords>" --jobage 14 --format json

# Jobdanmark
cd .agents/skills/jobdanmark-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<keywords>" --jobage 14 --format json

# Jobnet
cd .agents/skills/jobnet-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<keywords>" --jobage 14 --format json
```

**Spain:**
```bash
cd .agents/skills/linkedin-search/cli && bun run src/cli.ts search --query "<keywords>" --location "Spain" --jobage 14 --format json
```

**Remote:**
```bash
# RemoteOK
cd .agents/skills/remoteok-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<keywords>" --format json

# We Work Remotely
cd .agents/skills/weworkremotely-search/cli && bun install > /dev/null 2>&1 && bun run src/cli.ts search --query "<keywords>" --format json
```

Use keywords from `search-queries.md` Priority 1 and 2 categories. If the user specified a focus area, use keywords from the matching category.

### Step 3: Merge & Deduplicate

1. Parse all JSON outputs from Step 2
2. Skip any tool that returned an error or empty results
3. Deduplicate: skip jobs where the URL or company+title combo already exists in `seen_jobs.json`
4. Skip jobs where the company+role already appears in `job_search_tracker.csv`

### Step 4: Quick Fit Assessment

For each new job, do a rapid fit check (NOT the full evaluation — just a quick signal):

- **High match**: Role directly involves your core skills (Priority 1 keywords)
- **Medium match**: Role is adjacent to your experience
- **Low match**: Role requires significant skills you lack

### Step 5: Store

Add ALL fetched jobs (new and skipped) to `seen_jobs.json`:
```json
{
  "seen": {
    "<url_or_company_title_key>": {
      "title": "...",
      "company": "...",
      "url": "...",
      "first_seen": "YYYY-MM-DD",
      "fit": "high/medium/low",
      "status": "new/skipped/evaluated/ranked/expired"
    }
  }
}
```

Only present jobs NOT already in the seen list or tracker.

### Step 6: Present Results

```
## New Job Matches - YYYY-MM-DD

Found X new positions across [selected markets] (Y high, Z medium, W low match).

| # | Market | Fit | Title | Company | Location | Posted | URL |
|---|--------|-----|-------|---------|----------|--------|-----|
| 1 | Denmark | High | ... | ... | ... | ... | [Link](...) |
```

After presenting, ask:
> "Want me to evaluate any of these in detail? Just give me the number(s)."

If the user picks a number, invoke the **job-application-assistant** skill.

If the run found many new jobs (8+), also suggest `/ai-job-rank`.

### Step 7: Update Tracker (Optional)

If the user decides to apply to any job, add a row to `job_search_tracker.csv`.

---

## Important Rules

1. **Never fabricate job postings.** Only present jobs returned by actual CLI tool runs.
2. **Respect deduplication.** Always check `seen_jobs.json` AND `job_search_tracker.csv` before presenting.
3. **Focus on configured geographic area.** Skip jobs that require relocation or are outside commute range.
4. **Only open positions.** Skip postings with expired deadlines or those marked as closed.
5. **Parallel runs.** Run all portal CLIs for a given market simultaneously — do not wait for one before starting the next.
6. **Install once.** Run `bun install` before the first run per skill; subsequent runs skip the install step.
