import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from "react-native";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../app/config/firebase";
import { useDiary } from "../../context/DiaryContext";

export default function ProfileScreen() {
  const { user, entries } = useDiary();
  const [birthday, setBirthday] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "profile", "info"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.birthday) setBirthday(data.birthday);
          if (data.location) setLocation(data.location);
        }
      } catch (e) {} finally {
        setLoadingProfile(false);
      }
    })();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid, "profile", "info"), {
        birthday,
        location,
      }, { merge: true });
      if (Platform.OS === 'web') {
        window.alert("Đã lưu thông tin cá nhân thành công!");
      } else {
        Alert.alert("Thành công", "Đã lưu thông tin cá nhân!");
      }
    } catch (e) {
      if (Platform.OS === 'web') {
         window.alert("Lỗi khi lưu thông tin!");
      } else {
         Alert.alert("Lỗi", "Không thể lưu thông tin");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const doSignOut = async () => {
      await signOut(auth);
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?")) {
        doSignOut();
      }
    } else {
      Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
        { text: "Huỷ", style: "cancel" },
        { text: "Đăng xuất", style: "destructive", onPress: doSignOut }
      ]);
    }
  };

  // Tính số ngày bạn đã đồng hành (tổng số ngày độc nhất có nhật ký)
  const uniqueDays = new Set(entries.map(e => new Date(e.createdAt).toDateString())).size;

  if (loadingProfile) {
    return (
      <View style={styles.center}>
         <ActivityIndicator color="#4A90E2" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cá nhân</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Info Card */}
        <View style={[styles.card, styles.userCard]}>
          <Text style={styles.avatar}>👤</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
          <Text style={styles.uidText}>Mã ID: {user?.uid.substring(0, 10)}...</Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{entries.length}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{uniqueDays}</Text>
            <Text style={styles.statLabel}>Ngày đồng hành</Text>
          </View>
        </View>

        {/* Personal Info Form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin của bạn</Text>
          
          <Text style={styles.inputLabel}>Ngày sinh</Text>
          <TextInput 
            style={styles.input} 
            placeholder="VD: 01/01/2000" 
            placeholderTextColor="#ccc"
            value={birthday}
            onChangeText={setBirthday}
          />

          <Text style={styles.inputLabel}>Nơi ở / Quê quán</Text>
          <TextInput 
            style={styles.input} 
            placeholder="VD: Hà Nội, Việt Nam" 
            placeholderTextColor="#ccc"
            value={location}
            onChangeText={setLocation}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu thông tin</Text>}
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Đăng xuất khỏi tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f3ee",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f3ee",
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  userCard: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatar: {
    fontSize: 64,
    marginBottom: 16,
  },
  emailText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  uidText: {
    fontSize: 12,
    color: "#aaa",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4A90E2",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ebe6df",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  logoutBtn: {
    backgroundColor: "#FFE5E5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: {
    color: "#E74C3C",
    fontSize: 16,
    fontWeight: "700",
  },
});
