import { ipcMain, dialog, BrowserWindow } from 'electron'
import Store from 'electron-store'
import { v4 as uuid } from 'uuid'
import path from 'path'
import type { Project } from '@main/models/types'

const store = new Store<{ projects: Project[] }>({
  defaults: { projects: [] }
})

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:list', (): Project[] => {
    return store.get('projects')
  })

  ipcMain.handle('projects:add', async (event): Promise<Project | null> => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const folderPath = result.filePaths[0]
    const projects = store.get('projects')

    const existing = projects.find((p) => p.path === folderPath)
    if (existing) return existing

    const project: Project = {
      id: uuid(),
      name: path.basename(folderPath),
      path: folderPath,
      lastOpened: Date.now()
    }

    projects.push(project)
    store.set('projects', projects)
    return project
  })

  ipcMain.handle('projects:remove', (_event, id: string): boolean => {
    const projects = store.get('projects')
    const filtered = projects.filter((p) => p.id !== id)
    store.set('projects', filtered)
    return true
  })
}
