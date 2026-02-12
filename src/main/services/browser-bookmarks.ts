import Store from 'electron-store'
import { v4 as uuid } from 'uuid'
import type { Bookmark } from '@main/models/types'

interface BookmarkSchema {
  bookmarks: Record<string, Bookmark[]>
}

const store = new Store<BookmarkSchema>({
  name: 'browser-bookmarks',
  defaults: { bookmarks: {} }
})

export function addBookmark(projectId: string, url: string, title: string): Bookmark {
  const all = store.get('bookmarks')
  const entries = all[projectId] ?? []
  const bookmark: Bookmark = { id: uuid(), url, title, createdAt: Date.now() }
  entries.push(bookmark)
  all[projectId] = entries
  store.set('bookmarks', all)
  return bookmark
}

export function removeBookmark(projectId: string, bookmarkId: string): void {
  const all = store.get('bookmarks')
  const entries = all[projectId] ?? []
  all[projectId] = entries.filter((b) => b.id !== bookmarkId)
  store.set('bookmarks', all)
}

export function getBookmarks(projectId: string): Bookmark[] {
  return store.get('bookmarks')[projectId] ?? []
}
