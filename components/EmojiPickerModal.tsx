import React from 'react';
import { XIcon } from './Icons';

interface EmojiPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectEmoji: (emoji: string) => void;
}

const EMOJIS = [
    '💡', '📁', '📝', '✅', '🚀', '🎯', '📅', '⏳', '💪', '🧠', '🎉', '🔥',
    '✨', '💼', '🏠', '📞', '📧', '🛒', '🎁', '💡', '💬', '❓', '❗', '💰',
    '💻', '📱', '📈', '📊', '📌', '📎', '🧑‍💻', '🧑‍🏫', '🧑‍🎨', '🧑‍🚀', '🌍', '📚'
];

const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({ isOpen, onClose, onSelectEmoji }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-[60] p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-secondary p-6 rounded-3xl shadow-soft-glow max-w-xs w-full border border-border-color"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-text-primary">Выберите смайлик</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-accent">
                        <XIcon className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>
                <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                    {EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => onSelectEmoji(emoji)}
                            className="text-3xl p-2 rounded-lg hover:bg-accent transition-colors duration-150"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmojiPickerModal;