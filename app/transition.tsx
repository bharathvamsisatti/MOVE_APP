import { View, Text, ActivityIndicator,StatusBar } from "react-native";
import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function Transition() {
  const router = useRouter();
  const { next } = useLocalSearchParams();

  useEffect(() => {
  const timer = setTimeout(() => {
    if (typeof next === "string") {
      router.replace(next);
    } else {
      router.replace("/home-guest");
    }
  }, 900);

  return () => clearTimeout(timer);
}, [next]);


  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#1E40AF",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>
        MOVE
      </Text>

      <ActivityIndicator
        size="large"
        color="#ffffff"
        style={{ marginTop: 20 }}
      />
      
    </View>
  );
}
