

import React, { useState } from 'react';
import { Board, Project, Task } from '../types';
import { BriefcaseIcon, UserIcon, HeartIcon, CurrencyDollarIcon, AcademicCapIcon, ArrowRightIcon, LayersIcon, ChevronDownIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

const getBoardVisuals = (boardName: string) => {
    const name = boardName.toLowerCase();
    if (name.includes('работ')) return { Icon: BriefcaseIcon, color: '#4E95F2' };
    if (name.includes('личн')) return { Icon: UserIcon, color: '#A371F7' };
    if (name.includes('здоров')) return { Icon: HeartIcon, color: '#EB5757' };
    if (name.includes('финанс')) return { Icon: CurrencyDollarIcon, color: '#F2C94C' };
    if (name.includes('развити') || name.includes('учеб')) return { Icon: AcademicCapIcon, color: '#52D186' };
    return { Icon: LayersIcon, color: '#9CA3AF' };
};

interface DashboardCardProps {
    board: Board & { projectCount: number; taskCount: number };
    onNavigate: () => void;
    onUpdateColor: (color: string) => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ board, onNavigate, onUpdateColor }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { Icon, color: defaultColor } = getBoardVisuals(board.name);
    const cardColor = board.color || defaultColor;

    return (
        <motion.div
            layout
            className="bg-primary rounded-2xl border border-border-color shadow-inner-soft flex flex-col overflow-hidden"
            style={{ '--card-color': cardColor } as React.CSSProperties}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ layout: { duration: 0.3, ease: 'easeInOut' } }}
        >
            <div className="p-6 flex flex-col">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 mb-4">
                        <Icon className="w-8 h-8 text-[var(--card-color)]" />
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary" style={{backgroundImage: `linear-gradient(45deg, white, ${cardColor})`}}>
                            {board.name}
                        </h2>
                    </div>
                    <div className="relative flex items-center gap-2">
                         <div className="relative w-7 h-7">
                            <input
                                type="color"
                                value={cardColor}
                                onChange={(e) => onUpdateColor(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="Выбрать цвет доски"
                            />
                            <div 
                                className="w-full h-full rounded-md border-2 border-secondary pointer-events-none" 
                                style={{ backgroundColor: cardColor }}
                            />
                        </div>
                        <button onClick={() => setIsCollapsed(p => !p)} className="p-1.5 text-text-secondary hover:text-white rounded-full hover:bg-accent transition-colors">
                            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 pt-2">
                             <div className="space-y-3">
                                <p className="text-text-secondary"><span className="font-bold text-text-primary text-xl">{board.projectCount}</span> активных проектов</p>
                                <p className="text-text-secondary"><span className="font-bold text-text-primary text-xl">{board.taskCount}</span> открытых задач</p>
                            </div>
                            <button
                                onClick={onNavigate}
                                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/80 text-text-primary font-bold rounded-xl hover:bg-white/10 transition-colors"
                            >
                                Перейти к доске
                                <ArrowRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

interface DashboardViewProps {
    boards: Board[];
    projects: Project[];
    tasks: Task[];
    onNavigateToBoard: (boardId: string) => void;
    onUpdateBoardColor: (boardId: string, color: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ boards, projects, tasks, onNavigateToBoard, onUpdateBoardColor }) => {
    const doneColumnNames = new Set(boards.flatMap(b => b.columns[b.columns.length - 1]));

    const boardStats = boards.map(board => {
        const boardProjects = projects.filter(p => p.boardId === board.id && !p.archived);
        const boardTasks = tasks.filter(t => t.boardId === board.id && !doneColumnNames.has(t.status));
        return {
            ...board,
            projectCount: boardProjects.length,
            taskCount: boardTasks.length
        };
    });

    return (
        <div className="bg-secondary p-4 md:p-8 rounded-3xl border border-border-color shadow-soft-glow">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Командный центр</h1>
                <p className="text-text-secondary mt-1">Обзор всех ваших сфер жизни.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {boardStats.map((board) => (
                   <DashboardCard
                        key={board.id}
                        board={board}
                        onNavigate={() => onNavigateToBoard(board.id)}
                        onUpdateColor={(color) => onUpdateBoardColor(board.id, color)}
                   />
                ))}
            </div>
        </div>
    );
};

export default DashboardView;