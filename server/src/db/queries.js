import pool from './pool.js';

// ============================================================
// GOALS
// ============================================================

export async function getAllGoals() {
  const { rows } = await pool.query(`
    SELECT * FROM goals ORDER BY "createdAt" DESC
  `);
  return rows;
}

export async function getGoalById(id) {
  const { rows } = await pool.query(`
    SELECT * FROM goals WHERE id = $1
  `, [id]);
  return rows[0];
}

export async function getGoalWithMilestones(id) {
  const goal = await getGoalById(id);
  if (!goal) return null;
  
  const milestones = await getMilestonesByGoalId(id);
  for (const milestone of milestones) {
    milestone.tasks = await getTasksByMilestoneId(milestone.id);
  }
  
  return { ...goal, milestones };
}

export async function getAllGoalsWithMilestones() {
  const goals = await getAllGoals();
  for (const goal of goals) {
    goal.milestones = await getMilestonesByGoalId(goal.id);
    for (const milestone of goal.milestones) {
      milestone.tasks = await getTasksByMilestoneId(milestone.id);
    }
  }
  return goals;
}

export async function insertGoal({ title, description, targetDate }) {
  const { rows } = await pool.query(`
    INSERT INTO goals (id, title, description, "targetDate", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
    RETURNING *
  `, [title, description, targetDate]);
  return rows[0];
}

export async function updateGoal(id, { title, description, targetDate, status }) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(title);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (targetDate !== undefined) {
    fields.push(`"targetDate" = $${paramIndex++}`);
    values.push(targetDate);
  }
  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  fields.push(`"updatedAt" = $${paramIndex++}`);
  values.push(new Date());

  values.push(id);

  const { rows } = await pool.query(`
    UPDATE goals SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, values);
  return rows[0];
}

export async function deleteGoal(id) {
  await pool.query(`DELETE FROM goals WHERE id = $1`, [id]);
}

// ============================================================
// MILESTONES
// ============================================================

export async function getMilestonesByGoalId(goalId) {
  const { rows } = await pool.query(`
    SELECT * FROM milestones WHERE "goalId" = $1 ORDER BY "orderIndex" ASC
  `, [goalId]);
  return rows;
}

export async function getMilestoneById(id) {
  const { rows } = await pool.query(`
    SELECT * FROM milestones WHERE id = $1
  `, [id]);
  return rows[0];
}

export async function getMilestoneWithGoalAndTasks(id) {
  const milestone = await getMilestoneById(id);
  if (!milestone) return null;
  
  const goal = await getGoalById(milestone.goalId);
  const tasks = await getTasksByMilestoneId(id);
  
  return { ...milestone, goal, tasks };
}

export async function getLastMilestoneOrderIndex(goalId) {
  const { rows } = await pool.query(`
    SELECT "orderIndex" FROM milestones 
    WHERE "goalId" = $1 
    ORDER BY "orderIndex" DESC 
    LIMIT 1
  `, [goalId]);
  return rows[0]?.orderIndex ?? -1;
}

export async function insertMilestone({ goalId, title, description, targetDate, orderIndex }) {
  const { rows } = await pool.query(`
    INSERT INTO milestones (id, "goalId", title, description, "targetDate", "orderIndex", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
    RETURNING *
  `, [goalId, title, description, targetDate, orderIndex]);
  return rows[0];
}

export async function updateMilestone(id, { title, description, targetDate, status, orderIndex }) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(title);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (targetDate !== undefined) {
    fields.push(`"targetDate" = $${paramIndex++}`);
    values.push(targetDate);
  }
  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  if (orderIndex !== undefined) {
    fields.push(`"orderIndex" = $${paramIndex++}`);
    values.push(orderIndex);
  }
  fields.push(`"updatedAt" = $${paramIndex++}`);
  values.push(new Date());

  values.push(id);

  const { rows } = await pool.query(`
    UPDATE milestones SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, values);
  return rows[0];
}

export async function deleteMilestone(id) {
  await pool.query(`DELETE FROM milestones WHERE id = $1`, [id]);
}

