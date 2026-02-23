import prisma from '../lib/prisma.js';

export async function getDailyPlan(req, res) {
  try {
    const { date } = req.params;
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const dailyPlan = await prisma.dailyPlan.findUnique({
      where: { date: targetDate },
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!dailyPlan) {
      return res.json({ date: targetDate, tasks: [] });
    }

    res.json(dailyPlan);
  } catch (error) {
    console.error('Error fetching daily plan:', error);
    res.status(500).json({ error: 'Failed to fetch daily plan', details: error.message });
  }
}

export async function createOrUpdateDailyPlan(req, res) {
  try {
    const { date, tasks } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const existingPlan = await prisma.dailyPlan.findUnique({
      where: { date: targetDate },
      include: { tasks: true }
    });

    let dailyPlan;
    
    if (existingPlan) {
      await prisma.plannedTask.deleteMany({
        where: { dailyPlanId: existingPlan.id }
      });

      if (tasks && tasks.length > 0) {
        dailyPlan = await prisma.dailyPlan.update({
          where: { id: existingPlan.id },
          data: {
            tasks: {
              create: tasks.map((task, index) => ({
                title: task.title,
                description: task.description || null,
                estimatedMins: task.estimatedMins || null,
                startTime: task.startTime || null,
                endTime: task.endTime || null,
                status: task.status || 'PENDING',
                orderIndex: index
              }))
            }
          },
          include: {
            tasks: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        });
      } else {
        dailyPlan = await prisma.dailyPlan.update({
          where: { id: existingPlan.id },
          data: { tasks: { deleteMany: {} } },
          include: { tasks: { orderBy: { orderIndex: 'asc' } } }
        });
      }
    } else {
      dailyPlan = await prisma.dailyPlan.create({
        data: {
          date: targetDate,
          tasks: tasks && tasks.length > 0 ? {
            create: tasks.map((task, index) => ({
              title: task.title,
              description: task.description || null,
              estimatedMins: task.estimatedMins || null,
              startTime: task.startTime || null,
              endTime: task.endTime || null,
              status: task.status || 'PENDING',
              orderIndex: index
            }))
          } : undefined
        },
        include: {
          tasks: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      });
    }

    res.json(dailyPlan);
  } catch (error) {
    console.error('Error saving daily plan:', error);
    res.status(500).json({ error: 'Failed to save daily plan', details: error.message });
  }
}

export async function getUpcomingPlans(req, res) {
  try {
    const { days = 7 } = req.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + parseInt(days));

    const plans = await prisma.dailyPlan.findMany({
      where: {
        date: {
          gte: today,
          lt: endDate
        }
      },
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { date: 'asc' }
    });

    res.json(plans);
  } catch (error) {
    console.error('Error fetching upcoming plans:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming plans', details: error.message });
  }
}
