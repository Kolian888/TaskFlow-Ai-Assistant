import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Project, Task, PlayerStats, TaskPriority, Subtask, Quest, Attachment, AttachmentType, CharacterType, Note, NoteFolder, Rank, Board, Habit, UserProfile, MindMap, MindMapNode, Settings, Hotkeys } from './types';
import Header from './components/Header';
import ProjectManager from './components/ProjectManager';
import KanbanBoard from './components/KanbanBoard';
import PomodoroTimer from './components/PomodoroTimer';
import TaskForm from './components/TaskForm';
import KanbanFilters from './components/KanbanFilters';
import ConfirmationModal from './components/ConfirmationModal';
import ProjectEditModal from './components/ProjectEditModal';
import TaskEditModal from './components/TaskEditModal';
import { generateDailyQuests } from './quest-data';
import DailyQuests from './components/DailyQuests';
import Notifications from './components/Notifications';
import AIAssistant from './components/AIAssistant';
import Statistics from './components/Statistics';
import Achievements from './components/Achievements';
import FileLibrary from './components/FileLibrary';
import FocusPet from './components/FocusPet';
import CharacterSelectionModal from './components/CharacterSelectionModal';
import { StoreModal } from './components/StoreModal';
import { PET_CUSTOMIZATIONS } from './pet-data';
import Notes from './components/Notes';
import NotesView from './components/NotesView';
import NoteEditModal from './components/NoteEditModal';
import QuestsView from './components/QuestsView';
import { RANKS } from './ranks';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import CharacterSwitchModal from './components/CharacterSwitchModal';
import { PencilIcon, PlusIcon, TrashIcon, KanbanIcon, LayersIcon, ArrowPathIcon, DocumentDuplicateIcon, FolderOpenIcon, ChartBarIcon, TrophyIcon, SparklesIcon, HeartIcon, HomeIcon, MicrophoneIcon, MenuIcon, CalendarDaysIcon, MindMapIcon } from './components/Icons';
import HabitTracker from './components/HabitTracker';
import BoardEditModal from './components/BoardEditModal';
import ParaView from './components/ParaView';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import SidebarWidget from './components/SidebarWidget';
import TaskFormModal from './components/TaskFormModal';
import QuickAddMenu from './components/QuickAddMenu';
import QuickAddNoteModal from './components/QuickAddNoteModal';
import QuickAddProjectModal from './components/QuickAddProjectModal';
import QuickAddBoardModal from './components/QuickAddBoardModal';
import DashboardView from './components/DashboardView';
import MindMapView from './components/MindMapView';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import GraphView from './components/GraphView';
import SettingsModal from './components/SettingsModal';
import GlobalSearchModal from './components/GlobalSearchModal';
import CalendarView from './components/CalendarView';

const APP_DATA_KEY = 'taskflow_app_data_v1';

// FIX: Define a type for sidebar widget keys to prevent 'unknown' index type error.
type SidebarWidgetKey = 'projects' | 'form' | 'pet' | 'quests' | 'notes' | 'pomodoro' | 'notifications';

