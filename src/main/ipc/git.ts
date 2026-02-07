import { ipcMain } from 'electron'
import { isGitRepo, getCommits, getBranches } from '@main/services/git-service'
import type { GitCommit, GitBranch } from '@main/models/types'

export function registerGitHandlers(): void {
  ipcMain.handle('git:is-repo', (_event, cwd: string): boolean => {
    return isGitRepo(cwd)
  })

  ipcMain.handle('git:commits', (_event, cwd: string, maxCount?: number): GitCommit[] => {
    return getCommits(cwd, maxCount)
  })

  ipcMain.handle('git:branches', (_event, cwd: string): GitBranch[] => {
    return getBranches(cwd)
  })
}
