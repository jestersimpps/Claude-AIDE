import { useEffect, useRef, useState, useCallback } from 'react'
import { useBrowserStore } from '@/stores/browser-store'
import { useProjectStore } from '@/stores/project-store'
import { DeviceToolbar } from './DeviceToolbar'
import { ConsolePanel } from './ConsolePanel'
import { NetworkPanel } from './NetworkPanel'
import { ArrowLeft, ArrowRight, RotateCw, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConsoleEntry, NetworkEntry } from '@/models/types'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

function getDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname
  } catch {
    return url || 'New Tab'
  }
}

export function BrowserPanel(): React.ReactElement {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const tabs = useBrowserStore((s) => s.tabs)
  const activeTabPerProject = useBrowserStore((s) => s.activeTabPerProject)
  const devToolsTab = useBrowserStore((s) => s.devToolsTab)
  const { createTab, closeTab, setActiveTab, setUrl, setDevToolsTab, addConsoleEntry, addNetworkEntry } =
    useBrowserStore()

  const projectTabs = tabs.filter((t) => t.projectId === activeProjectId)
  const activeTabId = activeProjectId ? activeTabPerProject[activeProjectId] || null : null
  const activeTab = projectTabs.find((t) => t.id === activeTabId)

  const [inputUrl, setInputUrl] = useState(activeTab?.url || '')
  const viewportRef = useRef<HTMLDivElement>(null)
  const createdViews = useRef(new Set<string>())
  const prevActiveTabRef = useRef<string | null>(null)

  useEffect(() => {
    setInputUrl(activeTab?.url || '')
  }, [activeTabId])

  useEffect(() => {
    if (!activeTabId || !createdViews.current.has(activeTabId)) {
      if (prevActiveTabRef.current && createdViews.current.has(prevActiveTabRef.current)) {
        window.api.browser.setBounds(prevActiveTabRef.current, { x: 0, y: 0, width: 0, height: 0 })
      }
      prevActiveTabRef.current = activeTabId
      return
    }

    const bounds = getViewportBounds()
    if (bounds) {
      window.api.browser.setActiveTab(activeTabId, bounds)
    }
    prevActiveTabRef.current = activeTabId
  }, [activeTabId])

  useEffect(() => {
    const unsubConsole = window.api.browser.onConsole((tabId: string, entry: unknown) => {
      addConsoleEntry(tabId, entry as ConsoleEntry)
    })

    const unsubNetwork = window.api.browser.onNetwork((tabId: string, entry: unknown) => {
      addNetworkEntry(tabId, entry as NetworkEntry)
    })

    return () => {
      unsubConsole()
      unsubNetwork()
    }
  }, [])

  const getViewportBounds = useCallback((): {
    x: number
    y: number
    width: number
    height: number
  } | null => {
    if (!viewportRef.current) return null
    const rect = viewportRef.current.getBoundingClientRect()
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }
  }, [])

  const updateBounds = useCallback(() => {
    if (!activeTabId || !createdViews.current.has(activeTabId)) return
    const bounds = getViewportBounds()
    if (bounds) {
      window.api.browser.setBounds(activeTabId, bounds)
    }
  }, [activeTabId, getViewportBounds])

  useEffect(() => {
    if (!viewportRef.current) return
    const observer = new ResizeObserver(updateBounds)
    observer.observe(viewportRef.current)
    return () => observer.disconnect()
  }, [updateBounds])

  const handleNavigate = (): void => {
    if (!inputUrl.trim() || !activeTabId) return
    setUrl(activeTabId, inputUrl)

    if (!createdViews.current.has(activeTabId)) {
      window.api.browser.create(activeTabId)
      createdViews.current.add(activeTabId)
    }

    window.api.browser.navigate(activeTabId, inputUrl)
    requestAnimationFrame(updateBounds)
  }

  const handleNewTab = (): void => {
    if (!activeProjectId) return
    createTab(activeProjectId)
  }

  const handleCloseTab = (tabId: string): void => {
    if (!activeProjectId) return
    if (createdViews.current.has(tabId)) {
      window.api.browser.destroy(tabId)
      createdViews.current.delete(tabId)
    }
    closeTab(activeProjectId, tabId)
  }

  const handleSwitchTab = (tabId: string): void => {
    if (!activeProjectId) return
    setActiveTab(activeProjectId, tabId)
  }

  const hasNavigated = activeTab?.url ? createdViews.current.has(activeTabId!) : false

  return (
    <PanelGroup direction="vertical">
      <Panel defaultSize={70} minSize={30}>
        <div className="flex h-full flex-col">
          <div className="flex items-center border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex flex-1 items-center gap-0.5 overflow-x-auto px-1">
              {projectTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={cn(
                    'group flex cursor-pointer items-center gap-1.5 rounded-t-md px-3 py-1.5 text-xs',
                    activeTabId === tab.id
                      ? 'bg-zinc-950 text-zinc-200'
                      : 'text-zinc-500 hover:text-zinc-400'
                  )}
                  onClick={() => handleSwitchTab(tab.id)}
                >
                  <span className="max-w-[120px] truncate">
                    {tab.url ? getDomain(tab.url) : 'New Tab'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCloseTab(tab.id)
                    }}
                    className="hidden rounded p-0.5 hover:text-red-400 group-hover:block"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleNewTab}
              disabled={!activeProjectId}
              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-2 py-1.5">
            <button
              onClick={() => activeTabId && window.api.browser.back(activeTabId)}
              disabled={!activeTabId}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={() => activeTabId && window.api.browser.forward(activeTabId)}
              disabled={!activeTabId}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
            >
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => activeTabId && window.api.browser.reload(activeTabId)}
              disabled={!activeTabId}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
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
                disabled={!activeTabId}
                className="w-full rounded-md bg-zinc-800 px-3 py-1 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
              />
            </form>

            <DeviceToolbar />
          </div>

          <div ref={viewportRef} className="flex-1 bg-zinc-950">
            {!activeTab ? (
              <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                {activeProjectId ? 'Click + to open a browser tab' : 'Select a project first'}
              </div>
            ) : (
              !hasNavigated && (
                <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                  Enter a URL to preview
                </div>
              )
            )}
          </div>
        </div>
      </Panel>

      <PanelResizeHandle className="h-1 bg-zinc-800 hover:bg-zinc-700 transition-colors" />

      <Panel defaultSize={30} minSize={10}>
        <div className="flex h-full flex-col bg-zinc-950">
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setDevToolsTab('console')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                devToolsTab === 'console'
                  ? 'border-b-2 border-zinc-400 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-400'
              )}
            >
              Console
            </button>
            <button
              onClick={() => setDevToolsTab('network')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                devToolsTab === 'network'
                  ? 'border-b-2 border-zinc-400 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-400'
              )}
            >
              Network
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {devToolsTab === 'console' ? <ConsolePanel /> : <NetworkPanel />}
          </div>
        </div>
      </Panel>
    </PanelGroup>
  )
}
