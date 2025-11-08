import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, Subtask, Project } from '../types';
import { PlusIcon, TrashIcon, EmojiHappyIcon, TagIcon } from './Icons';
import EmojiPickerModal from './EmojiPickerModal';

interface TaskFormProps {
    onAddTask: (taskData: Omit<Task, 'id' | 'status' | 'pomodorosCompleted' | 'boardId'>) => void;
    projects: Project[];
    activeProjectId: string | null;
    onTaskAdded?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onAddTask, projects, activeProjectId, onTaskAdded }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [pomodoros, setPomodoros] = useState(1);
    const [emoji, setEmoji] = useState('💪');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
    const [tags, setTags] = useState('');
    const [subtasks, setSubtasks] = useState<{title: string}[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | 'null'>(activeProjectId || 'null');

    useEffect(() => {
        setSelectedProjectId(activeProjectId || 'null');
    }, [activeProjectId]);

    const handleAddSubtask = () => {
        if (newSubtaskTitle.trim()) {
            setSubtasks([...subtasks, { title: newSubtaskTitle.trim() }]);
            setNewSubtaskTitle('');
        }
    };
    
    const handleRemoveSubtask = (index: number) => {
        setSubtasks(subtasks.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            const finalSubtasks: Subtask[] = subtasks.map(sub => ({
                id: crypto.randomUUID(),
                title: sub.title,
                completed: false,
            }));
            const finalTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);

            onAddTask({ 
                title: title.trim(), 
                description: description.trim(), 
                pomodorosEstimated: pomodoros, 
                emoji, 
                dueDate, 
                priority, 
                tags: finalTags,
                subtasks: finalSubtasks,
                projectId: selectedProjectId === 'null' ? null : selectedProjectId,
            });
            
            // Reset form
            setTitle('');
            setDescription('');
            setPomodoros(1);
            setEmoji('💪');
            setDueDate('');
            setPriority(TaskPriority.Medium);
            setTags('');
            setSubtasks([]);
            setNewSubtaskTitle('');

            if (onTaskAdded) {
                onTaskAdded();
            }
        }
    };
    
    const inputClasses = "w-full bg-accent backdrop-blur-xl border border-border-color shadow-inner-soft rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-highlight disabled:opacity-50 transition-colors focus:border-highlight";

    return (
        <>
            <form onSubmit={handleSubmit}>
                <fieldset className="space-y-4">
                    <select 
                        value={selectedProjectId} 
                        onChange={e => setSelectedProjectId(e.target.value)} 
                        className={`${inputClasses} appearance-none`}
                    >
                        <option value="null">Без проекта</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                        ))}
                    </select>
                    <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название задачи" required className={inputClasses} />
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Краткое описание" rows={2} className={inputClasses} />
                    <div className="relative">
                        <TagIcon className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none text-text-secondary" />
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Теги, через запятую"
                            className={`${inputClasses} pl-10`}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label htmlFor="pomodoros" className="block text-xs font-medium text-text-secondary mb-1.5 pl-1">Помодоро</label>
                            <input id="pomodoros" type="number" min="1" value={pomodoros} onChange={(e) => setPomodoros(parseInt(e.target.value, 10))} className={inputClasses} />
                        </div>
                        <div className="relative">
                            <label htmlFor="emoji" className="block text-xs font-medium text-text-secondary mb-1.5 pl-1">Смайлик</label>
                            <input id="emoji" type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="💪" maxLength={2} className={`${inputClasses} text-center text-xl`} />
                             <button type="button" onClick={() => setIsEmojiPickerOpen(true)} className="absolute right-1 bottom-1 p-1 rounded-full bg-secondary/50 hover:bg-accent disabled:opacity-50">
                                <EmojiHappyIcon className="w-5 h-5 text-text-secondary"/>
                            </button>
                        </div>
                        <div>
                            <label htmlFor="dueDate" className="block text-xs font-medium text-text-secondary mb-1.5 pl-1">Срок</label>
                            <input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClasses} />
                        </div>
                    </div>
                     <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={`${inputClasses} appearance-none`}>
                        <option value={TaskPriority.Low}>Низкий приоритет</option>
                        <option value={TaskPriority.Medium}>Средний приоритет</option>
                        <option value={TaskPriority.High}>Высокий приоритет</option>
                    </select>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Подзадачи</label>
                        <div className="space-y-2">
                            {subtasks.map((sub, index) => (
                                <div key={index} className="flex items-center gap-2 bg-accent/50 p-1.5 rounded-lg">
                                    <span className="flex-grow text-sm pl-2">{sub.title}</span>
                                    <button type="button" onClick={() => handleRemoveSubtask(index)} className="text-text-secondary hover:text-brand-red p-1 rounded-full hover:bg-brand-red/10"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <input type="text" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} placeholder="Добавить подзадачу..." className="flex-grow bg-primary border border-border-color shadow-inner-soft rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-highlight disabled:opacity-50"/>
                            <button type="button" onClick={handleAddSubtask} className="bg-highlight/80 text-primary p-2.5 rounded-xl hover:bg-highlight transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"><PlusIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                </fieldset>
                <button type="submit" className="w-full mt-5 bg-highlight text-primary font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:bg-gray-500 disabled:cursor-not-allowed text-base active:scale-95">
                    Добавить задачу
                </button>
            </form>
            <EmojiPickerModal
                isOpen={isEmojiPickerOpen}
                onClose={() => setIsEmojiPickerOpen(false)}
                onSelectEmoji={(emoji) => {
                    setEmoji(emoji);
                    setIsEmojiPickerOpen(false);
                }}
            />
        </>
    );
};

export default TaskForm;
