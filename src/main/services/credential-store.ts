import Store from 'electron-store'
import { safeStorage } from 'electron'
import { v4 as uuid } from 'uuid'
import type { EncryptedCredential } from '@main/models/types'

interface CredentialStoreSchema {
  credentials: Record<string, EncryptedCredential[]>
}

const store = new Store<CredentialStoreSchema>({
  name: 'credential-store',
  defaults: { credentials: {} }
})

function encrypt(plaintext: string): string {
  return safeStorage.encryptString(plaintext).toString('base64')
}

function decrypt(encrypted: string): string {
  return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
}

export function saveCredential(
  projectId: string,
  domain: string,
  username: string,
  password: string
): EncryptedCredential {
  const all = store.get('credentials')
  const projectCreds = all[projectId] ?? []

  const existing = projectCreds.find(
    (c) => c.domain === domain && c.username === username
  )

  if (existing) {
    existing.encryptedPassword = encrypt(password)
    existing.updatedAt = Date.now()
    store.set('credentials', all)
    return existing
  }

  const cred: EncryptedCredential = {
    id: uuid(),
    domain,
    username,
    encryptedPassword: encrypt(password),
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  projectCreds.push(cred)
  all[projectId] = projectCreds
  store.set('credentials', all)
  return cred
}

export function getCredentialsForDomain(
  projectId: string,
  domain: string
): EncryptedCredential[] {
  const all = store.get('credentials')
  return (all[projectId] ?? []).filter((c) => c.domain === domain)
}

export function decryptPassword(projectId: string, credentialId: string): string | null {
  const all = store.get('credentials')
  const cred = (all[projectId] ?? []).find((c) => c.id === credentialId)
  if (!cred) return null
  return decrypt(cred.encryptedPassword)
}

export function listCredentials(projectId: string): EncryptedCredential[] {
  const all = store.get('credentials')
  return all[projectId] ?? []
}

export function deleteCredential(projectId: string, credentialId: string): boolean {
  const all = store.get('credentials')
  const projectCreds = all[projectId] ?? []
  const filtered = projectCreds.filter((c) => c.id !== credentialId)
  all[projectId] = filtered
  store.set('credentials', all)
  return filtered.length < projectCreds.length
}

export function updateCredential(
  projectId: string,
  credentialId: string,
  username: string,
  password: string
): boolean {
  const all = store.get('credentials')
  const cred = (all[projectId] ?? []).find((c) => c.id === credentialId)
  if (!cred) return false
  cred.username = username
  cred.encryptedPassword = encrypt(password)
  cred.updatedAt = Date.now()
  store.set('credentials', all)
  return true
}

export function clearProjectCredentials(projectId: string): void {
  const all = store.get('credentials')
  delete all[projectId]
  store.set('credentials', all)
}
