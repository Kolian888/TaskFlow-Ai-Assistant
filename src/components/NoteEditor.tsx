import React, { useState, useEffect, useMemo, useRef } from 'react';
// FIX: Import the 'Settings' type to correctly type the props.
import { Note, Settings } from '../types';
import { TrashIcon, TagIcon, XIcon, ListBulletIcon, SparklesIcon, DocumentTextIcon, BoldIcon, ItalicIcon, StrikethroughIcon, LinkIcon, QuoteIcon, ListOrderedIcon, CheckSquareIcon, CodeIcon, CodeBracketIcon } from './Icons';
// @ts-ignore
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';


interface NoteEditorProps {
    note: Note;
    onUpdate: (updatedNote: Note) => void;
    onDelete: (noteId: string) => void;
    allNotes: Note[];
    onAddNote: (title: string, folderId: string | null) => Note;
    onNoteLinkClick: (noteTitle: string) => void;
    onCreateNoteFromLink: (noteTitle: string) => void;
    onNavigateToGraph: () => void;
    voiceCommand: { command: string; payload: string; timestamp: number } | null;
    // FIX: Update the 'settings' prop to use the 'Settings' type for proper type checking.
    settings: Settings;
}

const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
  const properties = [
    'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily',
    'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing',
    'tabSize', 'MozTabSize'
  ];

  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  const div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle(element);

  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';

  properties.forEach(prop => {
    // @ts-ignore
    style[prop] = computed[prop];
  });

  if (isFirefox) {
    if (element.scrollHeight > parseInt(computed.height)) style.overflowY = 'scroll';
  } else {
    style.overflow = 'hidden';
  }

  div.textContent = element.value.substring(0, position);
  
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + parseInt(computed['borderTopWidth']),
    left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
  };

  document.body.removeChild(div);
  return coordinates;
};


const TagInput: React.FC<{tags: string[], onTagsChange: (tags: string[]) => void}> = ({ tags, onTagsChange }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) {
                onTagsChange([...tags, newTag]);
            }
            setInputValue('');
        } else if (e.key === 'Backspace' && !inputValue) {
            onTagsChange(tags.slice(0, -1));
        }
    };
    
    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="flex items-center flex-wrap gap-2 p-2 bg-accent rounded-lg border border-border-color">
            <TagIcon className="w-4 h-4 text-text-secondary flex-shrink-0 ml-1" />
            {tags.map(tag => (
                <div key={tag} className="flex items-center gap-1 bg-primary px-2 py-0.5 rounded-md text-sm">
                    <span>{tag}</span>
                    <button onClick={() => removeTag(tag)} className="text-text-secondary hover:text-white">
                        <XIcon className="w-3 h-3" />
                    </button>
                </div>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? "Добавить тег..." : ""}
                className="bg-transparent outline-none text-sm flex-grow min-w-[80px]"
            />
        </div>
    );
};

