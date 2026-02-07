import { ipcMain, BrowserWindow } from 'electron'
import { readTree, startWatching, stopWatching } from '@main/services/file-watcher'
import type { FileNode } from '@main/models/types'

export function registerFilesystemHandlers(): void {
  ipcMain.handle('fs:read-tree', (_event, rootPath: string): FileNode => {
    return readTree(rootPath)
  })

  ipcMain.handle('fs:watch', (event, rootPath: string): void => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) startWatching(rootPath, win)
  })

  ipcMain.handle('fs:unwatch', (): void => {
    stopWatching()
  })
}
