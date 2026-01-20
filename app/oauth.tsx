import { View, ActivityIndicator, Text } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import * as Linking from "expo-linking";

export default function OAuthCallback() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const handleOAuth = async () => {
      try {
        // Parse deep link URL
        const url = await Linking.getInitialURL();

        if (!url) {
          router.replace("/login");
          return;
        }

        const parsed = Linking.parse(url);
        const token = parsed.queryParams?.token as string | undefined;

        if (!token) {
          router.replace("/login");
          return;
        }

        // Save token (OAuth = auto-login)
        await login(token, { provider: "GOOGLE" });

        // Go through index gate
        router.replace("/");
      } catch (e) {
        router.replace("/login");
      }
    };

    handleOAuth();
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
