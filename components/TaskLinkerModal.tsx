import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../types';
import { XIcon } from './Icons';

interface TaskLinkerModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    onLinkTask: (taskId: string) => void;
}

const TaskLinkerModal: React.FC<TaskLinkerModalProps> = ({ isOpen, onClose, tasks, onLinkTask }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTasks = useMemo(() => {
        if (!searchTerm) return tasks;
        return tasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [tasks, searchTerm]);

    const handleLink = (taskId: string) => {
        onLinkTask(taskId);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-[60] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-secondary p-6 rounded-2xl shadow-soft-glow w-full max-w-md border border-border-color flex flex-col max-h-[80vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h3 className="text-lg font-bold text-text-primary">Привязать к существующей задаче</h3>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-accent">
                                <XIcon className="w-5 h-5 text-text-secondary" />
                            </button>
                        </div>

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Поиск по задачам..."
                            className="w-full bg-accent border border-border-color rounded-lg p-2 mb-4 text-sm focus:ring-2 focus:ring-highlight outline-none"
                        />

                        <div className="flex-grow overflow-y-auto space-y-1 pr-1 -mr-2">
                            {filteredTasks.length > 0 ? filteredTasks.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => handleLink(task.id)}
                                    className="w-full text-left p-2 rounded-md hover:bg-accent text-text-primary transition-colors"
                                >
                                    {task.emoji} {task.title}
                                </button>
                            )) : (
                                <p className="text-center text-sm text-text-secondary py-4">Задачи не найдены.</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TaskLinkerModal;
