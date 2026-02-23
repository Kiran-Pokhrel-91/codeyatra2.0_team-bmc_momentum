import { useState } from 'react';
import { Plus, Target, Calendar, Trash2, Edit2, Check, X } from 'lucide-react';

/**
 * GoalCard - Individual goal card component
 */
export function GoalCard({ goal, isSelected, onSelect, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);

  const handleSave = async () => {
    if (editTitle.trim() && editTitle !== goal.title) {
      await onUpdate(goal.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(goal.title);
    setIsEditing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const daysLeft = goal.targetDate 
    ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      onClick={() => !isEditing && onSelect(goal)}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
        isSelected
          ? 'bg-purple-500/20 border-purple-500'
          : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                className="p-1 text-green-400 hover:text-green-300"
              >
                <Check size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Target size={16} className="text-purple-400 flex-shrink-0" />
              <h3 className="font-medium text-white truncate">{goal.title}</h3>
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{goal.progress || 0}% complete</span>
              <span>{goal.milestoneCount || 0} milestones</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${goal.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Target date */}
          {goal.targetDate && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <Calendar size={12} />
              <span>
                {formatDate(goal.targetDate)}
                {daysLeft !== null && (
                  <span className={daysLeft < 0 ? 'text-red-400' : daysLeft < 7 ? 'text-yellow-400' : ''}>
                    {' '}({daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
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
 * GoalsList - List of goals with add functionality
 */
export function GoalsList({ goals, selectedGoal, onSelect, onCreate, onDelete, onUpdate, loading }) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await onCreate({
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      targetDate: newTargetDate || null,
    });

    setNewTitle('');
    setNewDescription('');
    setNewTargetDate('');
    setShowForm(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Goals</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Goal title..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-2"
            autoFocus
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-2 resize-none"
            rows={2}
          />
          <input
            type="date"
            value={newTargetDate}
            onChange={(e) => setNewTargetDate(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 mb-3"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="flex-1 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Goal
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

      {/* Goals List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Target size={32} className="mx-auto mb-2 opacity-50" />
            <p>No goals yet</p>
            <p className="text-sm">Click + to create your first goal</p>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="group">
              <GoalCard
                goal={goal}
                isSelected={selectedGoal?.id === goal.id}
                onSelect={onSelect}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default GoalsList;
