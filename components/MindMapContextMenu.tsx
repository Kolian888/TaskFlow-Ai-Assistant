import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, LinkIcon, FolderOpenIcon } from './Icons';

interface MindMapContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onConvertToTask: () => void;
    onLinkToTask: () => void;
    onConvertToProject: () => void;
    onLinkToProject: () => void;
}

const MindMapContextMenu: React.FC<MindMapContextMenuProps> = ({ x, y, onClose, onConvertToTask, onLinkToTask, onConvertToProject, onLinkToProject }) => {
    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-50"
            onClick={onClose}
            onContextMenu={e => { e.preventDefault(); onClose(); }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="absolute bg-secondary p-2 rounded-xl border border-border-color shadow-lg"
                style={{ top: y, left: x }}
            >
                <ul className="text-sm text-text-primary">
                    <li>
                        <button
                            onClick={() => handleAction(onConvertToTask)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-accent"
                        >
                            <CheckCircleIcon className="w-4 h-4 text-highlight" />
                            <span>Преобразовать в задачу</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleAction(onLinkToTask)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-accent"
                        >
                            <LinkIcon className="w-4 h-4 text-brand-yellow" />
                            <span>Привязать к задаче</span>
                        </button>
                    </li>
                    <div className="h-px bg-border-color my-1"></div>
                    <li>
                        <button
                            onClick={() => handleAction(onConvertToProject)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-accent"
                        >
                            <FolderOpenIcon className="w-4 h-4 text-neon-purple" />
                            <span>Преобразовать в проект</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleAction(onLinkToProject)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-accent"
                        >
                            <LinkIcon className="w-4 h-4 text-brand-yellow" />
                            <span>Привязать к проекту</span>
                        </button>
                    </li>
                </ul>
            </motion.div>
        </div>
    );
};

export default MindMapContextMenu;