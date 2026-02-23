import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGoalStore } from '../store/goalStore'
import AIChat from '../components/UI/AIChat'
import { goalApi } from '../services/api'

/* helpers */
const uid = () => Math.random().toString(36).substr(2, 9)
const parseDesc = (desc) => {
  if (!desc) return { text: '', subtasks: [] }
  try { const d = JSON.parse(desc); if (d && Array.isArray(d.subtasks)) return { text: d.text || '', subtasks: d.subtasks } } catch {}
  return { text: desc, subtasks: [] }
}
const encodeDesc = (text, subtasks) => {
  if (!subtasks?.length && !text) return null
  if (!subtasks?.length) return text
  return JSON.stringify({ text: text || '', subtasks })
}
/** Recursively flatten all leaf subtasks from a nested tree */
const flattenSubs = (subs) => {
  let out = []
  for (const s of subs) {
    out.push(s)
    if (s.children?.length) out = out.concat(flattenSubs(s.children))
  }
  return out
}
/** Count total leaves in nested subtask tree */
const countAllSubs = (subs) => flattenSubs(subs).length
/** Count completed leaves */
const countCompletedSubs = (subs) => flattenSubs(subs).filter(s => s.completed).length

const taskProg = (task) => {
  const { subtasks } = parseDesc(task.description)
  const total = countAllSubs(subtasks)
  if (total > 0) return Math.round(countCompletedSubs(subtasks) / total * 100)
  return task.status === 'COMPLETED' ? 100 : task.status === 'IN_PROGRESS' ? 50 : 0
}

/** Recursively add a child subtask under a given parent id */
const addChildSub = (subs, parentId, child) => {
  return subs.map(s => {
    if (s.id === parentId) return { ...s, children: [...(s.children || []), child] }
    if (s.children?.length) return { ...s, children: addChildSub(s.children, parentId, child) }
    return s
  })
}
/** Recursively remove a subtask by id */
const removeSubById = (subs, id) => {
  return subs.filter(s => s.id !== id).map(s => {
    if (s.children?.length) return { ...s, children: removeSubById(s.children, id) }
    return s
  })
}
/** Recursively toggle completed for a subtask by id */
const toggleSubById = (subs, id) => {
  return subs.map(s => {
    if (s.id === id) return { ...s, completed: !s.completed }
    if (s.children?.length) return { ...s, children: toggleSubById(s.children, id) }
    return s
  })
}
const allTasks = (goal) => goal?.milestones?.flatMap(m => m.tasks || []) || []
const goalProg = (goal) => { const t = allTasks(goal); return t.length ? Math.round(t.reduce((s, tk) => s + taskProg(tk), 0) / t.length) : 0 }
const getTaskCount = (goal) => { if (!goal.milestones) return 0; return goal.milestones.reduce((sum, m) => sum + (m._count?.tasks || m.tasks?.length || 0), 0) }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
const daysLeft = (d) => d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null

const statusLabel = { PENDING: 'Pending', IN_PROGRESS: 'Active', COMPLETED: 'Completed' }
const statusStyles = { PENDING: 'bg-gray-100 text-gray-600 hover:bg-gray-200', IN_PROGRESS: 'bg-blue-100 text-blue-700 hover:bg-blue-200', COMPLETED: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' }
const priorityStyles = { HIGH: 'bg-red-50 text-red-600 border border-red-200', MEDIUM: 'bg-amber-50 text-amber-600 border border-amber-200', LOW: 'bg-emerald-50 text-emerald-600 border border-emerald-200' }
const statusCycle = { PENDING: 'IN_PROGRESS', IN_PROGRESS: 'COMPLETED', COMPLETED: 'PENDING' }

/* ======== Subtask Tree Editor (used in modals) ======== */
function SubtaskTreeEditor({ subtasks, onAdd, onAddChild, onRemove, depth = 0 }) {
  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-indigo-100 pl-3' : ''}>
      {subtasks.map(s => (
        <SubtaskNodeEditor key={s.id} node={s} onAdd={onAdd} onAddChild={onAddChild} onRemove={onRemove} depth={depth} />
      ))}
    </div>
  )
}

