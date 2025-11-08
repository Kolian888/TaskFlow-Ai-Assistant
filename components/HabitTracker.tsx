import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { motion } from 'framer-motion';
import { PlusIcon, ArrowPathIcon, CheckIcon, PencilIcon, TrashIcon, XIcon, EmojiHappyIcon } from './Icons';
import EmojiPickerModal from './EmojiPickerModal';

interface HabitTrackerProps {
    habits: Habit[];
    onAddHabit: (habitData: Omit<Habit, 'id' | 'createdAt' | 'archived' | 'streak' | 'completions'>) => void;
    onUpdateHabit: (habit: Habit) => void;
    onCheckIn: (habitId: string, date: string) => void;
}

const HabitTracker: React.FC<HabitTrackerProps> = ({ habits, onAddHabit, onUpdateHabit, onCheckIn }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1

    const activeHabits = useMemo(() => {
        return habits.filter(h => !h.archived).sort((a,b) => a.name.localeCompare(b.name));
    }, [habits]);

    const isHabitForToday = (habit: Habit) => {
        if (habit.frequency === 'daily') return true;
        if (habit.frequency.type === 'weekly') {
            return habit.frequency.days.includes(dayOfWeek);
        }
        // 'times_per_week' is more complex to check for "today" without more context,
        // so we'll show them and let the user decide.
        return true;
    };
    
    const todaysHabits = activeHabits.filter(isHabitForToday);

    const handleEdit = (habit: Habit) => {
        setEditingHabit(habit);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setEditingHabit(null);
        setIsFormOpen(false);
    }
    
    return (
        <div className="bg-secondary p-8 rounded-3xl border border-border-color shadow-soft-glow space-y-8">
             <header className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <ArrowPathIcon className="w-8 h-8 text-brand-green" />
                    <h2 className="text-3xl font-bold text-text-primary">Трекер Привычек</h2>
                </div>
                 <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-highlight text-primary font-bold rounded-xl hover:opacity-90 transition-opacity">
                    <PlusIcon className="w-5 h-5"/>
                    Новая привычка
                </button>
            </header>
            
            <Heatmap habits={activeHabits} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todaysHabits.map(habit => (
                    <HabitCard 
                        key={habit.id} 
                        habit={habit} 
                        todayStr={todayStr} 
                        onCheckIn={onCheckIn} 
                        onEdit={handleEdit}
                    />
                ))}
            </div>

            {isFormOpen && (
                <HabitFormModal 
                    habit={editingHabit}
                    onClose={handleCloseForm}
                    onAddHabit={onAddHabit}
                    onUpdateHabit={onUpdateHabit}
                />
            )}
        </div>
    );
};

const HabitCard: React.FC<{ habit: Habit; todayStr: string; onCheckIn: (id: string, date: string) => void; onEdit: (habit: Habit) => void; }> = ({ habit, todayStr, onCheckIn, onEdit }) => {
    const isCompleted = habit.completions[todayStr];

    return (
        <div className="bg-primary p-4 rounded-2xl border border-border-color shadow-inner-soft flex items-center gap-4">
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onCheckIn(habit.id, todayStr)}
                className={`w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-2xl transition-all duration-300 border-2
                    ${isCompleted ? 'bg-brand-green/80 border-brand-green' : 'bg-accent border-border-color hover:border-highlight'}`}
            >
                {isCompleted ? <motion.div initial={{scale: 0}} animate={{scale: 1}}><CheckIcon className="w-8 h-8 text-white"/></motion.div> : habit.icon}
            </motion.button>
            <div className="flex-grow min-w-0">
                <h3 className="font-bold text-text-primary truncate">{habit.name}</h3>
                <p className="text-sm text-text-secondary">Серия: <span className="font-bold text-brand-yellow">{habit.streak.current} {habit.streak.current === 1 ? 'день' : (habit.streak.current > 1 && habit.streak.current < 5) ? 'дня' : 'дней'}</span></p>
            </div>
            <button onClick={() => onEdit(habit)} className="p-2 text-text-secondary hover:text-white"><PencilIcon className="w-5 h-5"/></button>
        </div>
    );
};

const Heatmap: React.FC<{ habits: Habit[] }> = ({ habits }) => {
    const data = useMemo(() => {
        const dateMap = new Map<string, number>();
        const totalActiveHabits = habits.length;
        if (totalActiveHabits === 0) return { dates: new Map<string, number>(), max: 0 };

        habits.forEach(habit => {
            Object.keys(habit.completions).forEach(dateStr => {
                dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
            });
        });

        const maxCompletions = Math.max(...dateMap.values(), 1);
        
        return { dates: dateMap, max: maxCompletions };
    }, [habits]);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 120); // ~4 months

    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    return (
        <div className="bg-primary p-4 rounded-xl border border-border-color">
            <h3 className="text-lg font-bold text-text-secondary mb-3">Ваша активность</h3>
            <div className="flex flex-wrap-reverse gap-1 justify-end">
                {days.map(d => {
                    const dateStr = d.toISOString().split('T')[0];
                    const count = data.dates.get(dateStr) || 0;
                    const opacity = count > 0 ? 0.2 + (count / data.max) * 0.8 : 0.05;
                    
                    return (
                        <div key={dateStr} title={`${dateStr}: ${count} выполнено`}
                            className="w-3.5 h-3.5 rounded-sm bg-brand-green"
                            style={{ opacity }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const HabitFormModal: React.FC<{ habit: Habit | null; onClose: () => void; onAddHabit: Function; onUpdateHabit: Function; }> = ({ habit, onClose, onAddHabit, onUpdateHabit }) => {
    const [name, setName] = useState(habit?.name || '');
    const [icon, setIcon] = useState(habit?.icon || '💪');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [frequency, setFrequency] = useState(habit?.frequency || 'daily');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            const habitData = { name: name.trim(), icon, type: 'positive' as const, frequency };
            if (habit) {
                onUpdateHabit({ ...habit, ...habitData });
            } else {
                onAddHabit(habitData);
            }
            onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-secondary p-6 rounded-3xl shadow-soft-glow w-full max-w-md border border-border-color" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-text-primary mb-6">{habit ? 'Редактировать привычку' : 'Новая привычка'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setIsEmojiPickerOpen(true)} className="w-14 h-14 bg-accent border border-border-color rounded-xl text-3xl">{icon}</button>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Название (напр., Утренняя зарядка)" required className="w-full bg-accent border border-border-color rounded-xl p-3 h-14"/>
                     </div>
                     {/* More options like frequency could be added here */}
                     <div className="flex justify-end gap-4 pt-4 border-t border-border-color">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-accent rounded-lg">Отмена</button>
                        <button type="submit" className="px-4 py-2 bg-highlight text-primary font-semibold rounded-lg">{habit ? 'Сохранить' : 'Создать'}</button>
                     </div>
                </form>
            </div>
             <EmojiPickerModal isOpen={isEmojiPickerOpen} onClose={() => setIsEmojiPickerOpen(false)} onSelectEmoji={emoji => {setIcon(emoji); setIsEmojiPickerOpen(false)}} />
        </div>
    );
};


export default HabitTracker;
