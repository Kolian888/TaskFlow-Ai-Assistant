import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, Subtask, TaskPriority, Attachment, AttachmentType } from '../types';
import { TrashIcon, PlusIcon, EmojiHappyIcon, PaperclipIcon, XIcon, LinkIcon, PhotoIcon, DocumentTextIcon, TagIcon } from './Icons';
import EmojiPickerModal from './EmojiPickerModal';

interface TaskEditModalProps {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
  onCancel: () => void;
  onAddAttachment: (data: { name: string; type: AttachmentType; url: string; }, entity: { type: 'task'; id: string; }) => void;
  onUnlinkAttachment: (attachmentId: string, from: { type: 'task'; id: string; }) => void;
  allAttachments: Attachment[];
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onUpdate, onCancel, onAddAttachment, onUnlinkAttachment, allAttachments }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [pomodoros, setPomodoros] = useState(task.pomodorosEstimated);
  const [emoji, setEmoji] = useState(task.emoji || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [priority, setPriority] = useState(task.priority || TaskPriority.Medium);
  const [tags, setTags] = useState(task.tags?.join(', ') || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [newLink, setNewLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'attachments'>('details');

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setPomodoros(task.pomodorosEstimated);
    setEmoji(task.emoji || '');
    setDueDate(task.dueDate || '');
    setPriority(task.priority || TaskPriority.Medium);
    setTags(task.tags?.join(', ') || '');
    setSubtasks(task.subtasks || []);
  }, [task]);

  const taskAttachments = useMemo(() => {
      return allAttachments.filter(att => task.attachmentIds?.includes(att.id));
  }, [allAttachments, task.attachmentIds]);

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask: Subtask = {
        id: crypto.randomUUID(),
        title: newSubtaskTitle.trim(),
        completed: false,
      };
      setSubtasks([...subtasks, newSubtask]);
      setNewSubtaskTitle('');
    }
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(sub => sub.id !== id));
  };
  
  const handleToggleSubtask = (id: string) => {
      setSubtasks(subtasks.map(sub => sub.id === id ? {...sub, completed: !sub.completed} : sub));
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (title.trim()) {
      const finalTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      onUpdate({ 
        ...task, 
        title: title.trim(), 
        description: description.trim(),
        pomodorosEstimated: pomodoros,
        emoji,
        dueDate,
        priority,
        tags: finalTags,
        subtasks,
      });
      onCancel();
    }
  };

    const handleAddLink = () => {
        if (newLink.trim()) {
            try {
                const url = new URL(newLink);
                onAddAttachment({ name: url.hostname, type: 'link', url: url.href }, { type: 'task', id: task.id });
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
                { type: 'task', id: task.id }
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
        className="bg-secondary p-4 md:p-6 rounded-3xl shadow-soft-glow max-w-md md:max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col border border-border-color"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex-shrink-0">Редактировать задачу</h2>
         <div className="flex items-center gap-2 p-1 bg-primary rounded-full border border-border-color w-fit mb-4">
                <button onClick={() => setActiveTab('details')} className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${activeTab === 'details' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>Детали</button>
                <button onClick={() => setActiveTab('attachments')} className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${activeTab === 'attachments' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>Вложения</button>
            </div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-5">
          {activeTab === 'details' && (
            <>
                <form className="space-y-4">
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название задачи" required className={inputClasses} />
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Краткое описание" rows={3} className={inputClasses} />
                    <div className="relative">
                        <TagIcon className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none text-text-secondary" />
                        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Теги, через запятую" className={`${inputClasses} pl-10`} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="number" min="1" value={pomodoros} onChange={(e) => setPomodoros(parseInt(e.target.value, 10))} className={inputClasses} />
                        <div className="relative">
                        <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="💪" maxLength={2} className={`${inputClasses} h-full text-center text-xl`} />
                        <button type="button" onClick={() => setIsEmojiPickerOpen(true)} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-secondary/50 hover:bg-accent">
                            <EmojiHappyIcon className="w-5 h-5 text-text-secondary"/>
                        </button>
                        </div>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClasses} />
                    </div>
                    <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={`${inputClasses} appearance-none`}>
                        <option value={TaskPriority.Low}>Низкий</option>
                        <option value={TaskPriority.Medium}>Средний</option>
                        <option value={TaskPriority.High}>Высокий</option>
                    </select>
                </form>
                
                <div className="">
                    <h3 className="text-lg font-semibold text-text-secondary mb-3">Подзадачи</h3>
                    <div className="space-y-2">
                    {subtasks.map(sub => (
                        <div key={sub.id} className="flex items-center gap-3 bg-accent/50 p-2.5 rounded-lg">
                        <input type="checkbox" checked={sub.completed} onChange={() => handleToggleSubtask(sub.id)} className="form-checkbox h-5 w-5 rounded bg-secondary border-border-color text-highlight focus:ring-highlight" />
                        <span className={`flex-grow ${sub.completed ? 'line-through text-gray-500' : 'text-text-primary'}`}>{sub.title}</span>
                        <button type="button" onClick={() => handleDeleteSubtask(sub.id)} className="text-text-secondary hover:text-brand-red"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                    <input type="text" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} placeholder="Новая подзадача" className="flex-grow bg-primary border border-border-color rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-highlight" />
                    <button type="button" onClick={handleAddSubtask} className="bg-highlight/80 text-primary p-2.5 rounded-xl hover:bg-highlight"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </>
          )}

          {activeTab === 'attachments' && (
            <div className="">
                <h3 className="text-lg font-semibold text-text-secondary mb-3 flex items-center gap-2"><PaperclipIcon className="w-5 h-5" />Вложения</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {taskAttachments.map(att => (
                        <div key={att.id} className="flex items-center gap-3 bg-accent/50 p-2.5 rounded-lg">
                            {getAttachmentIcon(att)}
                            <a href={att.url} target="_blank" rel="noopener noreferrer" download={att.type === 'file' ? att.name : undefined} className="flex-grow text-sm truncate hover:underline">{att.name}</a>
                            <button onClick={() => onUnlinkAttachment(att.id, { type: 'task', id: task.id })} className="p-1 text-text-secondary hover:text-brand-red rounded-full hover:bg-brand-red/10"><XIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                    {taskAttachments.length === 0 && <p className="text-sm text-gray-500 text-center py-2">Нет вложений</p>}
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
          <button type="button" onClick={handleSubmit} className="px-5 py-2.5 rounded-xl bg-highlight text-primary font-semibold hover:opacity-90 transition-opacity">Сохранить</button>
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

export default TaskEditModal;