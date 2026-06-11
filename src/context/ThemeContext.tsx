import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

export const lightTheme = {
  background: "#f7f3ee",
  surface: "#fff",
  text: "#222",
  textSecondary: "#888",
  primary: "#4A90E2",
  border: "#ebe6df",
  danger: "#E74C3C",
  dangerBg: "#FFE5E5",
  success: "#2ECC71",
  successBg: "#E8F8F5",
  cardShadow: "rgba(0,0,0,0.05)",
};

export const darkTheme = {
  background: "#121212",
  surface: "#1E1E1E",
  text: "#E0E0E0",
  textSecondary: "#A0A0A0",
  primary: "#4A90E2", // Giữ nguyên màu xanh biển
  border: "#333",
  danger: "#CF6679",
  dangerBg: "#3B1E1E",
  success: "#81C784",
  successBg: "#1E3B24",
  cardShadow: "rgba(0,0,0,0.5)",
};

export type ThemeColors = typeof lightTheme;

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "system",
  setMode: () => {},
  colors: lightTheme,
  isDark: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem("@theme_mode").then((saved) => {
      if (saved) setModeState(saved as ThemeMode);
    });
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem("@theme_mode", newMode);
  };

  const isDark = mode === "dark" || (mode === "system" && systemColorScheme === "dark");
  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
