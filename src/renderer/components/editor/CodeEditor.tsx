import { useEffect } from 'react'
import Editor, { DiffEditor, type Monaco } from '@monaco-editor/react'
import { useEditorStore } from '@/stores/editor-store'
import { useThemeStore } from '@/stores/theme-store'
import { registerMonacoThemes, MONACO_THEME_NAME } from '@/config/monaco-theme-registry'
import { X, FileWarning } from 'lucide-react'
import type { OpenFile } from '@/models/types'

const EXT_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  json: 'json',
  css: 'css',
  scss: 'scss',
  html: 'html',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  py: 'python',
  rs: 'rust',
  go: 'go',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  xml: 'xml',
  svg: 'xml',
  toml: 'ini',
  env: 'ini',
  graphql: 'graphql'
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'avif'])

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  avif: 'image/avif'
}

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return EXT_LANG[ext] ?? 'plaintext'
}

function getFileExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function BinaryPreview({ file }: { file: OpenFile }): React.ReactElement {
  const ext = getFileExt(file.name)

  if (ext === 'svg') {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 p-8">
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(file.content)}`}
          alt={file.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    )
  }

  if (IMAGE_EXTS.has(ext)) {
    const mime = MIME_MAP[ext] ?? 'image/png'
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 p-8">
        <img
          src={`data:${mime};base64,${file.content}`}
          alt={file.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-500">
      <FileWarning size={48} strokeWidth={1} />
      <span className="text-sm">Binary file — cannot display</span>
    </div>
  )
}

function handleBeforeMount(monaco: Monaco): void {
  registerMonacoThemes(monaco)
}

const EMPTY_FILES: OpenFile[] = []

export function CodeEditor({ projectId }: { projectId: string }): React.ReactElement {
  const getFullThemeId = useThemeStore((s) => s.getFullThemeId)
  const openFiles = useEditorStore((s) => s.statePerProject[projectId]?.openFiles ?? EMPTY_FILES)
  const activeFilePath = useEditorStore((s) => s.statePerProject[projectId]?.activeFilePath ?? null)
  const { setActiveFile, closeFile } = useEditorStore()

  const activeFile = openFiles.find((f) => f.path === activeFilePath)
  const themeId = getFullThemeId()
  const monacoTheme = MONACO_THEME_NAME[themeId] ?? 'github-dark'

  useEffect(() => {
    return window.api.fs.onFileChanged((path, content) => {
      useEditorStore.getState().updateFileContent(path, content)
    })
  }, [])

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex min-h-[36px] items-center gap-0 overflow-x-auto border-b border-zinc-800 bg-zinc-900/50">
        {openFiles.map((file) => (
          <div
            key={file.path}
            className={`group flex shrink-0 cursor-pointer items-center gap-1.5 border-r border-zinc-800 px-3 py-2 text-xs ${
              file.path === activeFilePath
                ? 'bg-zinc-950 text-zinc-200'
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
            }`}
            onClick={() => setActiveFile(projectId, file.path)}
          >
            <span className="truncate max-w-[120px]">{file.name}</span>
            <button
              className="ml-1 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-zinc-700"
              title="Close file"
              onClick={(e) => {
                e.stopPropagation()
                closeFile(projectId, file.path)
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1">
        {activeFile ? (
          activeFile.isBinary ? (
            <BinaryPreview file={activeFile} />
          ) : typeof activeFile.originalContent === 'string' ? (
            <DiffEditor
              key={`diff-${activeFile.path}`}
              original={activeFile.originalContent}
              modified={activeFile.content}
              language={detectLanguage(activeFile.name)}
              theme={monacoTheme}
              beforeMount={handleBeforeMount}
              options={{
                readOnly: true,
                renderSideBySide: false,
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 8 }
              }}
            />
          ) : (
            <Editor
              key={activeFile.path}
              value={activeFile.content}
              language={detectLanguage(activeFile.name)}
              theme={monacoTheme}
              beforeMount={handleBeforeMount}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 8 }
              }}
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-600">
            No file open
          </div>
        )}
      </div>
    </div>
  )
}
