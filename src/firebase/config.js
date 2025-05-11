import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Rimuovi l'importazione di getStorage

const firebaseConfig = {
  apiKey: "AIzaSyCBbDqlzpw49Wr5lSvCLMlgATWGlh2eVQE",
  authDomain: "student-tracker-bb8f5.firebaseapp.com",
  projectId: "student-tracker-bb8f5",
  storageBucket: "student-tracker-bb8f5.firebasestorage.app",
  messagingSenderId: "628117092182",
  appId: "1:628117092182:web:3c967964d16e8943f048f7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Crea un mock dello storage
export const storage = {
  // Funzioni mock che non fanno nulla ma evitano errori
  ref: () => ({
    put: () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve("") } }),
  }),
};

export default app;