import { create } from 'zustand'
import type { Project } from '@/models/types'

interface ProjectStore {
  projects: Project[]
  activeProjectId: string | null
  loadProjects: () => Promise<void>
  addProject: () => Promise<Project | null>
  removeProject: (id: string) => Promise<void>
  setActiveProject: (id: string) => void
  activeProject: () => Project | undefined
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProjectId: null,

  loadProjects: async () => {
    const projects = await window.api.projects.list()
    set({ projects })
  },

  addProject: async () => {
    const project = await window.api.projects.add()
    if (project) {
      await get().loadProjects()
      set({ activeProjectId: project.id })
    }
    return project
  },

  removeProject: async (id: string) => {
    await window.api.projects.remove(id)
    const state = get()
    if (state.activeProjectId === id) {
      set({ activeProjectId: null })
    }
    await state.loadProjects()
  },

  setActiveProject: (id: string) => {
    set({ activeProjectId: id })
  },

  activeProject: () => {
    const state = get()
    return state.projects.find((p) => p.id === state.activeProjectId)
  }
}))
