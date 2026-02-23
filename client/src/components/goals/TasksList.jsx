import { useState } from 'react';
import { Plus, CheckSquare, Square, Clock, Trash2, Edit2, Check, X, Sparkles, AlertCircle } from 'lucide-react';

/**
 * TaskItem - Individual task item component
 */
export function TaskItem({ task, onToggle, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleSave = async () => {
    if (editTitle.trim() && editTitle !== task.title) {
      await onUpdate(task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'text-red-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'LOW': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'COMPLETED':
        return <CheckSquare size={18} className="text-green-400" />;
      case 'IN_PROGRESS':
        return <Clock size={18} className="text-yellow-400" />;
      default:
        return <Square size={18} className="text-gray-400" />;
    }
  };

  const formatDuration = (mins) => {
    if (!mins) return null;
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
  };

  return (
    <div
      className={`group p-3 rounded-lg transition-all duration-200 ${
        task.status === 'COMPLETED'
          ? 'bg-white/5 opacity-60'
          : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={() => onToggle(task.id)}
          className="mt-0.5 hover:scale-110 transition-transform"
        >
          {getStatusIcon()}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <button
                onClick={handleSave}
                className="p-1 text-green-400 hover:text-green-300"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <p className={`text-sm ${
                task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-white'
              }`}>
                {task.title}
              </p>
              
              {/* Meta info */}
              <div className="flex items-center gap-3 mt-1">
                {task.priority && (
                  <span className={`text-xs flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                    <AlertCircle size={10} />
                    {task.priority.toLowerCase()}
                  </span>
                )}
                {task.estimatedMins && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={10} />
                    {formatDuration(task.estimatedMins)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/10"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * TasksList - List of tasks for a selected milestone
 */
export function TasksList({ 
  milestone, 
  tasks = [], 
  onCreate, 
  onToggle, 
  onDelete, 
  onUpdate,
  onSuggestTasks,
  loading 
}) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEstimatedMins, setNewEstimatedMins] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !milestone) return;

    await onCreate(milestone.id, {
      title: newTitle.trim(),
      estimatedMins: newEstimatedMins ? parseInt(newEstimatedMins) : null,
      priority: newPriority,
    });

    setNewTitle('');
    setNewEstimatedMins('');
    setNewPriority('MEDIUM');
    setShowForm(false);
  };

  if (!milestone) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-gray-500">
        <CheckSquare size={32} className="mb-2 opacity-50" />
        <p>Select a milestone to view tasks</p>
      </div>
    );
  }

  // Separate tasks by status
  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Tasks</h2>
          <p className="text-xs text-gray-400 truncate max-w-[200px]">{milestone.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {onSuggestTasks && (
            <button
              onClick={() => onSuggestTasks(milestone.id)}
              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              title="AI Suggest Tasks"
            >
              <Sparkles size={18} />
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 mb-2"
            autoFocus
          />
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={newEstimatedMins}
              onChange={(e) => setNewEstimatedMins(e.target.value)}
              placeholder="Est. mins"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Task
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg text-sm hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <CheckSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p>No tasks yet</p>
            <p className="text-sm">Click + to add a task</p>
          </div>
        ) : (
          <>
            {/* Pending tasks */}
            {pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <>
                <div className="pt-3 pb-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Completed ({completedTasks.length})
                  </p>
                </div>
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TasksList;
