import { usePasswordStore } from '@/stores/password-store'
import { useProjectStore } from '@/stores/project-store'
import { X } from 'lucide-react'

export function PasswordSavePrompt(): React.ReactElement | null {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const pendingPrompt = usePasswordStore((s) => s.pendingPrompt)
  const { saveCredential, dismissPrompt } = usePasswordStore()

  if (!pendingPrompt || !activeProjectId) return null

  const handleSave = (): void => {
    saveCredential(
      activeProjectId,
      pendingPrompt.domain,
      pendingPrompt.username,
      pendingPrompt.password
    )
  }

  return (
    <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900/80 px-3 py-1.5">
      <span className="flex-1 text-xs text-zinc-300">
        Save password for <span className="font-medium text-zinc-100">{pendingPrompt.domain}</span>
        {pendingPrompt.username && (
          <> as <span className="font-medium text-zinc-100">{pendingPrompt.username}</span></>
        )}
        ?
      </span>
      <button
        onClick={handleSave}
        className="rounded bg-blue-600 px-3 py-0.5 text-xs font-medium text-white hover:bg-blue-500"
      >
        Save
      </button>
      <button
        onClick={dismissPrompt}
        className="rounded px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-300"
      >
        Dismiss
      </button>
      <button
        onClick={dismissPrompt}
        className="rounded p-0.5 text-zinc-600 hover:text-zinc-400"
        title="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  )
}
