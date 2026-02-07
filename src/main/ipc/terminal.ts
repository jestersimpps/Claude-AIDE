import { ipcMain, BrowserWindow } from 'electron'
import { createPty, writePty, resizePty, killPty } from '@main/services/pty-manager'

export function registerTerminalHandlers(): void {
  ipcMain.handle(
    'terminal:create',
    (event, tabId: string, projectId: string, cwd: string): void => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) createPty(tabId, projectId, cwd, win)
    }
  )

  ipcMain.handle('terminal:write', (_event, tabId: string, data: string): void => {
    writePty(tabId, data)
  })

  ipcMain.handle('terminal:resize', (_event, tabId: string, cols: number, rows: number): void => {
    resizePty(tabId, cols, rows)
  })

  ipcMain.handle('terminal:kill', (_event, tabId: string): void => {
    killPty(tabId)
  })
}
