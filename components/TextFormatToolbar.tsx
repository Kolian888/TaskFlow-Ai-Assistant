import React from 'react';
import { motion } from 'framer-motion';

interface TextFormatToolbarProps {
    onExecCommand: (command: string, value?: string) => void;
}

const TextFormatToolbar = React.forwardRef<HTMLDivElement, TextFormatToolbarProps>(({ onExecCommand }, ref) => {
    const buttons = [
        { command: 'bold', label: 'B', className: 'font-bold' },
        { command: 'italic', label: 'I', className: 'italic' },
        { command: 'underline', label: 'U', className: 'underline' },
        { command: 'strikeThrough', label: 'S', className: 'line-through' },
    ];

    return (
        <motion.div
            ref={ref}
            tabIndex={-1}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-secondary p-1 rounded-lg border border-border-color shadow-lg flex gap-1 z-20"
            onMouseDown={e => e.preventDefault()}
        >
            {buttons.map(({ command, label, className }) => (
                <button
                    key={command}
                    onClick={() => onExecCommand(command)}
                    className={`w-8 h-8 rounded-md hover:bg-accent text-text-primary ${className}`}
                    title={command.charAt(0).toUpperCase() + command.slice(1)}
                >
                    {label}
                </button>
            ))}
        </motion.div>
    );
});

export default TextFormatToolbar;
