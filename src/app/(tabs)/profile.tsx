import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from "react-native";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../app/config/firebase";
import { useDiary } from "../../context/DiaryContext";
import { useTheme, ThemeMode } from "../../context/ThemeContext";

export default function ProfileScreen() {
  const { user, entries } = useDiary();
  const { colors, mode, setMode } = useTheme();
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
         <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Cá nhân</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Info Card */}
        <View style={[styles.card, styles.userCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={styles.avatar}>👤</Text>
          <Text style={[styles.emailText, { color: colors.text }]}>{user?.email}</Text>
          <Text style={[styles.uidText, { color: colors.textSecondary }]}>Mã ID: {user?.uid.substring(0, 10)}...</Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{entries.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bài viết</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{uniqueDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ngày đồng hành</Text>
          </View>
        </View>

        {/* Personal Info Form */}
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin của bạn</Text>
          
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ngày sinh</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
            placeholder="VD: 01/01/2000" 
            placeholderTextColor={colors.textSecondary}
            value={birthday}
            onChangeText={setBirthday}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nơi ở / Quê quán</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
            placeholder="VD: Hà Nội, Việt Nam" 
            placeholderTextColor={colors.textSecondary}
            value={location}
            onChangeText={setLocation}
          />

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu thông tin</Text>}
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.dangerBg }]} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: colors.danger }]}>🚪 Đăng xuất khỏi tài khoản</Text>
        </TouchableOpacity>

        {/* Theme Toggles */}
        <View style={[styles.card, { backgroundColor: colors.surface, marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Giao diện</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <ThemeOption label="Hệ thống" value="system" current={mode} onSelect={setMode} colors={colors} />
            <ThemeOption label="Sáng" value="light" current={mode} onSelect={setMode} colors={colors} />
            <ThemeOption label="Tối" value="dark" current={mode} onSelect={setMode} colors={colors} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function ThemeOption({ label, value, current, onSelect, colors }: any) {
  const isActive = current === value;
  return (
    <TouchableOpacity
      onPress={() => onSelect(value)}
      style={{
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isActive ? colors.primary : colors.border,
        backgroundColor: isActive ? colors.primary + "1A" : "transparent",
        alignItems: "center"
      }}
    >
      <Text style={{ color: isActive ? colors.primary : colors.textSecondary, fontWeight: isActive ? "700" : "500" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
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
    marginBottom: 4,
  },
  uidText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  saveBtn: {
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
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
