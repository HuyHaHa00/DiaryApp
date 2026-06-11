import React, { useState } from "react";
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
import { router } from "expo-router";
import DiaryCard from "../../components/DiaryCard";
import { useDiary } from "../../context/DiaryContext";
import type { Mood } from "../../components/MoodSelector";

const MOOD_LIST: { key: Mood; emoji: string; label: string }[] = [
  { key: "happy", emoji: "😆", label: "Vui" },
  { key: "neutral", emoji: "🙂", label: "Bình thường" },
  { key: "sad", emoji: "😢", label: "Buồn" },
  { key: "angry", emoji: "😡", label: "Tức giận" },
  { key: "tired", emoji: "😴", label: "Mệt mỏi" },
];

export default function ListScreen() {
  const { entries, loadingEntries } = useDiary();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<Mood | null>(null);

  const filteredEntries = entries.filter((entry) => {
    if (selectedMoodFilter && entry.mood !== selectedMoodFilter) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = entry.title?.toLowerCase().includes(q);
      const contentMatch = entry.content?.toLowerCase().includes(q);
      return titleMatch || contentMatch;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nhật ký của tôi</Text>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nhật ký..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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

      {loadingEntries ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4A90E2" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyText}>Chưa có nhật ký nào.</Text>
        </View>
      ) : filteredEntries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>Không tìm thấy kết quả.</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f3ee" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#222" },
  searchWrapper: { paddingHorizontal: 16, marginBottom: 8 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, height: 44, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#222", paddingVertical: 8 },
  clearBtn: { padding: 6 },
  clearBtnText: { fontSize: 14, color: "#aaa" },
  filterWrapper: { marginBottom: 12 },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 4, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#ebe6df" },
  filterChipActive: { backgroundColor: "#EAF4FF", borderColor: "#4A90E2" },
  filterChipText: { fontSize: 13, color: "#666" },
  filterChipTextActive: { color: "#4A90E2", fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#666", fontWeight: "600" },
});
