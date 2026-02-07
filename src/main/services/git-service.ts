import { execSync } from 'child_process'
import type { GitCommit, GitBranch } from '@main/models/types'

const SEPARATOR = '<<SEP>>'
const FORMAT = ['%H', '%h', '%s', '%an', '%ar', '%D', '%P'].join(SEPARATOR)

function runGit(cwd: string, args: string): string {
  return execSync(`git ${args}`, { cwd, encoding: 'utf-8', timeout: 5000 }).trim()
}

export function isGitRepo(cwd: string): boolean {
  try {
    runGit(cwd, 'rev-parse --is-inside-work-tree')
    return true
  } catch {
    return false
  }
}

export function getCommits(cwd: string, maxCount: number = 50): GitCommit[] {
  try {
    const raw = runGit(cwd, `log --all --format="${FORMAT}" --max-count=${maxCount}`)
    if (!raw) return []

    return raw.split('\n').map((line) => {
      const [hash, shortHash, message, author, date, refsRaw, parentsRaw] = line.split(SEPARATOR)
      const refs = refsRaw ? refsRaw.split(', ').filter(Boolean) : []
      const parents = parentsRaw ? parentsRaw.split(' ').filter(Boolean) : []
      return { hash, shortHash, message, author, date, refs, parents }
    })
  } catch {
    return []
  }
}

export function getBranches(cwd: string): GitBranch[] {
  try {
    const raw = runGit(cwd, 'branch --no-color')
    if (!raw) return []

    return raw.split('\n').map((line) => ({
      name: line.replace(/^\*?\s+/, ''),
      current: line.startsWith('*')
    }))
  } catch {
    return []
  }
}
