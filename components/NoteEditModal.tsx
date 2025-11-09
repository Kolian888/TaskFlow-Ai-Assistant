import React, { useState, useEffect, useMemo } from 'react';
import { Note, NoteFolder, Project, Task } from '../types';

interface NoteEditModalProps {
    note: Note;
    onUpdate: (updatedNote: Note) => void;
    onCancel: () => void;
    noteFolders: NoteFolder[];
    projects: Project[];
    tasks: Task[];
}

const NoteEditModal: React.FC<NoteEditModalProps> = ({ note, onUpdate, onCancel, noteFolders, projects, tasks }) => {
    const [content, setContent] = useState(note.content);
    const [folderId, setFolderId] = useState(note.folderId || 'uncategorized');
    const [linkedProjectIds, setLinkedProjectIds] = useState(new Set(note.linkedProjectIds || []));
    const [linkedTaskIds, setLinkedTaskIds] = useState(new Set(note.linkedTaskIds || []));
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [taskSearchTerm, setTaskSearchTerm] = useState('');
    
    useEffect(() => {
        setContent(note.content);
        setFolderId(note.folderId || 'uncategorized');
        setLinkedProjectIds(new Set(note.linkedProjectIds || []));
        setLinkedTaskIds(new Set(note.linkedTaskIds || []));
    }, []);

    const filteredProjects = useMemo(() => {
        if (!projectSearchTerm) return projects;
        return projects.filter(p => p.name.toLowerCase().includes(projectSearchTerm.toLowerCase()));
    }, [projects, projectSearchTerm]);

    const filteredTasks = useMemo(() => {
        if (!taskSearchTerm) return tasks;
        return tasks.filter(t => t.title.toLowerCase().includes(taskSearchTerm.toLowerCase()));
    }, [tasks, taskSearchTerm]);

    const handleSubmit = () => {
        onUpdate({
            ...note,
            content: content.trim(),
            folderId: folderId === 'uncategorized' ? null : folderId,
            linkedProjectIds: Array.from(linkedProjectIds),
            linkedTaskIds: Array.from(linkedTaskIds),
        });
        onCancel();
    };
    
    const toggleLink = (id: string, type: 'project' | 'task') => {
        if (type === 'project') {
            setLinkedProjectIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                return newSet;
            });
        } else {
            setLinkedTaskIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                return newSet;
            });
        }
    };
    
    return (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4" onClick={onCancel}>
            <div className="bg-secondary p-4 md:p-6 rounded-3xl shadow-soft-glow max-w-md md:max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col border border-border-color" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text-primary mb-6 flex-shrink-0">Редактировать заметку</h2>
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-5">
                    
                    <div>
                        <label htmlFor="noteContent" className="block text-sm font-medium text-text-secondary mb-1.5 pl-1">Содержимое</label>
                        <textarea
                            id="noteContent"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={6}
                            className="w-full bg-accent border border-border-color rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-highlight"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label htmlFor="noteFolder" className="block text-sm font-medium text-text-secondary mb-1.5 pl-1">Папка</label>
                        <select
                            id="noteFolder"
                            value={folderId}
                            onChange={e => setFolderId(e.target.value)}
                            className="w-full bg-accent border border-border-color rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-highlight appearance-none"
                        >
                            <option value="uncategorized">Без папки</option>
                            {noteFolders.map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.emoji} {folder.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Project Links */}
                        <div>
                            <h3 className="text-sm font-medium text-text-secondary mb-2 pl-1">Привязанные проекты</h3>
                             <input
                                type="text"
                                placeholder="Поиск проектов..."
                                value={projectSearchTerm}
                                onChange={e => setProjectSearchTerm(e.target.value)}
                                className="w-full bg-primary border border-border-color rounded-lg p-2 text-sm mb-2 focus:ring-2 focus:ring-highlight focus:outline-none"
                            />
                            <div className="bg-accent border border-border-color rounded-xl p-2 space-y-1 max-h-40 overflow-y-auto">
                                {filteredProjects.map(p => (
                                    <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/50 cursor-pointer">
                                        <input type="checkbox" checked={linkedProjectIds.has(p.id)} onChange={() => toggleLink(p.id, 'project')} className="h-4 w-4 rounded bg-secondary border-border-color text-highlight focus:ring-highlight flex-shrink-0" />
                                        <span className="text-sm truncate">{p.emoji} {p.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {/* Task Links */}
                        <div>
                            <h3 className="text-sm font-medium text-text-secondary mb-2 pl-1">Привязанные задачи</h3>
                            <input
                                type="text"
                                placeholder="Поиск задач..."
                                value={taskSearchTerm}
                                onChange={e => setTaskSearchTerm(e.target.value)}
                                className="w-full bg-primary border border-border-color rounded-lg p-2 text-sm mb-2 focus:ring-2 focus:ring-highlight focus:outline-none"
                            />
                            <div className="bg-accent border border-border-color rounded-xl p-2 space-y-1 max-h-40 overflow-y-auto">
                                {filteredTasks.map(t => (
                                    <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/50 cursor-pointer">
                                        <input type="checkbox" checked={linkedTaskIds.has(t.id)} onChange={() => toggleLink(t.id, 'task')} className="h-4 w-4 rounded bg-secondary border-border-color text-highlight focus:ring-highlight flex-shrink-0" />
                                        <span className="text-sm truncate">{t.emoji} {t.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-5 mt-auto flex-shrink-0 border-t border-border-color">
                    <button onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-accent border border-border-color text-text-primary hover:bg-white/10 font-semibold">Отмена</button>
                    <button onClick={handleSubmit} className="px-5 py-2.5 rounded-xl bg-highlight text-primary font-semibold hover:opacity-90">Сохранить</button>
                </div>
            </div>
        </div>
    );
};

export default NoteEditModal;