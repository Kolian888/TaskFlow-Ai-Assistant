import React, { useMemo, useState } from 'react';
import { Attachment, Project, Task, AttachmentType } from '../types';
import { DocumentTextIcon, FolderOpenIcon, LinkIcon, PhotoIcon, TrashIcon } from './Icons';

interface FileLibraryProps {
    attachments: Attachment[];
    projects: Project[];
    tasks: Task[];
    onDeleteAttachment: (attachmentId: string) => void;
}

type FilterType = 'all' | AttachmentType;

const FileLibrary: React.FC<FileLibraryProps> = ({ attachments, projects, tasks, onDeleteAttachment }) => {
    const [filter, setFilter] = useState<FilterType>('all');

    const getUsageInfo = (attachmentId: string) => {
        const usedInProjects = projects.filter(p => p.attachmentIds?.includes(attachmentId));
        const usedInTasks = tasks.filter(t => t.attachmentIds?.includes(attachmentId));
        return { projects: usedInProjects, tasks: usedInTasks };
    };

    const getAttachmentIcon = (type: AttachmentType, url?: string) => {
        switch (type) {
            case 'link': return <div className="w-12 h-12 flex items-center justify-center bg-accent rounded-xl"><LinkIcon className="w-6 h-6 text-highlight" /></div>;
            case 'image': return <img src={url} alt="preview" className="w-12 h-12 object-cover rounded-xl bg-accent" />;
            case 'file': return <div className="w-12 h-12 flex items-center justify-center bg-accent rounded-xl"><DocumentTextIcon className="w-6 h-6 text-text-secondary" /></div>;
            default: return <div className="w-12 h-12 flex items-center justify-center bg-accent rounded-xl"><DocumentTextIcon className="w-6 h-6 text-text-secondary" /></div>;
        }
    };
    
    const sortedAttachments = useMemo(() => {
       return [...attachments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [attachments]);
    
    const filteredAttachments = useMemo(() => {
        if (filter === 'all') return sortedAttachments;
        return sortedAttachments.filter(att => att.type === filter);
    }, [sortedAttachments, filter]);

    return (
        <div className="bg-secondary p-8 rounded-3xl border border-border-color shadow-soft-glow">
            <div className="flex items-center gap-3 mb-6">
                <FolderOpenIcon className="w-8 h-8 text-brand-purple" />
                <h2 className="text-3xl font-bold text-text-primary">Библиотека файлов</h2>
            </div>
            
             <div className="flex items-center gap-2 mb-8 p-1.5 bg-primary rounded-full border border-border-color w-fit">
                {(['all', 'link', 'image', 'file'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                            filter === f
                            ? 'bg-highlight text-primary'
                            : 'text-text-primary hover:bg-white/5'
                        }`}
                    >
                        {f === 'all' ? 'Все' : f === 'link' ? 'Ссылки' : f === 'image' ? 'Изображения' : 'Файлы'}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filteredAttachments.length > 0 ? filteredAttachments.map(att => {
                    const usage = getUsageInfo(att.id);
                    return (
                        <div key={att.id} className="bg-accent/50 p-4 rounded-2xl flex items-center gap-4 border border-border-color">
                            {getAttachmentIcon(att.type, att.url)}
                            <div className="flex-grow">
                                <a 
                                    href={att.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    download={att.type === 'file' ? att.name : undefined}
                                    className="font-semibold text-text-primary hover:underline break-all"
                                >
                                    {att.name}
                                </a>
                                <p className="text-xs text-text-secondary">
                                    Добавлено: {new Date(att.createdAt).toLocaleDateString()}
                                </p>
                                {(usage.projects.length > 0 || usage.tasks.length > 0) && (
                                    <div className="text-xs text-text-secondary mt-2 flex flex-wrap gap-x-2 gap-y-1 items-center">
                                       <span className="font-semibold">Используется в:</span>
                                       {usage.projects.map(p => <span key={p.id} className="bg-primary/80 px-1.5 py-0.5 rounded text-text-primary">{p.emoji} {p.name}</span>)}
                                       {usage.tasks.map(t => <span key={t.id} className="bg-primary/50 px-1.5 py-0.5 rounded text-text-primary">{t.emoji} {t.title}</span>)}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => onDeleteAttachment(att.id)} className="p-2 text-text-secondary rounded-lg hover:bg-brand-red/10 hover:text-brand-red transition-colors flex-shrink-0" aria-label={`Удалить вложение ${att.name}`}>
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )
                }) : (
                     <div className="text-center py-16">
                        <h3 className="text-xl font-semibold text-text-secondary">Библиотека пуста</h3>
                        <p className="text-text-primary mt-2">Добавляйте файлы, ссылки и изображения в ваши проекты и задачи.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileLibrary;