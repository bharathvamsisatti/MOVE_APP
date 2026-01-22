import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import LottieView from "lottie-react-native";
import { useRouter } from "expo-router";

export default function BookingSuccess() {
  const router = useRouter();
  const [quote, setQuote] = useState<string>("");

  // fetch random quote
  const loadQuote = async () => {
    try {
      const res = await fetch("https://api.quotable.io/random");
      const data = await res.json();
      setQuote(`${data.content} — ${data.author}`);
    } catch (e) {
      console.log("Quote error:", e);
      setQuote("Have a great journey! 🚗✨");
    }
  };

  useEffect(() => {
    loadQuote();
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require("../assets/lottie/Confirm.json")}
        autoPlay
        loop={false}
        style={styles.lottie}
      />

      <Text style={styles.title}>Booking Successful! 🎉</Text>

      <Text style={styles.message}>
        Your ride has been booked successfully.
      </Text>

      <Text style={styles.quote}>{quote}</Text>

      <Pressable style={styles.homeBtn} onPress={() => router.replace("/home")}>
        <Text style={styles.homeTxt}>Back to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: 300,
    height: 300,
  },
  title: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    color: "#444",
    textAlign: "center",
  },
  quote: {
    marginTop: 16,
    fontSize: 14,
    fontStyle: "italic",
    color: "#555",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  homeBtn: {
    marginTop: 28,
    backgroundColor: "#1E40AF",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  homeTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
