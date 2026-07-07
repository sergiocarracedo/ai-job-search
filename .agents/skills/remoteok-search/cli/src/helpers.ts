const BASE_URL = "https://remoteok.com/remote-jobs.json"

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
  tags: string[]
  remote: boolean
  salary: string | null
  apply_url: string
  logo: string | null
}

export interface JobDetail extends Job {
  description: string
}

function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

async function jsonFetch(url: string): Promise<unknown> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
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
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.json()
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

export async function searchJobs(opts: {
  query: string
  location?: string
  sort?: string
  page?: number
  limit?: number
  format?: "json" | "table" | "plain"
}): Promise<number> {
  try {
    const params = new URLSearchParams({ q: opts.query })
    if (opts.location) params.set("location", opts.location)
    const url = `${BASE_URL}?${params.toString()}`

    const data = (await jsonFetch(url)) as unknown[]
    if (!data || !Array.isArray(data)) {
      writeError("Invalid response from RemoteOK", "INVALID_RESPONSE")
      return 1
    }

    // First element is often metadata; filter to objects with id
    const jobs: Job[] = data
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && "id" in item)
      .map((item) => {
        const r = item as Record<string, unknown>
        return {
          id: String(r.id ?? ""),
          title: String(r.position ?? ""),
          company: String(r.company ?? ""),
          location: String(r.location ?? ""),
          date: relativeToAbsoluteDate(String(r.date ?? "")),
          url: String(r.url ?? ""),
          tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
          remote: Boolean(r.remote),
          salary: r.salary ? String(r.salary) : null,
          apply_url: String(r.apply_url ?? ""),
          logo: r.logo ? String(r.logo) : null,
        } satisfies Job
      })

    const limited = opts.limit && opts.limit > 0 ? jobs.slice(0, opts.limit) : jobs

    if (opts.format === "table") {
      if (limited.length === 0) {
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
        for (const job of limited) {
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
      for (const job of limited) {
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
          { meta: { count: limited.length, query: opts.query }, results: limited },
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

export async function getJobDetail(id: string, format: "json" | "plain" = "json"): Promise<number> {
  try {
    const data = (await jsonFetch(`${BASE_URL}?q=${encodeURIComponent(id)}`)) as unknown[]
    if (!data || !Array.isArray(data)) {
      writeError("Invalid response from RemoteOK", "INVALID_RESPONSE")
      return 1
    }

    const job = data.find((item): item is Record<string, unknown> => item !== null && typeof item === "object" && String(item.id) === id)

    if (!job) {
      writeError(`Job not found: ${id}`, "JOB_NOT_FOUND")
      return 1
    }

    const detail: JobDetail = {
      id: String(job.id ?? ""),
      title: String(job.position ?? ""),
      company: String(job.company ?? ""),
      location: String(job.location ?? ""),
      date: relativeToAbsoluteDate(String(job.date ?? "")),
      url: String(job.url ?? ""),
      tags: Array.isArray(job.tags) ? job.tags.map(String) : [],
      remote: Boolean(job.remote),
      salary: job.salary ? String(job.salary) : null,
      apply_url: String(job.apply_url ?? ""),
      logo: job.logo ? String(job.logo) : null,
      description: String(job.description ?? ""),
    }

    if (format === "plain") {
      process.stdout.write(
        [
          `${detail.title}`,
          `Company: ${detail.company || "—"}`,
          `Location: ${detail.location || "—"}`,
          `Date: ${detail.date}`,
          `URL: ${detail.url}`,
          `Apply: ${detail.apply_url}`,
          detail.salary ? `Salary: ${detail.salary}` : "",
          "",
          "Description:",
          detail.description || "(none)",
        ]
          .filter(Boolean)
          .join("\n") + "\n",
      )
    } else {
      process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
