import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Safety() {
  return (
    <View style={styles.container}>
      <Ionicons name="shield-checkmark" size={60} color="#2E7D32" />
      <Text style={styles.title}>Safety Center</Text>
      <Text style={styles.subtitle}>
        Your safety is our priority. Use SOS and share trip options.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
    color: "#111",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
});
