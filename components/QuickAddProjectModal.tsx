import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, EmojiHappyIcon } from './Icons';
import EmojiPickerModal from './EmojiPickerModal';
import { Board } from '../types';

interface QuickAddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddProject: (name: string, emoji: string, boardId: string) => void;
    boards: Board[];
}

const QuickAddProjectModal: React.FC<QuickAddProjectModalProps> = ({ isOpen, onClose, onAddProject, boards }) => {
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('💡');
    const [boardId, setBoardId] = useState<string>(boards[0]?.id || '');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    const handleSubmit = () => {
        if (name.trim() && boardId) {
            onAddProject(name.trim(), emoji, boardId);
            // Reset state
            setName('');
            setEmoji('💡');
        }
    };

    const inputClasses = "w-full bg-accent backdrop-blur-xl border border-border-color shadow-inner-soft rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-highlight transition-colors focus:border-highlight";

    return (
        <>
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
                                <h2 className="text-xl font-bold text-text-primary">Новый проект</h2>
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-accent">
                                    <XIcon className="w-5 h-5 text-text-secondary"/>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="board-select" className="block text-xs font-medium text-text-secondary mb-1.5 pl-1">Доска (Сфера)</label>
                                    <select
                                        id="board-select"
                                        value={boardId}
                                        onChange={(e) => setBoardId(e.target.value)}
                                        className={`${inputClasses} appearance-none`}
                                        required
                                    >
                                        <option value="" disabled>-- Выберите доску --</option>
                                        {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <label htmlFor="projectEmoji" className="block text-xs font-medium text-text-secondary mb-1.5 pl-1">Смайлик</label>
                                        <input id="projectEmoji" type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="💡" maxLength={2} className={`${inputClasses} text-center text-xl h-14 w-20`} />
                                        <button type="button" onClick={() => setIsEmojiPickerOpen(true)} className="absolute right-1.5 bottom-1.5 p-1 rounded-full bg-secondary/50 hover:bg-accent">
                                            <EmojiHappyIcon className="w-5 h-5 text-text-secondary"/>
                                        </button>
                                    </div>
                                    <div className="flex-grow">
                                        <label htmlFor="projectName" className="block text-xs font-medium text-text-secondary mb-1.5 pl-1">Название проекта</label>
                                        <input id="projectName" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название..." required className={`${inputClasses} h-14`} />
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={handleSubmit} 
                                disabled={!name.trim() || !boardId}
                                className="w-full mt-6 bg-highlight text-primary font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:bg-gray-500 disabled:cursor-not-allowed text-base active:scale-95"
                            >
                                Создать проект
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <EmojiPickerModal
                isOpen={isEmojiPickerOpen}
                onClose={() => setIsEmojiPickerOpen(false)}
                onSelectEmoji={(emoji) => {
                    setEmoji(emoji);
                    setIsEmojiPickerOpen(false);
                }}
            />
        </>
    );
};

export default QuickAddProjectModal;