import React from 'react';
import TaskForm from './TaskForm';
import { Project, Task } from '../types';
import { XIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTask: (taskData: Omit<Task, 'id' | 'status' | 'pomodorosCompleted' | 'boardId'>) => void;
    projects: Project[];
    activeProjectId: string | null;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
    isOpen,
    onClose,
    onAddTask,
    projects,
    activeProjectId
}) => {
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4"
                    onClick={onClose}
                    aria-modal="true"
                    role="dialog"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="bg-secondary p-4 md:p-6 rounded-3xl shadow-soft-glow w-full max-w-md border border-border-color max-h-[85vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                             <h2 className="text-xl font-bold text-text-primary">Новая задача</h2>
                             <button onClick={onClose} className="p-2 rounded-full hover:bg-accent">
                                 <XIcon className="w-5 h-5 text-text-secondary"/>
                             </button>
                        </div>
                        <div className="flex-grow overflow-y-auto -mx-1 p-1">
                            <TaskForm
                                onAddTask={onAddTask}
                                projects={projects}
                                activeProjectId={activeProjectId}
                                onTaskAdded={onClose} // Close modal after task is added
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TaskFormModal;