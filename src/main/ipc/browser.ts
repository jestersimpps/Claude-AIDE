import { ipcMain, BrowserWindow } from 'electron'
import {
  createView,
  navigate,
  setBounds,
  setDevice,
  goBack,
  goForward,
  reload,
  destroyView
} from '@main/services/browser-view'
import type { DeviceMode } from '@main/models/types'

export function registerBrowserHandlers(): void {
  ipcMain.handle('browser:create', (event): void => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) createView(win)
  })

  ipcMain.handle('browser:navigate', (_event, url: string): void => {
    navigate(url)
  })

  ipcMain.handle(
    'browser:set-bounds',
    (_event, bounds: { x: number; y: number; width: number; height: number }): void => {
      setBounds(bounds)
    }
  )

  ipcMain.handle('browser:set-device', (_event, mode: DeviceMode): void => {
    setDevice(mode)
  })

  ipcMain.handle('browser:back', (): void => {
    goBack()
  })

  ipcMain.handle('browser:forward', (): void => {
    goForward()
  })

  ipcMain.handle('browser:reload', (): void => {
    reload()
  })

  ipcMain.handle('browser:destroy', (): void => {
    destroyView()
  })
}
