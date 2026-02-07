import { useEffect } from 'react'
import { useTerminalStore } from '@/stores/terminal-store'
import { useProjectStore } from '@/stores/project-store'
import { TerminalInstance, getTerminalInstance, disposeTerminal } from './TerminalInstance'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TerminalPanel(): React.ReactElement {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const activeProject = useProjectStore((s) => {
    const id = s.activeProjectId
    return id ? s.projects.find((p) => p.id === id) : undefined
  })

  const tabs = useTerminalStore((s) => s.tabs)
  const activeTabPerProject = useTerminalStore((s) => s.activeTabPerProject)
  const { createTab, closeTab, setActiveTab } = useTerminalStore()

  const projectTabs = tabs.filter((t) => t.projectId === activeProjectId)
  const activeTabId = activeProjectId ? (activeTabPerProject[activeProjectId] || null) : null
  const activeTab = projectTabs.find((t) => t.id === activeTabId)

  useEffect(() => {
    const unsubData = window.api.terminal.onData((tabId, data) => {
      const entry = getTerminalInstance(tabId)
      entry?.terminal.write(data)
    })

    const unsubExit = window.api.terminal.onExit((tabId) => {
      disposeTerminal(tabId)
      useTerminalStore.getState().closeTab(tabId)
    })

    return () => {
      unsubData()
      unsubExit()
    }
  }, [])

  const handleNewTab = (): void => {
    if (!activeProject) return
    createTab(activeProject.id, activeProject.path)
  }

  const handleCloseTab = (tabId: string): void => {
    window.api.terminal.kill(tabId)
    disposeTerminal(tabId)
    closeTab(tabId)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#09090b' }}>
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
              onClick={() => activeProjectId && setActiveTab(activeProjectId, tab.id)}
            >
              <span>{tab.title}</span>
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
          disabled={!activeProject}
          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
        >
          <Plus size={14} />
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {!activeTab ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">
            {activeProject ? 'Click + to open a terminal' : 'Select a project first'}
          </div>
        ) : (
          <TerminalInstance
            key={activeTab.id}
            tabId={activeTab.id}
            projectId={activeTab.projectId}
            cwd={activeTab.cwd}
          />
        )}
      </div>
    </div>
  )
}
