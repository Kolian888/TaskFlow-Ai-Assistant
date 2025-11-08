import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, FolderOpenIcon, LayersIcon } from './Icons';

interface QuickAddMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTaskClick: () => void;
    onAddNoteClick: () => void;
    onAddProjectClick: () => void;
    onAddBoardClick: () => void;
}

const QuickAddMenu: React.FC<QuickAddMenuProps> = ({ isOpen, onClose, onAddTaskClick, onAddNoteClick, onAddProjectClick, onAddBoardClick }) => {
    const menuItems = [
        { label: 'Новая задача', icon: PlusIcon, action: onAddTaskClick, color: 'text-highlight' },
        { label: 'Быстрая заметка', icon: PencilIcon, action: onAddNoteClick, color: 'text-neon-purple' },
        { label: 'Новый проект', icon: FolderOpenIcon, action: onAddProjectClick, color: 'text-brand-yellow' },
        { label: 'Новая доска', icon: LayersIcon, action: onAddBoardClick, color: 'text-brand-green' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-end z-50 p-4 lg:hidden"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "100%" }}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                        className="bg-secondary p-6 rounded-3xl w-full max-w-md border border-border-color"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-center text-lg font-semibold text-text-secondary mb-6">Что вы хотите создать?</h3>
                        <div className="grid grid-cols-2 gap-4">
                             {menuItems.map(item => (
                                <button 
                                    key={item.label}
                                    onClick={item.action} 
                                    className="flex flex-col items-center justify-center gap-3 p-4 bg-accent rounded-2xl hover:bg-white/5 transition-colors h-32 group"
                                >
                                    <item.icon className={`w-8 h-8 ${item.color} transition-transform group-hover:scale-110`} />
                                    <span className="font-bold text-text-primary">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuickAddMenu;
