import { Quest } from './types';

export const QUEST_POOL: Omit<Quest, 'progress' | 'completed'>[] = [
  { id: 'completeTasks', description: 'Выполните 3 задачи', target: 3, xp: 50 },
  { id: 'runPomodoros', description: 'Завершите 2 сеанса Помодоро', target: 2, xp: 40 },
  { id: 'createTasks', description: 'Создайте 2 новые задачи', target: 2, xp: 20 },
  { id: 'highPriority', description: 'Выполните задачу с высоким приоритетом', target: 1, xp: 30 }
];

export const generateDailyQuests = (): Quest[] => {
  const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
  const selectedQuests = shuffled.slice(0, 2); // Выбираем 2 случайных квеста

  return selectedQuests.map(q => ({
    ...q,
    progress: 0,
    completed: false,
  }));
};
