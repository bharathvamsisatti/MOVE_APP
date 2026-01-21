import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // ✅ Put your official MOVE social links here
  const MOVE_SOCIALS = {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    twitter: "https://twitter.com/",
  };

  const openUrl = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Error", "Cannot open this link");
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert("Error", "Something went wrong while opening the link");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/welcome");
        },
      },
    ]);
  };

  const MenuItem = ({ title, icon, onPress, danger = false }) => {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.menuItem,
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.menuLeft}>
          <Ionicons
            name={icon}
            size={20}
            color={danger ? "#E53935" : "#333"}
          />
          <Text style={[styles.menuText, danger && { color: "#E53935" }]}>
            {title}
          </Text>
        </View>

        {!danger && (
          <Ionicons name="chevron-forward" size={20} color="#777" />
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Small gap from status bar */}
      <View style={styles.topGap} />

      {/* Title */}
      <Text style={styles.title}>Profile</Text>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={30} color="#555" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.nameText}>{user?.name || "MOVE User"}</Text>
          <Text style={styles.emailText}>{user?.email || "No email"}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color="#F5A623" />
              <Text style={styles.badgeText}>4.7</Text>
            </View>

            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Edit profile */}
        <Pressable
          onPress={() => router.push("/profile/edit")}
          style={styles.editBtn}
        >
          <Ionicons name="create-outline" size={18} color="#111" />
        </Pressable>
      </View>

      {/* Menu Tabs */}
      <View style={styles.menuBox}>
        <MenuItem
          title="Profile"
          icon="person-outline"
          onPress={() => router.push("/profile/details")}
        />

        <MenuItem
          title="My Rides"
          icon="car-outline"
          onPress={() => router.push("/rides/myrides")}
        />

        <MenuItem
          title="My Offered Rides"
          icon="swap-horizontal-outline"
          onPress={() => router.push("/rides/offered")}
        />

        <MenuItem
          title="Safety"
          icon="shield-checkmark-outline"
          onPress={() => router.push("/safety")}
        />

        <MenuItem
          title="Help"
          icon="help-circle-outline"
          onPress={() => router.push("/help")}
        />
      </View>

      {/* Social Media Section */}
      <View style={styles.socialBox}>
        <Text style={styles.socialTitle}>Follow MOVE</Text>

        <View style={styles.socialRow}>
          <Pressable
            style={({ pressed }) => [
              styles.socialBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => openUrl(MOVE_SOCIALS.facebook)}
          >
            <Ionicons name="logo-facebook" size={22} color="#1877F2" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.socialBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => openUrl(MOVE_SOCIALS.instagram)}
          >
            <Ionicons name="logo-instagram" size={22} color="#E1306C" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.socialBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => openUrl(MOVE_SOCIALS.twitter)}
          >
            <Ionicons name="logo-twitter" size={22} color="#1DA1F2" />
          </Pressable>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.logoutBox}>
        <MenuItem
          title="Logout"
          icon="log-out-outline"
          danger
          onPress={handleLogout}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerText}>Made with ❤️ by MOVE Team</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 25,
  },

  // small gap between status bar and title
  topGap: {
    height: Platform.OS === "android" ? (StatusBar.currentHeight || 10) : 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    marginTop: 10,
    marginBottom: 14,
  },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
  },

  avatar: {
    height: 55,
    width: 55,
    borderRadius: 27.5,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  nameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  emailText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  badgesRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  badgeText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
  },

  editBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#F2F2F2",
  },

  menuBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
  },

  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  menuText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },

  socialBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    elevation: 2,
  },

  socialTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
  },

  socialRow: {
    flexDirection: "row",
    gap: 14,
  },

  socialBtn: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutBox: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
  },

  footer: {
    marginTop: 18,
    alignItems: "center",
  },

  footerText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
});
