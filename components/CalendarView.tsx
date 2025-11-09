import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Task, Project } from '../types';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CalendarViewProps {
    tasks: Task[];
    projects: Project[];
    onUpdateTask: (updatedTask: Task) => void;
    onEditRequest: (task: Task) => void;
}

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, projects, onUpdateTask, onEditRequest }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const dayRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    const { monthDays, month, year } = useMemo(() => {
        const date = new Date(currentDate);
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0=Monday, 6=Sunday

        const days = [];
        // Previous month's days
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            days.push(new Date(year, month, -i));
        }
        // Current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        // Next month's days
        const gridCells = 42; // 6 rows * 7 days
        const remaining = gridCells - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push(new Date(year, month + 1, i));
        }
        return { monthDays: days, month, year };
    }, [currentDate]);
    
    const tasksByDate = useMemo(() => {
        const map = new Map<string, Task[]>();
        tasks.forEach(task => {
            if (task.dueDate) {
                const dateKey = task.dueDate;
                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                map.get(dateKey)!.push(task);
            }
        });
        return map;
    }, [tasks]);

    const projectsById = useMemo(() => {
        const map = new Map<string, Project>();
        projects.forEach(p => map.set(p.id, p));
        return map;
    }, [projects]);

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };
    
    const toISODateString = (date: Date) => date.toISOString().split('T')[0];
    
    const handleDragEnd = useCallback((task: Task, info: any) => {
        const point = info.point;
        let droppedOnDate: string | null = null;

        dayRefs.current.forEach((el, dateStr) => {
            if (el) {
                const rect = el.getBoundingClientRect();
                if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
                    droppedOnDate = dateStr;
                }
            }
        });

        if (droppedOnDate && droppedOnDate !== task.dueDate) {
            onUpdateTask({ ...task, dueDate: droppedOnDate });
        }
    }, [onUpdateTask]);


    return (
        <div className="bg-secondary p-4 md:p-6 rounded-3xl border border-border-color shadow-soft-glow h-[calc(100vh-130px)] flex flex-col">
            <header className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-2xl font-bold text-text-primary capitalize">
                    {new Date(year, month).toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-accent transition-colors"><ChevronLeftIcon className="w-6 h-6" /></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-semibold rounded-lg hover:bg-accent transition-colors">Сегодня</button>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-accent transition-colors"><ChevronRightIcon className="w-6 h-6" /></button>
                </div>
            </header>

            <div className="grid grid-cols-7 gap-1 flex-shrink-0 mb-2">
                {WEEK_DAYS.map(day => (
                    <div key={day} className="text-center text-sm font-bold text-text-secondary py-2">{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-grow overflow-hidden">
                {monthDays.map((day, index) => {
                    const dateStr = toISODateString(day);
                    const isCurrentMonth = day.getMonth() === month;
                    const isToday = toISODateString(new Date()) === dateStr;
                    const dayTasks = tasksByDate.get(dateStr) || [];

                    return (
                        <div
                            key={index}
                            ref={el => { dayRefs.current.set(dateStr, el) }}
                            className={`bg-primary rounded-lg p-2 flex flex-col relative overflow-hidden transition-colors border ${isToday ? 'border-highlight' : 'border-transparent'} ${isCurrentMonth ? '' : 'bg-accent/30'}`}
                        >
                            <span className={`font-semibold mb-2 ${isToday ? 'text-highlight' : isCurrentMonth ? 'text-text-secondary' : 'text-text-secondary/50'}`}>
                                {day.getDate()}
                            </span>
                            <div className="space-y-1.5 overflow-y-auto flex-grow -mr-2 pr-1.5">
                                {dayTasks.map(task => {
                                    const project = task.projectId ? projectsById.get(task.projectId) : null;
                                    return (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            drag
                                            onDragEnd={(event, info) => handleDragEnd(task, info)}
                                            whileDrag={{ scale: 1.1, zIndex: 10, boxShadow: '0 0 15px rgba(0,0,0,0.3)' }}
                                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                            dragElastic={1}
                                            onClick={() => onEditRequest(task)}
                                            className="bg-accent p-1.5 rounded-md cursor-pointer text-xs"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: project?.color || '#9CA3AF' }}></div>
                                                <span className="text-text-primary font-medium truncate">{task.title}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
