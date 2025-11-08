

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { PlayerStats, CharacterType } from '../types';
import { PET_CUSTOMIZATIONS, getPetStage } from '../pet-data';
import { HeartIcon } from './Icons';

interface PetVisualProps {
    stats: PlayerStats;
    onPet: () => boolean;
    size: number;
}

const petContainerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (isSad: boolean) => ({
        opacity: 1,
        scale: isSad ? 0.95 : 1,
        y: isSad ? 5 : [0, -4, 0],
        rotate: isSad ? -3 : 0,
        transition: isSad 
            ? { type: 'spring', stiffness: 200 } 
            : { y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }
    }),
    sleepy: { 
        scale: [1, 0.98, 1], 
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } 
    },
    sleeping: { 
        scale: 0.9, 
        y: 10, 
        transition: { type: 'spring', stiffness: 100 } 
    },
    petting: {
        scale: [1, 1.15, 1],
        rotate: [0, 8, -8, 8, 0],
        transition: { duration: 0.5, ease: 'easeInOut' }
    },
};

const heartVariants: Variants = {
    initial: { scale: 0, opacity: 0, y: 0 },
    animate: { 
        scale: 1.5, 
        opacity: [0.5, 1, 0], 
        y: -30,
        transition: { duration: 0.8, ease: "easeOut" }
    }
};


