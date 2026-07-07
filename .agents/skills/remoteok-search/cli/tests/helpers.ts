import { expect, test } from "bun:test"

export function runCLI(cmd: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", "run", "src/cli.ts", ...cmd], {
    cwd: import.meta.dir + "/..",
    stdout: "pipe",
    stderr: "pipe",
  })
  return new Promise((resolve) => {
    let stdout = ""
    let stderr = ""
    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()))
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()))
    proc.exited.then((code) => resolve({ exitCode: code, stdout, stderr }))
  })
}

export function parseJSON(output: string): unknown {
  return JSON.parse(output)
}
