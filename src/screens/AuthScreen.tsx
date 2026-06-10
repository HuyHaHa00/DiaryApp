// src/screens/AuthScreen.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../app/config/firebase"; // Hãy điều chỉnh đường dẫn phù hợp nếu bạn để file firebase.js ở chỗ khác

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false); // Dùng để chuyển đổi giữa Đăng nhập và Đăng ký
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // Tính năng Đăng ký tài khoản mới
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Đăng ký tài khoản thành công!");
      } else {
        // Tính năng Đăng nhập
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        onLoginSuccess(userCredential.user);
      }
    } catch (err: any) {
      // Xử lý một số lỗi cơ bản từ Firebase
      if (err.code === "auth/email-already-in-use")
        setError("Email này đã được sử dụng!");
      else if (err.code === "auth/weak-password")
        setError("Mật khẩu phải có ít nhất 6 ký tự!");
      else if (err.code === "auth/invalid-credential")
        setError("Thông tin đăng nhập không chính xác!");
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {isRegister ? "Tạo tài khoản nhật ký" : "Chào mừng bạn trở lại"}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Địa chỉ Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          onSubmitEditing={handleAuth}
        />

        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={handleAuth}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegister ? "Đăng ký" : "Đăng nhập"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsRegister(!isRegister)}
          style={styles.switchLink}
        >
          <Text style={styles.switchText}>
            {isRegister
              ? "Đã có tài khoản? Đăng nhập ngay"
              : "Chưa có tài khoản? Đăng ký tại đây"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 400, // Tạo khung dọc ở giữa màn hình máy tính giống giao diện Mobile
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#333",
  },
  input: {
    height: 48,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fafafa",
  },
  button: {
    height: 48,
    backgroundColor: "#4A90E2",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginBottom: 16,
    textAlign: "center",
  },
  switchLink: {
    marginTop: 16,
    alignItems: "center",
  },
  switchText: {
    color: "#4A90E2",
    fontSize: 14,
  },
});
