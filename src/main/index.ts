import { app, BrowserWindow } from 'electron'
import path from 'path'
import { registerProjectHandlers } from '@main/ipc/projects'
import { registerFilesystemHandlers } from '@main/ipc/filesystem'
import { registerTerminalHandlers } from '@main/ipc/terminal'
import { registerBrowserHandlers } from '@main/ipc/browser'
import { killAll } from '@main/services/pty-manager'
import { stopWatching } from '@main/services/file-watcher'
import { destroyView } from '@main/services/browser-view'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#09090b',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

registerProjectHandlers()
registerFilesystemHandlers()
registerTerminalHandlers()
registerBrowserHandlers()

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  killAll()
  stopWatching()
  destroyView()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  killAll()
  stopWatching()
  destroyView()
})
