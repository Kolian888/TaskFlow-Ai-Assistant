import React from 'react';
import { Quest } from '../types';
import { StarIcon, CheckCircleIcon } from './Icons';

interface DailyQuestsProps {
    quests: Quest[];
}

const DailyQuests: React.FC<DailyQuestsProps> = ({ quests }) => {
    return (
        <>
            {quests.length === 0 && <p className="text-sm text-gray-400">Квесты на сегодня еще не загружены.</p>}
            <ul className="space-y-4">
                {quests.map(quest => {
                    const progressPercentage = (quest.progress / quest.target) * 100;
                    return (
                        <li key={quest.id} className={`transition-opacity ${quest.completed ? 'opacity-60' : ''}`}>
                            <div className="flex justify-between items-center mb-1.5 text-sm">
                                <span className={`font-semibold ${quest.completed ? 'line-through text-gray-400' : 'text-text-primary'}`}>
                                    {quest.description}
                                </span>
                                <span className="font-bold text-brand-yellow">+{quest.xp} ОП</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-full bg-black/30 rounded-full h-2 shadow-inner-soft border border-border-color">
                                    <div 
                                        className="bg-gradient-to-r from-brand-blue to-highlight h-full rounded-full transition-all duration-500"
                                        style={{ 
                                          width: `${progressPercentage}%`,
                                        }}
                                    ></div>
                                </div>
                                <span className="text-sm font-mono text-text-secondary w-12 text-right">
                                    {quest.completed ? <CheckCircleIcon className="w-5 h-5 text-brand-green inline-block"/> : `${quest.progress}/${quest.target}`}
                                </span>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </>
    );
};

export default DailyQuests;
