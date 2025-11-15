import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Project, Task, Board, TaskPriority, Attachment } from '../types';
import { PencilIcon, TagIcon, PaperclipIcon, TrashIcon, DocumentDuplicateIcon, SparklesIcon, LinkIcon, PhotoIcon, DocumentTextIcon } from './Icons';
import EmojiPickerModal from './EmojiPickerModal';
import { GoogleGenAI } from '@google/genai';


interface ProjectManagerProps {
    projects: Project[];
    tasks: Task[];
    activeProjectId: string | null;
    onAddProject: (name: string, color: string, emoji: string, tags: string[], boardId: string) => void;
    onSelectProject: (id: string) => void;
    onEditRequest: (project: Project, tab?: 'details' | 'attachments') => void;
    onDeleteRequest: (project: Project) => void;
    onDuplicateRequest: (projectId: string) => void;
    allTags: string[];
    boards: Board[];
    activeBoardId: string | null;
    allAttachments: Attachment[];
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, tasks, activeProjectId, onAddProject, onSelectProject, onEditRequest, onDeleteRequest, onDuplicateRequest, allTags, boards, activeBoardId, allAttachments }) => {
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectColor, setNewProjectColor] = useState('#A371F7');
    const [newProjectEmoji, setNewProjectEmoji] = useState('💡');
    const [newProjectTags, setNewProjectTags] = useState('');
    const [newProjectBoardId, setNewProjectBoardId] = useState(activeBoardId || '');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [aiAssessments, setAiAssessments] = useState<Record<string, string>>({});
    const [generatingAssessments, setGeneratingAssessments] = useState<Set<string>>(new Set());
    const [isRateLimited, setIsRateLimited] = useState(false);
    
    useEffect(() => {
        const generateFocusAssessment = async (project: Project, projectTasks: Task[]) => {
            const completedTasks = projectTasks.filter(t => t.status === 'Готово').length;
            const activeTasks = projectTasks.length - completedTasks;
            const tasksWithoutDueDate = projectTasks.filter(t => !t.dueDate && t.status !== 'Готово').length;
            const highPriorityTasks = projectTasks.filter(t => t.priority === TaskPriority.High && t.status !== 'Готово').length;
            
            const prompt = `
                Ты — AI-ассистент в планировщике задач TaskFlow.
                Твоя задача — проанализировать фокус на проекте и дать краткий (1-2 предложения) проактивный совет или наблюдение на русском языке. Будь полезным и дружелюбным. Не используй markdown.

                АНАЛИЗ ПРОЕКТА:
                - Название: "${project.name}"
                - Всего задач: ${projectTasks.length}
                - Выполнено: ${completedTasks}
                - Активно (не выполнено): ${activeTasks}
                - Активных задач без срока: ${tasksWithoutDueDate}
                - Активных задач с высоким приоритетом: ${highPriorityTasks}

                ПРИМЕРЫ ОТВЕТОВ:
                - Если проект движется, но у многих задач нет дедлайна: "Проект '${project.name}' движется активно, но без четкого дедлайна. Хочешь, я помогу их спланировать?"
                - Если все задачи выполнены: "Отличная работа по проекту '${project.name}'! Может, архивируем его или определим следующие шаги?"
                - Если много задач с высоким приоритетом: "В проекте '${project.name}' много срочных дел. Рекомендую сфокусироваться на них, чтобы ускорить прогресс."
                - Если нет прогресса: "По проекту '${project.name}' давно не было активности. Может, стоит разбить цели на более мелкие шаги?"
                - Если мало задач: "Проект '${project.name}' выглядит пустым. Хочешь, я помогу наполнить его задачами на основе цели?"

                Сгенерируй наиболее подходящий комментарий для текущего проекта.
            `;
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return response.text || '';
        };
    
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
        const updateAssessments = async () => {
            if (isRateLimited) return;
    
            for (const project of projects) {
                if (isRateLimited) break;
    
                const projectTasks = tasks.filter(t => t.projectId === project.id);
    
                if (projectTasks.length > 0 && !generatingAssessments.has(project.id) && !aiAssessments[project.id]) {
                    setGeneratingAssessments(prev => new Set(prev).add(project.id));
                    try {
                        await sleep(1100); // Small delay to avoid instant burst
                        const assessmentText = await generateFocusAssessment(project, projectTasks);
                        if (assessmentText) {
                            setAiAssessments(prev => ({ ...prev, [project.id]: assessmentText }));
                        }
                    } catch (error: any) {
                        console.error(`Error generating assessment for project ${project.id}:`, error);
                        const errorString = JSON.stringify(error).toLowerCase();
                        if (errorString.includes('quota') || errorString.includes('rate limit')) {
                            setIsRateLimited(true);
                            setAiAssessments(prev => ({ ...prev, [project.id]: "Достигнут лимит запросов." }));
                            break;
                        } else {
                            setAiAssessments(prev => ({ ...prev, [project.id]: "Ошибка анализа." }));
                        }
                    } finally {
                        setGeneratingAssessments(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(project.id);
                            return newSet;
                        });
                    }
                }
            }
        };
    
        const timer = setTimeout(updateAssessments, 1000);
        return () => clearTimeout(timer);
    
    }, [projects, tasks, isRateLimited, aiAssessments, generatingAssessments]);


    useEffect(() => {
        if (activeBoardId) {
            setNewProjectBoardId(activeBoardId);
        }
    }, [activeBoardId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim() && newProjectBoardId) {
            const tags = newProjectTags.split(',').map(tag => tag.trim()).filter(Boolean);
            onAddProject(newProjectName.trim(), newProjectColor, newProjectEmoji, tags, newProjectBoardId);
            setNewProjectName('');
            setNewProjectEmoji('💡');
            setNewProjectTags('');
        }
    };
    
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            if (project.boardId !== activeBoardId) return false;
            const nameMatch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
            const tagMatch = activeTag ? project.tags?.includes(activeTag) : true;
            return nameMatch && tagMatch;
        });
    }, [projects, searchTerm, activeTag, activeBoardId]);

    const inputClasses = "w-full bg-accent backdrop-blur-xl border border-border-color shadow-inner-soft rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight transition-all";

    const getAttachmentIcon = (att: Attachment) => {
        switch (att.type) {
            case 'link': return <LinkIcon className="w-4 h-4 text-highlight" />;
            case 'image': return <PhotoIcon className="w-4 h-4 text-brand-green" />;
            case 'file': return <DocumentTextIcon className="w-4 h-4 text-text-secondary" />;
        }
    };

    return (
        <>
            {isRateLimited && (
                <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red text-sm p-3 rounded-xl mb-4">
                    Достигнут лимит запросов к AI. Оценки временно недоступны.
                </div>
            )}

            <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputClasses} mb-4 text-sm`}
            />
            
            {allTags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                  <button onClick={() => setActiveTag(null)} className={`px-3 py-1 text-xs rounded-full transition-all ${!activeTag ? 'bg-highlight text-primary font-bold' : 'bg-accent border border-border-color text-text-secondary hover:bg-white/10'}`}>Все</button>
                  {allTags.map(tag => (
                      <button key={tag} onClick={() => setActiveTag(tag)} className={`px-3 py-1 text-xs rounded-full transition-all ${activeTag === tag ? 'bg-highlight text-primary font-bold' : 'bg-accent border border-border-color text-text-secondary hover:bg-white/10'}`}>#{tag}</button>
                  ))}
              </div>
            )}


            <ul className="space-y-1.5 mb-4 max-h-[30vh] overflow-y-auto">
                {filteredProjects.map(project => {
                    const projectTasks = tasks.filter(t => t.projectId === project.id);
                    const completedTasks = projectTasks.filter(t => t.status === 'Готово').length;
                    const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
                    
                    return (
                        <li key={project.id} className="group flex items-center gap-1">
                            <button 
                                onClick={() => onSelectProject(project.id)}
                                className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 flex flex-col gap-2 relative ${
                                    activeProjectId === project.id 
                                    ? 'bg-highlight/10 text-text-primary font-semibold' 
                                    : 'text-text-primary hover:bg-accent'
                                }`}
                            >
                                {activeProjectId === project.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-highlight rounded-l-xl"></div>}
                                
                                <div className="flex items-center gap-3">
                                    <span className="text-lg bg-primary/50 p-1.5 rounded-md z-10">{project.emoji || '📁'}</span>
                                    <div className="flex-grow truncate z-10">
                                        <span>{project.name}</span>
                                        {project.tags && project.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {project.tags.map(tag => (
                                                    <span key={tag} className="text-xs text-text-secondary bg-black/20 px-1.5 py-0.5 rounded">#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {projectTasks.length > 0 && (
                                    <div className="w-full text-xs text-text-secondary z-10 pl-12">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-medium">Прогресс</span>
                                            <span className="font-mono">{completedTasks}/{projectTasks.length}</span>
                                        </div>
                                        <div className="w-full bg-primary/50 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-highlight h-full rounded-full transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {(aiAssessments[project.id] || (generatingAssessments.has(project.id) && projectTasks.length > 0)) && (
                                    <div className="mt-2 pl-12 z-10">
                                        <div className="flex items-start gap-1.5 p-2 bg-primary/40 rounded-md">
                                            <SparklesIcon className="w-4 h-4 text-neon-purple flex-shrink-0 mt-0.5" />
                                            {generatingAssessments.has(project.id) && !aiAssessments[project.id] ? (
                                                <p className="text-xs text-text-secondary italic animate-pulse">Анализ фокуса...</p>
                                            ) : (
                                                <p className="text-xs text-text-secondary">{aiAssessments[project.id]}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </button>
                             <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                {(project.attachmentIds?.length || 0) > 0 && (
                                    <button 
                                        onClick={() => onEditRequest(project, 'attachments')}
                                        className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-accent transition-colors"
                                        aria-label={`Вложения проекта ${project.name}`}
                                    >
                                        <PaperclipIcon className="w-4 h-4" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => onEditRequest(project)}
                                    className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-accent transition-colors"
                                    aria-label={`Редактировать проект ${project.name}`}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => onDuplicateRequest(project.id)}
                                    className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-accent transition-colors"
                                    aria-label={`Дублировать проект ${project.name}`}
                                >
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => onDeleteRequest(project)}
                                    className="p-2 text-text-secondary hover:text-brand-red rounded-lg hover:bg-brand-red/10 transition-colors"
                                    aria-label={`Удалить проект ${project.name}`}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    )
                })}
            </ul>
            <form onSubmit={handleSubmit} className="space-y-3 border-t border-border-color pt-4">
                <select 
                    value={newProjectBoardId || ''} 
                    onChange={e => setNewProjectBoardId(e.target.value)} 
                    className={`${inputClasses} appearance-none h-12`}
                    required
                >
                    <option value="" disabled>-- Выберите доску --</option>
                    {boards.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setIsEmojiPickerOpen(true)} className="w-14 h-12 bg-accent border border-border-color rounded-xl p-2 text-2xl text-center focus:outline-none focus:ring-2 focus:ring-highlight shadow-inner-soft hover:border-border-color/50 transition-colors">
                        {newProjectEmoji}
                    </button>
                    <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Название нового проекта"
                        className={`${inputClasses} flex-grow h-12`}
                        required
                    />
                     <input
                        type="color"
                        value={newProjectColor}
                        onChange={(e) => setNewProjectColor(e.target.value)}
                        className="w-14 h-12 p-1 bg-accent border border-border-color rounded-xl cursor-pointer"
                        aria-label="Выбрать цвет проекта"
                    />
                </div>
                 <div className="relative">
                    <TagIcon className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none text-text-secondary" />
                    <input
                        type="text"
                        value={newProjectTags}
                        onChange={(e) => setNewProjectTags(e.target.value)}
                        placeholder="Теги, через запятую"
                        className={`${inputClasses} w-full pl-10 h-12`}
                    />
                </div>
                <button type="submit" className="w-full relative bg-highlight text-primary font-bold p-3 rounded-xl hover:opacity-90 transition-opacity h-12 text-base active:scale-95">
                    Добавить проект
                </button>
            </form>
            <EmojiPickerModal
                isOpen={isEmojiPickerOpen}
                onClose={() => setIsEmojiPickerOpen(false)}
                onSelectEmoji={(emoji) => {
                    setNewProjectEmoji(emoji);
                    setIsEmojiPickerOpen(false);
                }}
            />
        </>
    );
};

export default ProjectManager;