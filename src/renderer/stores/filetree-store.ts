import { create } from 'zustand'
import type { FileNode } from '@/models/types'

interface FileTreeStore {
  treePerProject: Record<string, FileNode>
  expandedPerProject: Record<string, Set<string>>
  loadTree: (projectId: string, rootPath: string) => Promise<void>
  setTree: (projectId: string, tree: FileNode) => void
  toggleExpanded: (projectId: string, path: string) => void
  getTree: (projectId: string) => FileNode | undefined
  getExpanded: (projectId: string) => Set<string>
}

const EMPTY_SET = new Set<string>()

export const useFileTreeStore = create<FileTreeStore>((set, get) => ({
  treePerProject: {},
  expandedPerProject: {},

  loadTree: async (projectId: string, rootPath: string) => {
    const tree = await window.api.fs.readTree(rootPath)
    set((state) => ({
      treePerProject: { ...state.treePerProject, [projectId]: tree }
    }))
  },

  setTree: (projectId: string, tree: FileNode) => {
    set((state) => ({
      treePerProject: { ...state.treePerProject, [projectId]: tree }
    }))
  },

  toggleExpanded: (projectId: string, path: string) => {
    set((state) => {
      const prev = state.expandedPerProject[projectId] || new Set<string>()
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return {
        expandedPerProject: { ...state.expandedPerProject, [projectId]: next }
      }
    })
  },

  getTree: (projectId: string) => {
    return get().treePerProject[projectId]
  },

  getExpanded: (projectId: string) => {
    return get().expandedPerProject[projectId] || EMPTY_SET
  }
}))
