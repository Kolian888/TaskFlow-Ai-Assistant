import React, { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { PlayIcon, PauseIcon, RefreshIcon } from './Icons';

interface PomodoroTimerProps {
  activeTask: Task | null;
  onComplete: (taskId: string) => void;
  onCancel: () => void;
  pomodoroSettings: { workMinutes: number; breakMinutes: number; };
  onSettingsChange: (newSettings: { workMinutes: number; breakMinutes: number; }) => void;
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
  timeRemaining: number;
  setTimeRemaining: (updater: number | ((prevTime: number) => number)) => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ activeTask, onComplete, onCancel, pomodoroSettings, onSettingsChange, isActive, setIsActive, timeRemaining, setTimeRemaining }) => {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [localSettings, setLocalSettings] = useState(pomodoroSettings);

  useEffect(() => {
    setLocalSettings(pomodoroSettings);
  }, [pomodoroSettings]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setMode('work');
    setTimeRemaining(localSettings.workMinutes * 60);
  }, [localSettings, setIsActive, setTimeRemaining]);

  useEffect(() => {
    if (activeTask) {
       setMode('work');
       setTimeRemaining(localSettings.workMinutes * 60);
    }
  }, [activeTask, localSettings, setTimeRemaining]);

   useEffect(() => {
    // When settings change from outside, update the timer if not active
    if (!isActive) {
      setMode('work');
      setTimeRemaining(pomodoroSettings.workMinutes * 60);
    }
  }, [pomodoroSettings, isActive, setTimeRemaining]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (isActive && timeRemaining === 0) {
      if (mode === 'work' && activeTask) {
        onComplete(activeTask.id);
        setMode('break');
        setTimeRemaining(pomodoroSettings.breakMinutes * 60);
      } else {
        setMode('work');
        setTimeRemaining(pomodoroSettings.workMinutes * 60);
        setIsActive(false); // Stop after break
      }
      new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3').play();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining, mode, activeTask, onComplete, pomodoroSettings, setIsActive, setTimeRemaining]);

  const handleSettingsChange = (field: 'workMinutes' | 'breakMinutes', value: string) => {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue > 0 && numValue < 1000) {
          setLocalSettings(prev => ({ ...prev, [field]: numValue }));
      }
  };

  const handleSaveSettings = () => {
      onSettingsChange(localSettings);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const inputClasses = "w-24 bg-accent backdrop-blur-xl border border-border-color rounded-xl p-2.5 text-center text-lg focus:outline-none focus:ring-2 focus:ring-highlight shadow-inner-soft transition-colors focus:border-highlight";

  if (!activeTask) {
    return (
      <div className="text-center">
        <h3 className="text-xl font-bold mb-4 text-text-primary">Настройки</h3>
        <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between gap-4">
                <label htmlFor="work-minutes" className="font-semibold text-text-primary">Работа (мин):</label>
                <input 
                    type="number" 
                    id="work-minutes" 
                    value={localSettings.workMinutes}
                    onChange={(e) => handleSettingsChange('workMinutes', e.target.value)}
                    min="1"
                    className={inputClasses}
                />
            </div>
             <div className="flex items-center justify-between gap-4">
                <label htmlFor="break-minutes" className="font-semibold text-text-primary">Перерыв (мин):</label>
                <input 
                    type="number" 
                    id="break-minutes"
                    value={localSettings.breakMinutes}
                    onChange={(e) => handleSettingsChange('breakMinutes', e.target.value)}
                    min="1"
                    className={inputClasses}
                />
            </div>
        </div>
        <button 
            onClick={handleSaveSettings} 
            className="w-full bg-highlight text-primary font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity mb-3 active:scale-95"
        >
            Сохранить настройки
        </button>
        <p className="text-sm text-center text-text-secondary">Выберите задачу и нажмите 'play', чтобы начать.</p>
      </div>
    );
  }

  const totalDuration = mode === 'work' ? pomodoroSettings.workMinutes * 60 : pomodoroSettings.breakMinutes * 60;
  const progressPercentage = (timeRemaining / totalDuration) * 100;
  const isBreak = mode === 'break';

  return (
    <div className="text-center">
      <h3 className="text-xl font-bold mb-2 text-text-primary">
        {isBreak ? 'Перерыв' : 'Сеанс фокусировки'}
      </h3>
      <p className="text-sm text-text-secondary mb-4 truncate h-5">{activeTask.title}</p>
      <div className="relative my-6 flex items-center justify-center">
        <svg className="w-48 h-48 absolute" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="6" fill="none" />
            <circle 
                cx="60" cy="60" r="54" 
                stroke={isBreak ? '#52D186' : '#4E95F2'}
                strokeWidth="6" fill="none"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - progressPercentage / 100)}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{
                  transition: 'stroke-dashoffset 1s linear',
                }}
            />
        </svg>
        <div className="text-6xl font-mono font-semibold text-text-primary tracking-tighter z-10">
          {formatTime(timeRemaining)}
        </div>
      </div>
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`group w-20 h-20 flex items-center justify-center text-white rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-secondary active:scale-90 shadow-lg ${
            isActive ? 'bg-brand-red/80 hover:bg-brand-red focus:ring-brand-red/50' : 'bg-highlight/80 hover:bg-highlight focus:ring-highlight/50'
          }`}
          aria-label={isActive ? 'Пауза' : 'Старт'}
        >
          {isActive ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 pl-1" />}
        </button>
        <button
          onClick={() => {
            resetTimer();
            onCancel();
          }}
          className="group w-14 h-14 flex items-center justify-center bg-accent text-text-secondary rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-gray-500 active:scale-90 shadow-md"
          aria-label="Сбросить и отменить таймер"
        >
          <RefreshIcon className="w-7 h-7 group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
