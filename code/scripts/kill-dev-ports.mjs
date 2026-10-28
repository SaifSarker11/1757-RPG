/**
 * Free dev ports before starting the monorepo (Windows).
 * Usage: node scripts/kill-dev-ports.mjs
 */
import { execSync } from "node:child_process";

const ports = [3000, 3001, 3002, 8081];

for (const port of ports) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    const pids = new Set();
    for (const line of output.split("\n")) {
      if (!line.includes("LISTENING")) continue;
      const pid = line.trim().split(/\s+/).at(-1);
      if (pid && pid !== "0") pids.add(pid);
    }

    for (const pid of pids) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`Freed port ${port} (PID ${pid})`);
    }
  } catch {
    // Port not in use
  }
}

console.log("Done. Ports 3000, 3001, 3002, 8081 should be free.");
