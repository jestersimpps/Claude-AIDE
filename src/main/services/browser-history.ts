import Store from 'electron-store'
import type { HistoryEntry } from '@main/models/types'

interface HistorySchema {
  history: Record<string, HistoryEntry[]>
}

const store = new Store<HistorySchema>({
  name: 'browser-history',
  defaults: { history: {} }
})

const MAX_ENTRIES = 500

export function addHistoryEntry(projectId: string, url: string, title: string): void {
  const all = store.get('history')
  const entries = all[projectId] ?? []
  const existing = entries.find((e) => e.url === url)

  if (existing) {
    existing.visitCount++
    existing.lastVisited = Date.now()
    if (title) existing.title = title
  } else {
    entries.unshift({ url, title: title || url, visitCount: 1, lastVisited: Date.now() })
  }

  all[projectId] = entries.slice(0, MAX_ENTRIES)
  store.set('history', all)
}

export function getHistory(projectId: string): HistoryEntry[] {
  return store.get('history')[projectId] ?? []
}

export function clearHistory(projectId: string): void {
  const all = store.get('history')
  delete all[projectId]
  store.set('history', all)
}