const MobileMenu: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onViewChange: (view: any) => void;
}> = ({ isOpen, onClose, onViewChange }) => {
    const menuItems = [
        { id: 'habits', label: 'Привычки', icon: ArrowPathIcon },
        { id: 'achievements', label: 'Питомец', icon: HeartIcon },
        { id: 'calendar', label: 'Календарь', icon: CalendarDaysIcon },
        { id: 'mindmap', label: 'Карты разума', icon: MindMapIcon },
        { id: 'graph', label: 'Звёздное Небо', icon: SparklesIcon },
        { id: 'para', label: 'PARA', icon: LayersIcon },
        { id: 'stats', label: 'Статистика', icon: ChartBarIcon },
        { id: 'quests', label: 'Квесты', icon: TrophyIcon },
        { id: 'library', label: 'Библиотека', icon: FolderOpenIcon },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-primary/80 backdrop-blur-xl z-50 flex flex-col p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                        className="bg-secondary p-6 rounded-3xl w-full max-w-md mx-auto mt-auto border border-border-color"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-center text-lg font-semibold text-text-secondary mb-6">Меню</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {menuItems.map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => onViewChange(item.id)}
                                    className="flex flex-col items-center justify-center gap-2 p-2 bg-accent rounded-2xl hover:bg-white/5 transition-colors h-24 group"
                                >
                                    <item.icon className="w-8 h-8 text-text-secondary group-hover:text-highlight transition-colors" />
                                    <span className="font-semibold text-text-primary text-xs text-center">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [boards, setBoards] = useState<Board[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [noteFolders, setNoteFolders] = useState<NoteFolder[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
    const [playerStats, setPlayerStats] = useState<PlayerStats>({ level: 1, xp: 0, xpToNextLevel: 100, focusCrystals: 0, rank: RANKS[0], characterType: 'spark', characterName: '', petStats: { hunger: 100, happiness: 100, cleanliness: 100, energy: 100, isSleeping: false }, petCustomization: { color: 'spark_default' }, unlockedPetColors: ['spark_default', 'cat_default', 'dog_default'], unlockedCharacterTypes: [] });
    const [pomodoroSettings, setPomodoroSettings] = useState({ workMinutes: 25, breakMinutes: 5 });
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [activePomodoroTask, setActivePomodoroTask] = useState<Task | null>(null);
    const [isPomodoroActive, setIsPomodoroActive] = useState(false);
    const [pomodoroTimeRemaining, setPomodoroTimeRemaining] = useState(pomodoroSettings.workMinutes * 60);
    const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
    const [projectFilter, setProjectFilter] = useState<'all' | string>('all');
    const [tagFilter, setTagFilter] = useState<'all' | string>('all');
    const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
    type ActiveView = 'dashboard' | 'kanban' | 'stats' | 'achievements' | 'library' | 'notes' | 'quests' | 'habits' | 'para' | 'pomodoro' | 'mindmap' | 'knowledge' | 'graph' | 'calendar';
    const [activeView, setActiveView] = useState<ActiveView>('dashboard');
    
    const [itemToDelete, setItemToDelete] = useState<{ type: 'task' | 'project' | 'board', id: string, name: string } | null>(null);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
    const [boardToEdit, setBoardToEdit] = useState<Board | 'new' | null>(null);
    
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());
    const [isCharacterSelectionOpen, setIsCharacterSelectionOpen] = useState(false);
    const [isCharacterSwitchOpen, setIsCharacterSwitchOpen] = useState(false);
    const [isStoreOpen, setIsStoreOpen] = useState(false);
    const [lastPetTime, setLastPetTime] = useState(0);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [isTaskFormModalOpen, setIsTaskFormModalOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
    const [isQuickProjectOpen, setIsQuickProjectOpen] = useState(false);
    const [isQuickBoardOpen, setIsQuickBoardOpen] = useState(false);
    const [isMobileNavMenuOpen, setIsMobileNavMenuOpen] = useState(false);
    
    const [activeMindMapId, setActiveMindMapId] = useState<string | null>(null);
    const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);

    const [activeKnowledgeNoteId, setActiveKnowledgeNoteId] = useState<string | null>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [aiContext, setAiContext] = useState<any>(null);
    
    const [settings, setSettings] = useState<Settings>(() => {
        const defaultSettings: Settings = {
            hotkeys: {
                viewDashboard: 'h',
                viewKanban: 'b',
                viewStats: 's',
                viewAchievements: 'p',
                viewLibrary: 'l',
                viewNotes: 'alt+n',
                viewQuests: 'q',
                viewHabits: 'r',
                viewPara: 'a',
                viewMindMap: 'm',
                viewKnowledge: 'k',
                viewGraph: 'g',
                viewCalendar: 'v',
                quickAddTask: 'c',
                quickAddNote: 'n',
                quickAddProject: 'shift+p',
                quickAddBoard: 'shift+b',
                toggleAI: 'o',
                toggleSettings: ',',
                toggleQuickAdd: '=',
                formatToMarkdown: 'ctrl+m',
                toggleSearch: 'ctrl+k',
            },
            enableTts: false,
            selectedVoiceURI: null,
            showHotkeyTooltips: true,
            theme: 'dark_default',
        };
        try {
            const saved = localStorage.getItem('taskflow_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ...defaultSettings,
                    ...parsed,
                    hotkeys: { ...defaultSettings.hotkeys, ...(parsed.hotkeys || {}) }
                };
            }
            return defaultSettings;
        } catch (e) {
            return defaultSettings;
        }
    });

    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    
    const initialSidebarOrder = useMemo((): SidebarWidgetKey[] => ['projects', 'form', 'pet', 'quests', 'notes', 'pomodoro', 'notifications'], []);
    const [sidebarOrder, setSidebarOrder] = useState<SidebarWidgetKey[]>(initialSidebarOrder);

    const [isListening, setIsListening] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);
    }, [settings.theme]);
    
    useEffect(() => {
        if (!isPomodoroActive) {
            setPomodoroTimeRemaining(pomodoroSettings.workMinutes * 60);
        }
    }, [pomodoroSettings, isPomodoroActive]);
    
    // Load data from localStorage on initial render
    useEffect(() => {
      try {
        const savedData = localStorage.getItem(APP_DATA_KEY);
        if (savedData) {
          const data = JSON.parse(savedData);
          setProjects(data.projects || []);
          setTasks(data.tasks || []);
          setBoards(data.boards || [{ id: '1', name: 'Работа', columns: ['Бэклог', 'В процессе', 'Готово'], color: '#4E95F2' }, { id: '2', name: 'Личное', columns: ['Планы', 'В процессе', 'Сделано'], color: '#A371F7' }]);
          setAttachments(data.attachments || []);
          setNotes(data.notes || []);
          setNoteFolders(data.noteFolders || []);
          setHabits(data.habits || []);
          setMindMaps(data.mindMaps || []);
          setPlayerStats(data.playerStats || { level: 1, xp: 0, xpToNextLevel: 100, focusCrystals: 0, rank: RANKS[0], characterType: 'spark', characterName: '', petStats: { hunger: 100, happiness: 100, cleanliness: 100, energy: 100, isSleeping: false }, petCustomization: { color: 'spark_default' }, unlockedPetColors: ['spark_default', 'cat_default', 'dog_default'], unlockedCharacterTypes: [] });
          setPomodoroSettings(data.pomodoroSettings || { workMinutes: 25, breakMinutes: 5 });
          setActiveBoardId(data.activeBoardId || null);
          setNotifiedTaskIds(new Set(data.notifiedTaskIds || []));
          setSidebarOrder(data.sidebarOrder || initialSidebarOrder);
        } else {
             setBoards([
                { id: '1', name: 'Работа', columns: ['Бэклог', 'В процессе', 'Готово'], color: '#4E95F2' },
                { id: '2', name: 'Личное', columns: ['Планы', 'В процессе', 'Сделано'], color: '#A371F7' },
            ]);
        }
      } catch (e) {
        console.error("Failed to load data from localStorage", e);
      }
    }, [initialSidebarOrder]);

    // Save data to localStorage whenever it changes
    useEffect(() => {
      try {
        const appData = {
          projects, tasks, boards, attachments, notes, noteFolders, habits, mindMaps,
          playerStats, pomodoroSettings, activeBoardId,
          notifiedTaskIds: Array.from(notifiedTaskIds),
          sidebarOrder,
        };
        localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData));
      } catch (e) {
        console.error("Failed to save data to localStorage", e);
      }
    }, [projects, tasks, boards, attachments, notes, noteFolders, habits, mindMaps, playerStats, pomodoroSettings, activeBoardId, notifiedTaskIds, sidebarOrder]);

    const updateQuestProgress = useCallback((questId: string, amount = 1) => {
        setDailyQuests(prevQuests => {
            let questCompleted = false;
            const newQuests = prevQuests.map(q => {
                if (q.id === questId && !q.completed) {
                    const newProgress = q.progress + amount;
                    if (newProgress >= q.target) {
                        questCompleted = true;
                        return { ...q, progress: q.target, completed: true };
                    }
                    return { ...q, progress: newProgress };
                }
                return q;
            });
            if (questCompleted) {
                const quest = newQuests.find(q => q.id === questId);
                if (quest) {
                    // addXP(quest.xp);
                }
            }
            return newQuests;
        });
    }, []);

    const handleAddTask = useCallback(async (
        taskData: Omit<Task, 'id' | 'status' | 'pomodorosCompleted' | 'boardId'>,
        targetBoardId?: string
      ): Promise<Task | null> => {
        const boardIdToUse = targetBoardId || activeBoardId;
        const board = boards.find(b => b.id === boardIdToUse);
        if (!board) return null;
        
        const newTask: Task = { 
            id: crypto.randomUUID(), 
            status: board.columns[0], 
            pomodorosCompleted: 0, 
            attachmentIds: [], 
            boardId: board.id,
            ...taskData 
        };
        
        setTasks(prev => [...prev, newTask]);
        updateQuestProgress('createTasks');
        return newTask;
      }, [updateQuestProgress, activeBoardId, boards]);
    
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices.filter(v => v.lang.startsWith('ru')));
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const speak = useCallback((text: string) => {
        if (settings.enableTts && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel any previous speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ru-RU';
            if (settings.selectedVoiceURI) {
                const selectedVoice = availableVoices.find(v => v.voiceURI === settings.selectedVoiceURI);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }
            window.speechSynthesis.speak(utterance);
        }
    }, [settings.enableTts, settings.selectedVoiceURI, availableVoices]);

    const handleSaveSettings = useCallback((newSettings: Settings) => {
        setSettings(newSettings);
    }, []);

    useEffect(() => {
        localStorage.setItem('taskflow_settings', JSON.stringify(settings));
    }, [settings]);
    
    const handleExportData = useCallback(() => {
        try {
            const appData = {
              projects, tasks, boards, attachments, notes, noteFolders, habits, mindMaps,
              playerStats, pomodoroSettings, activeBoardId,
              notifiedTaskIds: Array.from(notifiedTaskIds),
              sidebarOrder,
            };
            const jsonString = JSON.stringify(appData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `taskflow-backup-${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to export data", e);
            alert("Не удалось экспортировать данные.");
        }
    }, [
        projects, tasks, boards, attachments, notes, noteFolders, habits, mindMaps,
        playerStats, pomodoroSettings, activeBoardId, notifiedTaskIds, sidebarOrder
    ]);

    const handleImportData = useCallback((file: File) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') {
                    throw new Error("File could not be read as text.");
                }
                const data = JSON.parse(result);

                if (window.confirm("Вы уверены, что хотите импортировать данные? Это перезапишет все текущие данные в приложении.")) {
                    if (data.projects && data.tasks && data.boards) {
                        setProjects(data.projects || []);
                        setTasks(data.tasks || []);
                        setBoards(data.boards || []);
                        setAttachments(data.attachments || []);
                        setNotes(data.notes || []);
                        setNoteFolders(data.noteFolders || []);
                        setHabits(data.habits || []);
                        setMindMaps(data.mindMaps || []);
                        setPlayerStats(data.playerStats || { level: 1, xp: 0, xpToNextLevel: 100, focusCrystals: 0, rank: RANKS[0], characterType: 'spark', characterName: '', petStats: { hunger: 100, happiness: 100, cleanliness: 100, energy: 100, isSleeping: false }, petCustomization: { color: 'spark_default' }, unlockedPetColors: ['spark_default', 'cat_default', 'dog_default'], unlockedCharacterTypes: [] });
                        setPomodoroSettings(data.pomodoroSettings || { workMinutes: 25, breakMinutes: 5 });
                        setActiveBoardId(data.activeBoardId || null);
                        setNotifiedTaskIds(new Set(data.notifiedTaskIds || []));
                        setSidebarOrder(data.sidebarOrder || initialSidebarOrder);
                        
                        alert("Данные успешно импортированы! Страница будет перезагружена.");
                        window.location.reload();
                    } else {
                        alert("Файл импорта имеет неверный формат.");
                    }
                }
            } catch (e) {
                console.error("Failed to import data", e);
                alert("Не удалось импортировать данные. Убедитесь, что это корректный JSON файл.");
            }
        };
        reader.readAsText(file);
    }, [initialSidebarOrder]);

    const handleOpenAiWithContext = useCallback((context: any) => {
        setAiContext(context);
        setIsAiAssistantOpen(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if(isSearchOpen) return;
            const target = e.target as HTMLElement;
            const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
    
            const pressedCombo = [
                (e.ctrlKey || e.metaKey) && 'ctrl',
                e.altKey && 'alt',
                e.shiftKey && 'shift',
                e.key.toLowerCase(),
            ].filter(Boolean).join('+');
    
            // Special case for formatToMarkdown, which should work in inputs
            if (pressedCombo === settings.hotkeys.formatToMarkdown && isInputFocused) {
                // The logic is in NoteEditor, so we just don't return here
            } else if (isInputFocused && pressedCombo !== settings.hotkeys.toggleSearch) {
                return; // Block other global hotkeys when typing, except for search
            }
    
            const hotkeyToAction: Partial<Record<string, keyof Hotkeys>> = {};
            for (const actionName of Object.keys(settings.hotkeys) as Array<keyof Hotkeys>) {
                const combo = settings.hotkeys[actionName];
                if(combo) hotkeyToAction[combo] = actionName;
            }
    
            const action = hotkeyToAction[pressedCombo];
            if (!action) return;
    
            const actionMap: Partial<Record<keyof Hotkeys, () => void>> = {
                viewDashboard: () => setActiveView('dashboard'),
                viewKanban: () => setActiveView('kanban'),
                viewStats: () => setActiveView('stats'),
                viewAchievements: () => setActiveView('achievements'),
                viewLibrary: () => setActiveView('library'),
                viewNotes: () => setActiveView('notes'),
                viewQuests: () => setActiveView('quests'),
                viewHabits: () => setActiveView('habits'),
                viewPara: () => setActiveView('para'),
                viewMindMap: () => setActiveView('mindmap'),
                viewKnowledge: () => setActiveView('knowledge'),
                viewGraph: () => setActiveView('graph'),
                viewCalendar: () => setActiveView('calendar'),
                quickAddTask: () => setIsTaskFormModalOpen(true),
                quickAddNote: () => setIsQuickNoteOpen(true),
                quickAddProject: () => setIsQuickProjectOpen(true),
                quickAddBoard: () => setIsQuickBoardOpen(true),
                toggleSettings: () => setIsSettingsOpen(prev => !prev),
                toggleQuickAdd: () => setIsQuickAddOpen(prev => !prev),
                toggleAI: () => setIsAiAssistantOpen(prev => !prev),
                toggleSearch: () => setIsSearchOpen(prev => !prev),
            };
    
            if (action in actionMap) {
                const actionToExecute = actionMap[action];
                if (actionToExecute) {
                    e.preventDefault();
                    actionToExecute();
                }
            }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [settings.hotkeys, isMobile, isSearchOpen]);



    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!activeBoardId && boards.length > 0) {
            setActiveBoardId(boards[0].id);
        }
    }, [boards, activeBoardId]);
    
    const doneColumnNames = useMemo(() => new Set(boards.flatMap(b => b.columns.slice(-1))), [boards]);

    // FIX: Define missing variables used for filtering and data display.
    const activeBoard = useMemo(() => boards.find(b => b.id === activeBoardId), [boards, activeBoardId]);
    
    const projectsForBoard = useMemo(() => {
        if (!activeBoardId) return [];
        return projects.filter(p => p.boardId === activeBoardId);
    }, [projects, activeBoardId]);
    
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        projects.forEach(project => project.tags?.forEach(tag => tagSet.add(tag)));
        tasks.forEach(task => task.tags?.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [projects, tasks]);
    
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (task.boardId !== activeBoardId) return false;
            
            const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
            
            let projectMatch;
            if (projectFilter === 'all') {
                projectMatch = true;
            } else if (projectFilter === 'no-project') {
                projectMatch = !task.projectId;
            } else {
                projectMatch = task.projectId === projectFilter;
            }
            
            const tagMatch = tagFilter === 'all' || (task.tags && task.tags.includes(tagFilter));

            return priorityMatch && projectMatch && tagMatch;
        });
    }, [tasks, activeBoardId, priorityFilter, projectFilter, tagFilter]);
    
    const tasksDueToday = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(task => task.dueDate === today && !doneColumnNames.has(task.status));
    }, [tasks, doneColumnNames]);

    const handleUpdateTaskStatus = useCallback((taskId: string, newStatus: string) => {
        setTasks(prevTasks => prevTasks.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
        ));
    }, []);

    const handleStartPomodoro = useCallback((task: Task) => {
        setActivePomodoroTask(task);
        setIsPomodoroActive(true);
        if (isMobile) {
            setActiveView('pomodoro');
        }
    }, [isMobile]);

    const handleDeleteTaskRequest = useCallback((task: Task) => {
        setItemToDelete({ type: 'task', id: task.id, name: task.title });
    }, []);

    const handleUpdateTask = useCallback((updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    }, []);

    const handleUpdateTaskFromCard = handleUpdateTask;

    const handleDuplicateTask = useCallback((taskId: string) => {
        const originalTask = tasks.find(t => t.id === taskId);
        if (originalTask) {
            const newTask: Task = {
                ...originalTask,
                id: crypto.randomUUID(),
                title: `${originalTask.title} (Копия)`,
            };
            setTasks(prev => [...prev, newTask]);
        }
    }, [tasks]);

    const handleAddProject = useCallback((name: string, color: string, emoji: string, tags: string[], boardId: string): Project => {
        const newProject: Project = { id: crypto.randomUUID(), name, color, emoji, tags, boardId };
        setProjects(prev => [...prev, newProject]);
        return newProject;
    }, []);

    const handleSelectProject = useCallback((id: string | null) => {
        setActiveProjectId(id);
    }, []);

    const handleDeleteProjectRequest = useCallback((project: Project) => {
        setItemToDelete({ type: 'project', id: project.id, name: project.name });
    }, []);
    
    const handleDuplicateProject = useCallback((projectId: string) => {
        const originalProject = projects.find(p => p.id === projectId);
        if (originalProject) {
            const newProject: Project = { ...originalProject, id: crypto.randomUUID(), name: `${originalProject.name} (Копия)` };
            setProjects(prev => [...prev, newProject]);
            const projectTasks = tasks.filter(t => t.projectId === projectId);
            const newTasks = projectTasks.map(t => ({...t, id: crypto.randomUUID(), projectId: newProject.id}));
            setTasks(prev => [...prev, ...newTasks]);
        }
    }, [projects, tasks]);
    
    const handleAddNote = useCallback((title: string, folderId: string | null): Note => {
        const newNote: Note = {
            id: crypto.randomUUID(),
            title,
            content: '',
            createdAt: new Date().toISOString(),
            folderId: folderId ?? null,
            tags: [],
        };
        setNotes(prev => [...prev, newNote]);
        return newNote;
    }, []);

    const handleUpdateNote = useCallback((updatedNote: Note) => {
        setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    }, []);

    const handleDeleteNote = useCallback((noteId: string) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (activeKnowledgeNoteId === noteId) {
            setActiveKnowledgeNoteId(null);
        }
    }, [activeKnowledgeNoteId]);

    const handlePomodoroComplete = useCallback((taskId: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, pomodorosCompleted: t.pomodorosCompleted + 1 } : t));
        setActivePomodoroTask(null);
        setIsPomodoroActive(false);
        updateQuestProgress('runPomodoros');
    }, [updateQuestProgress]);

    const handleCancelPomodoro = useCallback(() => {
        setActivePomodoroTask(null);
        setIsPomodoroActive(false);
    }, []);

    const handleRequestNotificationPermission = useCallback(async () => {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    }, []);
    
    const handleConfirmDelete = useCallback(() => {
        if (!itemToDelete) return;
        if (itemToDelete.type === 'task') {
            setTasks(prev => prev.filter(t => t.id !== itemToDelete.id));
        } else if (itemToDelete.type === 'project') {
            setProjects(prev => prev.filter(p => p.id !== itemToDelete.id));
            setTasks(prev => prev.filter(t => t.projectId !== itemToDelete.id));
        } else if (itemToDelete.type === 'board') {
            setBoards(prev => prev.filter(b => b.id !== itemToDelete.id));
        }
        setItemToDelete(null);
    }, [itemToDelete]);

    const handleUpdateProject = useCallback((updatedProject: Project) => {
        setProjects(prev => prev.map(project => project.id === updatedProject.id ? updatedProject : project));
    }, []);

    const handleAddAttachment = useCallback((data: Omit<Attachment, 'id' | 'createdAt'>, entity: { type: 'project' | 'task', id: string }) => {
        const newAttachment: Attachment = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        setAttachments(prev => [...prev, newAttachment]);
        if (entity.type === 'project') {
            setProjects(prev => prev.map(p => p.id === entity.id ? { ...p, attachmentIds: [...(p.attachmentIds || []), newAttachment.id] } : p));
        } else {
            setTasks(prev => prev.map(t => t.id === entity.id ? { ...t, attachmentIds: [...(t.attachmentIds || []), newAttachment.id] } : t));
        }
    }, []);

    const handleUnlinkAttachment = useCallback((attachmentId: string, from: { type: 'project' | 'task', id: string }) => {
        if (from.type === 'project') {
            setProjects(prev => prev.map(p => p.id === from.id ? { ...p, attachmentIds: p.attachmentIds?.filter(id => id !== attachmentId) } : p));
        } else {
            setTasks(prev => prev.map(t => t.id === from.id ? { ...t, attachmentIds: t.attachmentIds?.filter(id => id !== attachmentId) } : t));
        }
    }, []);

    const handleAddBoard = useCallback((name: string) => {
        const newBoard: Board = { id: crypto.randomUUID(), name, columns: ['Бэклог', 'В процессе', 'Готово'] };
        setBoards(prev => [...prev, newBoard]);
    }, []);

    const handleUpdateBoard = useCallback((boardId: string, name: string) => {
        setBoards(prev => prev.map(b => b.id === boardId ? { ...b, name } : b));
    }, []);

    const handleUpdateBoardColor = (boardId: string, color: string) => {
        setBoards(prev => prev.map(b => b.id === boardId ? { ...b, color } : b));
    };

    const handleDeleteProject = useCallback((projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setTasks(prev => prev.filter(t => t.projectId !== projectId));
    }, []);

    const handleDeleteTask = useCallback((taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    }, []);
    
    const handleFeedPet = useCallback(() => true, []);
    const handlePlayWithPet = useCallback(() => true, []);
    const handleBathePet = useCallback(() => true, []);
    const handleTogglePetSleep = useCallback(() => true, []);
    
    const handleAddNoteFolder = useCallback((name: string, emoji: string): NoteFolder => {
        const newFolder: NoteFolder = { id: crypto.randomUUID(), name, emoji };
        setNoteFolders(prev => [...prev, newFolder]);
        return newFolder;
    }, []);

    const handleUpdateNoteFolder = useCallback((folder: NoteFolder) => {
        setNoteFolders(prev => prev.map(f => f.id === folder.id ? folder : f));
    }, []);
    
    const handleDeleteNoteFolder = useCallback((folderId: string) => {
        setNoteFolders(prev => prev.filter(f => f.id !== folderId));
    }, []);

    const handleSelectCharacter = useCallback((type: CharacterType, name: string) => {
        setPlayerStats(prev => ({...prev, characterType: type, characterName: name}));
        setIsCharacterSelectionOpen(false);
    }, []);

    const handleCharacterSwitch = useCallback((type: CharacterType) => {
        setPlayerStats(prev => ({...prev, characterType: type}));
        setIsCharacterSwitchOpen(false);
    }, []);

    const handleUnlockPetColor = useCallback(() => true, []);
    const handleSelectPetColor = useCallback((colorId: string) => {
        setPlayerStats(prev => ({ ...prev, petCustomization: { color: colorId }}));
        return true;
    }, []);
    const handleUnlockCharacterType = useCallback(() => true, []);

    const handleBoardChange = (newBoardId: string) => {
        setActiveBoardId(newBoardId);
        setProjectFilter('all');
    };
    
    const handleNavigateToBoard = (boardId: string) => {
        setActiveBoardId(boardId);
        setActiveView('kanban');
    };

    const handleNavigateToNote = (noteId: string) => {
        setActiveKnowledgeNoteId(noteId);
        setActiveView('knowledge');
    }

    const handleAddMindMap = useCallback((map: MindMap) => {
        setMindMaps(prev => [...prev, map]);
        setActiveMindMapId(map.id);
    }, []);
    const handleUpdateMindMap = useCallback((updatedMap: MindMap) => {
        setMindMaps(prev => prev.map(m => m.id === updatedMap.id ? updatedMap : m));
    }, []);
    const handleDeleteMindMap = useCallback((mapId: string) => {
        setMindMaps(prev => prev.filter(m => m.id !== mapId));
        if (activeMindMapId === mapId) {
            setActiveMindMapId(null);
        }
    }, [activeMindMapId]);

    const handleGenerateMindMapFromProject = useCallback(async (projectId: string): Promise<MindMap | null> => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return null;
        setIsGeneratingMindMap(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const projectTasks = tasks.filter(t => t.projectId === projectId);
            const taskData = projectTasks.map(t => ({
                title: t.title,
                subtasks: t.subtasks?.map(st => st.title) || [],
            }));
            const prompt = `Generate a mind map structure for the project '${project.name}'. The root node is the project. Its children are the tasks. Each task's children are its subtasks. Project tasks data: ${JSON.stringify(taskData)}. Provide the output as a nested JSON object with 'label' and 'children' properties.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            label: { type: Type.STRING },
                            children: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        label: { type: Type.STRING },
                                        children: {
                                            type: Type.ARRAY,
                                            items: { type: Type.OBJECT, properties: { label: { type: Type.STRING } } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            const generatedTree = JSON.parse(response.text.trim());
            
            const newNodes: MindMapNode[] = [];
            const layoutTree = (node: any, parentId: string | null, x: number, y: number, level: number) => {
                const nodeId = crypto.randomUUID();
                newNodes.push({ id: nodeId, label: node.label, parentId, x, y });
                const children = node.children || [];
                const numChildren = children.length;
                const childY = y + 150;
                const totalWidth = numChildren * 250;

                children.forEach((child: any, i: number) => {
                    const childX = x - totalWidth / 2 + (i + 0.5) * 250;
                    layoutTree(child, nodeId, childX, childY, level + 1);
                });
            };
            layoutTree(generatedTree, null, 0, 0, 0);

            const newMap: MindMap = { id: crypto.randomUUID(), name: `Карта: ${project.name}`, nodes: newNodes };
            handleAddMindMap(newMap);
            return newMap;

        } catch (error) {
            console.error("Error generating mind map:", error);
            alert("Не удалось сгенерировать карту. Пожалуйста, проверьте консоль для получения дополнительной информации.");
        } finally {
            setIsGeneratingMindMap(false);
        }
        return null;
    }, [projects, tasks, handleAddMindMap]);

    const handleAddMindMapNode = (
        mapId: string,
        label: string,
        parentId: string | null | undefined,
        position: { x: number; y: number } | null,
        callback?: (newNodeId: string) => void
    ) => {
        const newNodeId = crypto.randomUUID();
        setMindMaps(prev => prev.map(m => {
            if (m.id !== mapId) return m;
    
            const nodes = [...m.nodes];
            let newX: number, newY: number;
    
            if (position) {
                newX = position.x;
                newY = position.y;
            } else {
                const parentNode = parentId ? nodes.find(n => n.id === parentId) : null;
                const siblings = nodes.filter(n => n.parentId === parentId);
    
                if (siblings.length > 0) {
                    const lastSibling = siblings.reduce((last, current) => (current.x > last.x ? current : last), siblings[0]);
                    newX = lastSibling.x + 250;
                    newY = lastSibling.y;
                } else if (parentNode) {
                    newX = parentNode.x;
                    newY = parentNode.y + 150;
                } else {
                    const rootNodes = nodes.filter(n => !n.parentId);
                    if (rootNodes.length > 0) {
                        const lastRoot = rootNodes.reduce((last, current) => (current.x > last.x ? current : last), rootNodes[0]);
                        newX = lastRoot.x + 250;
                        newY = lastRoot.y;
                    } else {
                        newX = 0;
                        newY = 0;
                    }
                }
            }
            
            const newNode: MindMapNode = { id: newNodeId, label, x: newX, y: newY, parentId: parentId ?? null };
            return { ...m, nodes: [...nodes, newNode] };
        }));
        if (callback) {
            callback(newNodeId);
        }
    };
    const handleUpdateMindMapNode = (mapId: string, nodeId: string, newLabel: string) => {
        setMindMaps(prev => prev.map(m => {
            if (m.id === mapId) {
                return { ...m, nodes: m.nodes.map(n => n.id === nodeId ? { ...n, label: newLabel } : n) };
            }
            return m;
        }));
    };
    const handleDeleteMindMapNode = (mapId: string, nodeId: string) => {
        setMindMaps(prev => prev.map(m => {
            if (m.id !== mapId) return m;
    
            if (m.nodes.length <= 1) return m;
    
            const nodesToDelete = new Set<string>([nodeId]);
            let size = 0;
            while (size !== nodesToDelete.size) {
                size = nodesToDelete.size;
                m.nodes.forEach(node => {
                    if (node.parentId && nodesToDelete.has(node.parentId)) {
                        nodesToDelete.add(node.id);
                    }
                });
            }
            
            const remainingNodes = m.nodes.filter(n => !nodesToDelete.has(n.id));
            
            return { ...m, nodes: remainingNodes };
        }));
    };

    const handleLinkTaskToNode = (mapId: string, nodeId: string, taskId: string) => {
        setMindMaps(prevMaps => prevMaps.map(m => {
            if (m.id === mapId) {
                return {
                    ...m,
                    nodes: m.nodes.map(n => n.id === nodeId ? { ...n, linkedTaskId: taskId, linkedProjectId: undefined } : n)
                };
            }
            return m;
        }));
    };

    const handleConvertToTask = async (mapId: string, nodeId: string) => {
        const map = mindMaps.find(m => m.id === mapId);
        if (!map) return;
        const node = map.nodes.find(n => n.id === nodeId);
        if (!node || node.linkedTaskId || node.linkedProjectId) return;
    
        const newTask = await handleAddTask({
            title: node.label.replace(/<[^>]*>?/gm, ''),
            description: `Создано из интеллект-карты "${map.name}"`,
            pomodorosEstimated: 1,
            projectId: activeProjectId,
        });
    
        if (newTask) {
            handleLinkTaskToNode(mapId, nodeId, newTask.id);
        }
    };

    const handleConvertToProject = async (mapId: string, nodeId: string) => {
        const map = mindMaps.find(m => m.id === mapId);
        const node = map?.nodes.find(n => n.id === nodeId);
        if (!node || node.linkedProjectId || node.linkedTaskId) return;
    
        const activeBoard = boards.find(b => b.id === activeBoardId);
        if (!activeBoard) {
            alert("Пожалуйста, сначала выберите активную доску.");
            return;
        }
    
        const newProject = handleAddProject(
            node.label.replace(/<[^>]*>?/gm, ''),
            '#A371F7',
            '📁',
            [],
            activeBoard.id
        );
    
        handleLinkProjectToNode(mapId, nodeId, newProject.id);
    };
    
    const handleLinkProjectToNode = (mapId: string, nodeId: string, projectId: string) => {
        setMindMaps(prevMaps => prevMaps.map(m => {
            if (m.id === mapId) {
                return {
                    ...m,
                    nodes: m.nodes.map(n => n.id === nodeId ? { ...n, linkedProjectId: projectId, linkedTaskId: undefined } : n)
                };
            }
            return m;
        }));
    };

    const handleAddTaskMobile = async (taskData: Omit<Task, 'id' | 'status' | 'pomodorosCompleted' | 'boardId'>) => {
        const result = await handleAddTask(taskData);
        if (result) {
            setIsTaskFormModalOpen(false);
        }
    };

    const handleAddProjectQuick = (name: string, emoji: string, boardId: string) => {
        handleAddProject(name, '#A371F7', emoji, [], boardId);
        setIsQuickProjectOpen(false);
    };

    const handleAddBoardQuick = (name: string) => {
        handleAddBoard(name);
        setIsQuickBoardOpen(false);
    };

    const handleSearchNavigate = useCallback((type: 'project' | 'task' | 'note', id: string) => {
        if (type === 'note') {
            setActiveKnowledgeNoteId(id);
            setActiveView('knowledge');
        } else if (type === 'task') {
            const task = tasks.find(t => t.id === id);
            if (task) {
                setActiveBoardId(task.boardId);
                setActiveView('kanban');
                setTaskToEdit(task);
            }
        } else if (type === 'project') {
            const project = projects.find(p => p.id === id);
            if (project) {
                setActiveBoardId(project.boardId);
                setActiveView('kanban');
                setProjectFilter(project.id);
            }
        }
        setIsSearchOpen(false);
    }, [tasks, projects]);

    const handleVoiceInput = useCallback(() => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVoiceError("Распознавание речи не поддерживается в вашем браузере.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = false;
        recognition.lang = 'ru-RU';
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            setVoiceError(null);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech' || event.error === 'network') {
                setVoiceError("Не удалось распознать речь. Попробуйте снова.");
            } else if (event.error === 'not-allowed') {
                setVoiceError('Доступ к микрофону запрещен.');
            } else {
                setVoiceError(`Ошибка: ${event.error}`);
            }
            setIsListening(false);
        };
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

            const findTaskByName = (name: string) => tasks.find(t => t.title.toLowerCase().includes(name));
            const findProjectByName = (name: string) => projects.find(p => p.name.toLowerCase().includes(name));
            const findBoardByName = (name: string) => boards.find(b => b.name.toLowerCase().includes(name));
            
            const parseDate = (dateStr: string): string | undefined => {
                if (dateStr === 'сегодня') return new Date().toISOString().split('T')[0];
                if (dateStr === 'завтра') {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return tomorrow.toISOString().split('T')[0];
                }
                return undefined;
            };

            const commandMap = [
                { keywords: ['открой главную', 'открой дашборд'], action: () => setActiveView('dashboard'), feedback: 'Открываю главную.' },
                { keywords: ['открой канбан', 'открой доску'], action: () => setActiveView('kanban'), feedback: 'Открываю канбан-доску.' },
                { keywords: ['открой мир идей', 'открой знания'], action: () => setActiveView('knowledge'), feedback: 'Открываю Мир Идей.' },
                { keywords: ['открой привычки'], action: () => setActiveView('habits'), feedback: 'Открываю трекер привычек.' },
                { keywords: ['открой проекты', 'открой пара'], action: () => setActiveView('para'), feedback: 'Открываю проекты.' },
                { keywords: ['открой питомца', 'покажи питомца'], action: () => setActiveView('achievements'), feedback: 'Открываю вашего питомца.' },
                { keywords: ['открой статистику'], action: () => setActiveView('stats'), feedback: 'Открываю статистику.' },
                { keywords: ['открой квесты'], action: () => setActiveView('quests'), feedback: 'Открываю квесты.' },
                { keywords: ['открой карты', 'открой интеллект-карты'], action: () => setActiveView('mindmap'), feedback: 'Открываю интеллект-карты.' },
                { keywords: ['открой звёздное небо', 'открой граф'], action: () => setActiveView('graph'), feedback: 'Открываю "Звёздное небо".' },
                { keywords: ['открой ассистента', 'открой леночку'], action: () => setIsAiAssistantOpen(true), feedback: 'Ассистент открыт.'},
                { keywords: ['закрой ассистента'], action: () => setIsAiAssistantOpen(false), feedback: 'Ассистент закрыт.'},
                { keywords: ['открой настройки'], action: () => setIsSettingsOpen(true), feedback: 'Открываю настройки.'},
                { keywords: ['закрой настройки'], action: () => setIsSettingsOpen(false), feedback: 'Настройки закрыты.'},
                {
                    regex: /^(создай|добавь) задачу (.+?)(?: (?:с|c) (высоким|средним|низким) приоритетом)?(?: (?:на|до) (сегодня|завтра))?(?: в проект (.+))?$/,
                    action: async (match: RegExpMatchArray) => {
                        const [, , title, priorityStr, dateStr, projectStr] = match;
                        const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1);
                        let feedback = `Задача "${capitalizedTitle}" создана.`;
                        
                        const taskData: Partial<Omit<Task, 'id' | 'status' | 'pomodorosCompleted' | 'boardId'>> = {
                            title: capitalizedTitle,
                            description: 'Создано голосовой командой',
                            pomodorosEstimated: 1,
                        };

                        if (priorityStr) {
                            if (priorityStr.includes('высок')) taskData.priority = TaskPriority.High;
                            else if (priorityStr.includes('средн')) taskData.priority = TaskPriority.Medium;
                            else if (priorityStr.includes('низк')) taskData.priority = TaskPriority.Low;
                        }

                        if (dateStr) {
                           taskData.dueDate = parseDate(dateStr);
                           feedback += ` и запланирована на ${dateStr}.`;
                        }

                        if (projectStr) {
                            const project = findProjectByName(projectStr);
                            if (project) {
                                taskData.projectId = project.id;
                                feedback += ` в проекте "${project.name}".`;
                            } else {
                                feedback += ` Но проект "${projectStr}" не найден.`;
                            }
                        } else {
                            taskData.projectId = activeProjectId;
                        }

                        await handleAddTask(taskData as any);
                        speak(feedback);
                    }
                },
                {
                    regex: /^(заверши|выполни) задачу (.+)/,
                    action: (match: RegExpMatchArray) => {
                        const task = findTaskByName(match[2]);
                        if (task) {
                            const board = boards.find(b => b.id === task.boardId);
                            const doneStatus = board?.columns[board.columns.length - 1];
                            if (doneStatus) {
                                handleUpdateTaskStatus(task.id, doneStatus);
                                speak(`Задача "${task.title}" выполнена.`);
                            }
                        } else {
                            speak(`Задача "${match[2]}" не найдена.`);
                        }
                    }
                },
                {
                    regex: /^удали задачу (.+)/,
                    action: (match: RegExpMatchArray) => {
                        const task = findTaskByName(match[1]);
                        if (task) {
                            handleDeleteTask(task.id);
                            speak(`Задача "${task.title}" удалена.`);
                        } else {
                            speak(`Задача "${match[1]}" не найдена.`);
                        }
                    }
                },
                {
                    regex: /^перемести задачу (.+) в (.+)/,
                    action: (match: RegExpMatchArray) => {
                        const task = findTaskByName(match[1]);
                        const status = match[2];
                        if (task) {
                            const board = boards.find(b => b.id === task.boardId);
                            const targetStatus = board?.columns.find(c => c.toLowerCase().includes(status));
                            if (targetStatus) {
                                handleUpdateTaskStatus(task.id, targetStatus);
                                speak(`Задача "${task.title}" перемещена в "${targetStatus}".`);
                            } else {
                                speak(`Статус "${status}" не найден.`);
                            }
                        } else {
                            speak(`Задача "${match[1]}" не найдена.`);
                        }
                    }
                },
                {
                    regex: /^запусти помодоро для задачи (.+)/,
                    action: (match: RegExpMatchArray) => {
                        const task = findTaskByName(match[1]);
                        if (task) {
                            handleStartPomodoro(task);
                            speak(`Помодоро для задачи "${task.title}" запущен.`);
                        } else {
                            speak(`Задача "${match[1]}" не найдена.`);
                        }
                    }
                },
                { keywords: ['пауза помодоро', 'поставь помодоро на паузу'], action: () => setIsPomodoroActive(false), feedback: 'Таймер на паузе.' },
                { keywords: ['продолжи помодоро', 'возобнови помодоро'], action: () => setIsPomodoroActive(true), feedback: 'Таймер запущен.' },
                { keywords: ['стоп помодоро', 'отмени помодоро'], action: () => handleCancelPomodoro(), feedback: 'Помодоро отменен.' },
            ];

            for (const cmd of commandMap) {
                if ('regex' in cmd) {
                    const match = transcript.match(cmd.regex);
                    if (match) {
                        cmd.action(match);
                        return;
                    }
                } else if ('keywords' in cmd) {
                    if (cmd.keywords.some(k => transcript.includes(k))) {
                        cmd.action();
                        speak(cmd.feedback);
                        return;
                    }
                }
            }
        };

        recognition.start();
    }, [
        isListening,
        tasks,
        projects,
        boards,
        activeProjectId,
        handleAddTask,
        speak,
        handleUpdateTaskStatus,
        handleDeleteTask,
        handleStartPomodoro,
        handleCancelPomodoro,
        setIsPomodoroActive,
        setActiveView,
        setIsAiAssistantOpen,
        setIsSettingsOpen
    ]);

    const MainContent = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView boards={boards} projects={projects} tasks={tasks} onNavigateToBoard={handleNavigateToBoard} onUpdateBoardColor={handleUpdateBoardColor} />;
            case 'kanban':
                return (
                    <>
                      <div className="flex flex-wrap justify-between items-center gap-4 mb-8"></div>
                      <div className="lg:hidden mb-6">
                            <label htmlFor="board-selector" className="block text-sm font-medium text-text-secondary mb-1.5 pl-1">Текущая доска</label>
                            <select
                                id="board-selector"
                                value={activeBoardId || ''}
                                onChange={(e) => handleBoardChange(e.target.value)}
                                className="w-full bg-accent backdrop-blur-xl border border-border-color shadow-inner-soft rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-highlight transition-all appearance-none"
                            >
                                {boards.map(board => (
                                    <option key={board.id} value={board.id}>{board.name}</option>
                                ))}
                            </select>
                        </div>
    
                      <KanbanFilters 
                        activeFilter={priorityFilter}
                        onFilterChange={setPriorityFilter}
                        projects={projectsForBoard}
                        allTags={allTags}
                        activeProjectFilter={projectFilter}
                        onProjectFilterChange={setProjectFilter}
                        activeTagFilter={tagFilter}
                        onTagFilterChange={setTagFilter}
                      />
                      <KanbanBoard 
                        tasks={filteredTasks} 
                        board={activeBoard ?? null}
                        onUpdateTaskStatus={handleUpdateTaskStatus} 
                        onStartPomodoro={handleStartPomodoro} 
                        onDeleteRequest={handleDeleteTaskRequest} 
                        onEditRequest={setTaskToEdit} 
                        projects={projects} 
                        onUpdateTask={handleUpdateTaskFromCard}
                        onDuplicateTask={handleDuplicateTask}
                        isMobile={isMobile}
                        allAttachments={attachments}
                        onOpenAiWithContext={handleOpenAiWithContext}
                      />
                    </>
                );
            case 'para': return <ParaView projects={projects} boards={boards} notes={notes} tasks={tasks} isMobile={isMobile} />;
            case 'stats': return <Statistics tasks={tasks} projects={projects} playerStats={playerStats} onGenerateReport={async () => "Report generated"} />;
            case 'achievements': return <Achievements playerStats={playerStats} onFeed={handleFeedPet} onPlay={handlePlayWithPet} onBathe={handleBathePet} onToggleSleep={handleTogglePetSleep} onPet={() => true} onOpenStore={() => setIsStoreOpen(true)} onSwitchRequest={() => setIsCharacterSwitchOpen(true)} />;
            case 'library': return <FileLibrary attachments={attachments} projects={projects} tasks={tasks} onDeleteAttachment={() => {}} />;
            case 'notes': return <NotesView notes={notes} noteFolders={noteFolders} projects={projects} tasks={tasks} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} onEditNoteRequest={setNoteToEdit} onAddFolder={handleAddNoteFolder} onUpdateFolder={handleUpdateNoteFolder} onDeleteFolder={handleDeleteNoteFolder} isMobile={isMobile} />;
            case 'quests': return <QuestsView quests={dailyQuests} />;
            case 'habits': return <HabitTracker habits={habits} onAddHabit={()=>{}} onUpdateHabit={()=>{}} onCheckIn={()=>{}} />;
            case 'pomodoro': return (
                <div className="bg-secondary p-8 rounded-3xl border border-border-color shadow-soft-glow max-w-md mx-auto">
                    <PomodoroTimer 
                        activeTask={activePomodoroTask} 
                        onComplete={handlePomodoroComplete} 
                        onCancel={handleCancelPomodoro}
                        pomodoroSettings={pomodoroSettings} 
                        onSettingsChange={setPomodoroSettings}
                        isActive={isPomodoroActive}
                        setIsActive={setIsPomodoroActive}
                        timeRemaining={pomodoroTimeRemaining}
                        setTimeRemaining={setPomodoroTimeRemaining}
                    />
                </div>
            );

            case 'mindmap': return <MindMapView mindMaps={mindMaps} activeMapId={activeMindMapId} onSetActiveMapId={setActiveMindMapId} onAddMindMap={handleAddMindMap} onUpdateMindMap={handleUpdateMindMap} onDeleteMindMap={handleDeleteMindMap} onAddMindMapNode={handleAddMindMapNode} onUpdateMindMapNode={handleUpdateMindMapNode} onDeleteMindMapNode={handleDeleteMindMapNode} projects={projects} tasks={tasks} isGenerating={isGeneratingMindMap} onGenerateFromProject={handleGenerateMindMapFromProject} boards={boards} onConvertToTask={handleConvertToTask} onLinkTaskToNode={handleLinkTaskToNode} onConvertToProject={handleConvertToProject} onLinkProjectToNode={handleLinkProjectToNode} />;
            case 'knowledge': return <KnowledgeBaseView notes={notes} noteFolders={noteFolders} activeNoteId={activeKnowledgeNoteId} onSetActiveNoteId={setActiveKnowledgeNoteId} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} onAddFolder={handleAddNoteFolder} onDeleteFolder={handleDeleteNoteFolder} onNavigateToGraph={() => setActiveView('graph')} voiceCommand={null} settings={settings} />;
            case 'graph': return <GraphView notes={notes} onNavigateToNote={handleNavigateToNote} />;
            case 'calendar': return <CalendarView tasks={tasks} projects={projects} onUpdateTask={handleUpdateTask} onEditRequest={setTaskToEdit} />;
        }
    };
    
