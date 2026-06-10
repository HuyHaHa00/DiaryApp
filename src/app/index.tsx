import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AuthScreen from "../screens/AuthScreen";
import DiaryCard, { DiaryEntry } from "../components/DiaryCard";
import Calendar from "../components/Calendar";
import { auth, db } from "./config/firebase";
import type { Mood } from "../components/MoodSelector";

const MOOD_LIST: { key: Mood; emoji: string; label: string }[] = [
  { key: "happy", emoji: "😆", label: "Vui" },
  { key: "neutral", emoji: "🙂", label: "Bình thường" },
  { key: "sad", emoji: "😢", label: "Buồn" },
  { key: "angry", emoji: "😡", label: "Tức giận" },
  { key: "tired", emoji: "😴", label: "Mệt mỏi" },
];

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<Mood | null>(null);

  const filteredEntries = entries.filter((entry) => {
    // 1. Lọc theo tâm trạng
    if (selectedMoodFilter && entry.mood !== selectedMoodFilter) {
      return false;
    }
    // 2. Lọc theo từ khóa tìm kiếm (tiêu đề hoặc nội dung)
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = entry.title?.toLowerCase().includes(q);
      const contentMatch = entry.content?.toLowerCase().includes(q);
      return titleMatch || contentMatch;
    }
    return true;
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }
    setLoadingEntries(true);
    const q = query(
      collection(db, "users", user.uid, "entries"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setEntries(
        snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<DiaryEntry, "id">) }))
      );
      setLoadingEntries(false);
    });
    return unsub;
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDayPress = (dateString: string, existingEntryId?: string) => {
    if (existingEntryId) {
      router.push(`/${existingEntryId}`);
    } else {
      router.push(`/create?date=${dateString}`);
    }
  };

  const todayStr = getLocalDateString(new Date());
  const todayEntry = entries.find(e => {
    return getLocalDateString(new Date(e.createdAt)) === todayStr;
  });

  const handleFabPress = () => {
    if (todayEntry) {
      router.push(`/${todayEntry.id}`);
    } else {
      router.push(`/create?date=${todayStr}`);
    }
  };

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen onLoginSuccess={(u: User) => setUser(u)} />;
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Chào buổi sáng ☀️" : hour < 18 ? "Buổi chiều vui vẻ 🌤" : "Buổi tối bình yên 🌙";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subGreeting}>Hôm nay của bạn thế nào?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nhật ký..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Calendar entries={entries} onDayPress={handleDayPress} />
      </View>

      {/* Mood Filter Bar */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedMoodFilter && styles.filterChipActive]}
            onPress={() => setSelectedMoodFilter(null)}
          >
            <Text style={[styles.filterChipText, !selectedMoodFilter && styles.filterChipTextActive]}>
              ✨ Tất cả
            </Text>
          </TouchableOpacity>
          {MOOD_LIST.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.filterChip, selectedMoodFilter === m.key && styles.filterChipActive]}
              onPress={() => setSelectedMoodFilter(selectedMoodFilter === m.key ? null : m.key)}
            >
              <Text style={[styles.filterChipText, selectedMoodFilter === m.key && styles.filterChipTextActive]}>
                {m.emoji} {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Entry list */}
      {loadingEntries ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4A90E2" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyText}>Chưa có nhật ký nào.</Text>
          <Text style={styles.emptyHint}>Bấm nút + để bắt đầu viết!</Text>
        </View>
      ) : filteredEntries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>Không tìm thấy kết quả.</Text>
          <Text style={styles.emptyHint}>Hãy thử từ khóa hoặc bộ lọc khác nhé!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DiaryCard entry={item} onPress={(id) => router.push(`/${id}`)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFabPress}
        accessibilityLabel="Viết nhật ký"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: "#f7f3ee",
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },
  subGreeting: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f0e8e8",
    marginTop: 4,
  },
  logoutText: {
    fontSize: 12,
    color: "#c0392b",
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 13,
    color: "#aaa",
    marginTop: 4,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#222",
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    fontSize: 14,
    color: "#aaa",
  },
  filterWrapper: {
    marginBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ebe6df",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: "#EAF4FF",
    borderColor: "#4A90E2",
  },
  filterChipText: {
    fontSize: 13,
    color: "#666",
  },
  filterChipTextActive: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: "#fff",
    lineHeight: 32,
  },
});
