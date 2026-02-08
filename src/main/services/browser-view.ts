import { BrowserWindow, WebContentsView } from 'electron'
import { DEVICE_CONFIGS, type DeviceMode, type NetworkEntry } from '@main/models/types'

interface TabView {
  view: WebContentsView
  pendingRequests: Map<string, { method: string; url: string; timestamp: number; type: string }>
}

const views = new Map<string, TabView>()
let activeTabId: string | null = null
let parentWindow: BrowserWindow | null = null

export function createView(tabId: string, win: BrowserWindow): void {
  destroyView(tabId)
  parentWindow = win

  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  const pendingRequests = new Map<
    string,
    { method: string; url: string; timestamp: number; type: string }
  >()

  win.contentView.addChildView(view)
  view.setBounds({ x: 0, y: 0, width: 0, height: 0 })

  view.webContents.on('console-message', (_event, level, message) => {
    if (!win.isDestroyed()) {
      const levelMap: Record<number, string> = { 0: 'log', 1: 'warn', 2: 'error', 3: 'info' }
      win.webContents.send('browser:console', tabId, {
        level: levelMap[level] || 'log',
        message,
        timestamp: Date.now()
      })
    }
  })

  views.set(tabId, { view, pendingRequests })
  setupCDP(tabId, win)

  activeTabId = tabId
}

function setupCDP(tabId: string, win: BrowserWindow): void {
  const entry = views.get(tabId)
  if (!entry) return

  try {
    entry.view.webContents.debugger.attach('1.3')
  } catch {
    return
  }

  entry.view.webContents.debugger.sendCommand('Network.enable')

  entry.view.webContents.debugger.on('message', (_event, method, params) => {
    if (win.isDestroyed()) return

    if (method === 'Network.requestWillBeSent') {
      entry.pendingRequests.set(params.requestId, {
        method: params.request.method,
        url: params.request.url,
        timestamp: params.timestamp * 1000,
        type: params.type || 'Other'
      })
    }

    if (method === 'Network.responseReceived') {
      const pending = entry.pendingRequests.get(params.requestId)
      if (pending) {
        const networkEntry: NetworkEntry = {
          id: params.requestId,
          method: pending.method,
          url: pending.url,
          status: params.response.status,
          type: pending.type,
          size: params.response.headers['content-length']
            ? parseInt(params.response.headers['content-length'])
            : 0,
          duration: params.timestamp * 1000 - pending.timestamp,
          timestamp: pending.timestamp
        }
        win.webContents.send('browser:network', tabId, networkEntry)
        entry.pendingRequests.delete(params.requestId)
      }
    }
  })
}

export function setActiveTab(
  tabId: string,
  bounds: { x: number; y: number; width: number; height: number }
): void {
  activeTabId = tabId

  for (const [id, entry] of views) {
    if (id === tabId) {
      entry.view.setBounds(bounds)
    } else {
      entry.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
    }
  }
}

export function navigate(tabId: string, url: string): void {
  const entry = views.get(tabId)
  if (!entry) return
  let normalizedUrl = url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    normalizedUrl = `https://${url}`
  }
  entry.view.webContents.loadURL(normalizedUrl)
}

export function setBounds(
  tabId: string,
  bounds: { x: number; y: number; width: number; height: number }
): void {
  if (tabId !== activeTabId) return
  const entry = views.get(tabId)
  if (!entry) return
  entry.view.setBounds(bounds)
}

export function setDevice(tabId: string, mode: DeviceMode): void {
  const entry = views.get(tabId)
  if (!entry) return
  const config = DEVICE_CONFIGS[mode]

  if (mode === 'desktop') {
    entry.view.webContents.disableDeviceEmulation()
    entry.view.webContents.setUserAgent('')
  } else {
    entry.view.webContents.enableDeviceEmulation({
      screenPosition: mode === 'mobile' ? 'mobile' : 'desktop',
      screenSize: { width: config.width, height: config.height },
      viewPosition: { x: 0, y: 0 },
      viewSize: { width: config.width, height: config.height },
      deviceScaleFactor: 2,
      scale: 1
    })
    entry.view.webContents.setUserAgent(config.userAgent)
  }
}

export function goBack(tabId: string): void {
  views.get(tabId)?.view.webContents.goBack()
}

export function goForward(tabId: string): void {
  views.get(tabId)?.view.webContents.goForward()
}

export function reload(tabId: string): void {
  views.get(tabId)?.view.webContents.reload()
}

export function destroyView(tabId: string): void {
  const entry = views.get(tabId)
  if (entry && parentWindow && !parentWindow.isDestroyed()) {
    parentWindow.contentView.removeChildView(entry.view)
    ;(entry.view.webContents as Electron.WebContents & { destroy(): void }).destroy?.()
  }
  views.delete(tabId)
  if (activeTabId === tabId) {
    activeTabId = null
  }
}

export function destroyAllViews(): void {
  for (const tabId of [...views.keys()]) {
    destroyView(tabId)
  }
  parentWindow = null
}
