import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'

interface TerminalInstanceProps {
  tabId: string
  projectId: string
  cwd: string
}

const terminalsMap = new Map<string, { terminal: Terminal; fitAddon: FitAddon }>()

export function TerminalInstance({ tabId, projectId, cwd }: TerminalInstanceProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const initRef = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || initRef.current) return
    initRef.current = true

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, Courier New, monospace',
      cols: 80,
      rows: 24,
      theme: {
        background: '#09090b',
        foreground: '#fafafa',
        cursor: '#fafafa',
        selectionBackground: '#27272a'
      }
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(el)
    terminalsMap.set(tabId, { terminal, fitAddon })

    terminal.onData((data) => {
      window.api.terminal.write(tabId, data)
    })

    terminal.onResize(({ cols, rows }) => {
      window.api.terminal.resize(tabId, cols, rows)
    })

    setTimeout(() => {
      fitAddon.fit()
      terminal.focus()
      window.api.terminal.create(tabId, projectId, cwd)
    }, 200)

    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const observer = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        try { fitAddon.fit() } catch { /* */ }
      }, 80)
    })
    observer.observe(el)

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      observer.disconnect()
    }
  }, [tabId, projectId, cwd])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  )
}

export function getTerminalInstance(
  tabId: string
): { terminal: Terminal; fitAddon: FitAddon } | undefined {
  return terminalsMap.get(tabId)
}

export function disposeTerminal(tabId: string): void {
  const entry = terminalsMap.get(tabId)
  if (entry) {
    entry.terminal.dispose()
    terminalsMap.delete(tabId)
  }
}
