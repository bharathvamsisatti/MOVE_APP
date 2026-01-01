import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar backgroundColor="beige" style="dark" animated />
      <Stack
        screenOptions={{ headerShown: false }}
        initialRouteName="splash"
      />
    </AuthProvider>
  );
}
