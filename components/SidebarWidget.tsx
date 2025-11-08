

import React, { ReactNode, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVerticalIcon, ChevronDownIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarWidgetProps {
    value: string;
    title: string;
    children: ReactNode;
}

const SidebarWidget: React.FC<SidebarWidgetProps> = ({ value, title, children }) => {
    const controls = useDragControls();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <Reorder.Item 
            value={value} 
            dragListener={false} 
            dragControls={controls}
            layout
            className="bg-secondary rounded-2xl border border-border-color shadow-soft-glow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, layout: { duration: 0.3 } }}
        >
            <div className="flex items-center justify-between p-4 bg-accent/30 rounded-t-2xl">
                <h3 className="font-bold text-lg text-text-primary">{title}</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCollapsed(p => !p)}
                        className="p-1 rounded-full hover:bg-white/10"
                        aria-expanded={!isCollapsed}
                        aria-label={isCollapsed ? `Развернуть виджет ${title}` : `Свернуть виджет ${title}`}
                    >
                        <ChevronDownIcon className={`w-5 h-5 text-text-secondary/80 transition-transform ${!isCollapsed && 'rotate-180'}`} />
                    </button>
                    <div
                        onPointerDown={(e) => { controls.start(e); }}
                        className="cursor-grab active:cursor-grabbing p-1 text-text-secondary/50 hover:text-text-secondary z-10"
                        aria-label={`Переместить виджет ${title}`}
                    >
                        <GripVerticalIcon className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    );
};

export default SidebarWidget;
