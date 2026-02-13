import { ipcMain } from 'electron'
import { checkForUpdates, quitAndInstall, getUpdateStatus } from '@main/services/auto-updater'

export function registerUpdaterHandlers(): void {
  ipcMain.handle('updater:check', () => {
    checkForUpdates()
  })

  ipcMain.handle('updater:install', () => {
    quitAndInstall()
  })

  ipcMain.handle('updater:status', () => {
    return getUpdateStatus()
  })
}
