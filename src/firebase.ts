import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKESLk9ssUte9ElNP9aGBMbVvJ5LTE0Yk",
  authDomain: "task-flow-dc616.firebaseapp.com",
  projectId: "task-flow-dc616",
  storageBucket: "task-flow-dc616.appspot.com",
  messagingSenderId: "866681037843",
  appId: "1:866681037843:web:cd7fddf5fc524dcdd08be6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