function SubtaskNodeEditor({ node, onAdd, onAddChild, onRemove, depth }) {
  const [childText, setChildText] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleAddChild = () => {
    if (!childText.trim()) return
    onAddChild(node.id, childText.trim())
    setChildText('')
    setShowInput(false)
  }

  return (
    <div className="mb-1">
      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 group/node">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${depth === 0 ? 'bg-indigo-500' : depth === 1 ? 'bg-indigo-400' : 'bg-indigo-300'}`} />
          <span className="text-sm text-gray-700">{node.title}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover/node:opacity-100 transition-opacity">
          <button onClick={() => setShowInput(!showInput)} className="p-1 text-indigo-400 hover:text-indigo-600 rounded transition-colors" title="Add sub-subtask">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
          <button onClick={() => onRemove(node.id)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      {showInput && (
        <div className="flex gap-1.5 ml-6 mt-1 mb-1.5">
          <input
            type="text"
            value={childText}
            onChange={e => setChildText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChild() } if (e.key === 'Escape') setShowInput(false) }}
            placeholder="Sub-subtask name..."
            className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-all"
            autoFocus
          />
          <button onClick={handleAddChild} disabled={!childText.trim()} className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Add
          </button>
        </div>
      )}
      {node.children?.length > 0 && (
        <SubtaskTreeEditor subtasks={node.children} onAdd={onAdd} onAddChild={onAddChild} onRemove={onRemove} depth={depth + 1} />
      )}
    </div>
  )
}

