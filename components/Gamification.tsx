import React from 'react';
import { PlayerStats } from '../types';
import { HeartIcon } from './Icons';

interface GamificationProps {
    stats: PlayerStats;
}

const Gamification: React.FC<GamificationProps> = ({ stats }) => {
    const { level, xp, xpToNextLevel, focusCrystals, rank } = stats;
    const progressPercentage = (xpToNextLevel > 0 ? (xp / xpToNextLevel) : 0) * 100;

    return (
        <div className="flex items-center gap-4 text-text-primary">
            <div className="flex items-center gap-1" title={`Ранг: ${rank.name}`}>
                <span className="text-2xl" style={{ color: '#52D186' }}>{rank.icon}</span>
                <span className="font-bold text-lg">{level}</span>
            </div>

            <div className="flex items-center gap-1">
                <span role="img" aria-label="Hearts">🤍</span>
                <span className="text-sm font-semibold">{focusCrystals}</span>
            </div>
            
            <div className="flex items-center gap-2 w-24">
                <div className="w-full bg-primary rounded-full h-1.5 overflow-hidden border border-border-color shadow-inner-soft">
                    <div 
                        className="bg-gradient-to-r from-neon-blue to-neon-purple h-full rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progressPercentage}%`}}
                    ></div>
                </div>
                <span className="text-xs font-mono text-text-secondary">{xp}/{xpToNextLevel}</span>
            </div>
        </div>
    );
};

export default Gamification;