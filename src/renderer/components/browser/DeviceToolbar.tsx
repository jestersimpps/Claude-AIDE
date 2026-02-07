import { useBrowserStore } from '@/stores/browser-store'
import { useProjectStore } from '@/stores/project-store'
import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DeviceMode } from '@/models/types'

const devices: { mode: DeviceMode; icon: typeof Monitor; label: string }[] = [
  { mode: 'desktop', icon: Monitor, label: 'Desktop' },
  { mode: 'ipad', icon: Tablet, label: 'iPad' },
  { mode: 'mobile', icon: Smartphone, label: 'Mobile' }
]

export function DeviceToolbar(): React.ReactElement {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const deviceMode = useBrowserStore((s) =>
    activeProjectId ? (s.statePerProject[activeProjectId]?.deviceMode ?? 'desktop') : 'desktop'
  )
  const { setDeviceMode } = useBrowserStore()

  return (
    <div className="flex items-center gap-0.5">
      {devices.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => activeProjectId && setDeviceMode(activeProjectId, mode)}
          title={label}
          className={cn(
            'rounded p-1.5 transition-colors',
            deviceMode === mode
              ? 'bg-zinc-700 text-zinc-200'
              : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
          )}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}
