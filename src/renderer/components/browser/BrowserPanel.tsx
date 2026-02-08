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

function normalizeUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('localhost') || url.startsWith('127.0.0.1') || url.startsWith('0.0.0.0')) {
    return `http://${url}`
  }
  return `https://${url}`
}

export function BrowserPanel(): React.ReactElement {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const tabs = useBrowserStore((s) => s.tabs)
  const activeTabPerProject = useBrowserStore((s) => s.activeTabPerProject)
  const devToolsTab = useBrowserStore((s) => s.devToolsTab)
  const {
    createTab,
    closeTab,
    setActiveTab,
    setUrl,
    setDevToolsTab,
    addConsoleEntry,
    addNetworkEntry
  } = useBrowserStore()

  const projectTabs = tabs.filter((t) => t.projectId === activeProjectId)
  const activeTabId = activeProjectId ? activeTabPerProject[activeProjectId] || null : null
  const activeTab = projectTabs.find((t) => t.id === activeTabId)

  const [inputUrl, setInputUrl] = useState(activeTab?.url || '')
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const webviewRefs = useRef<Map<string, Electron.WebviewTag>>(new Map())
  const attachedTabs = useRef(new Set<string>())

  useEffect(() => {
    setInputUrl(activeTab?.url || '')
  }, [activeTabId])

  useEffect(() => {
    const unsubNetwork = window.api.browser.onNetwork((tabId: string, entry: unknown) => {
      addNetworkEntry(tabId, entry as NetworkEntry)
    })
    return () => {
      unsubNetwork()
    }
  }, [])

  const setupWebview = useCallback(
    (tabId: string, webview: Electron.WebviewTag) => {
      webviewRefs.current.set(tabId, webview)

      const onDomReady = (): void => {
        const wcId = webview.getWebContentsId()
        if (!attachedTabs.current.has(tabId)) {
          attachedTabs.current.add(tabId)
          window.api.browser.attach(tabId, wcId)
        }
      }

      const onConsoleMessage = (e: Electron.ConsoleMessageEvent): void => {
        const levelMap: Record<number, ConsoleEntry['level']> = {
          0: 'log',
          1: 'warn',
          2: 'error',
          3: 'info'
        }
        addConsoleEntry(tabId, {
          level: levelMap[e.level] || 'log',
          message: e.message,
          timestamp: Date.now()
        })
      }

      const onDidNavigate = (e: Electron.DidNavigateEvent): void => {
        setUrl(tabId, e.url)
        if (tabId === activeTabId) {
          setInputUrl(e.url)
          setCanGoBack(webview.canGoBack())
          setCanGoForward(webview.canGoForward())
        }
      }

      const onDidNavigateInPage = (e: Electron.DidNavigateInPageEvent): void => {
        if (e.isMainFrame) {
          setUrl(tabId, e.url)
          if (tabId === activeTabId) {
            setInputUrl(e.url)
            setCanGoBack(webview.canGoBack())
            setCanGoForward(webview.canGoForward())
          }
        }
      }

      webview.addEventListener('dom-ready', onDomReady)
      webview.addEventListener('console-message', onConsoleMessage as EventListener)
      webview.addEventListener('did-navigate', onDidNavigate as EventListener)
      webview.addEventListener('did-navigate-in-page', onDidNavigateInPage as EventListener)

      return () => {
        webview.removeEventListener('dom-ready', onDomReady)
        webview.removeEventListener('console-message', onConsoleMessage as EventListener)
        webview.removeEventListener('did-navigate', onDidNavigate as EventListener)
        webview.removeEventListener('did-navigate-in-page', onDidNavigateInPage as EventListener)
      }
    },
    [activeTabId, addConsoleEntry, setUrl]
  )

  const handleNavigate = (): void => {
    if (!inputUrl.trim() || !activeTabId) return
    const url = normalizeUrl(inputUrl.trim())
    setUrl(activeTabId, url)
    setInputUrl(url)
    const webview = webviewRefs.current.get(activeTabId)
    if (webview) {
      webview.loadURL(url)
    }
  }

  const handleNewTab = (): void => {
    if (!activeProjectId) return
    createTab(activeProjectId)
  }

  const handleCloseTab = (tabId: string): void => {
    if (!activeProjectId) return
    if (attachedTabs.current.has(tabId)) {
      window.api.browser.detach(tabId)
      attachedTabs.current.delete(tabId)
    }
    webviewRefs.current.delete(tabId)
    closeTab(activeProjectId, tabId)
  }

  const handleSwitchTab = (tabId: string): void => {
    if (!activeProjectId) return
    setActiveTab(activeProjectId, tabId)
    const webview = webviewRefs.current.get(tabId)
    if (webview) {
      try {
        setCanGoBack(webview.canGoBack())
        setCanGoForward(webview.canGoForward())
      } catch {
        setCanGoBack(false)
        setCanGoForward(false)
      }
    }
  }

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
              onClick={() => {
                const wv = activeTabId ? webviewRefs.current.get(activeTabId) : null
                if (wv) {
                  wv.goBack()
                }
              }}
              disabled={!canGoBack}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={() => {
                const wv = activeTabId ? webviewRefs.current.get(activeTabId) : null
                if (wv) {
                  wv.goForward()
                }
              }}
              disabled={!canGoForward}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
            >
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => {
                const wv = activeTabId ? webviewRefs.current.get(activeTabId) : null
                if (wv) {
                  wv.reload()
                }
              }}
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

          <div className="relative flex-1 bg-zinc-950">
            {!activeTab ? (
              <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                {activeProjectId ? 'Click + to open a browser tab' : 'Select a project first'}
              </div>
            ) : !activeTab.url ? (
              <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                Enter a URL to preview
              </div>
            ) : null}

            {projectTabs
              .filter((tab) => tab.url)
              .map((tab) => (
                <WebviewTab
                  key={tab.id}
                  tabId={tab.id}
                  url={tab.url}
                  isActive={tab.id === activeTabId}
                  onSetup={setupWebview}
                />
              ))}
          </div>
        </div>
      </Panel>

      <PanelResizeHandle className="h-1 bg-zinc-800 transition-colors hover:bg-zinc-700" />

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
            {devToolsTab === 'console' && <ConsolePanel />}
            {devToolsTab === 'network' && <NetworkPanel />}
          </div>
        </div>
      </Panel>
    </PanelGroup>
  )
}

interface WebviewTabProps {
  tabId: string
  url: string
  isActive: boolean
  onSetup: (tabId: string, webview: Electron.WebviewTag) => () => void
}

function WebviewTab({ tabId, url, isActive, onSetup }: WebviewTabProps): React.ReactElement {
  const webviewRef = useRef<Electron.WebviewTag>(null)
  const initialUrl = useRef(url)

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return
    return onSetup(tabId, webview)
  }, [tabId])

  return (
    <webview
      ref={webviewRef}
      src={initialUrl.current}
      className={cn('absolute inset-0 h-full w-full', isActive ? 'z-10' : 'z-0 hidden')}
      // @ts-expect-error webview attributes not in React types
      allowpopups="true"
    />
  )
}
