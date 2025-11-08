

import React, { useState, useMemo } from 'react';
import { Note, NoteFolder, Project, Task } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, XIcon, EmojiHappyIcon, CheckIcon, ChevronLeftIcon } from './Icons';
import EmojiPickerModal from './EmojiPickerModal';
import { motion, AnimatePresence } from 'framer-motion';

interface NotesViewProps {
    notes: Note[];
    noteFolders: NoteFolder[];
    projects: Project[];
    tasks: Task[];
    onAddNote: (content: string, folderId: string | null) => Note;
    onDeleteNote: (noteId: string) => void;
    onEditNoteRequest: (note: Note) => void;
    onAddFolder: (name: string, emoji: string) => void;
    onUpdateFolder: (folder: NoteFolder) => void;
    onDeleteFolder: (folderId: string) => void;
    isMobile: boolean;
}

const NotesView: React.FC<NotesViewProps> = ({ notes, noteFolders, projects, tasks, onAddNote, onDeleteNote, onEditNoteRequest, onAddFolder, onUpdateFolder, onDeleteFolder, isMobile }) => {
    const [selectedFolderId, setSelectedFolderId] = useState<string | 'all' | 'uncategorized'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderEmoji, setNewFolderEmoji] = useState('📁');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null);
    const [mobileView, setMobileView] = useState<'folders' | 'notes'>('folders');

    const notesInFolders = useMemo(() => {
        const counts: Record<string, number> = {};
        notes.forEach(note => {
            if (note.folderId) {
                counts[note.folderId] = (counts[note.folderId] || 0) + 1;
            }
        });
        return counts;
    }, [notes]);
    
    const uncategorizedCount = notes.filter(n => !n.folderId).length;

    const handleAddFolder = () => {
        if (newFolderName.trim()) {
            onAddFolder(newFolderName.trim(), newFolderEmoji);
            setIsCreatingFolder(false);
            setNewFolderName('');
            setNewFolderEmoji('📁');
        }
    };

    const handleStartEditFolder = (folder: NoteFolder) => {
        setEditingFolder(folder);
        setNewFolderName(folder.name);
        setNewFolderEmoji(folder.emoji);
    };

    const handleUpdateFolder = () => {
        if (editingFolder && newFolderName.trim()) {
            onUpdateFolder({ ...editingFolder, name: newFolderName.trim(), emoji: newFolderEmoji });
            setEditingFolder(null);
            setNewFolderName('');
            setNewFolderEmoji('📁');
        }
    };

    const filteredNotes = useMemo(() => {
        let filtered = notes;
        if (selectedFolderId === 'uncategorized') {
            filtered = notes.filter(n => !n.folderId);
        } else if (selectedFolderId !== 'all') {
            filtered = notes.filter(n => n.folderId === selectedFolderId);
        }

        if (searchTerm.trim()) {
            const lowercasedSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(note => note.content.toLowerCase().includes(lowercasedSearch));
        }
        
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notes, selectedFolderId, searchTerm]);

    const handleCreateNote = () => {
        const folderId = (selectedFolderId !== 'all' && selectedFolderId !== 'uncategorized') ? selectedFolderId : null;
        const newNote = onAddNote('Новая заметка...', folderId);
        if (newNote) {
            onEditNoteRequest(newNote); // Immediately open edit modal
        }
    };
    
    const getProjectById = (id: string) => projects.find(p => p.id === id);
    const getTaskById = (id: string) => tasks.find(t => t.id === id);

    const handleSelectFolder = (folderId: string | 'all' | 'uncategorized') => {
        setSelectedFolderId(folderId);
        if (isMobile) {
            setMobileView('notes');
        }
    };

    const FoldersPanel = (
        <aside className="w-full md:w-1/4 bg-secondary p-4 rounded-2xl border border-border-color flex flex-col h-full">
            <h2 className="text-xl font-bold text-text-primary mb-4 px-2">Папки</h2>
            <nav className="flex-grow space-y-1 overflow-y-auto">
                <FolderButton
                    label="Все заметки" emoji="📚" count={notes.length}
                    isActive={selectedFolderId === 'all'} onClick={() => handleSelectFolder('all')}
                />
                <FolderButton
                    label="Без папки" emoji="🗂️" count={uncategorizedCount}
                    isActive={selectedFolderId === 'uncategorized'} onClick={() => handleSelectFolder('uncategorized')}
                />
                 <div className="h-px bg-border-color my-2"></div>
                {noteFolders.map(folder => (
                    <div key={folder.id} className="group relative">
                         <FolderButton
                            label={folder.name} emoji={folder.emoji} count={notesInFolders[folder.id] || 0}
                            isActive={selectedFolderId === folder.id} onClick={() => handleSelectFolder(folder.id)}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-accent p-1 rounded-md">
                            <button onClick={() => handleStartEditFolder(folder)} className="p-1 text-text-secondary hover:text-white"><PencilIcon className="w-4 h-4" /></button>
                            <button onClick={() => onDeleteFolder(folder.id)} className="p-1 text-text-secondary hover:text-brand-red"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-border-color">
                {isCreatingFolder || editingFolder ? (
                    <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            <button onClick={() => setIsEmojiPickerOpen(true)} className="w-10 h-10 bg-accent border border-border-color rounded-lg text-xl flex-shrink-0">{newFolderEmoji}</button>
                            <input
                                type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Название папки" autoFocus
                                className="w-full bg-accent border border-border-color rounded-lg p-2 text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setIsCreatingFolder(false); setEditingFolder(null); }} className="w-full p-2 bg-accent/50 rounded-lg text-sm">Отмена</button>
                            <button onClick={editingFolder ? handleUpdateFolder : handleAddFolder} className="w-full p-2 bg-highlight text-primary rounded-lg text-sm font-semibold">{editingFolder ? 'Сохранить' : 'Создать'}</button>
                        </div>
                    </div>
                ) : (
                     <button onClick={() => setIsCreatingFolder(true)} className="w-full flex items-center justify-center gap-2 p-2.5 bg-highlight/80 text-primary font-bold rounded-xl hover:bg-highlight transition-colors">
                        <PlusIcon className="w-5 h-5"/>
                        Новая папка
                    </button>
                )}
            </div>
        </aside>
    );

    const NotesPanel = (
         <main className="w-full md:w-3/4 bg-secondary p-6 rounded-2xl border border-border-color flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                {isMobile && <button onClick={() => setMobileView('folders')} className="p-2 -ml-2 text-text-secondary hover:text-text-primary"><ChevronLeftIcon className="w-6 h-6"/></button>}
                <input
                    type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Поиск по заметкам..."
                    className="w-1/2 bg-accent border border-border-color rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-highlight"
                />
                <button onClick={handleCreateNote} className="flex items-center gap-2 px-4 py-2.5 bg-highlight text-primary font-bold rounded-xl hover:opacity-90 transition-opacity">
                    <PlusIcon className="w-5 h-5"/>
                    <span className="hidden md:inline">Новая заметка</span>
                </button>
            </div>
            {filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto flex-grow pr-2">
                    {filteredNotes.map(note => (
                        <div key={note.id} className="bg-primary border border-border-color rounded-2xl p-4 flex flex-col group h-fit">
                            <p className="text-sm text-text-primary whitespace-pre-wrap break-words flex-grow mb-4">{note.content}</p>
                            
                            <div className="space-y-2 mt-auto">
                              {(note.linkedProjectIds && note.linkedProjectIds.length > 0) || (note.linkedTaskIds && note.linkedTaskIds.length > 0) ? (
                                <div className="border-t border-border-color pt-2 space-y-1">
                                  {note.linkedProjectIds?.map(id => {
                                    const p = getProjectById(id);
                                    return p ? <div key={id} className="text-xs flex items-center gap-1.5 bg-accent/50 px-2 py-1 rounded-md text-text-secondary"><span>{p.emoji}</span><span>{p.name}</span></div> : null;
                                  })}
                                  {note.linkedTaskIds?.map(id => {
                                    const t = getTaskById(id);
                                    return t ? <div key={id} className="text-xs flex items-center gap-1.5 bg-accent/50 px-2 py-1 rounded-md text-text-secondary"><span>{t.emoji}</span><span>{t.title}</span></div> : null;
                                  })}
                                </div>
                              ) : null}
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-color">
                                <span className="text-xs text-text-secondary">{new Date(note.createdAt).toLocaleDateString()}</span>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEditNoteRequest(note)} className="p-1.5 text-text-secondary hover:text-white rounded-md hover:bg-accent"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => onDeleteNote(note.id)} className="p-1.5 text-text-secondary hover:text-brand-red rounded-md hover:bg-accent"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center text-center">
                    <div>
                        <h3 className="text-xl font-semibold text-text-secondary">Заметок не найдено</h3>
                        <p className="text-text-primary mt-2">Создайте новую заметку, чтобы начать.</p>
                    </div>
                </div>
            )}
        </main>
    );

    if (isMobile) {
        return (
            <div className="relative h-[calc(100vh-120px)] overflow-hidden">
                <AnimatePresence>
                    {mobileView === 'folders' && (
                        <motion.div key="folders" initial={{ x: '-100%' }} animate={{ x: '0' }} exit={{ x: '-100%' }} transition={{ ease: 'easeInOut', duration: 0.3 }} className="absolute inset-0">
                            {FoldersPanel}
                        </motion.div>
                    )}
                     {mobileView === 'notes' && (
                        <motion.div key="notes" initial={{ x: '100%' }} animate={{ x: '0' }} exit={{ x: '100%' }} transition={{ ease: 'easeInOut', duration: 0.3 }} className="absolute inset-0">
                            {NotesPanel}
                        </motion.div>
                    )}
                </AnimatePresence>
                 <EmojiPickerModal isOpen={isEmojiPickerOpen} onClose={() => setIsEmojiPickerOpen(false)} onSelectEmoji={emoji => { setNewFolderEmoji(emoji); setIsEmojiPickerOpen(false); }} />
            </div>
        );
    }

    return (
        <div className="flex gap-8 h-[calc(100vh-120px)]">
            {FoldersPanel}
            {NotesPanel}
            <EmojiPickerModal isOpen={isEmojiPickerOpen} onClose={() => setIsEmojiPickerOpen(false)} onSelectEmoji={emoji => { setNewFolderEmoji(emoji); setIsEmojiPickerOpen(false); }} />
        </div>
    );
};

const FolderButton: React.FC<{label: string, emoji: string, count: number, isActive: boolean, onClick: () => void}> = ({ label, emoji, count, isActive, onClick }) => (
    <button onClick={onClick} className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center gap-3 text-sm ${isActive ? 'bg-highlight/10 text-text-primary font-semibold' : 'text-text-secondary hover:bg-accent hover:text-text-primary'}`}>
        <span className="text-lg">{emoji}</span>
        <span className="flex-grow truncate">{label}</span>
        <span className="px-2 py-0.5 bg-primary rounded-full text-xs font-mono">{count}</span>
    </button>
);

export default NotesView;
