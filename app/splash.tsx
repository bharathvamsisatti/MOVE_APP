import { SafeAreaView, View, Text, } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React from "react";


export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/");

    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Lottie Logo */}
        <LottieView
          source={require("../assets/lottie/Car safety edit.json")}
          autoPlay
          loop={false}
          style={{
            width: 220,
            height: 220,
          }}
        />

        {/* Brand Name */}
        <Text
          style={{
            marginTop: 16,
            fontSize: 36,
            fontWeight: "700",
            letterSpacing: 2,
            color: "#1E40AF", // primary color
          }}
        >
          MOVE
        </Text>

        {/* Optional Tagline */}
        <Text
          style={{
            marginTop: 6,
            fontSize: 14,
            color: "#6B7280",
          }}
        >
          Make Your Travel comfortable...
        </Text>
      </View>
    </SafeAreaView>
  );
}
