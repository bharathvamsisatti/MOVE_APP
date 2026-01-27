import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();

        // simulate loading / auth restore / assets
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setReady(true);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.log("Splash error:", e);
      }
    };

    prepare();
  }, []);

  if (!ready) return null; // ✅ keeps splash visible

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