export async function updateMilestoneOrder(id, orderIndex) {
  await pool.query(`
    UPDATE milestones SET "orderIndex" = $1, "updatedAt" = $2 WHERE id = $3
  `, [orderIndex, new Date(), id]);
}

// ============================================================
// TASKS
// ============================================================

export async function getTasksByMilestoneId(milestoneId) {
  const { rows } = await pool.query(`
    SELECT * FROM tasks WHERE "milestoneId" = $1 ORDER BY "orderIndex" ASC
  `, [milestoneId]);
  return rows;
}

export async function getTaskById(id) {
  const { rows } = await pool.query(`
    SELECT * FROM tasks WHERE id = $1
  `, [id]);
  return rows[0];
}

export async function getTaskWithMilestoneAndGoal(id) {
  const task = await getTaskById(id);
  if (!task) return null;
  
  const milestone = await getMilestoneById(task.milestoneId);
  const goal = milestone ? await getGoalById(milestone.goalId) : null;
  
  return { ...task, milestone: milestone ? { ...milestone, goal } : null };
}

export async function getLastTaskOrderIndex(milestoneId) {
  const { rows } = await pool.query(`
    SELECT "orderIndex" FROM tasks 
    WHERE "milestoneId" = $1 
    ORDER BY "orderIndex" DESC 
    LIMIT 1
  `, [milestoneId]);
  return rows[0]?.orderIndex ?? -1;
}

export async function insertTask({ milestoneId, title, description, estimatedMins, dueDate, priority, orderIndex }) {
  const { rows } = await pool.query(`
    INSERT INTO tasks (id, "milestoneId", title, description, "estimatedMins", "dueDate", priority, "orderIndex", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING *
  `, [milestoneId, title, description, estimatedMins, dueDate, priority || 'MEDIUM', orderIndex]);
  return rows[0];
}

export async function updateTask(id, { title, description, estimatedMins, dueDate, priority, status, orderIndex }) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(title);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (estimatedMins !== undefined) {
    fields.push(`"estimatedMins" = $${paramIndex++}`);
    values.push(estimatedMins);
  }
  if (dueDate !== undefined) {
    fields.push(`"dueDate" = $${paramIndex++}`);
    values.push(dueDate);
  }
  if (priority !== undefined) {
    fields.push(`priority = $${paramIndex++}`);
    values.push(priority);
  }
  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  if (orderIndex !== undefined) {
    fields.push(`"orderIndex" = $${paramIndex++}`);
    values.push(orderIndex);
  }
  fields.push(`"updatedAt" = $${paramIndex++}`);
  values.push(new Date());

  values.push(id);

  const { rows } = await pool.query(`
    UPDATE tasks SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, values);
  return rows[0];
}

export async function deleteTask(id) {
  await pool.query(`DELETE FROM tasks WHERE id = $1`, [id]);
}

export async function updateTaskOrder(id, orderIndex) {
  await pool.query(`
    UPDATE tasks SET "orderIndex" = $1, "updatedAt" = $2 WHERE id = $3
  `, [orderIndex, new Date(), id]);
}

export async function getAllPendingTasks() {
  const { rows } = await pool.query(`
    SELECT t.*, m.title as milestone_title, m."goalId", g.title as goal_title
    FROM tasks t
    JOIN milestones m ON t."milestoneId" = m.id
    JOIN goals g ON m."goalId" = g.id
    WHERE t.status IN ('PENDING', 'IN_PROGRESS')
    ORDER BY 
      CASE t.priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 END,
      t."dueDate" ASC NULLS LAST,
      t."createdAt" ASC
  `);
  
  // Transform to match the expected structure
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    estimatedMins: row.estimatedMins,
    dueDate: row.dueDate,
    priority: row.priority,
    status: row.status,
    orderIndex: row.orderIndex,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    milestoneId: row.milestoneId,
    milestone: {
      id: row.milestoneId,
      title: row.milestone_title,
      goalId: row.goalId,
      goal: {
        id: row.goalId,
        title: row.goal_title
      }
    }
  }));
}
