
import React from 'react';
import { PlayerStats, CharacterType } from '../types';
import { TrophyIcon, CrystalIcon, CheckCircleIcon, FoodBowlIcon, HeartIcon, GameControllerIcon, SoapIcon, MoonIcon, ShoppingBagIcon } from './Icons';
import { PetVisual } from './PetVisual';

interface PetViewProps {
    playerStats: PlayerStats;
    onFeed: () => boolean;
    onPlay: () => boolean;
    onBathe: () => boolean;
    onToggleSleep: () => boolean;
    onPet: () => boolean;
    onOpenStore: () => void;
    onSwitchRequest: () => void;
}

const EVOLUTIONS: Record<CharacterType, { name: string; level: number; description: string }[]> = {
    spark: [
        { name: 'Искра', level: 1, description: 'Чистая энергия концентрации.' },
        { name: 'Росток', level: 5, description: 'Энергия обретает форму, появляются первые признаки жизни.' },
        { name: 'Элементаль', level: 10, description: 'Сознание пробудилось. Питомец начинает познавать мир.' },
        { name: 'Хранитель Фокуса', level: 15, description: 'Могущественное существо, символ вашей дисциплины.' }
    ],
    cat: [
        { name: 'Котенок', level: 1, description: 'Маленький клубок любопытства и игривости.' },
        { name: 'Подросток', level: 5, description: 'Изучает мир, оттачивая свои кошачьи инстинкты.' },
        { name: 'Взрослый Кот', level: 10, description: 'Грациозный и мудрый охотник, мастер концентрации.' },
        { name: 'Дух-Хранитель', level: 15, description: 'Мистическое существо, воплощение кошачьей интуиции.' }
    ],
    dog: [
        { name: 'Щенок', level: 1, description: 'Верный друг, полный безудержной энергии.' },
        { name: 'Подросток', level: 5, description: 'Учится командам и становится надежным компаньоном.' },
        { name: 'Взрослый Пес', level: 10, description: 'Сильный и преданный защитник, всегда рядом.' },
        { name: 'Дух-Защитник', level: 15, description: 'Благородный дух, символ непоколебимой верности.' }
    ],
    labubu: [
        { name: 'Малыш Лабубу', level: 1, description: 'Озорной и загадочный комочек.' },
        { name: 'Непоседа Лабубу', level: 5, description: 'Любопытство толкает его на шалости.' },
        { name: 'Хитрый Лабубу', level: 10, description: 'Мастер маскировки и забавных проделок.' },
        { name: 'Король Лабубу', level: 15, description: 'Повелитель всех монстриков.' }
    ],
    dragon: [
        { name: 'Драконье Яйцо', level: 1, description: 'Древняя магия дремлет внутри.' },
        { name: 'Вылупившийся Дракончик', level: 5, description: 'Первый вдох, наполненный искрами.' },
        { name: 'Огненный Дрейк', level: 10, description: 'Чешуя крепчает, а пламя становится жарче.' },
        { name: 'Великий Дракон', level: 15, description: 'Мудрый и могучий страж небес.' }
    ],
    unicorn: [
        { name: 'Жеребенок', level: 1, description: 'Шаг, полный волшебной пыльцы.' },
        { name: 'Юный Единорог', level: 5, description: 'Его рог начинает светиться чистым светом.' },
        { name: 'Сияющий Скакун', level: 10, description: 'Грациозное создание, исцеляющее одним касанием.' },
        { name: 'Астральный Единорог', level: 15, description: 'Существо из звезд, проводник в мире грез.' }
    ],
    phoenix: [
        { name: 'Птенец из Пепла', level: 1, description: 'Возрождение из огня концентрации.' },
        { name: 'Огненный Феникс', level: 5, description: 'Его крылья оставляют за собой шлейф искр.' },
        { name: 'Солнечная Птица', level: 10, description: 'Яркий, как полуденное солнце, символ надежды.' },
        { name: 'Императорский Феникс', level: 15, description: 'Вечная птица, чье пение вдохновляет.' }
    ],
    cthulhu: [
        { name: 'Головастик Глубин', level: 1, description: 'Что-то шевелится в темных водах сознания.' },
        { name: 'Юный Ктулху', level: 5, description: 'Протягивает свои милые щупальца к знаниям.' },
        { name: 'Зов Бездны', level: 10, description: 'Его бормотание помогает сосредоточиться.' },
        { name: 'Древний', level: 15, description: 'Космическая мудрость в очаровательном обличии.' }
    ],
};


