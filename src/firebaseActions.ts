// src/firebaseActions.ts
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

const TASKS_COLLECTION = "tasks";

/**
 * 💾 Добавить задачу
 */
export const addTask = async (taskData: any) => {
  try {
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData);
    console.log("✅ Задача добавлена с ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Ошибка при добавлении задачи:", error);
    throw error;
  }
};

/**
 * 📥 Получить все задачи
 */
export const getTasks = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, TASKS_COLLECTION));
    const tasks = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log("📦 Загружено задач:", tasks.length);
    return tasks;
  } catch (error) {
    console.error("❌ Ошибка при получении задач:", error);
    return [];
  }
};

/**
 * 🗑 Удалить задачу
 */
export const deleteTask = async (id: string) => {
  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, id));
    console.log("🗑 Задача удалена:", id);
  } catch (error) {
    console.error("❌ Ошибка при удалении задачи:", error);
  }
};

/**
 * ✏️ Обновить задачу
 */
export const updateTask = async (id: string, updatedData: any) => {
  try {
    await updateDoc(doc(db, TASKS_COLLECTION, id), updatedData);
    console.log("🔄 Задача обновлена:", id);
  } catch (error) {
    console.error("❌ Ошибка при обновлении задачи:", error);
  }
};
