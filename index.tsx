// src/main.tsx или src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 🔥 Firebase подключение
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Конфиг из Firebase (исправлен storageBucket)
const firebaseConfig = {
  apiKey: "AIzaSyCKESLk9ssUte9ElNP9aGBMbVvJ5LTE0Yk",
  authDomain: "task-flow-dc616.firebaseapp.com",
  projectId: "task-flow-dc616",
  storageBucket: "task-flow-dc616.appspot.com", // ← правильно
  messagingSenderId: "866681037843",
  appId: "1:866681037843:web:cd7fddf5fc524dcdd08be6"
};

// 🔌 Инициализация Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // можно использовать в других модулях

// 🚀 Рендер React-приложения
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
