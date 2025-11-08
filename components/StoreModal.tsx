import React, { useState, useMemo } from 'react';
import { PlayerStats, CharacterType } from '../types';
import { PET_CUSTOMIZATIONS } from '../pet-data';
import { XIcon, CrystalIcon, CatIcon, DogIcon, SparklesIcon, LabubuIcon, DragonIcon, UnicornIcon, PhoenixIcon, CthulhuIcon, CheckCircleIcon, PaletteIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

const characterInfo: Record<CharacterType, { name: string, icon: React.FC<any>, cost: number }> = {
    spark: { name: 'Искра', icon: SparklesIcon, cost: 0 },
    cat: { name: 'Кот', icon: CatIcon, cost: 0 },
    dog: { name: 'Собака', icon: DogIcon, cost: 0 },
    labubu: { name: 'Лабубу', icon: LabubuIcon, cost: 500 },
    dragon: { name: 'Дракон', icon: DragonIcon, cost: 1000 },
    unicorn: { name: 'Единорог', icon: UnicornIcon, cost: 1000 },
    phoenix: { name: 'Феникс', icon: PhoenixIcon, cost: 1500 },
    cthulhu: { name: 'Ктулху', icon: CthulhuIcon, cost: 2000 },
};

interface StoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerStats: PlayerStats;
    onUnlockColor: (colorId: string) => boolean;
    onSelectColor: (colorId: string) => boolean;
    onUnlockCharacterType: (type: CharacterType) => boolean;
}

const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose, playerStats, onUnlockColor, onSelectColor, onUnlockCharacterType }) => {
    const [activeTab, setActiveTab] = useState<'skins' | 'characters'>('skins');
    
    const petColors = useMemo(() => {
        return PET_CUSTOMIZATIONS[playerStats.characterType] || [];
    }, [playerStats.characterType]);
    
    if (!isOpen) return null;

    return (
        <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-secondary p-6 rounded-3xl shadow-soft-glow w-full max-w-3xl border border-border-color flex flex-col max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-text-primary">Магазин</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-accent">
                            <XIcon className="w-6 h-6 text-text-secondary"/>
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-6 flex-shrink-0">
                        <div className="flex items-center gap-2 p-1 bg-primary rounded-full border border-border-color">
                            <button onClick={() => setActiveTab('skins')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'skins' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>
                                Расцветки
                            </button>
                            <button onClick={() => setActiveTab('characters')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'characters' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>
                                Персонажи
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-accent px-3 py-1.5 rounded-full border border-border-color">
                            <CrystalIcon className="w-5 h-5 text-neon-blue"/>
                            <span className="font-bold text-text-primary">{playerStats.focusCrystals}</span>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'skins' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {petColors.map(color => {
                                            const isUnlocked = playerStats.unlockedPetColors.includes(color.id);
                                            const isActive = playerStats.petCustomization.color === color.id;
                                            const canAfford = playerStats.focusCrystals >= color.cost;

                                            return (
                                                <div key={color.id} className="bg-primary border border-border-color rounded-xl p-4 flex flex-col items-center justify-between gap-3">
                                                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: `radial-gradient(circle, ${color.visuals.primaryColor} 0%, ${color.visuals.secondaryColor} 100%)` }}>
                                                        {playerStats.characterType === 'spark' ? <SparklesIcon className="w-8 h-8 text-white"/> : <PaletteIcon className="w-8 h-8 text-white"/>}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-semibold text-text-primary">{color.name}</p>
                                                    </div>
                                                    {isUnlocked ? (
                                                        <button onClick={() => onSelectColor(color.id)} disabled={isActive} className="w-full px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors bg-brand-green/20 text-brand-green disabled:bg-accent disabled:text-text-secondary">
                                                            {isActive ? 'Выбрано' : 'Выбрать'}
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => onUnlockColor(color.id)} disabled={!canAfford} className="w-full px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors bg-highlight/80 text-primary hover:bg-highlight disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                                                            <CrystalIcon className="w-4 h-4" />
                                                            {color.cost}
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                                 {activeTab === 'characters' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {Object.entries(characterInfo).map(([type, info]) => {
                                            const isUnlocked = playerStats.unlockedCharacterTypes.includes(type as CharacterType);
                                            const canAfford = playerStats.focusCrystals >= info.cost;

                                            return (
                                                <div key={type} className="bg-primary border border-border-color rounded-xl p-4 flex flex-col items-center justify-between gap-3">
                                                    <info.icon className="w-16 h-16 text-text-secondary"/>
                                                    <p className="font-semibold text-text-primary">{info.name}</p>
                                                    {isUnlocked ? (
                                                        <div className="w-full px-3 py-1.5 text-sm font-semibold rounded-lg bg-accent text-text-secondary flex items-center justify-center gap-1.5">
                                                            <CheckCircleIcon className="w-4 h-4"/>
                                                            Разблокировано
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => onUnlockCharacterType(type as CharacterType)} disabled={!canAfford} className="w-full px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors bg-highlight/80 text-primary hover:bg-highlight disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                                                            <CrystalIcon className="w-4 h-4"/>
                                                            {info.cost}
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                 )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    );
};

export default StoreModal;
