import { create } from 'zustand'
import type { DeviceMode, ConsoleEntry, NetworkEntry } from '@/models/types'

interface ProjectBrowserState {
  url: string
  deviceMode: DeviceMode
  consoleEntries: ConsoleEntry[]
  networkEntries: NetworkEntry[]
}

interface BrowserStore {
  statePerProject: Record<string, ProjectBrowserState>
  activeTab: 'console' | 'network'
  setUrl: (projectId: string, url: string) => void
  setDeviceMode: (projectId: string, mode: DeviceMode) => void
  addConsoleEntry: (projectId: string, entry: ConsoleEntry) => void
  addNetworkEntry: (projectId: string, entry: NetworkEntry) => void
  setActiveTab: (tab: 'console' | 'network') => void
  clearConsole: (projectId: string) => void
  clearNetwork: (projectId: string) => void
}

const defaultState: ProjectBrowserState = {
  url: '',
  deviceMode: 'desktop',
  consoleEntries: [],
  networkEntries: []
}

function getOrDefault(
  map: Record<string, ProjectBrowserState>,
  key: string
): ProjectBrowserState {
  return map[key] || defaultState
}

export const useBrowserStore = create<BrowserStore>((set) => ({
  statePerProject: {},
  activeTab: 'console',

  setUrl: (projectId: string, url: string) => {
    set((state) => ({
      statePerProject: {
        ...state.statePerProject,
        [projectId]: { ...getOrDefault(state.statePerProject, projectId), url }
      }
    }))
  },

  setDeviceMode: (projectId: string, mode: DeviceMode) => {
    set((state) => ({
      statePerProject: {
        ...state.statePerProject,
        [projectId]: { ...getOrDefault(state.statePerProject, projectId), deviceMode: mode }
      }
    }))
    window.api.browser.setDevice(mode)
  },

  addConsoleEntry: (projectId: string, entry: ConsoleEntry) => {
    set((state) => {
      const prev = getOrDefault(state.statePerProject, projectId)
      return {
        statePerProject: {
          ...state.statePerProject,
          [projectId]: {
            ...prev,
            consoleEntries: [...prev.consoleEntries.slice(-499), entry]
          }
        }
      }
    })
  },

  addNetworkEntry: (projectId: string, entry: NetworkEntry) => {
    set((state) => {
      const prev = getOrDefault(state.statePerProject, projectId)
      return {
        statePerProject: {
          ...state.statePerProject,
          [projectId]: {
            ...prev,
            networkEntries: [...prev.networkEntries.slice(-499), entry]
          }
        }
      }
    })
  },

  setActiveTab: (tab: 'console' | 'network') => set({ activeTab: tab }),

  clearConsole: (projectId: string) => {
    set((state) => ({
      statePerProject: {
        ...state.statePerProject,
        [projectId]: { ...getOrDefault(state.statePerProject, projectId), consoleEntries: [] }
      }
    }))
  },

  clearNetwork: (projectId: string) => {
    set((state) => ({
      statePerProject: {
        ...state.statePerProject,
        [projectId]: { ...getOrDefault(state.statePerProject, projectId), networkEntries: [] }
      }
    }))
  }
}))
