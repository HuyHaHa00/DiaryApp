import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import ImageViewer from "./ImageViewer";
import { formatDate } from "../utils/formatDate";
import type { Mood } from "./MoodSelector";

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
  createdAt: string;
}

interface DiaryCardProps {
  entry: DiaryEntry;
  onPress: (id: string) => void;
}

export default function DiaryCard({ entry, onPress }: DiaryCardProps) {
  const [isViewerVisible, setIsViewerVisible] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const preview = entry.content.length > 80
    ? entry.content.slice(0, 80) + "…"
    : entry.content;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(entry.id)}
      activeOpacity={0.75}
    >
      <View style={styles.row}>
        <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
        {entry.mood ? (
          <Text style={styles.mood}>{MOOD_EMOJI[entry.mood]}</Text>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>{entry.title}</Text>
      <Text style={styles.preview} numberOfLines={2}>{preview}</Text>
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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
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
    color: "#aaa",
  },
  mood: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    color: "#777",
    lineHeight: 19,
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
