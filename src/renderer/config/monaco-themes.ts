import type { editor } from 'monaco-editor'
import type { Monaco } from '@monaco-editor/react'

type Theme = 'dark' | 'light'

const GITHUB_DARK: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'e6edf3' },
    { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff7b72' },
    { token: 'keyword.control', foreground: 'ff7b72' },
    { token: 'string', foreground: 'a5d6ff' },
    { token: 'number', foreground: '79c0ff' },
    { token: 'type', foreground: 'ffa657' },
    { token: 'type.identifier', foreground: 'ffa657' },
    { token: 'identifier', foreground: 'e6edf3' },
    { token: 'variable', foreground: 'ffa657' },
    { token: 'constant', foreground: '79c0ff' },
    { token: 'function', foreground: 'd2a8ff' },
    { token: 'operator', foreground: 'ff7b72' },
    { token: 'delimiter', foreground: 'e6edf3' },
    { token: 'tag', foreground: '7ee787' },
    { token: 'attribute.name', foreground: '79c0ff' },
    { token: 'attribute.value', foreground: 'a5d6ff' },
    { token: 'metatag', foreground: 'e6edf3' },
    { token: 'regexp', foreground: '7ee787' }
  ],
  colors: {
    'editor.background': '#09090b',
    'editor.foreground': '#e6edf3',
    'editor.lineHighlightBackground': '#161b22',
    'editor.selectionBackground': '#264f78',
    'editorCursor.foreground': '#58a6ff',
    'editorWhitespace.foreground': '#21262d',
    'editorLineNumber.foreground': '#484f58',
    'editorLineNumber.activeForeground': '#e6edf3',
    'editorIndentGuide.background': '#21262d',
    'editorIndentGuide.activeBackground': '#30363d',
    'editor.selectionHighlightBackground': '#3fb95040',
    'editorBracketMatch.background': '#3fb95040',
    'editorBracketMatch.border': '#3fb95099'
  }
}

const GITHUB_LIGHT: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: '', foreground: '1f2328' },
    { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'cf222e' },
    { token: 'keyword.control', foreground: 'cf222e' },
    { token: 'string', foreground: '0a3069' },
    { token: 'number', foreground: '0550ae' },
    { token: 'type', foreground: '953800' },
    { token: 'type.identifier', foreground: '953800' },
    { token: 'identifier', foreground: '1f2328' },
    { token: 'variable', foreground: '953800' },
    { token: 'constant', foreground: '0550ae' },
    { token: 'function', foreground: '8250df' },
    { token: 'operator', foreground: 'cf222e' },
    { token: 'delimiter', foreground: '1f2328' },
    { token: 'tag', foreground: '116329' },
    { token: 'attribute.name', foreground: '0550ae' },
    { token: 'attribute.value', foreground: '0a3069' },
    { token: 'metatag', foreground: '1f2328' },
    { token: 'regexp', foreground: '116329' }
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#1f2328',
    'editor.lineHighlightBackground': '#f6f8fa',
    'editor.selectionBackground': '#add6ff',
    'editorCursor.foreground': '#0969da',
    'editorWhitespace.foreground': '#d0d7de',
    'editorLineNumber.foreground': '#8c959f',
    'editorLineNumber.activeForeground': '#1f2328',
    'editorIndentGuide.background': '#d8dee4',
    'editorIndentGuide.activeBackground': '#afb8c1',
    'editor.selectionHighlightBackground': '#4ac26b40',
    'editorBracketMatch.background': '#4ac26b40',
    'editorBracketMatch.border': '#4ac26b99'
  }
}

export const MONACO_THEME_NAME: Record<Theme, string> = {
  dark: 'github-dark',
  light: 'github-light'
}

export function registerMonacoThemes(monaco: Monaco): void {
  monaco.editor.defineTheme(MONACO_THEME_NAME.dark, GITHUB_DARK)
  monaco.editor.defineTheme(MONACO_THEME_NAME.light, GITHUB_LIGHT)
}
