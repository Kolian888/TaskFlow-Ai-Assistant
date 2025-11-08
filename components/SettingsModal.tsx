import React, { useState, useEffect, useMemo, useRef } from 'react';
import { XIcon, ExclamationTriangleIcon } from './Icons';
import { Settings } from '../types';

interface HotkeyInputProps {
    value: string;
    onCapture: (key: string) => void;
    isDuplicate: boolean;
}

const HotkeyInput: React.FC<HotkeyInputProps> = ({ value, onCapture, isDuplicate }) => {
    const [isCapturing, setIsCapturing] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const combo = [];
        if (e.ctrlKey || e.metaKey) combo.push('ctrl');
        if (e.altKey) combo.push('alt');
        if (e.shiftKey) combo.push('shift');

        const key = e.key.toLowerCase();
        const isModifierOnly = e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta';
    
        if (!isModifierOnly) {
            combo.push(key);
            onCapture(combo.join('+'));
            setIsCapturing(false);
        }
        // If it's a modifier only key press, do nothing and wait for the next key.
    };
    
    return (
        <div className="relative flex items-center">
            {isDuplicate && (
                // FIX: Wrap the icon in a span with a title attribute to provide a tooltip without passing an invalid prop to the SVG component.
                <span title="Эта комбинация уже используется">
                    <ExclamationTriangleIcon className="w-5 h-5 text-brand-yellow absolute -left-6" />
                </span>
            )}
            <input
                type="text"
                readOnly
                value={isCapturing ? 'Нажмите...' : value}
                onFocus={() => setIsCapturing(true)}
                onBlur={() => setIsCapturing(false)}
                onKeyDown={handleKeyDown}
                className={`w-32 bg-accent border rounded-lg p-2 text-center font-mono focus:ring-2 focus:ring-highlight outline-none ${isDuplicate ? 'border-brand-yellow' : 'border-border-color'}`}
            />
            <button
                onClick={() => onCapture('')}
                className={`absolute right-1 p-1 text-text-secondary rounded-full hover:bg-primary ${!value && 'hidden'}`}
                title="Очистить"
            >
                <XIcon className="w-3.5 h-3.5"/>
            </button>
        </div>
    );
};


interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSave: (newSettings: Settings) => void;
    availableVoices: SpeechSynthesisVoice[];
    onExport: () => void;
    onImport: (file: File) => void;
}

