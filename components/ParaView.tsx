import React, { useState, useMemo } from 'react';
import { Project, Board, Note, Task, Attachment } from '../types';
import { LayersIcon, KanbanIcon, DocumentDuplicateIcon, CheckCircleIcon, ChevronLeftIcon, PaperclipIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface ParaViewProps {
    projects: Project[];
    boards: Board[]; // These are Areas
    notes: Note[];
    tasks: Task[];
    isMobile: boolean;
    allAttachments: Attachment[];
}

const ParaView: React.FC<ParaViewProps> = ({ projects, boards, notes, tasks, isMobile, allAttachments }) => {
    const [viewMode, setViewMode] = useState<'active' | 'archive'>('active');
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    
    const doneColumnNames = useMemo(() => new Set(boards.map(b => b.columns[b.columns.length - 1])), [boards]);

    const displayedProjects = useMemo(() => {
        if (!selectedBoardId) return [];
        return projects.filter(p => p.boardId === selectedBoardId && (viewMode === 'active' ? !p.archived : p.archived));
    }, [projects, selectedBoardId, viewMode]);

    const displayedTasks = useMemo(() => {
        if (!selectedProjectId) return [];
        const projectIsArchived = projects.find(p => p.id === selectedProjectId)?.archived;
        return tasks.filter(t => 
            t.projectId === selectedProjectId && 
            (viewMode === 'active' ? !doneColumnNames.has(t.status) && !projectIsArchived : doneColumnNames.has(t.status) || projectIsArchived)
        );
    }, [tasks, selectedProjectId, viewMode, doneColumnNames, projects]);

    const displayedResources = useMemo(() => {
        let linkedNoteIds = new Set<string>();
        if (selectedProjectId) {
            notes.forEach(note => {
                if (note.linkedProjectIds?.includes(selectedProjectId)) linkedNoteIds.add(note.id);
            });
        }
        if (selectedTaskId) {
            notes.forEach(note => {
                if (note.linkedTaskIds?.includes(selectedTaskId)) linkedNoteIds.add(note.id);
            });
        }
        return notes.filter(note => linkedNoteIds.has(note.id));
    }, [notes, selectedProjectId, selectedTaskId]);

    const ParaColumn: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode; emptyText: string, onBack?: () => void }> = ({ title, icon: Icon, children, emptyText, onBack }) => (
        <div className="bg-primary p-4 rounded-xl border border-border-color shadow-inner-soft h-full flex flex-col">
            <div className="flex items-center gap-2.5 mb-4 flex-shrink-0 border-b border-border-color pb-3">
                {onBack && <button onClick={onBack} className="p-1 rounded-full hover:bg-accent"><ChevronLeftIcon className="w-5 h-5" /></button>}
                <Icon className="w-6 h-6 text-neon-purple" />
                <h2 className="text-xl font-bold text-text-primary">{title}</h2>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-3 space-y-2">
                 <AnimatePresence>
                    {React.Children.count(children) > 0 ? children : (
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-full">
                            <p className="text-sm text-center text-text-secondary p-4">{emptyText}</p>
                        </motion.div>
                    )}
                 </AnimatePresence>
            </div>
        </div>
    );
    
    const listItemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
    };

    if (isMobile) {
        return (
            <div className="bg-secondary p-4 rounded-3xl border border-border-color shadow-soft-glow h-[calc(100vh-130px)] flex flex-col relative overflow-hidden">
                <AnimatePresence>
                    {!selectedBoardId && (
                        <motion.div key="boards" initial={{ x: '-100%' }} animate={{ x: '0%' }} exit={{ x: '-100%' }} transition={{ ease: 'easeInOut' }} className="absolute inset-0">
                            <ParaColumn title="Сферы" icon={LayersIcon} emptyText="Нет доступных сфер.">
                                {boards.map(b => (
                                    <motion.button key={b.id} variants={listItemVariants} onClick={() => setSelectedBoardId(b.id)} className="w-full text-left p-3 rounded-lg bg-accent text-text-secondary hover:bg-white/5 hover:text-text-primary">
                                        {b.name}
                                    </motion.button>
                                ))}
                            </ParaColumn>
                        </motion.div>
                    )}
                    {selectedBoardId && !selectedProjectId && (
                         <motion.div key="projects" initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '-100%' }} transition={{ ease: 'easeInOut' }} className="absolute inset-0">
                            <ParaColumn title={boards.find(b=>b.id===selectedBoardId)?.name || 'Проекты'} icon={KanbanIcon} onBack={() => setSelectedBoardId(null)} emptyText="Нет проектов в этой сфере.">
                                 {displayedProjects.map(p => (
                                    <motion.button key={p.id} variants={listItemVariants} onClick={() => setSelectedProjectId(p.id)} className="w-full text-left p-3 rounded-lg bg-accent text-text-primary hover:bg-white/5 flex items-center justify-between">
                                        <span>{p.emoji} {p.name}</span>
                                        {(p.attachmentIds?.length || 0) > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-text-secondary">
                                                <PaperclipIcon className="w-4 h-4" />
                                                {p.attachmentIds?.length}
                                            </span>
                                        )}
                                    </motion.button>
                                 ))}
                            </ParaColumn>
                        </motion.div>
                    )}
                    {selectedProjectId && (
                        <motion.div key="tasks" initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '-100%' }} transition={{ ease: 'easeInOut' }} className="absolute inset-0">
                            <ParaColumn title={projects.find(p=>p.id===selectedProjectId)?.name || 'Задачи'} icon={CheckCircleIcon} onBack={() => setSelectedProjectId(null)} emptyText="Нет задач в этом проекте.">
                                {displayedTasks.map(t => <motion.div key={t.id} variants={listItemVariants} className="w-full text-left p-3 rounded-lg bg-accent text-text-primary">{t.emoji} {t.title}</motion.div>)}
                            </ParaColumn>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="bg-secondary p-6 rounded-3xl border border-border-color shadow-soft-glow h-[calc(100vh-130px)] flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                 <h2 className="text-3xl font-bold text-text-primary">PARA Dashboard</h2>
                 <div className="flex items-center gap-2 p-1 bg-primary rounded-full border border-border-color">
                    <button onClick={() => setViewMode('active')} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${viewMode === 'active' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>Активные</button>
                    <button onClick={() => setViewMode('archive')} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${viewMode === 'archive' ? 'bg-accent text-white' : 'hover:bg-accent'}`}>Архив</button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow min-h-0">
                <ParaColumn title="Сферы" icon={LayersIcon} emptyText="Нет доступных сфер.">
                    {boards.map(b => (
                        <motion.button key={b.id} variants={listItemVariants} initial="hidden" animate="visible" exit="exit"
                            onClick={() => { setSelectedBoardId(b.id); setSelectedProjectId(null); setSelectedTaskId(null); }}
                            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 text-sm font-semibold ${selectedBoardId === b.id ? 'bg-highlight/10 text-text-primary' : 'bg-accent text-text-secondary hover:bg-white/5 hover:text-text-primary'}`}
                        >
                            {b.name}
                        </motion.button>
                    ))}
                </ParaColumn>

                <ParaColumn title="Проекты" icon={KanbanIcon} emptyText={selectedBoardId ? "Нет проектов в этой сфере." : "Выберите сферу."}>
                    {displayedProjects.map(p => {
                        const projectTasks = tasks.filter(t => t.projectId === p.id);
                        const completedTasks = projectTasks.filter(t => doneColumnNames.has(t.status)).length;
                        const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : (p.archived ? 100 : 0);
                        return (
                             <motion.button key={p.id} variants={listItemVariants} initial="hidden" animate="visible" exit="exit"
                                onClick={() => { setSelectedProjectId(p.id); setSelectedTaskId(null); }}
                                className={`w-full text-left p-3 rounded-lg transition-colors flex flex-col gap-2 ${selectedProjectId === p.id ? 'bg-highlight/10 ring-1 ring-highlight' : 'bg-accent hover:bg-white/5'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-text-primary">{p.emoji} {p.name}</span>
                                    {(p.attachmentIds?.length || 0) > 0 && (
                                        <span className="flex items-center gap-1 text-xs text-text-secondary">
                                            <PaperclipIcon className="w-4 h-4" />
                                            {p.attachmentIds?.length}
                                        </span>
                                    )}
                                </div>

                                {projectTasks.length > 0 && (
                                     <div className="w-full text-xs text-text-secondary">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span>Прогресс</span>
                                            <span className="font-mono">{completedTasks}/{projectTasks.length}</span>
                                        </div>
                                        <div className="w-full bg-primary/50 rounded-full h-1.5"><div className="bg-highlight h-full rounded-full" style={{ width: `${progress}%` }}></div></div>
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </ParaColumn>
                
                <ParaColumn title="Задачи" icon={CheckCircleIcon} emptyText={selectedProjectId ? "Нет задач в этом проекте." : "Выберите проект."}>
                     {displayedTasks.map(t => {
                         const statusColor = doneColumnNames.has(t.status) ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-yellow/20 text-brand-yellow';
                         return (
                            <motion.button key={t.id} variants={listItemVariants} initial="hidden" animate="visible" exit="exit"
                                onClick={() => setSelectedTaskId(t.id)}
                                className={`w-full text-left p-3 rounded-lg transition-colors flex justify-between items-center ${selectedTaskId === t.id ? 'bg-highlight/10 ring-1 ring-highlight' : 'bg-accent hover:bg-white/5'}`}
                            >
                                <span className="font-medium text-text-primary text-sm">{t.emoji} {t.title}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{t.status}</span>
                            </motion.button>
                         )
                    })}
                </ParaColumn>
                
                <ParaColumn title="Ресурсы" icon={DocumentDuplicateIcon} emptyText="Нет привязанных ресурсов.">
                     {displayedResources.map(n => (
                         <motion.div key={n.id} variants={listItemVariants} initial="hidden" animate="visible" exit="exit"
                            className="bg-accent p-3 rounded-lg text-sm text-text-secondary"
                        >
                            <p className="line-clamp-3">{n.content}</p>
                        </motion.div>
                    ))}
                </ParaColumn>
            </div>
        </div>
    );
};

export default ParaView;