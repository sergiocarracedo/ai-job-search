import { runSearch as search } from "./commands/search.js"
import { runDetail as detail } from "./commands/detail.js"
import { parseArgs } from "util"

const args = process.argv.slice(2)

if (args.length === 0 || args[0] === "help" || args[0] === "--help") {
  console.log(`
RemoteOK CLI — search remote job listings

Usage:
  remoteok-search search [flags]
  remoteok-search detail <id> [flags]
  remoteok-search help

Search flags:
  -q, --query <text>    Keyword search (job title, skill, company) [required]
  -l, --location <text> Location/region filter (e.g. Europe, US)
  -s, --sort <order>    Sort by: score (default) or date
  -p, --page <n>        Page number, 1-indexed (default 1)
  --limit <n>            Cap total results (client-side)
  -f, --format <fmt>    Output format: json (default), table, plain

Detail flags:
  -f, --format <fmt>    Output format: json (default), plain
`)
  process.exit(0)
}

const command = args[0]

if (command === "search") {
  const parsed = parseArgs({
    args: args.slice(1),
    options: {
      query: { short: "q", type: "string" },
      location: { short: "l", type: "string" },
      sort: { short: "s", type: "string", default: "score" },
      page: { short: "p", type: "string", default: "1" },
      limit: { type: "string" },
      format: { short: "f", type: "string", default: "json" },
    },
    allowPositionals: false,
  })
  const { query, location, sort, page, limit, format } = parsed.values
  if (!query) {
    console.error("Error: --query/-q is required")
    process.exit(1)
  }
  const exitCode = await search({
    query: query as string,
    location: location as string | undefined,
    sort: (sort as string) || "score",
    page: parseInt(page as string, 10) || 1,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    format: (format as "json" | "table" | "plain") || "json",
  })
  process.exit(exitCode)
} else if (command === "detail") {
  const parsed = parseArgs({
    args: args.slice(1),
    options: {
      format: { short: "f", type: "string", default: "json" },
    },
    allowPositionals: true,
  })
  const id = parsed.positionals[0]
  if (!id) {
    console.error("Error: <id> is required")
    process.exit(1)
  }
  const exitCode = await detail({
    id,
    format: (parsed.values.format as "json" | "plain") || "json",
  })
  process.exit(exitCode)
} else {
  console.error(`Unknown command: ${command}`)
  process.exit(1)
}
