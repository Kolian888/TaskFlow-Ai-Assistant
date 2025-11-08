import React, { useMemo } from 'react';
import { Note } from '../types';
import { PlusIcon, InformationCircleIcon } from './Icons';

interface BacklinksPanelProps {
    activeNote: Note;
    allNotes: Note[];
    onBacklinkClick: (noteId: string) => void;
    onAddNote: (title: string, folderId: string | null) => Note;
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative flex items-center">
        <InformationCircleIcon className="w-4 h-4 text-text-secondary/50" />
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 p-2 bg-primary text-xs text-text-secondary rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-border-color">
            {text}
        </div>
    </div>
);

const BacklinksPanel: React.FC<BacklinksPanelProps> = ({ activeNote, allNotes, onBacklinkClick, onAddNote }) => {
    
    const mentions = useMemo(() => {
        if (!activeNote.title || activeNote.title.trim().length < 4) return [];
    
        const allMentions: { note: Note; context: string }[] = [];
        const processedNoteIds = new Set<string>();
    
        const mentionRegex = new RegExp(`\\b${activeNote.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
        const linkRegex = new RegExp(`\\[\\[${activeNote.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\]\\]`, 'gi');

        for (const note of allNotes) {
            if (note.id === activeNote.id || processedNoteIds.has(note.id)) continue;

            let isMentionFound = false;
            let snippet = '';

            // Check for explicit link first to provide specific highlighting
            if (linkRegex.test(note.content)) {
                const matchIndex = note.content.search(linkRegex);
                const startIndex = Math.max(0, matchIndex - 30);
                const endIndex = Math.min(note.content.length, matchIndex + 50);
                snippet = `...${note.content.substring(startIndex, endIndex).replace(/<[^>]*>?/gm, '')}...`;
                snippet = snippet.replace(linkRegex, `<span class="text-highlight font-bold">$&</span>`);
                isMentionFound = true;
            } 
            // If no explicit link, check for implicit mention
            else if (mentionRegex.test(note.content)) {
                const matchIndex = note.content.search(mentionRegex);
                const startIndex = Math.max(0, matchIndex - 30);
                const endIndex = Math.min(note.content.length, matchIndex + 50);
                snippet = `...${note.content.substring(startIndex, endIndex).replace(/<[^>]*>?/gm, '')}...`;
                snippet = snippet.replace(mentionRegex, `<span class="text-yellow-400 font-bold bg-yellow-400/10 px-1 rounded">$&</span>`);
                isMentionFound = true;
            }

            if (isMentionFound) {
                allMentions.push({ note, context: snippet });
                processedNoteIds.add(note.id);
            }
        }
        return allMentions;
    }, [activeNote, allNotes]);

    const outgoingLinks = useMemo(() => {
        const links = new Set<string>();
        const linkRegex = /\[\[(.*?)\]\]/g;
        let match;
        while ((match = linkRegex.exec(activeNote.content)) !== null) {
            links.add(match[1]);
        }
        return Array.from(links);
    }, [activeNote.content]);
    
    const handleCreateNoteFromLink = (title: string) => {
        const newNote = onAddNote(title, activeNote.folderId || null);
        onBacklinkClick(newNote.id);
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex-shrink-0">Связи Идеи</h2>
            
            <div className="flex-grow overflow-y-auto space-y-6 pr-2 -mr-3">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-text-secondary uppercase">Упоминания ({mentions.length})</h3>
                        <InfoTooltip text="Идеи, в которых упоминается название текущей. Связи создаются автоматически." />
                    </div>
                    {mentions.length > 0 ? (
                        <div className="space-y-2">
                            {mentions.map(({ note, context }) => (
                                <button
                                    key={note.id}
                                    onClick={() => onBacklinkClick(note.id)}
                                    className="w-full text-left p-3 bg-accent rounded-lg hover:bg-white/5"
                                >
                                    <p className="font-semibold text-text-primary truncate">{note.title}</p>
                                    <p className="text-xs text-text-secondary mt-1" dangerouslySetInnerHTML={{__html: context }} />
                                </button>
                            ))}
                        </div>
                    ) : (
                         <p className="text-sm text-text-secondary text-center p-4">На эту идею нет ссылок.</p>
                    )}
                </div>

                 <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-text-secondary uppercase">Исходящие ссылки ({outgoingLinks.length})</h3>
                        <InfoTooltip text="Идеи, на которые ссылается текущая. Используйте [[...]] для создания." />
                    </div>
                     {outgoingLinks.length > 0 ? (
                        <div className="space-y-1">
                            {outgoingLinks.map(linkTitle => {
                                const linkedNote = allNotes.find(n => n.title.toLowerCase() === linkTitle.toLowerCase());
                                return (
                                    <div key={linkTitle} className="group flex items-center justify-between">
                                         <button
                                            onClick={() => linkedNote ? onBacklinkClick(linkedNote.id) : handleCreateNoteFromLink(linkTitle)}
                                            className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${linkedNote ? 'text-highlight hover:bg-accent' : 'text-text-secondary opacity-70 hover:opacity-100 hover:text-highlight'}`}
                                        >
                                            [[{linkTitle}]]
                                            {!linkedNote && (
                                                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"> (создать)</span>
                                            )}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                         <p className="text-sm text-text-secondary text-center p-4">Нет исходящих ссылок.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BacklinksPanel;