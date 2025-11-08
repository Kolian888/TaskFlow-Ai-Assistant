import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, Task, Note } from '../types';
import { MagnifyingGlassIcon, XIcon, FolderOpenIcon, CheckCircleIcon, DocumentDuplicateIcon } from './Icons';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    tasks: Task[];
    notes: Note[];
    onNavigate: (type: 'project' | 'task' | 'note', id: string) => void;
}

type SearchResult = {
    type: 'project' | 'task' | 'note';
    id: string;
    title: string;
    context?: string;
};

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, projects, tasks, notes, onNavigate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const searchResults = useMemo((): SearchResult[] => {
        if (searchTerm.length < 2) return [];

        const lowerSearchTerm = searchTerm.toLowerCase();
        const results: SearchResult[] = [];

        // Search projects
        projects.forEach(p => {
            if (p.name.toLowerCase().includes(lowerSearchTerm) || p.tags?.some(t => t.toLowerCase().includes(lowerSearchTerm))) {
                results.push({ type: 'project', id: p.id, title: p.name });
            }
        });

        // Search tasks
        tasks.forEach(t => {
            if (t.title.toLowerCase().includes(lowerSearchTerm) || t.description.toLowerCase().includes(lowerSearchTerm) || t.tags?.some(t => t.toLowerCase().includes(lowerSearchTerm))) {
                const project = projects.find(p => p.id === t.projectId);
                results.push({ type: 'task', id: t.id, title: t.title, context: project?.name });
            }
        });

        // Search notes
        notes.forEach(n => {
            if (n.title.toLowerCase().includes(lowerSearchTerm) || n.content.toLowerCase().includes(lowerSearchTerm) || n.tags?.some(t => t.toLowerCase().includes(lowerSearchTerm))) {
                results.push({ type: 'note', id: n.id, title: n.title });
            }
        });

        return results;
    }, [searchTerm, projects, tasks, notes]);

    useEffect(() => {
        setActiveIndex(0);
    }, [searchResults]);

    useEffect(() => {
        if (resultsRef.current && resultsRef.current.children[activeIndex]) {
            resultsRef.current.children[activeIndex].scrollIntoView({
                block: 'nearest',
            });
        }
    }, [activeIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            }

            if (searchResults.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveIndex(prev => (prev + 1) % searchResults.length);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const selectedResult = searchResults[activeIndex];
                    if (selectedResult) {
                        onNavigate(selectedResult.type, selectedResult.id);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, searchResults, activeIndex, onNavigate, onClose]);

    const getIcon = (type: SearchResult['type']) => {
        switch (type) {
            case 'project': return <FolderOpenIcon className="w-5 h-5 text-neon-purple" />;
            case 'task': return <CheckCircleIcon className="w-5 h-5 text-highlight" />;
            case 'note': return <DocumentDuplicateIcon className="w-5 h-5 text-brand-yellow" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-primary/80 backdrop-blur-md flex justify-center items-start z-50 pt-[15vh] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="bg-secondary shadow-soft-glow w-full max-w-2xl border border-border-color rounded-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative p-4 border-b border-border-color">
                            <MagnifyingGlassIcon className="w-6 h-6 text-text-secondary absolute top-1/2 left-7 -translate-y-1/2 pointer-events-none" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Поиск по проектам, задачам и заметкам..."
                                className="w-full bg-transparent text-lg pl-12 pr-4 py-2 outline-none text-text-primary placeholder:text-text-secondary"
                            />
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                            {searchTerm.length < 2 ? (
                                <p className="text-center text-text-secondary p-8">Начните вводить, чтобы найти что-нибудь...</p>
                            ) : searchResults.length > 0 ? (
                                <ul className="p-2" ref={resultsRef}>
                                    {searchResults.map((result, index) => (
                                        <li key={`${result.type}-${result.id}`}>
                                            <button
                                                onClick={() => onNavigate(result.type, result.id)}
                                                className={`w-full flex items-center gap-4 text-left p-3 rounded-lg transition-colors ${activeIndex === index ? 'bg-highlight/10' : 'hover:bg-accent'}`}
                                            >
                                                <div className="flex-shrink-0">{getIcon(result.type)}</div>
                                                <div className="flex-grow min-w-0">
                                                    <p className="text-text-primary font-semibold truncate">{result.title}</p>
                                                    {result.context && <p className="text-xs text-text-secondary truncate">{result.context}</p>}
                                                </div>
                                                <span className="text-xs font-mono text-text-secondary bg-primary px-1.5 py-0.5 rounded-md border border-border-color">{result.type === 'project' ? 'Проект' : result.type === 'task' ? 'Задача' : 'Заметка'}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-text-secondary p-8">Ничего не найдено.</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalSearchModal;