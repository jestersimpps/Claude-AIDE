import { useBrowserStore } from '@/stores/browser-store'
import { useProjectStore } from '@/stores/project-store'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConsoleEntry } from '@/models/types'

const levelColors: Record<string, string> = {
  log: 'text-zinc-300',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400'
}

const EMPTY: ConsoleEntry[] = []

export function ConsolePanel(): React.ReactElement {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const consoleEntries = useBrowserStore((s) => {
    if (!activeProjectId) return EMPTY
    return s.statePerProject[activeProjectId]?.consoleEntries ?? EMPTY
  })
  const { clearConsole } = useBrowserStore()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1">
        <span className="text-xs font-medium text-zinc-500">Console</span>
        <button
          onClick={() => activeProjectId && clearConsole(activeProjectId)}
          className="rounded p-1 text-zinc-600 hover:text-zinc-400"
          title="Clear"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {consoleEntries.length === 0 ? (
          <div className="p-3 text-zinc-600">No console messages</div>
        ) : (
          consoleEntries.map((entry, i) => (
            <div
              key={i}
              className={cn(
                'border-b border-zinc-900 px-3 py-1',
                levelColors[entry.level] || 'text-zinc-300'
              )}
            >
              <span className="mr-2 text-zinc-600">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              {entry.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
