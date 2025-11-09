import React, { useState, useEffect } from 'react';
import { Task, SortOption, TaskPriority, Project, Board, Attachment } from '../types';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { KanbanIcon } from './Icons';

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  board: Board | null;
  onUpdateTaskStatus: (taskId: string, newStatus: string) => void;
  onStartPomodoro: (task: Task) => void;
  onDeleteRequest: (task: Task) => void;
  onEditRequest: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDuplicateTask: (taskId: string) => void;
  isMobile: boolean;
  allAttachments: Attachment[];
  onOpenAiWithContext: (context: any) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, projects, board, onUpdateTaskStatus, onStartPomodoro, onDeleteRequest, onEditRequest, onUpdateTask, onDuplicateTask, isMobile, allAttachments, onOpenAiWithContext }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<Record<string, SortOption>>({});
  const [activeColumn, setActiveColumn] = useState<string | null>(board?.columns[0] || null);

  useEffect(() => {
    if (board && !activeColumn) {
        setActiveColumn(board.columns[0]);
    }
  }, [board, activeColumn]);

  useEffect(() => {
    if (board && board.columns.length > 0 && !board.columns.includes(activeColumn || '')) {
      setActiveColumn(board.columns[0]);
    }
  }, [board, activeColumn]);

  if (!board) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[24rem] bg-accent rounded-3xl border-2 border-dashed border-border-color p-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring' }}
            >
              <KanbanIcon className="w-16 h-16 text-text-secondary/50 mb-4" />
            </motion.div>
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold text-text-primary">Начните работу с доской</motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-text-secondary max-w-sm mt-2">Выберите существующую доску из списка проектов или создайте новую, чтобы добавить свои задачи.</motion.p>
        </div>
    );
  }

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDrop = (newStatus: string) => {
    if (draggedTaskId) {
      onUpdateTaskStatus(draggedTaskId, newStatus);
      setDraggedTaskId(null);
    }
  };

  const handleSortChange = (status: string, option: SortOption) => {
    setSortConfig(prev => ({ ...prev, [status]: option }));
  };

  const sortTasks = (tasksToSort: Task[], option: SortOption): Task[] => {
    const sorted = [...tasksToSort];
    switch (option) {
      case 'priority':
        const priorityOrder: Record<TaskPriority, number> = {
          [TaskPriority.High]: 3,
          [TaskPriority.Medium]: 2,
          [TaskPriority.Low]: 1,
        };
        sorted.sort((a, b) => {
          const priorityA = a.priority ? priorityOrder[a.priority] : 0;
          const priorityB = b.priority ? priorityOrder[b.priority] : 0;
          return priorityB - priorityA;
        });
        break;
      case 'dueDate':
        sorted.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        break;
      case 'default':
      default:
        break;
    }
    return sorted;
  };
  
  const columns = board.columns.map(colName => ({ status: colName, title: colName }));

  if (isMobile) {
    return (
        <div>
            <div className="relative mb-4">
              <LayoutGroup>
                <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2">
                    {columns.map(({ status, title }) => (
                        <button
                            key={status}
                            onClick={() => setActiveColumn(status)}
                            className={`relative px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors z-10 ${activeColumn === status ? 'text-primary' : 'text-text-secondary hover:bg-accent'}`}
                        >
                            {title} ({tasks.filter(t => t.status === status).length})
                            {activeColumn === status && (
                                <motion.div
                                    className="absolute inset-0 bg-highlight rounded-full"
                                    layoutId="active-kanban-tab"
                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                    style={{ zIndex: -1 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
              </LayoutGroup>
                <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-base-bg pointer-events-none"></div>
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeColumn}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeColumn && (
                        <div className="space-y-3">
                            {sortTasks(tasks.filter(task => task.status === activeColumn), sortConfig[activeColumn] || 'default').map(task => {
                                const taskProject = projects.find(p => p.id === task.projectId);
                                return <TaskCard key={task.id} task={task} boardColumns={board.columns} onDragStart={() => {}} isDragging={false} onStartPomodoro={() => onStartPomodoro(task)} onDeleteRequest={() => onDeleteRequest(task)} onEditRequest={() => onEditRequest(task)} onUpdateTask={onUpdateTask} onDuplicateTask={() => onDuplicateTask(task.id)} projectColor={taskProject?.color} projectEmoji={taskProject?.emoji} isMobile={isMobile} allAttachments={allAttachments} onOpenAiWithContext={onOpenAiWithContext} />;
                            })}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {columns.map(({ status, title }) => {
        const columnTasks = tasks.filter(task => task.status === status);
        const sortedTasks = sortTasks(columnTasks, sortConfig[status] || 'default');

        return (
          <KanbanColumn
            key={status}
            title={title}
            status={status}
            sortOption={sortConfig[status] || 'default'}
            onSortChange={handleSortChange}
            onDrop={handleDrop}
          >
            {sortedTasks.map(task => {
                const taskProject = projects.find(p => p.id === task.projectId);
                return (
                  <TaskCard 
                    key={task.id} 
                    task={task}
                    boardColumns={board.columns}
                    onDragStart={handleDragStart}
                    isDragging={draggedTaskId === task.id}
                    onStartPomodoro={() => onStartPomodoro(task)}
                    onDeleteRequest={() => onDeleteRequest(task)}
                    onEditRequest={() => onEditRequest(task)}
                    onUpdateTask={onUpdateTask}
                    onDuplicateTask={() => onDuplicateTask(task.id)}
                    projectColor={taskProject?.color}
                    projectEmoji={taskProject?.emoji}
                    isMobile={isMobile}
                    allAttachments={allAttachments}
                    onOpenAiWithContext={onOpenAiWithContext}
                  />
                )
            })}
          </KanbanColumn>
        );
      })}
    </div>
  );
};

export default KanbanBoard;