// src/app/config/firebase.web.ts
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
  Auth,
  browserLocalPersistence,
  browserSessionPersistence,
  initializeAuth,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBzUQe3zOINFo5O1FKGaZw3WgVOd_pen0I",
  authDomain: "diaryapp-dbb4c.firebaseapp.com",
  projectId: "diaryapp-dbb4c",
  storageBucket: "diaryapp-dbb4c.firebasestorage.app",
  messagingSenderId: "1020123256546",
  appId: "1:1020123256546:web:dc21d3e041a33ef68fb0bb",
  measurementId: "G-ZCTPL630ZM",
};

const app = initializeApp(firebaseConfig);

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Le6EhctAAAAAJTIhUyoUw2JkrOctEAC18eh7JDp"),
  isTokenAutoRefreshEnabled: true,
});

// Trên Web: Khởi tạo trực tiếp không dùng bất kỳ thư viện mobile nào
const auth: Auth = initializeAuth(app, {
  persistence: [browserLocalPersistence, browserSessionPersistence],
});

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

const storage = getStorage(app);

export { app, auth, db, storage };