// FIX: Replaced `JSX.Element` with `React.ReactElement` to resolve "Cannot find namespace 'JSX'" error.
    const sidebarWidgets: Record<SidebarWidgetKey, { title: string, component: React.ReactElement }> = useMemo(() => ({
        projects: { title: 'Проекты', component: <ProjectManager projects={projectsForBoard} tasks={tasks} activeProjectId={activeProjectId} onAddProject={handleAddProject} onSelectProject={handleSelectProject} onEditRequest={setProjectToEdit} onDeleteRequest={handleDeleteProjectRequest} onDuplicateRequest={handleDuplicateProject} allTags={allTags} boards={boards} activeBoardId={activeBoardId} allAttachments={attachments} /> },
        form: { title: 'Добавить задачу', component: <TaskForm onAddTask={(taskData) => handleAddTask(taskData as any)} projects={projects} activeProjectId={activeProjectId} /> },
        pet: { title: 'Питомец', component: <FocusPet stats={playerStats} /> },
        quests: { title: 'Ежедневные квесты', component: <DailyQuests quests={dailyQuests} /> },
        notes: { title: 'Быстрые Заметки', component: <Notes notes={notes} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} /> },
        pomodoro: { title: 'Помодоро', component: <PomodoroTimer activeTask={activePomodoroTask} onComplete={handlePomodoroComplete} onCancel={handleCancelPomodoro} pomodoroSettings={pomodoroSettings} onSettingsChange={setPomodoroSettings} isActive={isPomodoroActive} setIsActive={setIsPomodoroActive} timeRemaining={pomodoroTimeRemaining} setTimeRemaining={setPomodoroTimeRemaining} /> },
        notifications: { title: 'Уведомления', component: <Notifications permission={notificationPermission} onRequestPermission={handleRequestNotificationPermission} tasksDueToday={tasksDueToday} /> }
    }), [projectsForBoard, tasks, activeProjectId, handleAddProject, handleSelectProject, setProjectToEdit, handleDeleteProjectRequest, handleDuplicateProject, allTags, boards, activeBoardId, playerStats, dailyQuests, notes, handleAddNote, handleUpdateNote, handleDeleteNote, activePomodoroTask, handlePomodoroComplete, pomodoroSettings, notificationPermission, handleRequestNotificationPermission, tasksDueToday, handleAddTask, isPomodoroActive, handleCancelPomodoro, attachments, pomodoroTimeRemaining, projects]);

    const isFullScreenView = ['dashboard', 'library', 'notes', 'quests', 'habits', 'para', 'stats', 'achievements', 'pomodoro', 'mindmap', 'knowledge', 'graph', 'calendar'].includes(activeView);

    const isSidebarVisible = !isFullScreenView && !isMobile;

    const mobileNavItems = [
        { id: 'dashboard', label: 'Главная', icon: HomeIcon },
        { id: 'kanban', label: 'Канбан', icon: KanbanIcon },
        { id: 'knowledge', label: 'Идеи', icon: DocumentDuplicateIcon },
        { id: 'menu', label: 'Меню', icon: MenuIcon, action: () => setIsMobileNavMenuOpen(true) },
    ];
    
    return (
        <div className={`min-h-screen bg-base-bg font-sans ${isMobile ? 'pb-24' : ''}`}>
            <Header 
                stats={playerStats} 
                activeView={activeView}
                onViewChange={setActiveView}
                onOpenStore={() => setIsStoreOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenSearch={() => setIsSearchOpen(true)}
                settings={settings}
                isPomodoroActive={isPomodoroActive}
                pomodoroTimeRemaining={pomodoroTimeRemaining}
            />
            <main className="p-2 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {isSidebarVisible && (
                    <Reorder.Group as="aside" axis="y" values={sidebarOrder} onReorder={setSidebarOrder} className="lg:col-span-1 flex flex-col gap-8">
                        {sidebarOrder.map((widgetKey) => {
                            const widgetInfo = sidebarWidgets[widgetKey];
                            return widgetInfo ? (
                                <SidebarWidget key={widgetKey} value={widgetKey} title={widgetInfo.title}>
                                    {widgetInfo.component}
                                </SidebarWidget>
                            ) : null;
                        })}
                    </Reorder.Group>
                )}
                <div className={isSidebarVisible ? 'lg:col-span-3' : 'col-span-1 lg:col-span-4'}>
                  {MainContent()}
                </div>
            </main>
            
            {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 bg-secondary/80 backdrop-blur-xl border-t border-border-color z-40 h-14">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-highlight/50 to-transparent"></div>
                    <div className="grid grid-cols-5 items-center h-full">
                        {mobileNavItems.slice(0, 2).map(item => (
                            <button key={item.id} onClick={() => item.action ? item.action() : setActiveView(item.id as any)} className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 h-14 transition-colors ${activeView === item.id ? 'text-highlight' : 'text-text-secondary'}`}>
                                {activeView === item.id && <div className="absolute top-0 w-8 h-1 bg-highlight rounded-b-full shadow-[0_0_10px] shadow-highlight/50"></div>}
                                <item.icon className="w-5 h-5" />
                                <span className="text-[9px] font-medium">{item.label}</span>
                            </button>
                        ))}

                        <div className="flex justify-center">
                            <button onClick={() => setIsQuickAddOpen(true)} className="-mt-5 bg-highlight text-primary w-14 h-14 rounded-full shadow-lg shadow-highlight/30 flex items-center justify-center z-50 mx-auto active:scale-90 transition-transform">
                                <PlusIcon className="w-7 h-7"/>
                            </button>
                        </div>

                        {mobileNavItems.slice(2, 4).map(item => (
                            <button key={item.id} onClick={() => item.action ? item.action() : setActiveView(item.id as any)} className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 h-14 transition-colors ${activeView === item.id ? 'text-highlight' : 'text-text-secondary'}`}>
                                 {activeView === item.id && <div className="absolute top-0 w-8 h-1 bg-highlight rounded-b-full shadow-[0_0_10px] shadow-highlight/50"></div>}
                                <item.icon className="w-5 h-5" />
                                <span className="text-[9px] font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <MobileMenu
                isOpen={isMobileNavMenuOpen}
                onClose={() => setIsMobileNavMenuOpen(false)}
                onViewChange={(view) => {
                    setActiveView(view);
                    setIsMobileNavMenuOpen(false);
                }}
            />
            
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSave={handleSaveSettings}
                availableVoices={availableVoices}
                onExport={handleExportData}
                onImport={handleImportData}
            />
             <GlobalSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                projects={projects}
                tasks={tasks}
                notes={notes}
                onNavigate={handleSearchNavigate}
            />
            <QuickAddMenu
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                onAddTaskClick={() => { setIsQuickAddOpen(false); setIsTaskFormModalOpen(true); }}
                onAddNoteClick={() => { setIsQuickAddOpen(false); setIsQuickNoteOpen(true); }}
                onAddProjectClick={() => { setIsQuickAddOpen(false); setIsQuickProjectOpen(true); }}
                onAddBoardClick={() => { setIsQuickAddOpen(false); setIsQuickBoardOpen(true); }}
            />
            <QuickAddNoteModal
                isOpen={isQuickNoteOpen}
                onClose={() => setIsQuickNoteOpen(false)}
                onAddNote={(content) => { handleAddNote(content, null); setIsQuickNoteOpen(false); }}
            />
             <QuickAddProjectModal
                isOpen={isQuickProjectOpen}
                onClose={() => setIsQuickProjectOpen(false)}
                onAddProject={handleAddProjectQuick}
                boards={boards}
            />
            <QuickAddBoardModal
                isOpen={isQuickBoardOpen}
                onClose={() => setIsQuickBoardOpen(false)}
                onAddBoard={handleAddBoardQuick}
            />
            <TaskFormModal 
                isOpen={isTaskFormModalOpen} 
                onClose={() => setIsTaskFormModalOpen(false)}
                onAddTask={handleAddTaskMobile}
                projects={projects}
                activeProjectId={activeProjectId}
            />
            {itemToDelete && <ConfirmationModal title={`Подтвердите удаление`} message={`Вы уверены, что хотите удалить "${itemToDelete.name}"? Это действие нельзя будет отменить.`} onConfirm={handleConfirmDelete} onCancel={() => setItemToDelete(null)} confirmText="Удалить" confirmClass="bg-brand-red text-white" />}
            {projectToEdit && <ProjectEditModal project={projectToEdit} onUpdate={handleUpdateProject} onCancel={() => setProjectToEdit(null)} onAddAttachment={handleAddAttachment} onUnlinkAttachment={handleUnlinkAttachment} allAttachments={attachments} />}
            {taskToEdit && <TaskEditModal task={taskToEdit} onUpdate={(task) => handleUpdateTask(task)} onCancel={() => setTaskToEdit(null)} onAddAttachment={handleAddAttachment} onUnlinkAttachment={handleUnlinkAttachment} allAttachments={attachments} />}
            {noteToEdit && <NoteEditModal note={noteToEdit} onUpdate={handleUpdateNote} onCancel={() => setNoteToEdit(null)} noteFolders={noteFolders} projects={projects} tasks={tasks} />}
            {boardToEdit && <BoardEditModal isOpen={!!boardToEdit} board={boardToEdit === 'new' ? null : boardToEdit} onClose={() => setBoardToEdit(null)} onSave={(name, boardId) => { if (boardId) { handleUpdateBoard(boardId, name); } else { handleAddBoard(name); } }} />}
            
            <AIAssistant isOpen={isAiAssistantOpen} setIsOpen={setIsAiAssistantOpen} projects={projects} tasks={tasks} notes={notes} noteFolders={noteFolders} boards={boards} mindMaps={mindMaps} activeProjectId={activeProjectId} activeMindMapId={activeMindMapId} playerStats={playerStats} userProfile={userProfile} onAddTask={(taskData, boardId) => handleAddTask(taskData as any, boardId)} onAddProject={handleAddProject} onUpdateTask={(task) => handleUpdateTask(task)} onUpdateProject={handleUpdateProject} onDeleteProject={handleDeleteProject} onDeleteTask={handleDeleteTask} onStartPomodoro={handleStartPomodoro} onUpdateTaskStatus={handleUpdateTaskStatus} onAddAttachment={handleAddAttachment} onFeedPet={handleFeedPet} onPlayWithPet={handlePlayWithPet} onBathePet={handleBathePet} onTogglePetSleep={handleTogglePetSleep} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} onAddNoteFolder={handleAddNoteFolder} onUpdateNoteFolder={handleUpdateNoteFolder} onDeleteNoteFolder={handleDeleteNoteFolder} onAddMindMap={handleAddMindMap} onUpdateMindMap={handleUpdateMindMap} onDeleteMindMap={handleDeleteMindMap} onAddMindMapNode={handleAddMindMapNode} onUpdateMindMapNode={handleUpdateMindMapNode} onDeleteMindMapNode={handleDeleteMindMapNode} onGenerateMindMapFromProject={handleGenerateMindMapFromProject} onSpeak={speak} hotkeys={settings.hotkeys} settings={settings} onVoiceInput={handleVoiceInput} isListening={isListening} context={aiContext} onClearContext={() => setAiContext(null)} isMobile={isMobile} />
            <CharacterSelectionModal isOpen={isCharacterSelectionOpen} onSelect={handleSelectCharacter} />
            <CharacterSwitchModal isOpen={isCharacterSwitchOpen} onClose={() => setIsCharacterSwitchOpen(false)} onSwitch={handleCharacterSwitch} unlockedTypes={playerStats.unlockedCharacterTypes} activeType={playerStats.characterType} />
            <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} playerStats={playerStats} onUnlockColor={handleUnlockPetColor} onSelectColor={handleSelectPetColor} onUnlockCharacterType={handleUnlockCharacterType} />
            
            <motion.button
                onClick={handleVoiceInput}
                className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center z-40 bg-secondary/80 backdrop-blur-md text-text-primary shadow-lg lg:hidden"
                aria-label="Активировать голосовое управление"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                {isListening && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-neon-purple"
                        animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.7, 0, 0.7],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                )}
                <MicrophoneIcon className="w-7 h-7 relative" />
            </motion.button>
        </div>
    );
};

export default App;