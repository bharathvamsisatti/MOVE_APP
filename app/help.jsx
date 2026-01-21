import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Help() {
  return (
    <View style={styles.container}>
      <Ionicons name="help-circle" size={60} color="#1976D2" />
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.subtitle}>
        Need help? Contact MOVE support or check FAQs.
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
