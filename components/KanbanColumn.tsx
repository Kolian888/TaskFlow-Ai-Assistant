import React, { useState, ReactNode } from 'react';
import { SortOption } from '../types';
import { SortIcon } from './Icons';

interface KanbanColumnProps {
  title: string;
  status: string;
  children: ReactNode;
  onDrop: (status: string) => void;
  sortOption: SortOption;
  onSortChange: (status: string, option: SortOption) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, children, onDrop, sortOption, onSortChange }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    onDrop(status);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-secondary rounded-2xl p-4 transition-all duration-300 flex flex-col border ${isOver ? 'border-highlight' : 'border-border-color'} shadow-soft-glow`}
    >
      <div className="flex justify-between items-center mb-4 border-b border-border-color pb-3">
        <h3 className="font-bold text-lg text-text-primary">{title}</h3>
        <div className="relative">
          <SortIcon className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-2.5 pointer-events-none text-text-secondary" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange(status, e.target.value as SortOption)}
            className="bg-accent text-sm rounded-lg border border-border-color pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-highlight appearance-none text-text-secondary"
            aria-label={`Сортировать колонку ${title}`}
          >
            <option value="default">По умолчанию</option>
            <option value="priority">По приоритету</option>
            <option value="dueDate">По сроку</option>
          </select>
        </div>
      </div>
      <div className="space-y-4 min-h-[200px] flex-grow">
        {children}
      </div>
    </div>
  );
};

export default KanbanColumn;