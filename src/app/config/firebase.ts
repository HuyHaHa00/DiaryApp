// src/app/config/firebase.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { Auth, initializeAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

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


if (Platform.OS === "web") {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("6Le6EhctAAAAAJTIhUyoUw2JkrOctEAC18eh7JDp"),
    isTokenAutoRefreshEnabled: true,
  });
}

const getMobilePersistence = () => {
  try {
    const { getReactNativePersistence } = require("firebase/auth/react-native");
    return getReactNativePersistence(AsyncStorage);
  } catch (error) {
    return undefined;
  }
};

const auth: Auth = initializeAuth(app, {
  persistence: getMobilePersistence(),
});

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({}),
});

const storage = getStorage(app);

export { app, auth, db, storage };

