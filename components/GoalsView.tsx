
import React, { useMemo } from 'react';
import { Goal, Project, Task } from '../types';
import { TargetIcon, PlusIcon, PencilIcon, TrashIcon } from './Icons';

interface GoalsViewProps {
    goals: Goal[];
    projects: Project[];
    tasks: Task[];
    onDeleteGoal: (goalId: string) => void;
    onEditRequest: (goal: Goal | 'new') => void;
    doneColumnNames: Set<string>;
}

const GoalsView: React.FC<GoalsViewProps> = ({ goals, projects, tasks, onDeleteGoal, onEditRequest, doneColumnNames }) => {

    const goalsWithProgress = useMemo(() => {
        return goals
            .filter(goal => goal.status !== 'archived')
            .map(goal => {
                const linkedProjects = projects.filter(p => p.goalId === goal.id);
                if (linkedProjects.length === 0) {
                    return { ...goal, progress: 0, projectCount: 0 };
                }
                
                let totalProgress = 0;
                let projectsWithTasks = 0;

                linkedProjects.forEach(p => {
                    const projectTasks = tasks.filter(t => t.projectId === p.id);
                    if (projectTasks.length > 0) {
                        const completedTasks = projectTasks.filter(t => doneColumnNames.has(t.status)).length;
                        totalProgress += (completedTasks / projectTasks.length) * 100;
                        projectsWithTasks++;
                    } else if (p.archived) {
                        totalProgress += 100;
                        projectsWithTasks++;
                    } else {
                        // Project has no tasks and is not archived, counts as a project but adds 0 progress.
                        projectsWithTasks++;
                    }
                });

                const finalProgress = projectsWithTasks > 0 ? totalProgress / projectsWithTasks : 0;
                return { ...goal, progress: finalProgress, projectCount: linkedProjects.length };
            }).sort((a,b) => b.progress - a.progress);
    }, [goals, projects, tasks, doneColumnNames]);
    

    return (
        <div className="bg-secondary p-8 rounded-3xl border border-border-color shadow-soft-glow">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <TargetIcon className="w-8 h-8 text-brand-yellow" />
                    <h2 className="text-3xl font-bold text-text-primary">Цели</h2>
                </div>
                <button onClick={() => onEditRequest('new')} className="flex items-center gap-2 px-4 py-2.5 bg-highlight text-primary font-bold rounded-xl hover:opacity-90">
                    <PlusIcon className="w-5 h-5"/> Новая цель
                </button>
            </header>
            
            {goalsWithProgress.length === 0 ? (
                <div className="text-center py-16">
                    <h3 className="text-xl font-semibold text-text-secondary">Целей пока нет</h3>
                    <p className="text-text-primary mt-2">Создайте свою первую цель, чтобы начать движение к большим достижениям.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goalsWithProgress.map(goal => (
                        <div key={goal.id} className="bg-primary p-6 rounded-2xl border border-border-color shadow-inner-soft flex flex-col group">
                            <div className="flex justify-between items-start">
                                 <h3 className="text-xl font-bold text-text-primary mb-2">{goal.name}</h3>
                                 <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => onEditRequest(goal)} title="Редактировать"><PencilIcon className="w-4 h-4 text-text-secondary hover:text-white"/></button>
                                    <button onClick={() => onDeleteGoal(goal.id)} title="Удалить"><TrashIcon className="w-4 h-4 text-text-secondary hover:text-brand-red"/></button>
                                 </div>
                            </div>
                            {goal.description && <p className="text-sm text-text-secondary mb-4 flex-grow min-h-[40px]">{goal.description}</p>}
                            {goal.targetDate && <p className="text-xs text-text-secondary mb-4">Срок: {new Date(goal.targetDate).toLocaleDateString()}</p>}
                            
                            <div className="mt-auto">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-semibold text-text-secondary">Прогресс</span>
                                    <span className="font-mono text-text-primary">{Math.round(goal.progress)}%</span>
                                </div>
                                <div className="w-full bg-black/30 rounded-full h-2.5 shadow-inner-soft border border-border-color">
                                    <div 
                                        className="bg-gradient-to-r from-brand-yellow to-yellow-400 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${goal.progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-text-secondary mt-2">{goal.projectCount} проектов привязано</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GoalsView;
