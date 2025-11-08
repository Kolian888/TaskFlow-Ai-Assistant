import React from 'react';
import { Quest } from '../types';
import { StarIcon, CheckCircleIcon, SparklesIcon } from './Icons';

interface QuestsViewProps {
    quests: Quest[];
}

const QuestsView: React.FC<QuestsViewProps> = ({ quests }) => {
    return (
        <div className="bg-secondary p-8 rounded-3xl border border-border-color shadow-soft-glow">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <SparklesIcon className="w-8 h-8 text-neon-purple" />
                    <h2 className="text-3xl font-bold text-text-primary">Квесты</h2>
                </div>
                <p className="text-text-secondary">Выполняйте ежедневные задания, чтобы получать опыт и награды.</p>
            </header>

            <div className="mt-8">
                {quests.length === 0 ? (
                    <p className="text-center text-text-secondary py-16">Квесты на сегодня еще не загружены.</p>
                ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {quests.map(quest => {
                            const progressPercentage = (quest.progress / quest.target) * 100;
                            return (
                                <li key={quest.id} className={`bg-primary p-6 rounded-2xl border border-border-color transition-all ${quest.completed ? 'opacity-60' : ''}`}>
                                    <div className="flex justify-between items-start mb-3 text-sm">
                                        <span className={`font-bold text-lg ${quest.completed ? 'line-through text-gray-400' : 'text-text-primary'}`}>
                                            {quest.description}
                                        </span>
                                        <span className="font-bold text-brand-yellow flex items-center gap-1.5 bg-yellow-400/10 px-3 py-1 rounded-full">
                                            <StarIcon className="w-4 h-4"/>
                                            {quest.xp} ОП
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-full bg-black/30 rounded-full h-2.5 shadow-inner-soft border border-border-color">
                                            <div 
                                                className="bg-gradient-to-r from-neon-blue to-neon-purple h-full rounded-full transition-all duration-500"
                                                style={{ width: `${progressPercentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-mono text-text-secondary w-12 text-right">
                                            {quest.completed ? <CheckCircleIcon className="w-6 h-6 text-brand-green inline-block"/> : `${quest.progress}/${quest.target}`}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default QuestsView;