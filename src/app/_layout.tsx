import { Stack } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export default function RootLayout() {
  if (Platform.OS === "web") {
    return (
      <View style={styles.webOuter}>
        <View style={styles.phoneFrame}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false }} />;
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
