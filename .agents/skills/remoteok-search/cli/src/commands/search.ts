import { searchJobs } from "../helpers.js"

export interface SearchOpts {
  query: string
  location?: string
  sort?: string
  page?: number
  limit?: number
  format: "json" | "table" | "plain"
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  return searchJobs(opts)
}
