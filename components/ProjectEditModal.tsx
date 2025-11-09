import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, Attachment, AttachmentType } from '../types';
import { EmojiHappyIcon, XIcon, LinkIcon, DocumentTextIcon, PhotoIcon, PaperclipIcon } from './Icons';
import EmojiPickerModal from './EmojiPickerModal';

interface ProjectEditModalProps {
  project: Project;
  initialTab?: 'details' | 'attachments';
  onUpdate: (updatedProject: Project) => void;
  onCancel: () => void;
  onAddAttachment: (data: { name: string; type: AttachmentType; url: string; }, entity: { type: 'project'; id: string; }) => void;
  onUnlinkAttachment: (attachmentId: string, from: { type: 'project'; id: string; }) => void;
  allAttachments: Attachment[];
  onOpenGallery: (images: Attachment[], startIndex: number) => void;
}

const ProjectEditModal: React.FC<ProjectEditModalProps> = ({ project, initialTab = 'details', onUpdate, onCancel, onAddAttachment, onUnlinkAttachment, allAttachments, onOpenGallery }) => {
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color || '#A371F7');
  const [emoji, setEmoji] = useState(project.emoji || '');
  const [tags, setTags] = useState(project.tags?.join(', ') || '');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [newLink, setNewLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setName(project.name);
    setColor(project.color || '#A371F7');
    setEmoji(project.emoji || '');
    setTags(project.tags?.join(', ') || '');
  }, [project]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, project.id]);
  
  const projectAttachments = useMemo(() => {
      return (project.attachmentIds || [])
          .map(id => allAttachments.find(att => att.id === id))
          .filter((att): att is Attachment => Boolean(att));
  }, [allAttachments, project.attachmentIds]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (name.trim()) {
      const finalTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      onUpdate({ ...project, name: name.trim(), color, emoji, tags: finalTags });
      onCancel();
    }
  };

    const handleAddLink = () => {
        if (newLink.trim()) {
            try {
                const url = new URL(newLink);
                onAddAttachment({ name: url.hostname, type: 'link', url: url.href }, { type: 'project', id: project.id });
                setNewLink('');
            } catch (error) {
                alert('Пожалуйста, введите корректный URL.');
            }
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const fileType: AttachmentType = file.type.startsWith('image/') ? 'image' : 'file';
            onAddAttachment(
                { name: file.name, type: fileType, url: reader.result as string },
                { type: 'project', id: project.id }
            );
        };
        reader.readAsDataURL(file);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getAttachmentIcon = (att: Attachment) => {
        switch (att.type) {
            case 'link': return <LinkIcon className="w-5 h-5 text-highlight flex-shrink-0" />;
            case 'image': return <img src={att.url} alt={att.name} className="w-5 h-5 object-cover rounded bg-accent flex-shrink-0" />;
            case 'file': return <DocumentTextIcon className="w-5 h-5 text-text-secondary flex-shrink-0" />;
        }
    };
    
    const inputClasses = "w-full bg-accent backdrop-blur-xl border border-border-color shadow-inner-soft rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-highlight transition-colors focus:border-highlight";

  return (
    <>
      <div 
        className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4"
        onClick={onCancel}
        aria-modal="true"
        role="dialog"
      >
        <div 
          className="bg-secondary p-4 md:p-6 rounded-3xl shadow-soft-glow max-w-lg w-full mx-auto max-h-[90vh] flex flex-col border border-border-color"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex-shrink-0">Редактировать проект</h2>
           <div className="flex items-center gap-2 p-1 bg-primary rounded-full border border-border-color w-fit mb-4">
                <button onClick={() => setActiveTab('details')} className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${activeTab === 'details' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>Детали</button>
                <button onClick={() => setActiveTab('attachments')} className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${activeTab === 'attachments' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>Вложения</button>
            </div>

           <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-5">
            {activeTab === 'details' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="projectName" className="block text-sm font-medium text-text-secondary mb-1.5 pl-1">Название проекта</label>
                      <input id="projectName" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} required />
                    </div>
                     <div>
                        <label htmlFor="projectTags" className="block text-sm font-medium text-text-secondary mb-1.5 pl-1">Теги (через запятую)</label>
                        <input id="projectTags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} className={inputClasses} />
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <label htmlFor="projectColor" className="block text-sm font-medium text-text-secondary mb-1.5 pl-1">Цвет</label>
                        <input id="projectColor" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-14 h-14 p-1 bg-accent border border-border-color rounded-xl cursor-pointer" />
                      </div>
                      <div className="flex-grow relative">
                        <label htmlFor="projectEmoji" className="block text-sm font-medium text-text-secondary mb-1.5 pl-1">Смайлик</label>
                        <input id="projectEmoji" type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="💡" maxLength={2} className={`${inputClasses} text-2xl text-center h-14`} />
                        <button type="button" onClick={() => setIsEmojiPickerOpen(true)} className="absolute right-1.5 bottom-1.5 p-1 rounded-full bg-secondary/50 hover:bg-accent"><EmojiHappyIcon className="w-5 h-5 text-text-secondary"/></button>
                      </div>
                    </div>
                </form>
            )}
            
            {activeTab === 'attachments' && (
                <div className="">
                     <h3 className="text-lg font-semibold text-text-secondary mb-3 flex items-center gap-2"><PaperclipIcon className="w-5 h-5" />Вложения</h3>
                     <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {projectAttachments.map(att => {
                            if (att.type === 'image') {
                                const imageAttachments = projectAttachments.filter(a => a.type === 'image');
                                const imageIndex = imageAttachments.findIndex(a => a.id === att.id);
                                return (
                                    <div key={att.id} className="flex items-center gap-3 bg-accent/50 p-2.5 rounded-lg">
                                        {getAttachmentIcon(att)}
                                        <button onClick={() => onOpenGallery(imageAttachments, imageIndex)} className="flex-grow text-sm truncate hover:underline text-text-primary text-left">{att.name}</button>
                                        <button onClick={() => onUnlinkAttachment(att.id, { type: 'project', id: project.id })} className="p-1 text-text-secondary hover:text-brand-red rounded-full hover:bg-brand-red/10"><XIcon className="w-4 h-4"/></button>
                                    </div>
                                );
                            }
                            return (
                                <div key={att.id} className="flex items-center gap-3 bg-accent/50 p-2.5 rounded-lg">
                                    {getAttachmentIcon(att)}
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" download={att.type === 'file' ? att.name : undefined} className="flex-grow text-sm truncate hover:underline text-text-primary">{att.name}</a>
                                    <button onClick={() => onUnlinkAttachment(att.id, { type: 'project', id: project.id })} className="p-1 text-text-secondary hover:text-brand-red rounded-full hover:bg-brand-red/10"><XIcon className="w-4 h-4"/></button>
                                </div>
                            );
                        })}
                        {projectAttachments.length === 0 && <p className="text-sm text-gray-500 text-center py-2">Нет вложений</p>}
                     </div>
                     <div className="mt-4 space-y-3">
                        <div className="flex gap-2">
                            <input type="text" value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="Вставьте ссылку..." className="flex-grow bg-primary border border-border-color rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-highlight" />
                            <button onClick={handleAddLink} className="bg-highlight/80 text-primary px-4 py-2 text-sm font-semibold rounded-xl hover:bg-highlight transition-colors">Добавить</button>
                        </div>
                        <div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="w-full text-center bg-accent border border-border-color text-text-secondary px-4 py-2.5 text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors">Загрузить фото или файл</button>
                        </div>
                        <p className="text-xs text-center text-gray-500">Изменения во вложениях сохраняются автоматически.</p>
                     </div>
                </div>
            )}
           </div>
            <div className="flex justify-end gap-4 pt-5 mt-auto flex-shrink-0 border-t border-border-color">
              <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-accent border border-border-color text-text-primary hover:bg-white/10 transition-colors font-semibold">Отмена</button>
              <button type="button" onClick={() => handleSubmit()} className="px-5 py-2.5 rounded-xl bg-highlight text-primary font-semibold hover:opacity-90 transition-opacity">Сохранить</button>
            </div>
        </div>
      </div>
       <EmojiPickerModal
          isOpen={isEmojiPickerOpen}
          onClose={() => setIsEmojiPickerOpen(false)}
          onSelectEmoji={(emoji) => {
              setEmoji(emoji);
              setIsEmojiPickerOpen(false);
          }}
      />
    </>
  );
};

export default ProjectEditModal;