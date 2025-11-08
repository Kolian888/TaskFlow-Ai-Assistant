import React, { useState } from 'react';
import { CharacterType } from '../types';
import { SparklesIcon, CatIcon, DogIcon } from './Icons';

interface CharacterSelectionModalProps {
    isOpen: boolean;
    onSelect: (type: CharacterType, name: string) => void;
}

const characters: { type: CharacterType; name: string; description: string; icon: React.FC<any> }[] = [
    { type: 'spark', name: 'Искра', description: 'Загадочная сущность чистой энергии.', icon: SparklesIcon },
    { type: 'cat', name: 'Кот', description: 'Игривый и независимый спутник.', icon: CatIcon },
    { type: 'dog', name: 'Собака', description: 'Верный и энергичный компаньон.', icon: DogIcon },
];

const CharacterSelectionModal: React.FC<CharacterSelectionModalProps> = ({ isOpen, onSelect }) => {
    const [selectedType, setSelectedType] = useState<CharacterType | null>(null);
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSelect = () => {
        if (selectedType && name.trim()) {
            onSelect(selectedType, name.trim());
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-[100] p-4"
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-secondary p-8 rounded-3xl shadow-soft-glow max-w-2xl w-full border border-border-color transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <h1 className="text-3xl font-bold text-center text-text-primary mb-2">Выберите своего спутника</h1>
                <p className="text-center text-text-secondary mb-8">Он будет расти и развиваться вместе с вами.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {characters.map(char => (
                        <button
                            key={char.type}
                            onClick={() => setSelectedType(char.type)}
                            className={`p-6 bg-accent rounded-2xl text-center transition-all duration-300 border-2 group ${
                                selectedType === char.type 
                                    ? 'border-highlight shadow-soft-glow transform -translate-y-2' 
                                    : 'border-border-color hover:border-text-secondary hover:-translate-y-1'
                            }`}
                        >
                            <char.icon className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                                selectedType === char.type ? 'text-highlight' : 'text-text-secondary'
                            }`} />
                            <h3 className="text-xl font-bold text-text-primary">{char.name}</h3>
                            <p className="text-sm text-gray-400 mt-1">{char.description}</p>
                        </button>
                    ))}
                </div>

                <div className="max-w-md mx-auto">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Как назовем вашего питомца?"
                        className="w-full bg-accent border border-border-color shadow-inner-soft rounded-xl p-3 text-center text-lg focus:outline-none focus:ring-2 focus:ring-highlight"
                        maxLength={20}
                    />

                    <button
                        onClick={handleSelect}
                        disabled={!selectedType || !name.trim()}
                        className="w-full mt-4 bg-highlight text-primary font-bold p-3 rounded-xl hover:opacity-90 transition-opacity disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50 text-lg active:scale-95"
                    >
                        Начать приключение!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CharacterSelectionModal;