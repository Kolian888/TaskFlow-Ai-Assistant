import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { MindMap, MindMapNode, Project, Task, Board } from '../types';
import { PlusIcon, TrashIcon, SparklesIcon, ShareIcon, XIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from './Icons';
import MindMapNodeComponent from './MindMapNode';
import MindMapContextMenu from './MindMapContextMenu';
import TaskLinkerModal from './TaskLinkerModal';
import ProjectLinkerModal from './ProjectLinkerModal';

interface MindMapViewProps {
    mindMaps: MindMap[];
    activeMapId: string | null;
    onSetActiveMapId: (id: string | null) => void;
    onAddMindMap: (map: MindMap) => void;
    onUpdateMindMap: (map: MindMap) => void;
    onDeleteMindMap: (mapId: string) => void;
    onAddMindMapNode: (mapId: string, label: string, parentId: string | null | undefined, position: { x: number, y: number } | null, callback: (newNodeId: string) => void) => void;
    onUpdateMindMapNode: (mapId: string, nodeId: string, newLabel: string) => void;
    onDeleteMindMapNode: (mapId: string, nodeId: string) => void;
    projects: Project[];
    tasks: Task[];
    boards: Board[];
    isGenerating: boolean;
    onGenerateFromProject: (projectId: string) => Promise<MindMap | null>;
    onConvertToTask: (mapId: string, nodeId: string) => void;
    onLinkTaskToNode: (mapId: string, nodeId: string, taskId: string) => void;
    onConvertToProject: (mapId: string, nodeId: string) => void;
    onLinkProjectToNode: (mapId: string, nodeId: string, projectId: string) => void;
}

const MindMapView: React.FC<MindMapViewProps> = ({ mindMaps, activeMapId, onSetActiveMapId, onAddMindMap, onUpdateMindMap, onDeleteMindMap, onAddMindMapNode, onUpdateMindMapNode, onDeleteMindMapNode, projects, tasks, boards, isGenerating, onGenerateFromProject, onConvertToTask, onLinkTaskToNode, onConvertToProject, onLinkProjectToNode }) => {
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isNewMapModalOpen, setIsNewMapModalOpen] = useState(false);
    const [newMapName, setNewMapName] = useState('');
    const [projectSearch, setProjectSearch] = useState('');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);
    const [isTaskLinkerOpen, setIsTaskLinkerOpen] = useState(false);
    const [isProjectLinkerOpen, setIsProjectLinkerOpen] = useState(false);
    const [nodeToLink, setNodeToLink] = useState<MindMapNode | null>(null);


    const activeMap = useMemo(() => mindMaps.find(m => m.id === activeMapId), [mindMaps, activeMapId]);
    const nodes = useMemo(() => activeMap?.nodes || [], [activeMap]);
    const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
    
    const nodeLevels = useMemo(() => {
        const levels = new Map<string, number>();
        if (!activeMap) return levels;

        const calculateLevel = (nodeId: string, currentLevel: number) => {
            if (levels.has(nodeId) && levels.get(nodeId)! <= currentLevel) {
                return;
            }
            levels.set(nodeId, currentLevel);
            const children = activeMap.nodes.filter(n => n.parentId === nodeId);
            children.forEach(child => calculateLevel(child.id, currentLevel + 1));
        };

        activeMap.nodes.forEach(node => {
            if (!node.parentId) {
                calculateLevel(node.id, 0);
            }
        });
        return levels;
    }, [activeMap]);

    const doneColumnNames = useMemo(() => {
        const names = new Set<string>();
        boards.forEach(b => {
            if (b.columns.length > 0) {
                names.add(b.columns[b.columns.length - 1]);
            }
        });
        return names;
    }, [boards]);

    const filteredProjects = useMemo(() => projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase())), [projects, projectSearch]);

    useEffect(() => {
        if (activeMap) {
            const rootNode = activeMap.nodes.find(n => !n.parentId);
            setSelectedNodeId(rootNode?.id || (activeMap.nodes[0]?.id || null));
        } else {
            setSelectedNodeId(null);
        }
    }, [activeMap]);

     useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activeMapId || !selectedNodeId) return;
    
            const target = e.target as HTMLElement;
            if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            const selectedNode = nodeMap.get(selectedNodeId);
            if (!selectedNode) return;
    
            switch (e.key) {
                case 'Tab': { // Add child
                    e.preventDefault();
                    onAddMindMapNode(activeMapId, 'Новый узел', selectedNodeId, null, newNodeId => setSelectedNodeId(newNodeId));
                    break;
                }
                case 'Enter': { // Add sibling
                    e.preventDefault();
                    onAddMindMapNode(activeMapId, 'Новый узел', selectedNode.parentId, null, newNodeId => setSelectedNodeId(newNodeId));
                    break;
                }
                case 'Delete':
                case 'Backspace':
                    if (e.metaKey || e.ctrlKey) return;
                    e.preventDefault();
                    const newSelectedId = selectedNode.parentId || nodes.find(n => n.id !== selectedNodeId)?.id || null;
                    onDeleteMindMapNode(activeMapId, selectedNodeId);
                    setSelectedNodeId(newSelectedId);
                    break;
            }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeMapId, selectedNodeId, onAddMindMapNode, onDeleteMindMapNode, nodeMap, nodes]);

    const handleCreateNewMap = () => {
        setNewMapName(`Карта ${mindMaps.length + 1}`);
        setIsNewMapModalOpen(true);
    };
    
    const confirmCreateNewMap = () => {
        if (newMapName.trim()) {
            const newMap: MindMap = {
                id: crypto.randomUUID(),
                name: newMapName.trim(),
                nodes: [{ id: crypto.randomUUID(), label: newMapName.trim(), x: 0, y: 0, parentId: null }]
            };
            onAddMindMap(newMap);
            onSetActiveMapId(newMap.id);
            setIsNewMapModalOpen(false);
            setNewMapName('');
        }
    };

    const updateNodePosition = useCallback((nodeId: string, newPosition: { x: number, y: number }) => {
        if (!activeMap) return;
        const updatedNodes = activeMap.nodes.map(n => n.id === nodeId ? { ...n, ...newPosition } : n);
        onUpdateMindMap({ ...activeMap, nodes: updatedNodes });
    }, [activeMap, onUpdateMindMap]);

    const updateNodeLabel = (nodeId: string, newLabel: string) => {
        if (activeMapId) {
            onUpdateMindMapNode(activeMapId, nodeId, newLabel);
        }
    };

    const handleAddChild = useCallback((parentId: string) => {
        if (activeMapId) {
            onAddMindMapNode(activeMapId, 'Новый узел', parentId, null, newNodeId => setSelectedNodeId(newNodeId));
        }
    }, [activeMapId, onAddMindMapNode]);

    const handleCanvasDoubleClick = (e: React.MouseEvent) => {
        if (!activeMap || !containerRef.current) return;
        
        const target = e.target as HTMLElement;
        if (target.closest('.mind-map-node')) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;
        
        onAddMindMapNode(activeMapId, 'Новый узел', null, { x, y }, newNodeId => setSelectedNodeId(newNodeId));
    };

    const handlePan = (_: any, info: PanInfo) => {
        setPan(prev => ({ x: prev.x + info.delta.x, y: prev.y + info.delta.y }));
    };

    const handleZoom = (e: React.WheelEvent) => {
        if (!containerRef.current) return;
        const newZoom = Math.max(0.1, Math.min(3, zoom - e.deltaY * 0.001));
        setZoom(newZoom);
    };

    const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
    };
    
    const { svgDimensions, svgTransform } = useMemo(() => {
        if (nodes.length < 2) {
            return { svgDimensions: { width: 0, height: 0, top: 0, left: 0 }, svgTransform: '' };
        }
    
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x);
            maxY = Math.max(maxY, node.y);
        });
        
        const padding = 200; // Padding around the nodes
    
        const top = minY - padding;
        const left = minX - padding;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
    
        return {
            svgDimensions: { width, height, top, left },
            svgTransform: `translate(${-left}, ${-top})`
        };
    }, [nodes]);

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6">
            <motion.aside 
                layout="position"
                initial={false}
                animate={{ width: isSidebarCollapsed ? 80 : '25%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                className="bg-secondary rounded-2xl border border-border-color flex flex-col overflow-hidden z-10"
            >
                <div className="p-4 flex items-center justify-between flex-shrink-0 whitespace-nowrap">
                    <AnimatePresence>
                        {!isSidebarCollapsed && (
                            <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0 }} className="text-xl font-bold text-text-primary">Интеллект-карты</motion.h2>
                        )}
                    </AnimatePresence>
                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="p-2 rounded-full hover:bg-accent transition-colors"
                        title={isSidebarCollapsed ? 'Развернуть' : 'Свернуть'}
                    >
                        {isSidebarCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5 text-text-secondary" /> : <ChevronDoubleLeftIcon className="w-5 h-5 text-text-secondary" />}
                    </button>
                </div>

                <div className="flex-grow space-y-1 overflow-y-auto px-4">
                    {mindMaps.map(map => (
                        <div key={map.id} className="group flex items-center">
                            <button
                                onClick={() => onSetActiveMapId(map.id)}
                                className={`w-full text-left p-2 rounded-lg text-sm font-semibold truncate ${activeMapId === map.id ? 'bg-highlight text-primary' : 'hover:bg-accent text-text-primary'}`}
                            >
                                {map.name}
                            </button>
                             <button onClick={() => onDeleteMindMap(map.id)} className={`p-1 text-text-secondary hover:text-brand-red ${isSidebarCollapsed ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
                 <div className="mt-auto p-4 border-t border-border-color space-y-2 whitespace-nowrap">
                     <button onClick={handleCreateNewMap} className="w-full flex items-center justify-center gap-2 p-2.5 bg-highlight/80 text-primary font-bold rounded-xl hover:bg-highlight">
                         <PlusIcon className="w-5 h-5"/> {!isSidebarCollapsed && 'Новая карта'}
                     </button>
                     <button onClick={() => setIsProjectModalOpen(true)} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 p-2.5 bg-neon-purple/80 text-white font-bold rounded-xl hover:bg-neon-purple disabled:opacity-50">
                        <SparklesIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`}/> {!isSidebarCollapsed && (isGenerating ? 'Генерация...' : 'Создать из проекта')}
                    </button>
                 </div>
            </motion.aside>
            <main
                className="flex-grow bg-primary rounded-2xl border-2 overflow-hidden relative transition-colors duration-300 border-border-color"
                ref={containerRef} onWheel={handleZoom}
            >
                 <div className="absolute inset-0 z-0 bg-base-bg overflow-hidden">
                    <div 
                        className="absolute inset-[-200%] w-[400%] h-[400%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:2rem_2rem] animate-[pan_120s_linear_infinite]"
                        style={{ backgroundPosition: `${pan.x}px ${pan.y}px`, transform: `scale(${zoom})`}}
                    ></div>
                </div>

                {activeMap ? (
                    <motion.div
                        drag
                        onDrag={handlePan}
                        dragMomentum={false}
                        className="w-full h-full relative cursor-grab active:cursor-grabbing"
                        onDoubleClick={handleCanvasDoubleClick}
                    >
                        <motion.div 
                            className="absolute top-0 left-0"
                            style={{ x: pan.x, y: pan.y, scale: zoom }}
                        >
                            <svg 
                                className="absolute pointer-events-none" 
                                style={{ ...svgDimensions, overflow: 'visible' }}
                            >
                                <defs>
                                     <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#A371F7" />
                                        <stop offset="100%" stopColor="#58A6FF" />
                                    </linearGradient>
                                     <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <g transform={svgTransform}>
                                    {nodes.map(node => {
                                        const parent = node.parentId ? nodeMap.get(node.parentId) : null;
                                        if (!parent) return null;

                                        const pathId = `path-${parent.id}-${node.id}`;
                                        const d = `M ${parent.x} ${parent.y} C ${parent.x} ${parent.y + 75}, ${node.x} ${node.y - 75}, ${node.x} ${node.y}`;

                                        return (
                                            <g key={pathId}>
                                                <motion.path
                                                    d={d}
                                                    id={pathId}
                                                    stroke="url(#line-gradient)"
                                                    strokeWidth="1.5"
                                                    fill="none"
                                                    opacity="0.4"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 0.5, delay: 0.2 }}
                                                />
                                                 {[...Array(3)].map((_, i) => (
                                                    <circle r="2" fill="url(#line-gradient)" key={i} filter="url(#glow)">
                                                        <animateMotion
                                                            dur={`${Math.random() * 2 + 3}s`}
                                                            begin={`${Math.random() * 3}s`}
                                                            repeatCount="indefinite"
                                                        >
                                                            <mpath xlinkHref={`#${pathId}`} />
                                                        </animateMotion>
                                                    </circle>
                                                ))}
                                            </g>
                                        );
                                    })}
                                </g>
                            </svg>
                            {nodes.map(node => (
                                <MindMapNodeComponent 
                                    key={node.id} 
                                    node={node}
                                    level={nodeLevels.get(node.id) ?? 0}
                                    onUpdatePosition={updateNodePosition} 
                                    onUpdateLabel={updateNodeLabel} 
                                    zoom={zoom} 
                                    isSelected={selectedNodeId === node.id}
                                    onSelect={setSelectedNodeId}
                                    onAddChild={handleAddChild}
                                    onContextMenu={handleNodeContextMenu}
                                    tasks={tasks}
                                    projects={projects}
                                    doneColumnNames={doneColumnNames}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center z-10 relative">
                        <ShareIcon className="w-16 h-16 text-text-secondary/30 mb-4"/>
                        <h3 className="text-xl font-bold text-text-primary">Начните работу с интеллект-картами</h3>
                        <p className="text-text-secondary mt-2">Создайте новую карту или сгенерируйте её из существующего проекта.</p>
                    </div>
                )}
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-secondary/80 backdrop-blur-md p-2 rounded-full border border-border-color text-xs text-text-secondary flex gap-4 z-20">
                    <span><kbd className="font-sans bg-accent px-1.5 py-0.5 rounded">Tab</kbd> → дочерний</span>
                    <span><kbd className="font-sans bg-accent px-1.5 py-0.5 rounded">Enter</kbd> → братский</span>
                    <span><kbd className="font-sans bg-accent px-1.5 py-0.5 rounded">Delete</kbd> → удалить</span>
                </div>
            </main>
            
            <AnimatePresence>
                {contextMenu && activeMapId && (
                    <MindMapContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        onConvertToTask={() => onConvertToTask(activeMapId, contextMenu.nodeId)}
                        onLinkToTask={() => {
                            const node = activeMap?.nodes.find(n => n.id === contextMenu.nodeId);
                            if (node) { setNodeToLink(node); setIsTaskLinkerOpen(true); }
                        }}
                        onConvertToProject={() => onConvertToProject(activeMapId, contextMenu.nodeId)}
                        onLinkToProject={() => {
                            const node = activeMap?.nodes.find(n => n.id === contextMenu.nodeId);
                            if (node) { setNodeToLink(node); setIsProjectLinkerOpen(true); }
                        }}
                    />
                )}
            </AnimatePresence>
            
            <TaskLinkerModal
                isOpen={isTaskLinkerOpen}
                onClose={() => setIsTaskLinkerOpen(false)}
                tasks={tasks}
                onLinkTask={(taskId) => {
                    if (activeMapId && nodeToLink) {
                        onLinkTaskToNode(activeMapId, nodeToLink.id, taskId);
                    }
                }}
            />

            <ProjectLinkerModal
                isOpen={isProjectLinkerOpen}
                onClose={() => setIsProjectLinkerOpen(false)}
                projects={projects}
                onLinkProject={(projectId) => {
                    if (activeMapId && nodeToLink) {
                        onLinkProjectToNode(activeMapId, nodeToLink.id, projectId);
                    }
                }}
            />

             {/* New Map Modal */}
            <AnimatePresence>
                {isNewMapModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4"
                        onClick={() => setIsNewMapModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-secondary p-6 rounded-2xl shadow-soft-glow w-full max-w-sm border border-border-color"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4 text-text-primary">Новая интеллект-карта</h3>
                            <input
                                value={newMapName}
                                onChange={e => setNewMapName(e.target.value)}
                                placeholder="Название карты"
                                className="w-full bg-accent border border-border-color rounded-lg p-3 mb-4 text-text-primary focus:ring-2 focus:ring-highlight outline-none"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && confirmCreateNewMap()}
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsNewMapModalOpen(false)} className="px-4 py-2 bg-accent rounded-lg text-text-primary font-semibold">Отмена</button>
                                <button onClick={confirmCreateNewMap} className="px-4 py-2 bg-highlight text-primary font-semibold rounded-lg">Создать</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Project Selection Modal */}
            <AnimatePresence>
                {isProjectModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4"
                        onClick={() => setIsProjectModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-secondary p-6 rounded-2xl shadow-soft-glow w-full max-w-md border border-border-color flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4 text-text-primary">Создать из проекта</h3>
                            <input
                                type="text"
                                value={projectSearch}
                                onChange={e => setProjectSearch(e.target.value)}
                                placeholder="Поиск проекта..."
                                className="w-full bg-accent border border-border-color rounded-lg p-2 mb-4 text-text-primary focus:ring-2 focus:ring-highlight outline-none"
                            />
                            <div className="max-h-60 overflow-y-auto space-y-1 pr-2 -mr-3">
                                {filteredProjects.map(p => (
                                    <button key={p.id} onClick={async () => { await onGenerateFromProject(p.id); setIsProjectModalOpen(false); }}
                                        disabled={isGenerating}
                                        className="w-full text-left p-2 text-sm rounded-md hover:bg-accent disabled:text-text-secondary text-text-primary"
                                    >
                                        {p.emoji} {p.name}
                                    </button>
                                ))}
                                {filteredProjects.length === 0 && <p className="text-sm text-text-secondary text-center p-4">Проекты не найдены.</p>}
                            </div>
                             <button onClick={() => setIsProjectModalOpen(false)} className="mt-4 px-4 py-2 bg-accent rounded-lg self-end text-text-primary font-semibold">Закрыть</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style>{`
                @keyframes pan {
                    0% { transform: translate(0, 0); }
                    25% { transform: translate(10px, 10px); }
                    50% { transform: translate(10px, 0); }
                    75% { transform: translate(0, 10px); }
                    100% { transform: translate(0, 0); }
                }
            `}</style>
        </div>
    );
};

export default MindMapView;