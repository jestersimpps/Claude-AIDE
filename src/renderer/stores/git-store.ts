import { create } from 'zustand'
import type { GitCommit, GitBranch } from '@/models/types'

interface GitStore {
  commitsPerProject: Record<string, GitCommit[]>
  branchesPerProject: Record<string, GitBranch[]>
  isRepoPerProject: Record<string, boolean>
  loadGitData: (projectId: string, cwd: string) => Promise<void>
}

export const useGitStore = create<GitStore>((set) => ({
  commitsPerProject: {},
  branchesPerProject: {},
  isRepoPerProject: {},

  loadGitData: async (projectId: string, cwd: string) => {
    const isRepo = await window.api.git.isRepo(cwd)
    if (!isRepo) {
      set((s) => ({ isRepoPerProject: { ...s.isRepoPerProject, [projectId]: false } }))
      return
    }

    const [commits, branches] = await Promise.all([
      window.api.git.commits(cwd),
      window.api.git.branches(cwd)
    ])

    set((s) => ({
      isRepoPerProject: { ...s.isRepoPerProject, [projectId]: true },
      commitsPerProject: { ...s.commitsPerProject, [projectId]: commits },
      branchesPerProject: { ...s.branchesPerProject, [projectId]: branches }
    }))
  }
}))