const getPetStage = (level: number, type: CharacterType) => {
    let currentStage = EVOLUTIONS[type][0];
    for (const stage of EVOLUTIONS[type]) {
        if (level >= stage.level) {
            currentStage = stage;
        } else {
            break;
        }
    }
    return currentStage;
};

const StatBar: React.FC<{ value: number, icon: React.FC<any>, color: string, label: string }> = ({ value, icon: Icon, color, label }) => (
    <div>
        <div className="flex justify-between items-center text-sm text-text-secondary mb-1.5">
            <div className="flex items-center gap-1.5 font-semibold">
                <Icon className={`w-4 h-4 ${color}`} />
                <span>{label}</span>
            </div>
            <span>{Math.round(value)}%</span>
        </div>
        <div className="w-full bg-black/30 rounded-full h-2.5 shadow-inner-soft border border-border-color">
            <div 
                className={`${color.replace('text-', 'bg-')} h-full rounded-full transition-all duration-300`} 
                style={{ width: `${value}%`}}>
            </div>
        </div>
    </div>
);


const Achievements: React.FC<PetViewProps> = ({ playerStats, onFeed, onPlay, onBathe, onToggleSleep, onPet, onOpenStore, onSwitchRequest }) => {
    const { level, focusCrystals, characterType, characterName, petStats } = playerStats;
    const currentStage = getPetStage(level, characterType);
    const evolutionPath = EVOLUTIONS[characterType];
    const feedCost = 10;
    const playCost = 15;
    const batheCost = 12;

    return (
        <div className="bg-secondary p-4 md:p-8 rounded-3xl border border-border-color shadow-soft-glow">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <TrophyIcon className="w-8 h-8 text-brand-yellow flex-shrink-0" />
                    <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
                         <h2 className="text-2xl md:text-3xl font-bold text-text-primary">Ваш питомец: <span className="text-neon-purple">{characterName || 'Безымянный'}</span></h2>
                         <button onClick={onSwitchRequest} className="text-sm text-highlight font-semibold hover:underline text-left">Сменить</button>
                    </div>
                </div>
                 <button 
                    onClick={onOpenStore}
                    className="bg-accent border border-border-color px-4 py-2.5 rounded-xl text-text-primary font-semibold hover:bg-white/10 transition-colors flex items-center gap-2 self-end md:self-center"
                >
                    <ShoppingBagIcon className="w-5 h-5"/>
                    Магазин
                </button>
            </header>

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 items-start">
                {/* Pet Display & Care */}
                <div className="w-full lg:col-span-1 bg-primary p-6 rounded-2xl border border-border-color shadow-inner-soft flex flex-col items-center justify-center h-full">
                    <PetVisual stats={playerStats} onPet={onPet} size={160}/>
                    <h3 className="text-2xl font-bold text-white mt-6">{currentStage.name}</h3>
                    <p className="text-text-secondary text-center mb-4 h-10">{currentStage.description}</p>
                    
                    <div className="w-full space-y-4 my-4">
                        <StatBar value={petStats.hunger} icon={FoodBowlIcon} color="text-brand-green" label="Сытость" />
                        <StatBar value={petStats.happiness} icon={HeartIcon} color="text-brand-pink" label="Счастье" />
                        <StatBar value={petStats.cleanliness} icon={SoapIcon} color="text-brand-blue" label="Чистота" />
                        <StatBar value={petStats.energy} icon={MoonIcon} color="text-neon-purple" label="Энергия" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-2">
                        <button onClick={onFeed} disabled={focusCrystals < feedCost || petStats.isSleeping} className="flex flex-col items-center justify-center gap-1 bg-brand-green/10 border border-brand-green/20 text-brand-green p-3 rounded-xl hover:bg-brand-green/20 disabled:bg-gray-600/20 disabled:border-transparent disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">
                            <FoodBowlIcon className="w-6 h-6"/>
                            <span className="text-sm font-semibold">Покормить</span>
                            <div className="flex items-center gap-1 text-xs">
                                <CrystalIcon className="w-3 h-3"/> {feedCost}
                            </div>
                        </button>
                        <button onClick={onPlay} disabled={focusCrystals < playCost || petStats.isSleeping} className="flex flex-col items-center justify-center gap-1 bg-brand-pink/10 border border-brand-pink/20 text-brand-pink p-3 rounded-xl hover:bg-brand-pink/20 disabled:bg-gray-600/20 disabled:border-transparent disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">
                            <GameControllerIcon className="w-6 h-6"/>
                            <span className="text-sm font-semibold">Поиграть</span>
                             <div className="flex items-center gap-1 text-xs">
                                <CrystalIcon className="w-3 h-3"/> {playCost}
                            </div>
                        </button>
                         <button onClick={onBathe} disabled={focusCrystals < batheCost || petStats.isSleeping} className="flex flex-col items-center justify-center gap-1 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue p-3 rounded-xl hover:bg-brand-blue/20 disabled:bg-gray-600/20 disabled:border-transparent disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">
                            <SoapIcon className="w-6 h-6"/>
                            <span className="text-sm font-semibold">Купать</span>
                             <div className="flex items-center gap-1 text-xs">
                                <CrystalIcon className="w-3 h-3"/> {batheCost}
                            </div>
                        </button>
                        <button onClick={onToggleSleep} className="flex flex-col items-center justify-center gap-1 bg-neon-purple/10 border border-neon-purple/20 text-neon-purple p-3 rounded-xl hover:bg-neon-purple/20 transition-colors">
                            <MoonIcon className="w-6 h-6"/>
                            <span className="text-sm font-semibold">{petStats.isSleeping ? 'Разбудить' : 'Спать'}</span>
                             <div className="flex items-center gap-1 text-xs opacity-0">
                                <CrystalIcon className="w-3 h-3"/> 0
                            </div>
                        </button>
                    </div>
                </div>

                {/* Evolution Timeline */}
                <div className="w-full lg:col-span-2 bg-primary p-6 rounded-2xl border border-border-color shadow-inner-soft">
                    <h3 className="text-xl font-bold text-text-secondary mb-6">Путь Эволюции</h3>
                    <div className="relative pl-6">
                        {/* Vertical line */}
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border-color"></div>

                        {evolutionPath.map((stage) => {
                            const isUnlocked = level >= stage.level;
                            return (
                                <div key={stage.name} className="relative mb-8 flex items-center">
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transform -translate-x-1/2 ring-4 ring-primary transition-all duration-500 ${isUnlocked ? 'bg-neon-blue' : 'bg-accent'}`}>
                                        {isUnlocked && <CheckCircleIcon className="w-5 h-5 text-primary" />}
                                    </div>
                                    <div className={`ml-8 p-4 rounded-xl flex-grow transition-all duration-300 border ${isUnlocked ? 'bg-secondary border-border-color' : 'bg-accent border-transparent opacity-60'}`}>
                                        <div className="flex justify-between items-center">
                                            <h4 className={`text-lg font-bold ${isUnlocked ? 'text-text-primary' : 'text-text-secondary'}`}>{stage.name}</h4>
                                            <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${isUnlocked ? 'bg-neon-blue/20 text-neon-blue' : 'bg-primary text-text-secondary'}`}>
                                                Уровень {stage.level}+
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-primary mt-1">{stage.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Achievements;