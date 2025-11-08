// src/App.tsx
import React, { useEffect, useState } from "react";
import { addTask, getTasks, deleteTask } from "./firebaseActions";

interface Task {
  id?: string;
  title: string;
  completed?: boolean;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  // 🚀 Загружаем задачи при старте
  useEffect(() => {
    const loadTasks = async () => {
      const loadedTasks = await getTasks();
      setTasks(loadedTasks);
    };
    loadTasks();
  }, []);

  // ➕ Добавить задачу
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    const taskData = { title: newTask, completed: false };
    const id = await addTask(taskData);
    setTasks([...tasks, { id, ...taskData }]);
    setNewTask("");
  };

  // 🗑 Удалить задачу
  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">🔥 TaskFlow AI — Firebase Sync</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Введите задачу..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="flex-1 border rounded-lg p-2"
        />
        <button
          onClick={handleAddTask}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Добавить
        </button>
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex justify-between items-center bg-gray-100 p-3 rounded-lg shadow"
          >
            <span>{task.title}</span>
            <button
              onClick={() => handleDeleteTask(task.id!)}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Удалить
            </button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && <p className="text-gray-500 mt-4 text-center">Нет задач 😴</p>}
    </div>
  );
}

export default App;
