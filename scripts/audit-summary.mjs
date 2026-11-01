import { readFileSync } from 'node:fs'

const report = JSON.parse(readFileSync('npm-audit.json', 'utf8'))
const vulnerabilities = Object.entries(report.vulnerabilities || {})
if (vulnerabilities.length === 0) {
  console.log('No dependency vulnerabilities reported.')
} else {
  for (const [name, finding] of vulnerabilities) {
    console.log(`${name}: ${finding.severity} | ${finding.fixAvailable ? 'fix available' : 'no automatic fix'}`)
  }
}
