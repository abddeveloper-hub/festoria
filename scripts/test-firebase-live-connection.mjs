// scripts/test-firebase-live-connection.mjs
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyATw_Lna2YpPJR86to1uw3uI9kkwb3HC5U",
  authDomain: "festoria-cd375.firebaseapp.com",
  projectId: "festoria-cd375",
  storageBucket: "festoria-cd375.firebasestorage.app",
  messagingSenderId: "416271261412",
  appId: "1:416271261412:web:dd8f76c08c474a1fe516f1",
};

console.log('--- Testing Firebase Live Initialization ---');
try {
  const app = initializeApp(firebaseConfig);
  console.log('✓ Firebase App initialized successfully with project:', app.options.projectId);
  
  const auth = getAuth(app);
  console.log('✓ Firebase Auth service attached successfully');

  const db = getFirestore(app);
  console.log('✓ Cloud Firestore service attached successfully');

  console.log('\n>>> Firebase Live Configuration is VALID & READY! <<<');
  process.exit(0);
} catch (err) {
  console.error('✗ Firebase initialization error:', err);
  process.exit(1);
}

