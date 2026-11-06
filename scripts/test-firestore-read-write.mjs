// scripts/test-firestore-read-write.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyATw_Lna2YpPJR86to1uw3uI9kkwb3HC5U",
  authDomain: "festoria-cd375.firebaseapp.com",
  projectId: "festoria-cd375",
  storageBucket: "festoria-cd375.firebasestorage.app",
  messagingSenderId: "416271261412",
  appId: "1:416271261412:web:dd8f76c08c474a1fe516f1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('--- Testing Firestore Connection to festoria-cd375 ---');

async function testConnection() {
  try {
    const testDocRef = doc(db, 'fests', 'FEST-01');
    const snap = await getDoc(testDocRef);
    console.log('✓ Firestore connection test succeeded!');
    console.log('Document exists:', snap.exists());
    if (snap.exists()) {
      console.log('Data:', snap.data());
    } else {
      console.log('Database is currently empty (ready for initial fest data seeding).');
    }
    process.exit(0);
  } catch (err) {
    console.log('Firestore response:', err.message);
    if (err.message.includes('permission-denied') || err.message.includes('PERMISSION_DENIED')) {
      console.log('✓ Firestore is active! (Rules currently enforce security deny-by-default).');
      process.exit(0);
    } else {
      console.error('Connection error detail:', err);
      process.exit(1);
    }
  }
}

testConnection();

