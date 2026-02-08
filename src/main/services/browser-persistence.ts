import Store from 'electron-store'
import type { DeviceMode } from '@main/models/types'

interface PersistedTab {
  id: string
  url: string
  deviceMode: DeviceMode
  title: string
}

interface BrowserStateSchema {
  tabs: Record<string, PersistedTab[]>
  activeTabIds: Record<string, string>
}

const store = new Store<BrowserStateSchema>({
  name: 'browser-state',
  defaults: {
    tabs: {},
    activeTabIds: {}
  }
})

export function loadProjectTabs(
  projectId: string
): { tabs: PersistedTab[]; activeTabId: string } {
  const allTabs = store.get('tabs')
  const allActive = store.get('activeTabIds')
  return {
    tabs: allTabs[projectId] ?? [],
    activeTabId: allActive[projectId] ?? ''
  }
}

export function saveProjectTabs(
  projectId: string,
  tabs: PersistedTab[],
  activeTabId: string
): void {
  const allTabs = store.get('tabs')
  const allActive = store.get('activeTabIds')
  allTabs[projectId] = tabs
  allActive[projectId] = activeTabId
  store.set('tabs', allTabs)
  store.set('activeTabIds', allActive)
}

export function clearProjectTabs(projectId: string): void {
  const allTabs = store.get('tabs')
  const allActive = store.get('activeTabIds')
  delete allTabs[projectId]
  delete allActive[projectId]
  store.set('tabs', allTabs)
  store.set('activeTabIds', allActive)
}
