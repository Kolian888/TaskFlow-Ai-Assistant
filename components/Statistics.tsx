

import React, { useMemo, useState } from 'react';
import { Task, Project, PlayerStats, TaskPriority } from '../types';
import { ChartBarIcon, SparklesIcon } from './Icons';
// @ts-ignore
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { GoogleGenAI } from '@google/genai';


const ProgressBar: React.FC<{ percentage: number; colorClass?: string; }> = ({ percentage, colorClass = 'bg-highlight' }) => (
    <div className="w-full bg-black/30 rounded-full h-3 mt-1 shadow-inner-soft border border-border-color overflow-hidden">
        <div
            className={`${colorClass} h-full rounded-full transition-all duration-500`}
            style={{ 
              width: `${percentage}%`,
            }}
            title={`${Math.round(percentage)}%`}
        >
        </div>
    </div>
);

interface StatisticsProps {
    tasks: Task[];
    projects: Project[];
    playerStats: PlayerStats;
    onGenerateReport: () => Promise<string>;
    enableAi: boolean;
}

const Statistics: React.FC<StatisticsProps> = ({ tasks, projects, playerStats, onGenerateReport, enableAi }) => {
    const [aiReport, setAiReport] = useState<string | null>(null);
    const [isReportLoading, setIsReportLoading] = useState(false);
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

    const handleGenerateReport = async () => {
        setIsReportLoading(true);
        setAiReport(null);
        const report = await onGenerateReport();
        if (report.includes('Вы превысили лимит запросов')) {
            setIsQuotaExceeded(true);
        }
        setAiReport(report);
        setIsReportLoading(false);
    };

    const overallStats = useMemo(() => {
        const totalTasks = tasks.length;
        if (totalTasks === 0) return null;
        const completedTasks = tasks.filter(t => t.status === 'Готово').length;
        const completionRate = (completedTasks / totalTasks) * 100;
        return { totalTasks, completedTasks, completionRate };
    }, [tasks]);

    const projectStats = useMemo(() => {
        return projects.map(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const total = projectTasks.length;
            if (total === 0) return null;
            const completed = projectTasks.filter(t => t.status === 'Готово').length;
            const rate = (completed / total) * 100;
            return { project, total, completed, rate };
        }).filter((p): p is NonNullable<typeof p> => p !== null)
          .sort((a, b) => b.rate - a.rate);
    }, [projects, tasks]);

    const priorityStats = useMemo(() => {
        const priorityOrder: (TaskPriority | 'none')[] = [TaskPriority.High, TaskPriority.Medium, TaskPriority.Low, 'none'];
        return priorityOrder.map(priority => {
            const priorityTasks = tasks.filter(t => (t.priority || 'none') === priority);
            const total = priorityTasks.length;
            if (total === 0) return null;
            const completed = priorityTasks.filter(t => t.status === 'Готово').length;
            const rate = (completed / total) * 100;
            return { priority, total, completed, rate };
        }).filter((p): p is NonNullable<typeof p> => p !== null);
    }, [tasks]);
    
    const priorityLabels: Record<TaskPriority | 'none', string> = {
        [TaskPriority.High]: 'Высокий', [TaskPriority.Medium]: 'Средний', [TaskPriority.Low]: 'Низкий', 'none': 'Без приоритета'
    };

    const getWeekNumber = (d: Date) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return weekNo;
    }

    const productivityDynamics = useMemo(() => {
        const completedTasks = tasks.filter(t => t.status === 'Готово' && t.dueDate);
        const weeks: Record<string, number> = {};

        completedTasks.forEach(task => {
            if (!task.dueDate) return;
            const date = new Date(task.dueDate);
            const year = date.getFullYear();
            const week = getWeekNumber(date);
            const key = `${year}-W${week.toString().padStart(2, '0')}`;
            weeks[key] = (weeks[key] || 0) + 1;
        });
        
        const sortedWeeks = Object.entries(weeks)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .slice(-8); // Show last 8 weeks
            
        if (sortedWeeks.length === 0) return null;

        const maxTasks = Math.max(...sortedWeeks.map(([, count]) => count), 0);
        
        return {
            labels: sortedWeeks.map(([key]) => key.substring(5)),
            data: sortedWeeks.map(([, count]) => count),
            maxTasks: maxTasks > 0 ? maxTasks : 1,
        };
    }, [tasks]);

    if (!overallStats) {
        return (
            <div className="bg-secondary p-8 rounded-3xl border border-border-color shadow-soft-glow">
                 <h2 className="text-3xl font-bold text-text-primary mb-6">Статистика</h2>
                <div className="text-center py-16">
                    <h3 className="text-xl font-semibold text-text-secondary">Нет данных для статистики</h3>
                    <p className="text-text-primary mt-2">Начните выполнять задачи, чтобы увидеть свой прогресс!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-secondary p-4 md:p-8 rounded-3xl border border-border-color shadow-soft-glow space-y-8">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <ChartBarIcon className="w-8 h-8 text-neon-blue" />
                    <h2 className="text-3xl font-bold text-text-primary">Статистика</h2>
                </div>
                <p className="text-text-secondary">Обзор вашей продуктивности.</p>
            </header>
            
            {enableAi && (
                <div className="bg-primary p-5 rounded-xl border border-border-color shadow-inner-soft">
                    <h3 className="text-lg font-bold text-text-secondary mb-3">Отчет от ИИ-Ментора</h3>
                    {aiReport ? (
                         <div className="prose prose-invert prose-sm max-w-none text-text-primary" dangerouslySetInnerHTML={{ __html: marked.parse(aiReport) }}></div>
                    ) : (
                        <button onClick={handleGenerateReport} disabled={isReportLoading || isQuotaExceeded} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neon-purple/80 text-white font-bold rounded-xl hover:bg-neon-purple transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon className="w-5 h-5"/>
                            {isReportLoading ? 'Анализирую данные...' : 'Сгенерировать отчет'}
                        </button>
                    )}
                     {isQuotaExceeded && !aiReport && (
                        <p className="text-center text-brand-yellow text-xs mt-2">
                            Достигнут лимит запросов для генерации отчетов. Попробуйте позже.
                        </p>
                    )}
                </div>
            )}
            
            {productivityDynamics && (
                <div className="bg-primary p-5 rounded-xl border border-border-color shadow-inner-soft">
                    <h3 className="text-lg font-bold text-text-secondary mb-4">Динамика продуктивности (по неделям)</h3>
                    <div className="flex justify-between items-end gap-2 h-40 pt-4 border-t border-border-color">
                        {productivityDynamics.data.map((value, index) => (
                            <div key={productivityDynamics.labels[index]} className="flex-1 h-full flex flex-col items-center justify-end gap-2 group" title={`${productivityDynamics.labels[index]}: ${value} задач`}>
                                <div className="font-bold text-text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm">{value}</div>
                                <div 
                                    className="w-3/4 max-w-md bg-neon-purple rounded-t-md transition-all duration-500 hover:bg-highlight"
                                    style={{ height: `${(value / productivityDynamics.maxTasks) * 85}%` }}
                                />
                                <div className="text-xs text-text-secondary font-mono">{productivityDynamics.labels[index]}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-primary p-5 rounded-xl border border-border-color shadow-inner-soft">
                <h3 className="text-lg font-bold text-text-secondary mb-3">Общий прогресс</h3>
                <div className="flex justify-between items-center text-text-primary font-semibold">
                    <span>Всего выполнено</span>
                    <span>{overallStats.completedTasks} / {overallStats.totalTasks} задач</span>
                </div>
                <ProgressBar percentage={overallStats.completionRate} colorClass="bg-neon-blue" />
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
                <div className="bg-primary p-5 rounded-xl border border-border-color shadow-inner-soft">
                    <h3 className="text-lg font-bold text-text-secondary mb-4">Продуктивность по проектам</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {projectStats.map(({ project, completed, total, rate }) => (
                            <div key={project.id}><div className="flex justify-between items-center text-sm mb-1"><span className="font-semibold text-text-primary flex items-center gap-2">{project.emoji || '📁'} {project.name}</span><span className="text-text-secondary font-mono">{completed}/{total}</span></div><ProgressBar percentage={rate} colorClass="bg-brand-purple" /></div>
                        ))}
                    </div>
                </div>
                <div className="bg-primary p-5 rounded-xl border border-border-color shadow-inner-soft">
                    <h3 className="text-lg font-bold text-text-secondary mb-4">Продуктивность по приоритетам</h3>
                    <div className="space-y-4">
                        {priorityStats.map(({ priority, completed, total, rate }) => {
                             const styleMap = { [TaskPriority.High]: { text: 'text-brand-pink', bg: 'bg-brand-pink' }, [TaskPriority.Medium]: { text: 'text-brand-green', bg: 'bg-brand-green' }, [TaskPriority.Low]: { text: 'text-brand-blue', bg: 'bg-brand-blue' }, 'none': { text: 'text-gray-400', bg: 'bg-gray-500' } };
                             const style = styleMap[priority];
                             return <div key={priority}><div className="flex justify-between items-center text-sm mb-1"><span className={`font-semibold ${style.text}`}>{priorityLabels[priority]}</span><span className="text-text-secondary font-mono">{completed}/{total}</span></div><ProgressBar percentage={rate} colorClass={style.bg} /></div>
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;