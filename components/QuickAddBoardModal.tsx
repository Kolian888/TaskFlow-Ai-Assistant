import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './Icons';

interface QuickAddBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddBoard: (name: string) => void;
}

const QuickAddBoardModal: React.FC<QuickAddBoardModalProps> = ({ isOpen, onClose, onAddBoard }) => {
    const [name, setName] = useState('');

    const handleSubmit = () => {
        if (name.trim()) {
            onAddBoard(name.trim());
            setName(''); // Clear after submitting
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="bg-secondary p-6 rounded-3xl shadow-soft-glow w-full max-w-lg border border-border-color"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-xl font-bold text-text-primary">Новая доска (Сфера)</h2>
                             <button onClick={onClose} className="p-2 rounded-full hover:bg-accent">
                                 <XIcon className="w-5 h-5 text-text-secondary"/>
                             </button>
                        </div>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Название (напр., Здоровье, Финансы)"
                            className="w-full bg-accent backdrop-blur-xl border border-border-color shadow-inner-soft rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-highlight transition-colors focus:border-highlight text-sm"
                            autoFocus
                        />
                        <button 
                            onClick={handleSubmit} 
                            disabled={!name.trim()}
                            className="w-full mt-4 bg-highlight text-primary font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:bg-gray-500 disabled:cursor-not-allowed text-base active:scale-95"
                        >
                            Создать доску
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuickAddBoardModal;