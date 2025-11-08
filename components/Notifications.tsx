import React from 'react';
import { Task } from '../types';
import { BellIcon } from './Icons';

interface NotificationsProps {
    permission: NotificationPermission;
    onRequestPermission: () => void;
    tasksDueToday: Task[];
}

const Notifications: React.FC<NotificationsProps> = ({ permission, onRequestPermission, tasksDueToday }) => {
    const renderContent = () => {
        switch (permission) {
            case 'granted':
                return (
                    <div>
                        <p className="text-sm text-brand-green mb-3">Уведомления включены.</p>
                        {tasksDueToday.length > 0 ? (
                            <>
                                <h4 className="text-sm font-semibold text-text-secondary mb-2">Напоминания на сегодня:</h4>
                                <ul className="space-y-1 text-sm text-text-primary max-h-24 overflow-y-auto">
                                    {tasksDueToday.map(task => (
                                        <li key={task.id} className="truncate">
                                            - {task.title}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <p className="text-sm text-text-secondary">На сегодня срочных задач нет.</p>
                        )}
                    </div>
                );
            case 'denied':
                return (
                    <p className="text-sm text-brand-yellow">
                        Вы заблокировали уведомления. Чтобы снова их получать, разрешите их в настройках вашего браузера для этого сайта.
                    </p>
                );
            case 'default':
            default:
                return (
                    <div>
                        <p className="text-sm text-text-secondary mb-3">Получайте напоминания о задачах с истекающим сроком.</p>
                        <button
                            onClick={onRequestPermission}
                            className="w-full bg-highlight/80 text-primary font-bold py-2.5 px-4 rounded-xl hover:bg-highlight transition-colors active:scale-95"
                        >
                            Включить уведомления
                        </button>
                    </div>
                );
        }
    };

    return (
        <>
            {renderContent()}
        </>
    );
};

export default Notifications;
