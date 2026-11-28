import { readFile, appendFile } from 'node:fs/promises';

const workspaces = [
  ['Game engine + player preferences', 'packages/game-engine/test-results/results.json'],
  ['API + origin/session security', 'apps/api/test-results/results.json'],
];
const rows = ['## Vitest results', '', '| Suite | Passed | Failed | Pending / TODO | Total |', '|---|---:|---:|---:|---:|'];
let missing = false;
for (const [name, path] of workspaces) {
  try {
    const data = JSON.parse(await readFile(path, 'utf8'));
    rows.push(`| ${name} | ${data.numPassedTests} | ${data.numFailedTests} | ${data.numPendingTests + (data.numTodoTests ?? 0)} | ${data.numTotalTests} |`);
  } catch {
    missing = true;
    rows.push(`| ${name} | Report missing — tests may not have started | — | — | — |`);
  }
}
rows.push('', 'Download **vitest-results** below this run for JUnit XML and JSON evidence. Pending/TODO cases are not passed tests.');
const summary = rows.join('\n') + '\n';
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
if (missing) process.exitCode = 1;
