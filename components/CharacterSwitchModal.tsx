import React from 'react';
import { CharacterType } from '../types';
import { XIcon, CatIcon, DogIcon, SparklesIcon, LabubuIcon, DragonIcon, UnicornIcon, PhoenixIcon, CthulhuIcon } from './Icons';

interface CharacterSwitchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitch: (type: CharacterType) => void;
    unlockedTypes: CharacterType[];
    activeType: CharacterType;
}

const petInfo: Record<CharacterType, { name: string, icon: React.FC<any> }> = {
    spark: { name: 'Искра', icon: SparklesIcon },
    cat: { name: 'Кот', icon: CatIcon },
    dog: { name: 'Собака', icon: DogIcon },
    labubu: { name: 'Лабубу', icon: LabubuIcon },
    dragon: { name: 'Дракончик', icon: DragonIcon },
    unicorn: { name: 'Единорог', icon: UnicornIcon },
    phoenix: { name: 'Феникс', icon: PhoenixIcon },
    cthulhu: { name: 'Ктулху', icon: CthulhuIcon },
};


const CharacterSwitchModal: React.FC<CharacterSwitchModalProps> = ({ isOpen, onClose, onSwitch, unlockedTypes, activeType }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-[100] p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-secondary p-8 rounded-3xl shadow-soft-glow max-w-2xl w-full border border-border-color transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Сменить спутника</h1>
                     <button onClick={onClose} className="p-2 rounded-full hover:bg-accent">
                        <XIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {unlockedTypes.map(type => {
                        const pet = petInfo[type];
                        const isActive = type === activeType;
                        return (
                            <button
                                key={type}
                                onClick={() => onSwitch(type)}
                                disabled={isActive}
                                className={`p-6 bg-accent rounded-2xl text-center transition-all duration-300 border-2 group ${
                                    isActive 
                                        ? 'border-highlight shadow-soft-glow ring-2 ring-highlight/50' 
                                        : 'border-border-color hover:border-text-secondary hover:-translate-y-1'
                                }`}
                            >
                                <pet.icon className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                                    isActive ? 'text-highlight' : 'text-text-secondary'
                                }`} />
                                <h3 className="text-xl font-bold text-text-primary">{pet.name}</h3>
                                {isActive && <p className="text-sm text-brand-green font-semibold mt-1">Активен</p>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CharacterSwitchModal;
