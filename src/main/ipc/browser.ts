import { ipcMain, BrowserWindow, webContents } from 'electron'
import { attachTab, setDevice, detachTab, clearBodyCache, getResponseBody, capturePageHtml, capturePageScreenshot } from '@main/services/browser-view'
import { loadProjectTabs, saveProjectTabs } from '@main/services/browser-persistence'
import { addHistoryEntry, getHistory, clearHistory } from '@main/services/browser-history'
import { addBookmark, removeBookmark, getBookmarks } from '@main/services/browser-bookmarks'
import type { DeviceMode, HistoryEntry, Bookmark } from '@main/models/types'

export function registerBrowserHandlers(): void {
  ipcMain.handle('browser:attach', (event, tabId: string, webContentsId: number): void => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) attachTab(tabId, webContentsId, win)
  })

  ipcMain.handle('browser:set-device', (_event, tabId: string, mode: DeviceMode): void => {
    setDevice(tabId, mode)
  })

  ipcMain.handle('browser:detach', (_event, tabId: string): void => {
    detachTab(tabId)
  })

  ipcMain.handle('browser:open-devtools', (_event, webContentsId: number): void => {
    const wc = webContents.fromId(webContentsId)
    if (wc) wc.openDevTools()
  })

  ipcMain.handle(
    'browser:load-tabs',
    (_event, projectId: string): { tabs: { id: string; url: string; deviceMode: DeviceMode; title: string }[]; activeTabId: string } => {
      return loadProjectTabs(projectId)
    }
  )

  ipcMain.handle(
    'browser:save-tabs',
    (_event, projectId: string, tabs: { id: string; url: string; deviceMode: DeviceMode; title: string }[], activeTabId: string): void => {
      saveProjectTabs(projectId, tabs, activeTabId)
    }
  )

  ipcMain.handle('browser:add-history', (_event, projectId: string, url: string, title: string): void => {
    addHistoryEntry(projectId, url, title)
  })

  ipcMain.handle('browser:get-history', (_event, projectId: string): HistoryEntry[] => {
    return getHistory(projectId)
  })

  ipcMain.handle('browser:clear-history', (_event, projectId: string): void => {
    clearHistory(projectId)
  })

  ipcMain.handle('browser:add-bookmark', (_event, projectId: string, url: string, title: string): Bookmark => {
    return addBookmark(projectId, url, title)
  })

  ipcMain.handle('browser:remove-bookmark', (_event, projectId: string, bookmarkId: string): void => {
    removeBookmark(projectId, bookmarkId)
  })

  ipcMain.handle('browser:get-bookmarks', (_event, projectId: string): Bookmark[] => {
    return getBookmarks(projectId)
  })

  ipcMain.handle('browser:clear-body-cache', (_event, tabId: string): void => {
    clearBodyCache(tabId)
  })

  ipcMain.handle('browser:get-response-body', (_event, tabId: string, requestId: string): Promise<{ body: string; base64Encoded: boolean }> => {
    return getResponseBody(tabId, requestId)
  })

  ipcMain.handle('browser:capture-html', (_event, tabId: string): Promise<string> => {
    return capturePageHtml(tabId)
  })

  ipcMain.handle('browser:capture-screenshot', (_event, tabId: string): Promise<string> => {
    return capturePageScreenshot(tabId)
  })
}
