import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useGoalStore } from '../store/goalStore';
import { GoalsList } from '../components/goals/GoalsList';
import { MilestonesList } from '../components/goals/MilestonesList';
import { TasksList } from '../components/goals/TasksList';

const Goals = () => {
  // Zustand store
  const {
    goals,
    selectedGoal,
    selectedMilestone,
    loading,
    error,
    fetchGoals,
    fetchGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    selectGoal,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    selectMilestone,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    clearError,
  } = useGoalStore();

  // Fetch goals on mount
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // When selecting a goal, fetch its full details (with milestones and tasks)
  const handleSelectGoal = async (goal) => {
    if (goal.id === selectedGoal?.id) return;
    await fetchGoal(goal.id);
  };

  // When selecting a milestone, update selection
  const handleSelectMilestone = (milestone) => {
    selectMilestone(milestone);
  };

  // Toggle task status (cycle through PENDING -> IN_PROGRESS -> COMPLETED -> PENDING)
  const handleToggleTask = async (taskId) => {
    const milestone = selectedMilestone || selectedGoal?.milestones?.find(m => 
      m.tasks?.some(t => t.id === taskId)
    );
    const task = milestone?.tasks?.find(t => t.id === taskId);
    
    if (!task) return;

    // Cycle status
    const statusCycle = {
      'PENDING': 'IN_PROGRESS',
      'IN_PROGRESS': 'COMPLETED',
      'COMPLETED': 'PENDING'
    };
    const newStatus = statusCycle[task.status] || 'PENDING';
    
    await toggleTaskStatus(taskId, newStatus);
    
    // Refresh goal to get updated progress
    if (selectedGoal) {
      await fetchGoal(selectedGoal.id);
    }
  };

  // AI suggest milestones (placeholder - will integrate with streaming later)
  const handleSuggestMilestones = async (goalId) => {
    // TODO: Integrate with AI streaming endpoint
    console.log('AI suggest milestones for goal:', goalId);
    alert('AI milestone suggestions coming soon! Use the + button to add milestones manually for now.');
  };

  // AI suggest tasks (placeholder - will integrate with streaming later)
  const handleSuggestTasks = async (milestoneId) => {
    // TODO: Integrate with AI streaming endpoint
    console.log('AI suggest tasks for milestone:', milestoneId);
    alert('AI task suggestions coming soon! Use the + button to add tasks manually for now.');
  };

  // Get milestones for current goal
  const milestones = selectedGoal?.milestones || [];

  // Get tasks for current milestone
  const tasks = selectedMilestone?.tasks || [];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Goals</h1>
            <p className="text-sm text-gray-400">Manage your goals, milestones, and tasks</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Goals</p>
            <p className="text-2xl font-bold text-white">{goals.length}</p>
          </div>
          {selectedGoal && (
            <>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Milestones</p>
                <p className="text-2xl font-bold text-blue-400">{milestones.length}</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Progress</p>
                <p className="text-2xl font-bold text-purple-400">{selectedGoal.progress || 0}%</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400" />
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden p-6 gap-4">
        {/* Panel 1: Goals */}
        <div className="w-80 flex-shrink-0 bg-white/5 rounded-2xl border border-white/10 p-4 overflow-hidden">
          <GoalsList
            goals={goals}
            selectedGoal={selectedGoal}
            onSelect={handleSelectGoal}
            onCreate={createGoal}
            onDelete={deleteGoal}
            onUpdate={updateGoal}
            loading={loading && goals.length === 0}
          />
        </div>

        {/* Panel 2: Milestones */}
        <div className="w-80 flex-shrink-0 bg-white/5 rounded-2xl border border-white/10 p-4 overflow-hidden">
          <MilestonesList
            goal={selectedGoal}
            milestones={milestones}
            selectedMilestone={selectedMilestone}
            onSelect={handleSelectMilestone}
            onCreate={createMilestone}
            onDelete={deleteMilestone}
            onUpdate={updateMilestone}
            onSuggestMilestones={handleSuggestMilestones}
            loading={loading && selectedGoal && milestones.length === 0}
          />
        </div>

        {/* Panel 3: Tasks */}
        <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-4 overflow-hidden">
          <TasksList
            milestone={selectedMilestone}
            tasks={tasks}
            onCreate={createTask}
            onToggle={handleToggleTask}
            onDelete={deleteTask}
            onUpdate={updateTask}
            onSuggestTasks={handleSuggestTasks}
            loading={loading && selectedMilestone && tasks.length === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default Goals;
