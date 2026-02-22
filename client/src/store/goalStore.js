import { create } from 'zustand';
import { goalApi } from '../services/api';

/**
 * Zustand store for managing goals, milestones, and tasks
 */
export const useGoalStore = create((set, get) => ({
  // State
  goals: [],
  selectedGoal: null,
  selectedMilestone: null,
  loading: false,
  error: null,

  // ============================================================
  // GOAL ACTIONS
  // ============================================================

  /**
   * Fetch all goals from the server
   */
  fetchGoals: async () => {
    set({ loading: true, error: null });
    try {
      const goals = await goalApi.getAllGoals();
      set({ goals, loading: false });
      return goals;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Create a new goal
   */
  createGoal: async (data) => {
    set({ loading: true, error: null });
    try {
      const goal = await goalApi.createGoal(data);
      set((state) => ({
        goals: [goal, ...state.goals],
        loading: false
      }));
      return goal;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Fetch a single goal with milestones and tasks
   */
  fetchGoal: async (id) => {
    set({ loading: true, error: null });
    try {
      const goal = await goalApi.getGoal(id);
      set({ selectedGoal: goal, loading: false });
      return goal;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update a goal
   */
  updateGoal: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updatedGoal = await goalApi.updateGoal(id, data);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, ...updatedGoal } : g)),
        selectedGoal: state.selectedGoal?.id === id 
          ? { ...state.selectedGoal, ...updatedGoal } 
          : state.selectedGoal,
        loading: false
      }));
      return updatedGoal;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Delete a goal
   */
  deleteGoal: async (id) => {
    set({ loading: true, error: null });
    try {
      await goalApi.deleteGoal(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        selectedGoal: state.selectedGoal?.id === id ? null : state.selectedGoal,
        selectedMilestone: null,
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Select a goal (for UI navigation)
   */
  selectGoal: (goal) => {
    set({ selectedGoal: goal, selectedMilestone: null });
  },

  // ============================================================
  // MILESTONE ACTIONS
  // ============================================================

  /**
   * Create a milestone under a goal
   */
  createMilestone: async (goalId, data) => {
    set({ loading: true, error: null });
    try {
      const milestone = await goalApi.createMilestone(goalId, data);
      set((state) => {
        // Update selectedGoal milestones if viewing this goal
        if (state.selectedGoal?.id === goalId) {
          return {
            selectedGoal: {
              ...state.selectedGoal,
              milestones: [...(state.selectedGoal.milestones || []), milestone]
            },
            loading: false
          };
        }
        return { loading: false };
      });
      return milestone;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update a milestone
   */
  updateMilestone: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updatedMilestone = await goalApi.updateMilestone(id, data);
      set((state) => {
        if (state.selectedGoal) {
          return {
            selectedGoal: {
              ...state.selectedGoal,
              milestones: state.selectedGoal.milestones.map((m) =>
                m.id === id ? { ...m, ...updatedMilestone } : m
              )
            },
            selectedMilestone: state.selectedMilestone?.id === id
              ? { ...state.selectedMilestone, ...updatedMilestone }
              : state.selectedMilestone,
            loading: false
          };
        }
        return { loading: false };
      });
      return updatedMilestone;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Delete a milestone
   */
  deleteMilestone: async (id) => {
    set({ loading: true, error: null });
    try {
      await goalApi.deleteMilestone(id);
      set((state) => {
        if (state.selectedGoal) {
          return {
            selectedGoal: {
              ...state.selectedGoal,
              milestones: state.selectedGoal.milestones.filter((m) => m.id !== id)
            },
            selectedMilestone: state.selectedMilestone?.id === id ? null : state.selectedMilestone,
            loading: false
          };
        }
        return { loading: false };
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Select a milestone (for UI navigation)
   */
  selectMilestone: (milestone) => {
    set({ selectedMilestone: milestone });
  },

  // ============================================================
  // TASK ACTIONS
  // ============================================================

  /**
   * Create a task under a milestone
   */
  createTask: async (milestoneId, data) => {
    set({ loading: true, error: null });
    try {
      const task = await goalApi.createTask(milestoneId, data);
      set((state) => {
        if (state.selectedGoal) {
          return {
            selectedGoal: {
              ...state.selectedGoal,
              milestones: state.selectedGoal.milestones.map((m) =>
                m.id === milestoneId
                  ? { ...m, tasks: [...(m.tasks || []), task] }
                  : m
              )
            },
            selectedMilestone: state.selectedMilestone?.id === milestoneId
              ? { ...state.selectedMilestone, tasks: [...(state.selectedMilestone.tasks || []), task] }
              : state.selectedMilestone,
            loading: false
          };
        }
        return { loading: false };
      });
      return task;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update a task
   */
  updateTask: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updatedTask = await goalApi.updateTask(id, data);
      set((state) => {
        if (state.selectedGoal) {
          return {
            selectedGoal: {
              ...state.selectedGoal,
              milestones: state.selectedGoal.milestones.map((m) => ({
                ...m,
                tasks: m.tasks?.map((t) => (t.id === id ? { ...t, ...updatedTask } : t))
              }))
            },
            selectedMilestone: state.selectedMilestone
              ? {
                  ...state.selectedMilestone,
                  tasks: state.selectedMilestone.tasks?.map((t) =>
                    t.id === id ? { ...t, ...updatedTask } : t
                  )
                }
              : null,
            loading: false
          };
        }
        return { loading: false };
      });
      return updatedTask;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Toggle task status
   */
  toggleTaskStatus: async (id, newStatus) => {
    set({ loading: true, error: null });
    try {
      const updatedTask = await goalApi.toggleTaskStatus(id, newStatus);
      set((state) => {
        if (state.selectedGoal) {
          return {
            selectedGoal: {
              ...state.selectedGoal,
              milestones: state.selectedGoal.milestones.map((m) => ({
                ...m,
                tasks: m.tasks?.map((t) => (t.id === id ? { ...t, ...updatedTask } : t))
              }))
            },
            selectedMilestone: state.selectedMilestone
              ? {
                  ...state.selectedMilestone,
                  tasks: state.selectedMilestone.tasks?.map((t) =>
                    t.id === id ? { ...t, ...updatedTask } : t
                  )
                }
              : null,
            loading: false
          };
        }
        return { loading: false };
      });
      return updatedTask;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Delete a task
   */
  deleteTask: async (id, milestoneId) => {
    set({ loading: true, error: null });
    try {
      await goalApi.deleteTask(id);
      set((state) => {
        if (state.selectedGoal) {
          return {
            selectedGoal: {
              ...state.selectedGoal,
              milestones: state.selectedGoal.milestones.map((m) => ({
                ...m,
                tasks: m.tasks?.filter((t) => t.id !== id)
              }))
            },
            selectedMilestone: state.selectedMilestone
              ? {
                  ...state.selectedMilestone,
                  tasks: state.selectedMilestone.tasks?.filter((t) => t.id !== id)
                }
              : null,
            loading: false
          };
        }
        return { loading: false };
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================================
  // UTILITY ACTIONS
  // ============================================================

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store to initial state
   */
  reset: () => set({
    goals: [],
    selectedGoal: null,
    selectedMilestone: null,
    loading: false,
    error: null
  })
}));
