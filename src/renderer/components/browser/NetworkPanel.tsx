import { useBrowserStore } from '@/stores/browser-store'
import { useProjectStore } from '@/stores/project-store'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NetworkEntry } from '@/models/types'

function formatSize(bytes: number): string {
  if (bytes === 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-400'
  if (status >= 300 && status < 400) return 'text-yellow-400'
  if (status >= 400) return 'text-red-400'
  return 'text-zinc-400'
}

const EMPTY: NetworkEntry[] = []

export function NetworkPanel(): React.ReactElement {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const activeTabId = useBrowserStore((s) =>
    activeProjectId ? s.activeTabPerProject[activeProjectId] : null
  )
  const networkEntries = useBrowserStore((s) => {
    if (!activeProjectId) return EMPTY
    const tabId = s.activeTabPerProject[activeProjectId]
    if (!tabId) return EMPTY
    return s.tabs.find((t) => t.id === tabId)?.networkEntries ?? EMPTY
  })
  const { clearNetwork } = useBrowserStore()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1">
        <span className="text-xs font-medium text-zinc-500">Network</span>
        <button
          onClick={() => activeTabId && clearNetwork(activeTabId)}
          className="rounded p-1 text-zinc-600 hover:text-zinc-400"
          title="Clear"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="grid grid-cols-[60px_60px_1fr_60px_60px] gap-x-2 border-b border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-500">
        <span>Method</span>
        <span>Status</span>
        <span>URL</span>
        <span>Size</span>
        <span>Time</span>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {networkEntries.length === 0 ? (
          <div className="p-3 text-zinc-600">No network requests</div>
        ) : (
          networkEntries.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[60px_60px_1fr_60px_60px] gap-x-2 border-b border-zinc-900 px-3 py-1"
            >
              <span className="text-zinc-400">{entry.method}</span>
              <span className={cn(statusColor(entry.status))}>{entry.status}</span>
              <span className="truncate text-zinc-300" title={entry.url}>
                {entry.url}
              </span>
              <span className="text-zinc-500">{formatSize(entry.size)}</span>
              <span className="text-zinc-500">{entry.duration.toFixed(0)}ms</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
