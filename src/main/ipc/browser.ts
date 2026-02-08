import { ipcMain, BrowserWindow, webContents } from 'electron'
import { attachTab, setDevice, detachTab } from '@main/services/browser-view'
import { loadProjectTabs, saveProjectTabs } from '@main/services/browser-persistence'
import type { DeviceMode } from '@main/models/types'

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
}
