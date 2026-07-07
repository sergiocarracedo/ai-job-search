const BASE_URL = "https://weworkremotely.com"

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

export interface Job {
  id: string
  title: string
  company: string
  location: string
  date: string
  url: string
  categories: string[]
}

export interface JobDetail extends Job {
  description: string
  apply_url: string
}

function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

function relativeToAbsoluteDate(relative: string): string {
  const num = parseInt(relative, 10)
  if (isNaN(num)) return relative
  if (relative.includes("hour")) {
    const d = new Date()
    d.setHours(d.getHours() - num)
    return d.toISOString().split("T")[0]
  }
  if (relative.includes("day")) {
    const d = new Date()
    d.setDate(d.getDate() - num)
    return d.toISOString().split("T")[0]
  }
  if (relative.includes("week")) {
    const d = new Date()
    d.setDate(d.getDate() - num * 7)
    return d.toISOString().split("T")[0]
  }
  return relative
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function clean(html: string): string {
  return decodeHtmlEntities(stripTags(html))
}

function parseJobCards(html: string): Job[] {
  const results: Job[] = []
  // Split on job card boundaries
  const chunks = html.split(/<li class="job-listing">/).slice(1)
  for (const chunk of chunks) {
    const idMatch = chunk.match(/href="\/remote-jobs\/(\d+)"/)
    if (!idMatch) continue
    const id = idMatch[1]

    const titleMatch = chunk.match(/class="title"[^>]*>([\s\S]*?)<\/a>/i)
    const title = titleMatch ? clean(titleMatch[1]) : null
    if (!title) continue

    const companyMatch = chunk.match(/class="company"[^>]*>([\s\S]*?)<\/a>/i) ||
                        chunk.match(/class="company"[^>]*>([\s\S]*?)</i)
    const company = companyMatch ? clean(companyMatch[1]) : ""

    const locMatch = chunk.match(/class="location"[^>]*>([\s\S]*?)</i)
    const location = locMatch ? clean(locMatch[1]) : ""

    const dateMatch = chunk.match(/class="date"[^>]*>([\s\S]*?)</i)
    const date = dateMatch ? relativeToAbsoluteDate(clean(dateMatch[1])) : ""

    const url = `${BASE_URL}/remote-jobs/${id}`

    const catMatches = chunk.match(/class="categories"[^>]*>([\s\S]*?)</i)
    const categories = catMatches
      ? clean(catMatches[1]).split(",").map((s) => s.trim()).filter(Boolean)
      : []

    results.push({ id, title, company, location, date, url, categories })
  }
  return results
}

function parseJobDetail(html: string): JobDetail | null {
  const idMatch = html.match(/\/remote-jobs\/(\d+)/)
  const id = idMatch ? idMatch[1] : ""

  const titleMatch = html.match(/class="job-details__title"[^>]*>([\s\S]*?)<\/h1>/i)
  const title = titleMatch ? clean(titleMatch[1]) : ""

  const companyMatch = html.match(/class="job-details__company"[^>]*>([\s\S]*?)</i)
  const company = companyMatch ? clean(companyMatch[1]) : ""

  const locMatch = html.match(/class="job-details__location"[^>]*>([\s\S]*?)</i)
  const location = locMatch ? clean(locMatch[1]) : ""

  const dateMatch = html.match(/class="job-details__date"[^>]*>([\s\S]*?)</i)
  const date = dateMatch ? relativeToAbsoluteDate(clean(dateMatch[1])) : ""

  const descMatch = html.match(/class="description"[^>]*>([\s\S]*?)<\/div>/i)
  const description = descMatch ? clean(descMatch[1]) : ""

  const applyMatch = html.match(/href="(\/remote-jobs\/\d+\/apply)"/i)
  const apply_url = applyMatch ? `${BASE_URL}${applyMatch[1]}` : ""

  const catMatch = html.match(/class="job-details__categories"[^>]*>([\s\S]*?)</i)
  const categories = catMatch
    ? clean(catMatch[1]).split(",").map((s) => s.trim()).filter(Boolean)
    : []

  if (!title) return null
  return { id, title, company, location, date, url: `${BASE_URL}/remote-jobs/${id}`, categories, description, apply_url }
}

export async function searchJobs(opts: {
  query: string
  sort?: string
  page?: number
  limit?: number
  format?: "json" | "table" | "plain"
}): Promise<number> {
  try {
    const slug = opts.query.toLowerCase().replace(/\s+/g, "-")
    const page = opts.page || 1
    const url = `${BASE_URL}/remote-${slug}-jobs${page > 1 ? `?page=${page}` : ""}`

    const html = await htmlFetch(url)
    let jobs = parseJobCards(html)

    if (opts.limit && opts.limit > 0) jobs = jobs.slice(0, opts.limit)

    if (opts.format === "table") {
      if (jobs.length === 0) {
        process.stdout.write("No results.\n")
      } else {
        const header =
          "ID".padEnd(8) +
          " " +
          "TITLE".padEnd(40) +
          " " +
          "COMPANY".padEnd(25) +
          " " +
          "LOCATION".padEnd(20) +
          " " +
          "DATE"
        process.stdout.write(header + "\n")
        process.stdout.write("-".repeat(header.length) + "\n")
        for (const job of jobs) {
          process.stdout.write(
            [
              job.id.padEnd(8),
              job.title.slice(0, 40).padEnd(40),
              job.company.slice(0, 25).padEnd(25),
              job.location.slice(0, 20).padEnd(20),
              job.date,
            ].join(" ") + "\n",
          )
        }
      }
    } else if (opts.format === "plain") {
      for (const job of jobs) {
        process.stdout.write(
          [
            `${job.title}`,
            `  ${job.company || "—"} · ${job.location || "—"} · ${job.date}`,
            `  id: ${job.id}`,
            `  ${job.url}`,
          ].join("\n") + "\n\n",
        )
      }
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: jobs.length, query: opts.query, page }, results: jobs },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}

export async function getJobDetail(idOrUrl: string, format: "json" | "plain" = "json"): Promise<number> {
  try {
    let id = idOrUrl
    // If it's a URL, extract the id
    const urlMatch = idOrUrl.match(/remote-jobs\/(\d+)/)
    if (urlMatch) id = urlMatch[1]

    const url = `${BASE_URL}/remote-jobs/${id}`
    const html = await htmlFetch(url)
    const job = parseJobDetail(html)

    if (!job) {
      writeError(`Job not found: ${id}`, "JOB_NOT_FOUND")
      return 1
    }

    if (format === "plain") {
      process.stdout.write(
        [
          `${job.title}`,
          `Company: ${job.company || "—"}`,
          `Location: ${job.location || "—"}`,
          `Date: ${job.date}`,
          `URL: ${job.url}`,
          `Apply: ${job.apply_url}`,
          "",
          "Description:",
          job.description || "(none)",
        ].filter(Boolean).join("\n") + "\n",
      )
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
