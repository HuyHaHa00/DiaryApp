// src/app/index.tsx
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AuthScreen from "../screens/AuthScreen"; // Gọi component AuthScreen từ thư mục screens sang
import { auth } from "./config/firebase"; // Kiểm tra đường dẫn này cho đúng với vị trí file firebase của bạn

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Lắng nghe trạng thái đăng nhập từ Firebase
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Lỗi khi đăng xuất: ", error);
    }
  };

  if (initializing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ marginTop: 10 }}>Đang tải ứng dụng...</Text>
      </View>
    );
  }

  // Nếu chưa đăng nhập, hiển thị màn hình AuthScreen
  if (!user) {
    return (
      <AuthScreen
        onLoginSuccess={(loggedInUser: User) => setUser(loggedInUser)}
      />
    );
  }

  // Nếu đã đăng nhập thành công, hiển thị màn hình chính của Nhật Ký
  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <Text style={styles.welcomeText}>
          Xin chào, bài viết nhật ký của bạn sẽ nằm ở đây! 🎉
        </Text>
        <Text style={styles.emailText}>Tài khoản: {user.email}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  mainContent: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  welcomeText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  emailText: {
    color: "#666",
    marginBottom: 24,
  },
  logoutButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#ff4d4d",
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