export const PetVisual: React.FC<PetVisualProps> = ({ stats, onPet, size }) => {
    const [isPetting, setIsPetting] = useState(false);
    const { level, characterType, petStats, petCustomization } = stats;
    const stage = getPetStage(level, characterType);

    const isSad = petStats.hunger < 30 || petStats.happiness < 30;
    const isDirty = petStats.cleanliness < 30;
    const isSleepy = petStats.energy < 30 && !petStats.isSleeping;
    const isSleeping = petStats.isSleeping;
    
    const colorData = PET_CUSTOMIZATIONS[characterType]?.find(c => c.id === petCustomization.color) || PET_CUSTOMIZATIONS[characterType][0];

    const handlePetClick = () => {
        if (isSleeping || isPetting) return;
        if (onPet()) {
            setIsPetting(true);
            setTimeout(() => setIsPetting(false), 800);
        }
    };

    const getAnimationState = () => {
        if (isPetting) return 'petting';
        if (isSleeping) return 'sleeping';
        if (isSleepy) return 'sleepy';
        return 'visible';
    };

    let petEmoji = '';
    
    if (characterType === 'cat' || characterType === 'dog') {
        if (isSleeping) petEmoji = colorData.visuals.emojiSleeping!;
        else if (isSad) petEmoji = colorData.visuals.emojiSad!;
        else if (isSleepy) petEmoji = colorData.visuals.emojiSleepy!;
        else petEmoji = colorData.visuals.emoji!;
    }

    const baseStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        position: 'relative',
        transition: 'background-color 0.5s ease, filter 0.5s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };
    
    const getPetContent = () => {
        if (characterType === 'spark') {
            const visualStyle = isSad || isSleepy ? { filter: 'grayscale(80%) brightness(0.7)' } : {};
            const gradient = `radial-gradient(circle, ${colorData.visuals.primaryColor} 0%, ${colorData.visuals.secondaryColor} 70%)`;
            switch (stage.name) {
                case 'Искра': return <div style={{ ...baseStyle, background: gradient, ...visualStyle }}><div className="w-1/3 h-1/3 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div></div>;
                case 'Росток': return <div style={{ ...baseStyle, background: gradient, ...visualStyle }}><div className="w-1/2 h-1/2 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div><div className="w-1/6 h-1/3 bg-green-400 rounded-t-full absolute bottom-1/2 left-1/2 -translate-x-1/2" style={{ transform: `translateY(-${size * 0.2}px) rotate(-10deg)` }}></div></div>;
                case 'Элементаль': return <div style={{ ...baseStyle, background: gradient, borderRadius: '45% 55% 40% 60% / 60% 50% 50% 40%', ...visualStyle }}><div className="w-1/5 h-1/5 bg-black rounded-full absolute top-1/2 left-1/2 -translate-x-full -translate-y-1/4"></div><div className="w-1/5 h-1/5 bg-black rounded-full absolute top-1/2 left-1/2 -translate-y-1/4"></div></div>;
                case 'Хранитель Фокуса': return <div style={{ ...baseStyle, background: gradient, ...visualStyle }}><div className="w-2/3 h-2/3 bg-gray-800 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div><div className="w-1/3 h-1/3 border-4 border-yellow-300 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div></div>;
                default: return <div style={{...baseStyle, ...visualStyle}} className="bg-accent"></div>;
            }
        }
        
        // Emoji-based pets
        return (
            <div style={{...baseStyle, backgroundColor: isSad ? '#4a5568' : colorData.visuals.primaryColor, fontSize: `${size * 0.6}px` }}>
                {petEmoji}
            </div>
        );
    };

    return (
        <div className="relative cursor-pointer group" style={{ width: size, height: size }}>
             {/* Aura Effect */}
            <div 
                className="absolute inset-0 rounded-full animate-pulseGlow transition-all duration-500"
                style={{
                    boxShadow: `0 0 ${size/4}px ${size/16}px ${colorData.visuals.primaryColor}30, 0 0 ${size/8}px 0px ${colorData.visuals.primaryColor}50`,
                    opacity: isSleeping ? 0.3 : 1
                }}
            />

            <div onClick={handlePetClick} className="relative w-full h-full z-10">
                <AnimatePresence>
                    {isPetting && (
                        <motion.div
                            variants={heartVariants}
                            initial="initial"
                            animate="animate"
                            className="absolute top-0 right-0"
                            style={{width: size/4, height: size/4}}
                        >
                            <HeartIcon className="w-full h-full text-pink-500" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    className="w-full h-full"
                    variants={petContainerVariants}
                    initial="hidden"
                    animate={getAnimationState()}
                    custom={isSad}
                >
                    {getPetContent()}
                </motion.div>
                
                {isSleeping && <motion.span initial={{opacity: 0}} animate={{opacity:1}} className="absolute -top-1 -right-1 text-4xl animate-bounce">💤</motion.span>}
                {isDirty && <div className="absolute inset-0 bg-yellow-900/40 rounded-full ring-4 ring-yellow-900/60 pointer-events-none" style={{ backdropFilter: 'blur(1px)' }}></div>}
            </div>
        </div>
    );
};


export const PetVisualMini: React.FC<{ stats: PlayerStats }> = ({ stats }) => {
    const { level, characterType, petStats, petCustomization } = stats;
    const size = 64;
    const isSad = petStats.hunger < 30 || petStats.happiness < 30;
    const isDirty = petStats.cleanliness < 30;
    const isSleeping = petStats.isSleeping;

    const colorData = PET_CUSTOMIZATIONS[characterType]?.find(c => c.id === petCustomization.color) || PET_CUSTOMIZATIONS[characterType][0];

    const baseStyle: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        position: 'relative',
        transition: 'all 0.5s ease-in-out',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        overflow: 'hidden',
    };
    
    const statusStyle = isSad ? { filter: 'grayscale(50%)', transform: 'scale(0.95)' } : {};

    if (characterType === 'spark') {
        const currentStage = getPetStage(level, 'spark');
        const gradient = `radial-gradient(circle, ${colorData.visuals.primaryColor} 0%, ${colorData.visuals.secondaryColor} 70%)`;
        if (currentStage.name === 'Искра') return <div style={{ ...baseStyle, background: gradient, ...statusStyle }}><div className="w-6 h-6 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div></div>;
        if (currentStage.name === 'Росток') return <div style={{ ...baseStyle, background: gradient, ...statusStyle }}><div className="w-2 h-6 bg-green-400 rounded-t-full absolute bottom-1/2 left-1/2 -translate-x-1/2" style={{ transform: 'translateY(-10px) rotate(-10deg)' }}></div></div>;
        return <div style={{...baseStyle, ...statusStyle, background: gradient}}></div>;
    }

    const petEmoji = isSleeping ? colorData.visuals.emojiSleeping : isSad ? colorData.visuals.emojiSad : colorData.visuals.emoji;
    const petBgColor = isSad ? '#4a5568' : colorData.visuals.primaryColor;
    
     return (
        <div style={{...baseStyle, backgroundColor: petBgColor}} className="bg-accent">
            {petEmoji}
            {isDirty && !isSleeping && <div className="absolute inset-0 bg-yellow-900/30 backdrop-blur-sm"></div>}
        </div>
     );
}