import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// ⛔ Prevent splash from auto hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const prepare = async () => {
      // simulate loading / auth restore / assets
      await new Promise(resolve => setTimeout(resolve, 1500));

      // ✅ hide splash AFTER app is ready
      await SplashScreen.hideAsync();
    };

    prepare();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
