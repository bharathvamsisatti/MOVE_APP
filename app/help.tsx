import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Help() {
  const router = useRouter();

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Error", "Cannot open this link");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Something went wrong while opening the link");
    }
  };

  const HelpItem = ({
    title,
    subtitle,
    icon,
    onPress,
  }: {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }) => {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.item,
          pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] },
        ]}
      >
        <View style={styles.itemLeft}>
          <View style={styles.iconBox}>
            <Ionicons name={icon} size={18} color="#111" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{title}</Text>
            <Text style={styles.itemSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#777" />
      </Pressable>
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

        <Text style={styles.headerTitle}>Help</Text>

        <View style={{ width: 38 }} />
      </View>

      {/* Top Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="help-circle-outline" size={26} color="#111" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Need help with MOVE?</Text>
          <Text style={styles.heroText}>
            Find answers, contact support, or report issues quickly.
          </Text>
        </View>
      </View>

      {/* FAQ / Actions */}
      <View style={styles.box}>
        <Text style={styles.sectionTitle}>Quick Help</Text>

        <HelpItem
          title="How to book a ride?"
          subtitle="Search, choose a ride, confirm booking"
          icon="ticket-outline"
          onPress={() =>
            Alert.alert(
              "How to book a ride?",
              "1) Go to Search\n2) Enter Departure & Destination\n3) Select date (optional)\n4) Choose ride\n5) Book seats and confirm"
            )
          }
        />

        <HelpItem
          title="How to offer a ride?"
          subtitle="Create ride details and publish"
          icon="car-outline"
          onPress={() =>
            Alert.alert(
              "How to offer a ride?",
              "1) Go to Offer Ride\n2) Fill route, date, time, seats, price\n3) Submit\n4) Your ride will appear in Offered Rides"
            )
          }
        />

        <HelpItem
          title="Payment / pricing issue"
          subtitle="Check seat price and final price"
          icon="card-outline"
          onPress={() =>
            Alert.alert(
              "Payment / pricing issue",
              "If price looks wrong, please verify:\n• Seat count\n• Price per seat\n• Final price\nIf issue continues, contact support."
            )
          }
        />

        <HelpItem
          title="Report a problem"
          subtitle="Send details to MOVE team"
          icon="alert-circle-outline"
          onPress={() =>
            openLink(
              "mailto:support@MOVE.com?subject=MOVE%20App%20Support&body=Hi%20MOVE%20Team,%0A%0APlease%20describe%20your%20issue%20here..."
            )
          }
        />
      </View>

      {/* Contact */}
      <View style={styles.box}>
        <Text style={styles.sectionTitle}>Contact</Text>

        <HelpItem
          title="Email Support"
          subtitle="support@MOVE.com"
          icon="mail-outline"
          onPress={() => openLink("mailto:support@MOVE.com")}
        />

        <HelpItem
          title="Call Support"
          subtitle="+91 90000 00000"
          icon="call-outline"
          onPress={() => openLink("tel:+919000000000")}
        />

        <HelpItem
          title="WhatsApp Support"
          subtitle="Chat with MOVE team"
          icon="logo-whatsapp"
          onPress={() => openLink("https://wa.me/919000000000")}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>We’re here to help 💙</Text>
        <Text style={styles.footerSubText}>MOVE Support • 24/7</Text>
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
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
  },

  heroText: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  box: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    elevation: 2,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111",
    marginBottom: 8,
    marginLeft: 4,
  },

  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  iconBox: {
    height: 38,
    width: 38,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  itemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },

  itemSubtitle: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginTop: 2,
  },

  footer: {
    marginTop: 10,
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
