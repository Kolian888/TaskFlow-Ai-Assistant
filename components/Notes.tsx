import React, { useState } from 'react';
import { Note } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XIcon } from './Icons';

interface NotesProps {
    notes: Note[];
    onAddNote: (content: string, folderId?: string | null) => void;
    onUpdateNote: (note: Note) => void;
    onDeleteNote: (noteId: string) => void;
}

const Notes: React.FC<NotesProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote }) => {
    const [newNoteContent, setNewNoteContent] = useState('');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');

    const handleStartEditing = (note: Note) => {
        setEditingNoteId(note.id);
        setEditingContent(note.content);
    };

    const handleCancelEditing = () => {
        setEditingNoteId(null);
        setEditingContent('');
    };

    const handleSaveNote = () => {
        if (editingNoteId && editingContent.trim()) {
            const originalNote = notes.find(n => n.id === editingNoteId);
            if(originalNote) {
                 onUpdateNote({ ...originalNote, content: editingContent.trim() });
            }
            handleCancelEditing();
        }
    };
    
    const handleAddNewNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (newNoteContent.trim()) {
            onAddNote(newNoteContent.trim(), null); // Adds to "uncategorized"
            setNewNoteContent('');
        }
    };

    const sortedNotes = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-4 pr-2 -mr-2">
                {sortedNotes.length > 0 ? sortedNotes.map(note => (
                    <div key={note.id} className="bg-accent/50 p-3 rounded-lg group">
                        {editingNoteId === note.id ? (
                            <div className="space-y-2">
                                <textarea
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    className="w-full bg-primary border border-border-color rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-highlight"
                                    rows={3}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={handleCancelEditing} className="p-1.5 rounded-md hover:bg-accent"><XIcon className="w-4 h-4 text-text-secondary"/></button>
                                    <button onClick={handleSaveNote} className="p-1.5 rounded-md hover:bg-accent"><CheckIcon className="w-4 h-4 text-highlight"/></button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-text-primary whitespace-pre-wrap flex-grow break-words">{note.content}</p>
                                <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleStartEditing(note)} className="p-1.5 rounded-md hover:bg-accent"><PencilIcon className="w-4 h-4 text-text-secondary"/></button>
                                    <button onClick={() => onDeleteNote(note.id)} className="p-1.5 rounded-md hover:bg-accent"><TrashIcon className="w-4 h-4 text-brand-red"/></button>
                                </div>
                            </div>
                        )}
                    </div>
                )) : (
                    <p className="text-sm text-center text-text-secondary py-4">Здесь пока нет заметок.</p>
                )}
            </div>

            <form onSubmit={handleAddNewNote} className="space-y-3 border-t border-border-color pt-4">
                <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Новая заметка..."
                    rows={2}
                    className="w-full bg-accent backdrop-blur-xl border border-border-color shadow-inner-soft rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-highlight transition-colors focus:border-highlight text-sm"
                />
                <button type="submit" className="w-full relative bg-highlight text-primary font-bold p-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm active:scale-95 flex items-center justify-center gap-2">
                    <PlusIcon className="w-5 h-5"/>
                    Добавить заметку
                </button>
            </form>
        </>
    );
};

export default Notes;
