import { Tabs, router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4A90E2",
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#ebe6df",
          backgroundColor: "#fff",
          elevation: 0,
          height: 74,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Lịch",
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📅</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: "Nhật ký",
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📖</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="action"
        options={{
          title: "",
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.8}
              onPress={(e) => {
                // Prevent default tab behavior just in case
                if (e && e.preventDefault) e.preventDefault();
                const d = new Date();
                const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                router.push(`/create?date=${todayStr}`);
              }}
              style={[props.style, styles.centerButtonWrapper]}
            >
              <View style={styles.centerButton}>
                <Text style={styles.centerButtonIcon}>+</Text>
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Thống kê",
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButtonWrapper: {
    top: -24, // Làm nút nhô cao lên
    justifyContent: "center",
    alignItems: "center",
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  centerButtonIcon: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 36,
  },
});
