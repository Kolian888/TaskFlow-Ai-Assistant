import React, { useState, useRef, useEffect, useCallback } from 'react';
import OpenAI from 'openai';
// @ts-ignore
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { SparklesIcon, XIcon, PaperclipIcon, SpeakerWaveIcon, MicrophoneIcon } from './Icons';
import { Project, Task, TaskPriority, Subtask, Attachment, AttachmentType, PlayerStats, Note, NoteFolder, Board, UserProfile, MindMap, MindMapNode, Hotkeys, Settings } from '../types';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

interface AIAssistantProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    projects: Project[];
    tasks: Task[];
    notes: Note[];
    noteFolders: NoteFolder[];
    boards: Board[];
    mindMaps: MindMap[];
    activeProjectId: string | null;
    activeMindMapId: string | null;
    playerStats: PlayerStats;
    userProfile: UserProfile | null;
    onAddTask: (taskData: Omit<Task, 'id' | 'status' | 'pomodorosCompleted' | 'boardId'>, boardId?: string) => Promise<Task | null>;
    onAddProject: (name: string, color: string, emoji: string, tags: string[], boardId: string) => Project;
    onUpdateTask: (updatedTask: Task) => void;
    onUpdateProject: (updatedProject: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onDeleteTask: (taskId: string) => void;
    onStartPomodoro: (task: Task) => void;
    onUpdateTaskStatus: (taskId: string, newStatus: string) => void;
    onAddAttachment: (data: { name: string; type: AttachmentType; url: string; }, entity: { type: 'project' | 'task'; id: string; }) => void;
    onFeedPet: () => boolean;
    onPlayWithPet: () => boolean;
    onBathePet: () => boolean;
    onTogglePetSleep: () => boolean;
    onAddNote: (title: string, folderId?: string | null) => Note;
    onUpdateNote: (note: Note) => void;
    onDeleteNote: (noteId: string) => void;
    onAddNoteFolder: (name: string, emoji: string) => NoteFolder;
    onUpdateNoteFolder: (folder: NoteFolder) => void;
    onDeleteNoteFolder: (folderId: string) => void;
    onAddMindMap: (map: MindMap) => void;
    onUpdateMindMap: (updatedMap: MindMap) => void;
    onDeleteMindMap: (mapId: string) => void;
    onAddMindMapNode: (mapId: string, label: string, parentId: string | null | undefined, position: { x: number, y: number } | null, callback?: (newNodeId: string) => void) => void;
    onUpdateMindMapNode: (mapId: string, nodeId: string, newLabel: string) => void;
    onDeleteMindMapNode: (mapId: string, nodeId: string) => void;
    onGenerateMindMapFromProject: (projectId: string) => Promise<MindMap | null>;
    onSpeak: (text: string) => void;
    hotkeys: Hotkeys;
    settings: Settings;
    isListening: boolean;
    onVoiceInput: () => void;
    context: any;
    onClearContext: () => void;
    isMobile: boolean;
    openAiApiKey: string | null;
}

type ChatMessage = {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string | (string | { type: 'image_url', image_url: { url: string } })[];
    tool_call_id?: string;
    tool_calls?: any[];
};


