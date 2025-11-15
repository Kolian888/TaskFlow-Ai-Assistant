import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Note } from '../types';
import { SparklesIcon, PlusIcon, MinusIcon, ViewfinderCircleIcon } from './Icons';

interface GraphViewProps {
    notes: Note[];
    onNavigateToNote: (noteId: string) => void;
}

// FIX: Define the PhysicsNode interface to correctly type the simulation state,
// resolving errors where node properties were being accessed on an 'unknown' type.
interface PhysicsNode {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

interface GraphNode extends Note {
    connections: number;
}
interface GraphEdge {
    source: string;
    target: string;
}

// FIX: Add explicit return type to the hook to ensure correct type inference.
const useForceLayout = (notes: Note[], edges: GraphEdge[], mousePosRef: React.RefObject<{ x: number, y: number } | null>): Map<string, PhysicsNode> => {
    const [nodePhysics, setNodePhysics] = useState<Map<string, PhysicsNode>>(new Map());

    useEffect(() => {
        const initialPhysics = new Map<string, PhysicsNode>();
        notes.forEach((note, index) => {
            const radius = 100 + Math.random() * 50;
            const angle = (index / notes.length) * 2 * Math.PI;
            initialPhysics.set(note.id, {
                id: note.id,
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
                vx: 0,
                vy: 0,
            });
        });
        setNodePhysics(new Map(initialPhysics));

        let animationFrameId: number;
        
        const stiffness = 0.03;
        const repulsion = 300;
        const damping = 0.95;
        const idealLength = 150;

        const simulate = () => {
            setNodePhysics(currentPhysics => {
                const newPhysics = new Map(Array.from(currentPhysics, ([key, value]) => [key, { ...value }]));
                const nodeArr = [...newPhysics.values()];
                const forces = new Map(nodeArr.map(n => [n.id, { fx: 0, fy: 0 }]));

                // Repulsion
                for (let i = 0; i < nodeArr.length; i++) {
                    for (let j = i + 1; j < nodeArr.length; j++) {
                        const nodeA = nodeArr[i];
                        const nodeB = nodeArr[j];
                        const dx = nodeA.x - nodeB.x;
                        const dy = nodeA.y - nodeB.y;
                        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                        const force = repulsion / (distance * distance);
                        
                        const forceAx = (dx / distance) * force;
                        const forceAy = (dy / distance) * force;

                        forces.get(nodeA.id)!.fx += forceAx;
                        forces.get(nodeA.id)!.fy += forceAy;
                        forces.get(nodeB.id)!.fx -= forceAx;
                        forces.get(nodeB.id)!.fy -= forceAy;
                    }
                }

                // Spring
                edges.forEach(edge => {
                    const sourceNode = newPhysics.get(edge.source);
                    const targetNode = newPhysics.get(edge.target);
                    if (!sourceNode || !targetNode) return;
                    
                    const dx = targetNode.x - sourceNode.x;
                    const dy = targetNode.y - sourceNode.y;
                    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                    const displacement = distance - idealLength;
                    const force = stiffness * displacement;

                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;

                    forces.get(sourceNode.id)!.fx += fx;
                    forces.get(sourceNode.id)!.fy += fy;
                    forces.get(targetNode.id)!.fx -= fx;
                    forces.get(targetNode.id)!.fy -= fy;
                });

                // Mouse Repulsion
                const mousePos = mousePosRef.current;
                if (mousePos) {
                    const mouseRepulsion = 6000;
                    newPhysics.forEach(node => {
                        const dx = node.x - mousePos.x;
                        const dy = node.y - mousePos.y;
                        const distance = Math.max(1, Math.sqrt(dx*dx + dy*dy));
                        if (distance < 200) { // Only affect nodes within a radius
                            const force = mouseRepulsion / (distance * distance);
                            forces.get(node.id)!.fx += (dx / distance) * force;
                            forces.get(node.id)!.fy += (dy / distance) * force;
                        }
                    });
                }
                
                // Update
                newPhysics.forEach(node => {
                    const force = forces.get(node.id)!;
                    node.vx = (node.vx + force.fx) * damping;
                    node.vy = (node.vy + force.fy) * damping;
                    node.x += node.vx;
                    node.y += node.vy;
                });

                return newPhysics;
            });

            animationFrameId = requestAnimationFrame(simulate);
        };

        animationFrameId = requestAnimationFrame(simulate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [notes, edges, mousePosRef]);

    return nodePhysics;
};


const GraphView: React.FC<GraphViewProps> = ({ notes, onNavigateToNote }) => {
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(0.6);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const mousePosRef = useRef<{x: number; y: number} | null>(null);

    const { nodes: graphNodes, edges } = useMemo(() => {
        const noteMapByTitle = new Map<string, Note>(notes.map(n => [n.title.toLowerCase(), n]));
        const calculatedEdges: GraphEdge[] = [];
        const edgeSet = new Set<string>();
        const connectionCounts: Record<string, number> = {};

        notes.forEach(note => {
            connectionCounts[note.id] = 0;
        });

        notes.forEach(sourceNote => {
            // 1. Find explicit [[links]]
            const linkRegex = /\[\[(.*?)\]\]/g;
            let match;
            while ((match = linkRegex.exec(sourceNote.content)) !== null) {
                const targetTitle = match[1].toLowerCase();
                const targetNote = noteMapByTitle.get(targetTitle);
                if (targetNote && sourceNote.id !== targetNote.id) {
                    const edgeKey = [sourceNote.id, targetNote.id].sort().join('-');
                    if (!edgeSet.has(edgeKey)) {
                        edgeSet.add(edgeKey);
                        calculatedEdges.push({ source: sourceNote.id, target: targetNote.id });
                    }
                }
            }

            // 2. Find implicit text matches
            notes.forEach(targetNote => {
                if (sourceNote.id === targetNote.id) return;
                if (!targetNote.title || targetNote.title.trim().length < 4) return;

                const escapedTitle = targetNote.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const mentionRegex = new RegExp(`\\b${escapedTitle}\\b`, 'i');

                if (mentionRegex.test(sourceNote.content)) {
                    // Avoid creating a duplicate implicit link if an explicit one exists
                    if (!sourceNote.content.includes(`[[${targetNote.title}]]`)) {
                        const edgeKey = [sourceNote.id, targetNote.id].sort().join('-');
                        if (!edgeSet.has(edgeKey)) {
                            edgeSet.add(edgeKey);
                            calculatedEdges.push({ source: sourceNote.id, target: targetNote.id });
                        }
                    }
                }
            });
        });

        // Calculate connection counts based on final edges
        calculatedEdges.forEach(edge => {
            connectionCounts[edge.source] = (connectionCounts[edge.source] || 0) + 1;
            connectionCounts[edge.target] = (connectionCounts[edge.target] || 0) + 1;
        });
        
        const calculatedNodes: GraphNode[] = notes.map(note => ({
                ...note,
                connections: connectionCounts[note.id] || 0,
            }));
        
        return { nodes: calculatedNodes, edges: calculatedEdges };
    }, [notes]);

    const nodePhysics = useForceLayout(graphNodes, edges, mousePosRef);

    const { svgDimensions, svgTransform } = useMemo(() => {
        const nodePositions = Array.from(nodePhysics.values());
        if (nodePositions.length === 0) {
            return { svgDimensions: { width: 0, height: 0, top: 0, left: 0 }, svgTransform: '' };
        }
    
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodePositions.forEach(node => {
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
    }, [nodePhysics]);

    const handlePan = (_: any, info: PanInfo) => {
        setPan(prev => ({ x: prev.x + info.delta.x, y: prev.y + info.delta.y }));
    };

    const handleZoom = (e: React.WheelEvent) => {
        if (!containerRef.current) return;
        const newZoom = Math.max(0.1, Math.min(2, zoom - e.deltaY * 0.001));
        setZoom(newZoom);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const graphX = (e.clientX - rect.left - centerX - pan.x) / zoom;
        const graphY = (e.clientY - rect.top - centerY - pan.y) / zoom;
        mousePosRef.current = { x: graphX, y: graphY };
    };

    const handleMouseLeave = () => {
        mousePosRef.current = null;
    };


    const getNodePos = (id: string) => nodePhysics.get(id) || { x: 0, y: 0 };
    const centerView = () => { setPan({x: 0, y: 0}); setZoom(0.6); };

    if (notes.length === 0) {
        return (
             <div className="bg-secondary p-8 rounded-3xl border border-border-color shadow-soft-glow h-full flex flex-col items-center justify-center text-center">
                <SparklesIcon className="w-20 h-20 text-neon-purple/50 mb-6"/>
                <h2 className="text-3xl font-bold text-text-primary">Здесь засияют ваши идеи!</h2>
                <p className="text-text-secondary mt-4 max-w-md">Каждая ваша идея — это звезда. Каждая <code className="bg-primary px-1.5 py-0.5 rounded-md text-highlight font-mono">[[связь]]</code> между ними — созвездие. Начните создавать идеи, чтобы увидеть, как рождается ваша вселенная мыслей.</p>
            </div>
        );
    }
    
    const isNodeConnectedToHovered = (nodeId: string) => {
        if (!hoveredNodeId) return false;
        return edges.some(edge => (edge.source === hoveredNodeId && edge.target === nodeId) || (edge.source === nodeId && edge.target === hoveredNodeId));
    };

    return (
        <div 
            ref={containerRef}
            className="bg-primary rounded-2xl border-2 border-border-color overflow-hidden relative h-[calc(100vh-130px)]"
            onWheel={handleZoom}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <style>{`
                @keyframes graph-pan {
                  from { background-position: 0% 50%; }
                  to { background-position: 100% 50%; }
                }
            `}</style>
            <div className="absolute inset-0 z-0 bg-base-bg overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(156,94,255,0.2)_0%,rgba(13,17,23,0)_60%)] opacity-70"></div>
                <div 
                    className="absolute inset-[-200%] w-[400%] h-[400%] bg-[url(https://raw.githubusercontent.com/mourner/star-map/master/img/stars.png)] opacity-50"
                    style={{ 
                        transform: `translate(${pan.x * 0.5}px, ${pan.y * 0.5}px) scale(${zoom + 0.2})`,
                        animation: 'graph-pan 240s linear infinite alternate'
                    }}
                />
            </div>
            <motion.div
                drag
                onDrag={handlePan}
                dragMomentum={false}
                className="w-full h-full relative cursor-grab active:cursor-grabbing"
            >
                <motion.div 
                    className="absolute top-1/2 left-1/2"
                    style={{ x: pan.x, y: pan.y, scale: zoom }}
                >
                    <svg 
                        className="absolute overflow-visible"
                        style={svgDimensions}
                    >
                         <defs>
                            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#A371F7" />
                                <stop offset="100%" stopColor="#58A6FF" />
                            </linearGradient>
                        </defs>
                        <g transform={svgTransform}>
                            {edges.map(edge => {
                                const sourcePos = getNodePos(edge.source);
                                const targetPos = getNodePos(edge.target);
                                const isHighlighted = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
                                return (
                                    <motion.line
                                        key={`${edge.source}-${edge.target}`}
                                        x1={sourcePos.x} y1={sourcePos.y}
                                        x2={targetPos.x} y2={targetPos.y}
                                        stroke="url(#edge-gradient)"
                                        strokeWidth={isHighlighted ? 2 : 1}
                                        animate={{ opacity: isHighlighted ? 1 : (hoveredNodeId ? 0.2 : 0.6) }}
                                        className="pointer-events-none"
                                        transition={{ duration: 0.2 }}
                                    />
                                )
                            })}
                            {graphNodes.map(node => {
                                const physics = nodePhysics.get(node.id);
                                if (!physics) return null;

                                const isHovered = node.id === hoveredNodeId;
                                const isConnected = isNodeConnectedToHovered(node.id);
                                const nodeSize = 10 + Math.min(node.connections * 2, 20);
                                
                                return (
                                    <motion.g
                                        key={node.id}
                                        className="cursor-pointer"
                                        initial={{ x: physics.x, y: physics.y }}
                                        animate={{ x: physics.x, y: physics.y }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 50 }}
                                        onHoverStart={() => setHoveredNodeId(node.id)}
                                        onHoverEnd={() => setHoveredNodeId(null)}
                                        onClick={() => onNavigateToNote(node.id)}
                                    >
                                        <motion.g animate={{ opacity: hoveredNodeId ? (isHovered || isConnected ? 1 : 0.3) : 1 }}>
                                            <motion.circle
                                                r={nodeSize}
                                                fill={node.color || '#161B22'}
                                                stroke="#58A6FF"
                                                strokeWidth={1.5}
                                                animate={{ 
                                                    scale: [1, 1.05, 1],
                                                    strokeWidth: isHovered ? 3 : 1.5
                                                }}
                                                transition={{ scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
                                            />
                                            <text
                                                textAnchor="middle"
                                                y={nodeSize + 15}
                                                fill="#E6EDF3"
                                                fontSize="12"
                                                paintOrder="stroke"
                                                stroke="#0D1117"
                                                strokeWidth="3px"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                {node.title || 'Без заголовка'}
                                            </text>
                                        </motion.g>
                                    </motion.g>
                                )
                            })}
                        </g>
                    </svg>
                </motion.div>
            </motion.div>

            <div className="absolute top-4 right-4 bg-secondary/80 backdrop-blur-md p-2 rounded-full border border-border-color flex flex-col gap-2 z-10">
                <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent" title="Приблизить"><PlusIcon className="w-5 h-5"/></button>
                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.2))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent" title="Отдалить"><MinusIcon className="w-5 h-5"/></button>
                <button onClick={centerView} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent" title="Центрировать"><ViewfinderCircleIcon className="w-5 h-5"/></button>
            </div>
             <div className="absolute bottom-4 left-4 bg-secondary/80 backdrop-blur-md p-3 rounded-lg border border-border-color text-xs text-text-secondary z-10">
                <h4 className="font-bold mb-1">Легенда</h4>
                <p>Кликните по звезде, чтобы перейти к идее.</p>
            </div>
        </div>
    );
};

export default GraphView;
