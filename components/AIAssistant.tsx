import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Modality, GenerateContentResponse, Part } from '@google/genai';
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
}

type ChatMessage = {
    role: 'user' | 'model' | 'function';
    parts: Part[];
};

const formatText = (text: string) => {
    if (typeof text !== 'string') {
        return '';
    }
    return text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^\*\*]+)\*\*/g, '$1').replace(/\*([^\*]+)\*/g, '$1');
};

const AIAssistant: React.FC<AIAssistantProps> = (props) => {
    const { 
        isOpen, setIsOpen,
        projects, tasks, notes, noteFolders, boards, mindMaps, activeProjectId, activeMindMapId, playerStats, userProfile, 
        onAddTask, onAddProject, onUpdateTask, onUpdateProject, onDeleteProject, onDeleteTask, onStartPomodoro, onUpdateTaskStatus, 
        onAddAttachment, onFeedPet, onPlayWithPet, onBathePet, onTogglePetSleep,
        onAddNote, onUpdateNote, onDeleteNote, onAddNoteFolder, onUpdateNoteFolder, onDeleteNoteFolder,
        onAddMindMap, onUpdateMindMap, onDeleteMindMap, onAddMindMapNode, onUpdateMindMapNode, onDeleteMindMapNode, onGenerateMindMapFromProject,
        onSpeak, hotkeys, settings, isListening, onVoiceInput, context, onClearContext
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
    
    const functionDeclarations: FunctionDeclaration[] = [
        // Projects
        { name: 'getProject', parameters: { type: Type.OBJECT, properties: { projectId: { type: Type.STRING } }, required: ['projectId'] } },
        { name: 'getAllProjects', parameters: { type: Type.OBJECT, properties: {} } },
        { name: 'createProject', parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, emoji: { type: Type.STRING }, tags: { type: Type.ARRAY, items: { type: Type.STRING } }, boardName: { type: Type.STRING, description: "The name of the board (area of life) to add the project to. Must be one of the existing boards." } }, required: ['name', 'boardName'] } },
        { name: 'updateProject', parameters: { type: Type.OBJECT, properties: { projectId: { type: Type.STRING }, name: { type: Type.STRING }, emoji: { type: Type.STRING }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['projectId'] } },
        { name: 'deleteProject', parameters: { type: Type.OBJECT, properties: { projectId: { type: Type.STRING } }, required: ['projectId'] } },
        // Tasks
        { name: 'getTask', parameters: { type: Type.OBJECT, properties: { taskId: { type: Type.STRING } }, required: ['taskId'] } },
        { name: 'getAllTasks', parameters: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, projectId: { type: Type.STRING } } } },
        { name: 'createTask', parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, projectId: { type: Type.STRING }, deadline: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' }, priority: { type: Type.STRING, enum: Object.values(TaskPriority) }, pomodorosEstimated: { type: Type.NUMBER }, subtasks: { type: Type.ARRAY, items: { type: Type.STRING, description: 'Title of the subtask' } }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['title'] } },
        { name: 'updateTask', parameters: { type: Type.OBJECT, properties: { taskId: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, newStatus: { type: Type.STRING }, deadline: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' }, priority: { type: Type.STRING, enum: Object.values(TaskPriority) }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['taskId'] } },
        { name: 'deleteTask', parameters: { type: Type.OBJECT, properties: { taskId: { type: Type.STRING } }, required: ['taskId'] } },
        { name: 'markTaskComplete', parameters: { type: Type.OBJECT, properties: { taskId: { type: Type.STRING } }, required: ['taskId'] } },
        { name: 'setTaskDeadline', parameters: { type: Type.OBJECT, properties: { taskId: { type: Type.STRING }, deadline: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' } }, required: ['taskId', 'deadline'] } },
        { name: 'getTaskSubtasks', parameters: { type: Type.OBJECT, properties: { taskId: { type: Type.STRING } }, required: ['taskId'] } },
        { name: 'startPomodoro', parameters: { type: Type.OBJECT, properties: { taskId: { type: Type.STRING } }, required: ['taskId'] } },
        { name: 'moveTask', parameters: { type: Type.OBJECT, properties: { taskId: { type: Type.STRING }, newStatus: { type: Type.STRING } }, required: ['taskId', 'newStatus'] } },
        // Notes
        { name: 'getNote', parameters: { type: Type.OBJECT, properties: { noteId: { type: Type.STRING } }, required: ['noteId'] } },
        { name: 'getAllNotes', parameters: { type: Type.OBJECT, properties: { folderId: { type: Type.STRING } } } },
        { name: 'createNote', parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING }, folderId: { type: Type.STRING } }, required: ['title'] } },
        { name: 'updateNote', parameters: { type: Type.OBJECT, properties: { noteId: { type: Type.STRING }, title: { type: Type.STRING }, content: { type: Type.STRING }, folderId: { type: Type.STRING } }, required: ['noteId'] } },
        { name: 'deleteNote', parameters: { type: Type.OBJECT, properties: { noteId: { type: Type.STRING } }, required: ['noteId'] } },
        { name: 'summarizeNote', parameters: { type: Type.OBJECT, properties: { noteId: { type: Type.STRING } }, required: ['noteId'] } },
        { name: 'expandNote', parameters: { type: Type.OBJECT, properties: { noteId: { type: Type.STRING } }, required: ['noteId'] } },
        { name: 'tagNote', parameters: { type: Type.OBJECT, properties: { noteId: { type: Type.STRING } }, required: ['noteId'] } },
        { name: 'analyzeAndLinkNote', parameters: { type: Type.OBJECT, properties: { noteId: { type: Type.STRING } }, required: ['noteId'] } },
        { name: 'generateNewIdeasFromNote', parameters: { type: Type.OBJECT, properties: { noteId: { type: Type.STRING }, count: { type: Type.NUMBER, description: 'Number of new ideas to generate' } }, required: ['noteId'] } },
        // User & Intellectual
        { name: 'getUserStats', parameters: { type: Type.OBJECT, properties: {} } },
        { name: 'analyzeFocus', parameters: { type: Type.OBJECT, properties: {} } },
        { name: 'planDay', parameters: { type: Type.OBJECT, properties: { goal: { type: Type.STRING, description: 'Главная цель на день' } }, required: ['goal'] } },
        { name: 'getMotivation', parameters: { type: Type.OBJECT, properties: {} } },
        { name: 'generateContent', parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING } }, required: ['prompt'] } },
        { name: 'suggestNextSteps', parameters: { type: Type.OBJECT, properties: { entityId: { type: Type.STRING }, entityType: { type: Type.STRING, enum: ['project', 'task', 'note'] } }, required: ['entityId', 'entityType'] } },
        { name: 'logAction', parameters: { type: Type.OBJECT, properties: { description: { type: Type.STRING, description: 'Description of the completed action, e.g., "Отжался 10 раз"' }, areaName: { type: Type.STRING, description: 'The area of life this action belongs to, e.g., "Здоровье / спорт"' } }, required: ['description', 'areaName'] } },
        // Images
        { name: 'generateImage', parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING, description: 'A detailed description of the image to generate.' } }, required: ['prompt'] } },
        // Mind Maps
        { name: 'createMindMap', parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ['name'] } },
        { name: 'getMindMap', parameters: { type: Type.OBJECT, properties: { mapId: { type: Type.STRING } }, required: ['mapId'] } },
        { name: 'getAllMindMaps', parameters: { type: Type.OBJECT, properties: {} } },
        { name: 'addMindMapNode', parameters: { type: Type.OBJECT, properties: { mapId: { type: Type.STRING, description: 'Optional. ID of the map. If not provided, the active map will be used.' }, label: { type: Type.STRING }, parentId: { type: Type.STRING } }, required: ['label'] } },
        { name: 'updateMindMapNode', parameters: { type: Type.OBJECT, properties: { mapId: { type: Type.STRING, description: 'Optional. ID of the map. If not provided, the active map will be used.' }, nodeId: { type: Type.STRING }, newLabel: { type: Type.STRING } }, required: ['nodeId', 'newLabel'] } },
        { name: 'deleteMindMapNode', parameters: { type: Type.OBJECT, properties: { mapId: { type: Type.STRING, description: 'Optional. ID of the map. If not provided, the active map will be used.' }, nodeId: { type: Type.STRING } }, required: ['nodeId'] } },
        { name: 'deleteMindMap', parameters: { type: Type.OBJECT, properties: { mapId: { type: Type.STRING } }, required: ['mapId'] } },
        { name: 'generateMindMapFromProject', parameters: { type: Type.OBJECT, properties: { projectId: { type: Type.STRING } }, required: ['projectId'] } },
        {
            name: 'decomposeGoal',
            description: 'Breaks down a high-level user goal into a structured project with tasks and subtasks.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                boardName: {
                  type: Type.STRING,
                  description: 'The name of the board (area of life) where the project should be created. Must be one of the existing boards.',
                },
                project: {
                  type: Type.OBJECT,
                  description: 'The project structure to be created.',
                  properties: {
                    name: { type: Type.STRING, description: 'A concise, actionable name for the project.' },
                    emoji: { type: Type.STRING, description: 'A single emoji that represents the project.' },
                    tasks: {
                      type: Type.ARRAY,
                      description: 'A list of tasks to accomplish the project.',
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          description: { type: Type.STRING, description: 'A brief description of the task.' },
                          priority: { type: Type.STRING, enum: Object.values(TaskPriority), description: 'Priority of the task.' },
                          subtasks: {
                            type: Type.ARRAY,
                            description: 'A list of sub-steps for the task.',
                            items: { type: Type.STRING },
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
    
    const handleToolCall = async (call: any): Promise<any> => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const { noteId, goal, prompt: genPrompt, entityId, entityType } = call.args;
        
        switch (call.name) {
            case 'summarizeNote': {
                const note = notes.find(n => n.id === (noteId as string));
                if (!note) return { success: false, message: 'Заметка не найдена.' };
                
                const prompt = `Сделай краткое summary (одно-два предложения) для этой заметки: "${note.title}\n${note.content}"`;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                const summary = response.text.trim();
                const newContent = `> **Summary:** ${summary}\n\n---\n\n${note.content}`;
                onUpdateNote({ ...note, content: newContent });
                return { success: true, message: `Summary добавлено к заметке "${note.title}".` };
            }
            case 'expandNote': {
                const note = notes.find(n => n.id === (noteId as string));
                if (!note) return { success: false, message: 'Заметка не найдена.' };
                const prompt = `Развей идею из этой заметки: "${note.title}\n${note.content}"`;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                return { success: true, content: response.text };
            }
            case 'tagNote': {
                const note = notes.find(n => n.id === (noteId as string));
                if (!note) return { success: false, message: 'Заметка не найдена.' };
                
                const prompt = `Предложи 3-5 релевантных тега для этой заметки в формате JSON-массива строк. Заметка: "${note.title}\n${note.content}"`;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                
                try {
                    const cleanedResponse = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const newTags = JSON.parse(cleanedResponse);
                    if (Array.isArray(newTags) && newTags.every(t => typeof t === 'string')) {
                        const currentTags = new Set(note.tags || []);
                        newTags.forEach(tag => currentTags.add(tag.toLowerCase().replace(/\s/g, '-')));
                        onUpdateNote({ ...note, tags: Array.from(currentTags) });
                        return { success: true, message: `Теги добавлены к заметке "${note.title}".` };
                    } else {
                        throw new Error("Invalid tag format");
                    }
                } catch (e) {
                     return { success: false, message: 'Не удалось сгенерировать теги в правильном формате. Попробуйте снова.' };
                }
            }
             case 'analyzeAndLinkNote': {
                const note = notes.find(n => n.id === (noteId as string));
                if (!note) return { success: false, message: 'Заметка не найдена.' };
                const otherNoteTitles = notes.filter(n => n.id !== note.id && n.title.trim()).map(n => n.title);
                if (otherNoteTitles.length === 0) return { success: true, message: 'Нет других заметок для связывания.' };

                const prompt = `Проанализируй текст заметки. Найди в нем упоминания следующих названий других заметок: [${otherNoteTitles.join(', ')}]. Оборачивай все найденные точные совпадения в [[двойные квадратные скобки]]. Лучше создать лишнюю ссылку, чем пропустить существующую. Верни только измененный текст заметки, без каких-либо объяснений. Исходный текст:\n\n---\n\n${note.content}`;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                onUpdateNote({ ...note, content: response.text });
                return { success: true, message: `Проанализирована и связана заметка "${note.title}".` };
            }

            case 'generateNewIdeasFromNote': {
                const note = notes.find(n => n.id === (noteId as string));
                if (!note) return { success: false, message: 'Заметка не найдена.' };
                const count = (call.args.count as number) || 3;

                const prompt = `На основе следующей заметки сгенерируй ${count} новые, связанные по смыслу, но самостоятельные идеи. Для каждой идеи придумай заголовок и краткое содержание. Верни результат в формате JSON-массива объектов, где каждый объект имеет поля "title" и "content".\n\nИсходная заметка: "${note.title}"\n${note.content}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    content: { type: Type.STRING }
                                },
                                required: ['title', 'content']
                            }
                        }
                    }
                });
                const newIdeas = JSON.parse(response.text.trim());
                if (Array.isArray(newIdeas)) {
                    newIdeas.forEach(idea => {
                        const newNote = onAddNote(idea.title, note.folderId);
                        onUpdateNote({ ...newNote, content: idea.content });
                    });
                    return { success: true, message: `Создано ${newIdeas.length} новые идеи на основе заметки "${note.title}".` };
                }
                return { success: false, message: 'Не удалось сгенерировать новые идеи.' };
            }

            case 'analyzeFocus':
                const completedTasks = tasks.filter(t => t.status === 'Готово').length;
                const analysisPrompt = `Проанализируй продуктивность пользователя. Выполнено задач: ${completedTasks}. Всего задач: ${tasks.length}. Уровень: ${playerStats.level}. Дай краткий, позитивный анализ.`;
                const analysisResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: analysisPrompt });
                return { success: true, analysis: analysisResponse.text };

            case 'planDay':
                 const planPrompt = `Создай простой план из 3-5 задач для достижения цели: "${goal as string}".`;
                 const planResponse = await ai.models.generateContent({
                     model: 'gemini-2.5-flash',
                     contents: planPrompt,
                     config: {
                         responseMimeType: "application/json",
                         responseSchema: {
                             type: Type.ARRAY,
                             items: {
                                 type: Type.OBJECT,
                                 properties: {
                                     title: { type: Type.STRING, description: 'Название задачи' },
                                     description: { type: Type.STRING, description: 'Описание задачи' }
                                 },
                                 required: ['title', 'description']
                             }
                         }
                     }
                 });
                 const planTasks = JSON.parse(planResponse.text.trim());
                 for (const task of planTasks) {
                     await onAddTask({ ...task, pomodorosEstimated: 1, projectId: activeProjectId });
                 }
                 return { success: true, message: `План для цели "${goal as string}" создан.` };
            
            case 'getMotivation':
                 const motivationResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'Дай короткую, мощную мотивационную цитату.' });
                 return { success: true, quote: motivationResponse.text };
            
            case 'generateContent':
                const genContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: genPrompt });
                return { success: true, content: genContentResponse.text };

            case 'suggestNextSteps':
                let context = '';
                if (entityType === 'project') {
                    const project = projects.find(p => p.id === entityId);
                    if (project) context = `Проект: "${project.name}". Текущие задачи: ${tasks.filter(t => t.projectId === entityId).map(t => `"${t.title}"`).join(', ')}`;
                } else if (entityType === 'task') {
                    const task = tasks.find(t => t.id === entityId);
                    if (task) context = `Задача: "${task.title}". Описание: "${task.description}".`;
                } else if (entityType === 'note') {
                    const note = notes.find(n => n.id === entityId);
                    if (note) context = `Заметка: "${note.title}\n${note.content.substring(0, 100)}..."`;
                }
                
                if (!context) return { success: false, message: 'Сущность не найдена.' };

                const suggestionsPrompt = `Основываясь на этом, предложи 3 следующих конкретных шага в формате JSON-массива строк. Контекст: ${context}`;
                const suggestionsResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: suggestionsPrompt });
                return { success: true, suggestions: suggestionsResponse.text };

            default:
                return { success: false, message: 'Неизвестная сложная функция.' };
        }
    };

    const handleSendMessage = useCallback(async (messageText: string = input) => {
        if ((!messageText.trim() && !uploadedImage) || isLoading) return;
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const userParts: Part[] = [];
        if (messageText.trim()) {
            userParts.push({ text: messageText });
        }
        if (uploadedImage) {
            userParts.push({ inlineData: uploadedImage });
        }

        const userMessage: ChatMessage = { role: 'user', parts: userParts };
        
        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setInput('');
        setUploadedImage(null);
        setSuggestions([]);
        setIsLoading(true);

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

        const defaultSuggestions = ["Создать новую задачу", "Создать новый проект", "Какой мой текущий фокус?", "Покажи мои заметки"];

        const processModelResponse = (modelResponse: GenerateContentResponse, previousMessages: ChatMessage[]) => {
            const modelResponseParts = [...(modelResponse.candidates?.[0]?.content?.parts || [])];
            let responseText = modelResponse.text || '';

            if (responseText) {
                onSpeak(responseText);
            }

            const suggestionMarker = '[SUGGESTIONS]';
            let nextSuggestions: string[] = [];

            if (responseText.includes(suggestionMarker)) {
                const textParts = responseText.split(suggestionMarker);
                responseText = textParts[0].trim();
                const suggestionsJson = textParts[1].trim();
                try {
                    const parsed = JSON.parse(suggestionsJson);
                    if (Array.isArray(parsed) && parsed.every(s => typeof s === 'string')) {
                        nextSuggestions = parsed.slice(0, 5);
                    }
                } catch (e) {
                    console.warn("AI Assistant: Failed to parse suggestions.", e);
                }
            }

            const textPartIndex = modelResponseParts.findIndex(p => 'text' in p);
            if (textPartIndex > -1) {
                (modelResponseParts[textPartIndex] as { text: string }).text = responseText;
            } else if (responseText) {
                modelResponseParts.push({ text: responseText });
            }

            const modelTurn: ChatMessage = { role: 'model', parts: modelResponseParts };
            setMessages([...previousMessages, modelTurn]);

            setSuggestions(nextSuggestions.length > 0 ? nextSuggestions : defaultSuggestions);
        };

        try {
            let model = 'gemini-2.5-flash';
            const config: any = { tools: [{ functionDeclarations }], systemInstruction };

            if (uploadedImage) {
                model = 'gemini-2.5-flash-image';
            }

            const response = await ai.models.generateContent({
                model,
                contents: currentMessages,
                config,
            });

            const call = response.functionCalls?.[0];
            
            if (call?.name === 'generateImage') {
                const modelTurnWithToolCall: ChatMessage = { role: 'model', parts: [{ functionCall: call }]};
                const tempMessages = [...currentMessages, modelTurnWithToolCall];
                setMessages(tempMessages);

                const imagePrompt = call.args.prompt as string;
                const imageResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: imagePrompt }] },
                    config: { responseModalities: [Modality.IMAGE] },
                });
                
                const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                if (imagePart?.inlineData) {
                    const imageMessage: ChatMessage = { role: 'model', parts: [{ inlineData: imagePart.inlineData }] };
                    setMessages([...tempMessages, imageMessage]);
                } else {
                    throw new Error("Image data not found in response.");
                }
                setSuggestions(defaultSuggestions);

            } else if (call) {
                const modelTurnWithToolCall: ChatMessage = { role: 'model', parts: [{ functionCall: call }]};
                let result: any;
                const functionName = call.name;
                const args = call.args;

                // READ functions
                if (functionName === 'getProject') {
                    const project = projects.find(p => p.id === (args.projectId as string));
                    result = project ? { success: true, project } : { success: false, message: 'Проект не найден.' };
                } else if (functionName === 'getAllProjects') {
                    result = { success: true, projects };
                } else if (functionName === 'getTask') {
                    const task = tasks.find(t => t.id === (args.taskId as string));
                    result = task ? { success: true, task } : { success: false, message: 'Задача не найдена.' };
                } else if (functionName === 'getAllTasks') {
                    let filteredTasks = tasks;
                    if (args.projectId) filteredTasks = filteredTasks.filter(t => t.projectId === (args.projectId as string));
                    if (args.status) filteredTasks = filteredTasks.filter(t => t.status === (args.status as string));
                    result = { success: true, tasks: filteredTasks };
                } else if (functionName === 'getTaskSubtasks') {
                    const task = tasks.find(t => t.id === (args.taskId as string));
                    result = task ? { success: true, subtasks: task.subtasks } : { success: false, message: 'Задача не найдена.' };
                } else if (functionName === 'getNote') {
                    const note = notes.find(n => n.id === (args.noteId as string));
                    result = note ? { success: true, note } : { success: false, message: 'Заметка не найдена.' };
                } else if (functionName === 'getAllNotes') {
                    let filteredNotes = notes;
                    if (args.folderId) filteredNotes = filteredNotes.filter(n => n.folderId === (args.folderId as string));
                    result = { success: true, notes: filteredNotes };
                } else if (functionName === 'getUserStats') {
                    result = { success: true, stats: playerStats };
                }
                 // MIND MAP read functions
                else if (functionName === 'getMindMap') {
                    const map = mindMaps.find(m => m.id === (args.mapId as string));
                    result = map ? { success: true, mindMap: map } : { success: false, message: 'Mind map not found.' };
                } else if (functionName === 'getAllMindMaps') {
                    result = { success: true, mindMaps: mindMaps.map(m => ({ id: m.id, name: m.name })) };
                }
                // WRITE functions
                else if (functionName === 'createProject') {
                    const { name, emoji = '💡', tags = [], boardName } = args;
                    const targetBoard = boards.find(b => b.name.toLowerCase() === (boardName as string)?.toLowerCase());
                    if (!targetBoard) {
                        result = { success: false, message: `Board named "${boardName as string}" not found.` };
                    } else {
                        const newProject = onAddProject(name as string, '#A371F7', emoji as string, tags as string[], targetBoard.id);
                        result = { success: true, message: `Проект "${name as string}" создан.`, projectId: newProject.id };
                    }
                } else if (functionName === 'updateProject') {
                    const project = projects.find(p => p.id === (args.projectId as string));
                    if (project) {
                        const updatedProject = {
                            ...project,
                            name: (args.name as string) ?? project.name,
                            emoji: (args.emoji as string) ?? project.emoji,
                            tags: (args.tags as string[]) ?? project.tags,
                        };
                        onUpdateProject(updatedProject);
                        result = { success: true, message: 'Проект обновлен.' };
                    } else {
                        result = { success: false, message: 'Проект не найден.' };
                    }
                } else if (functionName === 'deleteProject') {
                    onDeleteProject(args.projectId as string);
                    result = { success: true, message: 'Проект удален.' };
                } else if (functionName === 'createTask') {
                    const { title, description = '', projectId = activeProjectId, deadline, priority, pomodorosEstimated = 1, subtasks: subtaskTitles = [], tags = [] } = args;
                    const subtasks: Subtask[] = (subtaskTitles as string[]).map(st => ({ id: crypto.randomUUID(), title: st, completed: false }));
                    
                    const newTask = await onAddTask({ title: title as string, description: description as string, projectId: projectId as string, dueDate: deadline as string, priority: priority as TaskPriority, pomodorosEstimated: pomodorosEstimated as number, subtasks, tags: tags as string[] });
                    result = newTask ? { success: true, message: `Задача "${title as string}" создана.`, taskId: newTask.id } : { success: false, message: 'Не удалось создать задачу.' };
                } else if (functionName === 'updateTask') {
                    const task = tasks.find(t => t.id === (args.taskId as string));
                    if (task) {
                        const updatedTask = {
                            ...task,
                            title: (args.title as string) ?? task.title,
                            description: (args.description as string) ?? task.description,
                            status: (args.newStatus as string) ?? task.status,
                            dueDate: (args.deadline as string) ?? task.dueDate,
                            priority: (args.priority as TaskPriority) ?? task.priority,
                            tags: (args.tags as string[]) ?? task.tags,
                        };
                        onUpdateTask(updatedTask);
                        result = { success: true, message: 'Задача обновлена.' };
                    } else {
                        result = { success: false, message: 'Задача не найдена.' };
                    }
                } else if (functionName === 'deleteTask') {
                    onDeleteTask(args.taskId as string);
                    result = { success: true, message: 'Задача удалена.' };
                } else if (functionName === 'markTaskComplete') {
                    const task = tasks.find(t => t.id === (args.taskId as string));
                    const doneColumn = boards.find(b => b.id === task?.boardId)?.columns.slice(-1)[0] || 'Готово';
                    if (task) {
                        onUpdateTaskStatus(args.taskId as string, doneColumn);
                        result = { success: true, message: `Задача "${task.title}" отмечена как выполненная.` };
                    } else {
                        result = { success: false, message: `Задача с ID ${args.taskId as string} не найдена.` };
                    }
                } else if (functionName === 'setTaskDeadline') {
                    const task = tasks.find(t => t.id === (args.taskId as string));
                    if (task) {
                        onUpdateTask({ ...task, dueDate: args.deadline as string });
                        result = { success: true, message: `Срок для задачи "${task.title}" установлен.` };
                    } else {
                        result = { success: false, message: 'Задача не найдена.' };
                    }
                } else if (functionName === 'startPomodoro') {
                    const task = tasks.find(t => t.id === (args.taskId as string));
                    if (task) { onStartPomodoro(task); result = { success: true, message: `Таймер для "${task.title}" запущен.` }; }
                    else result = { success: false, message: `Задача с ID ${args.taskId as string} не найдена.` };
                } else if (functionName === 'moveTask') {
                    const task = tasks.find(t => t.id === (args.taskId as string));
                    if (task) { onUpdateTaskStatus(args.taskId as string, args.newStatus as string); result = { success: true, message: `Задача "${task.title}" перемещена в "${args.newStatus as string}".` }; }
                    else result = { success: false, message: `Задача с ID ${args.taskId as string} не найдена.` };
                } else if (functionName === 'createNote') {
                    const { title, content = '', folderId = null } = args;
                    const newNote = onAddNote(title as string, folderId as string | null);
                    if (content) {
                        onUpdateNote({ ...newNote, content: content as string });
                    }
                    result = { success: true, message: 'Заметка создана.', noteId: newNote.id };
                } else if (functionName === 'updateNote') {
                    const note = notes.find(n => n.id === (args.noteId as string));
                    if (note) {
                        const updatedNote = { ...note, title: (args.title as string) ?? note.title, content: (args.content as string) ?? note.content, folderId: (args.folderId as string) ?? note.folderId };
                        onUpdateNote(updatedNote);
                        result = { success: true, message: 'Заметка обновлена.' };
                    } else {
                        result = { success: false, message: 'Заметка не найдена.' };
                    }
                } else if (functionName === 'deleteNote') {
                    onDeleteNote(args.noteId as string);
                    result = { success: true, message: 'Заметка удалена.' };
                }
                 else if (functionName === 'logAction') {
                    const { description, areaName } = args;
                    const targetBoard = boards.find(b => b.name.toLowerCase().includes((areaName as string).toLowerCase()));
                    if (targetBoard) {
                        const doneStatus = targetBoard.columns[targetBoard.columns.length - 1];
                        const createdTask = await onAddTask({
                            title: description as string,
                            description: 'Автоматически зафиксированное действие.',
                            pomodorosEstimated: 0,
                            projectId: null,
                        }, targetBoard.id);
                        if (createdTask) {
                            onUpdateTaskStatus(createdTask.id, doneStatus);
                            result = { success: true, message: `Действие "${description as string}" зафиксировано в сфере "${targetBoard.name}".` };
                        } else {
                            result = { success: false, message: `Не удалось создать задачу.` };
                        }
                    } else {
                        result = { success: false, message: `Сфера "${areaName as string}" не найдена.` };
                    }
                }
                else if (functionName === 'decomposeGoal') {
                    const { boardName, project: projectData } = args as { boardName: string; project: { name: string; emoji: string; tasks: any[] } };
                    
                    const targetBoard = boards.find(b => b.name.toLowerCase() === boardName.toLowerCase());
                    if (!targetBoard) {
                        result = { success: false, message: `Board named "${boardName}" not found. Available boards are: ${boards.map(b => b.name).join(', ')}.` };
                    } else {
                        // 1. Create the project
                        const newProject = onAddProject(projectData.name, '#A371F7', projectData.emoji || '🎯', [], targetBoard.id);
            
                        // 2. Create tasks for the project
                        let tasksCreatedCount = 0;
                        if (projectData.tasks && projectData.tasks.length > 0) {
                            for (const task of projectData.tasks) {
                                const subtasks: Subtask[] = (task.subtasks || []).map((st: string) => ({
                                    id: crypto.randomUUID(),
                                    title: st,
                                    completed: false,
                                }));
            
                                await onAddTask({
                                    title: task.title,
                                    description: task.description || '',
                                    projectId: newProject.id,
                                    pomodorosEstimated: 1,
                                    priority: task.priority || TaskPriority.Medium,
                                    subtasks: subtasks,
                                }, targetBoard.id);
                                tasksCreatedCount++;
                            }
                        }
                        result = { success: true, message: `Цель разложена! Создан проект "${newProject.name}" с ${tasksCreatedCount} задачами в сфере "${targetBoard.name}".` };
                    }
                }
                // MIND MAP write functions
                else if (functionName === 'createMindMap') {
                    const newMap: MindMap = { id: crypto.randomUUID(), name: args.name as string, nodes: [{ id: crypto.randomUUID(), label: args.name as string, x: 0, y: 0 }] };
                    onAddMindMap(newMap);
                    result = { success: true, message: `Интеллект-карта "${args.name as string}" создана.`, mapId: newMap.id };
                } else if (functionName === 'addMindMapNode') {
                    const { mapId = activeMindMapId, label, parentId } = args;
                    if (!mapId) {
                        result = { success: false, message: 'Активная карта не выбрана. Пожалуйста, укажите ID карты.' };
                    } else {
                        const mapExists = mindMaps.some(m => m.id === (mapId as string));
                        if (mapExists) {
                            onAddMindMapNode(mapId as string, label as string, parentId as string, null);
                            result = { success: true, message: `Узел добавлен в карту.` };
                        } else {
                            result = { success: false, message: 'Карта не найдена.' };
                        }
                    }
                } else if (functionName === 'updateMindMapNode') {
                    const { mapId = activeMindMapId, nodeId, newLabel } = args;
                    if (!mapId) {
                         result = { success: false, message: 'Активная карта не выбрана.' };
                    } else {
                        onUpdateMindMapNode(mapId as string, nodeId as string, newLabel as string);
                        result = { success: true, message: 'Узел обновлен.' };
                    }
                } else if (functionName === 'deleteMindMapNode') {
                    const { mapId = activeMindMapId, nodeId } = args;
                     if (!mapId) {
                         result = { success: false, message: 'Активная карта не выбрана.' };
                    } else {
                        onDeleteMindMapNode(mapId as string, nodeId as string);
                        result = { success: true, message: 'Узел удален.' };
                    }
                } else if (functionName === 'deleteMindMap') {
                    onDeleteMindMap(args.mapId as string);
                    result = { success: true, message: 'Интеллект-карта удалена.' };
                } else if (functionName === 'generateMindMapFromProject') {
                    const newMap = await onGenerateMindMapFromProject(args.projectId as string);
                    result = newMap ? { success: true, message: `Интеллект-карта для проекта сгенерирована.`, mapId: newMap.id } : { success: false, message: 'Не удалось сгенерировать карту.' };
                }
                // COMPLEX functions
                else if (['summarizeNote', 'expandNote', 'tagNote', 'analyzeFocus', 'planDay', 'getMotivation', 'generateContent', 'suggestNextSteps', 'analyzeAndLinkNote', 'generateNewIdeasFromNote'].includes(functionName)) {
                    result = await handleToolCall(call);
                } else {
                    result = { success: false, message: 'Неизвестная функция' };
                }

                const functionResponse: ChatMessage = { role: 'function', parts: [{ functionResponse: { name: functionName, response: { content: JSON.stringify(result) } } }] };
                const messagesWithToolCall = [...currentMessages, modelTurnWithToolCall, functionResponse];
                setMessages(messagesWithToolCall);
                const finalResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: messagesWithToolCall, config: { systemInstruction } });
                processModelResponse(finalResponse, messagesWithToolCall);

            } else {
                processModelResponse(response, currentMessages);
            }
        } catch (error: any) {
            console.error('AI Assistant Error:', error);
            let userFriendlyError = 'К сожалению, произошла ошибка. Пожалуйста, попробуйте еще раз.';
            let isQuotaError = false;
    
            // The error object might be complex. Let's stringify it to search for keywords.
            const errorString = JSON.stringify(error).toLowerCase();
    
            if (
                errorString.includes('429') ||
                errorString.includes('resource_exhausted') ||
                errorString.includes('quota') ||
                errorString.includes('rate limit')
            ) {
                isQuotaError = true;
            }
    
            if (isQuotaError) {
                setIsQuotaExceeded(true);
                userFriendlyError = `**Вы превысили лимит запросов к API.**

Пожалуйста, проверьте ваш тарифный план или попробуйте позже.
- [Узнать больше об ограничениях](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Отследить использование](https://ai.dev/usage?tab=rate-limit)`;
            }
            
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: userFriendlyError }] }]);
            setSuggestions(defaultSuggestions);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, uploadedImage, messages, generateContext]);
    
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
            <button onClick={() => setIsOpen(!isOpen)} className="group fixed bottom-6 right-6 bg-neon-purple/80 backdrop-blur-md text-white w-16 h-16 rounded-full shadow-lg shadow-neon-purple/40 flex items-center justify-center z-40 hover:bg-neon-purple transition-transform transform hover:scale-110" aria-label="Открыть ассистента Lenochka">
                {isOpen ? <XIcon className="w-8 h-8"/> : <SparklesIcon className="w-8 h-8" />}
                {settings.showHotkeyTooltips && hotkeys.toggleAI && (
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-secondary text-text-primary text-xs px-2 py-1 rounded-md border border-border-color shadow-lg z-50">
                        {hotkeys.toggleAI.replace(/\+/g, ' + ').toUpperCase()}
                    </span>
                )}
            </button>
            <AnimatePresence>
            {isOpen && (
                 <motion.div 
                    drag
                    dragListener={false}
                    dragControls={dragControls}
                    dragConstraints={constraintsRef}
                    dragMomentum={false}
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-28 right-8 w-[calc(100vw-2rem)] max-w-lg h-[75vh] max-h-[700px] bg-secondary/80 backdrop-blur-2xl rounded-3xl shadow-soft-glow-neon z-40 flex flex-col border border-border-color overflow-hidden">
                    <header
                        onPointerDown={(e) => {
                           if ((e.target as HTMLElement).tagName.toLowerCase() !== 'button' && !(e.target as HTMLElement).closest('button')) {
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
                                {msg.role === 'model' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex-shrink-0 flex items-center justify-center mt-1">
                                        <SparklesIcon className="w-5 h-5 text-white"/>
                                    </div>
                                )}
                                <div className={`max-w-xs md:max-w-sm flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {msg.parts.map((part, i) => {
                                        if ('text' in part && part.text) {
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`px-4 py-3 rounded-2xl shadow-md shadow-black/20 ${
                                                        msg.role === 'user' 
                                                        ? 'bg-highlight text-primary rounded-br-md' 
                                                        : 'bg-primary border border-border-color text-text-primary rounded-bl-md'
                                                    }`}
                                                >
                                                     <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-bold opacity-70">{msg.role === 'user' ? playerStats.characterName || 'Вы' : 'Lenochka'}</span>
                                                        {msg.role === 'model' && (
                                                            <button onClick={() => onSpeak(msg.parts.map(p => 'text' in p ? p.text : '').join(' '))} className="p-1 text-text-secondary hover:text-white">
                                                                <SpeakerWaveIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div 
                                                        className="prose prose-sm prose-invert max-w-none leading-relaxed text-text-primary prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:font-semibold prose-headings:text-highlight prose-pre:bg-black/50 prose-pre:p-3 prose-pre:rounded-md prose-pre:text-sm prose-a:text-highlight hover:prose-a:underline prose-li:marker:text-highlight"
                                                        dangerouslySetInnerHTML={{ __html: marked.parse(part.text) }}
                                                    />
                                                </div>
                                            );
                                        }
                                        if ('inlineData' in part && part.inlineData.mimeType.startsWith('image/')) {
                                            return (
                                                <img 
                                                    key={i}
                                                    src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                                                    alt="AI generated content"
                                                    className="rounded-lg max-w-full h-auto border-2 border-border-color"
                                                />
                                            );
                                        }
                                        return null;
                                    })}
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