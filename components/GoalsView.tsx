import React, { useState, useMemo } from 'react';
import { Goal, Project, Task } from '../types';
import { TargetIcon, PlusIcon, PencilIcon, TrashIcon } from './Icons';
import GoalEditModal from './GoalEditModal';

interface GoalsViewProps {
    goals: Goal[];
    projects: Project[];
    tasks: Task[];
    onAddGoal: (name: string, description?: string, targetDate?: string) => Goal;
    onUpdateGoal: (goal: Goal) => void;
    onDeleteGoal: (goalId: string) => void;
    doneColumnNames: Set<string>;
}

const GoalsView: React.FC<GoalsViewProps> = ({ goals, projects, tasks, onAddGoal, onUpdateGoal, onDeleteGoal, doneColumnNames }) => {
    const [goalToEdit, setGoalToEdit] = useState<Goal | 'new' | null>(null);

    // Calculate progress for each goal
    const goalsWithProgress = useMemo(() => {
        return goals.map(goal => {
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
                    totalProgress += 100; // Count archived projects with no tasks as complete
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
                <button onClick={() => setGoalToEdit('new')} className="flex items-center gap-2 px-4 py-2.5 bg-highlight text-primary font-bold rounded-xl hover:opacity-90">
                    <PlusIcon className="w-5 h-5"/> Новая цель
                </button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goalsWithProgress.map(goal => (
                    <div key={goal.id} className="bg-primary p-6 rounded-2xl border border-border-color shadow-inner-soft flex flex-col group">
                        <div className="flex justify-between items-start">
                             <h3 className="text-xl font-bold text-text-primary mb-2">{goal.name}</h3>
                             <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => setGoalToEdit(goal)} title="Редактировать"><PencilIcon className="w-4 h-4 text-text-secondary hover:text-white"/></button>
                                <button onClick={() => onDeleteGoal(goal.id)} title="Удалить"><TrashIcon className="w-4 h-4 text-text-secondary hover:text-brand-red"/></button>
                             </div>
                        </div>
                        {goal.description && <p className="text-sm text-text-secondary mb-4 flex-grow">{goal.description}</p>}
                        {goal.targetDate && <p className="text-xs text-text-secondary mb-4">Срок: {new Date(goal.targetDate).toLocaleDateString()}</p>}
                        
                        <div className="mt-auto">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-semibold text-text-secondary">Прогресс</span>
                                <span className="font-mono text-text-primary">{Math.round(goal.progress)}%</span>
                            </div>
                            <div className="w-full bg-black/30 rounded-full h-2.5"><div className="bg-brand-yellow h-full rounded-full" style={{width: `${goal.progress}%`}}></div></div>
                            <p className="text-xs text-text-secondary mt-2">{goal.projectCount} проектов</p>
                        </div>
                    </div>
                ))}
            </div>
            
            {goalToEdit && <GoalEditModal
                isOpen={!!goalToEdit}
                goal={goalToEdit === 'new' ? null : goalToEdit}
                onClose={() => setGoalToEdit(null)}
                onSave={(name, description, targetDate, goalId) => {
                    if (goalId) {
                        const originalGoal = goals.find(g => g.id === goalId);
                        if (originalGoal) {
                            onUpdateGoal({ ...originalGoal, name, description, targetDate });
                        }
                    } else {
                        onAddGoal(name, description, targetDate);
                    }
                }}
            />}
        </div>
    );
};

export default GoalsView;