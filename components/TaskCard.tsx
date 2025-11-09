import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, Subtask, priorityStyles, Attachment } from '../types';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { PlayIcon, CalendarIcon, PaperclipIcon, DotsVerticalIcon, InformationCircleIcon, TagIcon, ChevronLeftIcon, ChevronRightIcon, LinkIcon, PhotoIcon, DocumentTextIcon, ChevronDownIcon, MicrophoneIcon, CheckIcon } from './Icons';

interface TaskCardProps {
  task: Task;
  boardColumns: string[];
  onDragStart: (taskId: string) => void;
  isDragging: boolean;
  onStartPomodoro: () => void;
  onDeleteRequest: (task: Task) => void;
  onEditRequest: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDuplicateTask: () => void;
  projectColor?: string;
  projectEmoji?: string;
  isMobile?: boolean;
  allAttachments: Attachment[];
  onOpenAiWithContext: (context: any) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, boardColumns, onDragStart, isDragging, onStartPomodoro, onDeleteRequest, onEditRequest, onUpdateTask, onDuplicateTask, projectColor, projectEmoji, isMobile = false, allAttachments, onOpenAiWithContext }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setIsMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, []);

  const taskAttachments = useMemo(() => {
    return (task.attachmentIds || [])
      .map(id => allAttachments.find(att => att.id === id))
      .filter((att): att is Attachment => Boolean(att));
  }, [task.attachmentIds, allAttachments]);
  
  const coverImage = useMemo(() => {
    return taskAttachments.find(att => att.type === 'image');
  }, [taskAttachments]);

  const getDueDateInfo = () => {
    if (!task.dueDate || task.status === 'Готово' || boardColumns.indexOf(task.status) === boardColumns.length -1) { // Also check if it's in the last column
      return null;
    }

    const [year, month, day] = task.dueDate.split('-').map(Number);
    const taskDueDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = taskDueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = taskDueDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    if (diffDays < 0) {
      return { text: `Просрочено (${formattedDate})`, color: 'text-brand-red font-semibold' };
    }
    if (diffDays === 0) {
      return { text: 'Срок сегодня', color: 'text-orange-400 font-semibold' };
    }
    if (diffDays === 1) {
      return { text: 'Срок завтра', color: 'text-brand-yellow font-semibold' };
    }
    
    return { text: `${formattedDate}`, color: 'text-brand-yellow' };
  };

  const dueDateInfo = getDueDateInfo();
  const priorityStyle = task.priority ? priorityStyles[task.priority] : null;

  const completedSubtasks = (task.subtasks || []).filter(st => st.completed).length;
  const totalSubtasks = task.subtasks?.length || 0;
  
  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks?.map(sub => 
        sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
    ) || [];

    const allSubtasksCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
    
    const updatedTask = { ...task, subtasks: updatedSubtasks };
    
    const doneStatus = boardColumns[boardColumns.length - 1] ?? 'Готово';

    if (allSubtasksCompleted && task.status !== doneStatus) {
      updatedTask.status = doneStatus;
    }
    
    onUpdateTask(updatedTask);
  };
  
    const handleMoveTask = (newStatus: string) => {
        onUpdateTask({ ...task, status: newStatus });
        setIsMenuOpen(false);
    };
    
    const availableStatuses = boardColumns.filter(s => s !== task.status);

    const currentColumnIndex = boardColumns.indexOf(task.status);
    const canMoveLeft = currentColumnIndex > 0;
    const canMoveRight = currentColumnIndex < boardColumns.length - 1;

    const handleMove = (direction: 'left' | 'right') => {
        const newIndex = direction === 'left' ? currentColumnIndex - 1 : currentColumnIndex + 1;
        if (newIndex >= 0 && newIndex < boardColumns.length) {
            onUpdateTask({ ...task, status: boardColumns[newIndex] });
        }
    };


    // Mobile swipe logic
    const x = useMotionValue(0);
    const SWIPE_THRESHOLD = 80;

    const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number, y: number } }) => {
        if (info.offset.x > SWIPE_THRESHOLD) { // Swiped right
            const doneStatus = boardColumns[boardColumns.length - 1];
            if (doneStatus && task.status !== doneStatus) {
                onUpdateTask({ ...task, status: doneStatus });
            }
        } else if (info.offset.x < -SWIPE_THRESHOLD) { // Swiped left
            onStartPomodoro();
        }
    };

    const rightSwipeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
    const leftSwipeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
    const rightSwipeScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1.2]);
    const leftSwipeScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1.2, 0.5]);
    
    const getAttachmentIcon = (att: Attachment) => {
        switch (att.type) {
            case 'link': return <LinkIcon className="w-4 h-4 text-highlight" />;
            case 'image': return <PhotoIcon className="w-4 h-4 text-brand-green" />;
            case 'file': return <DocumentTextIcon className="w-4 h-4 text-text-secondary" />;
        }
    };


    const cardContent = (
      <>
          {coverImage && (
              <div className="relative z-10 -m-3 md:-m-4 mb-3 md:mb-4">
                  <img src={coverImage.url} alt={coverImage.name} className="w-full h-24 md:h-32 object-cover rounded-t-xl md:rounded-t-2xl" />
              </div>
          )}
          <div className="relative z-10 flex flex-col gap-1.5 md:gap-3">
              <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-text-primary text-sm md:text-base leading-tight">
                      <span className="opacity-70 mr-1.5">{task.emoji || '💡'}</span>
                      {task.title}
                  </h4>
                  {task.priority && (
                    <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full flex-shrink-0 ${priorityStyle?.bg.replace('/10', '/20')} ${priorityStyle?.text}`}>
                      {task.priority}
                    </span>
                  )}
              </div>

              {totalSubtasks > 0 && (
                <div className="hidden md:block space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-text-secondary">
                        <span className="font-semibold">Подзадачи</span>
                        <span className="font-mono">{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                    {taskAttachments.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            {taskAttachments.slice(0, 3).map(att => (
                                <div key={att.id} title={att.name}>
                                    {getAttachmentIcon(att)}
                                </div>
                            ))}
                            {taskAttachments.length > 3 && (
                                <span className="text-xs font-mono">+ {taskAttachments.length - 3}</span>
                            )}
                        </div>
                    )}
                    {dueDateInfo && (
                      <div className={`flex items-center gap-1 font-semibold ${dueDateInfo.color}`}>
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{dueDateInfo.text}</span>
                      </div>
                    )}
                    <div className="font-semibold flex items-center gap-1">
                      <span>🍓</span>
                      {task.pomodorosCompleted}/{task.pomodorosEstimated}
                    </div>
                </div>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => handleMove('left')} disabled={!canMoveLeft} className="w-6 h-6 flex items-center justify-center bg-accent text-text-secondary rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label={`Переместить задачу влево`}>
                        <ChevronLeftIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleMove('right')} disabled={!canMoveRight} className="w-6 h-6 flex items-center justify-center bg-accent text-text-secondary rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label={`Переместить задачу вправо`}>
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onOpenAiWithContext(task)} className="w-6 h-6 flex items-center justify-center text-text-secondary rounded-md hover:bg-white/10 hover:text-white transition-colors" aria-label={`AI-помощник для ${task.title}`}>
                        <MicrophoneIcon className="w-3.5 h-3.5" />
                    </button>
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(prev => !prev)} className="w-6 h-6 flex items-center justify-center text-text-secondary rounded-md hover:bg-white/10 hover:text-white transition-colors" aria-label={`Действия с задачей ${task.title}`}>
                            <DotsVerticalIcon className="w-3.5 h-3.5" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 bottom-full mb-2 w-48 bg-secondary border border-border-color rounded-xl shadow-lg z-20 p-2">
                                <ul className="text-sm text-text-primary">
                                    <li><button onClick={() => { onEditRequest(task); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-accent rounded-md">Редактировать</button></li>
                                    <li><button onClick={() => { onDuplicateTask(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-accent rounded-md">Дублировать</button></li>
                                    <div className="h-px bg-border-color my-1"></div>
                                    <li><button onClick={() => { onDeleteRequest(task); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-brand-red/20 text-brand-red rounded-md">Удалить</button></li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
              </div>
          </div>
        </>
    );

    if (isMobile) {
        return (
            <div className="relative">
                <motion.div style={{ opacity: rightSwipeOpacity }} className="absolute inset-0 bg-brand-green rounded-xl flex items-center justify-start pl-6">
                    <motion.div style={{ scale: rightSwipeScale }}>
                        <CheckIcon className="w-6 h-6 text-white" />
                    </motion.div>
                </motion.div>
                <motion.div style={{ opacity: leftSwipeOpacity }} className="absolute inset-0 bg-highlight rounded-xl flex items-center justify-end pr-6">
                    <motion.div style={{ scale: leftSwipeScale }}>
                        <PlayIcon className="w-6 h-6 text-white" />
                    </motion.div>
                </motion.div>
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    style={{ x }}
                    onDragEnd={onDragEnd}
                    className="relative p-2.5 bg-accent backdrop-blur-xl rounded-xl shadow-soft-glow"
                >
                    {cardContent}
                </motion.div>
            </div>
        );
    }


  return (
    <div
      draggable={!isMobile}
      onDragStart={() => !isMobile && onDragStart(task.id)}
      className={`relative p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-300 shadow-soft-glow group ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}`}
    >
        {/* Background and Border */}
        <div 
            className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl"
            style={{ backgroundColor: projectColor || '#6B7280' }}
        ></div>
        <div 
            className="absolute inset-0 bg-accent backdrop-blur-xl"
        ></div>
        <div 
            className="absolute inset-0 rounded-2xl border border-white/10"
        ></div>
        <div 
            className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent"
        ></div>
        <div 
            className="absolute -top-1/2 left-0 w-full h-full bg-radial-gradient(circle_at_100%_0%,rgba(51,197,177,0.3)_0%,rgba(51,197,177,0)_30%) opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        ></div>
      
      {coverImage && (
          <div className="relative z-10 -m-4 mb-4">
              <img src={coverImage.url} alt={coverImage.name} className="w-full h-32 object-cover rounded-t-2xl" />
          </div>
      )}

      <div className="relative z-10 flex flex-col gap-3">
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5 flex-shrink-0">{task.emoji || '💡'}</span>
                <h4 className="font-bold text-text-primary text-base leading-tight">
                    <span className="opacity-70 mr-1.5">{projectEmoji}</span>
                    {task.title}
                </h4>
              </div>
              {task.priority && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${priorityStyle?.bg.replace('/10', '/20')} ${priorityStyle?.text}`}>
                  {task.priority}
                </span>
              )}
          </div>

          {/* Subtasks Checklist */}
          {totalSubtasks > 0 && (
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-text-secondary">
                    <span className="font-semibold">Подзадачи</span>
                    <span className="font-mono">{completedSubtasks}/{totalSubtasks}</span>
                </div>
                <ul className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {task.subtasks?.map(sub => (
                        <li key={sub.id} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                            <input
                                type="checkbox"
                                id={`subtask-${sub.id}`}
                                checked={sub.completed}
                                onChange={() => handleToggleSubtask(sub.id)}
                                className="w-4 h-4 rounded bg-primary border-border-color text-highlight focus:ring-highlight focus:ring-offset-secondary"
                            />
                            <label htmlFor={`subtask-${sub.id}`} className={`cursor-pointer ${sub.completed ? 'line-through opacity-70' : ''}`}>{sub.title}</label>
                        </li>
                    ))}
                </ul>
            </div>
          )}

          {/* Description Accordion */}
           {task.description && (
            <div>
                <button onClick={() => setIsDescriptionOpen(p => !p)} className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-semibold w-full text-left py-1">
                    <InformationCircleIcon className="w-4 h-4" />
                    <span>Описание</span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDescriptionOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isDescriptionOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <p className="pt-2 text-sm text-text-secondary whitespace-pre-wrap border-t border-border-color mt-1">{task.description}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          )}
          
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                  <TagIcon className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  {task.tags.map(tag => (
                      <span key={tag} className="text-xs text-text-secondary bg-black/20 px-2 py-0.5 rounded">
                          #{tag}
                      </span>
                  ))}
              </div>
          )}
    
          {(totalSubtasks > 0 || (task.tags && task.tags.length > 0) || task.description) && <div className="w-full h-px bg-white/10"></div>}

          {/* Footer */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-4 text-text-secondary">
                {taskAttachments.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        {taskAttachments.slice(0, 3).map(att => (
                            <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" title={att.name} className="block p-1 bg-primary/50 rounded-md hover:bg-accent">
                                {getAttachmentIcon(att)}
                            </a>
                        ))}
                        {taskAttachments.length > 3 && (
                            <span className="text-xs text-text-secondary">+ {taskAttachments.length - 3}</span>
                        )}
                    </div>
                )}
                {dueDateInfo && (
                  <div className={`flex items-center gap-1.5 font-semibold ${dueDateInfo.color}`}>
                    <CalendarIcon className="w-4 h-4" />
                    <span>{dueDateInfo.text}</span>
                  </div>
                )}
                <div className="font-semibold">
                  {task.pomodorosCompleted}/{task.pomodorosEstimated} 🍓
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button onClick={onStartPomodoro} className="w-8 h-8 flex items-center justify-center bg-highlight/20 text-highlight rounded-lg hover:bg-highlight/30 transition-colors" aria-label={`Начать Помодоро для ${task.title}`}><PlayIcon className="w-5 h-5" /></button>
                
                <button 
                    onClick={() => onOpenAiWithContext(task)} 
                    className="w-8 h-8 flex items-center justify-center text-text-secondary rounded-lg hover:bg-white/10 hover:text-white transition-colors" 
                    aria-label={`AI-помощник для ${task.title}`}
                >
                    <MicrophoneIcon className="w-5 h-5" />
                </button>

                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(prev => !prev)} className="w-8 h-8 flex items-center justify-center text-text-secondary rounded-lg hover:bg-white/10 hover:text-white transition-colors" aria-label={`Действия с задачей ${task.title}`}>
                        <DotsVerticalIcon className="w-5 h-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-secondary border border-border-color rounded-xl shadow-lg z-20 p-2">
                            <ul className="text-sm text-text-primary">
                                <li><button onClick={() => { onEditRequest(task); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-accent rounded-md">Редактировать</button></li>
                                <li><button onClick={() => { onDuplicateTask(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-accent rounded-md">Дублировать</button></li>
                                {!isMobile && <><div className="h-px bg-border-color my-1"></div>
                                <li className="px-3 py-1.5 text-text-secondary text-xs">Переместить в:</li>
                                {availableStatuses.map(status => (
                                    <li key={status}><button onClick={() => handleMoveTask(status)} className="w-full text-left px-3 py-1.5 hover:bg-accent rounded-md">{status}</button></li>
                                ))}</>}
                                <div className="h-px bg-border-color my-1"></div>
                                <li><button onClick={() => { onDeleteRequest(task); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-brand-red/20 text-brand-red rounded-md">Удалить</button></li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default TaskCard;