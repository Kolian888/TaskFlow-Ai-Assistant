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

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose, playerStats, onUnlockColor, onSelectColor, onUnlockCharacterType }) => {
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
                    className="bg-secondary p-4 md:p-6 rounded-3xl shadow-soft-glow w-full max-w-md md:max-w-3xl border border-border-color flex flex-col max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-text-primary">Магазин</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-accent">
                            <XIcon className="w-6 h-6 text-text-secondary"/>
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2 p-1 bg-primary rounded-full border border-border-color w-fit mb-4">
                        <button onClick={() => setActiveTab('skins')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'skins' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>Скины</button>
                        <button onClick={() => setActiveTab('characters')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'characters' ? 'bg-highlight text-primary' : 'hover:bg-accent'}`}>Персонажи</button>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                        {activeTab === 'skins' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {petColors.map(color => {
                                    const isUnlocked = playerStats.unlockedPetColors.includes(color.id);
                                    const isSelected = playerStats.petCustomization.color === color.id;
                                    const canAfford = playerStats.focusCrystals >= color.cost;

                                    return (
                                        <div key={color.id} className="bg-accent p-4 rounded-xl border border-border-color text-center flex flex-col justify-between">
                                            <div>
                                                <div className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-secondary" style={{ background: `radial-gradient(circle, ${color.visuals.primaryColor} 0%, ${color.visuals.secondaryColor} 100%)` }}></div>
                                                <h4 className="font-semibold text-text-primary h-10">{color.name}</h4>
                                            </div>
                                            {isSelected ? (
                                                <div className="flex items-center justify-center gap-1 mt-2 text-brand-green font-semibold"><CheckCircleIcon className="w-4 h-4" /> Активен</div>
                                            ) : isUnlocked ? (
                                                <button onClick={() => onSelectColor(color.id)} className="mt-2 w-full px-3 py-1.5 bg-highlight/80 text-primary rounded-lg text-sm font-semibold hover:bg-highlight transition-colors">Выбрать</button>
                                            ) : (
                                                <button onClick={() => onUnlockColor(color.id)} disabled={!canAfford} className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-neon-blue/80 text-white rounded-lg text-sm font-semibold hover:bg-neon-blue transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                                                    <CrystalIcon className="w-4 h-4"/> {color.cost}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {activeTab === 'characters' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {Object.entries(characterInfo).map(([type, info]) => {
                                    const isUnlocked = playerStats.unlockedCharacterTypes.includes(type as CharacterType);
                                    const canAfford = playerStats.focusCrystals >= info.cost;

                                    return (
                                        <div key={type} className="bg-accent p-4 rounded-xl border border-border-color text-center flex flex-col justify-between">
                                            <div>
                                                <info.icon className="w-16 h-16 text-text-secondary mx-auto mb-3" />
                                                <h4 className="font-semibold text-text-primary h-10">{info.name}</h4>
                                            </div>
                                            {isUnlocked ? (
                                                <div className="flex items-center justify-center gap-1 mt-2 text-brand-green font-semibold"><CheckCircleIcon className="w-4 h-4" /> Разблокирован</div>
                                            ) : (
                                                <button onClick={() => onUnlockCharacterType(type as CharacterType)} disabled={!canAfford} className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-neon-blue/80 text-white rounded-lg text-sm font-semibold hover:bg-neon-blue transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                                                    <CrystalIcon className="w-4 h-4"/> {info.cost}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    );
};

export default StoreModal;
