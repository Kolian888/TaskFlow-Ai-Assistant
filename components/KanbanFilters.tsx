

import React from 'react';
import { TaskPriority, Project } from '../types';
import { ChevronDownIcon } from './Icons';

interface KanbanFiltersProps {
    activeFilter: 'all' | TaskPriority;
    onFilterChange: (filter: 'all' | TaskPriority) => void;
    projects: Project[];
    allTags: string[];
    activeProjectFilter: 'all' | string;
    onProjectFilterChange: (projectId: 'all' | string) => void;
    activeTagFilter: 'all' | string;
    onTagFilterChange: (tag: 'all' | string) => void;
}

const priorityOptions: ('all' | TaskPriority)[] = ['all', TaskPriority.High, TaskPriority.Medium, TaskPriority.Low];
const priorityLabels: Record<'all' | TaskPriority, string> = {
    'all': 'Все',
    [TaskPriority.High]: 'Высокий',
    [TaskPriority.Medium]: 'Средний',
    [TaskPriority.Low]: 'Низкий',
};

const KanbanFilters: React.FC<KanbanFiltersProps> = ({ 
    activeFilter, 
    onFilterChange,
    projects,
    allTags,
    activeProjectFilter,
    onProjectFilterChange,
    activeTagFilter,
    onTagFilterChange
}) => {
    return (
        <details className="mb-6 md:mb-8 bg-secondary rounded-2xl border border-border-color shadow-soft-glow group overflow-hidden" open={window.innerWidth >= 1024}>
            <summary className="p-3 md:p-4 flex justify-between items-center cursor-pointer list-none bg-accent/30">
                <h3 className="font-bold text-base md:text-lg text-text-primary">Фильтры</h3>
                <ChevronDownIcon className="w-5 h-5 text-text-secondary transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-3 p-3 md:p-4 border-t border-border-color">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                    <span className="text-sm font-medium text-text-secondary flex-shrink-0">Приоритет:</span>
                    <div className="flex items-center gap-1 p-1 bg-primary rounded-full border border-border-color">
                        {priorityOptions.map(priority => (
                            <button
                                key={priority}
                                onClick={() => onFilterChange(priority)}
                                className={`px-2 py-1 text-xs md:px-3 md:py-1.5 md:text-sm font-semibold rounded-full transition-all duration-200 ${
                                    activeFilter === priority
                                    ? 'bg-highlight text-primary'
                                    : 'text-text-primary hover:bg-white/5'
                                }`}
                            >
                                {priorityLabels[priority]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-y-3 gap-x-4">
                     <div className="flex items-center gap-2">
                        <label htmlFor="project-filter" className="text-sm font-medium text-text-secondary flex-shrink-0">Проект:</label>
                        <div className="relative">
                            <select 
                                id="project-filter" 
                                value={activeProjectFilter} 
                                onChange={e => onProjectFilterChange(e.target.value)}
                                className="bg-accent text-xs md:text-sm text-text-primary rounded-lg border border-border-color px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-highlight appearance-none pr-8"
                            >
                                <option value="all">Все проекты</option>
                                <option value="no-project">Без проекта</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <ChevronDownIcon className="w-4 h-4 text-text-secondary absolute top-1/2 right-2.5 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                     <div className="flex items-center gap-2">
                        <label htmlFor="tag-filter" className="text-sm font-medium text-text-secondary">Тег:</label>
                        <div className="relative">
                            <select 
                                id="tag-filter" 
                                value={activeTagFilter} 
                                onChange={e => onTagFilterChange(e.target.value)}
                                className="bg-accent text-xs md:text-sm text-text-primary rounded-lg border border-border-color px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-highlight appearance-none pr-8"
                            >
                                <option value="all">Все теги</option>
                                {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
                            </select>
                            <ChevronDownIcon className="w-4 h-4 text-text-secondary absolute top-1/2 right-2.5 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>
        </details>
    );
};

export default KanbanFilters;