import { useEffect } from 'react'
import { useGitStore } from '@/stores/git-store'
import { useProjectStore } from '@/stores/project-store'
import { GitBranch as GitBranchIcon, RefreshCw } from 'lucide-react'
import type { GitCommit } from '@/models/types'

const BRANCH_COLORS = [
  'text-green-400',
  'text-blue-400',
  'text-purple-400',
  'text-yellow-400',
  'text-pink-400',
  'text-cyan-400',
  'text-orange-400'
]

const BRANCH_BG_COLORS = [
  'bg-green-400/15 text-green-400',
  'bg-blue-400/15 text-blue-400',
  'bg-purple-400/15 text-purple-400',
  'bg-yellow-400/15 text-yellow-400',
  'bg-pink-400/15 text-pink-400',
  'bg-cyan-400/15 text-cyan-400',
  'bg-orange-400/15 text-orange-400'
]

function RefBadge({ label, index }: { label: string; index: number }): React.ReactElement {
  const isHead = label.startsWith('HEAD')
  const colorClass = isHead ? 'bg-red-400/15 text-red-400' : BRANCH_BG_COLORS[index % BRANCH_BG_COLORS.length]

  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${colorClass}`}>
      {label}
    </span>
  )
}

function CommitNode({ commit, colorIndex }: { commit: GitCommit; colorIndex: number }): React.ReactElement {
  const dotColor = BRANCH_COLORS[colorIndex % BRANCH_COLORS.length]
  const isMerge = commit.parents.length > 1

  return (
    <div className="group flex items-start gap-3 px-3 py-1 hover:bg-zinc-800/40">
      <div className="flex w-4 shrink-0 items-center justify-center pt-0.5">
        <div className={`${isMerge ? 'h-2.5 w-2.5 rounded-sm' : 'h-2 w-2 rounded-full'} ${dotColor.replace('text-', 'bg-')}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {commit.refs.length > 0 && (
            <div className="flex items-center gap-1">
              {commit.refs.map((ref, i) => (
                <RefBadge key={ref} label={ref} index={i} />
              ))}
            </div>
          )}
          <span className="truncate text-xs text-zinc-300">{commit.message}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-600">
          <span className="font-mono">{commit.shortHash}</span>
          <span>{commit.author}</span>
          <span>{commit.date}</span>
        </div>
      </div>
    </div>
  )
}

export function GitTree(): React.ReactElement {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const activeProject = useProjectStore((s) => {
    const id = s.activeProjectId
    return id ? s.projects.find((p) => p.id === id) : undefined
  })

  const isRepo = useGitStore((s) => activeProjectId ? s.isRepoPerProject[activeProjectId] : false)
  const commits = useGitStore((s) => activeProjectId ? s.commitsPerProject[activeProjectId] : undefined)
  const branches = useGitStore((s) => activeProjectId ? s.branchesPerProject[activeProjectId] : undefined)
  const { loadGitData } = useGitStore()

  useEffect(() => {
    if (!activeProject) return
    loadGitData(activeProject.id, activeProject.path)
  }, [activeProject?.id])

  const currentBranch = branches?.find((b) => b.current)

  if (!activeProject) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-zinc-600">
        Select a project
      </div>
    )
  }

  if (!isRepo) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-zinc-600">
        Not a git repository
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <GitBranchIcon size={14} className="text-zinc-500" />
          <span className="text-xs text-zinc-400">Git</span>
          {currentBranch && (
            <span className="rounded bg-green-400/15 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
              {currentBranch.name}
            </span>
          )}
        </div>
        <button
          onClick={() => activeProject && loadGitData(activeProject.id, activeProject.path)}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {commits?.map((commit, i) => (
          <CommitNode key={commit.hash} commit={commit} colorIndex={i % BRANCH_COLORS.length} />
        ))}
        {(!commits || commits.length === 0) && (
          <div className="p-4 text-center text-xs text-zinc-600">No commits yet</div>
        )}
      </div>
    </div>
  )
}
