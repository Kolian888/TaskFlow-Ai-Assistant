import React from 'react';
import { PlayerStats, CharacterType } from '../types';
import { FoodBowlIcon, HeartIcon, SoapIcon, MoonIcon } from './Icons';
import { PetVisualMini } from './PetVisual';

interface FocusPetProps {
    stats: PlayerStats;
}

const evolutionStages: Record<CharacterType, { name: string; level: number }[]> = {
    spark: [
        { name: 'Искра', level: 1 },
        { name: 'Росток', level: 5 },
        { name: 'Элементаль', level: 10 },
        { name: 'Хранитель Фокуса', level: 15 }
    ],
    cat: [
        { name: 'Котенок', level: 1 },
        { name: 'Подросток', level: 5 },
        { name: 'Взрослый Кот', level: 10 },
        { name: 'Дух-Хранитель', level: 15 }
    ],
    dog: [
        { name: 'Щенок', level: 1 },
        { name: 'Подросток', level: 5 },
        { name: 'Взрослый Пес', level: 10 },
        { name: 'Дух-Защитник', level: 15 }
    ],
    labubu: [
        { name: 'Малыш Лабубу', level: 1 },
        { name: 'Непоседа Лабубу', level: 5 },
        { name: 'Хитрый Лабубу', level: 10 },
        { name: 'Король Лабубу', level: 15 }
    ],
    dragon: [
        { name: 'Драконье Яйцо', level: 1 },
        { name: 'Вылупившийся Дракончик', level: 5 },
        { name: 'Огненный Дрейк', level: 10 },
        { name: 'Великий Дракон', level: 15 }
    ],
    unicorn: [
        { name: 'Жеребенок', level: 1 },
        { name: 'Юный Единорог', level: 5 },
        { name: 'Сияющий Скакун', level: 10 },
        { name: 'Астральный Единорог', level: 15 }
    ],
    phoenix: [
        { name: 'Птенец из Пепла', level: 1 },
        { name: 'Огненный Феникс', level: 5 },
        { name: 'Солнечная Птица', level: 10 },
        { name: 'Императорский Феникс', level: 15 }
    ],
    cthulhu: [
        { name: 'Головастик Глубин', level: 1 },
        { name: 'Юный Ктулху', level: 5 },
        { name: 'Зов Бездны', level: 10 },
        { name: 'Древний', level: 15 }
    ],
};


const getPetInfo = (level: number, type: CharacterType) => {
    let currentStage = evolutionStages[type][0];
    let nextStage = null;
    const path = evolutionStages[type];

    for (let i = 0; i < path.length; i++) {
        if (level >= path[i].level) {
            currentStage = path[i];
            if (i + 1 < path.length) {
                nextStage = path[i+1];
            }
        } else {
            break;
        }
    }
    return { currentStage, nextStage };
};

const MiniStatBar: React.FC<{ value: number, colorClass: string, icon: React.FC<any> }> = ({ value, colorClass, icon: Icon }) => (
    <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${colorClass} flex-shrink-0`} />
        <div className="w-full bg-black/30 rounded-full h-1.5 flex-grow shadow-inner-soft border border-border-color">
            <div 
                className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`} 
                style={{ width: `${value}%`}}>
            </div>
        </div>
    </div>
);

const FocusPet: React.FC<FocusPetProps> = ({ stats }) => {
    const { level, characterType, characterName, petStats } = stats;
    const { currentStage, nextStage } = getPetInfo(level, characterType);
    
    return (
        <div className="flex items-center gap-4">
            <PetVisualMini stats={stats} />
            <div className="flex-grow min-w-0">
                <h3 className="font-bold text-lg text-text-primary truncate">{characterName || currentStage.name}</h3>
                {nextStage ? (
                    <p className="text-xs text-text-secondary">
                        Эволюция: <span className="font-semibold">{nextStage.name}</span> (ур. {nextStage.level})
                    </p>
                ) : (
                    <p className="text-xs text-highlight font-semibold">Достигнута финальная форма!</p>
                )}
                 <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
                    <MiniStatBar value={petStats.hunger} colorClass="text-brand-green" icon={FoodBowlIcon}/>
                    <MiniStatBar value={petStats.happiness} colorClass="text-brand-pink" icon={HeartIcon}/>
                    <MiniStatBar value={petStats.cleanliness} colorClass="text-brand-blue" icon={SoapIcon}/>
                    <MiniStatBar value={petStats.energy} colorClass="text-brand-purple" icon={MoonIcon}/>
                </div>
            </div>
        </div>
    );
};

export default FocusPet;