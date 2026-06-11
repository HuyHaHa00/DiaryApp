import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { DiaryProvider, useDiary } from "../context/DiaryContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import AuthScreen from "../screens/AuthScreen";

function RootStack() {
  const { user, loadingAuth } = useDiary();
  const { colors } = useTheme();

  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen onLoginSuccess={() => {}} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const { width } = useWindowDimensions();
  // Nếu là Web và màn hình đủ lớn (trên máy tính) thì bọc trong khung điện thoại giả lập
  const isDesktopWeb = Platform.OS === "web" && width > 768;

  if (isDesktopWeb) {
    return (
      <ThemeProvider>
        <DiaryProvider>
          <View style={styles.webOuter}>
            <View style={styles.phoneFrame}>
              <RootStack />
            </View>
          </View>
        </DiaryProvider>
      </ThemeProvider>
    );
  }

  // Trên Mobile App hoặc Mobile Web: Render tràn viền mượt mà
  return (
    <ThemeProvider>
      <DiaryProvider>
        <ThemeWrapper />
      </DiaryProvider>
    </ThemeProvider>
  );
}

// Bọc thêm 1 component trung gian để lấy màu nền (nếu ko thì flex 1 backgroundColor cố định)
function ThemeWrapper() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  
  return (
    <View 
      style={{ 
        height: Platform.OS === "web" ? height : "100%", 
        flex: Platform.OS === "web" ? undefined : 1,
        backgroundColor: colors.background,
        overflow: "hidden" 
      }}
    >
      <RootStack />
    </View>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: "#dce8f5",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh" as any,
    padding: 24,
  },
  phoneFrame: {
    width: "100%",
    maxWidth: 390,
    height: "100%",
    maxHeight: 844,
    backgroundColor: "#f7f3ee",
    borderRadius: 40,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
  },
});
