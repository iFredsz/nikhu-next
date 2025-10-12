import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID,
}

const app = initializeApp(firebaseConfig)

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

// Aktifkan long polling otomatis (fix koneksi lambat / timeout)
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true
  // Tambahkan setting global untuk koneksi lambat
  ;(globalThis as any).process = { ...process, env: { ...process.env, FIRESTORE_LONG_POLLING: 'true' } }
}

const auth = getAuth(app)

export { app, auth, db }