const AIAssistant: React.FC<AIAssistantProps> = (props) => {
    const { 
        isOpen, setIsOpen,
        projects, tasks, notes, noteFolders, boards, mindMaps, activeProjectId, activeMindMapId, playerStats, userProfile, 
        onAddTask, onAddProject, onUpdateTask, onUpdateProject, onDeleteProject, onDeleteTask, onStartPomodoro, onUpdateTaskStatus, 
        onAddAttachment, onFeedPet, onPlayWithPet, onBathePet, onTogglePetSleep,
        onAddNote, onUpdateNote, onDeleteNote, onAddNoteFolder, onUpdateNoteFolder, onDeleteNoteFolder,
        onAddMindMap, onUpdateMindMap, onDeleteMindMap, onAddMindMapNode, onUpdateMindMapNode, onDeleteMindMapNode, onGenerateMindMapFromProject,
        onSpeak, hotkeys, settings, isListening, onVoiceInput, context, onClearContext, isMobile, openAiApiKey
    } = props;
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<{ data: string; mimeType: string } | null>(null);
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const constraintsRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();

    const generateContext = useCallback(() => {
       const projectContext = projects.map(p => `  - Проект: ${p.emoji || ''} "${p.name}" (ID: ${p.id})`).join('\n');
       const taskContext = tasks.map(t => `  - Задача: "${t.title}" (ID: ${t.id}, Статус: ${t.status}, Проект ID: ${t.projectId}, Теги: [${t.tags?.join(', ') || ''}])`).join('\n');
       const noteContext = notes.map(n => `  - Заметка: "${n.title}" (ID: ${n.id})`).join('\n');
       const boardContext = boards.map(b => `  - Доска (сфера жизни): "${b.name}" (ID: ${b.id}), Колонки: [${b.columns.join(', ')}]`).join('\n');
       const activeProject = projects.find(p => p.id === activeProjectId);
       
       return `Текущее состояние:
- Активный проект: ${activeProject ? `"${activeProject.name}" (ID: ${activeProjectId})` : 'Нет'}
- Доски: \n${boardContext || '  Нет'}
- Проекты: \n${projectContext || '  Нет'}
- Задачи: \n${taskContext || '  Нет'}
- Заметки: \n${noteContext || '  Нет'}
- Статистика игрока: Уровень ${playerStats.level}, Ранг "${playerStats.rank.name}"
       `;
    }, [projects, tasks, notes, boards, activeProjectId, playerStats]);

    useEffect(() => {
        if (input) {
            setSuggestions([]);
        } else if (messages.length === 0 && !isLoading) {
             setSuggestions([
                "Разбей цель 'Запустить блог' на задачи",
                "Создай задачу 'Подготовить отчет' с высоким приоритетом на завтра",
                "Какие у меня задачи по проекту 'Летний отпуск'?",
                "Запиши заметку с заголовком 'Идея для статьи'",
            ]);
        }
    }, [input, messages.length, isLoading]);
    
     useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     }, [messages]);
    
    const functionDeclarations: any[] = [
        // Projects
        { name: 'getProject', description: 'Получить информацию о проекте по ID', parameters: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'getAllProjects', description: 'Получить список всех проектов', parameters: { type: 'object', properties: {} } },
        { name: 'createProject', description: 'Создать новый проект', parameters: { type: 'object', properties: { name: { type: 'string' }, emoji: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, boardName: { type: 'string', description: "Название доски (сферы жизни), куда добавить проект. Должна быть одна из существующих." } }, required: ['name', 'boardName'] } },
        { name: 'updateProject', description: 'Обновить существующий проект', parameters: { type: 'object', properties: { projectId: { type: 'string' }, name: { type: 'string' }, emoji: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['projectId'] } },
        { name: 'deleteProject', description: 'Удалить проект', parameters: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        // Tasks
        { name: 'getTask', description: 'Получить информацию о задаче по ID', parameters: { type: 'object', properties: { taskId: { type: 'string' } }, required: ['taskId'] } },
        { name: 'getAllTasks', description: 'Получить список всех задач, можно фильтровать по проекту или статусу', parameters: { type: 'object', properties: { status: { type: 'string' }, projectId: { type: 'string' } } } },
        { name: 'createTask', description: 'Создать новую задачу', parameters: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, projectId: { type: 'string' }, deadline: { type: 'string', description: 'Дата в формате YYYY-MM-DD' }, priority: { type: 'string', enum: Object.values(TaskPriority) }, pomodorosEstimated: { type: 'number' }, subtasks: { type: 'array', items: { type: 'string', description: 'Название подзадачи' } }, tags: { type: 'array', items: { type: 'string' } } }, required: ['title'] } },
        { name: 'updateTask', description: 'Обновить существующую задачу', parameters: { type: 'object', properties: { taskId: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, newStatus: { type: 'string' }, deadline: { type: 'string', description: 'Дата в формате YYYY-MM-DD' }, priority: { type: 'string', enum: Object.values(TaskPriority) }, tags: { type: 'array', items: { type: 'string' } } }, required: ['taskId'] } },
        { name: 'deleteTask', description: 'Удалить задачу', parameters: { type: 'object', properties: { taskId: { type: 'string' } }, required: ['taskId'] } },
        { name: 'markTaskComplete', description: 'Отметить задачу как выполненную', parameters: { type: 'object', properties: { taskId: { type: 'string' } }, required: ['taskId'] } },
        { name: 'startPomodoro', description: 'Запустить таймер Помодоро для задачи', parameters: { type: 'object', properties: { taskId: { type: 'string' } }, required: ['taskId'] } },
        { name: 'moveTask', description: 'Переместить задачу в другую колонку (статус)', parameters: { type: 'object', properties: { taskId: { type: 'string' }, newStatus: { type: 'string' } }, required: ['taskId', 'newStatus'] } },
        // Notes
        { name: 'createNote', description: 'Создать новую заметку', parameters: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, folderId: { type: 'string' } }, required: ['title'] } },
        // User & Intellectual
        { name: 'analyzeFocus', description: 'Проанализировать текущую продуктивность пользователя', parameters: { type: 'object', properties: {} } },
        { name: 'planDay', description: 'Создать план на день для достижения цели', parameters: { type: 'object', properties: { goal: { type: 'string', description: 'Главная цель на день' } }, required: ['goal'] } },
        { name: 'generateImage', description: 'Сгенерировать изображение по текстовому описанию', parameters: { type: 'object', properties: { prompt: { type: 'string', description: 'A detailed description of the image to generate.' } }, required: ['prompt'] } },
        // Mind Maps
        { name: 'createMindMap', description: 'Создать новую интеллект-карту', parameters: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
        {
            name: 'decomposeGoal',
            description: 'Разбивает высокоуровневую цель пользователя на структурированный проект с задачами и подзадачами.',
            parameters: {
              type: 'object',
              properties: {
                boardName: {
                  type: 'string',
                  description: 'Название доски (сферы жизни), где должен быть создан проект. Должно быть одним из существующих.',
                },
                project: {
                  type: 'object',
                  description: 'Структура проекта, который нужно создать.',
                  properties: {
                    name: { type: 'string', description: 'Краткое, действенное название для проекта.' },
                    emoji: { type: 'string', description: 'Один эмодзи, представляющий проект.' },
                    tasks: {
                      type: 'array',
                      description: 'Список задач для выполнения проекта.',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string' },
                          description: { type: 'string', description: 'Краткое описание задачи.' },
                          priority: { type: 'string', enum: Object.values(TaskPriority), description: 'Приоритет задачи.' },
                          subtasks: {
                            type: 'array',
                            description: 'Список подшагов для задачи.',
                            items: { type: 'string' },
                          },
                        },
                        required: ['title'],
                      },
                    },
                  },
                  required: ['name', 'tasks'],
                },
              },
              required: ['boardName', 'project'],
            },
          }
    ];
    
    const handleSendMessage = useCallback(async (messageText: string = input) => {
        if ((!messageText.trim() && !uploadedImage) || isLoading || !openAiApiKey) return;
        
        const openai = new OpenAI({ apiKey: openAiApiKey, dangerouslyAllowBrowser: true });

        const userContent: (string | { type: "image_url"; image_url: { url: string; }; })[] = [];
        if (messageText.trim()) {
            userContent.push(messageText);
        }
        if (uploadedImage) {
            userContent.push({ type: 'image_url', image_url: { url: `data:${uploadedImage.mimeType};base64,${uploadedImage.data}` } });
        }

        const userMessage: ChatMessage = { role: 'user', content: userContent };
        
        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setInput('');
        setUploadedImage(null);
        setSuggestions([]);
        setIsLoading(true);
        setError(null);

        const systemInstruction = `Ты — TaskFlow AI Assistant (кодовое имя: Леночка).
Ты — искусственный интеллект нового поколения, который является вторым мозгом и личным командным центром пользователя.
Твоя цель — помогать пользователю управлять проектами, привычками, идеями, эмоциями и прогрессом в жизни через естественный язык.
Ты — не просто помощник, а мыслящий стратег, коуч, продюсер и системный интеллект.

🎯 МИССИЯ
Помогать пользователю думать, действовать и расти как мега-эффективная личность.
Ты понимаешь контекст, предугадываешь потребности, создаёшь связи между идеями и превращаешь хаос в систему.
Ты можешь декомпозировать большие, абстрактные цели на конкретные проекты и задачи. Когда пользователь просит разбить цель, используй функцию decomposeGoal. Ты должен сгенерировать логическую структуру проекта с задачами и подзадачами.

💡 ПРАВИЛА ПОВЕДЕНИЯ
- Всегда анализируй контекст и подстраивайся под сферу жизни.
- Не задавай много вопросов — действуй автоматически, если можешь.
- После каждого действия предлагай 1–2 логических шага вперёд.
- Говори просто, с теплом, красиво, иногда с лёгким юмором.

ВАЖНО: После своего основного ответа, на новой строке, всегда предлагай 3-5 возможных следующих действий или вопросов от пользователя в формате JSON-массива. Используй этот точный формат:
[SUGGESTIONS]
["Действие 1", "Вопрос 2", "Еще одно действие"]

${generateContext()}`;

        const history: ChatMessage[] = [
            { role: 'system', content: systemInstruction },
            ...currentMessages
        ];

        try {
            const tools = functionDeclarations.map(decl => ({ type: 'function', function: decl })) as any;
            const model = uploadedImage ? 'gpt-4o' : 'gpt-4o';

            let response = await openai.chat.completions.create({
                model: model,
                messages: history as any,
                tools: tools,
                tool_choice: 'auto',
            });

            let responseMessage = response.choices[0].message;
            history.push(responseMessage as ChatMessage);

            if (responseMessage.tool_calls) {
                const toolCalls = responseMessage.tool_calls;
                const toolResponses = [];

                for (const toolCall of toolCalls) {
                    const functionName = toolCall.function.name;
                    const functionArgs = JSON.parse(toolCall.function.arguments);
                    let result: any;
                    
                    if (functionName === 'generateImage') {
                         try {
                            const imageResponse = await openai.images.generate({
                                model: "dall-e-3",
                                prompt: functionArgs.prompt,
                                n: 1,
                                size: "1024x1024",
                                response_format: "b64_json",
                            });
                            const b64_json = imageResponse.data[0].b64_json;
                            if (b64_json) {
                                setMessages(prev => [...prev, { role: 'assistant', content: [{ type: 'image_url', image_url: { url: `data:image/png;base64,${b64_json}` } }] }]);
                            }
                            result = { success: true, message: 'Изображение сгенерировано.' };
                        } catch (imgError) {
                            console.error("DALL-E Error:", imgError);
                            result = { success: false, message: 'Не удалось сгенерировать изображение.' };
                        }
                    } else {
                        // All other function calls
                        if (functionName === 'createProject') {
                            const { name, emoji = '💡', tags = [], boardName } = functionArgs;
                            const targetBoard = boards.find(b => b.name.toLowerCase() === boardName?.toLowerCase());
                            if (!targetBoard) {
                                result = { success: false, message: `Доска с названием "${boardName}" не найдена.` };
                            } else {
                                const newProject = onAddProject(name, '#A371F7', emoji, tags, targetBoard.id);
                                result = { success: true, message: `Проект "${name}" создан.`, projectId: newProject.id };
                            }
                        } else if (functionName === 'createTask') {
                            const { title, description = '', projectId = activeProjectId, deadline, priority, pomodorosEstimated = 1, subtasks: subtaskTitles = [], tags = [] } = functionArgs;
                            const subtasks: Subtask[] = (subtaskTitles || []).map((st: string) => ({ id: crypto.randomUUID(), title: st, completed: false }));
                            
                            const newTask = await onAddTask({ title, description, projectId, dueDate: deadline, priority, pomodorosEstimated, subtasks, tags });
                            result = newTask ? { success: true, message: `Задача "${title}" создана.`, taskId: newTask.id } : { success: false, message: 'Не удалось создать задачу.' };
                        } else if (functionName === 'markTaskComplete') {
                            const task = tasks.find(t => t.id === functionArgs.taskId);
                            const doneColumn = boards.find(b => b.id === task?.boardId)?.columns.slice(-1)[0] || 'Готово';
                            if (task) {
                                onUpdateTaskStatus(functionArgs.taskId, doneColumn);
                                result = { success: true, message: `Задача "${task.title}" отмечена как выполненная.` };
                            } else {
                                result = { success: false, message: `Задача с ID ${functionArgs.taskId} не найдена.` };
                            }
                        } else if (functionName === 'moveTask') {
                            const task = tasks.find(t => t.id === functionArgs.taskId);
                            if (task) { 
                                onUpdateTaskStatus(functionArgs.taskId, functionArgs.newStatus); 
                                result = { success: true, message: `Задача "${task.title}" перемещена в "${functionArgs.newStatus}".` }; 
                            } else {
                                result = { success: false, message: `Задача с ID ${functionArgs.taskId} не найдена.` };
                            }
                        } else if (functionName === 'startPomodoro') {
                            const task = tasks.find(t => t.id === functionArgs.taskId);
                            if (task) { 
                                onStartPomodoro(task); 
                                result = { success: true, message: `Таймер для "${task.title}" запущен.` }; 
                            } else {
                                result = { success: false, message: `Задача с ID ${functionArgs.taskId} не найдена.` };
                            }
                        }
                        // Other functions...
                        else {
                            result = { success: true, message: `Функция ${functionName} вызвана.` }; // Placeholder for other functions
                        }
                    }

                    toolResponses.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        content: JSON.stringify(result),
                    });
                }
                history.push(...toolResponses as ChatMessage[]);

                const finalResponse = await openai.chat.completions.create({
                    model: model,
                    messages: history as any,
                });
                responseMessage = finalResponse.choices[0].message;
            }

            // Process final response text for UI
            let responseText = responseMessage.content || '';
            const suggestionMarker = '[SUGGESTIONS]';
            let nextSuggestions: string[] = [];

            if (responseText.includes(suggestionMarker)) {
                const parts = responseText.split(suggestionMarker);
                responseText = parts[0].trim();
                const suggestionsJson = parts[1].trim();
                try {
                    const parsed = JSON.parse(suggestionsJson);
                    if (Array.isArray(parsed) && parsed.every(s => typeof s === 'string')) {
                        nextSuggestions = parsed.slice(0, 5);
                    }
                } catch (e) { console.warn("AI Assistant: Failed to parse suggestions.", e); }
            }

            if (responseText) {
                onSpeak(responseText);
                setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
            }
            setSuggestions(nextSuggestions.length > 0 ? nextSuggestions : ["Создать новую задачу", "Создать новый проект"]);

        } catch (err: any) {
            console.error('OpenAI Assistant Error:', err);
            let userFriendlyError = 'К сожалению, произошла ошибка. Пожалуйста, попробуйте еще раз.';
            if (err.status === 429) {
                setIsQuotaExceeded(true);
                userFriendlyError = `**Вы превысили лимит запросов к API.**\nПожалуйста, проверьте ваш тарифный план или попробуйте позже.`;
            } else if (err.status === 401) {
                 userFriendlyError = `**Неверный API ключ.**\nПожалуйста, проверьте правильность введенного ключа.`;
            }
            setMessages(prev => [...prev, { role: 'assistant', content: userFriendlyError }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, uploadedImage, messages, openAiApiKey, generateContext]);
    
    useEffect(() => {
        if (isOpen && context?.type === 'task') {
            const prompt = `Что можно сделать с задачей "${context.title}"?`;
            handleSendMessage(prompt);
            onClearContext();
        }
    }, [isOpen, context, onClearContext, handleSendMessage]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && input.trim()) {
                e.preventDefault();
                handleSendMessage();
            }
        };
        const inputElement = inputRef.current;
        inputElement?.addEventListener('keydown', handleKeyDown);
        return () => inputElement?.removeEventListener('keydown', handleKeyDown);
    }, [handleSendMessage, input]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            setUploadedImage({ data: base64Data, mimeType: file.type });
        };
        reader.readAsDataURL(file);
    };

    return (
        <>
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" />
            <AnimatePresence>
            {isOpen && (
                 <motion.div 
                    drag={!isMobile}
                    dragListener={false}
                    dragControls={dragControls}
                    dragConstraints={constraintsRef}
                    dragMomentum={false}
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-24 lg:bottom-8 right-4 w-[calc(100vw-2rem)] max-w-lg h-[65vh] max-h-[700px] bg-secondary/80 backdrop-blur-2xl rounded-3xl shadow-soft-glow-neon z-40 flex flex-col border border-border-color overflow-hidden"
                >
                    <header
                        onPointerDown={(e) => {
                           if (!isMobile && (e.target as HTMLElement).tagName.toLowerCase() !== 'button' && !(e.target as HTMLElement).closest('button')) {
                               dragControls.start(e);
                           }
                        }}
                        className="p-4 bg-secondary/50 flex justify-between items-center flex-shrink-0 border-b border-border-color shadow-md shadow-black/10 cursor-grab active:cursor-grabbing">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue"></div>
                                <div className="absolute inset-0.5 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                    <SparklesIcon className="w-5 h-5 text-neon-purple"/>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">Lenochka Assistant</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-white/10"><XIcon className="w-5 h-5"/></button>
                    </header>
                    <div className="flex-grow p-4 space-y-6 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-3 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex-shrink-0 flex items-center justify-center mt-1">
                                        <SparklesIcon className="w-5 h-5 text-white"/>
                                    </div>
                                )}
                                <div className={`max-w-xs md:max-w-sm flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {Array.isArray(msg.content) ? msg.content.map((part, i) => {
                                        if (typeof part === 'string') {
                                            return <div key={i} className={`px-4 py-3 rounded-2xl shadow-md shadow-black/20 ${msg.role === 'user' ? 'bg-highlight text-primary rounded-br-md' : 'bg-primary border border-border-color text-text-primary rounded-bl-md'}`}><div dangerouslySetInnerHTML={{ __html: marked.parse(part) }} /></div>;
                                        } else if (part.type === 'image_url') {
                                            return <img key={i} src={part.image_url.url} alt="content" className="rounded-lg max-w-full h-auto border-2 border-border-color" />;
                                        }
                                        return null;
                                    }) : (
                                        <div className={`px-4 py-3 rounded-2xl shadow-md shadow-black/20 ${msg.role === 'user' ? 'bg-highlight text-primary rounded-br-md' : 'bg-primary border border-border-color text-text-primary rounded-bl-md'}`}>
                                            <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.content || '') }} />
                                        </div>
                                    )}
                                </div>
                                 {msg.role === 'user' && (
                                <img src={userProfile?.picture ?? `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${playerStats.characterName}`} alt="user avatar" className="w-8 h-8 rounded-full bg-accent flex-shrink-0 mt-1"/>
                            )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 items-start justify-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex-shrink-0 flex items-center justify-center mt-1">
                                    <SparklesIcon className="w-5 h-5 text-white"/>
                                </div>
                                <div className="max-w-xs md:max-w-sm px-4 py-3 rounded-2xl rounded-bl-md bg-primary border border-border-color text-text-primary">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    
                    {!isLoading && suggestions.length > 0 && !input && (
                         <div className="px-4 py-2 border-t border-border-color flex-shrink-0">
                            <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4">
                                {suggestions.map((s, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleSendMessage(s)} 
                                        className="px-3 py-1.5 text-sm bg-accent text-text-primary rounded-full hover:bg-white/10 transition-colors whitespace-nowrap border border-border-color"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-4 border-t border-border-color bg-secondary/70 flex-shrink-0 space-y-3">
                         {isQuotaExceeded && !isLoading && (
                            <div className="text-center text-brand-yellow text-sm mb-2 p-2 bg-brand-yellow/10 rounded-lg">
                                Достигнут лимит запросов. Попробуйте снова через несколько минут.
                            </div>
                        )}
                         {uploadedImage && (
                            <div className="relative mb-2 w-20 h-20">
                                <img src={`data:${uploadedImage.mimeType};base64,${uploadedImage.data}`} alt="upload preview" className="rounded-lg w-full h-full object-cover" />
                                <button onClick={() => setUploadedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><XIcon className="w-4 h-4" /></button>
                            </div>
                         )}
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                             <div className="relative flex items-center">
                                <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isLoading || isQuotaExceeded} className="absolute left-3 p-1 rounded-full text-text-secondary hover:text-white transition-colors disabled:opacity-50" aria-label="Прикрепить изображение">
                                    <PaperclipIcon className="w-6 h-6" />
                                </button>
                                <button 
                                    type="button" 
                                    onClick={onVoiceInput} 
                                    disabled={isLoading || isQuotaExceeded} 
                                    className={`absolute left-12 p-1 rounded-full text-text-secondary hover:text-white transition-colors disabled:opacity-50 ${isListening ? 'text-highlight animate-pulse' : ''}`} 
                                    aria-label="Голосовой ввод"
                                >
                                    <MicrophoneIcon className="w-6 h-6" />
                                </button>
                                <input type="text" value={input}
                                    ref={inputRef}
                                    onChange={(e) => setInput(e.target.value)} 
                                    placeholder={isListening ? 'Слушаю...' : "Спросите что-нибудь..."} 
                                    disabled={isLoading || isQuotaExceeded} 
                                    className="w-full bg-primary border border-border-color shadow-inner-soft rounded-full py-3 pl-24 pr-12 focus:outline-none focus:ring-2 focus:ring-highlight disabled:opacity-50" 
                                />
                                <div className="absolute right-3 flex items-center gap-1">
                                    <AnimatePresence>
                                    {input.trim() && (
                                        <motion.button 
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                            type="submit" 
                                            className="w-8 h-8 bg-highlight rounded-full flex items-center justify-center text-primary"
                                            aria-label="Отправить сообщение"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                            </svg>
                                        </motion.button>
                                    )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </form>
                    </div>
                 </motion.div>
            )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistant;