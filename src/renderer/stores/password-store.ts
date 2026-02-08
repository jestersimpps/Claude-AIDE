import { create } from 'zustand'
import type { SavedCredential, PasswordPromptData } from '@/models/types'

interface PasswordStore {
  credentials: SavedCredential[]
  pendingPrompt: PasswordPromptData | null
  showManager: boolean
  loadCredentials: (projectId: string) => Promise<void>
  saveCredential: (projectId: string, domain: string, username: string, password: string) => Promise<void>
  deleteCredential: (projectId: string, credentialId: string) => Promise<void>
  getCredentialsForDomain: (projectId: string, domain: string) => Promise<SavedCredential[]>
  decryptPassword: (projectId: string, credentialId: string) => Promise<string | null>
  setPendingPrompt: (prompt: PasswordPromptData | null) => void
  dismissPrompt: () => void
  setShowManager: (show: boolean) => void
}

export const usePasswordStore = create<PasswordStore>((set) => ({
  credentials: [],
  pendingPrompt: null,
  showManager: false,

  loadCredentials: async (projectId: string): Promise<void> => {
    const credentials = await window.api.passwords.list(projectId)
    set({ credentials })
  },

  saveCredential: async (
    projectId: string,
    domain: string,
    username: string,
    password: string
  ): Promise<void> => {
    await window.api.passwords.save(projectId, domain, username, password)
    const credentials = await window.api.passwords.list(projectId)
    set({ credentials, pendingPrompt: null })
  },

  deleteCredential: async (projectId: string, credentialId: string): Promise<void> => {
    await window.api.passwords.delete(projectId, credentialId)
    const credentials = await window.api.passwords.list(projectId)
    set({ credentials })
  },

  getCredentialsForDomain: async (
    projectId: string,
    domain: string
  ): Promise<SavedCredential[]> => {
    return window.api.passwords.getForDomain(projectId, domain)
  },

  decryptPassword: async (
    projectId: string,
    credentialId: string
  ): Promise<string | null> => {
    return window.api.passwords.decrypt(projectId, credentialId)
  },

  setPendingPrompt: (prompt: PasswordPromptData | null) => set({ pendingPrompt: prompt }),

  dismissPrompt: () => set({ pendingPrompt: null }),

  setShowManager: (show: boolean) => set({ showManager: show })
}))
