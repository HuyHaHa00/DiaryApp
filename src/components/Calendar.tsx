import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { DiaryEntry } from "./DiaryCard";
import type { Mood } from "./MoodSelector";

const MOOD_EMOJI: Record<Mood, string> = {
  happy: "😆",
  neutral: "🙂",
  sad: "😢",
  angry: "😡",
  tired: "😴",
};

const WEEK_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

interface CalendarProps {
  entries: DiaryEntry[];
  onDayPress: (dateString: string, existingEntryId?: string) => void;
}

// Helper: Lấy chuỗi YYYY-MM-DD theo giờ địa phương
const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Calendar({ entries, onDayPress }: CalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentYear === today.getFullYear() && currentMonth === today.getMonth()) {
      return; // Khóa không cho sang tháng tương lai
    }
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysGrid = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Chủ nhật

    const grid: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(new Date(currentYear, currentMonth, i));
    }
    return grid;
  }, [currentYear, currentMonth]);

  // Gom nhóm bài viết theo ngày để tra cứu nhanh
  const entriesByDate = useMemo(() => {
    const map: Record<string, DiaryEntry> = {};
    entries.forEach((e) => {
      const d = new Date(e.createdAt);
      const ds = getLocalDateString(d);
      // Giữ bài mới nhất nếu có nhiều bài trùng ngày (phòng trường hợp cũ)
      if (!map[ds]) {
        map[ds] = e;
      }
    });
    return map;
  }, [entries]);

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
          <Text style={styles.monthNavText}>{"<"}</Text>
        </TouchableOpacity>

        <Text style={styles.monthTitle}>
          {monthNames[currentMonth]} {currentYear}
        </Text>

        <TouchableOpacity 
          onPress={handleNextMonth} 
          style={styles.monthNavBtn}
          disabled={currentYear === today.getFullYear() && currentMonth === today.getMonth()}
        >
          <Text style={[styles.monthNavText, currentYear === today.getFullYear() && currentMonth === today.getMonth() && styles.monthNavTextDisabled]}>
            {">"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEK_DAYS.map((day, idx) => (
          <Text key={idx} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {daysGrid.map((dateObj, index) => {
          if (!dateObj) {
            return <View key={index} style={styles.dayCell} />;
          }

          const dateStr = getLocalDateString(dateObj);
          const isToday = dateStr === getLocalDateString(today);
          const entry = entriesByDate[dateStr];
          const isFuture = dateObj > today && !isToday;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
                entry && styles.hasEntryCell
              ]}
              disabled={isFuture}
              onPress={() => onDayPress(dateStr, entry?.id)}
            >
              <Text
                style={[
                  styles.dateNumber,
                  isToday && styles.todayText,
                  isFuture && styles.futureText,
                  entry && styles.dateNumberWithEntry
                ]}
              >
                {dateObj.getDate()}
              </Text>
              
              {entry && entry.mood ? (
                <Text style={styles.emojiText}>{MOOD_EMOJI[entry.mood]}</Text>
              ) : (
                <View style={styles.emptyEmojiSpace} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  monthNavBtn: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  monthNavText: {
    fontSize: 18,
    color: "#4A90E2",
    fontWeight: "bold",
  },
  monthNavTextDisabled: {
    color: "#ccc",
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#aaa",
    fontWeight: "600",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%", // 100% / 7
    height: 48, // Chiều cao cố định gọn gàng hơn
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayCell: {
    backgroundColor: "#f0f7ff",
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  hasEntryCell: {
    backgroundColor: "#fafafa",
  },
  dateNumber: {
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
    marginBottom: 2,
  },
  dateNumberWithEntry: {
    fontSize: 10, // Nhỏ hơn nếu có emoji
    color: "#888",
    marginBottom: -2,
  },
  todayText: {
    color: "#4A90E2",
    fontWeight: "700",
  },
  futureText: {
    color: "#ccc",
  },
  emojiText: {
    fontSize: 18,
    lineHeight: 22,
  },
  emptyEmojiSpace: {
    height: 22,
  },
});
