---
description: Compare tracked job postings against your candidate profile to identify skill gaps and generate a prioritized learning plan with study resources.
---

# /ai-job-upskill — Skill Gap Analysis and Learning Plan

`/ai-job-upskill` analyses jobs you have tracked and your current profile to identify skill gaps, then produces a heatmap of those gaps and a learning plan with concrete, web-searched study resources and a recommended study order.

## Invocation

**`/ai-job-upskill`** — aggregate mode: analyses all jobs in `job_search_tracker.csv`

**`/ai-job-upskill <URL>`** — targeted mode: analyses a single job posting fetched from the URL

---

## Step 1: Detect Mode

Check whether `$ARGUMENTS` contains a URL:

- If `$ARGUMENTS` is empty → **aggregate mode**
- If `$ARGUMENTS` is a URL → **targeted mode**, store the URL for Step 2

## Step 2: Load Data

### Aggregate mode
1. Read `job_search_tracker.csv`. Extract all rows. Columns: `date, company, sector, role, role_type, channel, status, contact_person, fit_rating, notes, cv_file, cover_letter_file, source`
2. For each row, note `role`, `company`, and `fit_rating`. The `fit_rating` column is a 0–100 score where 100 = perfect fit.
3. Read `.agents/skills/job-application-assistant/01-candidate-profile.md` for the candidate's current skills.
4. Check `upskill/` for the most recent aggregate report (`report-YYYY-MM-DD.md`) — if one exists, note its date for the diff in Step 8.

### Targeted mode
1. Use WebFetch to retrieve the job posting from `$ARGUMENTS`.
2. Extract: job title, company, required skills, preferred skills, responsibilities.
3. Read `.agents/skills/job-application-assistant/01-candidate-profile.md` for the candidate's current skills.
4. No tracker data is used in targeted mode.

## Step 3: Hard Skill Diff

Extract required and preferred technical skills from each job source.

### Aggregate mode
Use the `role`, `sector`, and `notes` columns to infer likely required skills. Build a **skill frequency map**: count how many jobs mention each skill, then apply a **fit weight**: `(100 - fit_rating) / 100`. Lower fit jobs contribute more to the gap score.

Final score per skill: `sum of (fit_weight × occurrence)` across all jobs.

### Targeted mode
Extract the explicit required and preferred skills from the fetched posting. List required before preferred; sort alphabetically within groups.

### Diff against profile
Remove any skill already present in `01-candidate-profile.md`. Be generous — "Python" covers "Python scripting".

What remains is the **hard skill gap list**.

## Step 4: LLM Synthesis

Reason holistically about gaps the hard diff misses:

- **Domain knowledge gaps** — unfamiliarity with the industry or problem space
- **Soft skill gaps** — ways of working, communication styles, leadership expectations
- **Tooling and process gaps** — frameworks, cloud services, methodologies (MLOps, CI/CD, agile)
- **Credential gaps** — certifications listed across postings

Tag each as: `[domain]`, `[soft]`, `[tooling]`, or `[credential]`.

## Step 5: Build Gap Heatmap

| Priority | Skill / Area | Type | Gap Source |
|----------|-------------|------|------------|
| Critical | ... | Hard | ... |
| High | ... | Domain | LLM synthesis |

Priority:
- **Critical**: High-frequency hard skills, or domain gaps across most tracked jobs
- **High**: Moderate-frequency hard skills, or consistent soft/tooling gaps
- **Medium**: Lower-frequency hard skills, gaps in fewer roles
- **Low**: One-off mentions or minor nice-to-haves

Print the heatmap table before continuing.

## Step 6: Build Learning Plan

For every **Critical** and **High** gap (and **Medium** if fewer than 5 total gaps exist):

1. Run a WebSearch to find current study resources. Include the current year in the query.
2. Pick 2-3 resources: courses with hands-on labs, official docs, books. For each: name, URL, one-line reason.
3. Write a study direction tailored to the candidate's existing background.
4. Estimate time to working proficiency.

### Group by theme

```
### Cloud & Infrastructure

**Kubernetes** `[Hard]` — ~20h
- [Kubernetes for Absolute Beginners – KodeKloud](url) — hands-on labs
- [Official Kubernetes Docs](url) — reference

Study direction: You already know Docker — skip Chapter 1. Start at Pod scheduling.
```

## Step 7: Suggest Study Order

1. **Dependencies first** — if B requires A, place A before B
2. **Critical before High before Medium** within dependency tiers
3. **Quick wins early** — fast (~5h) Medium gaps that boost confidence
4. **Domain knowledge last** — study alongside practical projects

```
| # | Topic | Type | Est. Time | Note |
|---|-------|------|-----------|------|
| 1 | Kubernetes | Hard | ~20h | Required before AWS EKS |

**Total estimated time: ~Xh**
```

## Step 8: Write and Save Report

### Aggregate mode — diff section
If a previous aggregate report exists from Step 2:
- **Gaps closed**: skills in the previous heatmap now present in the candidate profile
- **New gaps**: skills in the current heatmap not in the previous report

### Save the report
- **Aggregate:** `upskill/report-YYYY-MM-DD.md`
- **Targeted:** `upskill/report-YYYY-MM-DD-<company-slug>-<role-slug>.md`

Confirm: > "Report saved to `upskill/<filename>.md`."

## Important Rules

1. **Never fabricate resources.** Only cite resources found via actual WebSearch results.
2. **Search with the current year.** Include the year in every WebSearch query.
3. **Targeted mode ignores the tracker.** Analyse only the fetched posting.
4. **Be generous with profile matching.** If a skill appears in any form in the profile, don't flag it.
5. **Print the heatmap before the learning plan.** Show it as intermediate terminal output.
6. **Omit Low-priority gaps from the learning plan.** List them in the heatmap for completeness.
