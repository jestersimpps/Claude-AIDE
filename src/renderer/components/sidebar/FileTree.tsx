import { useEffect } from 'react'
import { useFileTreeStore } from '@/stores/filetree-store'
import { useProjectStore } from '@/stores/project-store'
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'
import type { FileNode } from '@/models/types'

function TreeNode({
  node,
  depth,
  projectId
}: {
  node: FileNode
  depth: number
  projectId: string
}): React.ReactElement {
  const expandedPaths = useFileTreeStore((s) => s.expandedPerProject[projectId])
  const { toggleExpanded } = useFileTreeStore()
  const isExpanded = expandedPaths?.has(node.path) ?? false

  if (!node.isDirectory) {
    return (
      <div
        className="flex cursor-default items-center gap-1.5 rounded-sm px-1 py-0.5 text-sm text-zinc-400 hover:bg-zinc-800/50"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <File size={14} className="shrink-0 text-zinc-600" />
        <span className="truncate">{node.name}</span>
      </div>
    )
  }

  return (
    <div>
      <div
        className="flex cursor-pointer items-center gap-1.5 rounded-sm px-1 py-0.5 text-sm text-zinc-300 hover:bg-zinc-800/50"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => toggleExpanded(projectId, node.path)}
      >
        {isExpanded ? (
          <ChevronDown size={14} className="shrink-0 text-zinc-500" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-zinc-500" />
        )}
        <Folder size={14} className="shrink-0 text-zinc-500" />
        <span className="truncate">{node.name}</span>
      </div>
      {isExpanded &&
        node.children?.map((child) => (
          <TreeNode key={child.path} node={child} depth={depth + 1} projectId={projectId} />
        ))}
    </div>
  )
}

export function FileTree(): React.ReactElement {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const activeProject = useProjectStore((s) => {
    const id = s.activeProjectId
    return id ? s.projects.find((p) => p.id === id) : undefined
  })
  const tree = useFileTreeStore((s) =>
    activeProjectId ? s.treePerProject[activeProjectId] : undefined
  )
  const { loadTree, setTree } = useFileTreeStore()

  useEffect(() => {
    if (!activeProject) return

    if (!tree) {
      loadTree(activeProject.id, activeProject.path)
    }

    window.api.fs.watch(activeProject.path)

    const unsub = window.api.fs.onTreeChanged((newTree) => {
      setTree(activeProject.id, newTree as FileNode)
    })

    return () => {
      unsub()
      window.api.fs.unwatch()
    }
  }, [activeProject?.id])

  if (!activeProject) {
    return (
      <div className="p-4 text-center text-xs text-zinc-600">Select a project to browse files</div>
    )
  }

  if (!tree) {
    return <div className="p-4 text-center text-xs text-zinc-600">Loading...</div>
  }

  return (
    <div className="flex flex-col overflow-y-auto p-1">
      {tree.children?.map((child) => (
        <TreeNode key={child.path} node={child} depth={0} projectId={activeProject.id} />
      ))}
    </div>
  )
}
