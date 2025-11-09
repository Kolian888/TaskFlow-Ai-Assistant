

import React, { useState, useEffect } from 'react';
import { Board } from '../types';
import { XIcon } from './Icons';

interface BoardEditModalProps {
    isOpen: boolean;
    board: Board | null;
    onClose: () => void;
    onSave: (name: string, boardId?: string) => void;
}

const BoardEditModal: React.FC<BoardEditModalProps> = ({ isOpen, board, onClose, onSave }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (board) {
            setName(board.name);
        } else {
            setName('');
        }
    }, [board, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim(), board?.id);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-secondary p-4 md:p-6 rounded-3xl shadow-soft-glow max-w-sm w-full border border-border-color"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-text-primary mb-6">{board ? 'Редактировать доску' : 'Новая доска'}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Название доски"
                        className="w-full bg-accent border border-border-color rounded-xl p-3 text-lg focus:outline-none focus:ring-2 focus:ring-highlight"
                        autoFocus
                        required
                    />
                    <div className="flex justify-end gap-4 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl bg-accent border border-border-color text-text-primary hover:bg-white/10 transition-colors font-semibold"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-highlight text-primary font-semibold hover:opacity-90 transition-opacity"
                        >
                            {board ? 'Сохранить' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BoardEditModal;