import { ipcMain, BrowserWindow } from 'electron'
import {
  createView,
  navigate,
  setBounds,
  setDevice,
  setActiveTab,
  goBack,
  goForward,
  reload,
  destroyView
} from '@main/services/browser-view'
import type { DeviceMode } from '@main/models/types'

export function registerBrowserHandlers(): void {
  ipcMain.handle('browser:create', (event, tabId: string): void => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) createView(tabId, win)
  })

  ipcMain.handle('browser:navigate', (_event, tabId: string, url: string): void => {
    navigate(tabId, url)
  })

  ipcMain.handle(
    'browser:set-bounds',
    (
      _event,
      tabId: string,
      bounds: { x: number; y: number; width: number; height: number }
    ): void => {
      setBounds(tabId, bounds)
    }
  )

  ipcMain.handle('browser:set-device', (_event, tabId: string, mode: DeviceMode): void => {
    setDevice(tabId, mode)
  })

  ipcMain.handle(
    'browser:set-active-tab',
    (
      _event,
      tabId: string,
      bounds: { x: number; y: number; width: number; height: number }
    ): void => {
      setActiveTab(tabId, bounds)
    }
  )

  ipcMain.handle('browser:back', (_event, tabId: string): void => {
    goBack(tabId)
  })

  ipcMain.handle('browser:forward', (_event, tabId: string): void => {
    goForward(tabId)
  })

  ipcMain.handle('browser:reload', (_event, tabId: string): void => {
    reload(tabId)
  })

  ipcMain.handle('browser:destroy', (_event, tabId: string): void => {
    destroyView(tabId)
  })
}
