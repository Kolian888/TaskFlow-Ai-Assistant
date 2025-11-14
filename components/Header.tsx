import React, { useState, useRef, useEffect } from 'react';
import { PlayerStats, UserProfile, Settings, Hotkeys } from '../types';
import Gamification from './Gamification';
import { TrophyIcon, ChartBarIcon, KanbanIcon, DocumentDuplicateIcon, SparklesIcon, CrystalIcon, FolderOpenIcon, ArrowPathIcon, LayersIcon, MenuIcon, ClockIcon, HomeIcon, ChevronDownIcon, WrenchScrewdriverIcon, MindMapIcon, MicrophoneIcon, Cog6ToothIcon, MagnifyingGlassIcon, CalendarDaysIcon, TargetIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
    stats: PlayerStats;
    activeView: 'dashboard' | 'kanban' | 'stats' | 'achievements' | 'notes' | 'quests' | 'library' | 'habits' | 'para' | 'pomodoro' | 'mindmap' | 'knowledge' | 'graph' | 'calendar' | 'goals';
    onViewChange: (view: 'dashboard' | 'kanban' | 'stats' | 'achievements' | 'notes' | 'quests' | 'library' | 'habits' | 'para' | 'pomodoro' | 'mindmap' | 'knowledge' | 'graph' | 'calendar' | 'goals') => void;
    onOpenStore: () => void;
    onOpenSettings: () => void;
    onOpenSearch: () => void;
    settings: Settings;
    isPomodoroActive: boolean;
    pomodoroTimeRemaining: number;
}

