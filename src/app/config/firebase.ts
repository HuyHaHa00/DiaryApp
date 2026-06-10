// src/app/config/firebase.ts
import { initializeApp } from "firebase/app";
import { initializeAuth, Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Giải pháp tối ưu: Sử dụng require động ép kiểu 'any' để dập tắt hoàn toàn cảnh báo TS
const getMobilePersistence = () => {
  try {
    // @ts-ignore - Bỏ qua kiểm tra TypeScript dòng này vì nó thuộc môi trường di động
    const { getReactNativePersistence } = require("firebase/auth/react-native");
    return getReactNativePersistence(AsyncStorage);
  } catch (error) {
    return undefined;
  }
};

// Trên Mobile: Gọi hàm lưu trữ thông qua hàm bổ trợ an toàn
const auth: Auth = initializeAuth(app, {
  persistence: getMobilePersistence(),
});

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({}),
});

const storage = getStorage(app);

export { app, auth, db, storage };