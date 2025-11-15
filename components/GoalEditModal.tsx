
import React, { useState, useEffect } from 'react';
import { Goal } from '../types';

interface GoalEditModalProps {
    isOpen: boolean;
    goal: Goal | 'new' | null;
    onClose: () => void;
    onSave: (name: string, description: string, targetDate: string, goalId?: string) => void;
}

const GoalEditModal: React.FC<GoalEditModalProps> = ({ isOpen, goal, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [targetDate, setTargetDate] = useState('');

    useEffect(() => {
        if (goal && goal !== 'new') {
            setName(goal.name);
            setDescription(goal.description || '');
            setTargetDate(goal.targetDate || '');
        } else {
            setName('');
            setDescription('');
            setTargetDate('');
        }
    }, [goal, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim(), description.trim(), targetDate, (goal && goal !== 'new') ? goal.id : undefined);
            onClose();
        }
    };
    
    const inputClasses = "w-full bg-accent border border-border-color rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-highlight";

    return (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-secondary p-6 rounded-3xl shadow-soft-glow w-full max-w-lg border border-border-color" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-text-primary mb-6">{goal === 'new' ? 'Новая цель' : 'Редактировать цель'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Название цели" className={inputClasses} autoFocus required />
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание (необязательно)" rows={4} className={inputClasses} />
                    <div>
                        <label htmlFor="targetDate" className="text-xs text-text-secondary mb-1 block">Целевая дата (необязательно)</label>
                        <input id="targetDate" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className={inputClasses} />
                    </div>
                     <div className="flex justify-end gap-4 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-accent rounded-lg font-semibold">Отмена</button>
                        <button type="submit" className="px-4 py-2 bg-highlight text-primary font-semibold rounded-lg">{goal === 'new' ? 'Создать' : 'Сохранить'}</button>
                     </div>
                </form>
            </div>
        </div>
    );
};

export default GoalEditModal;
