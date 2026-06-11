import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { DiaryProvider, useDiary } from "../context/DiaryContext";
import AuthScreen from "../screens/AuthScreen";

function RootStack() {
  const { user, loadingAuth } = useDiary();

  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f3ee" }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen onLoginSuccess={() => {}} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  if (Platform.OS === "web") {
    return (
      <DiaryProvider>
        <View style={styles.webOuter}>
          <View style={styles.phoneFrame}>
            <RootStack />
          </View>
        </View>
      </DiaryProvider>
    );
  }
  return (
    <DiaryProvider>
      <RootStack />
    </DiaryProvider>
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
