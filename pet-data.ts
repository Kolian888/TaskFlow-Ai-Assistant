import { CharacterType } from './types';

export const EVOLUTIONS: Record<CharacterType, { name: string; level: number; description: string }[]> = {
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

export const getPetStage = (level: number, type: CharacterType) => {
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

interface PetColor {
    id: string;
    name: string;
    cost: number;
    visuals: {
        primaryColor: string;
        secondaryColor: string;
        emoji?: string;
        emojiSad?: string;
        emojiSleepy?: string;
        emojiSleeping?: string;
    };
}

export const PET_CUSTOMIZATIONS: Record<CharacterType, PetColor[]> = {
    spark: [
        { id: 'spark_default', name: 'Квантовый', cost: 0, visuals: { primaryColor: '#A371F7', secondaryColor: 'rgba(163, 113, 247, 0)' } },
        { id: 'spark_nebula', name: 'Туманность', cost: 150, visuals: { primaryColor: '#E96ED4', secondaryColor: 'rgba(22,16,88,0)' } },
        { id: 'spark_sunfire', name: 'Солнечная вспышка', cost: 200, visuals: { primaryColor: '#F2C94C', secondaryColor: 'rgba(255,69,0,0)' } },
        { id: 'spark_verdant', name: 'Био-энергия', cost: 150, visuals: { primaryColor: '#52D186', secondaryColor: 'rgba(82, 209, 134, 0)' } },
        { id: 'spark_cyber', name: 'Кибер', cost: 300, visuals: { primaryColor: '#4E95F2', secondaryColor: 'rgba(78, 149, 242, 0)' } },
    ],
    cat: [
        { id: 'cat_default', name: 'Рыжий', cost: 0, visuals: { primaryColor: '#F97316', secondaryColor: '#FCD34D', emoji: '🐈', emojiSad: '😿', emojiSleepy: '🥱', emojiSleeping: '😴' } },
        { id: 'cat_black', name: 'Нуар', cost: 100, visuals: { primaryColor: '#374151', secondaryColor: '#4B5563', emoji: '🐈‍⬛', emojiSad: '😿', emojiSleepy: '🥱', emojiSleeping: '😴' } },
        { id: 'cat_aurora', name: 'Аврора', cost: 250, visuals: { primaryColor: '#A371F7', secondaryColor: '#E96ED4', emoji: '🐾', emojiSad: '😿', emojiSleepy: '🥱', emojiSleeping: '😴' } },
        { id: 'cat_cyber', name: 'Кибер-кот', cost: 300, visuals: { primaryColor: '#52D186', secondaryColor: '#6B7280', emoji: '😻', emojiSad: '😿', emojiSleepy: '🥱', emojiSleeping: '😴' } },
    ],
    dog: [
        { id: 'dog_default', name: 'Золотистый', cost: 0, visuals: { primaryColor: '#CA8A04', secondaryColor: '#FBBF24', emoji: '🐕', emojiSad: '😥', emojiSleepy: '🥱', emojiSleeping: '😴' } },
        { id: 'dog_plasma', name: 'Плазма', cost: 250, visuals: { primaryColor: '#4E95F2', secondaryColor: '#1F2937', emoji: '🐕‍🦺', emojiSad: '😥', emojiSleepy: '🥱', emojiSleeping: '😴' } },
        { id: 'dog_nebula', name: 'Туманность', cost: 200, visuals: { primaryColor: '#A371F7', secondaryColor: '#E5E7EB', emoji: '🐺', emojiSad: '😥', emojiSleepy: '🥱', emojiSleeping: '😴' } },
        { id: 'dog_synth', name: 'Синтетик', cost: 300, visuals: { primaryColor: '#E96ED4', secondaryColor: '#A16207', emoji: '🐶', emojiSad: '😥', emojiSleepy: '🥱', emojiSleeping: '😴' } },
    ],
    labubu: [
        { id: 'labubu_default', name: 'Классический', cost: 0, visuals: { primaryColor: '#F3E8FF', secondaryColor: '#E9D5FF', emoji: '🐰', emojiSad: '😥', emojiSleepy: '🥱', emojiSleeping: '😴' } },
    ],
    dragon: [
        { id: 'dragon_default', name: 'Классический', cost: 0, visuals: { primaryColor: '#991B1B', secondaryColor: '#F87171', emoji: '🐲', emojiSad: '😥', emojiSleepy: '🥱', emojiSleeping: '😴' } },
    ],
    unicorn: [
        { id: 'unicorn_default', name: 'Классический', cost: 0, visuals: { primaryColor: '#E5E7EB', secondaryColor: '#D1D5DB', emoji: '🦄', emojiSad: '😥', emojiSleepy: '🥱', emojiSleeping: '😴' } },
    ],
    phoenix: [
        { id: 'phoenix_default', name: 'Классический', cost: 0, visuals: { primaryColor: '#F97316', secondaryColor: '#FBBF24', emoji: '🔥', emojiSad: '😥', emojiSleepy: '🥱', emojiSleeping: '😴' } },
    ],
    cthulhu: [
        { id: 'cthulhu_default', name: 'Классический', cost: 0, visuals: { primaryColor: '#064E3B', secondaryColor: '#10B981', emoji: '🐙', emojiSad: '😥', emojiSleepy: '🥱', emojiSleeping: '😴' } },
    ]
};