const FormattingToolbar: React.FC<{ onAction: (syntax: string) => void }> = ({ onAction }) => {
    const ToolbarButton: React.FC<{ title: string; onClick: () => void; children: React.ReactNode }> = ({ title, onClick, children }) => (
        <button type="button" title={title} onClick={onClick} className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-accent transition-colors">
            {children}
        </button>
    );

    return (
        <div className="flex items-center gap-1 p-1 bg-primary border-t border-b border-border-color -mx-4 px-3 mt-3">
            <ToolbarButton title="Жирный" onClick={() => onAction('**')}>
                <BoldIcon className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Курсив" onClick={() => onAction('*')}>
                <ItalicIcon className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Зачеркнутый" onClick={() => onAction('~~')}>
                <StrikethroughIcon className="w-5 h-5" />
            </ToolbarButton>
            <div className="w-px h-5 bg-border-color mx-1"></div>
            <ToolbarButton title="Список" onClick={() => onAction('* ')}>
                <ListBulletIcon className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Нумерованный список" onClick={() => onAction('1. ')}>
                <ListOrderedIcon className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Чек-лист" onClick={() => onAction('- [ ] ')}>
                <CheckSquareIcon className="w-5 h-5" />
            </ToolbarButton>
            <div className="w-px h-5 bg-border-color mx-1"></div>
            <ToolbarButton title="Ссылка на идею" onClick={() => onAction('[[]]')}>
                <LinkIcon className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Цитата" onClick={() => onAction('> ')}>
                <QuoteIcon className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Код" onClick={() => onAction('`')}>
                <CodeIcon className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Блок кода" onClick={() => onAction('```\n\n```')}>
                <CodeBracketIcon className="w-5 h-5" />
            </ToolbarButton>
        </div>
    );
};

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdate, onDelete, allNotes, onAddNote, onNoteLinkClick, onCreateNoteFromLink, onNavigateToGraph, voiceCommand, settings }) => {
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false);
    const [isAiActionLoading, setIsAiActionLoading] = useState(false);
    const [isFormatting, setIsFormatting] = useState(false);
    const [aiActionError, setAiActionError] = useState<string | null>(null);
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    const [commandProcessed, setCommandProcessed] = useState<number | null>(null);


    const previewRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const suggestionListRef = useRef<HTMLDivElement>(null);
    const aiMenuRef = useRef<HTMLDivElement>(null);

    const [linkSuggestions, setLinkSuggestions] = useState({
        active: false,
        position: { top: 0, left: 0 },
        searchTerm: '',
        suggestions: [] as Note[],
        selectedIndex: 0,
        startIndex: 0,
    });
    
    useEffect(() => {
        setTitle(note.title);
        setContent(note.content);
    }, [note]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (note.content !== content || note.title !== title) {
                // Update note with new content and title
                const updatedNote = { ...note, content, title };
                onUpdate(updatedNote);

                // Automatically create notes from new links
                const linkRegex = /\[\[(.*?)\]\]/g;
                let match;
                const outgoingLinkTitles = new Set<string>();
                while ((match = linkRegex.exec(content)) !== null) {
                    const linkTitle = match[1].trim();
                    if (linkTitle) {
                        outgoingLinkTitles.add(linkTitle);
                    }
                }
                
                const existingTitles = new Set(allNotes.map(n => n.title.toLowerCase()));

                outgoingLinkTitles.forEach(linkTitle => {
                    if (!existingTitles.has(linkTitle.toLowerCase())) {
                        onAddNote(linkTitle, note.folderId || null);
                    }
                });
            }
        }, 700); // Debounce time
        return () => clearTimeout(handler);
    }, [content, title, note, onUpdate, allNotes, onAddNote]);


     useEffect(() => {
        if (!voiceCommand || voiceCommand.timestamp === commandProcessed) {
            return;
        }

        const { command, timestamp } = voiceCommand;
        const textarea = textareaRef.current;
        const commandIsLink = command.includes('создай ссылку') || command.includes('сделай ссылкой');

        if (textarea && commandIsLink) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            if (start !== end) { // There is a selection
                const selectedText = content.substring(start, end);
                const newContent = `${content.substring(0, start)}[[${selectedText}]]${content.substring(end)}`;
                setContent(newContent);
            }
        }
        
        setCommandProcessed(timestamp);

    }, [voiceCommand, content, commandProcessed]);
    
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const handleKeyDown = async (e: KeyboardEvent) => {
            const pressedCombo = [
                (e.ctrlKey || e.metaKey) && 'ctrl',
                e.altKey && 'alt',
                e.shiftKey && 'shift',
                e.key.toLowerCase(),
            ].filter(Boolean).join('+');

            if (pressedCombo === settings.hotkeys.formatToMarkdown) {
                e.preventDefault();
                
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                
                if (start === end) return;
                
                const selectedText = textarea.value.substring(start, end);
                
                setIsFormatting(true);
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                    const prompt = `Please analyze the following text and convert it into well-structured Markdown format. Use headings, lists, bold, italics, and other Markdown features as appropriate to best represent the structure and intent of the original text. Return only the Markdown formatted text, without any additional explanations or commentary. The original text is:\n\n---\n\n${selectedText}`;
                    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                    const formattedText = response.text.trim();
                    
                    const newContent = `${textarea.value.substring(0, start)}${formattedText}${textarea.value.substring(end)}`;
                    setContent(newContent);
                    
                    setTimeout(() => {
                        if (textareaRef.current) {
                           textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + formattedText.length;
                        }
                    }, 0);
                } catch (error) {
                    console.error("Error formatting text to Markdown:", error);
                    setAiActionError('Ошибка форматирования. Попробуйте снова.');
                } finally {
                    setIsFormatting(false);
                }
            }
        };

        textarea.addEventListener('keydown', handleKeyDown);
        return () => {
            textarea.removeEventListener('keydown', handleKeyDown);
        };
    }, [settings.hotkeys.formatToMarkdown, content]);

    useEffect(() => {
        const previewEl = previewRef.current;
        if (!previewEl) return;
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'A' && target.hasAttribute('data-note-link')) {
                e.preventDefault();
                const noteTitle = target.getAttribute('data-note-link')!;
                const noteExists = target.getAttribute('data-note-exists') !== 'false';
                if (noteExists) {
                    onNoteLinkClick(noteTitle);
                } else {
                    onCreateNoteFromLink(noteTitle);
                }
            }
        };
        previewEl.addEventListener('click', handleClick);
        return () => previewEl.removeEventListener('click', handleClick);
    }, [onNoteLinkClick, onCreateNoteFromLink, content]);

    useEffect(() => {
        if (linkSuggestions.active && suggestionListRef.current) {
          const selectedElement = suggestionListRef.current.children[linkSuggestions.selectedIndex] as HTMLElement;
          if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest' });
          }
        }
    }, [linkSuggestions.selectedIndex, linkSuggestions.active]);
    
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
                setIsAiMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTitleBlur = () => {
        if (title.trim() && title !== note.title) {
            onUpdate({ ...note, title: title.trim(), content });
        }
    };

    const handleTagsChange = (newTags: string[]) => {
        onUpdate({ ...note, tags: newTags, content, title });
    };

    const handleInsertSyntax = (syntax: string) => {
        if (!textareaRef.current) return;
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = content;
        const selection = currentText.substring(start, end);
        const before = currentText.substring(0, start);
        const after = currentText.substring(end);
    
        let newText;
        let newStart;
        let newEnd;
    
        // Wrappers (bold, italic, links, etc.)
        if (['**', '*', '~~', '`', '[[]]'].includes(syntax)) {
            const [open, close] = syntax === '[[]]' ? ['[[', ']]'] : [syntax, syntax];
            if (selection) {
                newText = `${before}${open}${selection}${close}${after}`;
                newStart = start + open.length;
                newEnd = end + open.length;
            } else {
                newText = `${before}${open}${close}${after}`;
                newStart = newEnd = start + open.length;
            }
        } 
        // Prefixes (lists, quotes)
        else if (['* ', '1. ', '> ', '- [ ] '].includes(syntax)) {
            newText = `${before}${syntax}${selection}${after}`;
            newStart = start + syntax.length;
            newEnd = end + syntax.length;
        } 
        // Code blocks
        else if (syntax.includes('\n')) {
            newText = `${before}${syntax}${after}`;
            const cursorPos = start + syntax.indexOf('\n') + 1;
            newStart = newEnd = cursorPos;
        } 
        // Fallback for any other simple syntax
        else {
            newText = `${before}${syntax}${selection}${after}`;
            newStart = start + syntax.length;
            newEnd = end + syntax.length;
        }
    
        setContent(newText);
    
        // Use a timeout to ensure the state update has been processed by React
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.selectionStart = newStart;
                textareaRef.current.selectionEnd = newEnd;
            }
        }, 0);
    };

    const handleAiAction = async (action: 'summarize' | 'tag' | 'link') => {
        if (!content.trim()) return;
        setIsAiActionLoading(true);
        setAiActionError(null);
        setIsAiMenuOpen(false);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            let prompt = '';
            let updateFn: (response: string) => void;

            switch (action) {
                case 'summarize':
                    prompt = `Сделай краткое summary (одно-два предложения) для следующего текста:\n\n---\n\n${content}`;
                    updateFn = (summary) => {
                        const newContent = `> **Summary:** ${summary}\n\n---\n\n${content}`;
                        setContent(newContent);
                    };
                    break;
                case 'tag':
                    prompt = `Проанализируй следующий текст и предложи от 3 до 5 релевантных тегов. Ответь только в формате JSON-массива строк. Например: ["продуктивность", "идеи"].\n\n---\n\n${title}\n${content}`;
                    updateFn = (response) => {
                        let newTags: string[] = [];
                        try {
                            const cleanedResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
                            const parsed = JSON.parse(cleanedResponse);
                            // FIX: Safely parse and filter AI-generated tags to ensure they are always an array of strings.
                            if (Array.isArray(parsed)) {
// FIX: Change 'unknown' to 'any' to match the type of items in 'parsed' (any[]), resolving the type mismatch error.
// The type of `item` is changed from `any` to `unknown` for better type safety. The type predicate `item is string` correctly narrows `unknown` to `string`.
                                newTags = parsed.filter((item: unknown): item is string => typeof item === 'string');
                            } else {
                                throw new Error("Invalid tag format from AI");
                            }
                        } catch (e) {
                            console.error("Failed to parse tags JSON:", e);
                            newTags = response.split(',').map(t => t.trim().replace(/["'`]/g, ''));
                        }
                        const currentTags = new Set(note.tags || []);
                        newTags.forEach(tag => currentTags.add(tag.toLowerCase().replace(/\s/g, '-')));
                        handleTagsChange(Array.from(currentTags));
                    };
                    break;
                 case 'link':
                    const otherNoteTitles = allNotes.filter(n => n.id !== note.id && n.title.trim()).map(n => n.title);
                    prompt = `Проанализируй текст заметки. Найди в нем упоминания следующих названий других заметок: [${otherNoteTitles.join(', ')}]. Если найдешь точное совпадение, оберни его в [[двойные квадратные скобки]]. Не создавай ссылки, если не уверен. Верни только измененный текст заметки, без каких-либо объяснений. Исходный текст:\n\n---\n\n${content}`;
                    updateFn = (newContent) => {
                        setContent(newContent);
                    };
                    break;
            }
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            updateFn(response.text);

        } catch (error) {
            console.error(`Error performing AI action "${action}":`, error);
            setAiActionError('Произошла ошибка при выполнении AI-действия.');
        } finally {
            setIsAiActionLoading(false);
        }
    };


    const checkSuggestions = (textarea: HTMLTextAreaElement) => {
        const text = textarea.value;
        const cursorPosition = textarea.selectionStart;

        const linkRegex = /\[\[([^\]]*)$/;
        const textBeforeCursor = text.substring(0, cursorPosition);
        const match = textBeforeCursor.match(linkRegex);

        if (match) {
            const searchTerm = match[1];
            const startIndex = match.index!;
            const filtered = allNotes.filter(
                n => n.title.toLowerCase().includes(searchTerm.toLowerCase()) && n.id !== note.id
            );

            const coords = getCaretCoordinates(textarea, startIndex);
            
            setLinkSuggestions({
                active: true,
                position: { 
                    top: coords.top - textarea.scrollTop + 24, // offset for line height
                    left: coords.left - textarea.scrollLeft
                },
                searchTerm,
                suggestions: filtered.slice(0, 10), // Limit suggestions
                selectedIndex: 0,
                startIndex: startIndex,
            });
        } else if (linkSuggestions.active) {
            setLinkSuggestions(prev => ({ ...prev, active: false }));
        }
    };

    const handleSelectSuggestion = (title: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const currentContent = content;
        const startIndex = linkSuggestions.startIndex;
        const cursorPosition = textarea.selectionStart;

        const before = currentContent.substring(0, startIndex);
        const after = currentContent.substring(cursorPosition);
        
        const newContent = `${before}[[${title}]]${after}`;
        setContent(newContent);
        
        setLinkSuggestions(prev => ({ ...prev, active: false }));
        
        setTimeout(() => {
            const newCursorPos = before.length + `[[${title}]]`.length;
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (linkSuggestions.active) {
            if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab'].includes(e.key)) {
                e.preventDefault();
                if (e.key === 'ArrowDown') {
                    setLinkSuggestions(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % prev.suggestions.length }));
                } else if (e.key === 'ArrowUp') {
                    setLinkSuggestions(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + prev.suggestions.length) % prev.suggestions.length }));
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                    const selectedNote = linkSuggestions.suggestions[linkSuggestions.selectedIndex];
                    if (selectedNote) {
                        handleSelectSuggestion(selectedNote.title);
                    } else {
                         setLinkSuggestions(prev => ({ ...prev, active: false }));
                    }
                } else if (e.key === 'Escape') {
                    setLinkSuggestions(prev => ({ ...prev, active: false }));
                }
            }
        }
    };
    
    const processedHtml = useMemo(() => {
        const contentWithHtmlLinks = content.replace(/\[\[(.*?)\]\]/g, (match, linkTitle) => {
            const noteExists = allNotes.some(n => n.title.toLowerCase() === linkTitle.toLowerCase());
            if (noteExists) {
                return `<a href="#" data-note-link="${linkTitle}" class="text-highlight no-underline hover:underline decoration-highlight/50 decoration-dashed">${linkTitle}</a>`;
            }
            return `<a href="#" data-note-link="${linkTitle}" data-note-exists="false" class="text-text-secondary opacity-70 no-underline hover:underline decoration-text-secondary/50 decoration-dashed">${linkTitle}</a>`;
        });
        return marked.parse(contentWithHtmlLinks);
    }, [content, allNotes]);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border-color flex-shrink-0">
                 <div className="flex items-center justify-between gap-4 mb-3">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={(e) => { if (e.key === 'Enter') textareaRef.current?.focus(); }}
                        placeholder="Заголовок идеи"
                        className="text-xl font-bold bg-transparent outline-none w-full text-text-primary"
                    />
                    <div className="flex items-center gap-1">
                        <div className="relative group" ref={aiMenuRef}>
                            <button
                                onClick={() => setIsAiMenuOpen(p => !p)}
                                disabled={isAiActionLoading || isFormatting || !content}
                                className="p-2 text-text-secondary hover:text-neon-purple hover:bg-neon-purple/10 rounded-full disabled:opacity-50"
                                title="AI-действия"
                            >
                                {isAiActionLoading || isFormatting ? <div className="w-5 h-5 border-2 border-text-secondary border-t-neon-purple rounded-full animate-spin"></div> : <SparklesIcon className="w-5 h-5"/>}
                            </button>
                             {settings.showHotkeyTooltips && settings.hotkeys.formatToMarkdown && (
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-secondary text-text-primary text-xs px-2 py-1 rounded-md border border-border-color shadow-lg z-50">
                                    Форматировать: {settings.hotkeys.formatToMarkdown.replace(/\+/g, ' + ').toUpperCase()}
                                </span>
                            )}
                            <AnimatePresence>
                            {isAiMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full right-0 mt-2 w-48 bg-secondary border border-border-color rounded-xl shadow-lg p-2 z-50"
                                >
                                    <button onClick={() => handleAiAction('link')} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md text-text-primary hover:bg-accent"><LinkIcon className="w-4 h-4 text-highlight"/>Авто-связывание</button>
                                    <button onClick={() => handleAiAction('summarize')} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md text-text-primary hover:bg-accent"><DocumentTextIcon className="w-4 h-4 text-highlight"/>Сделать Summary</button>
                                    <button onClick={() => handleAiAction('tag')} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md text-text-primary hover:bg-accent"><TagIcon className="w-4 h-4 text-highlight"/>Сгенерировать теги</button>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                        <button onClick={onNavigateToGraph} className="p-2 text-text-secondary hover:text-neon-purple hover:bg-neon-purple/10 rounded-full" title="Открыть 'Звёздное небо'">
                            <SparklesIcon className="w-5 h-5"/>
                        </button>
                         <button onClick={() => onDelete(note.id)} className="p-2 text-text-secondary hover:text-brand-red hover:bg-brand-red/10 rounded-full" title="Удалить идею">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                {aiActionError && <p className="text-xs text-brand-red mb-2">{aiActionError}</p>}
                <TagInput tags={note.tags || []} onTagsChange={handleTagsChange} />
                <FormattingToolbar onAction={handleInsertSyntax} />
            </div>
            
            <div className="flex-grow flex overflow-hidden">
                <div className="w-1/2 h-full relative flex">
                    <AnimatePresence>
                        {linkSuggestions.active && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                style={{ top: linkSuggestions.position.top, left: linkSuggestions.position.left }}
                                className="absolute z-50 bg-secondary border border-border-color rounded-lg shadow-lg w-72 flex flex-col overflow-hidden"
                            >
                                <div ref={suggestionListRef} className="max-h-48 overflow-y-auto">
                                    {linkSuggestions.suggestions.length > 0 ? linkSuggestions.suggestions.map((s, i) => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleSelectSuggestion(s.title)}
                                            className={`w-full text-left px-3 py-2 text-sm truncate ${i === linkSuggestions.selectedIndex ? 'bg-highlight text-primary' : 'text-text-primary hover:bg-accent'}`}
                                        >
                                            {s.title}
                                        </button>
                                    )) : <div className="px-3 py-2 text-sm text-text-secondary">Идеи не найдены...</div>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={e => {
                            setContent(e.target.value);
                            checkSuggestions(e.currentTarget);
                        }}
                        onKeyUp={e => checkSuggestions(e.currentTarget)}
                        onClick={e => checkSuggestions(e.currentTarget)}
                        onKeyDown={handleKeyDown}
                        placeholder="Начни писать здесь... Используй [[Название идеи]], чтобы создавать связи!"
                        className="w-full h-full p-6 bg-transparent outline-none resize-none leading-relaxed text-text-primary placeholder:text-text-secondary/50"
                    />
                </div>
                <div className="w-1/2 h-full border-l border-border-color flex flex-col">
                     <div className="p-2 border-b border-border-color text-center text-xs font-bold text-text-secondary uppercase flex-shrink-0">
                        Предпросмотр
                    </div>
                    <div
                        ref={previewRef}
                        className="prose prose-sm prose-invert max-w-none w-full flex-grow p-6 overflow-y-auto leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: processedHtml }}
                    />
                </div>
            </div>
        </div>
    );
};

export default NoteEditor;