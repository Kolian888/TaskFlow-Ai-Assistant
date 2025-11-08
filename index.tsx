// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKESLk9ssUte9ElNP9aGBMbVvJ5LTE0Yk",
  authDomain: "task-flow-dc616.firebaseapp.com",
  projectId: "task-flow-dc616",
  storageBucket: "task-flow-dc616.firebasestorage.app",
  messagingSenderId: "866681037843",
  appId: "1:866681037843:web:cd7fddf5fc524dcdd08be6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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