const actionConfig = {
    navigation: {
        name: 'Навигация',
        actions: [
            { id: 'viewDashboard', name: 'Перейти на Главную' },
            { id: 'viewKanban', name: 'Открыть Канбан-доску' },
            { id: 'viewStats', name: 'Открыть Статистику' },
            { id: 'viewAchievements', name: 'Открыть Питомца' },
            { id: 'viewLibrary', name: 'Открыть Библиотеку' },
            { id: 'viewNotes', name: 'Открыть Заметки (старые)' },
            { id: 'viewQuests', name: 'Открыть Квесты' },
            { id: 'viewHabits', name: 'Открыть Привычки' },
            { id: 'viewPara', name: 'Открыть PARA' },
            { id: 'viewMindMap', name: 'Открыть Карты разума' },
            { id: 'viewKnowledge', name: 'Открыть Мир Идей' },
            { id: 'viewGraph', name: 'Открыть "Звёздное небо"' },
        ]
    },
    creation: {
        name: 'Быстрое создание',
        actions: [
            { id: 'quickAddTask', name: 'Создать задачу' },
            { id: 'quickAddNote', name: 'Создать быструю заметку' },
            { id: 'quickAddProject', name: 'Создать проект' },
            { id: 'quickAddBoard', name: 'Создать доску' },
        ]
    },
    actions: {
        name: 'Действия и окна',
        actions: [
            { id: 'toggleAI', name: 'Открыть/Закрыть AI Ассистента' },
            { id: 'toggleSettings', name: 'Открыть/Закрыть Настройки' },
            { id: 'toggleQuickAdd', name: 'Открыть/Закрыть меню "Быстрое добавление"' },
            { id: 'formatToMarkdown', name: 'Форматировать текст в Markdown (в редакторе)' },
        ]
    }
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, availableVoices, onExport, onImport }) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [activeTab, setActiveTab] = useState<'interface' | 'voice' | 'hotkeys' | 'data'>('interface');
    const importInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings, isOpen]);

    const duplicates = useMemo(() => {
        const combos = new Map<string, number>();
        Object.values(localSettings.hotkeys).forEach((combo: string) => {
            if (combo) {
                combos.set(combo, (combos.get(combo) || 0) + 1);
            }
        });
        const dupes = new Set<string>();
        for (const [combo, count] of combos.entries()) {
            if (count > 1) {
                dupes.add(combo);
            }
        }
        return dupes;
    }, [localSettings.hotkeys]);
    
    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImport(file);
            onClose();
        }
    };

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };
    
    const handleSettingChange = (key: keyof Settings, value: any) => {
        setLocalSettings(prev => ({...prev, [key]: value}));
    }

    const handleHotkeyChange = (actionId: string, newCombo: string) => {
        setLocalSettings(prev => ({
            ...prev,
            hotkeys: {
                ...prev.hotkeys,
                [actionId]: newCombo,
            },
        }));
    };

    return (
        <div 
            className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-secondary p-6 rounded-3xl shadow-soft-glow w-full max-w-2xl border border-border-color flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-text-primary">Настройки</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-accent">
                        <XIcon className="w-6 h-6 text-text-secondary"/>
                    </button>
                </div>

                <div className="flex items-center gap-2 p-1 bg-primary rounded-full border border-border-color w-fit mb-6">
                    <button onClick={() => setActiveTab('interface')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'interface' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>Интерфейс</button>
                    <button onClick={() => setActiveTab('voice')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'voice' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>Голос</button>
                    <button onClick={() => setActiveTab('hotkeys')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'hotkeys' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>Клавиши</button>
                    <button onClick={() => setActiveTab('data')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'data' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>Данные</button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                    {activeTab === 'interface' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-text-secondary mb-3">Подсказки</h3>
                                <div className="space-y-3 p-4 bg-primary rounded-xl border border-border-color">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="hotkey-tooltips-toggle" className="text-text-primary cursor-pointer">
                                            Показывать горячие клавиши при наведении
                                        </label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="hotkey-tooltips-toggle" className="sr-only peer"
                                                checked={localSettings.showHotkeyTooltips}
                                                onChange={(e) => handleSettingChange('showHotkeyTooltips', e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-accent peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-highlight rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-highlight"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'voice' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-text-secondary mb-3">Голосовой ассистент</h3>
                                <div className="space-y-3 p-4 bg-primary rounded-xl border border-border-color">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="tts-toggle" className="text-text-primary cursor-pointer">Включить озвучивание</label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="tts-toggle" className="sr-only peer" checked={localSettings.enableTts} onChange={(e) => handleSettingChange('enableTts', e.target.checked)} />
                                            <div className="w-11 h-6 bg-accent peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-highlight rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-highlight"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="voice-select" className="text-text-primary">Голос</label>
                                        <select
                                            id="voice-select"
                                            value={localSettings.selectedVoiceURI || ''}
                                            onChange={(e) => handleSettingChange('selectedVoiceURI', e.target.value)}
                                            disabled={!localSettings.enableTts || availableVoices.length === 0}
                                            className="bg-accent border border-border-color rounded-lg p-2 text-sm text-text-primary focus:ring-2 focus:ring-highlight outline-none disabled:opacity-50"
                                        >
                                            <option value="">По умолчанию</option>
                                            {availableVoices.map(voice => (
                                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                                    {voice.name} ({voice.lang})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'hotkeys' && (
                        <div className="space-y-6">
                            {Object.values(actionConfig).map(section => (
                                <div key={section.name}>
                                    <h3 className="text-lg font-semibold text-text-secondary mb-3">{section.name}</h3>
                                    <div className="space-y-3 p-4 bg-primary rounded-xl border border-border-color">
                                        {section.actions.map(({ id, name }) => (
                                            <div key={id} className="flex items-center justify-between">
                                                <label className="text-text-primary">{name}</label>
                                                <HotkeyInput
                                                    value={localSettings.hotkeys[id as keyof typeof localSettings.hotkeys] || ''}
                                                    onCapture={(newKey) => handleHotkeyChange(id, newKey)}
                                                    isDuplicate={duplicates.has(localSettings.hotkeys[id as keyof typeof localSettings.hotkeys])}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-text-secondary mb-3">Управление данными</h3>
                                <div className="space-y-4 p-4 bg-primary rounded-xl border border-border-color">
                                    <div className="flex items-center justify-between">
                                        <p className="text-text-primary">Сохранить резервную копию всех данных</p>
                                        <button onClick={onExport} className="px-4 py-2 bg-highlight/80 text-primary font-semibold rounded-lg hover:bg-highlight">
                                            Экспорт
                                        </button>
                                    </div>
                                    <div className="h-px bg-border-color my-2"></div>
                                    <div className="flex items-center justify-between">
                                         <div>
                                            <p className="text-text-primary">Загрузить данные из резервной копии</p>
                                            <p className="text-xs text-brand-yellow flex items-center gap-1 mt-1"><ExclamationTriangleIcon className="w-4 h-4" /> Внимание: это перезапишет все текущие данные.</p>
                                        </div>
                                        <input type="file" ref={importInputRef} onChange={handleFileChange} accept=".json" className="hidden"/>
                                        <button onClick={handleImportClick} className="px-4 py-2 bg-accent text-text-primary font-semibold rounded-lg hover:bg-white/10">
                                            Импорт
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-border-color flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-accent border border-border-color text-text-primary hover:bg-white/10 font-semibold">
                        Отмена
                    </button>
                    <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-highlight text-primary font-semibold hover:opacity-90">
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;