const Header: React.FC<HeaderProps> = ({ stats, activeView, onViewChange, onOpenStore, onOpenSettings, onOpenSearch, settings, isPomodoroActive, pomodoroTimeRemaining }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const toolsMenuRef = useRef<HTMLDivElement>(null);

    const mainNavItems = [
        { id: 'dashboard', label: 'Главная', icon: HomeIcon },
    ];
    const toolNavItems = [
        { id: 'kanban', label: 'Канбан', icon: KanbanIcon },
        { id: 'calendar', label: 'Календарь', icon: CalendarDaysIcon },
        { id: 'para', label: 'PARA', icon: LayersIcon },
        { id: 'habits', label: 'Привычки', icon: ArrowPathIcon },
        { id: 'goals', label: 'Цели', icon: TargetIcon },
        { id: 'mindmap', label: 'Карты разума', icon: MindMapIcon },
        { id: 'knowledge', label: 'Мир Идей', icon: DocumentDuplicateIcon },
        { id: 'graph', label: 'Звёздное Небо', icon: SparklesIcon },
    ];
    const otherNavItems = [
        { id: 'notes', label: 'Заметки', icon: DocumentDuplicateIcon },
        { id: 'library', label: 'Библиотека', icon: FolderOpenIcon },
        { id: 'stats', label: 'Статистика', icon: ChartBarIcon },
        { id: 'achievements', label: 'Питомец', icon: TrophyIcon },
        { id: 'quests', label: 'Квесты', icon: SparklesIcon },
    ];
    
    const mobileMenuItems: ({id: string, label: string, icon: React.FC<any>, action?: () => void})[] = [
        { id: 'dashboard', label: 'Главная', icon: HomeIcon },
        { id: 'kanban', label: 'Канбан', icon: KanbanIcon },
        { id: 'store', label: 'Магазин', icon: CrystalIcon, action: onOpenStore },
        { id: 'settings', label: 'Настройки', icon: Cog6ToothIcon, action: onOpenSettings },
        { id: 'pomodoro', label: 'Помодоро', icon: ClockIcon },
        { id: 'para', label: 'PARA', icon: LayersIcon },
        { id: 'library', label: 'Библиотека', icon: FolderOpenIcon },
        { id: 'stats', label: 'Статистика', icon: ChartBarIcon },
        { id: 'quests', label: 'Квесты', icon: SparklesIcon },
    ];
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
                setIsToolsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getHotkeyForAction = (action: keyof Hotkeys | string) => {
        if (!settings.showHotkeyTooltips) return undefined;

        const actionToHotkeyKey: Record<string, keyof Hotkeys> = {
            dashboard: 'viewDashboard',
            kanban: 'viewKanban',
            calendar: 'viewCalendar',
            para: 'viewPara',
            habits: 'viewHabits',
            goals: 'viewGoals',
            mindmap: 'viewMindMap',
            knowledge: 'viewKnowledge',
            graph: 'viewGraph',
            notes: 'viewNotes',
            library: 'viewLibrary',
            stats: 'viewStats',
            achievements: 'viewAchievements',
            quests: 'viewQuests',
            settings: 'toggleSettings',
            search: 'toggleSearch',
        };

        const hotkeyKey = actionToHotkeyKey[action];
        const hotkey = hotkeyKey ? settings.hotkeys[hotkeyKey as keyof Hotkeys] : undefined;
        return hotkey ? hotkey.replace(/\+/g, ' + ').toUpperCase() : undefined;
    };

    const isToolActive = toolNavItems.some(item => item.id === activeView);
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <header className="sticky top-0 z-30 bg-secondary/80 backdrop-blur-xl border-b border-border-color px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
                <svg className="w-auto h-9" viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop stopColor="#67C3FF" />
                            <stop offset="1" stopColor="#C48CFF" />
                        </linearGradient>
                        <filter id="logo-glow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="1.5" />
                        </filter>
                    </defs>
                    <text x="0" y="24.5" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="bold" fill="#4E95F2">TaskFlow</text>
                    <g transform="translate(100, 1.5)" filter="url(#logo-glow)">
                        <path d="M20,15 C30,15 30,0 20,0 C10,0 10,15 20,15 M20,15 C10,15 10,30 20,30 C30,30 30,15 20,15" stroke="url(#logo-gradient)" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.9"/>
                    </g>
                    <text x="114" y="31" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="600" fill="#808A9A">AI</text>
                </svg>
            </div>
            <nav className="hidden lg:flex items-center gap-2 p-1 bg-secondary rounded-full border border-border-color shadow-inner-soft">
                 {mainNavItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => onViewChange(item.id as any)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-primary group ${
                            activeView === item.id 
                                ? 'text-text-primary'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {activeView === item.id && (
                            <div className="absolute inset-0 bg-neon-purple/10 rounded-full border border-neon-purple/30"></div>
                        )}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                        <item.icon className={`w-5 h-5 z-10 transition-colors ${activeView === item.id ? 'text-neon-purple' : ''}`} />
                        <span className="z-10">{item.label}</span>
                        {settings.showHotkeyTooltips && getHotkeyForAction(item.id) && (
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-secondary text-text-primary text-xs px-2 py-1 rounded-md border border-border-color shadow-lg z-50">
                                {getHotkeyForAction(item.id)}
                            </span>
                        )}
                    </button>
                ))}

                <div className="relative" ref={toolsMenuRef}>
                    <button
                        onClick={() => setIsToolsMenuOpen(p => !p)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-primary group ${
                            isToolActive
                                ? 'text-text-primary'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {isToolActive && (
                             <div className="absolute inset-0 bg-neon-purple/10 rounded-full border border-neon-purple/30"></div>
                        )}
                         <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                        <WrenchScrewdriverIcon className={`w-5 h-5 z-10 transition-colors ${isToolActive ? 'text-neon-purple' : ''}`} />
                        <span className="z-10">Инструменты</span>
                        <ChevronDownIcon className={`w-4 h-4 z-10 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {isToolsMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full mt-2 w-48 bg-secondary border border-border-color rounded-xl shadow-lg p-2 z-50"
                            >
                                {toolNavItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onViewChange(item.id as any);
                                            setIsToolsMenuOpen(false);
                                        }}
                                        className={`group relative w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                                            activeView === item.id ? 'bg-accent text-text-primary' : 'text-text-primary hover:bg-accent'
                                        }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-highlight' : 'text-text-secondary'}`} />
                                        {item.label}
                                        {settings.showHotkeyTooltips && getHotkeyForAction(item.id) && (
                                            <span className="absolute left-full ml-2 hidden group-hover:block whitespace-nowrap bg-secondary text-text-primary text-xs px-2 py-1 rounded-md border border-border-color shadow-lg z-50">
                                                {getHotkeyForAction(item.id)}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                 {otherNavItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => onViewChange(item.id as any)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-primary group ${
                            activeView === item.id 
                                ? 'text-text-primary'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {activeView === item.id && (
                            <div className="absolute inset-0 bg-neon-purple/10 rounded-full border border-neon-purple/30"></div>
                        )}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                        <item.icon className={`w-5 h-5 z-10 transition-colors ${activeView === item.id ? 'text-neon-purple' : ''}`} />
                        <span className="z-10">{item.label}</span>
                         {settings.showHotkeyTooltips && getHotkeyForAction(item.id) && (
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-secondary text-text-primary text-xs px-2 py-1 rounded-md border border-border-color shadow-lg z-50">
                                {getHotkeyForAction(item.id)}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
            <div className="flex items-center gap-2 md:gap-4">
                <AnimatePresence>
                    {isPomodoroActive && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.3 }}
                            className="hidden md:flex items-center gap-2 bg-accent border border-border-color text-sm font-semibold text-text-primary rounded-xl px-3 py-2 overflow-hidden"
                        >
                            <ClockIcon className="w-5 h-5 text-highlight animate-pulse" />
                            <span className="font-mono">{formatTime(pomodoroTimeRemaining)}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button onClick={() => onViewChange('achievements')} className="p-0 rounded-full focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
                  <Gamification stats={stats} />
                </button>
                <button 
                    onClick={onOpenStore} 
                    className="hidden md:flex p-2 md:px-4 md:py-2 bg-accent border border-border-color text-sm font-semibold text-text-primary rounded-xl hover:bg-white/10 transition-colors items-center gap-2"
                >
                    <CrystalIcon className="w-5 h-5 text-neon-blue" />
                    <span className="hidden md:inline">Магазин</span>
                </button>
                <button 
                    onClick={onOpenSearch}
                    className="group relative hidden md:flex p-2.5 bg-accent border border-border-color text-text-primary rounded-xl hover:bg-white/10 transition-colors"
                >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    {settings.showHotkeyTooltips && getHotkeyForAction('search') && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-secondary text-text-primary text-xs px-2 py-1 rounded-md border border-border-color shadow-lg z-50">
                            {getHotkeyForAction('search')}
                        </span>
                    )}
                </button>
                <button 
                    onClick={onOpenSettings} 
                    className="group relative hidden md:flex p-2.5 bg-accent border border-border-color text-text-primary rounded-xl hover:bg-white/10 transition-colors"
                >
                    <Cog6ToothIcon className="w-5 h-5" />
                     {settings.showHotkeyTooltips && getHotkeyForAction('settings') && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-secondary text-text-primary text-xs px-2 py-1 rounded-md border border-border-color shadow-lg z-50">
                            {getHotkeyForAction('settings')}
                        </span>
                    )}
                </button>
                {/* Google Auth removed */}
                 <div className="relative lg:hidden" ref={menuRef}>
                    <button onClick={() => setIsMobileMenuOpen(prev => !prev)} className="p-2 bg-accent border border-border-color rounded-xl text-text-primary">
                        <MenuIcon className="w-5 h-5" />
                    </button>
                    {isMobileMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-secondary border border-border-color rounded-xl shadow-lg p-2 z-50">
                            <ul>
                                {mobileMenuItems.map(item => (
                                     <li key={item.id}>
                                        <button 
                                            onClick={() => {
                                                if(item.action) item.action();
                                                else onViewChange(item.id as any);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-text-primary hover:bg-accent rounded-md transition-colors"
                                        >
                                            <item.icon className="w-5 h-5 text-text-secondary"/>
                                            {item.label}
                                        </button>
                                     </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;