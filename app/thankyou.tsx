import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import { useRouter } from "expo-router";

export default function ThankYouScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/home");
    }, 2500);

    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require("../assets/lottie/Congratulations.json")}
        autoPlay
        loop={false}
        style={{ width: 250, height: 250 }}
      />

      <Text style={styles.title}>Thank you 💙</Text>

      <Text style={styles.subtitle}>
        Thank you once again for making your{" "}
        <Text style={styles.bold}>vacant seats</Text> someone’s destination.
      </Text>

      <Text style={styles.team}>— Team MOVE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 20,
    color: "#111827",
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  bold: {
    fontWeight: "800",
    color: "#16A34A",
  },
  team: {
    marginTop: 14,
    fontSize: 14,
    color: "#6B7280",
  },
});
