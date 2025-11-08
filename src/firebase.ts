// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔐 Конфигурация из Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCKESLk9ssUte9ElNP9aGBMbVvJ5LTE0Yk",
  authDomain: "task-flow-dc616.firebaseapp.com",
  projectId: "task-flow-dc616",
  storageBucket: "task-flow-dc616.appspot.com",
  messagingSenderId: "866681037843",
  appId: "1:866681037843:web:cd7fddf5fc524dcdd08be6"
};

// 🚀 Инициализация Firebase
const app = initializeApp(firebaseConfig);

// 🧩 Подключаем Firestore (базу данных)
const db = getFirestore(app);

// 📤 Экспортируем объекты
export { app, db };
