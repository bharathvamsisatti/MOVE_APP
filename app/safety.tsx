import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Safety() {
  const router = useRouter();

  const [sosEnabled, setSosEnabled] = useState(false);

  const showHowSOSWorks = () => {
    Alert.alert(
      "How SOS Works",
      "✅ Turn ON SOS from this page.\n\n" +
        "🚨 When SOS is ACTIVE:\n" +
        "• Tap the SOS button 3 times quickly\n" +
        "• MOVE will mark you as Emergency\n" +
        "• Your trusted contacts will be notified (future update)\n\n" +
        "⚠️ Use SOS only in real emergency situations."
    );
  };

  const confirmToggle = (nextValue: boolean) => {
    if (nextValue) {
      Alert.alert("Enable SOS", "Do you want to activate SOS mode?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Enable",
          style: "default",
          onPress: () => setSosEnabled(true),
        },
      ]);
    } else {
      Alert.alert("Disable SOS", "Do you want to deactivate SOS mode?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: () => setSosEnabled(false),
        },
      ]);
    }
  };

  const handleSOSPress = () => {
    if (!sosEnabled) {
      Alert.alert("SOS is OFF", "Please enable SOS mode first.");
      return;
    }

    Alert.alert(
      "SOS Trigger",
      "⚠️ This is a demo.\n\nIn real app:\nTap SOS button 3 times quickly to trigger emergency mode."
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={20} color="#111" />
        </Pressable>

        <Text style={styles.headerTitle}>Safety</Text>

        <View style={{ width: 38 }} />
      </View>

      {/* Intro Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="shield-checkmark-outline" size={26} color="#111" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>MOVE feels safety of their folks</Text>
          <Text style={styles.heroText}>
            Your safety matters. SOS feature helps you quickly react during
            emergencies.
          </Text>
        </View>
      </View>

      {/* SOS Card */}
      <View style={styles.sosCard}>
        {/* Top row */}
        <View style={styles.sosTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sosTitle}>SOS</Text>
            <Text style={styles.sosSubtitle}>
              Activate SOS mode for emergency support
            </Text>
          </View>

          <Pressable onPress={showHowSOSWorks} style={styles.infoBtn}>
            <Ionicons name="help-circle-outline" size={22} color="#111" />
          </Pressable>
        </View>

        {/* Status row */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              sosEnabled ? styles.activeBadge : styles.offBadge,
            ]}
          >
            <Ionicons
              name={sosEnabled ? "checkmark-circle" : "close-circle"}
              size={14}
              color={sosEnabled ? "#2E7D32" : "#E53935"}
            />
            <Text
              style={[
                styles.statusText,
                { color: sosEnabled ? "#2E7D32" : "#E53935" },
              ]}
            >
              {sosEnabled ? "ACTIVE" : "OFF"}
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>
              {sosEnabled ? "Deactivate" : "Activate"}
            </Text>

            <Switch
              value={sosEnabled}
              onValueChange={(val) => confirmToggle(val)}
            />
          </View>
        </View>

        {/* SOS Button */}
        <Pressable
          onPress={handleSOSPress}
          style={({ pressed }) => [
            styles.sosButton,
            pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
            !sosEnabled && { backgroundColor: "#999" },
          ]}
        >
          <Ionicons name="warning-outline" size={22} color="#fff" />
          <Text style={styles.sosBtnText}>SOS</Text>
        </Pressable>

        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Ionicons name="information-circle-outline" size={18} color="#444" />
          <Text style={styles.instructionsText}>
            {sosEnabled
              ? "SOS is active. Tap the SOS button 3 times quickly to trigger emergency mode."
              : "Enable SOS to use emergency features."}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Stay safe with MOVE 💙</Text>
        <Text style={styles.footerSubText}>
          SOS feature is in demo mode for now
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7F7" },

  container: {
    padding: 16,
    paddingBottom: 30,
  },

  header: {
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBtn: {
    height: 38,
    width: 38,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },

  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 2,
    marginBottom: 14,
  },

  heroIcon: {
    height: 52,
    width: 52,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  heroTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111",
  },

  heroText: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  sosCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    elevation: 2,
  },

  sosTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sosTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },

  sosSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  infoBtn: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  statusRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },

  activeBadge: {
    backgroundColor: "#E8F5E9",
  },

  offBadge: {
    backgroundColor: "#FFEBEE",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "900",
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  toggleText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
  },

  sosButton: {
    marginTop: 16,
    backgroundColor: "#E53935",
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  sosBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },

  instructionsBox: {
    marginTop: 14,
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  instructionsText: {
    color: "#555",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  footer: {
    marginTop: 16,
    alignItems: "center",
  },

  footerText: {
    fontSize: 13,
    color: "#444",
    fontWeight: "800",
  },

  footerSubText: {
    marginTop: 4,
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
});
