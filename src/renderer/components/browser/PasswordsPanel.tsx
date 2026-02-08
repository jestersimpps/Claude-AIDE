import { useEffect, useState } from 'react'
import { usePasswordStore } from '@/stores/password-store'
import { useProjectStore } from '@/stores/project-store'
import { Eye, EyeOff, Copy, Trash2 } from 'lucide-react'

export function PasswordsPanel(): React.ReactElement {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const credentials = usePasswordStore((s) => s.credentials)
  const { loadCredentials, deleteCredential, decryptPassword } = usePasswordStore()
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, string>>({})

  useEffect(() => {
    if (activeProjectId) loadCredentials(activeProjectId)
  }, [activeProjectId])

  const togglePassword = async (credId: string): Promise<void> => {
    if (visiblePasswords[credId]) {
      setVisiblePasswords((prev) => {
        const next = { ...prev }
        delete next[credId]
        return next
      })
      return
    }
    if (!activeProjectId) return
    const password = await decryptPassword(activeProjectId, credId)
    if (password !== null) {
      setVisiblePasswords((prev) => ({ ...prev, [credId]: password }))
    }
  }

  const copyPassword = async (credId: string): Promise<void> => {
    if (!activeProjectId) return
    const password = await decryptPassword(activeProjectId, credId)
    if (password !== null) {
      navigator.clipboard.writeText(password)
    }
  }

  const handleDelete = (credId: string): void => {
    if (!activeProjectId) return
    deleteCredential(activeProjectId, credId)
    setVisiblePasswords((prev) => {
      const next = { ...prev }
      delete next[credId]
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1">
        <span className="text-xs font-medium text-zinc-500">Passwords</span>
        <span className="text-[10px] text-zinc-600">{credentials.length} saved</span>
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-x-2 border-b border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-500">
        <span>Domain</span>
        <span>Username</span>
        <span>Actions</span>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {credentials.length === 0 ? (
          <div className="p-3 text-zinc-600">No saved passwords</div>
        ) : (
          credentials.map((cred) => (
            <div
              key={cred.id}
              className="grid grid-cols-[1fr_1fr_auto] gap-x-2 border-b border-zinc-900 px-3 py-1.5 items-center"
            >
              <span className="truncate text-zinc-300" title={cred.domain}>
                {cred.domain}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="truncate text-zinc-400">{cred.username || '(no username)'}</span>
                {visiblePasswords[cred.id] && (
                  <span className="truncate text-zinc-500">{visiblePasswords[cred.id]}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => togglePassword(cred.id)}
                  className="rounded p-1 text-zinc-600 hover:text-zinc-400"
                  title={visiblePasswords[cred.id] ? 'Hide' : 'Show'}
                >
                  {visiblePasswords[cred.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <button
                  onClick={() => copyPassword(cred.id)}
                  className="rounded p-1 text-zinc-600 hover:text-zinc-400"
                  title="Copy password"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={() => handleDelete(cred.id)}
                  className="rounded p-1 text-zinc-600 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
