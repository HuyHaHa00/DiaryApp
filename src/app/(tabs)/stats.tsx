import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useDiary } from "../../context/DiaryContext";
import type { Mood } from "../../components/MoodSelector";

const MOOD_EMOJI: Record<Mood, string> = {
  happy: "😆",
  neutral: "🙂",
  sad: "😢",
  angry: "😡",
  tired: "😴",
};

const MOOD_COLORS: Record<Mood, string> = {
  happy: "#FFD700",
  neutral: "#4A90E2",
  sad: "#8E44AD",
  angry: "#E74C3C",
  tired: "#95A5A6",
};

const MOOD_SCORES: Record<Mood, number> = {
  happy: 5,
  neutral: 4,
  tired: 3,
  sad: 2,
  angry: 1,
};

export default function StatsScreen() {
  const { entries } = useDiary();

  // 1. Dữ liệu cho biểu đồ thanh ngang (Tần suất)
  const moodFrequency = useMemo(() => {
    const freqs: Record<Mood, number> = {
      happy: 0,
      neutral: 0,
      sad: 0,
      angry: 0,
      tired: 0,
    };
    entries.forEach((e) => {
      if (e.mood) freqs[e.mood]++;
    });
    return freqs;
  }, [entries]);

  const maxFreq = Math.max(...Object.values(moodFrequency), 1);

  // 2. Dữ liệu cho biểu đồ tiến trình theo 7 ngày gần nhất (Tuần)
  const weeklyData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tạo mảng 7 ngày gần nhất (từ quá khứ đến hiện tại)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      
      const dayName = i === 0 ? "HN" : `${d.getDate()}/${d.getMonth() + 1}`;

      // Tìm bài viết của ngày này
      const dayEntry = entries.find(e => {
        const ed = new Date(e.createdAt);
        return ed.getFullYear() === year && ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate();
      });

      data.push({
        label: dayName,
        score: dayEntry?.mood ? MOOD_SCORES[dayEntry.mood] : 0,
        emoji: dayEntry?.mood ? MOOD_EMOJI[dayEntry.mood] : "",
        color: dayEntry?.mood ? MOOD_COLORS[dayEntry.mood] : "#ebe6df",
      });
    }
    return data;
  }, [entries]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Thống kê</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Biểu đồ thanh ngang: Tần suất cảm xúc */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tần suất cảm xúc</Text>
          <Text style={styles.cardSubtitle}>Tổng số bài viết: {entries.length}</Text>
          
          <View style={styles.barChartContainer}>
            {(Object.keys(MOOD_EMOJI) as Mood[]).map((mood) => {
              const count = moodFrequency[mood];
              const percentage = (count / maxFreq) * 100;
              return (
                <View key={mood} style={styles.barRow}>
                  <Text style={styles.barEmoji}>{MOOD_EMOJI[mood]}</Text>
                  <View style={styles.barTrack}>
                    <View 
                      style={[
                        styles.barFill, 
                        { width: `${percentage}%`, backgroundColor: MOOD_COLORS[mood] }
                      ]} 
                    />
                  </View>
                  <Text style={styles.barValue}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Biểu đồ cột: Biến thiên cảm xúc 7 ngày qua */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>7 ngày gần nhất</Text>
          <Text style={styles.cardSubtitle}>Mức độ tích cực của bạn qua từng ngày</Text>
          
          <View style={styles.columnChartContainer}>
            {weeklyData.map((day, idx) => {
              // Chiều cao tối đa là 100%. Score 5 = 100%, 4 = 80%, ...
              const heightPct = (day.score / 5) * 100;
              return (
                <View key={idx} style={styles.columnWrapper}>
                  <Text style={styles.columnEmoji}>{day.emoji}</Text>
                  <View style={styles.columnTrack}>
                    <View 
                      style={[
                        styles.columnFill, 
                        { height: `${heightPct}%`, backgroundColor: day.color }
                      ]} 
                    />
                  </View>
                  <Text style={styles.columnLabel}>{day.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#888",
    marginBottom: 20,
  },
  // Horizontal Bar Chart
  barChartContainer: {
    gap: 12,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  barEmoji: {
    fontSize: 20,
    width: 32,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    marginRight: 12,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 6,
  },
  barValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    width: 24,
    textAlign: "right",
  },
  // Vertical Column Chart
  columnChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 180,
    marginTop: 10,
  },
  columnWrapper: {
    alignItems: "center",
    flex: 1,
  },
  columnEmoji: {
    fontSize: 16,
    marginBottom: 8,
    height: 20,
  },
  columnTrack: {
    width: 24,
    height: 100, // Chiều cao tối đa của cột
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    justifyContent: "flex-end",
    marginBottom: 8,
    overflow: "hidden",
  },
  columnFill: {
    width: "100%",
    borderRadius: 12,
  },
  columnLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
  },
});
