import { ipcMain } from 'electron'
import {
  saveCredential,
  getCredentialsForDomain,
  decryptPassword,
  listCredentials,
  deleteCredential,
  updateCredential
} from '@main/services/credential-store'

export function registerPasswordHandlers(): void {
  ipcMain.handle(
    'passwords:save',
    (_event, projectId: string, domain: string, username: string, password: string) => {
      const cred = saveCredential(projectId, domain, username, password)
      return {
        id: cred.id,
        domain: cred.domain,
        username: cred.username,
        createdAt: cred.createdAt,
        updatedAt: cred.updatedAt
      }
    }
  )

  ipcMain.handle(
    'passwords:get-for-domain',
    (_event, projectId: string, domain: string) => {
      return getCredentialsForDomain(projectId, domain).map((c) => ({
        id: c.id,
        domain: c.domain,
        username: c.username,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    }
  )

  ipcMain.handle(
    'passwords:decrypt',
    (_event, projectId: string, credentialId: string) => {
      return decryptPassword(projectId, credentialId)
    }
  )

  ipcMain.handle('passwords:list', (_event, projectId: string) => {
    return listCredentials(projectId).map((c) => ({
      id: c.id,
      domain: c.domain,
      username: c.username,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }))
  })

  ipcMain.handle(
    'passwords:delete',
    (_event, projectId: string, credentialId: string) => {
      return deleteCredential(projectId, credentialId)
    }
  )

  ipcMain.handle(
    'passwords:update',
    (_event, projectId: string, credentialId: string, username: string, password: string) => {
      return updateCredential(projectId, credentialId, username, password)
    }
  )
}
