# Setup Guide

Step-by-step instructions for getting the AI Job Search framework running.

## 1. Prerequisites

### Claude Code

Install Claude Code (Anthropic's CLI for Claude):

```bash
npm install -g @anthropic-ai/opencode-code
```

You'll need an Anthropic API key or a Claude Pro/Team subscription. See the [Claude Code docs](https://docs.anthropic.com/en/docs/opencode-code) for details.

### Python

Python 3.10+ is required for the salary lookup tool. Check with:

```bash
python --version
```

On Windows, `py --version` is often the most reliable check if `python` is not on your PATH.

### Bun (for job search tools)

The job portal CLIs (four Danish portals plus the country-agnostic LinkedIn tool) are written in TypeScript and run with Bun.

- macOS/Linux:

```bash
curl -fsSL https://bun.sh/install | bash
```

- Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://bun.sh/install.ps1 | iex"
```

If you prefer a package manager, `winget install Oven-sh.Bun` also works on Windows.

### LaTeX (for compiling CVs and cover letters)

Install a LaTeX distribution to compile the generated `.tex` files to PDF:

- **Windows:** [MiKTeX](https://miktex.org/download)
- **macOS:** [MacTeX](https://tug.org/mactex/)
- **Linux:** `sudo apt install texlive-full` or `sudo dnf install texlive-scheme-full`

The CV compiles with `lualatex` (pdflatex often fails on modern MiKTeX installs with `fontawesome5` font-expansion errors). The cover letter compiles with `xelatex` because `cover.cls` requires `fontspec` for its custom Lato/Raleway fonts.

### Optional: pdftotext (for the ATS check)

`/ai-job-apply` runs an ATS parseability check on the compiled CV: it extracts the PDF's text layer and verifies contact details, reading order, and keyword coverage the way an applicant-tracking system sees them. This uses `pdftotext` from [poppler](https://poppler.freedesktop.org/), which is not part of TeX distributions:

- **macOS:** `brew install poppler`
- **Debian/Ubuntu:** `sudo apt install poppler-utils`
- **Windows:** `choco install poppler`

If `pdftotext` is missing, `/ai-job-apply` skips the mechanical check with a warning and falls back to a visual keyword review — everything else works normally.

## 2. Fork and clone

```bash
gh repo fork sergiocarracedo/ai-job-search --clone
cd ai-job-search
```

Or manually: fork on GitHub, then clone your fork.

## 3. Install job search CLI dependencies
Run these from the repository root.

- PowerShell:

```powershell
$tools = @("jobbank-search", "jobdanmark-search", "jobindex-search", "jobnet-search", "linkedin-search")
foreach ($tool in $tools) {
  Set-Location ".agents/skills/$tool/cli"
  bun install
  Set-Location "..\..\..\.."
}
```

- Bash / zsh / Git Bash:
```bash
for tool in jobbank-search jobdanmark-search jobindex-search jobnet-search linkedin-search; do
  cd .agents/skills/$tool/cli && bun install && cd ../../../..
done
```

For `linkedin-search` the install is optional: it has zero runtime dependencies and runs with plain `bun`; `bun install` only pulls TypeScript dev types.

If you're outside Denmark, you can generate an equivalent search skill for your local job board with `/ai-job-add-portal` — it scaffolds the same CLI structure for any public portal and test-runs a live query before registering. See the "Job search tools" section in the README.

## 4. Run the setup interview

Start Claude Code in the repository:

```bash
opencode
```

Then run the onboarding:

```
/ai-job-setup
```

opencode will offer three paths:

- **Path A (documents folder):** Add your CV, LinkedIn export, diplomas, references, or past applications under `documents/`. opencode reads and cross-references them before proposing profile updates. This is best when you have several source files.
- **Path B (single CV import):** Share one CV/resume by mentioning the file with `@` or pasting the text. opencode extracts it and asks follow-up questions for anything missing.
- **Path C (interview mode):** Answer structured interview questions section by section.

All three paths produce the same result: fully populated profile files.

### What gets populated

| File | Content |
|------|---------|
| `AGENTS.md` | Your full candidate profile |
| `01-candidate-profile.md` | Structured education, experience, skills |
| `02-behavioral-profile.md` | Behavioral assessment |
| `04-job-evaluation.md` | Personalized skill match areas and career goals |
| `05-cv-templates.md` | Profile statement templates for your background |
| `07-interview-prep.md` | STAR examples from your experience |
| `cv/main_example.tex` | Your LaTeX CV with actual details |
| `search-queries.md` | Job search queries for `/ai-job-scrape` |

### Re-running setup

You can update specific sections later:

```
/ai-job-setup --section skills
/ai-job-setup --section experience
/ai-job-setup --section search
```

The `--section search` option is especially useful as your priorities evolve. It re-runs the search configuration interview and suggests role types you may not have considered based on your full profile.

## 5. Optional: Set up salary benchmarking

If you have salary data (from a union, salary survey, Glassdoor, or personal research):

1. **Option A:** Create `salary_data.json` manually in the repo root (see `tools/README_SALARY_TOOL.md` for the format)
2. **Option B:** Convert from Excel:
   ```bash
   pip install openpyxl
   python tools/convert_salary_excel.py path/to/salary-data.xlsx --source "My Salary Data 2025"
   ```

This creates `salary_data.json` which the `/ai-job-apply` workflow uses for salary benchmarking. If you skip this step, salary lookup is simply omitted.

## 6. Test the workflow

Find a job posting you're interested in, then:

```
/ai-job-apply https://jobindex.dk/job/1234567
```

Or paste the job description directly:

```
/ai-job-apply [paste job posting text here]
```

opencode will:
1. Evaluate the fit against your profile
2. Ask if you want to proceed
3. Draft a tailored CV and cover letter
4. Have a reviewer agent critique the drafts
5. Revise and present the final output

## 7. Compile your documents

After `/ai-job-apply` creates the LaTeX files:

```bash
# Bash / zsh / Git Bash
cd cv && lualatex main_<company>.tex && cd ..
cd cover_letters && xelatex cover_<company>_<role>.tex && cd ..
```

```powershell
# PowerShell
Set-Location cv; lualatex main_<company>.tex; Set-Location ..
Set-Location cover_letters; xelatex cover_<company>_<role>.tex; Set-Location ..
```

These commands apply to the stock templates (moderncv CV, `cover.cls` cover letter). If you'd rather use your own LaTeX template, run `/ai-job-add-template` — it captures the template's compile engine, fonts, style rules, and page limit, test-compiles it, and wires it into `/ai-job-apply`. See the "LaTeX templates" section in the README.

## Troubleshooting

### "salary_data.json not found"
This is expected if you haven't set up salary benchmarking. The `/ai-job-apply` workflow skips this step automatically.

### Job search CLI tools not working
Make sure Bun is installed and you ran `bun install` in each CLI directory. The tools require network access to fetch job listings.

### LaTeX compilation errors
- CV: uses `lualatex` (pdflatex often fails on modern MiKTeX with `fontawesome5` font-expansion errors; lualatex handles the same sources cleanly)
- Cover letter: uses `xelatex` (for custom fonts in `OpenFonts/fonts/`)
- Make sure your LaTeX distribution includes the `moderncv` package

### Fonts not found in cover letter
The cover letter template expects fonts in `cover_letters/OpenFonts/fonts/`. Make sure this directory exists and contains the Lato and Raleway font files.

### Stale `.opencode/settings.local.json` from an older clone
opencode permissions now live in `opencode.json` at the repo root. Earlier versions of this repo committed a broader `.opencode/settings.local.json` that pre-approved `Bash(curl:*)`, `Bash(python:*)` and `Bash(bun:*)`. If you cloned before that change, git leaves the old file behind in your working copy. Delete it:

```bash
rm .opencode/settings.local.json
```
