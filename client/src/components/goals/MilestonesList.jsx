import { useState } from 'react';
import { Plus, Flag, Calendar, Trash2, Edit2, Check, X, Sparkles } from 'lucide-react';

/**
 * MilestoneCard - Individual milestone card component
 */
export function MilestoneCard({ milestone, isSelected, onSelect, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(milestone.title);

  const handleSave = async () => {
    if (editTitle.trim() && editTitle !== milestone.title) {
      await onUpdate(milestone.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(milestone.title);
    setIsEditing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400 bg-green-400/20';
      case 'IN_PROGRESS': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLETED': return 'Done';
      case 'IN_PROGRESS': return 'Active';
      default: return 'Pending';
    }
  };

  return (
    <div
      onClick={() => !isEditing && onSelect(milestone)}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
        isSelected
          ? 'bg-blue-500/20 border-blue-500'
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
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
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
              <Flag size={16} className="text-blue-400 flex-shrink-0" />
              <h3 className="font-medium text-white truncate">{milestone.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(milestone.status)}`}>
                {getStatusLabel(milestone.status)}
              </span>
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{milestone.progress || 0}% complete</span>
              <span>{milestone.taskCount || 0} tasks</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${milestone.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Target date */}
          {milestone.targetDate && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <Calendar size={12} />
              <span>{formatDate(milestone.targetDate)}</span>
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
              onClick={(e) => { e.stopPropagation(); onDelete(milestone.id); }}
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
 * MilestonesList - List of milestones for a selected goal
 */
export function MilestonesList({ 
  goal, 
  milestones = [], 
  selectedMilestone, 
  onSelect, 
  onCreate, 
  onDelete, 
  onUpdate,
  onSuggestMilestones,
  loading 
}) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !goal) return;

    await onCreate(goal.id, {
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      targetDate: newTargetDate || null,
    });

    setNewTitle('');
    setNewDescription('');
    setNewTargetDate('');
    setShowForm(false);
  };

  if (!goal) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-gray-500">
        <Flag size={32} className="mb-2 opacity-50" />
        <p>Select a goal to view milestones</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Milestones</h2>
          <p className="text-xs text-gray-400 truncate max-w-[200px]">{goal.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {onSuggestMilestones && (
            <button
              onClick={() => onSuggestMilestones(goal.id)}
              className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
              title="AI Suggest Milestones"
            >
              <Sparkles size={18} />
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
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
            placeholder="Milestone title..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-2"
            autoFocus
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-2 resize-none"
            rows={2}
          />
          <input
            type="date"
            value={newTargetDate}
            onChange={(e) => setNewTargetDate(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 mb-3"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Milestone
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

      {/* Milestones List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading milestones...</div>
        ) : milestones.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Flag size={32} className="mx-auto mb-2 opacity-50" />
            <p>No milestones yet</p>
            <p className="text-sm">Click + to add a milestone</p>
          </div>
        ) : (
          milestones.map((milestone) => (
            <div key={milestone.id} className="group">
              <MilestoneCard
                milestone={milestone}
                isSelected={selectedMilestone?.id === milestone.id}
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

export default MilestonesList;
