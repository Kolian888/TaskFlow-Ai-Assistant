



import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MindMapNode, Task, Project } from '../types';
import { PlusIcon, CheckIcon, FolderOpenIcon } from './Icons';
import TextFormatToolbar from './TextFormatToolbar';

interface MindMapNodeProps {
    node: MindMapNode;
    level: number;
    onUpdatePosition: (nodeId: string, updates: { x: number; y: number }) => void;
    onUpdateLabel: (nodeId: string, newLabel: string) => void;
    zoom: number;
    isSelected: boolean;
    onSelect: (nodeId: string) => void;
    onAddChild: (parentId: string) => void;
    onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
    tasks: Task[];
    projects: Project[];
    doneColumnNames: Set<string>;
}

const MindMapNodeComponent: React.FC<MindMapNodeProps> = ({ node, level, onUpdatePosition, onUpdateLabel, zoom, isSelected, onSelect, onAddChild, onContextMenu, tasks, projects, doneColumnNames }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const labelRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    const linkedTaskInfo = useMemo(() => {
        if (!node.linkedTaskId) return null;
        const task = tasks.find(t => t.id === node.linkedTaskId);
        if (!task) return null;
        const isDone = doneColumnNames.has(task.status);
        return { task, isDone };
    }, [node.linkedTaskId, tasks, doneColumnNames]);

    const linkedProjectInfo = useMemo(() => {
        if (!node.linkedProjectId) return null;
        const project = projects.find(p => p.id === node.linkedProjectId);
        if (!project) return null;
        return { project };
    }, [node.linkedProjectId, projects]);

    useEffect(() => {
        if (isEditing) {
            setTimeout(() => {
                labelRef.current?.focus();
            }, 0);
        }
    }, [isEditing]);
    
    const handleBlur = () => {
        setTimeout(() => {
            const activeEl = document.activeElement;
            if (toolbarRef.current && toolbarRef.current.contains(activeEl)) {
                 labelRef.current?.focus();
                 return;
            }
            
            setIsEditing(false);
            const newLabelHTML = labelRef.current?.innerHTML || '';
            if (newLabelHTML !== node.label) {
                onUpdateLabel(node.id, newLabelHTML);
            }
        }, 100);
    };
    
    let levelStyles = [
        { border: 'border-highlight', shadow: 'shadow-[0_0_20px_0px_rgba(88,166,255,0.7)]', bg: 'bg-highlight/10' }, 
        { border: 'border-neon-purple', shadow: 'shadow-[0_0_15px_-2px_rgba(156,94,255,0.5)]', bg: 'bg-neon-purple/10' },
        { border: 'border-brand-teal border-dashed', shadow: 'shadow-none', bg: 'bg-brand-teal/5' },
        { border: 'border-border-color', shadow: 'shadow-none', bg: 'bg-white/5' },
        { border: 'border-border-color/50', shadow: 'shadow-none', bg: 'bg-white/5' },
    ];
    let currentStyle = levelStyles[Math.min(level, levelStyles.length - 1)];

    if (linkedProjectInfo) {
        currentStyle = { border: 'border-neon-purple', shadow: 'shadow-[0_0_20px_0px_rgba(156,94,255,0.7)]', bg: 'bg-neon-purple/10' };
    } else if (linkedTaskInfo) {
        if (linkedTaskInfo.isDone) {
            currentStyle = { border: 'border-brand-green', shadow: 'shadow-[0_0_20px_0px_rgba(82,209,134,0.7)]', bg: 'bg-brand-green/10' };
        } else if (!isSelected) {
            currentStyle = { border: 'border-highlight', shadow: 'shadow-[0_0_20px_0px_rgba(88,166,255,0.7)]', bg: 'bg-highlight/10' };
        }
    }


    return (
        <motion.div
            drag
            dragMomentum={false}
            onDragEnd={(_, info) => {
                onUpdatePosition(node.id, { x: node.x + info.offset.x / zoom, y: node.y + info.offset.y / zoom });
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(node.id);
            }}
            onContextMenu={(e) => {
                e.stopPropagation();
                onSelect(node.id);
                onContextMenu(e, node.id);
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            className={`absolute p-4 backdrop-blur-md rounded-xl cursor-grab active:cursor-grabbing flex items-center justify-center mind-map-node border-2 ${currentStyle.border} ${currentStyle.bg}`}
            style={{ x: node.x, y: node.y, translateX: '-50%', translateY: '-50%' }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
                scale: 1, 
                opacity: 1,
                boxShadow: isSelected 
                    ? '0 0 20px 0px rgba(88,166,255,0.7), 0 0 10px 0px rgba(163, 113, 247, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.1)' 
                    : currentStyle.shadow,
            }}
            transition={{
                boxShadow: { duration: 0.5, repeat: isSelected || (linkedTaskInfo && !linkedTaskInfo.isDone) || linkedProjectInfo ? Infinity : 0, repeatType: 'reverse', ease: 'easeInOut' },
                default: { type: 'spring', stiffness: 300, damping: 20 }
            }}
        >
            <AnimatePresence>
                {isEditing && (
                    <TextFormatToolbar 
                        ref={toolbarRef} 
                        onExecCommand={(command) => {
                            document.execCommand(command, false);
                            labelRef.current?.focus();
                        }} 
                    />
                )}
            </AnimatePresence>

            {linkedProjectInfo ? (
                <div 
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center border-2 border-secondary bg-neon-purple"
                    title={`Проект: ${linkedProjectInfo.project.name}`}
                >
                    <FolderOpenIcon className="w-3 h-3 text-secondary"/>
                </div>
            ) : linkedTaskInfo && (
                <div 
                    className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center border-2 border-secondary
                        ${linkedTaskInfo.isDone ? 'bg-brand-green' : 'bg-highlight'}`}
                    title={`Задача: ${linkedTaskInfo.task.title}`}
                >
                    {linkedTaskInfo.isDone ? <CheckIcon className="w-3 h-3 text-secondary"/> : <div className="w-2 h-2 rounded-full bg-secondary"/>}
                </div>
            )}

            <div
                ref={labelRef}
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        labelRef.current?.blur();
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        if (labelRef.current) labelRef.current.innerHTML = node.label;
                        setIsEditing(false);
                    }
                    e.stopPropagation();
                }}
                dangerouslySetInnerHTML={{ __html: node.label }}
                className="text-text-primary font-semibold min-w-[100px] max-w-xs text-center whitespace-normal break-words px-2 outline-none"
                style={{
                    minHeight: '1.5rem',
                    caretColor: 'var(--highlight)',
                }}
            />
             <AnimatePresence>
                {(isHovered || isSelected) && !isEditing && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 10 }}
                        whileHover={{ scale: 1.2, rotate: 90 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddChild(node.id);
                        }}
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-7 h-7 bg-gradient-to-br from-highlight to-neon-purple rounded-full flex items-center justify-center text-primary shadow-lg z-10"
                        title="Добавить дочерний узел (Tab)"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MindMapNodeComponent;