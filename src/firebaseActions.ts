import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./main"; // или './index', если переименуешь

export const saveData = async (data: any) => {
  try {
    const docRef = await addDoc(collection(db, "taskflow"), data);
    console.log("Документ сохранён с ID:", docRef.id);
  } catch (e) {
    console.error("Ошибка при сохранении:", e);
  }
};

export const getData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "taskflow"));
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} =>`, doc.data());
    });
  } catch (e) {
    console.error("Ошибка при получении:", e);
  }
};
