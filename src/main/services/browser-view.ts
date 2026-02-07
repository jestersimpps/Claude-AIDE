import { BrowserWindow, WebContentsView } from 'electron'
import { DEVICE_CONFIGS, type DeviceMode, type NetworkEntry } from '@main/models/types'

let view: WebContentsView | null = null
let parentWindow: BrowserWindow | null = null
const pendingRequests = new Map<
  string,
  { method: string; url: string; timestamp: number; type: string }
>()

export function createView(win: BrowserWindow): void {
  destroyView()
  parentWindow = win

  view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  win.contentView.addChildView(view)
  view.setBounds({ x: 0, y: 0, width: 0, height: 0 })

  view.webContents.on('console-message', (_event, level, message) => {
    if (!win.isDestroyed()) {
      const levelMap: Record<number, string> = { 0: 'log', 1: 'warn', 2: 'error', 3: 'info' }
      win.webContents.send('browser:console', {
        level: levelMap[level] || 'log',
        message,
        timestamp: Date.now()
      })
    }
  })

  setupCDP(win)
}

function setupCDP(win: BrowserWindow): void {
  if (!view) return

  try {
    view.webContents.debugger.attach('1.3')
  } catch {
    return
  }

  view.webContents.debugger.sendCommand('Network.enable')

  view.webContents.debugger.on('message', (_event, method, params) => {
    if (win.isDestroyed()) return

    if (method === 'Network.requestWillBeSent') {
      pendingRequests.set(params.requestId, {
        method: params.request.method,
        url: params.request.url,
        timestamp: params.timestamp * 1000,
        type: params.type || 'Other'
      })
    }

    if (method === 'Network.responseReceived') {
      const pending = pendingRequests.get(params.requestId)
      if (pending) {
        const entry: NetworkEntry = {
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
        win.webContents.send('browser:network', entry)
        pendingRequests.delete(params.requestId)
      }
    }
  })
}

export function navigate(url: string): void {
  if (!view) return
  let normalizedUrl = url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    normalizedUrl = `https://${url}`
  }
  view.webContents.loadURL(normalizedUrl)
}

export function setBounds(bounds: { x: number; y: number; width: number; height: number }): void {
  if (!view) return
  view.setBounds(bounds)
}

export function setDevice(mode: DeviceMode): void {
  if (!view) return
  const config = DEVICE_CONFIGS[mode]

  if (mode === 'desktop') {
    view.webContents.disableDeviceEmulation()
    view.webContents.setUserAgent('')
  } else {
    view.webContents.enableDeviceEmulation({
      screenPosition: mode === 'mobile' ? 'mobile' : 'desktop',
      screenSize: { width: config.width, height: config.height },
      viewPosition: { x: 0, y: 0 },
      viewSize: { width: config.width, height: config.height },
      deviceScaleFactor: 2,
      scale: 1
    })
    view.webContents.setUserAgent(config.userAgent)
  }
}

export function goBack(): void {
  view?.webContents.goBack()
}

export function goForward(): void {
  view?.webContents.goForward()
}

export function reload(): void {
  view?.webContents.reload()
}

export function destroyView(): void {
  if (view && parentWindow && !parentWindow.isDestroyed()) {
    parentWindow.contentView.removeChildView(view)
    ;(view.webContents as Electron.WebContents & { destroy(): void }).destroy?.()
  }
  view = null
  parentWindow = null
  pendingRequests.clear()
}
