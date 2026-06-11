import { Tabs } from "expo-router";
import React from "react";
import { Text } from "react-native";

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
        name="stats"
        options={{
          title: "Thống kê",
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📊</Text>
          ),
        }}
      />
    </Tabs>
  );
}