/* ======== Task Modal ======== */
function TaskModal({ open, onClose, onSubmit, editTask }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [subtasks, setSubtasks] = useState([])
  const [sub, setSub] = useState('')

  useEffect(() => {
    if (!open) return
    if (editTask) {
      const parsed = parseDesc(editTask.description)
      setTitle(editTask.title)
      setDesc(parsed.text)
      setDate(editTask.dueDate ? new Date(editTask.dueDate).toISOString().split('T')[0] : '')
      setPriority(editTask.priority || 'MEDIUM')
      setSubtasks(parsed.subtasks)
    } else {
      setTitle(''); setDesc(''); setDate(''); setPriority('MEDIUM'); setSubtasks([])
    }
    setSub('')
  }, [editTask, open])

  const addRootSub = () => { if (!sub.trim()) return; setSubtasks(p => [...p, { id: uid(), title: sub.trim(), completed: false, children: [] }]); setSub('') }
  const addChild = (parentId, text) => setSubtasks(p => addChildSub(p, parentId, { id: uid(), title: text, completed: false, children: [] }))
  const removeSub = (id) => setSubtasks(p => removeSubById(p, id))
  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: encodeDesc(desc, subtasks), dueDate: date || null, priority })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-gray-900">{editTask ? 'Edit Task' : 'Add Task Manually'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 pb-6 space-y-4 mt-2">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Task name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" autoFocus />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional details..." rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 appearance-none cursor-pointer transition-all">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subtasks</label>
            <div className="flex gap-2 mb-3">
              <input type="text" value={sub} onChange={e => setSub(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRootSub() } }} placeholder="Add a subtask..." className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
              <button onClick={addRootSub} disabled={!sub.trim()} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add
              </button>
            </div>
            {subtasks.length > 0 && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 max-h-56 overflow-y-auto">
                <SubtaskTreeEditor subtasks={subtasks} onAdd={addRootSub} onAddChild={addChild} onRemove={removeSub} />
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={!title.trim()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 hover:shadow-lg">
              {editTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ======== Subtask Tree View (display in TaskCard) ======== */
function SubtaskTreeView({ subtasks, task, onToggleSubtask, depth = 0 }) {
  return (
    <div className={depth > 0 ? 'ml-5 border-l-2 border-indigo-50 pl-2' : 'space-y-0.5'}>
      {subtasks.map(s => (
        <div key={s.id}>
          <label className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input type="checkbox" checked={s.completed} onChange={() => onToggleSubtask(task, s.id)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
            <span className={`text-sm transition-colors ${s.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{s.title}</span>
          </label>
          {s.children?.length > 0 && (
            <SubtaskTreeView subtasks={s.children} task={task} onToggleSubtask={onToggleSubtask} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ======== Task Card ======== */
function TaskCard({ task, onToggleStatus, onEdit, onDelete, onToggleSubtask }) {
  const parsed = parseDesc(task.description)
  const progress = taskProg(task)

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`font-semibold text-[15px] ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</h4>
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${priorityStyles[task.priority] || priorityStyles.MEDIUM}`}>{task.priority}</span>
          </div>
          {parsed.text && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{parsed.text}</p>}
          {task.dueDate && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{fmtDate(task.dueDate)}</span>
              {(() => { const d = daysLeft(task.dueDate); if (d === null) return null; return <span className={`font-medium ${d < 0 ? 'text-red-500' : d < 7 ? 'text-amber-500' : 'text-gray-400'}`}>({d < 0 ? `${Math.abs(d)}d overdue` : `${d}d left`})</span> })()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => onToggleStatus(task.id, statusCycle[task.status] || 'PENDING')} className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 ${statusStyles[task.status] || statusStyles.PENDING}`} title="Click to change status">{statusLabel[task.status] || 'Pending'}</button>
          <button onClick={() => onEdit(task)} className="p-1.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Edit task">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Delete task">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
          <span>{progress}% complete</span>
          {parsed.subtasks.length > 0 && <span>{countCompletedSubs(parsed.subtasks)}/{countAllSubs(parsed.subtasks)} subtasks</span>}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-indigo-500' : 'bg-gray-200'}`} style={{ width: `${Math.max(progress, 2)}%` }} />
        </div>
      </div>
      {parsed.subtasks.length > 0 && (
        <div className="mt-3">
          <SubtaskTreeView subtasks={parsed.subtasks} task={task} onToggleSubtask={onToggleSubtask} />
        </div>
      )}
    </div>
  )
}

/* ======== Goal Modal ======== */
function GoalModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [subtasks, setSubtasks] = useState([])
  const [sub, setSub] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(''); setDesc(''); setDate(''); setPriority('MEDIUM'); setSubtasks([]); setSub('')
  }, [open])

  const addRootSub = () => { if (!sub.trim()) return; setSubtasks(p => [...p, { id: uid(), title: sub.trim(), completed: false, children: [] }]); setSub('') }
  const addChild = (parentId, text) => setSubtasks(p => addChildSub(p, parentId, { id: uid(), title: text, completed: false, children: [] }))
  const removeSub = (id) => setSubtasks(p => removeSubById(p, id))
  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: desc.trim() || null, targetDate: date || null, priority, subtasks })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-gray-900">Create New Goal</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 pb-6 space-y-4 mt-2">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" autoFocus />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional details..." rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 appearance-none cursor-pointer transition-all">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subtasks</label>
            <div className="flex gap-2 mb-3">
              <input type="text" value={sub} onChange={e => setSub(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRootSub() } }} placeholder="Add a subtask..." className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
              <button onClick={addRootSub} disabled={!sub.trim()} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add
              </button>
            </div>
            {subtasks.length > 0 && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 max-h-56 overflow-y-auto">
                <SubtaskTreeEditor subtasks={subtasks} onAdd={addRootSub} onAddChild={addChild} onRemove={removeSub} />
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={!title.trim()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 hover:shadow-lg">
              Create Goal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ======== Main Goals Page ======== */
const Goals = () => {
  const [expandedGoalId, setExpandedGoalId] = useState(null)
  const [expandedGoalData, setExpandedGoalData] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalGoalId, setModalGoalId] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [aiObjective, setAiObjective] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [thinkingMode, setThinkingMode] = useState(true)

  const { goals, loading, error, fetchGoals, createGoal, deleteGoal, clearError } = useGoalStore()

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const toggleGoal = async (goalId) => {
    if (expandedGoalId === goalId) { setExpandedGoalId(null); setExpandedGoalData(null); return }
    setExpandedGoalId(goalId)
    try { const data = await goalApi.getGoal(goalId); setExpandedGoalData(data) } catch (err) { console.error('Failed to load goal:', err) }
  }

  const refreshGoal = async (goalId) => {
    try { const data = await goalApi.getGoal(goalId); setExpandedGoalData(data); await fetchGoals() } catch (err) { console.error('Refresh failed:', err) }
  }

  const handleCreateGoal = async (goalData) => {
    const { title, description, targetDate, priority, subtasks } = goalData
    if (!title.trim()) return
    const goal = await createGoal({ title: title.trim(), description, targetDate })
    // If subtasks were provided, create a milestone + task with subtasks automatically
    if (goal && subtasks?.length > 0) {
      try {
        const ms = await goalApi.createMilestone(goal.id, { title: 'Tasks', description: null, targetDate: null })
        await goalApi.createTask(ms.id, { title: title.trim(), description: encodeDesc(description || '', subtasks), dueDate: targetDate, priority })
      } catch (err) { console.error('Failed to create initial task:', err) }
    }
    setShowGoalModal(false)
    await fetchGoals()
  }

  const openAddTask = (goalId) => { setModalGoalId(goalId); setEditingTask(null); setShowModal(true) }
  const openEditTask = (goalId, task) => { setModalGoalId(goalId); setEditingTask(task); setShowModal(true) }

  const handleTaskSubmit = async (taskData) => {
    try {
      if (editingTask) {
        await goalApi.updateTask(editingTask.id, taskData)
      } else {
        let goalData = expandedGoalData
        if (!goalData || goalData.id !== modalGoalId) goalData = await goalApi.getGoal(modalGoalId)
        let msId
        if (goalData.milestones?.length > 0) { msId = goalData.milestones[0].id }
        else { const ms = await goalApi.createMilestone(modalGoalId, { title: 'Tasks', description: null, targetDate: null }); msId = ms.id }
        await goalApi.createTask(msId, taskData)
      }
      await refreshGoal(modalGoalId)
      setShowModal(false)
    } catch (err) { console.error('Task operation failed:', err) }
  }

  const handleDeleteTask = async (goalId, taskId) => { try { await goalApi.deleteTask(taskId); await refreshGoal(goalId) } catch (err) { console.error('Delete failed:', err) } }
  const handleToggleStatus = async (goalId, taskId, newStatus) => { try { await goalApi.toggleTaskStatus(taskId, newStatus); await refreshGoal(goalId) } catch (err) { console.error('Status toggle failed:', err) } }

  const handleToggleSubtask = async (goalId, task, subtaskId) => {
    const { text, subtasks } = parseDesc(task.description)
    const updated = toggleSubById(subtasks, subtaskId)
    try { await goalApi.updateTask(task.id, { description: encodeDesc(text, updated) }); await refreshGoal(goalId) } catch (err) { console.error('Subtask toggle failed:', err) }
  }

  const startGoalDiscussion = async () => {
    if (!aiObjective.trim()) return
    setShowChat(true); setIsLoading(true); setChatError(null); setChatMessages([]); setStreamingContent('')
    const userMessage = { role: 'user', content: `I want to achieve this goal: "${aiObjective}". Can you help me break it down into manageable subgoals?` }
    setChatMessages([userMessage])
    try {
      const response = await goalApi.discuss({ goal: aiObjective, conversationHistory: [], enableThinking: thinkingMode }, (chunk, fullContent) => setStreamingContent(fullContent))
      setChatMessages([userMessage, { role: 'assistant', content: response.message }]); setStreamingContent('')
    } catch (err) { setChatError(err.message); setChatMessages([userMessage, { role: 'error', content: `Error: ${err.message}` }]); setStreamingContent('') }
    finally { setIsLoading(false) }
  }

  const handleSendMessage = async (message) => {
    const newMessages = [...chatMessages, { role: 'user', content: message }]
    setChatMessages(newMessages); setIsLoading(true); setChatError(null); setStreamingContent('')
    try {
      const response = await goalApi.discuss({ goal: aiObjective, conversationHistory: newMessages, userMessage: message, enableThinking: thinkingMode }, (chunk, fullContent) => setStreamingContent(fullContent))
      setChatMessages([...newMessages, { role: 'assistant', content: response.message }]); setStreamingContent('')
    } catch (err) { setChatError(err.message); setChatMessages([...newMessages, { role: 'error', content: `Error: ${err.message}` }]); setStreamingContent('') }
    finally { setIsLoading(false) }
  }

  const applyAISuggestions = async () => {
    if (chatMessages.length < 2) return
    setIsLoading(true); setChatError(null)
    try {
      const response = await goalApi.extractSubgoals({ goal: aiObjective, conversationHistory: chatMessages })
      if (response.subgoals?.length > 0) {
        for (const subgoal of response.subgoals) {
          await createGoal({ title: subgoal.title, description: subgoal.description || null, targetDate: subgoal.estimatedDays ? new Date(Date.now() + subgoal.estimatedDays * 86400000).toISOString() : null })
        }
        await fetchGoals(); setShowChat(false); setAiObjective('')
      }
    } catch (err) { setChatError(err.message) }
    finally { setIsLoading(false) }
  }

  const summary = useMemo(() => {
    const tasks = expandedGoalData ? allTasks(expandedGoalData) : []
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'COMPLETED').length
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const pending = tasks.filter(t => t.status === 'PENDING').length
    const remaining = total - completed
    let estimate = '\u2014'
    if (remaining > 0) {
      const dueDates = tasks.filter(t => t.dueDate && t.status !== 'COMPLETED').map(t => new Date(t.dueDate))
      if (dueDates.length > 0) { const maxDate = new Date(Math.max(...dueDates)); estimate = `${Math.max(1, Math.ceil((maxDate - Date.now()) / 86400000))} Days` }
      else { estimate = `${remaining * 3} Days` }
    } else if (total > 0) { estimate = 'Done!' }
    return { total, completed, inProgress, pending, estimate }
  }, [expandedGoalData])

  const quickActions = ["I have about 3 months for this", "I can dedicate 2 hours daily", "What should I prioritize first?", "These look good, finalize them"]

  return (
    <div className="flex h-full bg-gray-50/50">
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${showChat ? 'pr-0' : ''}`}>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-indigo-600 transition-colors mb-6 group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">My Goals</h1>
              <p className="text-gray-500 text-sm">Track your progress and stay focused on what matters.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 text-center shadow-sm">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Total Goals</p>
              <p className="text-xl font-extrabold text-indigo-700">{goals.length}</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
              <span><strong>Error:</strong> {error}</span>
              <button onClick={clearError} className="text-red-500 hover:text-red-700 text-xs font-semibold">Dismiss</button>
            </div>
          )}

          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/80 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">AI Goal Coach</h3>
                <p className="text-xs text-gray-500">Let AI help you break down goals into actionable steps</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="text" value={aiObjective} onChange={e => setAiObjective(e.target.value)} onKeyDown={e => e.key === 'Enter' && startGoalDiscussion()} placeholder="Describe your goal and discuss with AI..." className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all" />
              <button onClick={() => setThinkingMode(!thinkingMode)} className={`px-3.5 py-3 rounded-xl text-xs font-semibold transition-all border ${thinkingMode ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`} title={thinkingMode ? 'Deep thinking ON' : 'Fast mode'}>
                {thinkingMode ? '\uD83E\uDDE0 Deep' : '\u26A1 Fast'}
              </button>
              <button onClick={startGoalDiscussion} disabled={!aiObjective.trim() || isLoading} className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md">Discuss</button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Or create manually</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="mb-8 flex justify-center">
            <button onClick={() => setShowGoalModal(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 hover:shadow-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create New Goal
            </button>
          </div>

          {loading && goals.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="animate-pulse"><div className="w-14 h-14 bg-gray-100 rounded-2xl mx-auto mb-4" /><p className="text-gray-400 font-medium">Loading goals...</p></div>
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <p className="text-gray-600 font-semibold mb-1">No goals yet</p>
              <p className="text-sm text-gray-400">Create your first goal above to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map(goal => {
                const isExpanded = expandedGoalId === goal.id
                const tasks = isExpanded && expandedGoalData ? allTasks(expandedGoalData) : []
                const progress = isExpanded && expandedGoalData ? goalProg(expandedGoalData) : (goal.progress || 0)
                const taskCount = isExpanded && expandedGoalData ? allTasks(expandedGoalData).length : getTaskCount(goal)

                return (
                  <div key={goal.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'border-indigo-200 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="px-6 py-5 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => toggleGoal(goal.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-indigo-600' : 'bg-indigo-100'}`}>
                            <svg className={`w-5 h-5 ${isExpanded ? 'text-white' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 truncate text-[16px]">{goal.title}</h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-xs text-gray-400 font-medium">{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} />
                                </div>
                                <span className={`text-xs font-semibold ${progress === 100 ? 'text-emerald-600' : 'text-gray-500'}`}>{progress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={e => { e.stopPropagation(); openAddTask(goal.id); if (!isExpanded) toggleGoal(goal.id) }} className="px-3.5 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Task
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteGoal(goal.id) }} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete goal">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                          <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>

                    {isExpanded && expandedGoalData && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        {tasks.length === 0 ? (
                          <div className="text-center py-10">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <p className="text-sm text-gray-400 font-medium">No tasks yet</p>
                            <p className="text-xs text-gray-400 mt-1">Click "Add Task" to get started</p>
                          </div>
                        ) : (
                          <div className="space-y-3 mt-4">
                            {tasks.map(task => (
                              <TaskCard key={task.id} task={task} onToggleStatus={(id, status) => handleToggleStatus(goal.id, id, status)} onEdit={t => openEditTask(goal.id, t)} onDelete={id => handleDeleteTask(goal.id, id)} onToggleSubtask={(t, sId) => handleToggleSubtask(goal.id, t, sId)} />
                            ))}
                          </div>
                        )}

                        {tasks.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4">
                              <div className="flex items-center gap-8">
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Tasks</p>
                                  <p className="text-2xl font-extrabold text-gray-900">{summary.total}</p>
                                </div>
                                <div className="w-px h-10 bg-gray-200" />
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Completed</p>
                                  <p className="text-2xl font-extrabold text-emerald-600">{summary.completed}</p>
                                </div>
                                <div className="w-px h-10 bg-gray-200" />
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">In Progress</p>
                                  <p className="text-2xl font-extrabold text-blue-600">{summary.inProgress}</p>
                                </div>
                              </div>
                              <div className="text-center bg-white border border-gray-200 rounded-xl px-5 py-2.5 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Completion Estimate</p>
                                <p className="text-xl font-extrabold text-indigo-600">{summary.estimate}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <TaskModal open={showModal} onClose={() => setShowModal(false)} onSubmit={handleTaskSubmit} editTask={editingTask} />
      <GoalModal open={showGoalModal} onClose={() => setShowGoalModal(false)} onSubmit={handleCreateGoal} />

      {showChat && (
        <div className="w-96 border-l border-gray-100 flex flex-col bg-gray-50 shrink-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h3 className="font-semibold text-gray-900">Goal Discussion</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setThinkingMode(!thinkingMode)} title={thinkingMode ? 'Deep thinking ON' : 'Fast mode'} className={`p-1.5 rounded-lg transition-all duration-300 flex items-center gap-1 ${thinkingMode ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                <span className="text-[10px] font-medium">{thinkingMode ? 'Deep' : 'Fast'}</span>
              </button>
              <button onClick={applyAISuggestions} disabled={chatMessages.length < 2 || isLoading} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Apply Suggestions</button>
              <button onClick={() => setShowChat(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <AIChat messages={chatMessages} onSendMessage={handleSendMessage} isLoading={isLoading} placeholder="Discuss your goal with AI..." quickActions={quickActions} title="Goal Coach" subtitle="Helping you plan" streamingContent={streamingContent} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Goals
