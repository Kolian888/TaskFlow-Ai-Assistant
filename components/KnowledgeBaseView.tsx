import React, { useState, useCallback, useMemo, useEffect } from 'react';
// FIX: Import the 'Settings' type to correctly type the props.
import { Note, NoteFolder, Settings } from '../types';
import { PlusIcon, DocumentDuplicateIcon, TagIcon, SparklesIcon, LayersIcon, PencilIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import NoteEditor from './NoteEditor';
import BacklinksPanel from './BacklinksPanel';

interface KnowledgeBaseViewProps {
    notes: Note[];
    noteFolders: NoteFolder[];
    activeNoteId: string | null;
    onSetActiveNoteId: (id: string | null) => void;
    onAddNote: (title: string, folderId: string | null) => Note;
    onUpdateNote: (note: Note) => void;
    onDeleteNote: (noteId: string) => void;
    onAddFolder: (name: string, emoji: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onNavigateToGraph: () => void;
    voiceCommand: { command: string; payload: string; timestamp: number } | null;
    // FIX: Update the 'settings' prop to use the 'Settings' type for proper type checking.
    settings: Settings;
}

const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ notes, noteFolders, activeNoteId, onSetActiveNoteId, onAddNote, onUpdateNote, onDeleteNote, onAddFolder, onDeleteFolder, onNavigateToGraph, voiceCommand, settings }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(null);

    useEffect(() => {
        if (activeNoteId && !notes.some(n => n.id === activeNoteId)) {
            onSetActiveNoteId(null);
        }
    }, [notes, activeNoteId, onSetActiveNoteId]);

    const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId) || null, [notes, activeNoteId]);

    const handleCreateNewNote = (folderId: string | null = null) => {
        const newNote = onAddNote('Новая идея', folderId);
        onSetActiveNoteId(newNote.id);
    };

    const handleCreateNoteFromLink = (title: string) => {
        const existingNote = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
        if (existingNote) {
            onSetActiveNoteId(existingNote.id);
            return;
        }
        const newNote = onAddNote(title, activeNote?.folderId || null);
        onSetActiveNoteId(newNote.id);
    };
    
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        notes.forEach(note => {
            note.tags?.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
    }, [notes]);

    const filteredNotes = useMemo(() => {
        let tempNotes = notes;
        if (activeTag) {
            tempNotes = tempNotes.filter(n => n.tags?.includes(activeTag));
        }
        if (!searchTerm) return tempNotes;
        
        const lowerSearch = searchTerm.toLowerCase();
        return tempNotes.filter(n => n.title.toLowerCase().includes(lowerSearch) || n.content.toLowerCase().includes(lowerSearch));
    }, [notes, searchTerm, activeTag]);

    const folderNotes = useMemo(() => {
        const folders: Record<string, Note[]> = {};
        filteredNotes.forEach(note => {
            const folderId = note.folderId || 'uncategorized';
            if (!folders[folderId]) {
                folders[folderId] = [];
            }
            folders[folderId].push(note);
        });
        return folders;
    }, [filteredNotes]);
    
    const handleTagClick = (tag: string | null) => {
        setActiveTag(tag);
    };

    const WelcomeScreen = () => (
        <div className="bg-primary p-8 rounded-xl border border-border-color h-full flex flex-col items-center justify-center text-center">
            <SparklesIcon className="w-20 h-20 text-neon-purple/50 mb-6"/>
            <h1 className="text-3xl font-bold text-text-primary">Добро пожаловать в Мир Идей!</h1>
            <p className="text-text-secondary mt-4 max-w-2xl">Это ваше личное пространство для мыслей, знаний и творчества, работающее на Markdown.</p>
            
            <div className="flex gap-4 mt-8 text-left max-w-4xl w-full">
                <div className="flex-1 p-4 bg-accent rounded-lg border border-border-color">
                    <h3 className="font-bold flex items-center gap-2"><LayersIcon className="w-5 h-5 text-highlight"/> Навигатор</h3>
                    <p className="text-sm text-text-secondary mt-1">Здесь вы видите все ваши идеи, папки и теги для быстрой навигации.</p>
                </div>
                 <div className="flex-1 p-4 bg-accent rounded-lg border border-border-color">
                    <h3 className="font-bold flex items-center gap-2"><PencilIcon className="w-5 h-5 text-highlight"/> Редактор</h3>
                    <p className="text-sm text-text-secondary mt-1">Пишите в Markdown и мгновенно смотрите результат. Используйте [[связи]] для соединения идей.</p>
                </div>
                 <div className="flex-1 p-4 bg-accent rounded-lg border border-border-color">
                    <h3 className="font-bold flex items-center gap-2"><DocumentDuplicateIcon className="w-5 h-5 text-highlight"/> Контекст</h3>
                    <p className="text-sm text-text-secondary mt-1">Панель связей показывает, какие идеи ссылаются на текущую и куда она ведет.</p>
                </div>
            </div>

            <button onClick={() => handleCreateNewNote(null)} className="mt-8 flex items-center justify-center gap-2 px-6 py-3 bg-highlight text-primary font-bold rounded-xl hover:opacity-90 transition-transform transform hover:scale-105">
               <PlusIcon className="w-6 h-6"/>
               Создать первую идею
           </button>
       </div>
    );
    

    return (
        <div className="bg-secondary p-4 rounded-3xl border border-border-color shadow-soft-glow h-[calc(100vh-130px)] flex gap-4">
            {/* Left Panel: Navigator */}
            <aside className="w-1/4 bg-primary p-4 rounded-xl border border-border-color flex flex-col">
                <div className="flex-shrink-0 mb-4">
                    <input
                        type="text"
                        placeholder="Поиск по идеям..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-accent border border-border-color rounded-lg p-2 text-sm focus:ring-2 focus:ring-highlight outline-none"
                    />
                </div>
                <div className="flex-grow overflow-y-auto space-y-3 pr-2 -mr-3">
                     {allTags.length > 0 && (
                        <div>
                             <h3 className="text-xs font-bold text-text-secondary uppercase px-2 mb-2 flex items-center gap-1.5"><TagIcon className="w-3 h-3"/>Теги</h3>
                             <div className="flex flex-wrap gap-1.5 px-2">
                                <button onClick={() => handleTagClick(null)} className={`px-2 py-0.5 text-xs rounded-md transition-all ${!activeTag ? 'bg-highlight text-primary font-bold' : 'bg-accent border border-border-color text-text-secondary hover:bg-white/10'}`}>Все</button>
                                {allTags.map(tag => (
                                     <button key={tag} onClick={() => handleTagClick(tag)} className={`px-2 py-0.5 text-xs rounded-md transition-all ${activeTag === tag ? 'bg-highlight text-primary font-bold' : 'bg-accent border border-border-color text-text-secondary hover:bg-white/10'}`}>#{tag}</button>
                                ))}
                             </div>
                        </div>
                    )}
                    <div className="pt-3">
                        <h3 className="text-xs font-bold text-text-secondary uppercase px-2 mb-1">Свободные идеи</h3>
                        {(folderNotes['uncategorized'] || []).map(note => (
                            <NoteLink key={note.id} note={note} isActive={activeNoteId === note.id} onClick={() => onSetActiveNoteId(note.id)} />
                        ))}
                    </div>
                    {noteFolders.map(folder => (
                        <div key={folder.id}>
                            <h3 className="text-xs font-bold text-text-secondary uppercase px-2 mb-1">{folder.emoji} {folder.name}</h3>
                            {(folderNotes[folder.id] || []).map(note => (
                                <NoteLink key={note.id} note={note} isActive={activeNoteId === note.id} onClick={() => onSetActiveNoteId(note.id)} />
                            ))}
                        </div>
                    ))}
                </div>
                <div className="mt-auto pt-4 border-t border-border-color">
                    <button onClick={() => handleCreateNewNote(null)} className="w-full flex items-center justify-center gap-2 p-2.5 bg-highlight/80 text-primary font-bold rounded-xl hover:bg-highlight transition-colors">
                        <PlusIcon className="w-5 h-5"/>
                        Новая идея
                    </button>
                </div>
            </aside>

            {/* Center Panel: Editor */}
            <main className="w-1/2 bg-primary rounded-xl border border-border-color flex flex-col">
                <AnimatePresence mode="wait">
                    {activeNote ? (
                        <motion.div key={activeNote.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                           <NoteEditor 
                                note={activeNote} 
                                onUpdate={onUpdateNote} 
                                onDelete={() => {
                                    onDeleteNote(activeNote.id);
                                    onSetActiveNoteId(null);
                                }}
                                allNotes={notes}
                                onAddNote={onAddNote}
                                onNoteLinkClick={(noteTitle) => {
                                    const foundNote = notes.find(n => n.title.toLowerCase() === noteTitle.toLowerCase());
                                    if (foundNote) onSetActiveNoteId(foundNote.id);
                                }}
                                onCreateNoteFromLink={handleCreateNoteFromLink}
                                onNavigateToGraph={onNavigateToGraph}
                                voiceCommand={voiceCommand}
                                settings={settings}
                            />
                        </motion.div>
                    ) : (
                        <WelcomeScreen />
                    )}
                </AnimatePresence>
            </main>

            {/* Right Panel: Context */}
            <aside className="w-1/4 bg-primary p-4 rounded-xl border border-border-color flex flex-col">
                <AnimatePresence>
                    {activeNote && (
                         <motion.div key={`backlinks-${activeNote.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                           <BacklinksPanel
                                activeNote={activeNote}
                                allNotes={notes}
                                onBacklinkClick={(noteId) => onSetActiveNoteId(noteId)}
                                onAddNote={onAddNote}
                           />
                        </motion.div>
                    )}
                </AnimatePresence>
            </aside>
        </div>
    );
};

const NoteLink: React.FC<{ note: Note; isActive: boolean; onClick: () => void }> = ({ note, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left p-2 rounded-md text-sm truncate transition-colors ${isActive ? 'bg-highlight/20 text-text-primary font-bold' : 'hover:bg-accent text-text-secondary'}`}
    >
        {note.title || 'Идея без названия'}
    </button>
);

export default KnowledgeBaseView;