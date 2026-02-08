import { ipcMain, BrowserWindow } from 'electron'
import { attachTab, setDevice, detachTab } from '@main/services/browser-view'
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
}
