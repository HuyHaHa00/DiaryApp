import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type Mood = "happy" | "neutral" | "sad" | "angry" | "tired";

const MOODS: { key: Mood; emoji: string; label: string }[] = [
  { key: "happy", emoji: "😆", label: "Vui" },
  { key: "neutral", emoji: "🙂", label: "Bình thường" },
  { key: "sad", emoji: "😢", label: "Buồn" },
  { key: "angry", emoji: "😡", label: "Tức giận" },
  { key: "tired", emoji: "😴", label: "Mệt mỏi" },
];

interface MoodSelectorProps {
  selected: Mood | null;
  onChange: (mood: Mood) => void;
}

export default function MoodSelector({ selected, onChange }: MoodSelectorProps) {
  return (
    <View style={styles.container}>
      {MOODS.map((m) => (
        <TouchableOpacity
          key={m.key}
          style={[styles.item, selected === m.key && styles.itemSelected]}
          onPress={() => onChange(m.key)}
          accessibilityLabel={m.label}
        >
          <Text style={styles.emoji}>{m.emoji}</Text>
          <Text style={[styles.label, selected === m.key && styles.labelSelected]}>
            {m.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  item: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
  },
  itemSelected: {
    backgroundColor: "#EAF4FF",
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    color: "#999",
  },
  labelSelected: {
    color: "#4A90E2",
    fontWeight: "600",
  },
});
