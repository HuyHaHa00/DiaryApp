import React, { useEffect, useState } from "react";
import { ImageBackground, Modal, StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Calendar from "../../components/Calendar";
import { useDiary } from "../../context/DiaryContext";
import { useTheme } from "../../context/ThemeContext";

const FORTUNE_QUOTES = [
  "Hôm nay là một ngày tuyệt vời để bắt đầu những điều mới mẻ!",
  "Đừng đếm những gì bạn đã mất, hãy trân trọng những gì bạn đang có.",
  "Mọi nỗ lực của bạn hôm nay sẽ nở hoa vào ngày mai.",
  "Bạn dũng cảm hơn bạn tưởng, mạnh mẽ hơn bạn nghĩ.",
  "Một nụ cười có thể thay đổi cả một ngày của bạn.",
  "Khó khăn rồi cũng sẽ qua, giống như cơn mưa ngoài cửa sổ.",
  "Vũ trụ luôn có cách an bài tốt nhất dành cho bạn.",
  "Hãy yêu thương bản thân trước khi yêu thương người khác.",
  "Mỗi bước đi nhỏ đều đưa bạn đến gần hơn với mục tiêu.",
  "Hạnh phúc không phải là đích đến, mà là hành trình.",
  "Hãy sống như thể hôm nay là ngày cuối cùng của bạn.",
  "Phép màu luôn xảy ra với những người không ngừng tin tưởng."
];

export default function CalendarScreen() {
  const { entries } = useDiary();
  const { colors } = useTheme();
  const [todayQuote, setTodayQuote] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const checkFortune = async () => {
      try {
        const lastDate = await AsyncStorage.getItem("@fortune_date");
        const todayStr = new Date().toDateString();
        if (lastDate === todayStr) {
          const savedQuote = await AsyncStorage.getItem("@fortune_quote");
          if (savedQuote) setTodayQuote(savedQuote);
        }
      } catch (e) {}
    };
    checkFortune();
  }, []);

  const openCookie = async () => {
    if (todayQuote) {
      openModal();
      return;
    }
    const randomQuote = FORTUNE_QUOTES[Math.floor(Math.random() * FORTUNE_QUOTES.length)];
    setTodayQuote(randomQuote);
    openModal();
    try {
      const todayStr = new Date().toDateString();
      await AsyncStorage.setItem("@fortune_date", todayStr);
      await AsyncStorage.setItem("@fortune_quote", randomQuote);
    } catch (e) {}
  };

  const openModal = () => {
    setShowModal(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
      scaleAnim.setValue(0.8);
    });
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

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Chào buổi sáng ☀️" : hour < 18 ? "Buổi chiều vui vẻ 🌤" : "Buổi tối bình yên 🌙";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
          <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>Hôm nay của bạn thế nào?</Text>
        </View>
      </View>

      {/* Tương tác Bánh quy tiên đoán */}
      <View style={styles.fortuneWrapper}>
        <TouchableOpacity 
          style={[styles.fortuneCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]} 
          activeOpacity={0.8}
          onPress={openCookie}
        >
          <View style={[styles.fortuneIconBox, { backgroundColor: colors.primary + "1A" }]}>
            <Text style={styles.fortuneIcon}>🥠</Text>
          </View>
          <View style={styles.fortuneTextContent}>
            <Text style={[styles.fortuneTitle, { color: colors.text }]}>
              {todayQuote ? "Thông điệp vũ trụ của bạn" : "Bánh quy tiên đoán"}
            </Text>
            <Text style={[styles.fortuneSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {todayQuote ? todayQuote : "Bấm vào để xem vũ trụ muốn nhắn nhủ điều gì hôm nay!"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <Calendar entries={entries} onDayPress={handleDayPress} />
      </View>

      {/* Modal Popup Bánh Quy */}
      <Modal visible={showModal} transparent animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }], shadowColor: colors.cardShadow }]}>
            <ImageBackground 
              source={{ uri: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600&auto=format&fit=crop" }}
              style={styles.modalBg}
              imageStyle={{ borderRadius: 24 }}
            >
              <View style={[styles.modalInner, { backgroundColor: colors.mode === "dark" ? "rgba(30,30,30,0.85)" : "rgba(255,255,255,0.85)" }]}>
                <Text style={styles.modalEmoji}>🌟</Text>
                <Text style={[styles.modalQuoteText, { color: colors.primary }]}>{todayQuote}</Text>
                
                <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.primary }]} onPress={closeModal}>
                  <Text style={styles.modalCloseText}>Tuyệt vời!</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </Animated.View>
        </Animated.View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 0,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
  },
  subGreeting: {
    fontSize: 13,
    marginTop: 2,
  },
  fortuneWrapper: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  fortuneCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  fortuneIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  fortuneIcon: {
    fontSize: 24,
  },
  fortuneTextContent: {
    flex: 1,
  },
  fortuneTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  fortuneSubtitle: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 24,
    elevation: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  modalBg: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  modalInner: {
    flex: 1,
    borderRadius: 24,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalQuoteText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 28,
    fontStyle: "italic",
    marginBottom: 24,
  },
  modalCloseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalCloseText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
