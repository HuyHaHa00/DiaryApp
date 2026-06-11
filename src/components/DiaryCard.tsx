import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import ImageViewer from "./ImageViewer";
import { formatDate } from "../utils/formatDate";
import type { Mood } from "./MoodSelector";
import { useTheme } from "../context/ThemeContext";

const MOOD_EMOJI: Record<Mood, string> = {
  happy: "😆",
  neutral: "🙂",
  sad: "😢",
  angry: "😡",
  tired: "😴",
};

export interface ImageItem {
  id: string;
  uri: string;
  status: 'uploading' | 'done' | 'error';
  url?: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood: Mood | null;
  images?: ImageItem[];
  tags?: string[];
  createdAt: string;
}

interface DiaryCardProps {
  entry: DiaryEntry;
  onPress: (id: string) => void;
}

export default function DiaryCard({ entry, onPress }: DiaryCardProps) {
  const { colors } = useTheme();
  const [isViewerVisible, setIsViewerVisible] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const preview = entry.content.length > 80
    ? entry.content.slice(0, 80) + "…"
    : entry.content;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}
      onPress={() => onPress(entry.id)}
      activeOpacity={0.75}
    >
      <View style={styles.row}>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(entry.createdAt)}</Text>
        {entry.mood ? (
          <Text style={styles.mood}>{MOOD_EMOJI[entry.mood]}</Text>
        ) : null}
      </View>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{entry.title}</Text>
      <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={2}>{preview}</Text>
      
      {entry.tags && entry.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {entry.tags.map(t => (
            <View key={t} style={[styles.tagBadge, { backgroundColor: colors.primary + "1A" }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>#{t}</Text>
            </View>
          ))}
        </View>
      )}

      {entry.images && entry.images.length > 0 && (
        <View style={styles.imageRow}>
          {entry.images.slice(0, 3).map((img, index) => (
            <TouchableOpacity
              key={img.id}
              activeOpacity={0.8}
              onPress={() => {
                setCurrentImageIndex(index);
                setIsViewerVisible(true);
              }}
            >
              <Image
                source={{ uri: img.url || img.uri }}
                style={styles.thumbnail}
              />
            </TouchableOpacity>
          ))}
          <ImageViewer
            images={entry.images.map(img => ({ uri: img.url || img.uri }))}
            imageIndex={currentImageIndex}
            visible={isViewerVisible}
            onRequestClose={() => setIsViewerVisible(false)}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
  },
  mood: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    lineHeight: 19,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  imageRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
});
