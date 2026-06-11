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
import { useTheme } from "../../context/ThemeContext";
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
  const { colors } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Nhật ký của tôi</Text>
      </View>

      <View style={styles.searchWrapper}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm kiếm nhật ký..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedMoodFilter ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setSelectedMoodFilter(null)}
          >
            <Text style={[styles.filterChipText, !selectedMoodFilter ? { color: "#fff" } : { color: colors.text }]}>
              ✨ Tất cả
            </Text>
          </TouchableOpacity>
          {MOOD_LIST.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.filterChip, selectedMoodFilter === m.key ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setSelectedMoodFilter(selectedMoodFilter === m.key ? null : m.key)}
            >
              <Text style={[styles.filterChipText, selectedMoodFilter === m.key ? { color: "#fff" } : { color: colors.text }]}>
                {m.emoji} {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loadingEntries ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có nhật ký nào.</Text>
        </View>
      ) : filteredEntries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Không tìm thấy kết quả.</Text>
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
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold" },
  searchWrapper: { paddingHorizontal: 16, marginBottom: 8 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  clearBtn: { padding: 6 },
  clearBtnText: { fontSize: 14 },
  filterWrapper: { marginBottom: 12 },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 4, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#666", fontWeight: "600" },
});
