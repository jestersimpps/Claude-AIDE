import { useEffect, useRef, useState, useCallback } from 'react'
import { useBrowserStore } from '@/stores/browser-store'
import { useProjectStore } from '@/stores/project-store'
import { DeviceToolbar } from './DeviceToolbar'
import { ConsolePanel } from './ConsolePanel'
import { NetworkPanel } from './NetworkPanel'
import { ArrowLeft, ArrowRight, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConsoleEntry, NetworkEntry } from '@/models/types'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

export function BrowserPanel(): React.ReactElement {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const projectUrl = useBrowserStore(
    (s) => (activeProjectId ? s.statePerProject[activeProjectId]?.url : '') || ''
  )
  const activeTab = useBrowserStore((s) => s.activeTab)
  const { setUrl, setActiveTab, addConsoleEntry, addNetworkEntry } = useBrowserStore()

  const [inputUrl, setInputUrl] = useState(projectUrl)
  const viewportRef = useRef<HTMLDivElement>(null)
  const viewCreated = useRef(false)
  const hasNavigated = useRef(!!projectUrl)

  useEffect(() => {
    setInputUrl(projectUrl)
    hasNavigated.current = !!projectUrl

    if (projectUrl && viewCreated.current) {
      window.api.browser.navigate(projectUrl)
      requestAnimationFrame(updateBounds)
    } else if (!projectUrl && viewCreated.current) {
      window.api.browser.setBounds({ x: 0, y: 0, width: 0, height: 0 })
    }
  }, [activeProjectId])

  useEffect(() => {
    const unsubConsole = window.api.browser.onConsole((entry) => {
      const pid = useProjectStore.getState().activeProjectId
      if (pid) addConsoleEntry(pid, entry as ConsoleEntry)
    })

    const unsubNetwork = window.api.browser.onNetwork((entry) => {
      const pid = useProjectStore.getState().activeProjectId
      if (pid) addNetworkEntry(pid, entry as NetworkEntry)
    })

    return () => {
      unsubConsole()
      unsubNetwork()
    }
  }, [])

  const updateBounds = useCallback(() => {
    if (!viewportRef.current || !hasNavigated.current) return
    const rect = viewportRef.current.getBoundingClientRect()
    window.api.browser.setBounds({
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    })
  }, [])

  useEffect(() => {
    if (!viewportRef.current) return
    const observer = new ResizeObserver(updateBounds)
    observer.observe(viewportRef.current)
    return () => observer.disconnect()
  }, [updateBounds])

  const handleNavigate = (): void => {
    if (!inputUrl.trim() || !activeProjectId) return
    setUrl(activeProjectId, inputUrl)

    if (!viewCreated.current) {
      window.api.browser.create()
      viewCreated.current = true
    }

    hasNavigated.current = true
    window.api.browser.navigate(inputUrl)
    requestAnimationFrame(updateBounds)
  }

  return (
    <PanelGroup direction="vertical">
      <Panel defaultSize={70} minSize={30}>
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-2 py-1.5">
            <button
              onClick={() => window.api.browser.back()}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={() => window.api.browser.forward()}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            >
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => window.api.browser.reload()}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            >
              <RotateCw size={14} />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleNavigate()
              }}
              className="flex-1"
            >
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter URL..."
                className="w-full rounded-md bg-zinc-800 px-3 py-1 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-zinc-600"
              />
            </form>

            <DeviceToolbar />
          </div>

          <div ref={viewportRef} className="flex-1 bg-zinc-950">
            {!hasNavigated.current && (
              <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                Enter a URL to preview
              </div>
            )}
          </div>
        </div>
      </Panel>

      <PanelResizeHandle className="h-1 bg-zinc-800 hover:bg-zinc-700 transition-colors" />

      <Panel defaultSize={30} minSize={10}>
        <div className="flex h-full flex-col bg-zinc-950">
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setActiveTab('console')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === 'console'
                  ? 'border-b-2 border-zinc-400 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-400'
              )}
            >
              Console
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === 'network'
                  ? 'border-b-2 border-zinc-400 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-400'
              )}
            >
              Network
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {activeTab === 'console' ? <ConsolePanel /> : <NetworkPanel />}
          </div>
        </div>
      </Panel>
    </PanelGroup>
  )
}
