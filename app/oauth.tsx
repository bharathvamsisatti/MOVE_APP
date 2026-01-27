import { View, ActivityIndicator, Text } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import * as Linking from "expo-linking";

export default function OAuthCallback() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      try {
        const parsed = Linking.parse(url);
        const token = parsed.queryParams?.token as string | undefined;

        if (!token) {
          router.replace("/login");
          return;
        }

        await login(token, { provider: "GOOGLE" });

        // go through auth gate
        router.replace("/");
      } catch (e) {
        router.replace("/login");
      }
    };

    // ✅ 1) when app opens from cold start
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // ✅ 2) when app is already open (MOST IMPORTANT)
    const sub = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => sub.remove();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <ActivityIndicator size="large" color="#1E40AF" />
      <Text style={{ marginTop: 12, color: "#6B7280" }}>
        Signing you in with Google…
      </Text>
    </View>
  );
}
